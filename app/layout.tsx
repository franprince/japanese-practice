import type { Metadata } from "next";
import type { ReactNode } from "react";
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
  OG_IMAGE,
  SITE_NAME,
  SITE_URL,
} from "@/lib/seo"

import "./globals.css";

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
    images: [OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: "Nihongo Renshū | 日本語 練習",
    description: HOME_DESCRIPTION,
    images: [OG_IMAGE.url],
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

import { Footer } from "@/components/layouts/footer"

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
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
