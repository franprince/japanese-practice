import { isOllamaPracticeEnabled } from "./feature-flags"


export interface GameDefinition {
    id: string
    href: string
    icon: string
    gradient: string
    titleKey: string
    descriptionKey: string
}


const ALL_GAMES: GameDefinition[] = [
    {
        id: 'romaji',
        href: '/words',
        icon: 'あ',
        gradient: 'bg-gradient-to-br from-primary/30 via-black to-black',
        titleKey: 'games.romaji.title',
        descriptionKey: 'games.romaji.description',
    },
    {
        id: 'numbers',
        href: '/numbers',
        icon: '数',
        gradient: 'bg-gradient-to-br from-accent/25 via-black to-black',
        titleKey: 'games.numbers.title',
        descriptionKey: 'games.numbers.description',
    },
    {
        id: 'kanji',
        href: '/kanji',
        icon: '漢',
        gradient: 'bg-gradient-to-br from-primary/25 via-black to-black',
        titleKey: 'games.kanji.title',
        descriptionKey: 'games.kanji.description',
    },
    {
        id: 'dates',
        href: '/dates',
        icon: '日',
        gradient: 'bg-gradient-to-br from-accent/20 via-black to-black',
        titleKey: 'games.dates.title',
        descriptionKey: 'games.dates.description',
    },
    {
        id: 'ollama',
        href: '/practice/ollama',
        icon: '機',
        gradient: 'bg-gradient-to-br from-indigo-500/20 via-black to-black',
        titleKey: 'games.ollama.title',
        descriptionKey: 'games.ollama.description',
    },
]

export function buildGamesList(ollamaEnabled: boolean): GameDefinition[] {
    return ALL_GAMES.filter(g => g.id !== 'ollama' || ollamaEnabled)
}

export const GAMES: GameDefinition[] = buildGamesList(isOllamaPracticeEnabled)
