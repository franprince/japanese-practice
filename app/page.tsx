"use client";

import Link from "next/link";
import { LanguageSwitcher } from "@/components/language-switcher";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { ArrowRight } from "lucide-react";

export default function Page() {
    const { t } = useI18n();
    return (
        <main className="min-h-screen bg-background text-foreground">
            <div className="mx-auto max-w-4xl px-4 pb-16 pt-12 md:pt-16">
                <header className="flex flex-col gap-4 mb-10">
                    <div className="w-full flex justify-end">
                        <LanguageSwitcher className="cursor-pointer" />
                    </div>
                    <div className="space-y-3 text-left">
                        <p className="inline-flex items-center rounded-full border border-border/60 bg-card/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground shadow-sm backdrop-blur">
                            {t("chipLabel")}
                        </p>
                        <h1 className="text-4xl font-bold tracking-tight text-foreground md:text-5xl">{t("heroTitle")}</h1>
                        <p className="text-lg text-muted-foreground max-w-2xl">{t("heroSubtitle")}</p>
                    </div>
                </header>

                <div className="grid gap-6 md:grid-cols-2">
                    <Link href="/words" className="block h-full">
                        <div className="h-full rounded-2xl border border-border/60 bg-card/70 p-6 shadow-sm hover:shadow-lg transition-shadow flex flex-col gap-2">
                            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{t("wordsLabel") ?? "Words"}</p>
                            <h2 className="text-2xl font-semibold text-foreground">{t("heroTitle")}</h2>
                            <p className="text-muted-foreground">{t("heroSubtitle")}</p>
                            <div className="mt-auto pt-2">
                                <Button variant="default" className="inline-flex items-center gap-2 hover:bg-primary/90">
                                    {t("startPractice") ?? "Start words"}
                                    <ArrowRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </Link>

                    <Link href="/numbers" className="block h-full">
                        <div className="h-full rounded-2xl border border-border/60 bg-card/70 p-6 shadow-sm hover:shadow-lg transition-shadow flex flex-col gap-2">
                            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{t("numbersTitle")}</p>
                            <h2 className="text-2xl font-semibold text-foreground">{t("numbersSubtitle")}</h2>
                            <p className="text-muted-foreground">{t("writeInJapanese")}</p>
                            <div className="mt-auto pt-2">
                                <Button variant="outline" className="inline-flex items-center gap-2 hover:bg-primary/10 hover:text-primary">
                                    {t("startNumbers") ?? "Start numbers"}
                                    <ArrowRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </Link>

                    <Link href="/kanji" className="block h-full">
                        <div className="h-full rounded-2xl border border-border/60 bg-card/70 p-6 shadow-sm hover:shadow-lg transition-shadow flex flex-col gap-2">
                            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{t("kanjiTitle")}</p>
                            <h2 className="text-2xl font-semibold text-foreground">{t("kanjiSubtitle")}</h2>
                            <p className="text-muted-foreground">{t("whatIsReading")}</p>
                            <div className="mt-auto pt-2">
                                <Button variant="default" className="inline-flex items-center gap-2 hover:bg-primary/90">
                                    {t("nextKanji") ?? "Start kanji"}
                                    <ArrowRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </Link>

                    <Link href="/dates" className="block h-full">
                        <div className="h-full rounded-2xl border border-border/60 bg-card/70 p-6 shadow-sm hover:shadow-lg transition-shadow flex flex-col gap-2">
                            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{t("datesTitle")}</p>
                            <h2 className="text-2xl font-semibold text-foreground">{t("datesSubtitle")}</h2>
                            <p className="text-muted-foreground">{t("writeFullDate")}</p>
                            <div className="mt-auto pt-2">
                                <Button variant="outline" className="inline-flex items-center gap-2 hover:bg-primary/10 hover:text-primary">
                                    {t("nextDate") ?? "Start dates"}
                                    <ArrowRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </Link>
                </div>
            </div>
        </main>
    );
}
