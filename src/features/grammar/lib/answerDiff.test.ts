import { describe, expect, it } from 'vitest'
import { annotateAnswer, type AnswerMark } from './answerDiff'

/** 渲染等价于把标记按顺序用空格连起来。 */
function join(marks: AnswerMark[]): string {
  return marks.map((mark) => mark.text).join(' ')
}

/** 不变量：所有正确句单词必然以 plain/emph 出现一次（strike 只插用户多写的词）。 */
function correctLine(marks: AnswerMark[]): string {
  return marks
    .filter((mark) => mark.kind !== 'strike')
    .map((mark) => mark.text)
    .join(' ')
}

describe('annotateAnswer', () => {
  it('完全一致（大小写/标点差异）→ 全 plain 无标注', () => {
    const marks = annotateAnswer('HE GOES TO SCHOOL.', 'He goes to school.')
    expect(join(marks)).toBe('He goes to school.')
    expect(marks.every((mark) => mark.kind === 'plain')).toBe(true)
  })

  it('写错（go→goes）：只标蓝正确词，不展示用户错词', () => {
    const marks = annotateAnswer(
      'He go to school every day.',
      'He goes to school every day.',
    )
    expect(correctLine(marks)).toBe('He goes to school every day.')
    expect(marks.filter((m) => m.kind === 'emph').map((m) => m.text)).toEqual(['goes'])
    expect(marks.some((m) => m.kind === 'strike')).toBe(false)
    // 用户多写/写错的词（go）不应出现在展示里——只标正确词 goes
    expect(marks.some((m) => m.text === 'go')).toBe(false)
  })

  it('漏写（少了 every day）：正确词标蓝', () => {
    const marks = annotateAnswer('He goes to school.', 'He goes to school every day.')
    expect(correctLine(marks)).toBe('He goes to school every day.')
    expect(marks.filter((m) => m.kind === 'emph').map((m) => m.text)).toEqual([
      'every',
      'day.',
    ])
  })

  it('多写（多了 the）：划线展示用户多写的词，无标蓝', () => {
    const marks = annotateAnswer('He goes to the school.', 'He goes to school.')
    expect(join(marks)).toBe('He goes to the school.')
    expect(marks.filter((m) => m.kind === 'strike').map((m) => m.text)).toEqual(['the'])
    expect(marks.filter((m) => m.kind === 'emph')).toEqual([])
  })

  it('混合：go→goes 标蓝 + 多写 the 划线', () => {
    const marks = annotateAnswer(
      'He go to the school every day.',
      'He goes to school every day.',
    )
    expect(correctLine(marks)).toBe('He goes to school every day.')
    expect(marks.filter((m) => m.kind === 'emph').map((m) => m.text)).toEqual(['goes'])
    expect(marks.filter((m) => m.kind === 'strike').map((m) => m.text)).toEqual(['the'])
  })

  it('拼错（recieves→receives）：整词标蓝', () => {
    const marks = annotateAnswer('She recieves the letter.', 'She receives the letter.')
    expect(correctLine(marks)).toBe('She receives the letter.')
    expect(marks.filter((m) => m.kind === 'emph').map((m) => m.text)).toEqual([
      'receives',
    ])
    expect(marks.some((m) => m.kind === 'strike')).toBe(false)
  })

  it("缩写等价（won't ↔ will not）：整体算匹配，不划线不标蓝", () => {
    // 注意：整句缩写等价在判错层已通过（不进失败页）；这里验证部分错误场景下缩写不会被误标
    const marks = annotateAnswer("I won't went", 'I will not go')
    expect(correctLine(marks)).toBe('I will not go')
    expect(marks.filter((m) => m.kind === 'emph').map((m) => m.text)).toEqual(['go'])
    expect(marks.some((m) => m.kind === 'strike')).toBe(false)
  })

  it('句末多写（多了 today）：划线插在句尾', () => {
    const marks = annotateAnswer('He goes to school today.', 'He goes to school.')
    expect(correctLine(marks)).toBe('He goes to school.')
    expect(marks.filter((m) => m.kind === 'strike').map((m) => m.text)).toEqual([
      'today.',
    ])
  })

  it('词序颠倒的边缘场景不崩溃，正确句单词完整保留', () => {
    const marks = annotateAnswer('He to goes school.', 'He goes to school.')
    expect(correctLine(marks)).toBe('He goes to school.')
    expect(marks.length).toBeGreaterThan(0)
  })

  it('空用户输入兜底：全部标蓝', () => {
    const marks = annotateAnswer('', 'He goes to school.')
    expect(marks.filter((m) => m.kind === 'emph')).toHaveLength(4)
  })
})
