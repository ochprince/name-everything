/**
 * Smoke: insert one text job and wait for completed via RPC / broadcast.
 * Needs .env.local VITE_SUPABASE_* and a running ai-worker.
 *
 *   npx tsx scripts/ai-text-smoke.ts
 */
import { createClient } from '@supabase/supabase-js'
import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

function loadEnvLocal() {
  const path = resolve(process.cwd(), '.env.local')
  if (!existsSync(path)) return
  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^([^#=]+)=(.*)$/)
    if (!m) continue
    const key = m[1].trim()
    const val = m[2].trim().replace(/^['"]|['"]$/g, '')
    if (!process.env[key]) process.env[key] = val
  }
}

loadEnvLocal()

const url = process.env.VITE_SUPABASE_URL
const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY
if (!url || !key) {
  console.error('Need VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY')
  process.exit(1)
}

const id = crypto.randomUUID()
const deviceId = process.env.AI_SMOKE_DEVICE_ID ?? `smoke-${id}`
const supabase = createClient(url, key)

async function main() {
  const { error } = await supabase.from('ai_jobs').insert({
    id,
    capability: 'text',
    status: 'queued',
    device_id: deviceId,
    input: { input: 'Reply with exactly: pong' },
  })
  if (error) throw error
  console.log('inserted', id)

  const channel = supabase.channel(`ai-job:${id}`)
  const deadline = Date.now() + 15_000

  const result = await new Promise<{ text?: string; error?: string }>(
    (resolvePromise, reject) => {
      const finish = (payload: { text?: string; error?: string }) => {
        clearInterval(poll)
        void supabase.removeChannel(channel)
        resolvePromise(payload)
      }
      channel
        .on('broadcast', { event: 'done' }, (msg) => {
          const p = msg.payload as {
            status?: string
            text?: string
            error?: string
          }
          if (p.status === 'completed') finish({ text: p.text })
          else if (p.status === 'failed' || p.status === 'rejected') {
            finish({ error: p.error ?? p.status })
          }
        })
        .subscribe()

      const poll = setInterval(async () => {
        if (Date.now() > deadline) {
          clearInterval(poll)
          void supabase.removeChannel(channel)
          reject(new Error('timeout'))
          return
        }
        const { data } = await supabase.rpc('get_ai_job', { p_id: id })
        const row = Array.isArray(data) ? data[0] : data
        if (!row) return
        if (row.status === 'completed') {
          finish({ text: row.output?.text })
        } else if (row.status === 'failed' || row.status === 'rejected') {
          finish({ error: row.error ?? row.status })
        }
      }, 300)
    },
  )

  if (result.error) {
    console.error('failed:', result.error)
    process.exit(1)
  }
  console.log('text:', result.text)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
