import { describe, expect, it } from 'bun:test'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { SpotifySource, type LyricsState, type SpotifyState } from '../reader-app'
import { vi } from './vi'

const link = { kind: 'track', url: 'https://open.spotify.com/track/2hoKhipu6bG2FpYDXLUk7v' }
const song = (lyrics?: LyricsState): SpotifyState => ({
  status: 'done',
  link,
  title: '花鬘',
  artist: '植田真梨恵',
  thumbnail: 'https://i.scdn.co/x',
  lyrics,
})

function SpotifySourceHarness({ state }: { state: SpotifyState }) {
  const initialText = state.status === 'done' && state.lyrics?.status === 'done' ? state.lyrics.text : ''
  const [text, setText] = useState(initialText)
  return (
    <div>
      <SpotifySource state={state} activeText={text} onSelectText={setText} />
      <output aria-label="Active reader text">{text}</output>
    </div>
  )
}

describe('SpotifySource', () => {
  it('offers a button that requests the lyrics instead of loading them up front', async () => {
    const user = userEvent.setup()
    const onRequestLyrics = vi.fn()
    render(<SpotifySource state={song()} activeText="花鬘" onRequestLyrics={onRequestLyrics} />)

    expect(screen.getByText('花鬘 · 植田真梨恵')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Show song lyrics' })).toBeNull()
    await user.click(screen.getByRole('button', { name: 'Load song lyrics' }))
    expect(onRequestLyrics).toHaveBeenCalledTimes(1)
  })

  it('disables the button while the lyrics load', () => {
    render(<SpotifySource state={song({ status: 'loading' })} onRequestLyrics={() => {}} />)
    expect(screen.getByRole('button', { name: 'Load song lyrics' })).toBeDisabled()
    expect(screen.getByText('Loading lyrics…')).toBeInTheDocument()
  })

  it('says when no lyrics were found and lets the user retry after an error', async () => {
    const { rerender } = render(<SpotifySource state={song({ status: 'missing' })} onRequestLyrics={() => {}} />)
    expect(screen.getByText('No lyrics found')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Load song lyrics' })).toBeNull()

    const onRequestLyrics = vi.fn()
    rerender(<SpotifySource state={song({ status: 'error', message: 'Spotify answered 502' })} onRequestLyrics={onRequestLyrics} />)
    expect(screen.getByText('Spotify answered 502')).toBeInTheDocument()
    await userEvent.setup().click(screen.getByRole('button', { name: 'Try loading the lyrics again' }))
    expect(onRequestLyrics).toHaveBeenCalledTimes(1)
  })

  it('only offers lyrics for songs', () => {
    const album: SpotifyState = { status: 'done', link: { kind: 'album', url: 'https://open.spotify.com/album/2hoKhipu6bG2FpYDXLUk7v' }, title: 'Album' }
    render(<SpotifySource state={album} onRequestLyrics={() => {}} />)
    expect(screen.queryByRole('button', { name: 'Load song lyrics' })).toBeNull()
  })

  it('lets the user toggle between loaded lyrics and the title', async () => {
    const user = userEvent.setup()
    render(<SpotifySourceHarness state={song({ status: 'done', text: '手放した 花びらが\n音も無く 流れてく' })} />)

    expect(screen.getByRole('button', { name: 'Show song lyrics' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Show song title' })).toHaveAttribute('aria-pressed', 'false')
    expect(screen.queryByRole('button', { name: 'Load song lyrics' })).toBeNull()

    await user.click(screen.getByRole('button', { name: 'Show song title' }))
    expect(screen.getByRole('button', { name: 'Show song title' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByLabelText('Active reader text')).toHaveTextContent('花鬘')

    await user.click(screen.getByRole('button', { name: 'Show song lyrics' }))
    expect(screen.getByLabelText('Active reader text')).toHaveTextContent('手放した 花びらが')
  })
})
