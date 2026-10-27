import { ImageResponse } from "next/og"
import { NOTEBOOK, OG_IMAGE } from "@/lib/seo"

export const alt = OG_IMAGE.alt
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

const heroColumn = ["毎", "日", "練", "習"]
const CELL = 118
const KICKER = "今日の練習"
const HEADLINE = ["A little Japanese,", "every"] as const
const HANKO = ["よく", "できた"]
const BRAND = "日本語 練習"
const KICKER_EN = "Today's practice"
const TAGLINE = ["Kana, kanji, numbers and dates —", "plus a furigana reader."]
const BRAND_LINES = ["Nihongo Renshū", "nihongo-renshuu.app"]

/** Fetches a Google Font subset containing only `text`, as TTF (satori can't read woff2). */
async function loadGoogleFont(family: string, weight: number, text: string): Promise<ArrayBuffer | null> {
  try {
    const query = `family=${family.replace(/ /g, "+")}:wght@${weight}&text=${encodeURIComponent(text)}`
    const css = await (await fetch(`https://fonts.googleapis.com/css2?${query}`)).text()
    const src = css.match(/src: url\((.+?)\) format\('(?:opentype|truetype)'\)/)?.[1]
    if (!src) return null
    const font = await fetch(src)
    return font.ok ? await font.arrayBuffer() : null
  } catch {
    return null
  }
}

/** One square of genkō yōshi: hairline red border with a faint centre cross. */
function GenkoCell({ char, traced }: { char: string; traced?: boolean }) {
  const line = "rgba(181, 55, 31, 0.3)"
  return (
    <div
      style={{
        position: "relative",
        width: CELL,
        height: CELL,
        marginTop: -2,
        marginLeft: -2,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        border: "2px solid rgba(181, 55, 31, 0.4)",
        background: NOTEBOOK.card,
      }}
    >
      <div style={{ position: "absolute", left: CELL / 2 - 2, top: 0, width: 1, height: CELL - 4, background: line, display: "flex" }} />
      <div style={{ position: "absolute", top: CELL / 2 - 2, left: 0, height: 1, width: CELL - 4, background: line, display: "flex" }} />
      <span
        style={{
          fontFamily: "Klee One",
          fontWeight: 600,
          fontSize: 80,
          color: traced ? "rgba(34, 32, 28, 0.22)" : NOTEBOOK.ink,
        }}
      >
        {char}
      </span>
    </div>
  )
}

export default async function OgImage() {
  const loaded = await Promise.all([
    loadGoogleFont("Inter", 400, `${TAGLINE.join("")}${BRAND_LINES.join("")}`),
    loadGoogleFont("Inter", 700, `—${KICKER_EN}`),
    loadGoogleFont("Klee One", 600, `${KICKER}${HEADLINE.join(" ")} day.${heroColumn.join("")}${BRAND}`),
    loadGoogleFont("Shippori Mincho", 800, HANKO.join("")),
  ])
  const specs = [
    { name: "Inter", weight: 400 },
    { name: "Inter", weight: 700 },
    { name: "Klee One", weight: 600 },
    { name: "Shippori Mincho", weight: 800 },
  ] as const
  // All or nothing: a partial set would replace the bundled default font and drop glyphs.
  const fonts = loaded.every(data => data !== null)
    ? specs.map((spec, i) => ({ ...spec, data: loaded[i] as ArrayBuffer, style: "normal" as const }))
    : undefined

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 96px 0 88px",
          fontFamily: "Inter",
          background: NOTEBOOK.paper,
          backgroundImage:
            "linear-gradient(rgba(181, 55, 31, 0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(181, 55, 31, 0.07) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
          color: NOTEBOOK.ink,
        }}
      >
        {/* Left: kicker, headline, tagline, brand */}
        <div style={{ display: "flex", flexDirection: "column", maxWidth: 640 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, color: NOTEBOOK.red, fontSize: 26, fontWeight: 700 }}>
            <span style={{ fontFamily: "Klee One", fontWeight: 600, fontSize: 30 }}>{KICKER}</span>
            <span>—</span>
            <span>{KICKER_EN}</span>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              marginTop: 22,
              fontFamily: "Klee One",
              fontWeight: 600,
              fontSize: 78,
              lineHeight: 1.12,
              letterSpacing: "-0.02em",
            }}
          >
            <span>{HEADLINE[0]}</span>
            <span style={{ display: "flex" }}>
              {HEADLINE[1]}&nbsp;<span style={{ color: NOTEBOOK.red }}>day</span>.
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", marginTop: 26, fontSize: 28, lineHeight: 1.4, color: NOTEBOOK.muted }}>
            {TAGLINE.map(line => <span key={line}>{line}</span>)}
          </div>

          <div style={{ display: "flex", alignItems: "stretch", marginTop: 44, border: `1px solid ${NOTEBOOK.border}`, background: NOTEBOOK.card, alignSelf: "flex-start" }}>
            <span style={{ display: "flex", alignItems: "center", padding: "8px 18px", fontFamily: "Klee One", fontWeight: 600, fontSize: 30, letterSpacing: "0.06em", borderRight: `1px solid ${NOTEBOOK.border}` }}>
              {BRAND}
            </span>
            <span style={{ display: "flex", flexDirection: "column", justifyContent: "center", padding: "6px 16px", fontSize: 17, lineHeight: 1.3, color: NOTEBOOK.muted }}>
              {BRAND_LINES.map(line => <span key={line}>{line}</span>)}
            </span>
          </div>
        </div>

        {/* Right: genkō columns with a traced copy, and the hanko stamp */}
        <div style={{ position: "relative", display: "flex", marginRight: 20 }}>
          <div style={{ display: "flex", flexDirection: "column", paddingTop: 2, paddingLeft: 2 }}>
            {heroColumn.map(ch => <GenkoCell key={ch} char={ch} />)}
          </div>
          <div style={{ display: "flex", flexDirection: "column", paddingTop: 2 }}>
            {heroColumn.map((ch, i) => <GenkoCell key={ch} char={i < 2 ? ch : ""} traced />)}
          </div>
          <div
            style={{
              position: "absolute",
              right: -40,
              bottom: -30,
              width: 116,
              height: 116,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 9999,
              border: `4px solid ${NOTEBOOK.red}`,
              background: NOTEBOOK.card,
              transform: "rotate(-10deg)",
            }}
          >
            <div
              style={{
                width: 96,
                height: 96,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 9999,
                border: `2px solid ${NOTEBOOK.red}`,
                color: NOTEBOOK.red,
                fontFamily: "Shippori Mincho",
                fontWeight: 800,
                fontSize: 25,
                lineHeight: 1.1,
              }}
            >
              {HANKO.map(line => <span key={line}>{line}</span>)}
            </div>
          </div>
        </div>
      </div>
    ),
    { ...size, fonts },
  )
}
