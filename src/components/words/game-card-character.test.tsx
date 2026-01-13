import { describe, test, expect, mock, beforeEach, afterEach } from 'bun:test'
import { render, screen, cleanup, fireEvent, waitFor } from '@/test-utils'
import { GameCard } from './game-card'
import * as japaneseWords from '@/lib/japanese-words'

const mockGetRandomWord = mock(japaneseWords.getRandomWord)
const mockGetRandomCharacter = mock(japaneseWords.getRandomCharacter)

const mockUseI18n = mock(() => ({
    t: (key: string) => key,
    lang: 'en'
}))

// Override the module mocks
mock.module('@/lib/japanese-words', () => ({
    getRandomWord: mockGetRandomWord,
    getRandomCharacter: mockGetRandomCharacter,
    characterGroups: [], // Simplify
}))

mock.module('@/lib/i18n', () => ({
    useI18n: mockUseI18n
}))


describe('GameCard - Character Mode', () => {
    const mockOnScoreUpdate = mock(() => { })
    const mockOnToggle = mock(() => { })
    const defaultProps = {
        mode: 'hiragana' as const,
        filter: { selectedGroups: [], minLength: 1, maxLength: 10 },
        onScoreUpdate: mockOnScoreUpdate,
        isCharacterMode: false,
        onToggleCharacterMode: mockOnToggle
    }

    beforeEach(() => {
        mockOnScoreUpdate.mockClear()
        mockOnToggle.mockClear()
        mockGetRandomWord.mockClear()
        mockGetRandomCharacter.mockClear()

        mockGetRandomWord.mockResolvedValue({
            kana: 'word',
            romaji: 'word',
            type: 'hiragana',
            groups: []
        })
        mockGetRandomCharacter.mockReturnValue({
            kana: 'あ',
            romaji: 'a',
            type: 'hiragana',
            groups: []
        })
    })

    afterEach(() => {
        cleanup()
    })

    test('renders toggle button when handler is provided', async () => {
        render(<GameCard {...defaultProps} />)
        await waitFor(() => {
            expect(screen.getByTitle('switchToCharacters')).toBeInTheDocument()
        })
    })

    test('calls onToggle when button clicked', async () => {
        render(<GameCard {...defaultProps} />)
        await waitFor(() => {
            expect(screen.getByTitle('switchToCharacters')).toBeInTheDocument()
        })
        const btn = screen.getByTitle('switchToCharacters')
        fireEvent.click(btn)
        expect(mockOnToggle).toHaveBeenCalled()
    })

    test('loads character when isCharacterMode is true', async () => {
        render(<GameCard {...defaultProps} isCharacterMode={true} />)

        await waitFor(() => {
            // Should have called getRandomCharacter, NOT getRandomWord
            expect(mockGetRandomCharacter).toHaveBeenCalled()
        })
        expect(screen.getByText('あ')).toBeInTheDocument()
    })

    test('shows correct icon state', async () => {
        const { rerender } = render(<GameCard {...defaultProps} isCharacterMode={false} />)
        await waitFor(() => {
            expect(screen.getByTitle('switchToCharacters')).toBeInTheDocument()
        })

        rerender(<GameCard {...defaultProps} isCharacterMode={true} />)
        await waitFor(() => {
            expect(screen.getByTitle('switchToWords')).toBeInTheDocument()
        })
    })
    test('shows correct mode label', async () => {
        const { getByText } = render(<GameCard {...defaultProps} isCharacterMode={true} />)

        await waitFor(() => {
            expect(getByText('modeCharacters')).toBeInTheDocument()
        })
    })
})
