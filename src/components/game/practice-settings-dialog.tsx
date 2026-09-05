"use client"

import { useState, type ReactNode } from "react"
import * as Dialog from "@radix-ui/react-dialog"
import { Settings2, X } from "lucide-react"
import { useI18n } from "@/lib/i18n"
import { Button } from "@/components/ui/button"

export function PracticeSettingsTrigger({ onClick }: { onClick: () => void }) {
  const { t } = useI18n()
  return <Button
    variant="outline"
    className="min-h-11 gap-2 rounded-xl"
    onClick={onClick}
    data-testid="settings-trigger"
  >
    <Settings2 className="size-4" aria-hidden="true" />{t("practice.settings")}
  </Button>
}

export function PracticeSettingsDialog({ open, onOpenChange, children, onApply, changed, invalid = false }: {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: ReactNode
  onApply: () => void
  changed: boolean
  invalid?: boolean
}) {
  const { t } = useI18n()
  const [returnFocus] = useState(() => typeof document !== "undefined" ? document.activeElement as HTMLElement | null : null)
  return <Dialog.Root open={open} onOpenChange={onOpenChange}>
    <Dialog.Portal>
      <Dialog.Overlay data-testid="popover-backdrop" className="fixed inset-0 z-[100] bg-black/50" />
      <Dialog.Content
        onCloseAutoFocus={event => { event.preventDefault(); returnFocus?.focus() }}
        className="practice-settings fixed inset-x-0 bottom-0 z-[101] flex max-h-[92dvh] flex-col rounded-t-2xl border bg-card text-card-foreground shadow-xl sm:inset-auto sm:left-1/2 sm:top-1/2 sm:w-[min(640px,calc(100vw_-_2rem))] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl"
        onKeyDown={event => event.stopPropagation()}
      >
        <header className="flex shrink-0 items-start justify-between gap-3 border-b p-5">
          <div>
            <Dialog.Title className="text-xl font-semibold">{t("practiceSettings")}</Dialog.Title>
            <Dialog.Description className="mt-1 text-sm text-muted-foreground">{t("settings.subtitle")}</Dialog.Description>
          </div>
          <Dialog.Close asChild>
            <Button variant="ghost" size="icon" className="size-11 shrink-0" aria-label={t("practice.close")}>
              <X className="size-5" />
            </Button>
          </Dialog.Close>
        </header>
        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto overscroll-contain p-5">{children}</div>
        <footer className="shrink-0 space-y-3 border-t bg-card p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          {changed && <p className="text-sm text-muted-foreground" role="status">{t("practice.restartNotice")}</p>}
          <div className="flex gap-3">
            <Button variant="outline" className="min-h-11 flex-1" onClick={() => onOpenChange(false)}>{t("common.cancel")}</Button>
            <Button className="min-h-11 flex-[2]" onClick={onApply} disabled={invalid}>{t("settings.saveSettings")}</Button>
          </div>
        </footer>
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>
}
