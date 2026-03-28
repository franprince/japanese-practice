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

import { Footer } from "@/components/layouts/footer"

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground antialiased flex flex-col">
        <ThemeProvider>
          <I18nProvider>
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
