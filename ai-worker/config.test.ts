import { describe, expect, it } from 'vitest'
import { loadWorkerConfig } from './config'

describe('loadWorkerConfig', () => {
  it('throws when keys missing', () => {
    expect(() => loadWorkerConfig({})).toThrow(/DASHSCOPE_API_KEY/)
  })

  it('loads keys and default quota', () => {
    const cfg = loadWorkerConfig({
      SUPABASE_URL: 'https://example.supabase.co',
      SUPABASE_SERVICE_ROLE_KEY: 'service',
      DASHSCOPE_API_KEY: 'dash',
    })
    expect(cfg.supabaseUrl).toBe('https://example.supabase.co')
    expect(cfg.serviceRoleKey).toBe('service')
    expect(cfg.dashscopeApiKey).toBe('dash')
    expect(cfg.pollMs).toBe(200)
    expect(cfg.quota.maxUsers).toBe(20)
  })
})
