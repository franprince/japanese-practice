"use client"
import Link from "next/link"
import { ArrowUpRight } from "lucide-react"
interface GameSelectorCardProps { title: string; description: string; href: string; icon: string; index: number; examplePrompt: string; exampleAnswer: string }
export function GameSelectorCard({ title, description, href, icon, index, examplePrompt, exampleAnswer }: GameSelectorCardProps) {
  return <Link href={href} data-testid="game-selector" className="ink-card group flex flex-col gap-4 p-5 transition-transform hover:-translate-y-0.5 focus-visible:outline-offset-4 sm:p-6">
    <div className="flex items-start justify-between">
      <span lang="ja" aria-hidden="true" className="genko-cell font-hand flex size-16 items-center justify-center text-4xl font-semibold">{icon}</span>
      <span aria-hidden="true" className="flex items-center gap-1 font-hand text-xl font-semibold text-primary">{String(index).padStart(2, "0")}<ArrowUpRight className="size-5 opacity-0 transition-opacity group-hover:opacity-100" /></span>
    </div>
    <div><h3 className="font-hand text-2xl font-semibold leading-tight">{title}</h3><p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p></div>
    <p className="mt-auto flex flex-wrap items-baseline gap-x-3 border-t border-dashed border-foreground/30 pt-3 font-hand text-xl font-semibold">
      <span lang="ja">{examplePrompt}</span><span aria-hidden="true" className="text-muted-foreground">→</span><span lang="ja" className="text-primary underline decoration-2 underline-offset-4">{exampleAnswer}</span>
    </p>
  </Link>
}
