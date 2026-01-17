/**
 * Random selection and array manipulation utilities
 */

/**
 * Get a random element from an array
 */
export function getRandomElement<T>(array: T[]): T | null {
    if (array.length === 0) return null
    return array[Math.floor(Math.random() * array.length)]!
}

/**
 * Shuffle an array using Fisher-Yates algorithm
 */
export function shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array]
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
            ;[shuffled[i], shuffled[j]] = [shuffled[j]!, shuffled[i]!]
    }
    return shuffled
}

/**
 * Get a random integer between min (inclusive) and max (inclusive)
 */
export function getRandomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min
}
