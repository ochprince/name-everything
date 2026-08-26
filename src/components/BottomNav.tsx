import { useEffect, useRef } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useProgress } from '../features/pictures/hooks/useProgress'
import { readKeyboardOverlapPx } from '../shared/appViewport'

const tabs = [
  { to: '/', label: '练习' },
  { to: '/review', label: '复习' },
  { to: '/me', label: '我的' },
] as const

/** Primary tabs only — nested practice stages keep a top-left back instead. */
export function showsBottomNav(pathname: string): boolean {
  return pathname === '/' || pathname === '/review' || pathname === '/me'
}

function tabOn(to: string, pathname: string): boolean {
  if (to === '/') return pathname === '/' || pathname.startsWith('/practice')
  return pathname === to || pathname.startsWith(`${to}/`)
}

export function BottomNav() {
  const { progress } = useProgress()
  const unseen = progress.reviewUnseenCount
  const { pathname } = useLocation()
  const navRef = useRef<HTMLElement>(null)

  // iOS 全屏/URL 栏切换时，fixed 底栏的原生定位可能滞后（实测：进全屏后导航
  // 下半截被裁掉、手动上滑才恢复）。改为按 visualViewport 显式算 bottom：
  // 任何视口变化都把导航重新钉到可视区底边（保留 CSS bottom:-2px 的过盈设计）。
  useEffect(() => {
    const nav = navRef.current
    if (!nav) return
    const sync = () => {
      nav.style.bottom = `${readKeyboardOverlapPx() - 2}px`
    }
    sync()
    const vv = window.visualViewport
    vv?.addEventListener('resize', sync)
    vv?.addEventListener('scroll', sync)
    window.addEventListener('resize', sync)
    return () => {
      vv?.removeEventListener('resize', sync)
      vv?.removeEventListener('scroll', sync)
      window.removeEventListener('resize', sync)
    }
  }, [])

  if (!showsBottomNav(pathname)) return null

  return (
    <nav
      ref={navRef}
      aria-label="主导航"
      className="bottom-nav fixed inset-x-0 z-50 bg-cyc font-cue"
    >
      <div
        aria-hidden="true"
        className="h-px bg-gradient-to-r from-cyc via-rose to-cobalt"
      />
      <div className="mx-auto flex max-w-md">
        {tabs.map((tab) => {
          const on = tabOn(tab.to, pathname)
          return (
            <NavLink
              key={tab.to}
              to={tab.to}
              end={tab.to !== '/'}
              aria-current={on ? 'page' : undefined}
              aria-label={
                tab.to === '/review' && unseen > 0
                  ? `复习，${unseen} 个待复习`
                  : undefined
              }
              className={() =>
                [
                  'flex min-h-14 flex-1 items-center justify-center text-lg font-semibold tracking-[0.18em] transition-colors duration-200 ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-day',
                  on ? 'text-rose' : 'text-day/80 hover:text-day',
                ].join(' ')
              }
            >
              <span
                id={tab.to === '/review' ? 'nav-review' : undefined}
                className={`relative ${
                  on
                    ? 'border-b-2 border-rose pb-0.5'
                    : 'border-b-2 border-transparent pb-0.5'
                }`}
              >
                {tab.label}
                {tab.to === '/review' && unseen > 0 ? (
                  <span
                    data-testid="review-unseen"
                    className="absolute -right-3 -top-1 inline-flex min-h-4 min-w-4 items-center justify-center rounded-full bg-rose px-1 text-[0.65rem] font-semibold leading-none tracking-normal text-cyc"
                  >
                    {unseen > 9 ? '9+' : unseen}
                  </span>
                ) : null}
              </span>
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}
