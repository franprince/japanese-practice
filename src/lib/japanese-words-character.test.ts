import { describe, test, expect } from 'bun:test'
import { getRandomCharacter, characterGroups } from './japanese-words'

describe('getRandomCharacter', () => {
    test('returns a character of the specified type', () => {
        const targetGroup = characterGroups.find(g => g.type === 'hiragana')?.id
        if (!targetGroup) throw new Error('No hiragana group found')

        const char = getRandomCharacter('hiragana', { selectedGroups: [targetGroup], minLength: 1, maxLength: 5 })
        expect(char).not.toBeNull()
        expect(char?.type).toBe('hiragana')
    })

    test('returns null if no groups match', () => {
        const char = getRandomCharacter('hiragana', { selectedGroups: [], minLength: 1, maxLength: 5 })
        expect(char).toBeNull()
    })

    test('filters by selected groups', () => {
        // Find a specific group ID
        const targetGroup = characterGroups.find(g => g.type === 'hiragana')?.id
        if (!targetGroup) throw new Error('No hiragana group found')

        const char = getRandomCharacter('hiragana', { selectedGroups: [targetGroup], minLength: 1, maxLength: 5 })
        expect(char).not.toBeNull()
        expect(char?.groups).toContain(targetGroup)
    })

    test('generates string of correct length', () => {
        const targetGroup = characterGroups.find(g => g.type === 'hiragana')?.id
        if (!targetGroup) throw new Error()

        const char = getRandomCharacter('hiragana', {
            selectedGroups: [targetGroup],
            minLength: 3,
            maxLength: 3
        })
        expect(char).not.toBeNull()
        // Length of Kana string might vary if there are digraphs? 
        // Digraphs are usually 2 chars. 
        // But our `characters` array in group has single strings (e.g. "kyu" -> "きゅ").
        // So `string.length` is not character count if we count "きゅ" as 1 unit.
        // BUT `kana.length` in JS string counts characters.
        // Wait, `length` loop appends `char`. `char` comes from `randomGroup.characters`.
        // Is `randomGroup.characters` an array of strings? Yes.
        // If "kyu" is one element, it's length 2.
        // If we want "visual length" (N characters/blocks), we loop N times.
        // The resulting string length >= N.
        // Let's just check it's not empty and longer than 0.
        expect(char?.kana.length).toBeGreaterThanOrEqual(3)
    })
})
