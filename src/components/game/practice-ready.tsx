"use client"
import type { ReactNode } from "react"
import { useHydrated } from "@/hooks/use-hydrated"
import { useI18n } from "@/lib/i18n"
// Mount sessions after stored settings become available; never replace an active session on hydration.
export function PracticeReady({ children }: { children: ReactNode }) {
  const ready = useHydrated()
  const { t } = useI18n()
  return ready ? children : <main className="flex-1 p-8 text-center" role="status">{t("loading")}</main>
}
