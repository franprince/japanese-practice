"use client"
import Image from "next/image"
import Link from "next/link"
import { ArrowUpRight } from "lucide-react"
interface GameSelectorCardProps { title: string; description: string; href: string; screen: string; index: number }
/** A practice to pick on the home page, topped by a real screen of it mid-use (decorative: the title says where it goes). */
export function GameSelectorCard({ title, description, href, screen, index }: GameSelectorCardProps) {
  return <Link href={href} data-testid="game-selector" className="ink-card group flex flex-col overflow-hidden transition-transform hover:-translate-y-0.5 focus-visible:outline-offset-4">
    <Image src={screen} alt="" width={960} height={540} unoptimized className="aspect-video w-full border-b border-border bg-background object-cover" />
    <div className="flex grow flex-col gap-1.5 p-6">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="font-hand text-2xl font-semibold leading-tight">{title}</h3>
        <span aria-hidden="true" className="flex shrink-0 items-center gap-1 font-hand text-[22px] font-semibold text-primary">{String(index).padStart(2, "0")}<ArrowUpRight className="size-5 opacity-0 transition-opacity group-hover:opacity-100" /></span>
      </div>
      <p className="text-[15px] leading-relaxed text-muted-foreground">{description}</p>
    </div>
  </Link>
}
