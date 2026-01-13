import { describe, test, expect, mock, beforeEach, afterEach } from 'bun:test'
import { render, screen, cleanup, fireEvent, waitFor } from '@/test-utils'

const mockResetSession = mock(() => { })
const mockHandleScoreUpdate = mock(() => { })
const mockSetTargetCount = mock(() => { })
const mockSetBestStreak = mock(() => { })

const mockT = (key: string) => key

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
        t: mockT,
    })
}))

// Mock I18n for stable t function
mock.module('@/lib/i18n', () => ({
    useI18n: () => ({
        t: mockT,
        lang: 'en'
    })
}))

// Mock Child Components REMOVED - Using Real Components
// We mock the data generation to be deterministic
mock.module('@/lib/japanese-dates', () => ({
    generateDateQuestion: () => ({
        display: 'TEST_DISPLAY',
        displayName: 'TEST_NAME',
        displayNumber: '1',
        answer: 'testanswer',
        romaji: 'testromaji',
        kanji: 'testkanji'
    })
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

    test('renders date game card with default mode (Week Days)', () => {
        render(<DatesPage />)
        // Default mode is week_days
        // Check for specific hint text for this mode
        expect(screen.getByText('writeWeekDay')).toBeInTheDocument()

        // Also verify the selector button exists
        expect(screen.getByRole('button', { name: 'weekDays' })).toBeInTheDocument()
    })

    test('handles mode change', async () => {
        render(<DatesPage />)

        // Find "Months" button (label key 'monthsOnly')
        const monthsBtn = screen.getByText('monthsOnly')
        fireEvent.click(monthsBtn)

        expect(mockResetSession).toHaveBeenCalled()
        // Should now show 'month' label (key 'month' returned by getModeLabel for 'months' mode)
        await waitFor(() => {
            expect(screen.getByText('month')).toBeInTheDocument()
        })
    })

    test('toggles between Week Day (Name) and Day of Month (Number)', () => {
        render(<DatesPage />)

        // Default week_days has toggle
        const toggleButton = screen.getByTitle('showNumber')
        expect(toggleButton).toBeDefined()

        fireEvent.click(toggleButton)

        // Title changes to showName
        expect(screen.getByTitle('showName')).toBeDefined()
    })

    test('handles score update (simulated correct answer)', async () => {
        render(<DatesPage />)

        // Input correct answer
        const input = screen.getByRole('textbox')
        fireEvent.change(input, { target: { value: 'testanswer' } })
        fireEvent.keyDown(input, { key: 'Enter' })

        // Should show result and handle score
        // Real DateGameCard calls handleScoreUpdate from hook
        expect(mockHandleScoreUpdate).toHaveBeenCalledWith(expect.any(Number), expect.any(Number), true)
    })
})
