import { NavLink } from 'react-router-dom'

const tabs = [
  { to: '/', label: '练习', end: true },
  { to: '/review', label: '复习', end: false },
  { to: '/me', label: '我的', end: false },
] as const

export function BottomNav() {
  return (
    <nav
      aria-label="主导航"
      className="bottom-nav fixed inset-x-0 z-50 bg-cyc font-cue"
    >
      <div
        aria-hidden="true"
        className="h-px bg-gradient-to-r from-cyc via-rose to-cobalt"
      />
      <div className="mx-auto flex max-w-md">
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.end}
            className={({ isActive }) =>
              [
                'flex min-h-14 flex-1 items-center justify-center text-lg font-semibold tracking-[0.18em] transition-colors duration-200 ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-day',
                isActive ? 'text-rose' : 'text-day/80 hover:text-day',
              ].join(' ')
            }
          >
            {({ isActive }) => (
              <span
                id={tab.to === '/review' ? 'nav-review' : undefined}
                className={
                  isActive
                    ? 'border-b-2 border-rose pb-0.5'
                    : 'border-b-2 border-transparent pb-0.5'
                }
              >
                {tab.label}
              </span>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
