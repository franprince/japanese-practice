import { describe, test, expect, mock, beforeEach } from 'bun:test'
import { render, screen, cleanup } from '@/test-utils'
import * as gameRegistry from '@/lib/game-registry'

// Mock Hooks
mock.module('@/lib/i18n', () => ({
    useI18n: () => ({
        t: (key: string) => {
            const translations: Record<string, string> = {
                'heroTagline': 'Hero Tagline',
                'pillar.learning.title': 'Learning Title',
                'pillar.learning.body': 'Learning Body',
                'pillar.mindfulness.title': 'Mindfulness Title',
                'pillar.mindfulness.body': 'Mindfulness Body',
                'pillar.path.title': 'Path Title',
                'pillar.path.body': 'Path Body',
                'game.words.title': 'Words Game',
                'game.words.desc': 'Learn words',
            }
            return translations[key] || key
        }
    })
}))

// Mock Components
mock.module('@/components/language-switcher', () => ({
    LanguageSwitcher: () => <div data-testid="language-switcher">LanguageSwitcher</div>
}))

mock.module('@/components/theme-switcher', () => ({
    ThemeSwitcher: () => <div data-testid="theme-switcher">ThemeSwitcher</div>
}))

mock.module('@/components/game-selector-card', () => ({
    GameSelectorCard: ({ title, description, href }: any) => (
        <div data-testid="game-card">
            <h3>{title}</h3>
            <p>{description}</p>
            <a href={href}>{href}</a>
        </div>
    )
}))

// Mock Data
mock.module('@/lib/game-registry', () => ({
    GAMES: [
        {
            id: 'words',
            titleKey: 'game.words.title',
            descriptionKey: 'game.words.desc',
            href: '/words',
            icon: 'A',
            gradient: 'gradient-class'
        }
    ]
}))

describe('HomePage', () => {
    let HomePage: any;

    beforeEach(async () => {
        cleanup()
        const mod = await import('../page')
        HomePage = mod.default
    })

    test('renders hero section correctly', () => {
        render(<HomePage />)

        expect(screen.getByText('日本語 練習')).toBeInTheDocument()
        expect(screen.getByText('Hero Tagline')).toBeInTheDocument()
        expect(screen.getByTestId('theme-switcher')).toBeInTheDocument()
        expect(screen.getByTestId('language-switcher')).toBeInTheDocument()
    })

    test('renders game cards from registry', () => {
        render(<HomePage />)

        const gameCards = screen.getAllByTestId('game-card')
        expect(gameCards).toHaveLength(1)
        expect(screen.getByText('Words Game')).toBeInTheDocument()
        expect(screen.getByText('Learn words')).toBeInTheDocument()
    })

    test('renders footer pillars', () => {
        render(<HomePage />)

        expect(screen.getByText('Learning Title')).toBeInTheDocument()
        expect(screen.getByText('Learning Body')).toBeInTheDocument()

        expect(screen.getByText('Mindfulness Title')).toBeInTheDocument()
        expect(screen.getByText('Mindfulness Body')).toBeInTheDocument()

        expect(screen.getByText('Path Title')).toBeInTheDocument()
        expect(screen.getByText('Path Body')).toBeInTheDocument()
    })
})
