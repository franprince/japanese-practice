import { describe, test, expect } from 'bun:test'
import { render, screen } from '@/test-utils'
import { GamePageLayout } from './game-page-layout'

// DOM setup is handled by @jest-environment happy-dom and setup.ts


describe('GamePageLayout', () => {
    test('renders title and subtitle', () => {
        render(
            <GamePageLayout
                title="Test Title"
                subtitle="Test Subtitle"
            >
                <div>Game Content</div>
            </GamePageLayout>
        )

        expect(screen.getByText('Test Title')).toBeInTheDocument()
        expect(screen.getByText('Test Subtitle')).toBeInTheDocument()
    })

    test('renders children content', () => {
        render(
            <GamePageLayout
                title="Test"
                subtitle="Subtitle"
            >
                <div data-testid="game-content">Game Content</div>
            </GamePageLayout>
        )

        expect(screen.getByTestId('game-content')).toBeInTheDocument()
        expect(screen.getByText('Game Content')).toBeInTheDocument()
    })

    test('renders back to home button', () => {
        render(
            <GamePageLayout
                title="Test"
                subtitle="Subtitle"
            >
                <div>Content</div>
            </GamePageLayout>
        )

        const homeLink = screen.getByRole('link', { name: /home/i })
        expect(homeLink).toBeInTheDocument()
        expect(homeLink).toHaveAttribute('href', '/')
    })

    test('renders controls when provided', () => {
        render(
            <GamePageLayout
                title="Test"
                subtitle="Subtitle"
                controls={<button>Test Control</button>}
            >
                <div>Content</div>
            </GamePageLayout>
        )

        expect(screen.getByRole('button', { name: 'Test Control' })).toBeInTheDocument()
    })

    test('renders stats when provided', () => {
        render(
            <GamePageLayout
                title="Test"
                subtitle="Subtitle"
                stats={<div data-testid="stats">Stats Display</div>}
            >
                <div>Content</div>
            </GamePageLayout>
        )

        expect(screen.getByTestId('stats')).toBeInTheDocument()
    })

    test('shows enter hint when showEnterHint is true', () => {
        render(
            <GamePageLayout
                title="Test"
                subtitle="Subtitle"
                showEnterHint={true}
            >
                <div>Content</div>
            </GamePageLayout>
        )

        expect(screen.getByText('Enter')).toBeInTheDocument()
    })

    test('does not show enter hint when showEnterHint is false', () => {
        render(
            <GamePageLayout
                title="Test"
                subtitle="Subtitle"
                showEnterHint={false}
            >
                <div>Content</div>
            </GamePageLayout>
        )

        expect(screen.queryByText('Enter')).not.toBeInTheDocument()
    })
})
