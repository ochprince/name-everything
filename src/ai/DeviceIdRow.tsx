import { useCallback, useEffect, useRef, useState } from 'react'
import { checkAiAllowedCached, isAiAllowedWithDetail } from './allowance'
import { writeAiAllowCache } from './allowCache'
import { getOrCreateDeviceId } from './deviceId'

const holdButton =
  'min-h-11 min-w-[4.75rem] rounded-2xl px-3 font-cue text-base font-semibold tracking-[0.14em] transition-[filter,background-color,border-color] duration-200 ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-day active:brightness-95'

function truncateId(id: string): string {
  if (id.length <= 14) return id
  return `${id.slice(0, 8)}…${id.slice(-4)}`
}

async function copyText(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text)
  } catch {
    const area = document.createElement('textarea')
    area.value = text
    area.style.position = 'fixed'
    area.style.opacity = '0'
    document.body.appendChild(area)
    area.select()
    document.execCommand('copy')
    area.remove()
  }
}

export function DeviceIdRow() {
  const id = getOrCreateDeviceId()
  const [copied, setCopied] = useState(false)
  const [allowed, setAllowed] = useState<boolean | null>(null)
  const [checking, setChecking] = useState(true)
  const timer = useRef<number | null>(null)

  // 缓存优先：TTL 内直接读本地状态，不再每次打开「我的」都真实调接口。
  const refresh = useCallback(
    async (force: boolean) => {
      setChecking(true)
      if (force) {
        // 手动「重新检测」：绕过缓存走真实 RPC，成功即回写缓存。
        const detail = await isAiAllowedWithDetail(id)
        if (detail.ok) writeAiAllowCache(detail.allowed)
        setAllowed(detail.allowed)
      } else {
        const detail = await checkAiAllowedCached(id)
        setAllowed(detail.allowed)
      }
      setChecking(false)
    },
    [id],
  )

  useEffect(() => {
    void refresh(false)
    return () => {
      if (timer.current !== null) window.clearTimeout(timer.current)
    }
  }, [refresh])

  async function onCopy() {
    await copyText(id)
    setCopied(true)
    if (timer.current !== null) window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setCopied(false), 1500)
  }

  const statusLabel =
    allowed === null ? '查询中…' : allowed ? '已开通' : '未开通'

  return (
    <div className="mt-14 flex flex-col gap-3">
      <p className="text-lg font-medium tracking-[0.04em] text-day">设备码</p>
      <p className="text-base font-medium tracking-[0.02em] text-day/80">
        发给管理员以开通 AI 功能
        <span className="text-day/50"> · {statusLabel}</span>
      </p>
      <p className="font-mono text-sm tracking-[0.04em] text-day/70">
        {truncateId(id)}
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void onCopy()}
          className={`${holdButton} bg-day text-cyc hover:brightness-105`}
        >
          {copied ? '已复制' : '复制'}
        </button>
        <button
          type="button"
          disabled={checking}
          onClick={() => void refresh(true)}
          className={`${holdButton} border border-day/30 bg-cyc text-day/85 hover:border-day/60 disabled:opacity-50`}
        >
          {checking ? '检测中…' : '重新检测'}
        </button>
      </div>
    </div>
  )
}
