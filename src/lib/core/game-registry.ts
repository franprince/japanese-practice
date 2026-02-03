

export interface GameDefinition {
    id: string
    href: string
    icon: string
    gradient: string
    titleKey: string
    descriptionKey: string
}


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
