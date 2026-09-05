/** Kana conversion; changing spelling rules belongs here, not in question state. */
import { getKanaRomajiMapSync } from "../shared/kana-dictionary-loader"

export const kanaToRomaji = (text: string) => convertKanaToRomaji(text, getKanaRomajiMapSync())

const hiraToKata = (text: string) =>
  text.replace(/[\u3041-\u3096]/g, c => String.fromCharCode(c.charCodeAt(0) + 0x60))

export const convertKanaToRomaji = (text: string, kanaRomajiMap: Record<string, string>) => {
  let romaji = ""
  let i = 0
  const normalized = text || ""

  while (i < normalized.length) {
    const char = normalized[i]

    if (char === "っ" || char === "ッ") {

      const nextTri = normalized.slice(i + 1, i + 3)
      const nextChar = normalized[i + 1]
      const nextMapped =
        (nextTri && kanaRomajiMap[nextTri]) ||
        (nextChar && (kanaRomajiMap[nextChar] || kanaRomajiMap[hiraToKata(nextChar)])) ||
        ""
      if (nextMapped) {
        const first = nextMapped[0] ?? ""
        if (/[bcdfghjklmnpqrstvwxyz]/i.test(first)) {
          romaji += first
        }
      }
      i += 1
      continue
    }

    if (char === "ー") {
      if (romaji.length > 0) {
        const lastChar = romaji[romaji.length - 1]

        switch (lastChar) {
          case 'a': romaji = romaji.slice(0, -1) + 'ā'; break;
          case 'i': romaji = romaji.slice(0, -1) + 'ī'; break;
          case 'u': romaji = romaji.slice(0, -1) + 'ū'; break;
          case 'e': romaji = romaji.slice(0, -1) + 'ē'; break;
          case 'o': romaji = romaji.slice(0, -1) + 'ō'; break;

          case 'ā': case 'ī': case 'ū': case 'ē': case 'ō':

            break;
          default:

            break;
        }
      }
      i += 1
      continue
    }

    const tri = normalized.slice(i, i + 2)
    if (kanaRomajiMap[tri]) {
      romaji += kanaRomajiMap[tri]
      i += 2
      continue
    }

    if (!char) break
    const mapped = kanaRomajiMap[char] || kanaRomajiMap[hiraToKata(char)] || ""
    romaji += mapped
    i += 1
  }

  return romaji
    .replace(/aa/g, "ā")
    .replace(/ii/g, "ī")
    .replace(/uu/g, "ū")
    .replace(/ee/g, "ē")
    .replace(/oo/g, "ō")
    .replace(/ou/g, "ō")
}
