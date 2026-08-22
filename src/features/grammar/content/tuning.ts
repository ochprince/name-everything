export const gameTuning = {
  lives: 3,
  pass_threshold_default: 3,
  fall_duration_ms: 8000,
  wrong_speed_factor: 0.7,
  min_fall_duration_ms: 2500,
  /** 选对一槽后回弹的时间（占单句下落总时长比例） */
  correct_bounce_factor: 0.28,
} as const

export type GameTuning = typeof gameTuning
