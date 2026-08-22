import { Link } from 'react-router-dom'

export function BackLink({
  to,
  label = '返回',
}: {
  to: string
  label?: string
}) {
  return (
    <Link
      to={to}
      className="inline-flex min-h-11 items-center font-cue text-base font-semibold tracking-[0.14em] text-day/80 transition-colors duration-200 ease-out hover:text-day focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-day"
    >
      {label}
    </Link>
  )
}
