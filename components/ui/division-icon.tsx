interface DivisionIconProps {
  className?: string
}

export function DivisionIcon({ className = "h-6 w-6" }: DivisionIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Top dot */}
      <circle cx="12" cy="6" r="2" fill="currentColor"/>

      {/* Middle line */}
      <rect x="4" y="11" width="16" height="2" rx="1" fill="currentColor"/>

      {/* Bottom dot */}
      <circle cx="12" cy="18" r="2" fill="currentColor"/>
    </svg>
  )
}
