type BootStep = { t: number; msg: string }

const boot = {
  t0: Date.now(),
  steps: [] as BootStep[],
  error: null as string | null,
  mark(msg: string) {
    boot.steps.push({ t: Date.now() - boot.t0, msg })
  },
}

window.__NE_BOOT = boot
boot.mark('boot.ts evaluated')

function timed(name: string, load: () => Promise<unknown>, timeoutMs = 0) {
  const start = Date.now()
  boot.mark('start ' + name)
  const work = load().then(
    () => {
      boot.mark(name + ' ok ' + (Date.now() - start) + 'ms')
    },
    (err: unknown) => {
      const text = err instanceof Error ? err.message : String(err)
      boot.error = name + ': ' + text
      boot.mark(name + ' FAIL ' + text)
    },
  )
  if (timeoutMs > 0) {
    const timer = setTimeout(() => {
      if (
        !boot.steps.some(
          (s) => s.msg.startsWith(name + ' ok') || s.msg.startsWith(name + ' FAIL'),
        )
      ) {
        boot.mark(name + ' TIMEOUT ' + timeoutMs + 'ms')
      }
    }, timeoutMs)
    void work.finally(() => clearTimeout(timer))
  }
  return work
}

timed('main.tsx', () => import('./main.tsx'), 4000).then(() => {
  boot.mark('app module done, loading fonts')
  return Promise.all([
    timed(
      'font/big-400',
      () => import('@fontsource/big-shoulders-text/latin-400'),
    ),
    timed(
      'font/big-500',
      () => import('@fontsource/big-shoulders-text/latin-500'),
    ),
    timed(
      'font/big-600',
      () => import('@fontsource/big-shoulders-text/latin-600'),
    ),
    timed(
      'font/big-700',
      () => import('@fontsource/big-shoulders-text/latin-700'),
    ),
    timed(
      'font/big-800',
      () => import('@fontsource/big-shoulders-text/latin-800'),
    ),
    timed(
      'font/sc-500',
      () => import('@fontsource/noto-sans-sc/chinese-simplified-500'),
    ),
    timed(
      'font/sc-600',
      () => import('@fontsource/noto-sans-sc/chinese-simplified-600'),
    ),
    timed(
      'font/sc-700',
      () => import('@fontsource/noto-sans-sc/chinese-simplified-700'),
    ),
  ])
})
