"use client"
import { useState } from "react"
import * as Popover from "@radix-ui/react-popover"
import { ChevronDown } from "lucide-react"
import { useTheme, type Theme } from "@/lib/theme"
import { useI18n } from "@/lib/i18n"
import { Button } from "@/components/ui/button"
// Notebook is the default theme. The old dark default is now "midnight"; a stored "default" no longer validates, so those users fall back to Notebook.
const themes: Theme[] = ["notebook", "daylight", "lavender", "mint", "notebook-dark", "notebook-indigo", "midnight", "sakura", "ocean", "forest", "sunset"]
const firstDarkIndex = themes.indexOf("notebook-dark")
export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme()
  const { t } = useI18n()
  const [open, setOpen] = useState(false)
  return <Popover.Root open={open} onOpenChange={setOpen}>
    <Popover.Trigger asChild><Button variant="ghost" className="theme-trigger min-h-11 gap-1 px-2 text-sm">{t(`themes.${theme}.label`)}<ChevronDown className="size-4" /></Button></Popover.Trigger>
    <Popover.Portal><Popover.Content align="end" sideOffset={6} className="z-[110] max-h-[70dvh] w-64 max-w-[calc(100vw-2rem)] overflow-y-auto rounded-xl border bg-popover p-2 text-popover-foreground shadow-lg" onKeyDown={event => event.stopPropagation()}>
      {themes.map((option, index) => <div key={option}>
        {(index === 0 || index === firstDarkIndex) && <p className="px-3 py-2 text-sm font-semibold text-muted-foreground">{t(index === 0 ? "themes.light.title" : "themes.dark.title")}</p>}
        <button aria-pressed={theme === option} onClick={() => { setTheme(option); setOpen(false) }} className="min-h-11 w-full rounded-lg px-3 py-2 text-left hover:bg-secondary aria-pressed:bg-secondary"><span className="block text-sm font-medium">{t(`themes.${option}.label`)}</span><span className="block text-xs text-muted-foreground">{t(`themes.${option}.description`)}</span></button>
      </div>)}
    </Popover.Content></Popover.Portal>
  </Popover.Root>
}
