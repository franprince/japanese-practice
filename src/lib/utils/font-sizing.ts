/**
 * Get responsive font size classes based on content length
 * Used across game components for consistent text sizing
 */
export function getResponsiveFontSize(content: string | number): string {
    const length = typeof content === 'string' ? content.length : String(content).length

    if (length <= 2) return "text-7xl md:text-8xl"
    if (length <= 4) return "text-6xl md:text-7xl"
    if (length <= 6) return "text-5xl md:text-6xl"
    if (length <= 8) return "text-4xl md:text-5xl"
    if (length <= 12) return "text-3xl md:text-4xl"
    return "text-2xl md:text-3xl"
}
