// Five dotted rings, lilac at the top through magenta and coral to gold.
export function Rhythm({ className }: { className: string }) {
  return (
    <svg className={className} viewBox="0 0 1440 350" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="rhythm-color" x1="0" y1="0" x2="0" y2="350" gradientUnits="userSpaceOnUse">
          <stop stopColor="var(--rhythm-lilac)" />
          <stop offset=".35" stopColor="var(--rhythm-lilac)" />
          <stop offset=".58" stopColor="var(--rhythm-magenta)" />
          <stop offset=".78" stopColor="var(--rhythm-coral)" />
          <stop offset="1" stopColor="var(--rhythm-gold)" />
        </linearGradient>
      </defs>
      <g stroke="url(#rhythm-color)" strokeWidth="4" strokeLinecap="round" strokeDasharray=".1 18">
        {[163, 441, 719, 997, 1275].map((cx) => (
          <ellipse key={cx} cx={cx} cy="175" rx="156" ry="165" />
        ))}
      </g>
    </svg>
  )
}