import { useState, useEffect } from "react"

export interface ConfettiParticle {
    id: number
    color: string
    left: string
    delay: string
    drift: number
}

export function useConfetti(count: number = 50) {
    const [particles, setParticles] = useState<ConfettiParticle[]>([])

    useEffect(() => {
        const colors = ["#22c55e", "#eab308", "#3b82f6", "#ef4444", "#a855f7"]

        setParticles(
            Array.from({ length: count }).map((_, i) => ({
                id: i,
                color: colors[Math.floor(Math.random() * colors.length)] ?? "#22c55e",
                left: `${Math.random() * 100}%`,
                delay: `${Math.random() * 4}s`,
                drift: Math.random() * 100 - 50 // Random horizontal drift between -50px and 50px
            }))
        )
    }, [count])

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

            {particles.map((p) => (
                <div
                    key={p.id}
                    className="absolute w-2 h-2 rounded-sm"
                    style={{
                        backgroundColor: p.color,
                        left: p.left,
                        top: "-10px",
                        // @ts-expect-error - CSS custom properties are valid but not typed in React.CSSProperties
                        "--confetti-drift": `${p.drift}px`,
                        animation: `confetti-fall 3s linear ${p.delay} infinite`
                    }}
                />
            ))}
        </div>
    )
}
