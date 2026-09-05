import { describe, expect, it } from "bun:test"
import { render } from "@testing-library/react"
import { renderToString } from "react-dom/server"
import { useConfetti } from "../use-confetti"

function Celebration({ count }: { count: number }) { return useConfetti(count) }
const particles = (container: HTMLElement) => Array.from(container.querySelectorAll('div[style]')).map(node => node.getAttribute('style'))
describe("confetti lifecycle", () => {
    it("keeps particle styling stable across rerenders and honors a new count", () => {
        const { container, rerender } = render(<Celebration count={5} />)
        const initial = particles(container)
        expect(initial).toHaveLength(5)
        rerender(<Celebration count={5} />)
        expect(particles(container)).toEqual(initial)
        rerender(<Celebration count={8} />)
        expect(particles(container)).toHaveLength(8)
        expect(particles(container).slice(0, 5)).toEqual(initial)
    })
    it("omits random particle styles in server markup", () => {
        expect(renderToString(<Celebration count={5} />)).not.toContain('background-color:')
    })
})
