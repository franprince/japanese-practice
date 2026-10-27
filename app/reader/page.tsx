"use client"
import dynamic from "next/dynamic"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { SiteHeader } from "@/components/layouts/site-header"
import { Button } from "@/components/ui/button"
import { useI18n } from "@/lib/i18n"

// The reader reads location/localStorage on start and runs kuromoji in a worker, so it renders on the client only.
const ReaderApp = dynamic(() => import("@/features/reader/reader-app"), {
  ssr: false,
  loading: () => <p role="status" className="py-16 text-center text-muted-foreground">…</p>,
})

export default function ReaderPage() {
  const { t } = useI18n()
  return <>
    <SiteHeader label={t("home")} start={<Button asChild variant="ghost" className="min-h-11 gap-2 px-2 font-bold"><Link href="/"><ArrowLeft className="size-[18px]" aria-hidden="true" />{t("home")}</Link></Button>} />
    <main className="flex-1 px-4 pb-16 pt-8 sm:px-6 sm:pt-10">
      <div className="mx-auto max-w-[75rem]">
        <ReaderApp title={t("reader.title")} />
      </div>
    </main>
  </>
}
