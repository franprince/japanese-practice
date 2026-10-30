import { describe, expect, it } from 'bun:test'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { SpotifySource, type SpotifyState } from '../reader-app'

function SpotifySourceHarness({ state }: { state: SpotifyState }) {
  const initialText = state.status === 'done' ? (state.lyrics ?? state.title) : ''
  const [text, setText] = useState(initialText)
  return (
    <div>
      <SpotifySource state={state} activeText={text} onSelectText={setText} />
      <output aria-label="Active reader text">{text}</output>
    </div>
  )
}

describe('SpotifySource', () => {
  it('shows the track title and artist and lets the user toggle between lyrics and title', async () => {
    const user = userEvent.setup()
    const lyrics = '手放した 花びらが\n音も無く 流れてく'
    const state: SpotifyState = {
      status: 'done',
      link: { kind: 'track', url: 'https://open.spotify.com/track/2hoKhipu6bG2FpYDXLUk7v' },
      title: '花鬘',
      artist: '植田真梨恵',
      thumbnail: 'https://i.scdn.co/x',
      lyrics,
    }

    render(<SpotifySourceHarness state={state} />)

    expect(screen.getByText('花鬘 · 植田真梨恵')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Show song lyrics' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Show song title' })).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByLabelText('Active reader text')).toHaveTextContent('手放した 花びらが')

    await user.click(screen.getByRole('button', { name: 'Show song title' }))
    expect(screen.getByRole('button', { name: 'Show song title' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Show song lyrics' })).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByLabelText('Active reader text')).toHaveTextContent('花鬘')

    await user.click(screen.getByRole('button', { name: 'Show song lyrics' }))
    expect(screen.getByRole('button', { name: 'Show song lyrics' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByLabelText('Active reader text')).toHaveTextContent('手放した 花びらが')
  })
})
