import { createClient } from '@supabase/supabase-js'
import { loadWorkerConfig } from './config'
import { processClaimedJob, type AiJobRow } from './jobs'
import { generateText } from './qwen'
import { createSupabaseStore } from './store'

async function loop(): Promise<void> {
  const cfg = loadWorkerConfig()
  const supabase = createClient(cfg.supabaseUrl, cfg.serviceRoleKey)
  const store = createSupabaseStore(supabase)

  for (;;) {
    await store.deleteTerminalOlderThan(7 * 24 * 60 * 60 * 1000)
    const stale = await store.failStaleRunning(30_000)
    for (const payload of stale) await store.broadcast(payload)

    const { data: job, error } = await supabase.rpc('claim_ai_job')
    if (error) throw error
    if (!job) {
      await new Promise((r) => setTimeout(r, cfg.pollMs))
      continue
    }

    await processClaimedJob(job as AiJobRow, {
      quota: cfg.quota,
      store,
      generateText,
      apiKey: cfg.dashscopeApiKey,
    })
  }
}

loop().catch((err) => {
  console.error(err)
  process.exit(1)
})
