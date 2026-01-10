"use client"

import { Button } from "@/components/ui/button"
import { Delete, CornerDownLeft } from "lucide-react"
import { numberPadKeys } from "@/lib/japanese-numbers"
import { useI18n } from "@/lib/i18n"

interface NumberPadProps {
  onKeyPress: (key: string) => void
  onDelete: () => void
  onClear: () => void
  onSubmit: () => void
  disabled?: boolean
}

export function NumberPad({ onKeyPress, onDelete, onClear, onSubmit, disabled }: NumberPadProps) {
  const { t } = useI18n()

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="grid grid-cols-5 gap-2">
        {numberPadKeys.map(({ char, value }) => (
          <Button
            key={char}
            variant="secondary"
            className="h-14 text-2xl font-bold hover:bg-primary/20 hover:text-primary transition-all active:scale-95 disabled:opacity-50"
            onClick={() => onKeyPress(value)}
            disabled={disabled}
          >
            {char}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-2 mt-3">
        <Button
          variant="outline"
          className="h-12 text-sm font-medium hover:bg-destructive/20 hover:text-destructive hover:border-destructive/50 transition-all bg-transparent"
          onClick={onClear}
          disabled={disabled}
        >
          {t("clear")}
        </Button>
        <Button
          variant="outline"
          className="h-12 text-sm font-medium hover:bg-muted transition-all bg-transparent"
          onClick={onDelete}
          disabled={disabled}
        >
          <Delete className="h-5 w-5" />
        </Button>
        <Button
          className="h-12 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-all"
          onClick={onSubmit}
          disabled={disabled}
        >
          <CornerDownLeft className="h-5 w-5 mr-1" />
          {t("check")}
        </Button>
      </div>
    </div>
  )
}
