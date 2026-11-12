// Faint football pitch markings behind the login and register pages.
// Drawn to real proportions (105 x 68 m, 1 unit = 10 cm). Decorative only (aria-hidden).
export default function PitchBackground() {
  return (
    <svg
      viewBox="-40 -40 1130 760"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden
      className="pointer-events-none absolute inset-0 size-full"
    >
      <g fill="none" stroke="white" strokeOpacity="0.07" strokeWidth="3" vectorEffect="non-scaling-stroke">
        <rect x="0" y="0" width="1050" height="680" />
        <line x1="525" y1="0" x2="525" y2="680" />
        <circle cx="525" cy="340" r="91.5" />
        {/* Penalty areas, goal areas and penalty arcs, both ends */}
        <rect x="0" y="138.5" width="165" height="403" />
        <rect x="885" y="138.5" width="165" height="403" />
        <rect x="0" y="248.5" width="55" height="183" />
        <rect x="995" y="248.5" width="55" height="183" />
        <path d="M165 267 A91.5 91.5 0 0 1 165 413" />
        <path d="M885 267 A91.5 91.5 0 0 0 885 413" />
        {/* Corner arcs */}
        <path d="M0 10 A10 10 0 0 0 10 0 M1040 0 A10 10 0 0 0 1050 10 M1050 670 A10 10 0 0 0 1040 680 M10 680 A10 10 0 0 0 0 670" />
      </g>
      <g fill="white" fillOpacity="0.1">
        <circle cx="525" cy="340" r="4" />
        <circle cx="110" cy="340" r="4" />
        <circle cx="940" cy="340" r="4" />
      </g>
    </svg>
  );
}
