// The Vercel functions, with Spotify and DeepL replaced by fake responses.
import { afterEach, describe, expect, it} from 'bun:test'
import { vi } from './vi'
import { GET as languages } from '../../../../app/api/reader/languages/route'
import { GET as locale } from '../../../../app/api/reader/locale/route'
import { GET as spotify } from '../../../../app/api/reader/spotify/route'
import { GET as translate } from '../../../../app/api/reader/translate/route'

const call = (handler: (r: Request) => Promise<Response>, path: string) =>
  handler(new Request(`https://site.example${path}`)).then(async (r) => ({ status: r.status, body: await r.json() }))

afterEach(() => {
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
})

describe('api/translate', () => {
  it('needs the DEEPL_API_KEY variable', async () => {
    vi.stubEnv('DEEPL_API_KEY', '')
    expect((await call(translate, '/api/translate?text=花鬘')).status).toBe(501)
  })

  it('sends free-plan keys to api-free.deepl.com and returns the text', async () => {
    vi.stubEnv('DEEPL_API_KEY', 'key:fx')
    const fetch = vi.fn().mockResolvedValue(Response.json({ translations: [{ text: 'Flower garland' }] }))
    vi.stubGlobal('fetch', fetch)
    expect(await call(translate, '/api/translate?text=花鬘')).toEqual({ status: 200, body: { text: 'Flower garland' } })
    const [url, init] = fetch.mock.calls[0]!
    expect(url).toBe('https://api-free.deepl.com/v2/translate')
    expect(init.headers.Authorization).toBe('DeepL-Auth-Key key:fx')
    expect(JSON.parse(init.body)).toEqual({
      text: ['花鬘'], source_lang: 'JA', target_lang: 'EN-US',
      split_sentences: 'nonewlines', preserve_formatting: true,
    })
  })

  it('keeps lyrics in one text and does not split sentences at lyric line breaks', async () => {
    vi.stubEnv('DEEPL_API_KEY', 'key:fx')
    const source = '昨日、猫を見た。\nとても可愛かった。'
    const fetch = vi.fn().mockResolvedValue(Response.json({
      translations: [{ text: 'Yesterday I saw a cat.\nIt was very cute.' }],
    }))
    vi.stubGlobal('fetch', fetch)
    const response = await call(translate, `/api/translate?text=${encodeURIComponent(source)}`)
    expect(response.body).toEqual({ text: 'Yesterday I saw a cat.\nIt was very cute.' })
    expect(JSON.parse(fetch.mock.calls[0]![1].body)).toMatchObject({
      text: [source], split_sentences: 'nonewlines', preserve_formatting: true,
    })
    expect(fetch).toHaveBeenCalledTimes(1)
  })

  it('translates into the requested language', async () => {
    vi.stubEnv('DEEPL_API_KEY', 'key:fx')
    const fetch = vi.fn().mockResolvedValue(Response.json({ translations: [{ text: 'Guirnalda de flores' }] }))
    vi.stubGlobal('fetch', fetch)
    expect((await call(translate, '/api/translate?text=花鬘&to=es')).body).toEqual({ text: 'Guirnalda de flores' })
    expect(JSON.parse(fetch.mock.calls[0]![1].body).target_lang).toBe('ES')
  })

  it('keeps plain passage context and groups added target line breaks', async () => {
    vi.stubEnv('DEEPL_API_KEY', 'key:fx')
    const source = 'そこに行けば どんな夢も\nかなうというよ'
    const fetch = vi.fn().mockResolvedValue(Response.json({ translations: [{
      text: 'Si vas allí,\ncualquier sueño\nse hará realidad.',
    }] }))
    vi.stubGlobal('fetch', fetch)
    expect((await call(translate, `/api/translate?text=${encodeURIComponent(source)}&to=ES&format=lines`)).body)
      .toEqual({
        text: 'Si vas allí,\ncualquier sueño\nse hará realidad.',
        groups: [{ start: 0, end: 1, text: 'Si vas allí,\ncualquier sueño\nse hará realidad.' }],
      })
    expect(JSON.parse(fetch.mock.calls[0]![1].body)).toEqual({
      text: [source],
      source_lang: 'JA', target_lang: 'ES', split_sentences: 'nonewlines', preserve_formatting: true,
    })
    expect(fetch).toHaveBeenCalledTimes(1)
  })

  it('retains blank edge lines in structured chunk indices', async () => {
    vi.stubEnv('DEEPL_API_KEY', 'key:fx')
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ translations: [{
      text: 'Cat',
    }] })))
    expect((await call(translate, '/api/translate?text=%0A猫%0A&format=lines')).body.groups)
      .toEqual([{ start: 0, end: 0, text: '' }, { start: 1, end: 1, text: 'Cat' },
        { start: 2, end: 2, text: '' }])
  })

  it('returns a provider error instead of accepting empty translation output', async () => {
    vi.stubEnv('DEEPL_API_KEY', 'key:fx')
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ translations: [{ text: '  \n' }] })))
    expect(await call(translate, '/api/translate?text=猫&format=lines'))
      .toEqual({ status: 502, body: { error: 'DeepL sent no translation' } })
  })

  it('rejects unknown or Japanese targets', async () => {
    vi.stubEnv('DEEPL_API_KEY', 'key:fx')
    const fetch = vi.fn()
    vi.stubGlobal('fetch', fetch)
    for (const to of ['JA', 'english', 'E', 'ZH-HANS-X']) {
      expect((await call(translate, `/api/translate?text=花鬘&to=${to}`)).status).toBe(400)
    }
    expect(fetch).not.toHaveBeenCalled()
  })

  it('uses api.deepl.com for paid keys', async () => {
    vi.stubEnv('DEEPL_API_KEY', 'key')
    const fetch = vi.fn().mockResolvedValue(Response.json({ translations: [{ text: 'x' }] }))
    vi.stubGlobal('fetch', fetch)
    await call(translate, '/api/translate?text=猫')
    expect(fetch.mock.calls[0]![0]).toBe('https://api.deepl.com/v2/translate')
  })

  it('only takes short Japanese text', async () => {
    vi.stubEnv('DEEPL_API_KEY', 'key:fx')
    const fetch = vi.fn()
    vi.stubGlobal('fetch', fetch)
    for (const text of ['hello', 'あ'.repeat(1001), ' ']) {
      expect((await call(translate, `/api/translate?text=${encodeURIComponent(text)}`)).status).toBe(400)
    }
    expect(fetch).not.toHaveBeenCalled()
  })

  it('explains DeepL errors', async () => {
    vi.stubEnv('DEEPL_API_KEY', 'key:fx')
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status: 456 })))
    expect(await call(translate, '/api/translate?text=花鬘')).toEqual({
      status: 502,
      body: { error: 'the DeepL monthly quota is used up' },
    })
  })

  it('gives up on DeepL after a few seconds', async () => {
    vi.stubEnv('DEEPL_API_KEY', 'key:fx')
    const fetch = vi.fn().mockRejectedValue(new DOMException('The operation timed out.', 'TimeoutError'))
    vi.stubGlobal('fetch', fetch)
    expect(await call(translate, '/api/translate?text=花鬘')).toEqual({
      status: 504,
      body: { error: 'DeepL took too long to answer' },
    })
    expect(fetch.mock.calls[0]![1].signal).toBeInstanceOf(AbortSignal)
  })

  it('reports an unreachable DeepL', async () => {
    vi.stubEnv('DEEPL_API_KEY', 'key:fx')
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('fetch failed')))
    expect(await call(translate, '/api/translate?text=花鬘')).toEqual({
      status: 502,
      body: { error: "DeepL couldn't be reached" },
    })
  })

  it('treats a non-JSON DeepL answer as no translation', async () => {
    vi.stubEnv('DEEPL_API_KEY', 'key:fx')
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('<html>busy</html>')))
    expect(await call(translate, '/api/translate?text=花鬘')).toEqual({
      status: 502,
      body: { error: 'DeepL sent no translation' },
    })
  })
})

describe('api/spotify', () => {
  it('returns the oEmbed title', async () => {
    const fetch = vi.fn().mockResolvedValue(Response.json({ title: '花鬘', thumbnail_url: 'https://i.scdn.co/x' }))
    vi.stubGlobal('fetch', fetch)
    const url = encodeURIComponent('https://open.spotify.com/track/2hoKhipu6bG2FpYDXLUk7v')
    expect(await call(spotify, `/api/spotify?url=${url}`)).toEqual({
      status: 200,
      body: { title: '花鬘', thumbnail: 'https://i.scdn.co/x' },
    })
    expect(fetch.mock.calls[0]![0]).toBe(`https://open.spotify.com/oembed?url=${url}`)
  })

  const embed = (entity: object) =>
    new Response(
      `<script id="__NEXT_DATA__" type="application/json">${JSON.stringify({ props: { pageProps: { state: { data: { entity } } } } })}</script>`,
    )
  const yoasobi = { title: '夜に駆ける', artists: [{ name: 'YOASOBI' }], duration: 261000 }
  const yoasobiUrl = encodeURIComponent('https://open.spotify.com/track/3dPtXHP0oXQ4HCWHsOA9js')

  /** A fake upstream: the first matching prefix answers, everything else is a 404. */
  const upstream = (routes: Record<string, () => Response | Promise<Response>>) =>
    vi.fn().mockImplementation((input: string) => {
      const hit = Object.keys(routes).find((prefix) => input.startsWith(prefix))
      return Promise.resolve(hit ? routes[hit]!() : new Response('', { status: 404 }))
    })

  it('adds the artist to a track without looking up lyrics', async () => {
    const fetch = upstream({
      'https://open.spotify.com/oembed': () => Response.json({ title: '夜に駆ける', thumbnail_url: 'https://i.scdn.co/y' }),
      'https://open.spotify.com/embed/track/': () => embed(yoasobi),
    })
    vi.stubGlobal('fetch', fetch)
    expect(await call(spotify, `/api/spotify?url=${yoasobiUrl}`)).toEqual({
      status: 200,
      body: { title: '夜に駆ける', artist: 'YOASOBI', thumbnail: 'https://i.scdn.co/y' },
    })
    expect(fetch.mock.calls.some(([input]) => !String(input).startsWith('https://open.spotify.com/'))).toBe(false)
  })

  it('returns plain lyrics from LRCLIB when asked for them', async () => {
    vi.stubEnv('LRCLIB_API_KEY', '')
    const fetch = upstream({
      'https://open.spotify.com/embed/track/': () => embed(yoasobi),
      'https://lrclib.net/api/get?': () =>
        Response.json({ trackName: '夜に駆ける', artistName: 'YOASOBI', plainLyrics: '沈むように溶けてゆくように\r\n二人だけの空が広がる夜に' }),
    })
    vi.stubGlobal('fetch', fetch)
    const res = await spotify(new Request(`https://site.example/api/spotify?url=${yoasobiUrl}&lyrics=1`))
    expect(await res.json()).toEqual({ lyrics: '沈むように溶けてゆくように\n二人だけの空が広がる夜に' })
    const [, init] = fetch.mock.calls.find(([input]) => String(input).startsWith('https://lrclib.net/api/get'))!
    expect(init.headers['User-Agent']).toBe('nihongo-renshuu (https://www.nihongo-renshuu.app/reader)')
    expect(init.headers['Lrclib-App-Id']).toBeTruthy()
    expect(init.headers['Lrclib-Api-Key']).toBeUndefined()
    expect(res.headers.get('cache-control')).toContain('s-maxage=86400')
    expect(fetch.mock.calls.some(([input]) => String(input).startsWith('https://open.spotify.com/oembed'))).toBe(false)
  })

  it('sends the LRCLIB server key instead of the app ID when one is set', async () => {
    vi.stubEnv('LRCLIB_API_KEY', 'secret')
    const fetch = upstream({ 'https://open.spotify.com/embed/track/': () => embed(yoasobi) })
    vi.stubGlobal('fetch', fetch)
    await call(spotify, `/api/spotify?url=${yoasobiUrl}&lyrics=1`)
    const [, init] = fetch.mock.calls.find(([input]) => String(input).startsWith('https://lrclib.net/'))!
    expect(init.headers['Lrclib-Api-Key']).toBe('secret')
    expect(init.headers['Lrclib-App-Id']).toBeUndefined()
  })

  it('ignores LRCLIB search results for other songs and caches the miss only briefly', async () => {
    vi.stubGlobal('fetch', upstream({
      'https://open.spotify.com/embed/track/': () => embed(yoasobi),
      'https://lrclib.net/api/search?': () =>
        Response.json([
          { trackName: '夜に駆ける (Cover)', artistName: 'Someone', plainLyrics: 'wrong' },
          { trackName: '夜に駆ける', artistName: 'Someone Else', plainLyrics: 'also wrong' },
        ]),
    }))
    const res = await spotify(new Request(`https://site.example/api/spotify?url=${yoasobiUrl}&lyrics=1`))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({})
    expect(res.headers.get('cache-control')).toBe('public, s-maxage=600')
  })

  it('takes a LRCLIB search result by the same artist', async () => {
    vi.stubGlobal('fetch', upstream({
      'https://open.spotify.com/embed/track/': () => embed(yoasobi),
      'https://lrclib.net/api/search?': () =>
        Response.json([
          { trackName: '夜に駆ける', artistName: 'Someone Else', plainLyrics: 'wrong' },
          { trackName: '夜に駆ける', artistName: 'YOASOBI', syncedLyrics: '[00:01.00]沈むように' },
        ]),
    }))
    expect(await call(spotify, `/api/spotify?url=${yoasobiUrl}&lyrics=1`)).toEqual({ status: 200, body: { lyrics: '沈むように' } })
  })

  it('falls back to NetEase LRC lyrics when LRCLIB is down', async () => {
    vi.stubGlobal('fetch', upstream({
      'https://open.spotify.com/embed/track/': () => embed({ title: '花鬘', artists: [{ name: '植田真梨恵' }], duration: 279551 }),
      'https://lrclib.net/': () => Promise.reject(new DOMException('timed out', 'TimeoutError')),
      'https://music.163.com/api/search/get': () =>
        Response.json({
          result: {
            songs: [
              { id: 1, name: '花鬘', artists: [{ name: 'Cover Band' }] },
              { id: 1365032009, name: '花鬘', artists: [{ name: '植田真梨恵' }] },
            ],
          },
        }),
      'https://music.163.com/api/song/lyric?id=1365032009': () =>
        Response.json({ lrc: { lyric: '[ar:植田真梨恵]\n[00:01.00]作詞：植田真梨恵\n[00:09.95]手放した 花びらが\n[00:19.51]音も無く 流れてく' } }),
    }))
    const url = encodeURIComponent('https://open.spotify.com/track/2hoKhipu6bG2FpYDXLUk7v')
    expect(await call(spotify, `/api/spotify?url=${url}&lyrics=1`)).toEqual({
      status: 200,
      body: { lyrics: '手放した 花びらが\n音も無く 流れてく' },
    })
  })

  it("matches the artist under Spotify's Japanese name as well as its romanized one", async () => {
    // Spotify names the artist Leo Ieiri by default and 家入レオ with locale=ja; NetEase only knows the latter.
    const fetch = upstream({
      'https://open.spotify.com/embed/track/6KcVn17IwE2D4HqZ70yYUL?locale=ja': () =>
        embed({ title: 'Pain', artists: [{ name: '家入レオ' }], duration: 236000 }),
      'https://open.spotify.com/embed/track/': () => embed({ title: 'Pain', artists: [{ name: 'Leo Ieiri' }], duration: 236000 }),
      'https://music.163.com/api/search/get': () =>
        Response.json({
          result: {
            songs: [
              { id: 1984693780, name: 'Pain', artists: [{ name: '家入レオ' }] },
              { id: 2022415806, name: 'Pain', artists: [{ name: '家入レオ' }] },
            ],
          },
        }),
      // The first copy has no lyrics; the album one does.
      'https://music.163.com/api/song/lyric?id=1984693780': () => Response.json({ lrc: { lyric: '' } }),
      'https://music.163.com/api/song/lyric?id=2022415806': () => Response.json({ lrc: { lyric: '[00:10.00]痛みを抱えて' } }),
    })
    vi.stubGlobal('fetch', fetch)
    const url = encodeURIComponent('https://open.spotify.com/track/6KcVn17IwE2D4HqZ70yYUL')
    expect(await call(spotify, `/api/spotify?url=${url}&lyrics=1`)).toEqual({ status: 200, body: { lyrics: '痛みを抱えて' } })
    const lrclib = fetch.mock.calls.map(([input]) => String(input)).filter((u) => u.startsWith('https://lrclib.net/api/get'))
    expect(lrclib.map((u) => new URL(u).searchParams.get('artist_name'))).toEqual(['家入レオ', 'Leo Ieiri'])
  })

  it('uses the oEmbed title for lyrics when the embed page cannot be read', async () => {
    const fetch = upstream({
      'https://open.spotify.com/oembed': () => Response.json({ title: '夜に駆ける' }),
      'https://lrclib.net/api/search?': () => Response.json([{ trackName: '夜に駆ける', plainLyrics: '沈むように' }]),
    })
    vi.stubGlobal('fetch', fetch)
    expect(await call(spotify, `/api/spotify?url=${yoasobiUrl}&lyrics=1`)).toEqual({ status: 200, body: { lyrics: '沈むように' } })
  })

  it('only looks up lyrics for songs', async () => {
    const fetch = vi.fn()
    vi.stubGlobal('fetch', fetch)
    const url = encodeURIComponent('https://open.spotify.com/album/2hoKhipu6bG2FpYDXLUk7v')
    expect((await call(spotify, `/api/spotify?url=${url}&lyrics=1`)).status).toBe(400)
    expect(fetch).not.toHaveBeenCalled()
  })

  it('refuses anything but canonical Spotify links', async () => {
    const fetch = vi.fn()
    vi.stubGlobal('fetch', fetch)
    for (const url of [
      'https://evil.example/track/2hoKhipu6bG2FpYDXLUk7v',
      'https://open.spotify.com/track/2hoKhipu6bG2FpYDXLUk7v@evil.example',
      'https://open.spotify.com/track/2hoKhipu6bG2FpYDXLUk7v?si=1',
    ]) {
      expect((await call(spotify, `/api/spotify?url=${encodeURIComponent(url)}`)).status).toBe(400)
    }
    expect(fetch).not.toHaveBeenCalled()
  })
})

describe('api/locale', () => {
  it("returns Vercel's country header, uncached", async () => {
    const res = locale(new Request('https://site.example/api/locale', { headers: { 'x-vercel-ip-country': 'AR' } }))
    expect(await res.json()).toEqual({ country: 'AR' })
    expect(res.headers.get('cache-control')).toBe('private, no-store')
    expect(await locale(new Request('https://site.example/api/locale')).json()).toEqual({ country: null })
  })
})

describe('api/languages', () => {
  it("returns DeepL's target languages", async () => {
    vi.stubEnv('DEEPL_API_KEY', 'key:fx')
    const fetch = vi.fn().mockResolvedValue(
      Response.json([
        { language: 'ES', name: 'Spanish', supports_formality: true },
        { language: 'ES-419', name: 'Spanish (Latin American)', supports_formality: true },
      ]),
    )
    vi.stubGlobal('fetch', fetch)
    const res = await languages()
    expect(await res.json()).toEqual({
      languages: [
        { code: 'ES', name: 'Spanish' },
        { code: 'ES-419', name: 'Spanish (Latin American)' },
      ],
    })
    expect(fetch.mock.calls[0]![0]).toBe('https://api-free.deepl.com/v2/languages?type=target')
  })

  it('needs the DEEPL_API_KEY variable', async () => {
    vi.stubEnv('DEEPL_API_KEY', '')
    expect((await languages()).status).toBe(501)
  })

  it('gives up on DeepL after a few seconds', async () => {
    vi.stubEnv('DEEPL_API_KEY', 'key:fx')
    const fetch = vi.fn().mockRejectedValue(new DOMException('The operation timed out.', 'TimeoutError'))
    vi.stubGlobal('fetch', fetch)
    const res = await languages()
    expect({ status: res.status, body: await res.json() }).toEqual({
      status: 504,
      body: { error: 'DeepL took too long to answer' },
    })
    expect(fetch.mock.calls[0]![1].signal).toBeInstanceOf(AbortSignal)
  })

  it('rejects a DeepL answer that is not a language list', async () => {
    vi.stubEnv('DEEPL_API_KEY', 'key:fx')
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('<html>busy</html>')))
    const res = await languages()
    expect({ status: res.status, body: await res.json() }).toEqual({
      status: 502,
      body: { error: 'DeepL sent no languages' },
    })
  })
})
