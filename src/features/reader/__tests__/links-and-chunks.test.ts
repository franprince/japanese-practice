import { describe, expect, it } from 'bun:test'
import { parseSpotifyLink } from '../lib/spotify'
import { chunk } from '../lib/translate'

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
