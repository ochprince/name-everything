import { describe, it, expect } from 'vitest'
import { buildProduceHints } from './produceHints'

describe('buildProduceHints', () => {
  it('merges sentence first word + level title + anchor into the hint line', () => {
    const hints = buildProduceHints({
      zh: '我妈妈每天早上喝咖啡。',
      en: 'My mother drinks coffee every morning.',
      levelTitle: '一般现在时',
      anchorEn: 'She reads a book every night.',
    })
    expect(hints).toEqual([
      '中文：我妈妈每天早上喝咖啡。',
      '小提示：My …（一般现在时）\n例句：She reads a book every night.',
    ])
  })

  it('falls back to no level name / anchor lines when they are missing', () => {
    const hints = buildProduceHints({
      zh: '他很忙。',
      en: 'He is busy.',
    })
    expect(hints).toEqual(['中文：他很忙。', '小提示：He …'])
  })

  it('omits the level-name bracket when no level title, keeps the anchor line', () => {
    const hints = buildProduceHints({
      zh: '她每晚读书。',
      en: 'She reads a book.',
      anchorEn: 'He writes a letter.',
    })
    expect(hints).toEqual([
      '中文：她每晚读书。',
      '小提示：She …\n例句：He writes a letter.',
    ])
  })

  it('keeps the level-name bracket when anchor is missing', () => {
    const hints = buildProduceHints({
      zh: '他喜欢音乐。',
      en: 'He likes music.',
      levelTitle: '主谓宾',
    })
    expect(hints).toEqual(['中文：他喜欢音乐。', '小提示：He …（主谓宾）'])
  })
})
