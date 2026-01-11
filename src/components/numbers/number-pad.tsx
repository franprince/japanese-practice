"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Delete, CornerDownLeft } from "lucide-react"
import { numberPadKeysArabic, numberPadKeysKanji } from "@/lib/japanese-numbers"
import { useI18n } from "@/lib/i18n"

interface NumberPadProps {
  onKeyPress: (key: string) => void
  onDelete: () => void
  onClear: () => void
  onSubmit: () => void
  disabled?: boolean
  shuffleNumbers: boolean
  onShuffleChange: (checked: boolean) => void
  keys?: readonly NumberPadKey[]
  disableShuffle?: boolean
}

type NumberPadKey = (typeof numberPadKeysKanji)[number] | (typeof numberPadKeysArabic)[number]

export function NumberPad({
  onKeyPress,
  onDelete,
  onClear,
  onSubmit,
  disabled,
  shuffleNumbers,
  onShuffleChange,
  keys = numberPadKeysKanji,
  disableShuffle = false,
}: NumberPadProps) {
  const { t } = useI18n()
  const [hasMounted, setHasMounted] = useState(false)

  useEffect(() => {
    setHasMounted(true)
  }, [])

  const renderedKeys: NumberPadKey[] = useMemo(() => {
    const base = Array.from(keys) as NumberPadKey[]
    // Avoid SSR/client mismatch by only shuffling after mount
    if (!shuffleNumbers || !hasMounted) return base
    const shuffled: NumberPadKey[] = Array.from(base) as NumberPadKey[]
    for (let i = shuffled.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1))
      const iVal = shuffled[i]!
      const jVal = shuffled[j]!
      shuffled[i] = jVal
      shuffled[j] = iVal
    }
    return shuffled
  }, [keys, shuffleNumbers, hasMounted])

  return (
    <div className="w-full max-w-md mx-auto">
      <label className="flex items-center gap-2 mb-2 text-sm text-muted-foreground cursor-pointer select-none">
        <input
          type="checkbox"
          className="h-4 w-4 accent-primary cursor-pointer"
          checked={shuffleNumbers}
          onChange={(e) => onShuffleChange(e.target.checked)}
          disabled={disabled || disableShuffle}
        />
        <span>{t("shuffleNumbers") ?? "Shuffle keys"}</span>
      </label>

      <div className="grid grid-cols-5 gap-2">
        {renderedKeys.map(({ char, value }) => (
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
