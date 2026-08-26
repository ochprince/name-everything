import { describe, it, expect } from 'vitest'
import { buildProduceHints } from './produceHints'

describe('buildProduceHints', () => {
  it('puts the Chinese example first, then level title, first word and anchor', () => {
    const hints = buildProduceHints({
      zh: '我妈妈每天早上喝咖啡。',
      en: 'My mother drinks coffee every morning.',
      levelTitle: '一般现在时',
      anchorEn: 'She reads a book every night.',
    })
    expect(hints).toEqual([
      '中文：我妈妈每天早上喝咖啡。',
      '关卡：一般现在时',
      '小提示：My …',
      '例句：She reads a book every night.',
    ])
  })

  it('drops missing level title and anchor', () => {
    const hints = buildProduceHints({
      zh: '他很忙。',
      en: 'He is busy.',
    })
    expect(hints).toEqual(['中文：他很忙。', '小提示：He …'])
  })
})
