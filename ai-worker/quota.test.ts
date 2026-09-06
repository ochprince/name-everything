import { describe, expect, it } from 'vitest'
import {
  evaluateQuota,
  parseAllowDeviceIdsValue,
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

describe('parseAllowDeviceIdsValue', () => {
  it('parses a json string array', () => {
    expect(parseAllowDeviceIdsValue([' a ', 'b', ''])).toEqual(['a', 'b'])
  })

  it('returns empty for non-arrays', () => {
    expect(parseAllowDeviceIdsValue(null)).toEqual([])
    expect(parseAllowDeviceIdsValue({ x: 1 })).toEqual([])
    expect(parseAllowDeviceIdsValue('nope')).toEqual([])
  })
})

describe('parseQuotaConfig', () => {
  it('uses defaults without env allow list', () => {
    expect(parseQuotaConfig({})).toEqual(baseConfig())
  })

  it('parses numeric quotas and ignores env allow list', () => {
    expect(
      parseQuotaConfig({
        AI_QUOTA_MAX_USERS: '0',
        AI_QUOTA_ALLOW_DEVICE_IDS: 'a,b',
        AI_QUOTA_PER_USER_PER_DAY: '10',
        AI_QUOTA_PER_USER_PER_MINUTE: '0',
        AI_QUOTA_GLOBAL_PER_MINUTE: '5',
      }),
    ).toEqual({
      maxUsers: 0,
      allowDeviceIds: [],
      perUserPerDay: 10,
      perUserPerMinute: 0,
      globalPerMinute: 5,
    })
  })
})

describe('evaluateQuota', () => {
  it('rejects everyone when allow list is empty', () => {
    expect(evaluateQuota(baseConfig(), baseSnap())).toBe('quota_users')
  })

  it('rejects unknown device when allow list is set', () => {
    expect(
      evaluateQuota(
        baseConfig({ allowDeviceIds: ['only'] }),
        baseSnap({ deviceId: 'other' }),
      ),
    ).toBe('quota_users')
  })

  it('allows listed device', () => {
    expect(
      evaluateQuota(
        baseConfig({ allowDeviceIds: ['dev-a'] }),
        baseSnap(),
      ),
    ).toBe('ok')
  })

  it('enforces daily limit for listed devices', () => {
    expect(
      evaluateQuota(
        baseConfig({ allowDeviceIds: ['dev-a'], perUserPerDay: 3 }),
        baseSnap({ userJobsLastDay: 3 }),
      ),
    ).toBe('quota_daily')
  })

  it('enforces per-user minute limit', () => {
    expect(
      evaluateQuota(
        baseConfig({ allowDeviceIds: ['dev-a'], perUserPerMinute: 2 }),
        baseSnap({ userJobsLastMinute: 2 }),
      ),
    ).toBe('rate_limited')
  })

  it('enforces global minute limit', () => {
    expect(
      evaluateQuota(
        baseConfig({ allowDeviceIds: ['dev-a'], globalPerMinute: 5 }),
        baseSnap({ globalJobsLastMinute: 5 }),
      ),
    ).toBe('rate_limited')
  })

  it('skips numeric limits when they are zero', () => {
    expect(
      evaluateQuota(
        baseConfig({
          allowDeviceIds: ['dev-a'],
          maxUsers: 0,
          perUserPerDay: 0,
          perUserPerMinute: 0,
          globalPerMinute: 0,
        }),
        baseSnap({
          userJobsLastDay: 999,
          userJobsLastMinute: 999,
          globalJobsLastMinute: 999,
        }),
      ),
    ).toBe('ok')
  })
})
