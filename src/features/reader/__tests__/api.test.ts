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
})
