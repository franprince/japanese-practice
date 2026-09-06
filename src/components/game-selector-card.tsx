"use client"
import Link from "next/link"
import { ArrowUpRight } from "lucide-react"
interface GameSelectorCardProps { title: string; description: string; href: string; icon: string; example: string }
export function GameSelectorCard({ title, description, href, icon, example }: GameSelectorCardProps) {
  return <Link href={href} data-testid="game-selector" className="group flex flex-col gap-4 rounded-2xl border bg-card p-5 transition-colors hover:border-primary focus-visible:outline-offset-4 sm:p-6">
    <div className="flex items-center justify-between"><span lang="ja" aria-hidden="true" className="text-3xl text-primary">{icon}</span><ArrowUpRight aria-hidden="true" className="size-5 text-muted-foreground group-hover:text-primary" /></div>
    <div><h3 className="text-xl font-semibold">{title}</h3><p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p></div>
    <p className="mt-auto border-t pt-3 text-base font-medium">{example}</p>
  </Link>
}
