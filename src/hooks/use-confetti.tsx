import { useState, useMemo } from "react"

import { createRandomSeed, createSeededRandom } from "@/lib/core/random"
import { useHydrated } from "./use-hydrated"

export interface ConfettiParticle {
    id: number
    color: string
    left: string
    delay: string
    drift: number
}

export function useConfetti(count: number = 50) {
    const hydrated = useHydrated()
    const [seed] = useState(createRandomSeed)
    const particles = useMemo<ConfettiParticle[]>(() => {
        const random = createSeededRandom(seed)
        const colors = ["#22c55e", "#eab308", "#3b82f6", "#ef4444", "#a855f7"]
        return Array.from({ length: count }, (_, id) => ({
            id,
            color: colors[Math.floor(random() * colors.length)] ?? "#22c55e",
            left: `${random() * 100}%`,
            delay: `${random() * 4}s`,
            drift: random() * 100 - 50,
        }))
    }, [seed, count])

    return (
        <div
            aria-hidden="true"
            className="absolute inset-0 overflow-hidden pointer-events-none z-0"
        >
            <style jsx>{`
        @keyframes confetti-fall {
          0% { transform: translate(0, -10px) rotate(0deg); opacity: 1; }
          100% { transform: translate(var(--confetti-drift), 400px) rotate(360deg); opacity: 0; }
        }
      `}</style>

            {hydrated && particles.map((p) => (
                <div
                    key={p.id}
                    className="absolute w-2 h-2 rounded-sm"
                    style={{
                        backgroundColor: p.color,
                        left: p.left,
                        top: "-10px",
                        "--confetti-drift": `${p.drift}px`,
                        animation: `confetti-fall 3s linear ${p.delay} infinite`
                    } as React.CSSProperties}
                />
            ))}
        </div>
    )
}
