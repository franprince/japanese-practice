"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { LanguageSwitcher } from "@/components/language-switcher"
import { useI18n } from "@/lib/i18n"
import type { GamePageLayoutProps } from "@/types/components"

/**
 * Shared layout component for all game pages
 * Provides consistent structure: header, controls, game content, stats, and footer
 */
export function GamePageLayout({
    title,
    subtitle,
    children,
    controls,
    stats,
    footer,
    showEnterHint = false,
}: GamePageLayoutProps) {
    const { t } = useI18n()

    return (
        <main className="min-h-screen bg-background relative">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent pointer-events-none" />

            <div className="container max-w-3xl mx-auto px-4 py-6 md:py-10 relative">
                <header className="mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <Button asChild variant="ghost" size="sm" className="shrink-0 cursor-pointer -ml-3">
                            <Link href="/">← Home</Link>
                        </Button>
                        <LanguageSwitcher />
                    </div>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-balance bg-linear-to-r from-foreground via-foreground to-primary bg-clip-text">
                            {title}
                        </h1>
                        <p className="text-muted-foreground text-xs md:text-sm">{subtitle}</p>
                    </div>
                </header>

                {/* Controls section (mode selectors, settings, etc.) */}
                {controls && (
                    <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-4 relative">
                        {controls}
                    </div>
                )}

                {/* Main game content */}
                <div className="mt-6 mb-6">
                    {children}
                </div>

                {/* Stats section */}
                {stats && (
                    <div className="mb-6">
                        {stats}
                    </div>
                )}

                {/* Footer section */}
                {footer && footer}

                {/* Default enter hint footer */}
                {showEnterHint && !footer && (
                    <footer className="mt-10 text-center">
                        <p className="text-xs text-muted-foreground/60">
                            {t("pressEnter")}{" "}
                            <kbd className="px-2 py-1 bg-secondary/50 rounded-md text-[10px] font-mono border border-border/50">
                                Enter
                            </kbd>{" "}
                            {t("toSubmit")}
                        </p>
                    </footer>
                )}
            </div>
        </main>
    )
}
