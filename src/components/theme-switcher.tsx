"use client"
import { useState } from "react"
import * as Popover from "@radix-ui/react-popover"
import { ChevronDown } from "lucide-react"
import { useTheme, type Theme } from "@/lib/theme"
import { useI18n } from "@/lib/i18n"
import { Button } from "@/components/ui/button"
const themes: Theme[] = ["default", "sakura", "ocean", "forest", "sunset", "daylight", "lavender", "mint"]
export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme()
  const { t } = useI18n()
  const [open, setOpen] = useState(false)
  return <Popover.Root open={open} onOpenChange={setOpen}>
    <Popover.Trigger asChild><Button variant="ghost" className="min-h-11 gap-1 px-2 text-sm">{t(`themes.${theme}.label`)}<ChevronDown className="size-4" /></Button></Popover.Trigger>
    <Popover.Portal><Popover.Content align="end" sideOffset={6} className="z-[110] max-h-[70dvh] w-64 max-w-[calc(100vw-2rem)] overflow-y-auto rounded-xl border bg-popover p-2 text-popover-foreground shadow-lg" onKeyDown={event => event.stopPropagation()}>
      {themes.map((option, index) => <div key={option}>
        {(index === 0 || index === 5) && <p className="px-3 py-2 text-sm font-semibold text-muted-foreground">{t(index === 0 ? "themes.dark.title" : "themes.light.title")}</p>}
        <button aria-pressed={theme === option} onClick={() => { setTheme(option); setOpen(false) }} className="min-h-11 w-full rounded-lg px-3 py-2 text-left hover:bg-secondary aria-pressed:bg-secondary"><span className="block text-sm font-medium">{t(`themes.${option}.label`)}</span><span className="block text-xs text-muted-foreground">{t(`themes.${option}.description`)}</span></button>
      </div>)}
    </Popover.Content></Popover.Portal>
  </Popover.Root>
}
