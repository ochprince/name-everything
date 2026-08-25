const CONTRACTIONS: Array<[RegExp, string]> = [
  [/\bwon't\b/g, 'will not'],
  [/\bcan't\b/g, 'cannot'],
  [/\bshan't\b/g, 'shall not'],
  [/\bain't\b/g, 'am not'],
  [/\bi'm\b/g, 'i am'],
  [/\blet's\b/g, 'let us'],
  [/\bthere's\b/g, 'there is'],
  [/\bthere're\b/g, 'there are'],
  [/\b(that|what|who|where|here|how)'s\b/g, '$1 is'],
  [/\b(you|we|they|who)'re\b/g, '$1 are'],
  [/\b(i|you|we|they|he|she|it|who)'ve\b/g, '$1 have'],
  [/\b(i|you|he|she|it|we|they|who)'ll\b/g, '$1 will'],
  [/\b(i|you|he|she|it|we|they|who)'d\b/g, '$1 would'],
  [
    /\b(is|are|was|were|do|does|did|has|have|had|would|should|could|must|need)n't\b/g,
    '$1 not',
  ],
  [/\bit's\b/g, 'it is'],
  [/\bhe's\b/g, 'he is'],
  [/\bshe's\b/g, 'she is'],
]

export function normalizeEnglishForCompare(input: string): string {
  let text = input.trim().toLowerCase()
  text = text.replace(/[\u2019\u2018]/g, "'")
  for (const [pattern, replacement] of CONTRACTIONS) {
    text = text.replace(pattern, replacement)
  }
  text = text.replace(/[^a-z0-9\s]/g, ' ')
  text = text.replace(/\s+/g, ' ').trim()
  return text
}

export function englishAnswersMatch(a: string, b: string): boolean {
  return normalizeEnglishForCompare(a) === normalizeEnglishForCompare(b)
}
