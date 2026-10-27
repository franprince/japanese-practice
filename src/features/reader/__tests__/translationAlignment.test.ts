import { describe, expect, it } from 'bun:test'
import { alignSpans, alignTranslation } from '../lib/translationAlignment'
import { development, heldOut } from './fixtures/passageAlignment'
import robot from './fixtures/matching-robot-2026-10-24.json'
import liveDevelopment from './fixtures/matching-development-2026-10-24.json'
import liveHeldOut from './fixtures/matching-held-out-2026-10-24.json'
import gandhara from './fixtures/matching-gandhara-plain-2026-10-24.json'

describe('passage alignment development cases', () => {
  for (const example of development) {
    it(example.name, () => {
      const result = alignTranslation(example.source, example.text)
      expect(result.text).toBe(example.text)
      expect(result.groups.map(({ start, end, text }) => [start, end, text])).toEqual(example.spans)
    })
  }
})

describe('passage alignment held-out cases', () => {
  for (const example of heldOut) {
    it(example.name, () => {
      const result = alignTranslation(example.source, example.text)
      expect(result.groups.map(({ start, end, text }) => [start, end, text])).toEqual(example.spans)
    })
  }
})

describe('passage coverage and uncertainty', () => {
  for (const example of [...development, ...heldOut]) {
    it(`preserves every source row and target character: ${example.name}`, () => {
      const { groups } = alignTranslation(example.source, example.text)
      expect(groups.flatMap(group => Array.from({ length: group.end - group.start + 1 }, (_, i) => i + group.start)))
        .toEqual(example.source.map((_, i) => i))
      expect(alignSpans(example.source, example.text).map(span => example.text.slice(span.from, span.to)).join(''))
        .toBe(example.text)
    })
  }

  it('preserves CRLF, whitespace, blank edges and paragraph spacing in copied text', () => {
    const text = '  First.\r\n\r\nSecond.  \r\n'
    const result = alignTranslation(['', '最初。', '', '次。', ''], text)
    expect(result.text).toBe(text)
    expect(alignSpans(['', '最初。', '', '次。', ''], text).map(span => text.slice(span.from, span.to)).join('')).toBe(text)
    expect(result.groups.map(({ start, end }) => [start, end])).toEqual([[0, 0], [1, 1], [2, 2], [3, 3], [4, 4]])
  })

  it('groups a punctuation fragment with its neighbors instead of inventing a lexical pairing', () => {
    const result = alignTranslation(['猫', '犬', '鳥'], 'Cat\n.\nDog and bird')
    expect(result.groups).toEqual([{ start: 0, end: 2, text: 'Cat\n.\nDog and bird' }])
  })

  it('does not treat a repeated name as a unique anchor', () => {
    const result = alignTranslation(['ASTERと', 'ASTERへ', '帰る'], 'with ASTER\nto\nASTER\nreturn')
    expect(result.groups).toHaveLength(1)
  })

  it('keeps extra unowned target lines inside adjacent anchor groups', () => {
    const text = 'ALPHA\nan extra connecting phrase\nBETA'
    expect(alignTranslation(['ALPHAへ', 'BETAへ'], text).groups)
      .toEqual([{ start: 0, end: 1, text }])
  })

  it('uses the same policy when identifiers and numbers change', () => {
    for (const [a, b] of [['NOVA', 'SOL'], ['ROOM73', 'GATE96'], ['482', '719']]) {
      const text = `${b} second\n${a} first`
      expect(alignTranslation([`${a}が先`, `${b}が後`], text).groups).toEqual([{ start: 0, end: 1, text }])
    }
  })

  it('does not let a name anchor split the sentence containing its translation', () => {
    const text = 'The thought\nof ALPHA crossed my mind.\nI went home.'
    const result = alignTranslation(['ALPHAのことを', '考えた。', '帰った。'], text)
    expect(result.groups).toEqual([{ start: 0, end: 2, text }])
  })

  it('accounts for every character and source line under varied conflicting evidence', () => {
    let seed = 7231
    const random = (n: number) => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed % n }
    const pieces = ['', '猫', '猫。', 'ALPHA', 'BETA', '42', '次', '…', '鳥！', 'Voice.', '🌸', 'مرحبا؟']
    for (let i = 0; i < 300; i++) {
      const source = Array.from({ length: random(12) + 1 }, () => pieces[random(pieces.length)]!)
      const text = Array.from({ length: random(12) + 1 }, () => pieces[random(pieces.length)]!)
        .join(i % 2 ? '\r\n' : '\n')
      const spans = alignSpans(source, text)
      expect(spans.flatMap(span => Array.from({ length: span.end - span.start + 1 }, (_, j) => span.start + j)))
        .toEqual(source.map((_, j) => j))
      expect(spans.map(span => text.slice(span.from, span.to)).join('')).toBe(text)
      expect(spans.every((span, j) => span.from <= span.to && span.from === (j ? spans[j - 1]!.to : 0))).toBe(true)
    }
  })

  it('preserves original punctuation as standalone source text', () => {
    expect(alignTranslation(['声', '…', '静けさ'], 'A voice\n…\nSilence').groups)
      .toHaveLength(3)
  })

  for (const [to, result] of Object.entries(robot.results)) {
    it(`keeps the captured plain regression readable in ${to}`, () => {
      const { groups, text } = alignTranslation(robot.source.split('\n'), result.plain.text)
      expect(text).toBe(result.plain.text)
      expect(groups).toHaveLength(26)
      expect(groups[2]!.text.trim()).not.toBe('.')
      expect(alignSpans(robot.source.split('\n'), text).map(span => text.slice(span.from, span.to)).join('')).toBe(text)
    })
  }
})

describe('captured independent translations', () => {
  // Reviewed source/target ownership, not expectations generated by the candidate implementation.
  const ranges = [
    [[0, 0], [1, 1]], [[0, 0], [1, 1], [2, 2]], [[0, 0], [1, 1]], [[0, 0], [1, 1]],
    [[0, 0], [1, 1], [2, 2]], [[0, 0], [1, 1], [2, 2]],
    [[0, 0], [1, 1], [2, 2]], [[0, 0], [1, 1], [2, 2]], [[0, 0], [1, 1]],
    [[0, 0], [1, 1]], [[0, 0], [1, 1], [2, 2], [3, 3]], [[0, 0], [1, 1], [2, 2]],
  ]
  for (const [i, example] of [...liveDevelopment, ...liveHeldOut].entries()) {
    it(`${example.target}: ${example.name}`, () => {
      const result = alignTranslation(example.source, example.plain.body.text)
      expect(result.text).toBe(example.plain.body.text)
      expect(result.groups.map(({ start, end }) => [start, end])).toEqual(ranges[i]!)
      const spans = alignSpans(example.source, result.text)
      expect(spans.map(span => result.text.slice(span.from, span.to)).join('')).toBe(result.text)
    })
  }

  for (const [to, text] of Object.entries(gandhara.targets)) {
    it(`keeps the larger stanza regression useful and complete in ${to}`, () => {
      const source = gandhara.source.split('\n')
      const { groups } = alignTranslation(source, text)
      expect(groups.filter(group => group.text).length).toBeGreaterThan(30)
      expect(groups.flatMap(group => Array.from({ length: group.end - group.start + 1 }, (_, i) => i + group.start)))
        .toEqual(source.map((_, i) => i))
      expect(alignSpans(source, text).map(span => text.slice(span.from, span.to)).join('')).toBe(text)
    })
  }

  it('does not let a stray shared word merge a whole page of lyrics into one row', () => {
    // MyMemory leaves "the" in "Lock of the Squeaky Ones", which matched THE in the band name three paragraphs later.
    const source = [
      '金髪 阿婆擦れの ソープランドごっこ', 'うずくまるそいつらの腹黒ロック', 'テーブル押す 満員', '',
      'グラップラー クラッシャー', '酸素漏れにクラクション', '現実 都会のお前が 誰と何を犯した?',
      'TVの前のダディーとマミーが泣き過ごすがった', 'ダーリン血まみれのバレンタイン', 'フローリングにバターナイフ', '',
      'You might also like', 'Patrol Car Moyasu', 'マキシマム ザ ホルモン (MAXIMUM THE HORMONE)', 'Creep',
    ]
    const text = [
      'Póker Soapland con fricción rubia', 'Squeaky Sneaky Lock of the Squeaky Ones', 'Table Press Full', '',
      'Trituradora Grappler', 'Fuga de oxígeno en la bocina', '¿Quién y qué hizo en la ciudad real?',
      'Papá y mamá querían llorar frente al televisor', 'Darling Bloody Valentine', 'Suelo con cuchillo de mantequilla', '',
      'También te puede interesar', 'Coche patrulla Moyasu', 'Máxima la hormona', 'Creep',
    ].join('\n')
    expect(alignTranslation(source, text).groups.map(({ start, end }) => [start, end]))
      .toEqual(source.map((_, i) => [i, i]))
  })
})
