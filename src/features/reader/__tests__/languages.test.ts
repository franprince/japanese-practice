import { describe, expect, it } from 'bun:test'
import { FALLBACK_LANGUAGES, filterLanguages, googleCode, nativeName, pickLanguage, toTag } from '../lib/languages'

const deepl = new Set(FALLBACK_LANGUAGES.map((l) => l.code))
const withLatam = new Set([...deepl, 'ES-419', 'HE'])

describe('pickLanguage', () => {
  it("uses the country's language", () => {
    expect(pickLanguage('BR', ['en-US'], deepl)).toBe('PT-BR')
    expect(pickLanguage('DE', [], deepl)).toBe('DE')
    expect(pickLanguage('ua', [], deepl)).toBe('UK')
  })
  it('prefers the Latin American variant when DeepL offers it', () => {
    expect(pickLanguage('AR', ['es-AR'], deepl)).toBe('ES')
    expect(pickLanguage('AR', ['es-AR'], withLatam)).toBe('ES-419')
    expect(pickLanguage('MX', ['es-ES'], withLatam)).toBe('ES-419')
  })
  it("follows the browser among a multilingual country's languages", () => {
    expect(pickLanguage('CH', ['fr-CH', 'de'], deepl)).toBe('FR')
    expect(pickLanguage('CH', ['en-US'], deepl)).toBe('DE')
    expect(pickLanguage('CA', ['fr-CA'], deepl)).toBe('FR')
    expect(pickLanguage('BE', [], deepl)).toBe('NL')
  })
  it("skips languages DeepL doesn't offer", () => {
    expect(pickLanguage('IL', ['he'], deepl)).toBe('EN-US')
    expect(pickLanguage('IL', ['he'], withLatam)).toBe('HE')
  })
  it('falls back to the browser language, then English, never Japanese', () => {
    expect(pickLanguage(undefined, ['it-IT', 'en'], deepl)).toBe('IT')
    expect(pickLanguage('JP', ['ja-JP', 'ko'], deepl)).toBe('KO')
    expect(pickLanguage('JP', ['ja-JP'], deepl)).toBe('EN-US')
    expect(pickLanguage('XX', [], deepl)).toBe('EN-US')
    expect(pickLanguage(undefined, ['en-GB'], deepl)).toBe('EN-GB')
    expect(pickLanguage(undefined, ['zh-TW'], deepl)).toBe('ZH-HANT')
  })
})

describe('language names and codes', () => {
  it('names languages in their own language', () => {
    expect(nativeName('ES')).toBe('Español')
    expect(nativeName('DE')).toBe('Deutsch')
    expect(nativeName('PT-BR')).toBe('Português (Brasil)')
  })
  it('converts DeepL codes to BCP 47 and MyMemory codes', () => {
    expect(toTag('ZH-HANS')).toBe('zh-Hans')
    expect(toTag('ES-419')).toBe('es-419')
    expect(googleCode('ZH-HANT')).toBe('zh-TW')
    expect(googleCode('EN-US')).toBe('en')
    expect(googleCode('PT-BR')).toBe('pt-BR')
    expect(googleCode('NB')).toBe('no')
  })
  it('finds languages by English name, own name or code, ignoring accents', () => {
    expect(filterLanguages('ger', FALLBACK_LANGUAGES)[0]!.code).toBe('DE')
    expect(filterLanguages('deu', FALLBACK_LANGUAGES)[0]!.code).toBe('DE')
    expect(filterLanguages('espanol', FALLBACK_LANGUAGES)[0]!.code).toBe('ES')
    expect(filterLanguages('port', FALLBACK_LANGUAGES).map((l) => l.code)).toEqual(['PT-BR', 'PT-PT'])
    expect(filterLanguages('', FALLBACK_LANGUAGES)).toEqual([])
    expect(filterLanguages('zzz', FALLBACK_LANGUAGES)).toEqual([])
  })
})
