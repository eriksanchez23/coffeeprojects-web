/**
 * Static hero illustration: server-rendered, request-free, and the fallback whenever the 3D scene is skipped.
 * Decorative (the hero headline carries the meaning), so it is hidden from assistive tech.
 */
export function HeroPoster() {
  return (
    <svg viewBox="0 0 400 400" className="h-full w-full" aria-hidden focusable="false">
      <defs>
        <radialGradient id="hero-poster-glow" cx="50%" cy="40%" r="50%">
          <stop offset="0%" stopColor="#f5a742" stopOpacity=".45" />
          <stop offset="100%" stopColor="#0b0706" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="hero-poster-cup" x1="0" x2="1">
          <stop offset="0%" stopColor="#241812" />
          <stop offset="60%" stopColor="#3a2619" />
          <stop offset="100%" stopColor="#1a1310" />
        </linearGradient>
      </defs>
      <circle cx="200" cy="170" r="190" fill="url(#hero-poster-glow)" />
      <path d="M110 200h170v50a80 80 0 0 1-80 80h-10a80 80 0 0 1-80-80z" fill="url(#hero-poster-cup)" stroke="#c7782a" strokeOpacity=".5" />
      <path d="M280 215h18a30 30 0 0 1 0 60h-22" fill="none" stroke="#c7782a" strokeOpacity=".6" strokeWidth="10" />
      <ellipse cx="195" cy="200" rx="85" ry="14" fill="#3b2416" stroke="#f5a742" strokeOpacity=".4" />
      <g fill="#ffc165" fontFamily="monospace" fontSize="22" opacity=".85">
        <text x="160" y="160">{'{'}</text>
        <text x="200" y="125">{'</>'}</text>
        <text x="230" y="165">{'}'}</text>
        <text x="185" y="85" opacity=".5">;</text>
      </g>
    </svg>
  )
}
