import { describe, expect, it } from 'vitest'
import {
  evaluateQuota,
  parseQuotaConfig,
  type QuotaConfig,
  type QuotaSnapshot,
} from './quota'

const baseSnap = (over: Partial<QuotaSnapshot> = {}): QuotaSnapshot => ({
  deviceId: 'dev-a',
  knownDevice: false,
  deviceCount: 0,
  userJobsLastDay: 0,
  userJobsLastMinute: 0,
  globalJobsLastMinute: 0,
  ...over,
})

const baseConfig = (over: Partial<QuotaConfig> = {}): QuotaConfig => ({
  maxUsers: 20,
  allowDeviceIds: [],
  perUserPerDay: 50,
  perUserPerMinute: 20,
  globalPerMinute: 60,
  ...over,
})

describe('parseQuotaConfig', () => {
  it('uses defaults', () => {
    expect(parseQuotaConfig({})).toEqual(baseConfig())
  })

  it('parses allow list and zeros', () => {
    expect(
      parseQuotaConfig({
        AI_QUOTA_MAX_USERS: '0',
        AI_QUOTA_ALLOW_DEVICE_IDS: ' a , b ',
        AI_QUOTA_PER_USER_PER_DAY: '10',
        AI_QUOTA_PER_USER_PER_MINUTE: '0',
        AI_QUOTA_GLOBAL_PER_MINUTE: '5',
      }),
    ).toEqual({
      maxUsers: 0,
      allowDeviceIds: ['a', 'b'],
      perUserPerDay: 10,
      perUserPerMinute: 0,
      globalPerMinute: 5,
    })
  })
})

describe('evaluateQuota', () => {
  it('rejects unknown device when allow list is set', () => {
    expect(
      evaluateQuota(
        baseConfig({ allowDeviceIds: ['only'] }),
        baseSnap({ deviceId: 'other' }),
      ),
    ).toBe('quota_users')
  })

  it('allows listed device even when seats full', () => {
    expect(
      evaluateQuota(
        baseConfig({ allowDeviceIds: ['dev-a'], maxUsers: 1 }),
        baseSnap({ deviceCount: 99, knownDevice: false }),
      ),
    ).toBe('ok')
  })

  it('rejects new device when maxUsers reached', () => {
    expect(
      evaluateQuota(
        baseConfig({ maxUsers: 2 }),
        baseSnap({ deviceCount: 2, knownDevice: false }),
      ),
    ).toBe('quota_users')
  })

  it('allows known device when seats full', () => {
    expect(
      evaluateQuota(
        baseConfig({ maxUsers: 2 }),
        baseSnap({ deviceCount: 2, knownDevice: true }),
      ),
    ).toBe('ok')
  })

  it('enforces daily limit', () => {
    expect(
      evaluateQuota(
        baseConfig({ perUserPerDay: 3 }),
        baseSnap({ userJobsLastDay: 3 }),
      ),
    ).toBe('quota_daily')
  })

  it('enforces per-user minute limit', () => {
    expect(
      evaluateQuota(
        baseConfig({ perUserPerMinute: 2 }),
        baseSnap({ userJobsLastMinute: 2 }),
      ),
    ).toBe('rate_limited')
  })

  it('enforces global minute limit', () => {
    expect(
      evaluateQuota(
        baseConfig({ globalPerMinute: 5 }),
        baseSnap({ globalJobsLastMinute: 5 }),
      ),
    ).toBe('rate_limited')
  })

  it('allows everything when limits are zero', () => {
    expect(
      evaluateQuota(
        baseConfig({
          maxUsers: 0,
          perUserPerDay: 0,
          perUserPerMinute: 0,
          globalPerMinute: 0,
        }),
        baseSnap({
          deviceCount: 999,
          userJobsLastDay: 999,
          userJobsLastMinute: 999,
          globalJobsLastMinute: 999,
        }),
      ),
    ).toBe('ok')
  })
})
