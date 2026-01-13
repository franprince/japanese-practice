import { describe, test, expect, mock, beforeEach, afterEach } from 'bun:test'
import { render, screen, cleanup, fireEvent, waitFor } from '@/test-utils'
import { GameCard } from './game-card'
import * as japaneseWords from '@/lib/japanese-words'
import * as i18n from '@/lib/i18n'

// Mock dependencies
const mockGetRandomWord = mock(japaneseWords.getRandomWord)
// Mock useI18n
const mockUseI18n = mock(() => ({
    t: (key: string) => key,
    lang: 'en'
}))

// Override the module mocks
mock.module('@/lib/japanese-words', () => ({
    getRandomWord: mockGetRandomWord,
    characterGroups: [], // Mock if needed
    // Add other exports if needed
}))

mock.module('@/lib/i18n', () => ({
    useI18n: mockUseI18n
}))


describe('GameCard', () => {
    const mockOnScoreUpdate = mock(() => { })
    const defaultProps = {
        mode: 'hiragana' as const,
        filter: { selectedGroups: [], minLength: 1, maxLength: 10 },
        onScoreUpdate: mockOnScoreUpdate
    }

    beforeEach(() => {
        mockOnScoreUpdate.mockClear()
        mockGetRandomWord.mockClear()
        // Default mock implementation
        mockGetRandomWord.mockResolvedValue({
            kana: 'あ',
            romaji: 'a',
            type: 'hiragana',
            groups: []
        })
    })

    afterEach(() => {
        cleanup()
    })

    test('initializes and loads a word', async () => {
        render(<GameCard {...defaultProps} />)

        // Should show loading initially or eventually show the word
        await waitFor(() => {
            expect(screen.getByText('あ')).toBeInTheDocument()
        })
        expect(mockGetRandomWord).toHaveBeenCalled()
    })

    test('handles correct answer', async () => {
        render(<GameCard {...defaultProps} />)
        await waitFor(() => screen.getByText('あ'))

        const input = screen.getByRole('textbox')
        fireEvent.change(input, { target: { value: 'a' } })
        fireEvent.keyDown(input, { key: 'Enter' })

        // Check for success feedback
        await waitFor(() => {
            // Assuming success visual cue checks, like a check icon or class
            // Ideally testing-library doesn't test classes, but we can check for next button
            expect(screen.getByRole('button', { name: 'nextWord' })).toBeInTheDocument()
        })
        expect(mockOnScoreUpdate).toHaveBeenCalledWith(expect.any(Number), expect.any(Number), true)
    })

    test('handles incorrect answer', async () => {
        render(<GameCard {...defaultProps} />)
        await waitFor(() => screen.getByText('あ'))

        const input = screen.getByRole('textbox')
        fireEvent.change(input, { target: { value: 'z' } }) // Incorrect
        fireEvent.keyDown(input, { key: 'Enter' })

        await waitFor(() => {
            // Should show correct answer
            expect(screen.getByText('correctAnswer')).toBeInTheDocument()
        })
        // Streak should reset
        expect(mockOnScoreUpdate).toHaveBeenCalledWith(expect.any(Number), 0, false)
    })

    test('accepts "wa" for "ha" particle', async () => {
        mockGetRandomWord.mockResolvedValue({
            kana: 'こんにちは',
            romaji: 'konnichiha', // Technically ha in romaji for the character, often typed/romanized as wa
            type: 'hiragana',
            groups: []
        })

        render(<GameCard {...defaultProps} />)
        await waitFor(() => screen.getByText('こんにちは'))

        const input = screen.getByRole('textbox')
        fireEvent.change(input, { target: { value: 'konnichiwa' } })
        fireEvent.keyDown(input, { key: 'Enter' })

        await waitFor(() => {
            expect(screen.getByRole('button', { name: 'nextWord' })).toBeInTheDocument()
        })
        expect(mockOnScoreUpdate).toHaveBeenCalledWith(expect.any(Number), expect.any(Number), true)
    })

    test('skips word', async () => {
        // First word is 'あ', second word is 'い'
        mockGetRandomWord
            .mockResolvedValueOnce({
                kana: 'あ',
                romaji: 'a',
                type: 'hiragana',
                groups: []
            })
            .mockResolvedValueOnce({
                kana: 'い',
                romaji: 'i',
                type: 'hiragana',
                groups: []
            })

        render(<GameCard {...defaultProps} />)
        await waitFor(() => screen.getByText('あ'))

        const skipButton = screen.getByRole('button', { name: 'skip' })
        fireEvent.click(skipButton)

        // Wait for the SECOND word to appear. This ensures the component has finished updating state.
        await waitFor(() => {
            expect(screen.getByText('い')).toBeInTheDocument()
        })

        expect(mockOnScoreUpdate).toHaveBeenCalledWith(expect.any(Number), 0, false)
        expect(mockGetRandomWord).toHaveBeenCalledTimes(2)
    })

    test('shows no words available state', async () => {
        mockGetRandomWord.mockResolvedValue(null)
        render(<GameCard {...defaultProps} />)

        await waitFor(() => {
            expect(screen.getByText('noWordsTitle')).toBeInTheDocument()
        })
    })

    test('disables check button when input is empty', async () => {
        render(<GameCard {...defaultProps} />)
        await waitFor(() => screen.getByText('あ'))

        const checkButton = screen.getByRole('button', { name: 'check' })
        expect(checkButton).toBeDisabled()

        const input = screen.getByRole('textbox')
        fireEvent.change(input, { target: { value: '   ' } }) // Whitespace only
        expect(checkButton).toBeDisabled()

        fireEvent.change(input, { target: { value: 'a' } })
        expect(checkButton).not.toBeDisabled()
    })

    test('handles case insensitive and messy input', async () => {
        render(<GameCard {...defaultProps} />)
        await waitFor(() => screen.getByText('あ'))

        const input = screen.getByRole('textbox')
        // Answer is 'a', inputting ' A ' should work
        fireEvent.change(input, { target: { value: ' A ' } })
        fireEvent.keyDown(input, { key: 'Enter' })

        await waitFor(() => {
            expect(screen.getByRole('button', { name: 'nextWord' })).toBeInTheDocument()
        })
        expect(mockOnScoreUpdate).toHaveBeenCalledWith(expect.any(Number), expect.any(Number), true)
    })
})
