import type { HintLang } from '../lib/storage'

const mark =
  'inline-flex size-9 items-center justify-center rounded-full font-cue text-[0.7rem] font-semibold tracking-[0.18em] transition-[filter,background-color,border-color] duration-200 ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-day active:brightness-95'

interface LangToggleProps {
  value: HintLang
  onChange: (lang: HintLang) => void
  hasZh?: boolean
  label?: string
}

export function LangToggle({
  value,
  onChange,
  hasZh = true,
  label = '提示语言',
}: LangToggleProps) {
  return (
    <div role="radiogroup" aria-label={label} className="flex gap-1.5">
      <button
        type="button"
        role="radio"
        aria-checked={value === 'en'}
        aria-label="EN"
        onClick={() => onChange('en')}
        className={`${mark} ${
          value === 'en'
            ? 'bg-day text-cyc hover:brightness-105'
            : 'border border-day/70 bg-transparent text-day/80 hover:border-day hover:text-day'
        }`}
      >
        EN
      </button>
      {hasZh ? (
        <button
          type="button"
          role="radio"
          aria-checked={value === 'zh'}
          aria-label="ZH"
          onClick={() => onChange('zh')}
          className={`${mark} ${
            value === 'zh'
              ? 'bg-day text-cyc hover:brightness-105'
              : 'border border-day/70 bg-transparent text-day/80 hover:border-day hover:text-day'
          }`}
        >
          ZH
        </button>
      ) : null}
    </div>
  )
}
