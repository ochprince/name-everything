import { Link } from 'react-router-dom'

/** Shared chrome for stage back — text link, no bordered pill. */
export const backControlClassName =
  'inline-flex min-h-11 items-center font-cue text-base font-semibold tracking-[0.14em] text-day/80 transition-colors duration-200 ease-out hover:text-day focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-day [-webkit-tap-highlight-color:transparent]'

export function BackLink({
  to,
  label = '返回',
}: {
  to: string
  label?: string
}) {
  return (
    <Link to={to} className={backControlClassName}>
      {label}
    </Link>
  )
}

export function BackButton({
  onClick,
  label = '返回',
  'aria-label': ariaLabel,
  className = '',
}: {
  onClick: () => void
  label?: string
  'aria-label'?: string
  className?: string
}) {
  return (
    <button
      type="button"
      aria-label={ariaLabel ?? label}
      onClick={onClick}
      onMouseDown={(event) => {
        // Avoid sticky :focus ring after tap on iOS / mouse.
        event.preventDefault()
      }}
      className={`${backControlClassName} outline-none ${className}`}
    >
      {label}
    </button>
  )
}
