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
mock.module('@/components/numbers/number-game-card', () => ({
    NumberGameCard: ({ difficulty, mode, onScoreUpdate }: any) => (
        <div data-testid="number-game-card">
            <div data-testid="diff-display">{difficulty}</div>
            <div data-testid="mode-display">{mode}</div>
            <button onClick={() => onScoreUpdate(20, 6, true)} data-testid="trigger-score">
                Trigger Score
            </button>
        </div>
    )
}))

mock.module('@/components/numbers/difficulty-selector', () => ({
    DifficultySelector: ({ difficulty, onDifficultyChange }: any) => (
        <div data-testid="difficulty-selector">
            <button onClick={() => onDifficultyChange('medium')} data-testid="diff-medium">
                Select Medium
            </button>
        </div>
    )
}))

describe('NumbersPage', () => {
    let NumbersPage: any;

    beforeEach(async () => {
        mockResetSession.mockClear()
        mockHandleScoreUpdate.mockClear()

        // Dynamic import
        const mod = await import('../page')
        NumbersPage = mod.default
    })

    afterEach(() => {
        cleanup()
    })

    test('renders with title and stats', async () => {
        render(<NumbersPage />)

        expect(screen.getByText('numbersTitle')).toBeInTheDocument()

        await waitFor(() => {
            const stats = screen.getByTestId('stats-display')
            expect(stats).toHaveTextContent('10')
        })
    })

    test('renders number game card with default settings', () => {
        render(<NumbersPage />)
        expect(screen.getByTestId('diff-display')).toHaveTextContent('easy')
        expect(screen.getByTestId('mode-display')).toHaveTextContent('arabicToKanji')
    })

    test('handles difficulty change', async () => {
        render(<NumbersPage />)

        const mediumBtn = screen.getByTestId('diff-medium')
        fireEvent.click(mediumBtn)

        expect(mockResetSession).toHaveBeenCalled()
        expect(screen.getByTestId('diff-display')).toHaveTextContent('medium')
    })

    test('handles mode toggle', async () => {
        render(<NumbersPage />)

        // Find kanjiToArabic button
        const kanjiModeBtn = screen.getByText('numbersModeKanjiToArabic')
        fireEvent.click(kanjiModeBtn)

        expect(screen.getByTestId('mode-display')).toHaveTextContent('kanjiToArabic')

        // Switch back
        const arabicModeBtn = screen.getByText('numbersModeArabicToKanji')
        fireEvent.click(arabicModeBtn)

        expect(screen.getByTestId('mode-display')).toHaveTextContent('arabicToKanji')
    })

    test('handles score update from game card', async () => {
        render(<NumbersPage />)

        const triggerBtn = screen.getByTestId('trigger-score')
        fireEvent.click(triggerBtn)

        expect(mockHandleScoreUpdate).toHaveBeenCalledWith(20, 6, true)
    })
})
