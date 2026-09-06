import type { SupabaseClient } from '@supabase/supabase-js'
import { AI_ALLOW_DEVICE_IDS_KEY } from '../src/ai/configKeys'
import { jobChannelName, type AiDonePayload } from '../src/ai/types'
import { parseAllowDeviceIdsValue, type QuotaSnapshot } from './quota'
import type { JobStore } from './jobs'

function utcDayStartIso(now = new Date()): string {
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  ).toISOString()
}

export async function loadAllowDeviceIds(
  supabase: SupabaseClient,
): Promise<string[]> {
  const { data, error } = await supabase
    .from('app_config')
    .select('value')
    .eq('key', AI_ALLOW_DEVICE_IDS_KEY)
    .maybeSingle()
  if (error) throw error
  return parseAllowDeviceIdsValue(data?.value)
}

export function createSupabaseStore(supabase: SupabaseClient): JobStore {
  return {
    async loadSnapshot(deviceId: string): Promise<QuotaSnapshot> {
      const minuteAgo = new Date(Date.now() - 60_000).toISOString()
      const dayStart = utcDayStartIso()

      const [
        known,
        deviceCountRes,
        userDayRes,
        userMinuteRes,
        globalMinuteRes,
      ] = await Promise.all([
        supabase
          .from('ai_quota_devices')
          .select('device_id')
          .eq('device_id', deviceId)
          .maybeSingle(),
        supabase
          .from('ai_quota_devices')
          .select('*', { count: 'exact', head: true }),
        supabase
          .from('ai_jobs')
          .select('id', { count: 'exact', head: true })
          .eq('device_id', deviceId)
          .gte('created_at', dayStart),
        supabase
          .from('ai_jobs')
          .select('id', { count: 'exact', head: true })
          .eq('device_id', deviceId)
          .gte('created_at', minuteAgo),
        supabase
          .from('ai_jobs')
          .select('id', { count: 'exact', head: true })
          .gte('created_at', minuteAgo),
      ])

      return {
        deviceId,
        knownDevice: Boolean(known.data),
        deviceCount: deviceCountRes.count ?? 0,
        userJobsLastDay: userDayRes.count ?? 0,
        userJobsLastMinute: userMinuteRes.count ?? 0,
        globalJobsLastMinute: globalMinuteRes.count ?? 0,
      }
    },

    async occupyDevice(deviceId: string): Promise<void> {
      const { error } = await supabase
        .from('ai_quota_devices')
        .insert({ device_id: deviceId })
      if (error && error.code !== '23505') throw error
    },

    async finishJob(id, patch): Promise<void> {
      const { error } = await supabase
        .from('ai_jobs')
        .update({
          status: patch.status,
          output: patch.output ?? null,
          error: patch.error ?? null,
          completed_at: new Date().toISOString(),
        })
        .eq('id', id)
      if (error) throw error
    },

    async failStaleRunning(olderThanMs: number): Promise<AiDonePayload[]> {
      const cutoff = new Date(Date.now() - olderThanMs).toISOString()
      const { data, error } = await supabase
        .from('ai_jobs')
        .update({
          status: 'failed',
          error: 'worker_stale',
          completed_at: new Date().toISOString(),
        })
        .eq('status', 'running')
        .lt('claimed_at', cutoff)
        .select('id')
      if (error) throw error
      return (data ?? []).map((row) => ({
        id: row.id as string,
        status: 'failed' as const,
        error: 'worker_stale',
      }))
    },

    async deleteTerminalOlderThan(olderThanMs: number): Promise<void> {
      const cutoff = new Date(Date.now() - olderThanMs).toISOString()
      const { error } = await supabase
        .from('ai_jobs')
        .delete()
        .in('status', ['completed', 'failed', 'rejected'])
        .lt('completed_at', cutoff)
      if (error) throw error
    },

    async broadcast(payload: AiDonePayload): Promise<void> {
      const channel = supabase.channel(jobChannelName(payload.id))
      await new Promise<void>((resolve) => {
        const done = () => resolve()
        const timer = setTimeout(done, 1000)
        channel.subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            clearTimeout(timer)
            done()
          }
        })
      })
      await channel.send({
        type: 'broadcast',
        event: 'done',
        payload,
      })
      await supabase.removeChannel(channel)
    },
  }
}
