// Translation target languages: which ones exist, which one fits the visitor,
// and how to name and search them. Codes are DeepL's (ES, PT-BR, ZH-HANS…).

export type Language = { code: string; name: string }

/** DeepL target languages known to exist, for when the live list (/api/languages) isn't available. */
export const FALLBACK_LANGUAGES: Language[] = ([
  ['AR', 'Arabic'], ['BG', 'Bulgarian'], ['CS', 'Czech'], ['DA', 'Danish'], ['DE', 'German'], ['EL', 'Greek'],
  ['EN-GB', 'English (British)'], ['EN-US', 'English (American)'], ['ES', 'Spanish'], ['ET', 'Estonian'],
  ['FI', 'Finnish'], ['FR', 'French'], ['HU', 'Hungarian'], ['ID', 'Indonesian'], ['IT', 'Italian'], ['KO', 'Korean'],
  ['LT', 'Lithuanian'], ['LV', 'Latvian'], ['NB', 'Norwegian (Bokmål)'], ['NL', 'Dutch'], ['PL', 'Polish'],
  ['PT-BR', 'Portuguese (Brazilian)'], ['PT-PT', 'Portuguese (European)'], ['RO', 'Romanian'], ['RU', 'Russian'],
  ['SK', 'Slovak'], ['SL', 'Slovenian'], ['SV', 'Swedish'], ['TR', 'Turkish'], ['UK', 'Ukrainian'],
  ['ZH-HANS', 'Chinese (simplified)'], ['ZH-HANT', 'Chinese (traditional)'],
] satisfies [string, string][]).map(([code, name]) => ({ code, name }))

export const ENGLISH = 'EN-US'

const LATAM = ['ES-419', 'ES']
const FRANCOPHONE = ['FR']
const ARABIC = ['AR']

// Country (ISO 3166-1) → its languages, most widely used first. Several codes
// for one language (ES-419, ES) mean "the first one DeepL offers".
// Countries left out (Japan among them) fall back to the browser's language.
const COUNTRY_LANGUAGES: Record<string, string[]> = {
  ...Object.fromEntries(
    ['AR', 'BO', 'CL', 'CO', 'CR', 'CU', 'DO', 'EC', 'GT', 'HN', 'MX', 'NI', 'PA', 'PE', 'PR', 'PY', 'SV', 'UY', 'VE'].map(
      (c) => [c, LATAM],
    ),
  ),
  ...Object.fromEntries(
    ['FR', 'MC', 'SN', 'CI', 'ML', 'BF', 'NE', 'TG', 'BJ', 'GN', 'CD', 'CG', 'CM', 'GA', 'MG', 'HT', 'BI'].map((c) => [
      c,
      FRANCOPHONE,
    ]),
  ),
  ...Object.fromEntries(
    ['SA', 'AE', 'EG', 'IQ', 'JO', 'KW', 'LB', 'LY', 'OM', 'QA', 'SY', 'YE', 'BH', 'SD', 'PS', 'MR'].map((c) => [c, ARABIC]),
  ),
  ...Object.fromEntries(['PT', 'AO', 'MZ', 'CV', 'GW', 'ST', 'TL'].map((c) => [c, ['PT-PT']])),
  ...Object.fromEntries(['GB', 'IE', 'AU', 'NZ', 'ZA', 'IN', 'NG', 'KE', 'GH', 'JM', 'MT'].map((c) => [c, ['EN-GB']])),
  ...Object.fromEntries(['DE', 'AT', 'LI'].map((c) => [c, ['DE']])),
  ...Object.fromEntries(['IT', 'SM', 'VA'].map((c) => [c, ['IT']])),
  ...Object.fromEntries(['RU', 'BY', 'KZ', 'KG'].map((c) => [c, ['RU']])),
  ...Object.fromEntries(['TW', 'HK', 'MO'].map((c) => [c, ['ZH-HANT']])),
  ES: ['ES'],
  GQ: ['ES'],
  BR: ['PT-BR'],
  US: ['EN-US'],
  PH: ['EN-US'],
  CA: ['EN-US', 'FR'],
  SG: ['EN-GB', 'ZH-HANS'],
  BE: ['NL', 'FR', 'DE'],
  CH: ['DE', 'FR', 'IT'],
  LU: ['FR', 'DE'],
  NL: ['NL'],
  SR: ['NL'],
  DZ: ['AR', 'FR'],
  MA: ['AR', 'FR'],
  TN: ['AR', 'FR'],
  BG: ['BG'],
  CZ: ['CS'],
  DK: ['DA'],
  GR: ['EL'],
  CY: ['EL', 'TR'],
  EE: ['ET'],
  FI: ['FI', 'SV'],
  HU: ['HU'],
  ID: ['ID'],
  KR: ['KO'],
  KP: ['KO'],
  LT: ['LT'],
  LV: ['LV'],
  NO: ['NB'],
  PL: ['PL'],
  RO: ['RO'],
  MD: ['RO', 'RU'],
  SK: ['SK'],
  SI: ['SL'],
  SE: ['SV'],
  TR: ['TR'],
  UA: ['UK'],
  CN: ['ZH-HANS'],
  IL: ['HE'],
  TH: ['TH'],
  VN: ['VI'],
}

const base = (code: string) => code.split('-')[0]!.toUpperCase()

/** A browser language tag (es-MX, pt, zh-TW) → DeepL codes to try, best first. */
function fromBrowser(tag: string): string[] {
  const [lang = '', ...rest] = tag.toLowerCase().split('-')
  const region = rest.join('-')
  switch (lang) {
    case 'ja':
      return []
    case 'en':
      return /gb|ie|au|nz|za|in/.test(region) ? ['EN-GB'] : ['EN-US']
    case 'pt':
      return region === 'br' || !region ? ['PT-BR', 'PT-PT'] : ['PT-PT']
    case 'es':
      return !region || region === 'es' ? ['ES'] : LATAM
    case 'zh':
      return /hant|tw|hk|mo/.test(region) ? ['ZH-HANT'] : ['ZH-HANS']
    case 'no':
    case 'nn':
    case 'nb':
      return ['NB']
    case 'iw':
      return ['HE']
    default:
      return [lang.toUpperCase()]
  }
}

/**
 * The language to translate into for a visitor: one of their country's
 * languages (the one their browser prefers, if it is among them), otherwise
 * their browser's language, otherwise English. Never Japanese.
 */
export function pickLanguage(country: string | undefined, browser: readonly string[], supported: Set<string>): string {
  const available = (codes: string[]) => codes.filter((c) => supported.has(c) && base(c) !== 'JA')
  const local = available(COUNTRY_LANGUAGES[country?.toUpperCase() ?? ''] ?? [])
  if (local.length) {
    const preferred = browser.flatMap(fromBrowser).find((b) => local.some((c) => base(c) === base(b)))
    // Within the language the browser prefers, keep the country's variant (es-ES browser in Mexico → ES-419).
    return (preferred && local.find((c) => base(c) === base(preferred))) ?? local[0]!
  }
  return available(browser.flatMap(fromBrowser))[0] ?? ENGLISH
}

/** DeepL code → BCP 47 tag, for Intl and Google Translate links: ZH-HANS → zh-Hans, PT-BR → pt-BR. */
export function toTag(code: string): string {
  const [lang = '', sub] = code.split('-')
  if (!sub) return lang.toLowerCase()
  return `${lang.toLowerCase()}-${sub.length === 4 ? sub[0] + sub.slice(1).toLowerCase() : sub}`
}

const GOOGLE: Record<string, string> = { 'zh-Hans': 'zh-CN', 'zh-Hant': 'zh-TW', 'es-419': 'es', 'en-US': 'en', 'en-GB': 'en', 'pt-PT': 'pt', nb: 'no' }
export const googleCode = (code: string) => GOOGLE[toTag(code)] ?? toTag(code)

const capitalize = (s: string, tag: string) => s.charAt(0).toLocaleUpperCase(tag) + s.slice(1)

/** The language's own name for itself: ES → Español, ZH-HANS → 简体中文. */
export function nativeName(code: string): string {
  const tag = toTag(code)
  try {
    return capitalize(new Intl.DisplayNames([tag], { type: 'language' }).of(tag) ?? code, tag)
  } catch {
    return code
  }
}

const fold = (s: string) => s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()

/** Languages whose code, English name or own name contain the query (accents and case ignored). */
export function filterLanguages(query: string, languages: Language[], limit = 8): Language[] {
  const q = fold(query.trim())
  if (!q) return []
  const score = (l: Language) => {
    const names = [l.code, l.name, nativeName(l.code)].map(fold)
    if (names.some((n) => n === q)) return 0
    if (names.some((n) => n.startsWith(q) || n.split(/[\s(]+/).some((w) => w.startsWith(q)))) return 1
    return names.some((n) => n.includes(q)) ? 2 : -1
  }
  return languages
    .map((l) => [l, score(l)] as const)
    .filter(([, s]) => s >= 0)
    .sort((a, b) => a[1] - b[1] || a[0].name.localeCompare(b[0].name))
    .slice(0, limit)
    .map(([l]) => l)
}

const getJSON = async <T,>(path: string): Promise<T | undefined> => {
  try {
    const res = await fetch(`/${path}`, { signal: AbortSignal.timeout(2500) })
    // Without the Vercel functions (GitHub Pages, vite dev) this is an HTML page.
    if (!res.ok || !res.headers.get('content-type')?.includes('json')) return undefined
    return (await res.json()) as T
  } catch {
    return undefined
  }
}

/** The languages DeepL offers (live list when the function is there) and the one that fits this visitor. */
export async function detectLanguages(): Promise<{ languages: Language[]; detected: string }> {
  const [locale, live] = await Promise.all([
    getJSON<{ country?: string | null }>('api/reader/locale'),
    getJSON<{ languages?: Language[] }>('api/reader/languages'),
  ])
  const languages = (live?.languages?.length ? live.languages : FALLBACK_LANGUAGES).filter((l) => base(l.code) !== 'JA')
  const detected = pickLanguage(locale?.country ?? undefined, navigator.languages ?? [navigator.language], new Set(languages.map((l) => l.code)))
  return { languages, detected }
}
