/** Prototype stage doors — raster masks from approved icon art, tinted via currentColor. */

const closedSrc = `${import.meta.env.BASE_URL}images/doors/closed.png`
const openSrc = `${import.meta.env.BASE_URL}images/doors/open.png`

export function DoorIcon({
  open = false,
  className = 'size-[5.5rem] shrink-0',
}: {
  open?: boolean
  className?: string
}) {
  const src = open ? openSrc : closedSrc
  return (
    <span
      aria-hidden="true"
      className={`inline-block bg-current ${className}`}
      style={{
        WebkitMaskImage: `url(${src})`,
        maskImage: `url(${src})`,
        WebkitMaskSize: 'contain',
        maskSize: 'contain',
        WebkitMaskRepeat: 'no-repeat',
        maskRepeat: 'no-repeat',
        WebkitMaskPosition: 'center',
        maskPosition: 'center',
      }}
    />
  )
}

/** List row chevron matching the grammar-list prototype. */
export function ListChevron({ className = 'size-5 shrink-0' }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 6l6 6-6 6" />
    </svg>
  )
}
