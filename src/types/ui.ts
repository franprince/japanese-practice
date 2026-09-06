


import type { GameSessionProps } from "@/lib/core/game-session"

export type { Language, TranslationKey } from "../lib/i18n"


export type Theme = "default" | "sakura" | "ocean" | "forest" | "sunset" | "daylight" | "lavender" | "mint"


export interface BaseGameCardProps extends GameSessionProps {
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
    topbarContent?: React.ReactNode
    stats?: React.ReactNode
    footer?: React.ReactNode
    showEnterHint?: boolean
    remainingLabel?: string | null
    progress?: React.ReactNode
    configuration?: React.ReactNode
    settingsTrigger?: React.ReactNode
}
