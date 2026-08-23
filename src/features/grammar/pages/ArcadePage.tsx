import { Link, Navigate } from 'react-router-dom'
import { StageShell } from '../../../shared/StageShell'
import { StageHeader } from '../../../shared/StageHeader'
import { useGrammarProgress } from '../lib/storage'

export function ArcadePage() {
  const progress = useGrammarProgress()
  if (progress.passedLevelIds.length === 0) {
    return <Navigate to="/" replace />
  }

  return (
    <StageShell
      header={<StageHeader backTo="/" title="语法游戏" />}
    >
      <div className="flex flex-1 flex-col gap-6 pt-8">
        <p className="text-lg font-medium tracking-[0.02em] text-day/80">
          已过关句子随机混合，反复巩固。
        </p>
        {progress.arcadeHistory.length === 0 ? (
          <p className="rounded-2xl border border-gold/50 bg-cyc/80 px-4 py-5 text-lg font-medium text-day/80">
            暂无记录。完成一局后，成绩会显示在这里。
          </p>
        ) : (
          <ol className="flex flex-col gap-2">
            {progress.arcadeHistory.map((entry) => (
              <li
                key={entry.id}
                className="flex items-baseline justify-between rounded-2xl bg-cobalt px-4 py-4 text-day"
              >
                <span className="text-xl font-semibold tracking-[0.04em]">
                  {entry.score} 句
                </span>
                <span className="text-base font-medium tracking-[0.04em] text-day/70">
                  {new Date(entry.at).toLocaleDateString('zh-CN', {
                    month: 'numeric',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </li>
            ))}
          </ol>
        )}
        <Link
          to="/practice/grammar/play/run"
          className="mt-auto mb-4 inline-flex min-h-14 items-center justify-center rounded-2xl bg-day px-6 text-lg font-semibold tracking-[0.08em] text-cyc transition-[filter] duration-200 ease-out hover:brightness-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-day active:brightness-95"
        >
          开始游戏
        </Link>
      </div>
    </StageShell>
  )
}
