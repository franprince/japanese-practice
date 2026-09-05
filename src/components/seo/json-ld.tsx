import { HOME_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/seo"

interface JsonLdData {
  "@context": string
  "@type": string
  [key: string]: unknown
}

function buildWebApplicationLd(): JsonLdData {
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: SITE_NAME,
    alternateName: "日本語 練習",
    url: SITE_URL,
    applicationCategory: "EducationalApplication",
    operatingSystem: "Any",
    description: HOME_DESCRIPTION,
    inLanguage: ["en", "es", "ja"],
    author: {
      "@type": "Person",
      name: "Fran",
      email: "hey@franprince.dev",
    },
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    isAccessibleForFree: true,
    featureList: [
      "Hiragana and katakana word practice",
      "Kanji reading and meaning quizzes (N5–N1)",
      "Japanese number writing drills",
      "Japanese date reading exercises",
      "Streak tracking and session progress",
      "Multiple difficulty levels",
      "Multilingual interface (EN/ES/JA)",
    ],
  }
}

export function JsonLd() {
  const jsonLd = buildWebApplicationLd()
  const serializedJsonLd = JSON.stringify(jsonLd).replace(/</g, "\\u003c")

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializedJsonLd }}
    />
  )
}
