"use client"

import { useEffect, useMemo, useState } from "react"
import * as Dialog from "@radix-ui/react-dialog"
import { 
  X, 
  Settings2, 
  Type, 
  Shuffle, 
  Dice5, 
  Infinity as InfinityIcon, 
  RotateCcw,
  Check
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { cn } from "@/lib/core"
import { useI18n } from "@/lib/i18n"
import { type WordFilter, type CharacterGroup } from "@/lib/japanese/words"
import { getCharacterGroups } from "@/lib/japanese/shared"
import type { GameMode, WordsGameType } from "@/types/game"

interface WordsSettingsOverlayProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  
  // Game State
  mode: GameMode
  onModeChange: (mode: GameMode) => void
  
  gameType: WordsGameType
  onGameTypeChange: (type: WordsGameType) => void
  
  playMode: "infinite" | "session"
  onPlayModeChange: (mode: "infinite" | "session") => void
  
  targetCount: number
  onTargetCountChange: (count: number) => void
  
  filter: WordFilter
  onFilterChange: (filter: WordFilter) => void
}

export function WordsSettingsOverlay({
  open,
  onOpenChange,
  mode,
  onModeChange,
  gameType,
  onGameTypeChange,
  playMode,
  onPlayModeChange,
  targetCount,
  onTargetCountChange,
  filter,
  onFilterChange,
}: WordsSettingsOverlayProps) {
  const { t } = useI18n()
  const [characterGroups, setCharacterGroups] = useState<CharacterGroup[]>([])
  const [draftFilter, setDraftFilter] = useState<WordFilter>(filter)

  useEffect(() => {
    getCharacterGroups().then(setCharacterGroups)
  }, [])

  useEffect(() => {
    if (open) {
      setDraftFilter(filter)
    }
  }, [filter, open])

  const toOrderNumber = (id: string) => {
    const match = id.match(/\d+/)
    return match ? parseInt(match[0], 10) : Number.MAX_SAFE_INTEGER
  }

  const { hiraganaBase, hiraganaAlt, katakanaBase, katakanaAlt } = useMemo(() => {
    const hiraAll = characterGroups.filter((g) => g.type === "hiragana")
    const kataAll = characterGroups.filter((g) => g.type === "katakana")
    return {
      hiraganaBase: hiraAll.filter((g) => !g.id.includes("_a")).sort((a, b) => toOrderNumber(a.id) - toOrderNumber(b.id)),
      hiraganaAlt: hiraAll.filter((g) => g.id.includes("_a")).sort((a, b) => toOrderNumber(a.id) - toOrderNumber(b.id)),
      katakanaBase: kataAll.filter((g) => !g.id.includes("_a")).sort((a, b) => toOrderNumber(a.id) - toOrderNumber(b.id)),
      katakanaAlt: kataAll.filter((g) => g.id.includes("_a")).sort((a, b) => toOrderNumber(a.id) - toOrderNumber(b.id)),
    }
  }, [characterGroups])

  const allHiragana = [...hiraganaBase, ...hiraganaAlt]
  const allKatakana = [...katakanaBase, ...katakanaAlt]

  const toggleGroup = (groupId: string) => {
    const alreadySelected = draftFilter.selectedGroups.includes(groupId)
    const newGroups = alreadySelected
      ? draftFilter.selectedGroups.filter((g) => g !== groupId)
      : [...draftFilter.selectedGroups, groupId]
    setDraftFilter({ ...draftFilter, selectedGroups: newGroups })
  }

  const selectAllGroups = (type: "hiragana" | "katakana") => {
    const groups = type === "hiragana" ? allHiragana : allKatakana
    const groupIds = groups.map((g) => g.id)
    const allSelected = groupIds.every((id) => draftFilter.selectedGroups.includes(id))

    if (allSelected) {
      setDraftFilter({ ...draftFilter, selectedGroups: draftFilter.selectedGroups.filter((g) => !groupIds.includes(g)) })
    } else {
      const newGroups = new Set([...draftFilter.selectedGroups, ...groupIds])
      setDraftFilter({ ...draftFilter, selectedGroups: Array.from(newGroups) })
    }
  }

  const modes: { value: GameMode; label: string; icon: string }[] = [
    { value: "hiragana", label: t("hiraganaLabel"), icon: "あ" },
    { value: "katakana", label: t("katakanaLabel"), icon: "ア" },
    { value: "both", label: t("bothLabel"), icon: "あア" },
    { value: "custom", label: t("custom"), icon: "⚙️" },
  ]

  const gameTypes = [
    { value: "words", label: t("modeWords"), icon: Type },
    { value: "characters", label: t("modeCharacters"), icon: Shuffle },
    { value: "guess", label: t("modeGuess"), icon: Dice5 },
  ]

  const sessionLengths = [10, 20, 50]

  const handleApply = () => {
    onFilterChange(draftFilter)
    onOpenChange(false)
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-background/80 backdrop-blur-xl animate-in fade-in duration-300" />
        <Dialog.Content className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-hidden">
          <div className="relative w-full max-w-4xl glass-card border-primary/20 bg-card/95 shadow-2xl rounded-[2.5rem] p-6 sm:p-10 animate-in zoom-in-95 fade-in duration-300 max-h-[95vh] flex flex-col">
            
            {}
            <Dialog.Close asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="absolute right-6 top-6 rounded-full hover:bg-primary/10"
              >
                <X className="w-6 h-6" />
              </Button>
            </Dialog.Close>

            <Dialog.Title className="text-3xl font-black tracking-tight mb-8 shrink-0">
              {t("practiceSettings")}
            </Dialog.Title>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 overflow-y-auto flex-1 pr-2 custom-scrollbar">
              
              {}
              <div className="space-y-8">
                
                {}
                <section>
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 mb-4">
                    {t("hiraganaLabel")} / {t("katakanaLabel")}
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 gap-3">
                    {modes.map((m) => (
                      <button
                        key={m.value}
                        onClick={() => onModeChange(m.value)}
                        className={cn(
                          "relative group flex flex-col items-start p-4 rounded-2xl border-2 transition-all duration-300",
                          mode === m.value 
                            ? "bg-primary/10 border-primary shadow-[0_0_20px_oklch(var(--primary)/0.1)]" 
                            : "bg-background/20 border-border/20 hover:border-border/40"
                        )}
                      >
                        <span className="text-2xl mb-1 filter grayscale group-hover:grayscale-0 transition-all">{m.icon}</span>
                        <span className="font-bold text-sm tracking-tight">{m.label}</span>
                        {mode === m.value && (
                          <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                            <Check className="w-3 h-3 text-primary-foreground stroke-[3]" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </section>

                {}
                <section>
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 mb-4">
                    {t("playModeInfinite")}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => onPlayModeChange("infinite")}
                      className={cn(
                        "flex items-center gap-2 px-5 py-2.5 rounded-full border-2 font-bold text-sm transition-all",
                        playMode === "infinite" 
                          ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20" 
                          : "bg-background/20 border-border/20 hover:border-border/40"
                      )}
                    >
                      <InfinityIcon className="w-4 h-4" />
                      {t("playModeInfinite")}
                    </button>
                    <div className="w-px h-8 bg-border/20 mx-1" />
                    {sessionLengths.map((count) => (
                      <button
                        key={count}
                        onClick={() => {
                          onPlayModeChange("session")
                          onTargetCountChange(count)
                        }}
                        className={cn(
                          "px-5 py-2.5 rounded-full border-2 font-bold text-sm transition-all",
                          playMode === "session" && targetCount === count
                            ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20"
                            : "bg-background/20 border-border/20 hover:border-border/40"
                        )}
                      >
                        {count}
                      </button>
                    ))}
                  </div>
                </section>

                {}
                <section>
                   <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 mb-4">
                    {t("modeWords")} / {t("modeCharacters")}
                  </h3>
                  <div className="grid grid-cols-3 gap-3">
                    {gameTypes.map((type) => (
                      <button
                        key={type.value}
                        onClick={() => onGameTypeChange(type.value as WordsGameType)}
                        className={cn(
                          "group flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all duration-300",
                          gameType === type.value
                            ? "bg-accent/10 border-accent shadow-[0_0_20px_oklch(var(--accent)/0.1)]"
                            : "bg-background/20 border-border/20 hover:border-border/40"
                        )}
                      >
                        <type.icon className={cn(
                          "w-5 h-5",
                          gameType === type.value ? "text-accent" : "text-muted-foreground"
                        )} />
                        <span className="text-[10px] font-black uppercase tracking-widest">{type.label}</span>
                      </button>
                    ))}
                  </div>
                </section>
              </div>

              {}
              <div className="lg:pl-10 lg:border-l border-border/20 space-y-8">
                {mode === "custom" ? (
                  <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
                    <section className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">
                          {t("wordLength")}
                        </h3>
                        <span className="text-xs font-black tabular-nums bg-muted px-2 py-0.5 rounded">
                          {draftFilter.minLength} - {draftFilter.maxLength}
                        </span>
                      </div>
                      <Slider
                        value={[draftFilter.minLength, draftFilter.maxLength]}
                        min={1}
                        max={10}
                        step={1}
                        onValueChange={([min, max]) =>
                          setDraftFilter({
                            ...draftFilter,
                            minLength: min ?? draftFilter.minLength,
                            maxLength: max ?? draftFilter.maxLength,
                          })
                        }
                      />
                    </section>

                    <section className="space-y-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">
                         {t("charactersDescription")}
                        </h3>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => setDraftFilter({ ...filter, selectedGroups: [] })}
                          className="h-6 text-[10px] font-black uppercase tracking-widest"
                        >
                          <RotateCcw className="w-3 h-3 mr-1" />
                          {t("reset")}
                        </Button>
                      </div>

                      <div className="space-y-6">
                        {}
                        <div className="space-y-4">
                          <div className="flex items-center justify-between sticky top-0 bg-card/95 py-2 z-10 border-b border-border/10">
                            <span className="text-xs font-black tracking-tight"><span lang="ja">ひらがな</span></span>
                            <button onClick={() => selectAllGroups("hiragana")} className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline">
                              {t("selectAll")}
                            </button>
                          </div>
                          <div className="grid grid-cols-6 sm:grid-cols-9 lg:grid-cols-7 xl:grid-cols-8 gap-2">
                            {allHiragana.map((group) => (
                              <button
                                key={group.id}
                                onClick={() => toggleGroup(group.id)}
                                className={cn(
                                  "w-8 h-8 flex items-center justify-center rounded-lg text-sm font-bold transition-all",
                                  draftFilter.selectedGroups.includes(group.id)
                                    ? "bg-primary text-primary-foreground scale-110 shadow-lg shadow-primary/20"
                                    : "bg-background/40 border border-border/20 text-muted-foreground hover:bg-muted"
                                )}
                              >
                                <span lang="ja">{group.characters[0]}</span>
                              </button>
                            ))}
                          </div>
                        </div>

                        {}
                        <div className="space-y-4 pt-2">
                          <div className="flex items-center justify-between sticky top-0 bg-card/95 py-2 z-10 border-b border-border/10">
                            <span className="text-xs font-black tracking-tight"><span lang="ja">カタカナ</span></span>
                            <button onClick={() => selectAllGroups("katakana")} className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline">
                               {t("selectAll")}
                            </button>
                          </div>
                          <div className="grid grid-cols-6 sm:grid-cols-9 lg:grid-cols-7 xl:grid-cols-8 gap-2">
                            {allKatakana.map((group) => (
                              <button
                                key={group.id}
                                onClick={() => toggleGroup(group.id)}
                                className={cn(
                                  "w-8 h-8 flex items-center justify-center rounded-lg text-sm font-bold transition-all",
                                  draftFilter.selectedGroups.includes(group.id)
                                    ? "bg-primary text-primary-foreground scale-110 shadow-lg shadow-primary/20"
                                    : "bg-background/40 border border-border/20 text-muted-foreground hover:bg-muted"
                                )}
                              >
                                <span lang="ja">{group.characters[0]}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </section>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 bg-primary/5 rounded-[2rem] border border-primary/10">
                    <Settings2 className="w-12 h-12 text-primary/20 mb-4" />
                    <h4 className="font-bold text-lg mb-2">Ready to Practice?</h4>
                    <p className="text-sm text-muted-foreground max-w-[200px]">
                      Select "Custom" if you want to filter by specific word length or character groups.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {}
            <div className="mt-8 flex items-center justify-end gap-3 pt-6 border-t border-border/20 shrink-0">
              <Button 
                variant="ghost" 
                onClick={() => onOpenChange(false)}
                className="rounded-full px-8 font-black uppercase tracking-widest text-xs h-12"
              >
                {t("common.cancel") || "Cancel"}
              </Button>
              <Button 
                onClick={handleApply}
                className="rounded-full px-12 font-black uppercase tracking-widest text-xs h-12 shadow-xl shadow-primary/20"
              >
                {t("apply") || "Apply"}
              </Button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
