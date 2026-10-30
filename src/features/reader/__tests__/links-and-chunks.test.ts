import { afterEach, describe, expect, it } from 'bun:test'
import { fetchSpotifyInfo, parseLrc, parseSpotifyLink } from '../lib/spotify'
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
})

describe('fetchSpotifyInfo', () => {
  it('reads track title, artist and lyrics from /api/reader/spotify', async () => {
    const fetch = vi.fn().mockResolvedValue(
      Response.json({
        title: '花鬘',
        artist: '植田真梨恵',
        thumbnail: 'https://i.scdn.co/x',
        lyrics: '手放した 花びらが\n音も無く 流れてく',
      }),
    )
    vi.stubGlobal('fetch', fetch)
    const link = { kind: 'track', url: 'https://open.spotify.com/track/2hoKhipu6bG2FpYDXLUk7v' }
    expect(await fetchSpotifyInfo(link)).toEqual({
      title: '花鬘',
      artist: '植田真梨恵',
      thumbnail: 'https://i.scdn.co/x',
      lyrics: '手放した 花びらが\n音も無く 流れてく',
    })
    expect(fetch.mock.calls[0]![0]).toBe(
      `/api/reader/spotify?url=${encodeURIComponent(link.url)}`,
    )
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
