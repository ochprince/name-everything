/**
 * Smoke: ensure a special smoke.* device is on the allow list, insert one text
 * job, wait for completed via RPC / broadcast.
 *
 * Needs .env.local: VITE_SUPABASE_*, SUPABASE_SERVICE_ROLE_KEY, running worker.
 *
 *   npx tsx scripts/ai-text-smoke.ts
 */
import { createClient } from '@supabase/supabase-js'
import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import {
  AI_ALLOW_DEVICE_IDS_KEY,
  createSmokeDeviceId,
  isSmokeDeviceId,
} from '../src/ai/configKeys'
import { parseAllowDeviceIdsValue } from '../ai-worker/quota'

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
const anonKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !anonKey || !serviceKey) {
  console.error(
    'Need VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY, SUPABASE_SERVICE_ROLE_KEY',
  )
  process.exit(1)
}

const id = crypto.randomUUID()
const deviceId = process.env.AI_SMOKE_DEVICE_ID ?? createSmokeDeviceId()
if (!process.env.AI_SMOKE_DEVICE_ID && !isSmokeDeviceId(deviceId)) {
  console.error('internal: smoke device id format invalid')
  process.exit(1)
}

const admin = createClient(url, serviceKey)
const supabase = createClient(url, anonKey)

async function ensureAllowListed(device: string): Promise<() => Promise<void>> {
  const { data, error } = await admin
    .from('app_config')
    .select('value')
    .eq('key', AI_ALLOW_DEVICE_IDS_KEY)
    .maybeSingle()
  if (error) throw error

  const existing = parseAllowDeviceIdsValue(data?.value)
  if (existing.includes(device)) {
    return async () => {}
  }

  const next = [...existing, device]
  const { error: upsertError } = await admin.from('app_config').upsert({
    key: AI_ALLOW_DEVICE_IDS_KEY,
    value: next,
    updated_at: new Date().toISOString(),
  })
  if (upsertError) throw upsertError

  return async () => {
    const cleaned = next.filter((x) => x !== device)
    const { error: cleanError } = await admin.from('app_config').upsert({
      key: AI_ALLOW_DEVICE_IDS_KEY,
      value: cleaned,
      updated_at: new Date().toISOString(),
    })
    if (cleanError) console.error('cleanup allow list failed', cleanError)
  }
}

async function main() {
  const cleanup = await ensureAllowListed(deviceId)
  console.log('allow device', deviceId.startsWith('smoke.') ? '(smoke.*)' : '(custom)')

  try {
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
      process.exitCode = 1
      return
    }
    console.log('text:', result.text)
  } finally {
    await cleanup()
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
