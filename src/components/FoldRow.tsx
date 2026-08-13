import { useId, useState, type ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'

interface FoldRowProps {
  label: string
  defaultOpen?: boolean
  children: ReactNode
}

export function FoldRow({ label, defaultOpen = false, children }: FoldRowProps) {
  const [open, setOpen] = useState(defaultOpen)
  const panelId = useId()

  return (
    <div className="min-w-0 flex-1">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
        className="flex h-11 w-full items-center justify-center gap-1.5 rounded-full border border-day/70 bg-transparent px-3 font-cue text-[0.95rem] font-semibold tracking-[0.14em] text-day transition-[border-color,filter] duration-200 ease-out hover:border-day hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-day active:brightness-95"
      >
        <span>{label}</span>
        <ChevronDown
          aria-hidden="true"
          className={`fold-chevron size-4 shrink-0 stroke-[2.25] transition-transform duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>
      {open ? (
        <div
          id={panelId}
          className="fold-panel mt-3 text-center font-cue text-2xl font-semibold tracking-[0.06em] text-day"
        >
          {children}
        </div>
      ) : null}
    </div>
  )
}
