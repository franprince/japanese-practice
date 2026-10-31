import { afterEach, describe, expect, it } from 'bun:test'
import { fetchSpotifyInfo, fetchSpotifyLyrics, parseLrc, parseSpotifyLink } from '../lib/spotify'
import { chunk } from '../lib/translate'
import { vi } from './vi'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('parseSpotifyLink', () => {
  const canonical = { kind: 'track', url: 'https://open.spotify.com/track/2hoKhipu6bG2FpYDXLUk7v' }
  it('normalizes shared links and URIs', () => {
    expect(parseSpotifyLink('https://open.spotify.com/track/2hoKhipu6bG2FpYDXLUk7v?si=fe8d9461283941a8')).toEqual(canonical)
    expect(parseSpotifyLink('  https://open.spotify.com/intl-ja/track/2hoKhipu6bG2FpYDXLUk7v ')).toEqual(canonical)
    expect(parseSpotifyLink('spotify:track:2hoKhipu6bG2FpYDXLUk7v')).toEqual(canonical)
    expect(parseSpotifyLink('https://open.spotify.com/album/2hoKhipu6bG2FpYDXLUk7v')?.kind).toBe('album')
  })
  it('ignores anything that is not just a Spotify link', () => {
    expect(parseSpotifyLink('listen: https://open.spotify.com/track/2hoKhipu6bG2FpYDXLUk7v')).toBeUndefined()
    expect(parseSpotifyLink('https://evil.example/track/2hoKhipu6bG2FpYDXLUk7v')).toBeUndefined()
    expect(parseSpotifyLink('https://open.spotify.com/track/short')).toBeUndefined()
    expect(parseSpotifyLink('花鬘')).toBeUndefined()
  })
})

describe('parseLrc', () => {
  it('strips timestamps and credit headers and inserts stanza breaks on long pauses', () => {
    const raw = [
      '[00:00.00] 作词 : 植田真梨恵',
      '[00:01.00]作詞：植田真梨恵',
      '[00:02.00]作曲：植田真梨恵',
      '[00:09.95]手放した 花びらが',
      '[00:19.51]音も無く 流れてく',
      '[00:49.29]そっと愛をしって',
      '[01:08.96]遠くなる あの日には もう',
    ].join('\n')

    expect(parseLrc(raw)).toBe(
      ['手放した 花びらが', '音も無く 流れてく', '', 'そっと愛をしって', '', '遠くなる あの日には もう'].join('\n'),
    )
  })

  it('preserves explicit blank lines from synced lyrics', () => {
    const raw = ['[00:05.00]一行目', '[00:08.00]', '[00:11.00]二行目'].join('\n')
    expect(parseLrc(raw)).toBe('一行目\n\n二行目')
  })

  it('drops LRC header tags, so the credits after them are still stripped', () => {
    const raw = ['[ti:花鬘]', '[ar:植田真梨恵]', '[offset:+200]', '[00:01.00]作词 : 植田真梨恵', '[00:09.95]手放した 花びらが'].join('\n')
    expect(parseLrc(raw)).toBe('手放した 花びらが')
  })

  it("drops NetEase's JSON credit rows and enhanced-LRC word timings", () => {
    const raw = ['{"t":0,"c":[{"tx":"作词: "},{"tx":"植田真梨恵"}]}', '[00:09.95]<00:09.95>手放した <00:11.00>花びらが'].join('\n')
    expect(parseLrc(raw)).toBe('手放した 花びらが')
  })

  it('strips any leading `label : name` credits, in Chinese or English too, but keeps lyrics with colons later', () => {
    const raw = [
      '[00:00.00] 制作人 : Ayase',
      '[00:00.50] 作詞 : Ayase',
      '[00:01.00] Produced by: Ayase',
      '[00:02.00] 沈むように溶けてゆくように',
      '[00:05.00] 理由：君がいたから',
    ].join('\n')
    expect(parseLrc(raw)).toBe('沈むように溶けてゆくように\n理由：君がいたから')
  })

  it('keeps a first lyric line that has a colon after kana', () => {
    expect(parseLrc('[00:01.00]ねえ：聞いて')).toBe('ねえ：聞いて')
  })

  it('repeats a line stamped for several moments, in time order', () => {
    const raw = ['[00:01.00][00:07.00]サビ', '[00:04.00]一番', '[00:10.00]二番'].join('\n')
    expect(parseLrc(raw)).toBe('サビ\n一番\nサビ\n二番')
  })
})

describe('fetchSpotifyInfo', () => {
  const link = { kind: 'track', url: 'https://open.spotify.com/track/2hoKhipu6bG2FpYDXLUk7v' }

  it('reads track title and artist from /api/reader/spotify', async () => {
    const fetch = vi.fn().mockResolvedValue(
      Response.json({ title: '花鬘', artist: '植田真梨恵', thumbnail: 'https://i.scdn.co/x' }),
    )
    vi.stubGlobal('fetch', fetch)
    expect(await fetchSpotifyInfo(link)).toEqual({ title: '花鬘', artist: '植田真梨恵', thumbnail: 'https://i.scdn.co/x' })
    expect(fetch.mock.calls[0]![0]).toBe(`/api/reader/spotify?url=${encodeURIComponent(link.url)}`)
  })

  it("asks Spotify directly when our function isn't there", async () => {
    const fetch = vi.fn().mockImplementation((input: string) =>
      Promise.resolve(
        input.startsWith('/api/')
          ? new Response('<html></html>', { status: 404, headers: { 'content-type': 'text/html' } })
          : Response.json({ title: '花鬘', thumbnail_url: 'https://i.scdn.co/x' }),
      ),
    )
    vi.stubGlobal('fetch', fetch)
    expect(await fetchSpotifyInfo(link)).toEqual({ title: '花鬘', thumbnail: 'https://i.scdn.co/x' })
    expect(fetch.mock.calls[1]![0]).toStartWith('https://open.spotify.com/oembed?url=')
  })

  it("reports our function's error instead of retrying Spotify directly", async () => {
    const fetch = vi.fn().mockResolvedValue(Response.json({ error: 'Spotify answered 500' }, { status: 502 }))
    vi.stubGlobal('fetch', fetch)
    await expect(fetchSpotifyInfo(link)).rejects.toThrow('Spotify answered 500')
    expect(fetch).toHaveBeenCalledTimes(1)
  })
})

describe('fetchSpotifyLyrics', () => {
  const link = { kind: 'track', url: 'https://open.spotify.com/track/2hoKhipu6bG2FpYDXLUk7v' }

  it('asks our function for the lyrics', async () => {
    const fetch = vi.fn().mockResolvedValue(Response.json({ lyrics: '手放した 花びらが\n' }))
    vi.stubGlobal('fetch', fetch)
    expect(await fetchSpotifyLyrics(link)).toBe('手放した 花びらが')
    expect(fetch.mock.calls[0]![0]).toBe(`/api/reader/spotify?url=${encodeURIComponent(link.url)}&lyrics=1`)
  })

  it('returns undefined when no source has them', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({})))
    expect(await fetchSpotifyLyrics(link)).toBeUndefined()
  })

  it('fails clearly without our function', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('<html></html>', { headers: { 'content-type': 'text/html' } })))
    await expect(fetchSpotifyLyrics(link)).rejects.toThrow('Lyrics are not available on this site')
  })
})

describe('chunk', () => {
  const bytes = (s: string) => new TextEncoder().encode(s).length
  it('keeps short text whole', () => {
    expect(chunk('花鬘')).toEqual(['花鬘'])
    expect(chunk('   ')).toEqual([])
  })
  it('splits long text at sentence ends, under the byte limit, without losing text', () => {
    const text = '私は昨日、図書館で日本語の本を読んでいました。'.repeat(20)
    const parts = chunk(text)
    expect(parts.length).toBeGreaterThan(1)
    expect(Math.max(...parts.map(bytes))).toBeLessThanOrEqual(500)
    expect(parts.join('')).toBe(text)
    expect(parts.every((p) => p.endsWith('。'))).toBe(true)
  })
  it('splits text with no punctuation anywhere', () => {
    const text = 'あ'.repeat(400)
    expect(chunk(text).join('')).toBe(text)
    expect(Math.max(...chunk(text).map(bytes))).toBeLessThanOrEqual(500)
  })
})
