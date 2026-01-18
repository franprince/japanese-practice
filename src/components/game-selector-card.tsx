"use client"

import Link from "next/link"
import { useTheme } from "@/lib/theme-context"

interface GameSelectorCardProps {
  title: string
  description: string
  href: string
  icon: string
  gradient: string
  index: number
}

const LIGHT_THEMES = ["daylight", "lavender", "mint"]

export function GameSelectorCard({ title, description, href, icon, gradient, index }: GameSelectorCardProps) {
  const { theme } = useTheme()
  const isLightTheme = LIGHT_THEMES.includes(theme)

  if (isLightTheme) {
    // Light theme: Glassmorphism design with accent color
    return (
      <Link href={href}>
        <div className="group relative h-72 md:h-80 rounded-xl overflow-hidden cursor-pointer transition-all duration-500 hover:shadow-2xl shadow-md border border-accent/20 bg-white/70 backdrop-blur-sm hover:scale-[1.02] hover:border-accent/40">

          {/* Subtle accent color glow in background - flows on hover */}
          <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-primary/5 opacity-50 group-hover:opacity-70 transition-opacity duration-500" />
          <div className="absolute inset-0 bg-gradient-to-br from-primary/0 via-accent/10 to-primary/0 opacity-0 group-hover:opacity-100 group-hover:animate-pulse transition-opacity duration-700" />

          {/* Content */}
          <div className="relative h-full flex flex-col justify-between p-8 z-10">
            <div>
              {/* Icon */}
              <div className="text-5xl md:text-6xl mb-4 md:mb-6 transform group-hover:scale-110 transition-transform duration-500 origin-left text-foreground">
                {icon}
              </div>
              <h3 className="text-xl md:text-3xl font-bold text-foreground mb-3 text-balance tracking-tight">{title}</h3>
            </div>

            <div className="space-y-4">
              <p className="text-muted-foreground text-xs md:text-base leading-relaxed">
                {description}
              </p>
            </div>

            {/* Arrow indicator */}
            <div className="absolute bottom-8 right-8 text-accent group-hover:text-primary text-3xl font-light transform group-hover:translate-x-2 transition-all duration-500">
              →
            </div>
          </div>

          {/* Bottom accent line - flows on hover */}
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-accent to-transparent bg-[length:200%_100%] bg-left group-hover:bg-right transition-all duration-700" />
        </div>
      </Link>
    )
  }

  // Dark theme: Original gradient design
  return (
    <Link href={href}>
      <div
        className={`group relative h-72 md:h-80 rounded-lg overflow-hidden cursor-pointer transition-all duration-700 hover:shadow-xl border border-primary/20 hover:border-primary/50 ${gradient}`}
      >
        {/* Subtle background pattern */}
        <div className="absolute inset-0 opacity-30">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <pattern id={`dots-${index}`} x="20" y="20" width="40" height="40" patternUnits="userSpaceOnUse">
                <circle cx="20" cy="20" r="1" fill="currentColor" opacity="0.1" />
              </pattern>
            </defs>
            <rect width="100" height="100" fill={`url(#dots-${index})`} />
          </svg>
        </div>

        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/40 group-hover:to-black/30 transition-colors duration-700" />

        {/* Content */}
        <div className="relative h-full flex flex-col justify-between p-8 z-10">
          <div>
            <div className="text-5xl md:text-6xl mb-4 md:mb-6 transform group-hover:scale-110 transition-transform duration-700 origin-left">
              {icon}
            </div>
            <h3 className="text-xl md:text-3xl font-bold text-white mb-3 text-balance tracking-tight">{title}</h3>
          </div>

          <div className="space-y-4">
            <p className="text-white/90 text-xs md:text-base leading-relaxed opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all duration-700 transform md:group-hover:translate-y-0 md:translate-y-2">
              {description}
            </p>

            {/* Decorative line that appears on hover */}
            <div className="h-0.5 w-0 md:group-hover:w-12 bg-primary transition-all duration-700" />
          </div>

          {/* Arrow indicator */}
          <div className="absolute bottom-8 right-8 text-primary/80 group-hover:text-primary text-3xl font-light transform group-hover:translate-x-1 transition-all duration-700">
            →
          </div>
        </div>
      </div>
    </Link>
  )
}
