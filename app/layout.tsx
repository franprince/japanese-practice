import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Inter, Inter_Tight, Klee_One, Shippori_Mincho, Zen_Kaku_Gothic_New } from "next/font/google";
import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from "@vercel/speed-insights/next"
import { I18nProvider } from "@/lib/i18n"
import { ThemeProvider } from "@/lib/theme"
import { PerformanceMonitor } from "@/components/performance-monitor"
import { CacheInvalidator } from "@/components/cache-invalidator"
import { Toaster } from "@/components/ui/sonner"
import { JsonLd } from "@/components/seo/json-ld"
import {
  DEFAULT_TITLE,
  HOME_DESCRIPTION,
  NOTEBOOK,
  SITE_NAME,
  SITE_URL,
} from "@/lib/seo"

import "./globals.css";

// Notebook theme typefaces. Inter / Inter Tight carry no Japanese glyphs, so kana and kanji fall
// through to Klee One (handwritten) in display text and Zen Kaku Gothic in body text; mincho is for stamps.
const inter = Inter({ subsets: ["latin"], display: "swap", variable: "--font-inter" });
const interTight = Inter_Tight({ weight: ["300", "400", "500", "600", "700"], subsets: ["latin"], display: "swap", variable: "--font-inter-tight" });
const kleeOne = Klee_One({ weight: ["400", "600"], subsets: ["latin"], display: "swap", variable: "--font-klee", preload: false });
const zenKaku = Zen_Kaku_Gothic_New({ weight: ["400", "500", "700"], subsets: ["latin"], display: "swap", variable: "--font-zen", preload: false });
const shippori = Shippori_Mincho({ weight: ["800"], subsets: ["latin"], display: "swap", variable: "--font-mincho", preload: false });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: DEFAULT_TITLE,
    template: "%s | Nihongo Renshū",
  },
  description: HOME_DESCRIPTION,
  keywords: [
    "Japanese practice",
    "learn Japanese",
    "kana practice",
    "hiragana quiz",
    "katakana quiz",
    "kanji practice",
    "Japanese numbers",
    "Japanese dates",
    "furigana reader",
    "romaji to kana",
    "JLPT study",
    "nihongo renshuu",
    "日本語",
    "練習",
    "ひらがな",
    "カタカナ",
    "漢字",
  ],
  authors: [{ name: "Fran", url: "mailto:hey@franprince.dev" }],
  creator: "Fran",
  applicationName: SITE_NAME,
  category: "education",
  manifest: "/manifest.webmanifest",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: DEFAULT_TITLE,
    description: HOME_DESCRIPTION,
    // images come from app/opengraph-image.tsx, whose URL carries a content hash for cache busting
  },
  twitter: {
    card: "summary_large_image",
    title: "Nihongo Renshū | 日本語 練習",
    description: HOME_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "/",
  },
};

export const viewport: Viewport = {
  themeColor: NOTEBOOK.paper,
};

import { Footer } from "@/components/layouts/footer"

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" data-theme="notebook" className={`${inter.variable} ${interTight.variable} ${kleeOne.variable} ${zenKaku.variable} ${shippori.variable}`} suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground antialiased flex flex-col">
        <ThemeProvider>
          <I18nProvider>
            <JsonLd />
            <Analytics />
            <SpeedInsights />
            <PerformanceMonitor />
            <CacheInvalidator />
            <div className="flex-1 flex flex-col">
              {children}
            </div>
            <Toaster />
            <Footer />
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
