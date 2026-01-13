/**
 * Centralized game registry for all available games
 * This serves as the single source of truth for game definitions
 */

export interface GameDefinition {
    id: string
    href: string
    icon: string
    gradient: string
    titleKey: string
    descriptionKey: string
}

/**
 * Registry of all available games
 * To add a new game:
 * 1. Add the game definition here
 * 2. Create the page component in app/[game-name]/page.tsx
 * 3. Create game-specific components in src/components/[game-name]/
 * 4. Add translation keys to src/lib/translations.ts
 */
export const GAMES: GameDefinition[] = [
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
]

/**
 * Get a game definition by its ID
 */
export function getGameById(id: string): GameDefinition | undefined {
    return GAMES.find(game => game.id === id)
}

/**
 * Get a game definition by its href path
 */
export function getGameByPath(path: string): GameDefinition | undefined {
    return GAMES.find(game => game.href === path)
}
