import type { KanaDictionary, KanaGroup } from "@/types/kana"

export interface CharacterGroup {
    id: string
    label: string
    labelJp: string
    type: "hiragana" | "katakana"
    characters: string[]
}


let kanaDictionaryCache: KanaDictionary | null = null
let characterGroupsCache: CharacterGroup[] | null = null
let kanaRomajiMapCache: Record<string, string> | null = null
let loadingPromise: Promise<KanaDictionary> | null = null


export async function loadKanaDictionary(): Promise<KanaDictionary> {
    if (kanaDictionaryCache) {
        return kanaDictionaryCache
    }

    if (loadingPromise) {
        return loadingPromise
    }

    loadingPromise = (async () => {
        try {
            const kanaDictionaryData = await import("./kanaDictionary.json")
            kanaDictionaryCache = kanaDictionaryData.default as unknown as KanaDictionary
            return kanaDictionaryCache
        } catch (error) {
            loadingPromise = null
            throw new Error(`Failed to load kana dictionary: ${error}`)
        }
    })()

    return loadingPromise
}


function buildCharacterGroups(dictionary: KanaDictionary): CharacterGroup[] {
    return Object.entries(dictionary).flatMap(([typeKey, groups]) =>
        Object.entries(groups as Record<string, KanaGroup>).map(([groupId, group]) => {
            const characters = Object.keys(group.characters)
            const firstKana = characters[0] || groupId
            const firstRomaji = (group.characters[firstKana] ?? [groupId])[0] ?? groupId
            const typeLabel = typeKey === "hiragana" ? "Hiragana" : "Katakana"
            return {
                id: groupId,
                label: `${typeLabel} · ${firstRomaji}`,
                labelJp: characters.join(" / "),
                type: typeKey as CharacterGroup["type"],
                characters,
            }
        }),
    )
}


function buildKanaRomajiMap(dictionary: KanaDictionary): Record<string, string> {
    const map: Record<string, string> = {}
        ; (Object.values(dictionary) as Record<string, KanaGroup>[]).forEach(groups => {
            Object.values(groups).forEach((group: KanaGroup) => {
                Object.entries(group.characters).forEach(([kana, romajiList]) => {
                    if (!map[kana]) {
                        map[kana] = Array.isArray(romajiList) && romajiList.length > 0 ? romajiList[0] ?? "" : ""
                    }
                })
            })
        })
    return map
}


export async function getCharacterGroups(): Promise<CharacterGroup[]> {
    if (characterGroupsCache) {
        return characterGroupsCache
    }

    const dictionary = await loadKanaDictionary()
    characterGroupsCache = buildCharacterGroups(dictionary)
    return characterGroupsCache
}


export async function getKanaRomajiMap(): Promise<Record<string, string>> {
    if (kanaRomajiMapCache) {
        return kanaRomajiMapCache
    }

    const dictionary = await loadKanaDictionary()
    kanaRomajiMapCache = buildKanaRomajiMap(dictionary)
    return kanaRomajiMapCache
}


export function getCharacterGroupsSync(): CharacterGroup[] {
    return characterGroupsCache ?? []
}


export function getKanaRomajiMapSync(): Record<string, string> {
    return kanaRomajiMapCache ?? {}
}


export function preloadKanaDictionary(): void {
    if (!kanaDictionaryCache && !loadingPromise) {
        loadKanaDictionary().catch(err => {
            console.error("Failed to preload kana dictionary:", err)
        })
    }
}
