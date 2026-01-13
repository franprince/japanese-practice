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
mock.module('@/components/dates/date-game-card', () => ({
    DateGameCard: ({ mode, onScoreUpdate }: any) => (
        <div data-testid="date-game-card">
            <div data-testid="mode-display">{mode}</div>
            <button onClick={() => onScoreUpdate(20, 6, true)} data-testid="trigger-score">
                Trigger Score
            </button>
        </div>
    )
}))

mock.module('@/components/dates/date-mode-selector', () => ({
    DateModeSelector: ({ mode, onModeChange }: any) => (
        <div data-testid="mode-selector">
            <button onClick={() => onModeChange('months')} data-testid="mode-months">
                Select Months
            </button>
        </div>
    )
}))

describe('DatesPage', () => {
    let DatesPage: any;

    beforeEach(async () => {
        mockResetSession.mockClear()
        mockHandleScoreUpdate.mockClear()

        // Dynamic import
        const mod = await import('../page')
        DatesPage = mod.default
    })

    afterEach(() => {
        cleanup()
    })

    test('renders with title and stats', async () => {
        render(<DatesPage />)

        expect(screen.getByText('datesTitle')).toBeInTheDocument()

        await waitFor(() => {
            const stats = screen.getByTestId('stats-display')
            expect(stats).toHaveTextContent('10')
        })
    })

    test('renders date game card with default mode', () => {
        render(<DatesPage />)
        expect(screen.getByTestId('mode-display')).toHaveTextContent('days')
    })

    test('handles mode change', async () => {
        render(<DatesPage />)

        const monthsBtn = screen.getByTestId('mode-months')
        fireEvent.click(monthsBtn)

        expect(mockResetSession).toHaveBeenCalled()
        expect(screen.getByTestId('mode-display')).toHaveTextContent('months')
    })

    test('handles score update from game card', async () => {
        render(<DatesPage />)

        const triggerBtn = screen.getByTestId('trigger-score')
        fireEvent.click(triggerBtn)

        expect(mockHandleScoreUpdate).toHaveBeenCalledWith(20, 6, true)
    })
})
