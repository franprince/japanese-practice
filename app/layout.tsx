import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from "@vercel/speed-insights/next"
import { I18nProvider } from "@/lib/i18n"
import { ThemeProvider } from "@/lib/theme"
import { PerformanceMonitor } from "@/components/performance-monitor"
import { CacheInvalidator } from "@/components/cache-invalidator"
import { Toaster } from "@/components/ui/sonner"

import "./globals.css";

export const metadata: Metadata = {
  title: "Nihongo renshū | 日本語 練習",
  description: "Practice Japanese",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <ThemeProvider>
          <I18nProvider>
            <Analytics />
            <SpeedInsights />
            <PerformanceMonitor />
            <CacheInvalidator />
            {children}
            <Toaster />
          </I18nProvider>
        </ThemeProvider>
        <footer className="border-t border-border/40 bg-card/60 backdrop-blur py-8">
          <div className="mx-auto max-w-5xl px-4 text-xs text-muted-foreground leading-relaxed space-y-1.5">
            <p className="text-sm font-medium text-foreground">Developed by Fran 🇦🇷 • <a href="mailto:hey@franprince.dev" className="hover:underline hover:text-primary transition-colors">hey@franprince.dev</a></p>
            <p className="text-sm text-muted-foreground">Inspired by kana.pro</p>
            <p>
              This site uses the <a href="https://www.edrdg.org/wiki/index.php/JMdict-EDICT_Dictionary_Project" target="_blank" rel="noopener noreferrer">JMdict/EDICT</a> and <a href="https://www.edrdg.org/wiki/index.php/KANJIDIC_Project" target="_blank" rel="noopener noreferrer">KANJIDIC</a> dictionary files. These files are the property of the <a href="https://www.edrdg.org/" target="_blank" rel="noopener noreferrer">Electronic Dictionary Research and Development Group</a>, and are used in conformance with the Group&apos;s <a href="https://www.edrdg.org/edrdg/licence.html" target="_blank" rel="noopener noreferrer">licence</a>.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
