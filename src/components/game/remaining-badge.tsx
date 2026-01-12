interface RemainingBadgeProps {
  label?: string | null
}

export function RemainingBadge({ label }: RemainingBadgeProps) {
  if (!label) return null

  return (
    <div className="flex justify-center mb-2">
      <div className="text-xs font-medium text-foreground px-3 py-1 rounded-full bg-secondary/70 border border-border/60">
        {label}
      </div>
    </div>
  )
}
