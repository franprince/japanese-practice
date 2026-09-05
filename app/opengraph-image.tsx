import { ImageResponse } from "next/og"

export const alt = "Nihongo Renshū — Japanese Practice App"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 40%, #16213e 100%)",
          fontFamily: "system-ui, sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Decorative gradient orbs */}
        <div
          style={{
            position: "absolute",
            top: "-100px",
            right: "-100px",
            width: "400px",
            height: "400px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(0, 200, 200, 0.15) 0%, transparent 70%)",
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-80px",
            left: "-80px",
            width: "350px",
            height: "350px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(200, 50, 150, 0.12) 0%, transparent 70%)",
            display: "flex",
          }}
        />

        {/* Main kanji icon */}
        <div
          style={{
            fontSize: "120px",
            marginBottom: "16px",
            display: "flex",
            color: "#ffffff",
          }}
        >
          練
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: "56px",
            fontWeight: 300,
            color: "#ffffff",
            letterSpacing: "-1px",
            display: "flex",
            marginBottom: "8px",
          }}
        >
          Nihongo Renshū
        </div>

        {/* Japanese subtitle */}
        <div
          style={{
            fontSize: "28px",
            color: "rgba(0, 200, 200, 0.9)",
            display: "flex",
            marginBottom: "24px",
            letterSpacing: "8px",
          }}
        >
          日本語 練習
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: "20px",
            color: "rgba(255, 255, 255, 0.6)",
            display: "flex",
            maxWidth: "700px",
            textAlign: "center",
            lineHeight: 1.5,
          }}
        >
          Master Japanese through interactive quizzes — kana, kanji, numbers & dates
        </div>

        {/* Bottom accent line */}
        <div
          style={{
            position: "absolute",
            bottom: "40px",
            display: "flex",
            gap: "12px",
            alignItems: "center",
          }}
        >
          <div
            style={{
              width: "60px",
              height: "3px",
              background: "rgba(0, 200, 200, 0.8)",
              display: "flex",
            }}
          />
          <div
            style={{
              fontSize: "14px",
              color: "rgba(255, 255, 255, 0.4)",
              display: "flex",
              letterSpacing: "3px",
              textTransform: "uppercase" as const,
            }}
          >
            nihongo-renshuu.app
          </div>
          <div
            style={{
              width: "60px",
              height: "3px",
              background: "rgba(0, 200, 200, 0.8)",
              display: "flex",
            }}
          />
        </div>
      </div>
    ),
    { ...size }
  )
}
