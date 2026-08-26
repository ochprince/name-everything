/**
 * After a sentence result, arcade may show the group speed banner before the
 * next fall starts. Clearing the result without advancing leaves
 * `remainingMs === 0` on a playing board → instant re-fail.
 */
export type AfterSentencePlan =
  | { kind: 'advance' }
  | { kind: 'group_banner'; groupNumber: number }

export function planAfterSentence(input: {
  mode: 'level' | 'arcade' | 'vocab'
  clearedCount: number
  hasMoreSentences: boolean
  groupNumber: number
  shouldShowBanner: (clearedCount: number, hasMore: boolean) => boolean
}): AfterSentencePlan {
  if (
    (input.mode === 'arcade' || input.mode === 'vocab') &&
    input.shouldShowBanner(input.clearedCount, input.hasMoreSentences)
  ) {
    return { kind: 'group_banner', groupNumber: input.groupNumber }
  }
  return { kind: 'advance' }
}

/** Banner path must keep the result screen until the banner finishes. */
export function clearsResultBeforeAdvance(plan: AfterSentencePlan): boolean {
  return plan.kind === 'advance'
}
