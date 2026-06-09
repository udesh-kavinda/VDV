interface LogoProps {
  size?: number
  className?: string
}

export function Logo({ size = 80, className }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Dark rounded square background */}
      <rect width="100" height="100" rx="22" fill="#1a1a1a" />

      {/* Shield outline */}
      <path
        d="M50 14 L80 24 L80 52 Q80 72 50 86 Q20 72 20 52 L20 24 Z"
        fill="#2d2d2d"
        stroke="#f0ebe3"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />

      {/* Car body (lower) */}
      <rect x="28" y="62" width="44" height="12" rx="3" fill="#f0ebe3" />

      {/* Car cabin (upper trapezoid) */}
      <path d="M34 62 L38 48 L62 48 L66 62 Z" fill="#f0ebe3" />

      {/* Windshield tint */}
      <path d="M40 62 L43 51 L57 51 L60 62 Z" fill="#1a1a1a" opacity="0.35" />

      {/* Left wheel */}
      <circle cx="36" cy="74" r="6" fill="#1a1a1a" />
      <circle cx="36" cy="74" r="2.5" fill="#f0ebe3" opacity="0.4" />

      {/* Right wheel */}
      <circle cx="64" cy="74" r="6" fill="#1a1a1a" />
      <circle cx="64" cy="74" r="2.5" fill="#f0ebe3" opacity="0.4" />

      {/* Small lock badge bottom-right */}
      <circle cx="72" cy="72" r="9" fill="#c8a96e" />
      <rect x="69" y="72" width="6" height="5" rx="1" fill="#1a1a1a" />
      <path d="M69.5 72 Q69.5 68 72 68 Q74.5 68 74.5 72" stroke="#1a1a1a" strokeWidth="1.8" fill="none" />
    </svg>
  )
}
