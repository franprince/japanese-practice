"use client"

import Link from "next/link"

interface GameSelectorCardProps {
  title: string
  description: string
  href: string
  icon: string
  gradient: string
  index: number
}

export function GameSelectorCard({ title, description, href, icon, gradient, index }: GameSelectorCardProps) {
  return (
    <Link href={href}>
      <div
        className={`group relative h-72 md:h-80 rounded-lg overflow-hidden cursor-pointer transition-all duration-700 hover:shadow-xl border border-primary/20 hover:border-primary/50 ${gradient}`}
      >
        {/* Subtle background pattern */}
        <div className="absolute inset-0 opacity-30">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <pattern id="dots" x="20" y="20" width="40" height="40" patternUnits="userSpaceOnUse">
                <circle cx="20" cy="20" r="1" fill="currentColor" opacity="0.1" />
              </pattern>
            </defs>
            <rect width="100" height="100" fill="url(#dots)" />
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
