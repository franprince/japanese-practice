import { describe, test, expect, mock, afterEach } from 'bun:test'
import { render, screen, cleanup, fireEvent } from '@/test-utils'
import { SessionSummaryCard } from './session-summary-card'

describe('SessionSummaryCard', () => {
    const defaultProps = {
        title: 'Session Complete',
        targetLabel: 'Target',
        correctLabel: 'Correct',
        accuracyLabel: 'Accuracy',
        targetCount: 10,
        correctCount: 8,
        accuracy: 80,
        onRestart: mock(() => { }),
        onSwitchToInfinite: mock(() => { }),
        restartLabel: 'Restart',
        switchLabel: 'Go Infinite'
    }

    afterEach(() => {
        cleanup()
        defaultProps.onRestart.mockClear()
        defaultProps.onSwitchToInfinite.mockClear()
    })

    test('renders correctly with provided props', () => {
        render(<SessionSummaryCard {...defaultProps} />)

        expect(screen.getByText('Session Complete')).toBeInTheDocument()
        expect(screen.getByText(/Target: 10/)).toBeInTheDocument()
        expect(screen.getByText(/Correct: 8/)).toBeInTheDocument()
        expect(screen.getByText(/Accuracy: 80%/)).toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Restart' })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Go Infinite' })).toBeInTheDocument()
    })

    test('handles restart click', () => {
        render(<SessionSummaryCard {...defaultProps} />)
        const restartBtn = screen.getByRole('button', { name: 'Restart' })
        fireEvent.click(restartBtn)
        expect(defaultProps.onRestart).toHaveBeenCalled()
    })

    test('handles switch to infinite click', () => {
        render(<SessionSummaryCard {...defaultProps} />)
        const switchBtn = screen.getByRole('button', { name: 'Go Infinite' })
        fireEvent.click(switchBtn)
        expect(defaultProps.onSwitchToInfinite).toHaveBeenCalled()
    })
})
