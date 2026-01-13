import { describe, test, expect, mock, beforeEach, afterEach } from 'bun:test'
import { render, screen, cleanup, fireEvent, waitFor } from '@/test-utils'

const mockResetSession = mock(() => { })
const mockHandleScoreUpdate = mock(() => { })
const mockSetTargetCount = mock(() => { })
const mockSetBestStreak = mock(() => { })

// Mock Hooks
mock.module('@/hooks/use-game-page', () => ({
    useGamePage: () => ({
        score: 10,
        streak: 5,
        bestStreak: 10,
        sessionId: 'test-session',
        playMode: 'infinite',
        targetCount: 50,
        sessionComplete: false,
        correctCount: 10,
        accuracy: 100,
        handleScoreUpdate: mockHandleScoreUpdate,
        resetSession: mockResetSession,
        setTargetCount: mockSetTargetCount,
        setBestStreak: mockSetBestStreak,
        remainingLabel: 'Infinite',
        sessionSummaryProps: {},
        t: (key: string) => key,
    })
}))

// Mock Child Components
mock.module('@/components/kanji/kanji-game-card', () => ({
    KanjiGameCard: ({ difficulty, onScoreUpdate }: any) => (
        <div data-testid="kanji-game-card">
            <div data-testid="difficulty-display">{difficulty}</div>
            <button onClick={() => onScoreUpdate(20, 6, true)} data-testid="trigger-score">
                Trigger Score
            </button>
        </div>
    )
}))

mock.module('@/components/kanji/kanji-difficulty-selector', () => ({
    KanjiDifficultySelector: ({ difficulty, onDifficultyChange }: any) => (
        <div data-testid="difficulty-selector">
            <button onClick={() => onDifficultyChange('medium')} data-testid="diff-medium">
                Select Medium
            </button>
        </div>
    )
}))

describe('KanjiPage', () => {
    let KanjiPage: any;

    beforeEach(async () => {
        mockResetSession.mockClear()
        mockHandleScoreUpdate.mockClear()

        // Dynamic import
        const mod = await import('../page')
        KanjiPage = mod.default
    })

    afterEach(() => {
        cleanup()
    })

    test('renders with title and stats', async () => {
        render(<KanjiPage />)

        expect(screen.getByText('kanjiTitle')).toBeInTheDocument()

        await waitFor(() => {
            const stats = screen.getByTestId('stats-display')
            expect(stats).toHaveTextContent('10')
        })
    })

    test('renders kanji game card with default difficulty', () => {
        render(<KanjiPage />)
        expect(screen.getByTestId('difficulty-display')).toHaveTextContent('easy')
    })

    test('handles difficulty change', async () => {
        render(<KanjiPage />)

        const mediumBtn = screen.getByTestId('diff-medium')
        fireEvent.click(mediumBtn)

        expect(mockResetSession).toHaveBeenCalled()
        expect(screen.getByTestId('difficulty-display')).toHaveTextContent('medium')
    })

    test('handles score update from game card', async () => {
        render(<KanjiPage />)

        const triggerBtn = screen.getByTestId('trigger-score')
        fireEvent.click(triggerBtn)

        expect(mockHandleScoreUpdate).toHaveBeenCalledWith(20, 6, true)
    })
})
