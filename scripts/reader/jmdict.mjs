// Parses the JMdict XML (the EDRDG's JMdict_e file) into plain entries.
import sax from 'sax'
import { DIAL_LABELS, FIELD_LABELS, MISC_LABELS, POS_LABELS, SEARCH_ONLY } from './jmdict-labels.mjs'

/**
 * @param {string} xml
 * @returns {{ date: string, entries: { kanji: string[], kana: string[], hidden: string[], common: boolean,
 *   senses: { pos: string[], gloss: string[], notes: string[] }[] }[] }}
 */
export function parseJMdict(xml) {
  const parser = sax.parser(true, { trim: true })
  // Entities such as &v1; carry the tag codes. Keep the code itself and map it to a label below.
  const head = xml.slice(0, xml.indexOf('<JMdict>'))
  for (const [, name] of head.matchAll(/<!ENTITY\s+(\S+)\s+"/g)) parser.ENTITIES[name] = name
  const date = head.match(/JMdict created: (\d{4}-\d\d-\d\d)/)?.[1] ?? 'unknown date'

  const entries = []
  let entry, sense, form, text, lastPos
  parser.onopentag = (tag) => {
    text = ''
    if (tag.name === 'entry') entry = { kanji: [], kana: [], hidden: [], senses: [], common: false }
    else if (tag.name === 'sense') sense = { pos: [], gloss: [], notes: [] }
    else if (tag.name === 'k_ele' || tag.name === 'r_ele') form = { text: '', searchOnly: false }
  }
  parser.ontext = (t) => (text += t)
  parser.onclosetag = (name) => {
    switch (name) {
      case 'keb':
      case 'reb': form.text = text; break
      case 'ke_inf':
      case 're_inf': if (SEARCH_ONLY.has(text)) form.searchOnly = true; break
      case 'ke_pri':
      case 're_pri': if (/^(news1|ichi1|spec[12]|gai1)$/.test(text)) entry.common = true; break
      // Search-only spellings stay findable but aren't shown as the word's spellings.
      case 'k_ele': (form.searchOnly ? entry.hidden : entry.kanji).push(form.text); break
      case 'r_ele': (form.searchOnly ? entry.hidden : entry.kana).push(form.text); break
      case 'pos': sense.pos.push(POS_LABELS[text] ?? text); break
      case 'field': sense.notes.push(FIELD_LABELS[text] ?? text); break
      case 'misc': if (MISC_LABELS[text]) sense.notes.push(MISC_LABELS[text]); break
      case 'dial': sense.notes.push(DIAL_LABELS[text] ?? text); break
      case 's_inf': sense.notes.push(text); break
      case 'gloss': sense.gloss.push(text); break
      case 'sense':
        // A sense without <pos> shares the part of speech of the one before it.
        if (!sense.pos.length) sense.pos = lastPos ?? []
        lastPos = sense.pos
        entry.senses.push(sense)
        break
      case 'entry':
        lastPos = undefined
        if (entry.senses.length && entry.kana.length) entries.push(entry)
        break
    }
  }
  parser.write(xml).close()
  return { date, entries }
}
