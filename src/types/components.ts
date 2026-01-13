/**
 * Shared component type definitions for game pages
 */

/**
 * Base props that all game card components should implement
 */
export interface BaseGameCardProps {
    onScoreUpdate: (score: number, streak: number, correct: boolean) => void
    disableNext?: boolean
}

/**
 * Configuration for game page metadata
 */
export interface GamePageConfig {
    title: string
    subtitle: string
    showEnterHint?: boolean
}

/**
 * Props for game page layout component
 */
export interface GamePageLayoutProps {
    title: string
    subtitle: string
    children: React.ReactNode
    controls?: React.ReactNode
    stats?: React.ReactNode
    footer?: React.ReactNode
    showEnterHint?: boolean
}
