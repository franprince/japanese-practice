import { describe, test, expect, mock, beforeEach, afterEach } from 'bun:test'
import { render, screen, cleanup, fireEvent, waitFor } from '@/test-utils'
import * as japaneseWords from '@/lib/japanese-words'

// Mock dependencies BEFORE loading the component
const mockGetRandomWord = mock(japaneseWords.getRandomWord)

const mockCharacterGroups = [
    { id: 'h1', type: 'hiragana' as const, label: 'H1', labelJp: 'あ', characters: ['あ'] },
    { id: 'k1', type: 'katakana' as const, label: 'K1', labelJp: 'ア', characters: ['ア'] },
]

mock.module('@/lib/data/kana-dictionary-loader', () => ({
    getCharacterGroups: mock(() => Promise.resolve(mockCharacterGroups)),
    getKanaRomajiMap: mock(() => Promise.resolve({})),
}))

mock.module('@/lib/japanese-words', () => ({
    getRandomWord: mockGetRandomWord,
    characterGroups: mockCharacterGroups,
}))

const mockResetSession = mock(() => { })
const mockSetTargetCount = mock(() => { })
const mockHandleScoreUpdate = mock(() => { })
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

// Mock Child Components to simplify testing
mock.module('@/components/words/game-card', () => ({
    GameCard: ({ onScoreUpdate }: any) => (
        <div data-testid="game-card">
            <button onClick={() => onScoreUpdate(20, 6, true)} data-testid="trigger-score">
                Trigger Score
            </button>
        </div>
    )
}))

mock.module('@/components/words/mode-selector', () => ({
    ModeSelector: ({ onModeChange }: any) => (
        <div data-testid="mode-selector">
            <button onClick={() => onModeChange('katakana')} data-testid="mode-katakana">
                Katakana
            </button>
            <button onClick={() => onModeChange('custom')} data-testid="mode-custom">
                Custom
            </button>
        </div>
    )
}))

describe('WordsPage', () => {
    let WordsPage: any;

    beforeEach(async () => {
        mockGetRandomWord.mockClear()
        mockResetSession.mockClear()

        mockGetRandomWord.mockResolvedValue({
            kana: 'あ',
            romaji: 'a',
            type: 'hiragana',
            groups: ['h1']
        })

        // Dynamic import
        const mod = await import('../page')
        WordsPage = mod.default
    })

    test('renders with title and stats', async () => {
        render(<WordsPage />)

        expect(screen.getByText('wordsLabel')).toBeInTheDocument()

        await waitFor(() => {
            const stats = screen.getByTestId('stats-display')
            expect(stats).toHaveTextContent('10')
        })
    })

    test('handles mode change', async () => {
        render(<WordsPage />)

        const katakanaBtn = screen.getByTestId('mode-katakana')
        fireEvent.click(katakanaBtn)

        expect(mockResetSession).toHaveBeenCalled()
        expect(mockSetBestStreak).toHaveBeenCalledWith(0)
    })

    test('handles score update from game card', async () => {
        render(<WordsPage />)

        // Wait for GameCard to render after groups load
        await waitFor(() => {
            expect(screen.getByTestId('game-card')).toBeInTheDocument()
        })

        const triggerBtn = screen.getByTestId('trigger-score')
        fireEvent.click(triggerBtn)

        expect(mockHandleScoreUpdate).toHaveBeenCalledWith(20, 6, true)
    })
})
