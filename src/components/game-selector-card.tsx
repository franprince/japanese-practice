"use client"
import Link from "next/link"
import { ArrowUpRight } from "lucide-react"
interface GameSelectorCardProps { title: string; description: string; href: string; icon: string; index: number; examplePrompt: string; exampleAnswer: string }
export function GameSelectorCard({ title, description, href, icon, index, examplePrompt, exampleAnswer }: GameSelectorCardProps) {
  return <Link href={href} data-testid="game-selector" className="ink-card group flex flex-col gap-[18px] p-6 transition-transform hover:-translate-y-0.5 focus-visible:outline-offset-4">
    <div className="flex items-start justify-between">
      <span lang="ja" aria-hidden="true" className="genko-cell font-hand flex size-[72px] items-center justify-center text-[46px] font-semibold">{icon}</span>
      <span aria-hidden="true" className="flex items-center gap-1 font-hand text-[22px] font-semibold text-primary">{String(index).padStart(2, "0")}<ArrowUpRight className="size-5 opacity-0 transition-opacity group-hover:opacity-100" /></span>
    </div>
    <div className="flex grow flex-col gap-1.5"><h3 className="font-hand text-2xl font-semibold leading-tight">{title}</h3><p className="text-[15px] leading-relaxed text-muted-foreground">{description}</p></div>
    <p className="flex flex-wrap items-center gap-x-3 border-t-[1.5px] border-dashed border-foreground/20 pt-3.5 font-hand text-[22px] font-light">
      <span lang="ja">{examplePrompt}</span><span aria-hidden="true" className="text-muted-foreground">→</span><span lang="ja" className="text-primary">{exampleAnswer}</span>
    </p>
  </Link>
}
