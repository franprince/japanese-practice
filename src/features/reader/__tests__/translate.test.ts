import { afterEach, describe, expect, it} from 'bun:test'
import { vi } from './vi'

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

// The module keeps a translation cache; a fresh copy per test stands in for Vitest's resetModules().
let copy = 0
async function service(): Promise<typeof import('../lib/translate')> {
  return import(`../lib/translate.ts?copy=${copy++}`)
}

describe('line translations', () => {
  it('keeps Spanish paired when DeepL adds a line break inside one lyric line', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => Response.json({
      text: 'Dicen que, si vas allí,\ncualquier sueño\nse hará realidad.',
    })))
    const { translateLines } = await service()
    const result = await translateLines(['そこに行けば どんな夢も', 'かなうというよ'], 'ES')
    expect(result.groups).toEqual([{
      start: 0, end: 1, text: 'Dicen que, si vas allí,\ncualquier sueño\nse hará realidad.',
    }])
  })

  it('uses server passage groups rather than guessing from translated newline counts', async () => {
    const groups = [
      { start: 0, end: 1, text: 'Dicen que si vas allí, cualquier sueño se hará realidad.' },
      { start: 2, end: 2, text: '' },
      { start: 3, end: 3, text: 'Todos quieren ir.' },
    ]
    const text = groups.map((group) => group.text).filter(Boolean).join('\n')
    vi.stubGlobal('fetch', vi.fn(async () => Response.json({ text, groups })))
    const { translateLines } = await service()
    expect(await translateLines(['そこに行けば どんな夢も', 'かなうというよ', '', '誰もみな行きたがるが'], 'ES'))
      .toEqual({ text, groups, provider: 'DeepL' })
  })

  it('maps structured chunk indices back to the complete passage, including blank boundaries', async () => {
    const source = Array.from({ length: 35 }, (_, i) => i % 7 === 0 ? '' : '猫'.repeat(30) + i)
    const requests: string[] = []
    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      const text = new URL(url, 'http://localhost').searchParams.get('text')!
      requests.push(text)
      const lines = text.split('\n')
      return Response.json({ text: lines.map((line) => line ? `Cat ${line.slice(30)}` : '').join('\n'),
        groups: lines.map((line, i) => ({ start: i, end: i, text: line ? `Cat ${line.slice(30)}` : '' })),
      })
    }))
    const { translateLines } = await service()
    const result = await translateLines(source, 'ES')
    expect(requests.length).toBeGreaterThan(1)
    expect(requests.join('\n')).toBe(source.join('\n'))
    expect(result.lines).toEqual(source.map((line) => line ? `Cat ${line.slice(30)}` : ''))
  })

  it('respects the character cap for passages containing mostly Latin text', async () => {
    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      const text = new URL(url, 'http://localhost').searchParams.get('text')!
      expect([...text].length).toBeLessThanOrEqual(1000)
      return Response.json({ text: 'Translation' })
    }))
    const { translateLines } = await service()
    await translateLines(['猫' + 'a'.repeat(1400), '犬' + 'b'.repeat(600)], 'ES')
  })

  it('keeps the shared context of adjacent lyric lines in one translation request', async () => {
    const lines = ['昨日、猫を見た。', 'とても可愛かった。']
    const requests: string[] = []
    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      const params = new URL(url, 'http://localhost').searchParams
      expect(params.get('v')).toBe('5')
      expect(params.get('format')).toBe('lines')
      const text = params.get('text')!
      requests.push(text)
      return Response.json({ text: text === lines.join('\n')
        ? 'Yesterday I saw a cat.\nIt was very cute.'
        : 'A phrase without the preceding line’s subject.' })
    }))
    const { translateLines } = await service()
    const result = await translateLines(lines, 'EN-US')
    expect(requests).toEqual([lines.join('\n')])
    expect(result).toMatchObject({
      text: 'Yesterday I saw a cat.\nIt was very cute.',
      lines: ['Yesterday I saw a cat.', 'It was very cute.'],
      provider: 'DeepL',
    })
  })

  it('restores stanza breaks without translating repeated lines outside their context', async () => {
    const source = ['今 貴方と奏でよう', '', '此処に貴方と居るコト', '今 貴方と奏でよう']
    const fetch = vi.fn(async (_url: string) => Response.json({
      text: 'Let’s play now.\nBeing here with you.\nLet’s make music now.',
    }))
    vi.stubGlobal('fetch', fetch)
    const { translateLines } = await service()
    expect(await translateLines(source, 'EN-US')).toMatchObject({
      text: 'Let’s play now.\nBeing here with you.\nLet’s make music now.',
      lines: ['Let’s play now.', '', 'Being here with you.', 'Let’s make music now.'],
      provider: 'DeepL',
    })
    expect(fetch).toHaveBeenCalledTimes(1)
    const request = new URL(fetch.mock.calls[0]![0], 'http://localhost')
    expect(request.searchParams.get('text')).toBe(source.join('\n'))
  })

  it('caches whole passages by language and invalidates when the surrounding context changes', async () => {
    const fetch = vi.fn(async (url: string) => {
      const params = new URL(url, 'http://localhost').searchParams
      const text = params.get('text')!
      return Response.json({ text: `${params.get('to')}: ${text}` })
    })
    vi.stubGlobal('fetch', fetch)
    const { translateLines } = await service()
    const first = await translateLines(['昨日、猫を見た。', 'とても可愛かった。'], 'EN-US')
    await translateLines(['昨日、猫を見た。', 'とても可愛かった。'], 'ES')
    expect(await translateLines(['昨日、猫を見た。', 'とても可愛かった。'], 'EN-US')).toEqual(first)
    await translateLines(['昨日、犬を見た。', 'とても可愛かった。'], 'EN-US')
    expect(fetch).toHaveBeenCalledTimes(3)
    expect(fetch.mock.calls.map(([url]) => new URL(url, 'http://localhost').searchParams.get('text'))).toEqual([
      '昨日、猫を見た。\nとても可愛かった。',
      '昨日、猫を見た。\nとても可愛かった。',
      '昨日、犬を見た。\nとても可愛かった。',
    ])
  })

  it('keeps the complete translation when the provider merges or adds lines', async () => {
    const fetch = vi.fn()
      .mockResolvedValueOnce(Response.json({ text: 'Yesterday I saw a cat, and it was very cute.' }))
      .mockResolvedValueOnce(Response.json({ text: 'Yesterday\nI saw a cat.\nIt was very cute.' }))
    vi.stubGlobal('fetch', fetch)
    const { translateLines } = await service()
    const merged = await translateLines(['昨日、猫を見た。', 'とても可愛かった。'], 'EN-US')
    expect(merged).toMatchObject({ text: 'Yesterday I saw a cat, and it was very cute.', provider: 'DeepL' })
    const extra = await translateLines(['昨日、猫を見た。', 'とても可愛かった。'], 'ES')
    expect(extra).toMatchObject({ text: 'Yesterday\nI saw a cat.\nIt was very cute.', provider: 'DeepL' })
  })

  it('accepts Windows line endings and blank lines in aligned provider output', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => Response.json({ text: 'First line.\r\n\r\nSecond line.' })))
    const { translateLines } = await service()
    expect((await translateLines(['最初の行', '', '次の行'], 'EN-US')).lines)
      .toEqual(['First line.', '', 'Second line.'])
  })

  it('reports an error instead of falling back when the translation function is missing', async () => {
    const fetch = vi.fn(async () => new Response('<html></html>', { headers: { 'Content-Type': 'text/html' } }))
    vi.stubGlobal('fetch', fetch)
    const { translateLines } = await service()
    await expect(translateLines(['此処に貴方と居るコト', '今 貴方と奏でよう'], 'EN-US')).rejects.toThrow(/isn't available/)
    expect(fetch).toHaveBeenCalledTimes(1)
  })

  it('reports a passage failure rather than retrying its phrases independently', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    const fetch = vi.fn(async () => Response.json({ error: 'Unavailable' }, { status: 429 }))
    vi.stubGlobal('fetch', fetch)
    const { translateLines } = await service()
    await expect(translateLines(['そして耳を塞いでも', '今 貴方と奏でよう'], 'EN-US'))
      .rejects.toThrow('Unavailable')
    expect(fetch).toHaveBeenCalledTimes(1)
  })

  it('does not cache or publish an aborted passage translation', async () => {
    let respond!: (response: Response) => void
    const fetch = vi.fn(() => new Promise<Response>((resolve) => { respond = resolve }))
    vi.stubGlobal('fetch', fetch)
    const { translateLines } = await service()
    const source = ['今 貴方と奏でよう', '此処に貴方と居るコト']
    const controller = new AbortController()
    const work = translateLines(source, 'EN-US', controller.signal)
    controller.abort()
    respond(Response.json({ text: 'Obsolete translation' }))
    await expect(work).rejects.toMatchObject({ name: 'AbortError' })
    expect(fetch).toHaveBeenCalledTimes(1)
    fetch.mockResolvedValueOnce(Response.json({ text: 'Current translation' }))
    expect(await translateLines(source, 'EN-US')).toMatchObject({ text: 'Current translation', provider: 'DeepL' })
    expect(fetch).toHaveBeenCalledTimes(2)
  })

  it('keeps adjacent lines together when a long passage must be chunked', async () => {
    const source = Array.from({ length: 30 }, () => '猫が好きです。'.repeat(8))
    const fetch = vi.fn(async (url: string) => {
      const text = new URL(url, 'http://localhost').searchParams.get('text')!
      expect(new TextEncoder().encode(text).length).toBeLessThanOrEqual(2400)
      expect(text).toContain('\n')
      return Response.json({ text: text.split('\n').map(() => 'I like cats.').join('\n') })
    })
    vi.stubGlobal('fetch', fetch)
    const { translateLines } = await service()
    const result = await translateLines(source, 'EN-US')
    expect(fetch.mock.calls.length).toBeGreaterThan(1)
    expect(fetch.mock.calls.length).toBeLessThan(source.length)
    expect(result.text.split('\n')).toEqual(source.map(() => 'I like cats.'))
    const indices = result.groups!.flatMap(group =>
      Array.from({ length: group.end - group.start + 1 }, (_, i) => group.start + i))
    expect(indices).toEqual(source.map((_, i) => i))
  })

  it('rejects structured responses that duplicate or omit translated words', async () => {
    const fetch = vi.fn(async () => Response.json({ text: 'Cat.\nDog.', groups: [
      { start: 0, end: 0, text: 'Cat.' }, { start: 1, end: 1, text: 'Cat.' },
    ] }))
    vi.stubGlobal('fetch', fetch)
    const { translateLines } = await service()
    await expect(translateLines(['猫。', '犬。'], 'EN-US')).rejects.toThrow('incomplete lyric groups')
    expect(fetch).toHaveBeenCalledTimes(1)
  })

  it('chunks an oversized line within provider limits', async () => {
    const fetch = vi.fn(async (url: string) => {
      const text = new URL(url, 'http://localhost').searchParams.get('text')!
      expect(new TextEncoder().encode(text).length).toBeLessThanOrEqual(2400)
      return Response.json({ text: 'Translated piece' })
    })
    vi.stubGlobal('fetch', fetch)
    const { translateLines } = await service()
    expect(await translateLines(['あ'.repeat(1000)], 'EN-US')).toMatchObject({
      text: 'Translated piece Translated piece', lines: ['Translated piece Translated piece'], provider: 'DeepL',
    })
    expect(fetch).toHaveBeenCalledTimes(2)
  })
})
