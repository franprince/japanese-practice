import { blacklist } from "../shared/blacklist";
import { loadWordSets, normalizeLang } from "./loader";
import { shuffleArray } from "@/lib/core/random";
import type { GameMode } from "@/types/game";
import {
  getCharacterGroups,
  getKanaRomajiMap,
  getCharacterGroupsSync,
  getKanaRomajiMapSync,
  type CharacterGroup as LoaderCharacterGroup
} from "../shared/kana-dictionary-loader";


import type { JapaneseWord, WordFilter, CharacterGroup } from "@/types/japanese"


export type { JapaneseWord, WordFilter, CharacterGroup } from "@/types/japanese"



export const characterGroups: CharacterGroup[] = getCharacterGroupsSync()


const getKanaRomajiMapInternal = (): Record<string, string> => getKanaRomajiMapSync()

const hasHiragana = (text: string) => /[\u3040-\u309F]/.test(text)
const hasKatakana = (text: string) => /[\u30A0-\u30FF]/.test(text)

const MOBILE_WORDSET_MAX = 1500
const filteredWordCache = new Map<string, JapaneseWord[]>()

const isMobileDevice = () => {
  if (typeof window === "undefined") return false
  if (window.matchMedia?.("(max-width: 768px)").matches) return true
  const ua = navigator.userAgent.toLowerCase()
  return /android|iphone|ipad|ipod|mobile|tablet/.test(ua)
}

const buildFilterKey = (type: GameMode, filter: WordFilter | undefined, lang: string, isMobile: boolean) => {
  if (!filter) return `${type}:${lang}:${isMobile ? "mobile" : "desktop"}:none`
  const sortedGroups = [...filter.selectedGroups].sort()
  return `${type}:${lang}:${isMobile ? "mobile" : "desktop"}:${filter.minLength}-${filter.maxLength}:${sortedGroups.join("|")}`
}

const clampWordsetForMobile = (words: JapaneseWord[]) => {
  if (!isMobileDevice() || words.length <= MOBILE_WORDSET_MAX) return words
  return shuffleArray(words).slice(0, MOBILE_WORDSET_MAX)
}

const hiraToKata = (text: string) =>
  text.replace(/[\u3041-\u3096]/g, c => String.fromCharCode(c.charCodeAt(0) + 0x60))

export const kanaToRomaji = (text: string) => {
  const kanaRomajiMap = getKanaRomajiMapInternal()
  let romaji = ""
  let i = 0
  const normalized = text || ""

  while (i < normalized.length) {
    const char = normalized[i]

    
    if (char === "っ" || char === "ッ") {
      
      const nextTri = normalized.slice(i + 1, i + 3)
      const nextChar = normalized[i + 1]
      const nextMapped =
        (nextTri && kanaRomajiMap[nextTri]) ||
        (nextChar && (kanaRomajiMap[nextChar] || kanaRomajiMap[hiraToKata(nextChar)])) ||
        ""
      if (nextMapped) {
        const first = nextMapped[0] ?? ""
        if (/[bcdfghjklmnpqrstvwxyz]/i.test(first)) {
          romaji += first
        }
      }
      i += 1
      continue
    }

    
    if (char === "ー") {
      if (romaji.length > 0) {
        const lastChar = romaji[romaji.length - 1]
        
        switch (lastChar) {
          case 'a': romaji = romaji.slice(0, -1) + 'ā'; break;
          case 'i': romaji = romaji.slice(0, -1) + 'ī'; break;
          case 'u': romaji = romaji.slice(0, -1) + 'ū'; break;
          case 'e': romaji = romaji.slice(0, -1) + 'ē'; break;
          case 'o': romaji = romaji.slice(0, -1) + 'ō'; break;
          
          case 'ā': case 'ī': case 'ū': case 'ē': case 'ō':
            
            break;
          default:
            
            
            
            
            
            
            
            
            
            break;
        }
      }
      i += 1
      continue
    }

    
    const tri = normalized.slice(i, i + 2)
    if (kanaRomajiMap[tri]) {
      romaji += kanaRomajiMap[tri]
      i += 2
      continue
    }

    if (!char) break
    const mapped = kanaRomajiMap[char] || kanaRomajiMap[hiraToKata(char)] || ""
    romaji += mapped
    i += 1
  }

  
  
  
  

  return romaji
    .replace(/aa/g, "ā")
    .replace(/ii/g, "ī")
    .replace(/uu/g, "ū")
    .replace(/ee/g, "ē")
    .replace(/oo/g, "ō")
    .replace(/ou/g, "ō")
}

const isMeaningBlacklisted = (meaning?: string) => {
  if (!meaning) return false
  const lowerMeaning = meaning.toLowerCase()
  return blacklist.some(term => term.trim() && lowerMeaning.includes(term.toLowerCase()))
}

export async function getRandomWord(
  type: GameMode,
  filter?: WordFilter,
  lang?: "en" | "es" | "ja",
): Promise<JapaneseWord | null> {
  
  const loadedCharacterGroups = await getCharacterGroups()

  let wordSets
  try {
    wordSets = await loadWordSets({
      characterGroups: loadedCharacterGroups,
      kanaToRomaji,
      hasHiragana,
      hasKatakana,
    }, lang)
  } catch (err) {
    const error = err as any
    
    if (error?.code === "MOBILE_AUTH_REQUIRED" || error?.message?.includes("Wordset fetch blocked")) {
      
      if (!error.code) error.code = "MOBILE_AUTH_REQUIRED"
      throw error
    }
    throw err
  }

  const { hiraganaWords, katakanaWords, bothForms } = wordSets

  let words: JapaneseWord[]

  if (type === "hiragana") {
    words = hiraganaWords
  } else if (type === "katakana") {
    words = katakanaWords
  } else {
    const combined = [...hiraganaWords, ...katakanaWords]
    if (bothForms && bothForms.length > 0) {
      combined.push(...bothForms)
    }
    words = combined
  }

  const datasetLang = normalizeLang(lang)
  const mobile = isMobileDevice()
  const cacheKey = buildFilterKey(type, filter, datasetLang, mobile)
  const cached = filteredWordCache.get(cacheKey)

  if (cached) {
    words = cached
  } else {
    
    words = words.filter(word => !isMeaningBlacklisted(word.meaning))

    
    if (filter) {
      const { selectedGroups, minLength, maxLength } = filter

      words = words.filter((word) => {
        
        const length = word.kana.length
        if (length < minLength || length > maxLength) return false

        
        if (selectedGroups.length === 0) return false
        const allGroupsAllowed = word.groups.every((g) => selectedGroups.includes(g))
        if (!allGroupsAllowed) return false

        return true
      })
    }

    words = clampWordsetForMobile(words)
    filteredWordCache.set(cacheKey, words)
  }

  if (words.length === 0) return null
  const choice = words[Math.floor(Math.random() * words.length)]
  return choice ?? null
}
export async function getRandomCharacter(
  type: GameMode,
  filter?: WordFilter,
): Promise<JapaneseWord | null> {
  const loadedCharacterGroups = await getCharacterGroups()
  await getKanaRomajiMap() 

  
  const modeToType = (mode: GameMode): "hiragana" | "katakana" =>
    mode === "katakana" ? "katakana"
      : mode === "both" ? (Math.random() > 0.5 ? "hiragana" : "katakana")
        : "hiragana"

  
  const selectedTypes = (filter?.selectedGroups ?? [])
    .map(id => loadedCharacterGroups.find(g => g.id === id)?.type)
    .filter((t): t is "hiragana" | "katakana" => Boolean(t))
  const hasH = selectedTypes.includes("hiragana")
  const hasK = selectedTypes.includes("katakana")

  
  const allowMixed = type === "both" && (filter?.selectedGroups?.length ? hasH && hasK : true)

  let targetType: "hiragana" | "katakana" = modeToType(type)
  if (!allowMixed && filter?.selectedGroups && filter.selectedGroups.length > 0) {
    targetType = hasK && !hasH ? "katakana" : hasH && !hasK ? "hiragana" : modeToType(type)
  }

  let groups = allowMixed
    ? loadedCharacterGroups
    : loadedCharacterGroups.filter((g) => g.type === targetType)

  
  if (filter?.selectedGroups !== undefined) {
    if (filter.selectedGroups.length === 0) return null
    groups = groups.filter((g) => filter.selectedGroups.includes(g.id))
  }

  
  
  
  if (filter?.selectedGroups) {
    const totalGroups = loadedCharacterGroups.filter((g) => g.type === targetType).length
    const selectedCount = filter.selectedGroups.filter(id => {
      const group = loadedCharacterGroups.find(g => g.id === id)
      return group?.type === targetType
    }).length
    const selectionRatio = selectedCount / totalGroups

    
    if (selectionRatio > 0.5) {
      const specialGroupPattern = /^h(1[6-9]|2[0-6])_a$|^k(1[8-9]|[2-3][0-9])_a$/

      
      groups = groups.filter(g => {
        const isSpecialGroup = specialGroupPattern.test(g.id)
        if (isSpecialGroup) {
          
          return Math.random() < 0.4
        }
        return true
      })
    }
  }

  if (groups.length === 0) return null

  const length = filter?.minLength
    ? Math.floor(Math.random() * (filter.maxLength - filter.minLength + 1)) + filter.minLength
    : 1

  let kana = ""
  let romaji = ""
  const usedGroups: string[] = []
  let wordType: "hiragana" | "katakana" | undefined

  for (let i = 0; i < length; i++) {
    const randomGroup = groups[Math.floor(Math.random() * groups.length)]
    if (!randomGroup) break

    const char = randomGroup.characters[Math.floor(Math.random() * randomGroup.characters.length)]
    if (!char) continue

    kana += char
    const charRomaji = kanaToRomaji(char)

    if (!wordType) {
      wordType = randomGroup.type as "hiragana" | "katakana"
    }

    if (char === "い" && charRomaji !== "i") {
      console.warn(`[Suspicious Romaji] Char: ${char}, Mapped: '${charRomaji}', Map(i): '${getKanaRomajiMapInternal()["い"]}'`)
    }

    romaji += charRomaji
    if (!usedGroups.includes(randomGroup.id)) {
      usedGroups.push(randomGroup.id)
    }
  }

  if (!kana) return null

  return {
    kana,
    romaji,
    type: wordType ?? targetType,
    groups: usedGroups,
  }
}
