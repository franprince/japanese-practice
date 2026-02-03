


export type { Language, TranslationKey } from "../lib/i18n"


export type Theme = "default" | "sakura" | "ocean" | "forest" | "sunset" | "daylight" | "lavender" | "mint"


export interface BaseGameCardProps {
    onScoreUpdate: (score: number, streak: number, correct: boolean) => void
    disableNext?: boolean
}


export interface GamePageConfig {
    title: string
    subtitle: string
    showEnterHint?: boolean
}


export interface GamePageLayoutProps {
    title: string
    subtitle: string
    children: React.ReactNode
    controls?: React.ReactNode
    stats?: React.ReactNode
    footer?: React.ReactNode
    showEnterHint?: boolean
}
