


export function getRandomElement<T>(array: T[]): T | null {
    if (array.length === 0) return null
    return array[Math.floor(Math.random() * array.length)]!
}


export function shuffleArray<T>(array: T[], random: () => number = Math.random): T[] {
    const shuffled = [...array]
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1))
            ;[shuffled[i], shuffled[j]] = [shuffled[j]!, shuffled[i]!]
    }
    return shuffled
}


export function getRandomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min
}

// A fresh generator per calculation makes render replay deterministic. Mulberry32
// is for practice question sampling and visual variation, never security.
export function createSeededRandom(seed: number): () => number {
    let value = seed >>> 0
    return () => {
        value = (value + 0x6D2B79F5) | 0
        let mixed = Math.imul(value ^ value >>> 15, 1 | value)
        mixed ^= mixed + Math.imul(mixed ^ mixed >>> 7, 61 | mixed)
        return ((mixed ^ mixed >>> 14) >>> 0) / 4294967296
    }
}

export function createRandomSeed(): number {
    return Math.floor(Math.random() * 4294967296)
}
