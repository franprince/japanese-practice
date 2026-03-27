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
}: GamePageLayoutProps) {
    const { t } = useI18n()

    return (
        <main className="min-h-screen relative overflow-hidden">
            {/* Dynamic Background Elements */}
            <div className="fixed inset-0 pointer-events-none -z-10">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/10 blur-[120px] animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-accent/10 blur-[120px] animate-pulse" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[url('/grid.svg')] opacity-[0.03] [mask-image:radial-gradient(ellipse_at_center,black,transparent)]" />
            </div>

            {topbarContent && (
                <div className="hidden md:flex fixed top-4 inset-x-4 h-16 bg-background/40 backdrop-blur-xl border border-border/20 z-50 px-6 items-center justify-between rounded-full shadow-2xl transition-all">
                    <div className="flex items-center gap-4 shrink-0">
                        <Button asChild variant="ghost" size="sm" className="rounded-full h-9 px-4 text-muted-foreground hover:text-foreground hover:bg-background/40 transition-all active:scale-95">
                            <Link href="/">← {t("home") || "Home"}</Link>
                        </Button>
                        <div className="w-px h-6 bg-border/20 hidden xl:block" />
                        <h1 className="text-sm font-black uppercase tracking-widest text-foreground hidden xl:block">
                            {title}
                        </h1>
                    </div>
                    
                    <div className="flex-1 flex justify-center items-center px-8">
                        {topbarContent}
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                        <LanguageSwitcher />
                    </div>
                </div>
            )}

            <div className={cn("container mx-auto px-4 relative transition-all duration-300", 
                topbarContent ? "max-w-7xl pt-24 md:pt-28 pb-12" : "max-w-4xl py-12")}>
                
                <header className={cn("mb-12 text-center space-y-4", topbarContent && "md:hidden")}>
                    <div className="flex items-center justify-between mb-8">
                        <Button asChild variant="ghost" size="sm" className="rounded-full">
                            <Link href="/">← Home</Link>
                        </Button>
                        <LanguageSwitcher />
                    </div>
                    <div className="inline-block px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest mb-2 animate-in fade-in slide-in-from-bottom-2">
                        {t("practice") || "Practice Session"}
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-balance">
                        {title}
                    </h1>
                    <p className="text-muted-foreground text-sm md:text-base max-w-lg mx-auto leading-relaxed">
                        {subtitle}
                    </p>
                </header>

                <div className="flex flex-col items-center gap-8 lg:gap-12 max-w-4xl mx-auto w-full">
                    {}
                    <div className="w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col items-center">
                        {}
                        {controls && (
                            <div className={cn("flex flex-wrap items-center justify-center gap-3 md:hidden w-full")}>
                                {controls}
                            </div>
                        )}

                        {stats && (
                            <div className="w-full max-w-xl animate-in fade-in slide-in-from-top-4 duration-700 delay-100">
                                {stats}
                            </div>
                        )}
                        
                        <div className="relative w-full">
                            {/* Hero Card Container */}
                            {children}
                        </div>
                    </div>
                </div>

                {footer && (
                    <div className="mt-16 pt-8 border-t border-border/20">
                        {footer}
                    </div>
                )}
            </div>
        </main>
    )
}
