"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { LanguageSwitcher } from "@/components/language-switcher"
import { useI18n } from "@/lib/i18n"
import { cn } from "@/lib/core"
import type { GamePageLayoutProps } from "@/types/ui"


export function GamePageLayout({
    title,
    subtitle,
    children,
    controls,
    topbarContent,
    stats,
    footer,
    showEnterHint = false,
    remainingLabel,
    settingsTrigger,
}: GamePageLayoutProps) {
    const { t } = useI18n()

    return (
        <main className="flex-1 flex flex-col relative overflow-hidden">
            <div className="fixed inset-0 pointer-events-none -z-10">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/5 blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-accent/5 blur-[120px]" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[url('/grid.svg')] opacity-[0.02] [mask-image:radial-gradient(ellipse_at_center,black,transparent)]" />
            </div>

            <div className="container mx-auto px-4 max-w-4xl pt-6 pb-20 md:py-12 relative transition-all duration-300">
                
                {}
                <header className="mb-6 md:mb-12 text-center space-y-4 md:space-y-6">
                    <div className="flex items-center justify-between gap-4 mb-6">
                        <Button asChild variant="ghost" size="sm" className="rounded-full bg-background/20 backdrop-blur-md border border-border/10 hover:bg-background/40 px-4 shrink-0">
                            <Link href="/">← {t("home") || "Home"}</Link>
                        </Button>
                        
                        {settingsTrigger && (
                            <div className="hidden sm:flex flex-1 justify-center animate-in fade-in zoom-in-95 duration-500">
                                {settingsTrigger}
                            </div>
                        )}

                        <div className="shrink-0">
                            <LanguageSwitcher />
                        </div>
                    </div>

                    <div className="space-y-4">
                        {remainingLabel && (
                            <div className="flex items-center justify-center mb-6">
                                <span className="px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-black uppercase tracking-[0.2em] text-primary">
                                    {remainingLabel}
                                </span>
                            </div>
                        )}
                        <h1 className="text-2xl md:text-5xl lg:text-6xl font-black tracking-tighter text-balance uppercase">
                            {title}
                        </h1>
                        <p className="hidden md:block text-muted-foreground text-sm max-w-lg mx-auto leading-relaxed opacity-80 uppercase tracking-widest text-[10px] font-bold">
                            {subtitle}
                        </p>
                    </div>

                    {}
                    {(controls || topbarContent) && (
                        <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
                            {topbarContent || controls}
                        </div>
                    )}
                </header>

                <div className="flex flex-col items-center gap-8 lg:gap-12 w-full">
                    {}
                    <div className="w-full space-y-8 flex flex-col items-center">
                        <div className="relative w-full">
                            {/* Hero Card Container */}
                            {children}
                        </div>

                        {stats && (
                            <div className="w-full max-w-xl">
                                {stats}
                            </div>
                        )}
                    </div>
                </div>

                {footer && (
                    <div className="mt-16 pt-8 border-t border-border/20">
                        {footer}
                    </div>
                )}

                {showEnterHint && (
                    <div className="mt-8 text-center animate-in fade-in duration-1000">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">
                            {t("pressEnter")} <span className="text-primary/60 mx-1">ENTER</span> {t("toSubmit")}
                        </p>
                    </div>
                )}
            </div>
        </main>
    )
}
