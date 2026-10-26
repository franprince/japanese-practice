// The JMdict converter, on a sample in the official JMdict_e format (DTD
// entities for tags, <!-- JMdict created --> date), since the real file is
// only downloaded at deploy time.
import { describe, expect, it } from 'bun:test'
import { parseJMdict } from '../../../../scripts/reader/jmdict.mjs'

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE JMdict [
<!ENTITY n "noun (common) (futsuumeishi)">
<!ENTITY v1 "Ichidan verb">
<!ENTITY vt "transitive verb">
<!ENTITY comp "computing">
<!ENTITY med "medicine">
<!ENTITY ksb "Kansai-ben">
<!ENTITY uk "word usually written using kana alone">
<!ENTITY sK "search-only kanji form">
<!ENTITY sk "search-only kana form">
<!ENTITY int "interjection (kandoushi)">
]>
<!-- JMdict created: 2026-10-21 -->
<JMdict>
<entry>
<ent_seq>2861598</ent_seq>
<r_ele><reb>ハルシネーション</reb></r_ele>
<r_ele><reb>ハルシネイション</reb></r_ele>
<r_ele><reb>ハルシネーシヨン</reb><re_inf>&sk;</re_inf></r_ele>
<sense><pos>&n;</pos><field>&comp;</field><gloss>hallucination (in generative artificial intelligence)</gloss></sense>
<sense><field>&med;</field><gloss>hallucination</gloss></sense>
</entry>
<entry>
<ent_seq>1358280</ent_seq>
<k_ele><keb>食べる</keb><ke_pri>ichi1</ke_pri></k_ele>
<k_ele><keb>喰べる</keb><ke_inf>&sK;</ke_inf></k_ele>
<r_ele><reb>たべる</reb><re_pri>ichi1</re_pri></r_ele>
<sense><pos>&v1;</pos><pos>&vt;</pos><misc>&uk;</misc><s_inf>&amp; drink</s_inf><gloss>to eat</gloss></sense>
</entry>
<entry>
<ent_seq>2000000</ent_seq>
<r_ele><reb>おおきに</reb></r_ele>
<sense><pos>&int;</pos><dial>&ksb;</dial><gloss>thank you</gloss></sense>
</entry>
</JMdict>`

describe('parseJMdict', () => {
  const { date, entries } = parseJMdict(xml)
  const [hallucination, taberu, ookini] = entries

  it('reads the creation date', () => {
    expect(date).toBe('2026-10-21')
  })

  it('keeps every sense with its subject tag, and carries the part of speech over', () => {
    expect(hallucination!.senses).toEqual([
      { pos: ['noun'], gloss: ['hallucination (in generative artificial intelligence)'], notes: ['computing'] },
      { pos: ['noun'], gloss: ['hallucination'], notes: ['medicine'] },
    ])
  })

  it('separates search-only spellings from the ones to show', () => {
    expect(hallucination!.kana).toEqual(['ハルシネーション', 'ハルシネイション'])
    expect(hallucination!.hidden).toEqual(['ハルシネーシヨン'])
    expect(taberu!.kanji).toEqual(['食べる'])
    expect(taberu!.hidden).toEqual(['喰べる'])
  })

  it('maps tags to labels and marks common words', () => {
    expect(taberu!.senses[0]).toEqual({ pos: ['ichidan verb', 'transitive verb'], gloss: ['to eat'], notes: ['usually kana', '& drink'] })
    expect(taberu!.common).toBe(true)
    expect(hallucination!.common).toBe(false)
    expect(ookini!.senses[0]!.notes).toEqual(['Kansai dialect'])
  })
})
