"use client"

import * as React from "react"
import * as Dialog from "@radix-ui/react-dialog"
import { 
  X, 
  Settings2, 
  Type, 
  Shuffle, 
  Dice5, 
  Infinity as LucideInfinity,
  Layers,
  CheckCircle2,
  AlertCircle,
  type LucideIcon
} from "lucide-react"
import { cn } from "@/lib/core"
import { useI18n } from "@/lib/i18n"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import type { GameMode, WordsGameType } from "@/types/game"
import type { WordFilter, CharacterGroup } from "@/lib/japanese/words"

interface WordsSettingsOverlayProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: GameMode
  gameType: WordsGameType
  playMode: "infinite" | "session"
  targetCount: number
  filter: WordFilter
  onApply: (mode: GameMode, gameType: WordsGameType, playMode: "infinite" | "session", targetCount: number, filter: WordFilter) => void
  characterGroups: CharacterGroup[]
}

export function WordsSettingsOverlay({
  open,
  onOpenChange,
  mode,
  gameType,
  playMode,
  targetCount,
  filter,
  onApply,
  characterGroups,
}: WordsSettingsOverlayProps) {
  const { t } = useI18n()
  const customSectionRef = React.useRef<HTMLDivElement>(null)
  const [shouldScroll, setShouldScroll] = React.useState(false)
  const [localMode, setLocalMode] = React.useState<GameMode>(mode)
  const [localGameType, setLocalGameType] = React.useState<WordsGameType>(gameType)
  const [localPlayMode, setLocalPlayMode] = React.useState<"infinite" | "session">(playMode)
  const [localTargetCount, setLocalTargetCount] = React.useState(targetCount)
  const [localFilter, setLocalFilter] = React.useState<WordFilter>(filter)

  // Sync with props when opening
  React.useEffect(() => {
    if (open) {
      setLocalMode(mode)
      setLocalGameType(gameType)
      setLocalPlayMode(playMode)
      setLocalTargetCount(targetCount)
      setLocalFilter(filter)
    }
  }, [open, mode, gameType, playMode, targetCount, filter])

  // Scroll to custom section when selected
  React.useEffect(() => {
    if (localMode === "custom" && shouldScroll) {
      customSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
      setShouldScroll(false)
    }
  }, [localMode, shouldScroll])

  const handleModeChange = (m: GameMode) => {
    setLocalMode(m)
    if (m === "custom") {
      setShouldScroll(true)
    }
  }

  const handleApply = () => {
    onOpenChange(false)
    onApply(localMode, localGameType, localPlayMode, localTargetCount, localFilter)
  }

  const toggleGroup = (groupId: string) => {
    setLocalFilter(prev => {
      const selectedGroups = prev.selectedGroups.includes(groupId)
        ? prev.selectedGroups.filter(id => id !== groupId)
        : [...prev.selectedGroups, groupId]
      return { ...prev, selectedGroups }
    })
  }

  const selectAll = () => {
    const allIds = characterGroups.map(g => g.id)
    setLocalFilter(prev => ({ ...prev, selectedGroups: allIds }))
  }

  const deselectAll = () => {
    setLocalFilter(prev => ({ ...prev, selectedGroups: [] }))
  }

  const gameModes: { value: GameMode; label: string; icon: string }[] = [
    { value: "hiragana", label: t("hiraganaLabel"), icon: "あ" },
    { value: "katakana", label: t("katakanaLabel"), icon: "ア" },
    { value: "both", label: t("bothLabel"), icon: "あア" },
    { value: "custom", label: t("custom"), icon: "⚙️" },
  ]

  const gameTypes = [
    { value: "words", label: t("modeWords"), icon: Type, description: t("games.words.description") || "Vocabulary practice" },
    { value: "characters", label: t("modeCharacters"), icon: Shuffle, description: t("games.characters.description") || "Random characters" },
    { value: "guess", label: t("modeGuess"), icon: Dice5, description: t("games.guess.description") || "Multiple choice" },
  ]

  const sessionCounts = [5, 10, 20, 50]

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-background/60 backdrop-blur-sm z-[100] animate-in fade-in duration-300" />
        <Dialog.Content className={cn(
          "fixed z-[101] bg-card/95 backdrop-blur-2xl border border-primary/20 shadow-2xl flex flex-col overflow-hidden transition-all duration-500",
          // Mobile: Bottom Sheet
          "inset-x-0 bottom-0 top-auto rounded-t-[2.5rem] border-b-0 max-h-[92vh] animate-in slide-in-from-bottom duration-500 ease-out",
          // Desktop: Centered Modal
          "md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[700px] md:max-h-[85vh] md:rounded-[2.5rem] md:border-b md:zoom-in-95 md:slide-in-from-bottom-0"
        )}>
          {/* Mobile Drag Handle */}
          <div className="w-12 h-1.5 bg-foreground/10 rounded-full mx-auto mt-4 mb-2 md:hidden shrink-0" />

          <div className="p-6 md:p-8 flex items-center justify-between border-b border-border/20 shrink-0">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-2xl border border-primary/20 text-primary">
                <Settings2 className="w-6 h-6" />
              </div>
              <div>
                <Dialog.Title className="text-xl md:text-2xl font-black tracking-tight uppercase">
                  {t("practiceSettings") || "Command Center"}
                </Dialog.Title>
                <Dialog.Description className="text-xs text-muted-foreground font-medium uppercase tracking-widest opacity-60">
                  {t("settings.subtitle") || "Configure your learning experience"}
                </Dialog.Description>
              </div>
            </div>
            <Dialog.Close asChild>
              <button className="p-2 rounded-full hover:bg-white/10 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </Dialog.Close>
          </div>

          <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-10 custom-scrollbar">
            
            {/* 1. Game Mode */}
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-primary/60">01</span>
                <h3 className="text-xs font-black uppercase tracking-[0.2em]">{t("modeLabel")}</h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {gameModes.map(m => (
                  <button
                    key={m.value}
                    onClick={() => handleModeChange(m.value)}
                    className={cn(
                      "group flex flex-col items-center gap-3 p-4 rounded-3xl border transition-all duration-300",
                      localMode === m.value 
                        ? "bg-primary text-primary-foreground border-primary shadow-xl shadow-primary/20 scale-[1.02]" 
                        : "bg-white/5 border-white/5 hover:border-primary/30 text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <span className="text-2xl mb-1 group-hover:scale-110 transition-transform">{m.icon}</span>
                    <span className="text-[10px] font-bold uppercase tracking-widest">{m.label}</span>
                  </button>
                ))}
              </div>
            </section>

            {/* 2. Game Type */}
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-primary/60">02</span>
                <h3 className="text-xs font-black uppercase tracking-[0.2em]">{t("settings.gameType") || "Game Type"}</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {gameTypes.map(gt => (
                  <button
                    key={gt.value}
                    onClick={() => setLocalGameType(gt.value as WordsGameType)}
                    className={cn(
                      "flex items-center gap-4 p-4 rounded-3xl border transition-all duration-300 text-left",
                      localGameType === gt.value 
                        ? "bg-accent text-accent-foreground border-accent shadow-xl shadow-accent/20" 
                        : "bg-white/5 border-white/5 hover:border-accent/30 text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <div className={cn(
                      "p-3 rounded-2xl transition-colors",
                      localGameType === gt.value ? "bg-accent-foreground/10" : "bg-white/5"
                    )}>
                      <gt.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest mb-0.5">{gt.label}</p>
                      <p className="text-[9px] opacity-60 font-medium leading-tight">{gt.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </section>

            {/* 3. Session & Length */}
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-primary/60">03</span>
                <h3 className="text-xs font-black uppercase tracking-[0.2em]">{t("settings.sessionGoals") || "Session Goals"}</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-1 bg-white/5 rounded-3xl border border-white/5 flex gap-2">
                  <button
                    onClick={() => setLocalPlayMode("infinite")}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl transition-all",
                      localPlayMode === "infinite" ? "bg-primary text-primary-foreground shadow-lg" : "text-muted-foreground hover:bg-white/5"
                    )}
                  >
                    <LucideInfinity className="w-4 h-4" />
                    <span className="text-[10px] font-black uppercase tracking-widest">{t("playModeInfinite")}</span>
                  </button>
                  <button
                    onClick={() => setLocalPlayMode("session")}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl transition-all",
                      localPlayMode === "session" ? "bg-primary text-primary-foreground shadow-lg" : "text-muted-foreground hover:bg-white/5"
                    )}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="text-[10px] font-black uppercase tracking-widest">{t("playModeSession")}</span>
                  </button>
                </div>

                <div className={cn(
                  "p-1 bg-white/5 rounded-3xl border border-white/5 flex gap-2 transition-all",
                  localPlayMode !== "session" && "opacity-30 pointer-events-none grayscale"
                )}>
                  {sessionCounts.map(count => (
                    <button
                      key={count}
                      onClick={() => setLocalTargetCount(count)}
                      className={cn(
                        "flex-1 py-4 rounded-2xl text-[10px] font-black transition-all",
                        localTargetCount === count ? "bg-primary text-primary-foreground shadow-lg" : "text-muted-foreground hover:bg-white/5"
                      )}
                    >
                      {count}
                    </button>
                  ))}
                </div>
              </div>
            </section>

            {/* 4. Advanced Filters (Group Selection) */}
            <section 
              ref={customSectionRef}
              className={cn(
                "space-y-4 transition-all scroll-mt-6",
                localMode !== "custom" && "opacity-30 pointer-events-none grayscale"
              )}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-primary/60">04</span>
                  <h3 className="text-xs font-black uppercase tracking-[0.2em]">{t("characters")}</h3>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={selectAll} className="text-[8px] h-6 px-3 uppercase tracking-widest bg-white/5 hover:bg-white/10">{t("selectAll")}</Button>
                  <Button variant="ghost" size="sm" onClick={deselectAll} className="text-[8px] h-6 px-3 uppercase tracking-widest bg-white/5 hover:bg-white/10">{t("deselectAll")}</Button>
                </div>
              </div>

              {(localGameType === "words" || localGameType === "characters") && (
                <div className="space-y-6 pt-2 pb-2">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 px-1">
                        {localGameType === "words" ? t("settings.wordLength") : t("settings.characterLength")}
                      </h4>
                      <div className="flex items-center gap-2">
                        <Button 
                          type="button"
                          variant="ghost" 
                          size="sm" 
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setLocalFilter(prev => ({ ...prev, minLength: 1, maxLength: 100 }));
                          }}
                          className="text-[10px] h-8 px-3 uppercase tracking-widest bg-white/5 hover:bg-white/10"
                        >
                          {t("settings.any") || "Any"}
                        </Button>
                        <span className="flex items-center gap-1 text-[9px] font-black tabular-nums bg-primary/10 text-primary px-2 py-1.5 rounded-lg border border-primary/20 transition-all duration-300">
                          {localFilter.maxLength > 10 ? (
                            <>
                              <LucideInfinity className="w-3 h-3" />
                              <span className="uppercase tracking-widest text-[8px]">{t("settings.any") || "Any"}</span>
                            </>
                          ) : (
                            <>{localFilter.minLength} — {localFilter.maxLength}</>
                          )}
                        </span>
                      </div>
                    </div>
                    
                    <div className="px-2 py-2">
                      <Slider
                        min={1}
                        max={10}
                        step={1}
                        value={[localFilter.minLength, localFilter.maxLength]}
                        onValueChange={(vals: number[]) => {
                          if (vals.length === 2 && vals[0] !== undefined && vals[1] !== undefined) {
                            setLocalFilter(prev => ({
                              ...prev,
                              minLength: vals[0] ?? 1,
                              maxLength: vals[1] ?? 10
                            }))
                          }
                        }}
                        className="w-full"
                      />
                    </div>
                  </div>
                  <div className="h-px bg-white/5 mx-auto w-1/2" />
                </div>
              )}

              <div className="space-y-6">
                {/* Hiragana Subsection */}
                <div className="space-y-3">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 px-1">{t("hiraganaLabel")}</h4>
                  <div className="grid grid-cols-[repeat(4,1fr)] sm:grid-cols-[repeat(6,1fr)] gap-2 max-w-sm mx-auto w-full">
                    {characterGroups.filter(g => g.type === "hiragana").map(group => {
                      const isSelected = localFilter.selectedGroups.includes(group.id)
                      const char = group.characters?.[0] || "?"
                      
                      return (
                        <button
                          key={group.id}
                          onClick={() => toggleGroup(group.id)}
                          className={cn(
                            "flex aspect-square w-full items-center justify-center p-0 rounded-2xl border transition-all relative overflow-hidden",
                            isSelected
                              ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20 scale-[1.05] z-10"
                              : "bg-white/5 border-white/5 text-muted-foreground hover:bg-white/10"
                          )}
                        >
                          <span className="text-xl font-black leading-none">{char}</span>
                          {isSelected && (
                            <div className="absolute top-1 right-1">
                              <CheckCircle2 className="w-2.5 h-2.5" />
                            </div>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Katakana Subsection */}
                <div className="space-y-3">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 px-1">{t("katakanaLabel")}</h4>
                  <div className="grid grid-cols-[repeat(4,1fr)] sm:grid-cols-[repeat(6,1fr)] gap-2 max-w-sm mx-auto w-full">
                    {characterGroups.filter(g => g.type === "katakana").map(group => {
                      const isSelected = localFilter.selectedGroups.includes(group.id)
                      const char = group.characters?.[0] || "?"
                      
                      return (
                        <button
                          key={group.id}
                          onClick={() => toggleGroup(group.id)}
                          className={cn(
                            "flex aspect-square w-full items-center justify-center p-0 rounded-2xl border transition-all relative overflow-hidden",
                            isSelected
                              ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20 scale-[1.05] z-10"
                              : "bg-white/5 border-white/5 text-muted-foreground hover:bg-white/10"
                          )}
                        >
                          <span className="text-xl font-black leading-none">{char}</span>
                          {isSelected && (
                            <div className="absolute top-1 right-1">
                              <CheckCircle2 className="w-2.5 h-2.5" />
                            </div>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>

              {localMode === "custom" && localFilter.selectedGroups.length === 0 && (
                <div className="flex items-center gap-2 p-3 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-[9px] font-medium animate-in slide-in-from-top-2">
                  <AlertCircle className="w-3 h-3" />
                  {t("selectGroupsHint")}
                </div>
              )}
            </section>

            {localMode !== "custom" && (
              <div className="p-4 rounded-3xl bg-primary/5 border border-primary/20">
                <p className="text-[10px] text-muted-foreground leading-relaxed leading-relaxed font-medium">
                  {t("settings.customHint") || "Select \"Custom\" if you want to filter by specific word length or character groups."}
                </p>
              </div>
            )}
          </div>

          <div className="p-6 md:p-8 flex items-center justify-center gap-4 bg-background/40 border-t border-border/20 shrink-0">
            <Button 
              variant="ghost" 
              onClick={() => onOpenChange(false)}
              className="flex-1 rounded-full font-black uppercase tracking-widest text-[10px] h-14"
            >
              {t("common.cancel") || "Cancel"}
            </Button>
            <Button 
              onClick={handleApply}
              disabled={localMode === "custom" && localFilter.selectedGroups.length === 0}
              className="flex-[2] rounded-full font-black uppercase tracking-widest text-[10px] h-14 shadow-xl shadow-primary/20 bg-primary hover:bg-primary/90"
            >
              {t("settings.saveSettings") || "Save Settings"}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
