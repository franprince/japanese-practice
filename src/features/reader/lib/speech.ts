export const canSpeak = typeof window !== 'undefined' && 'speechSynthesis' in window

let voice: SpeechSynthesisVoice | undefined
function japaneseVoice() {
  voice ??= speechSynthesis.getVoices().find((v) => v.lang.replace('_', '-').startsWith('ja'))
  return voice
}
if (canSpeak) speechSynthesis.addEventListener?.('voiceschanged', () => (voice = undefined))

export function speak(text: string, rate = 0.9) {
  if (!canSpeak) return
  speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text)
  u.lang = 'ja-JP'
  u.rate = rate
  const v = japaneseVoice()
  if (v) u.voice = v
  speechSynthesis.speak(u)
}
