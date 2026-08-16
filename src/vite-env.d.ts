/// <reference types="vite/client" />
/// <reference types="vitest/globals" />

declare module '@fontsource/big-shoulders-text/*'
declare module '@fontsource/noto-sans-sc/*'

interface NeBoot {
  t0: number
  steps: { t: number; msg: string }[]
  error: string | null
  mark: (msg: string) => void
}

interface Window {
  __NE_BOOT?: NeBoot
  __NE_PING?: number
  __NE_MOD?: {
    error?: string
    load?: number
    nomodule?: boolean
  }
}
