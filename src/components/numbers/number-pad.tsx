"use client"

import { useMemo, useState } from "react"
import { useHydrated } from "@/hooks/use-hydrated"
import { createRandomSeed, createSeededRandom, shuffleArray } from "@/lib/core/random"
import { Button } from "@/components/ui/button"
import { Delete, CornerDownLeft } from "lucide-react"
import { numberPadKeysArabic, numberPadKeysKanji } from "@/lib/japanese/numbers"
import { useI18n } from "@/lib/i18n"

interface NumberPadProps {
  onKeyPress: (key: string) => void
  onDelete: () => void
  onClear: () => void
  onSubmit: () => void
  disabled?: boolean
  submitDisabled?: boolean
  shuffleNumbers: boolean
  onShuffleChange?: (checked: boolean) => void
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
  submitDisabled,
  shuffleNumbers,
  onShuffleChange,
  keys = numberPadKeysKanji,
  disableShuffle = false,
}: NumberPadProps) {
  const { t } = useI18n()
  const hydrated = useHydrated()
  const [seed] = useState(createRandomSeed)
  const signature = JSON.stringify(keys)
  const [order, setOrder] = useState({ signature, shuffled: shuffleNumbers, revision: 0 })
  if (order.signature !== signature || order.shuffled !== shuffleNumbers) {
    setOrder({ signature, shuffled: shuffleNumbers, revision: order.revision + 1 })
  }
  const renderedKeys = useMemo(() => {
    if (!shuffleNumbers || !hydrated) return keys
    return shuffleArray([...keys], createSeededRandom(seed + order.revision))
  }, [keys, shuffleNumbers, hydrated, seed, order.revision])

  return (
    <div className="w-full max-w-md mx-auto">
      {onShuffleChange && (
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
      )}

      <div id="number-pad" className="grid grid-cols-5 gap-2">
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
          aria-label={t("practice.deleteLast")}
        >
          <Delete className="h-5 w-5" />
        </Button>
        <Button
          className="h-12 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-all"
          onClick={onSubmit}
          disabled={disabled || submitDisabled}
        >
          <CornerDownLeft className="h-5 w-5 mr-1" />
          {t("check")}
        </Button>
      </div>
    </div>
  )
}
