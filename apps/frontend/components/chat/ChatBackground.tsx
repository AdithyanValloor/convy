"use client";

export default function ChatBackground() {
  return (
    <div
      aria-hidden="true"
      className="
        pointer-events-none
        absolute inset-0
        overflow-hidden
        text-base-content
        rounded-t-2xl
        mb-10
        [mask-image:linear-gradient(to_bottom,black_0%,black_82%,transparent_100%)]
        [-webkit-mask-image:linear-gradient(to_bottom,black_0%,black_82%,transparent_100%)]
      "
    >
      <svg
        className="
          absolute inset-0
          h-full w-full
          opacity-[0.42]
          dark:opacity-[0.48]
        "
        viewBox="0 0 1400 900"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Melo brand gradient */}
          <linearGradient id="melo-gradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#17A6E8" />
            <stop offset="55%" stopColor="#7029F7" />
            <stop offset="100%" stopColor="#F73EC9" />
          </linearGradient>

          {/* Reverse gradient */}
          <linearGradient id="melo-gradient-reverse" x1="1" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#F73EC9" />
            <stop offset="50%" stopColor="#7029F7" />
            <stop offset="100%" stopColor="#17A6E8" />
          </linearGradient>

          {/* Diagonal gradient (new — used for the mid-canvas cluster) */}
          <linearGradient id="melo-gradient-diag" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0%" stopColor="#17A6E8" />
            <stop offset="50%" stopColor="#F73EC9" />
            <stop offset="100%" stopColor="#7029F7" />
          </linearGradient>

          {/* Soft accent fill */}
          <linearGradient id="melo-fill" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#17A6E8" stopOpacity="0.07" />
            <stop offset="55%" stopColor="#7029F7" stopOpacity="0.06" />
            <stop offset="100%" stopColor="#F73EC9" stopOpacity="0.07" />
          </linearGradient>
        </defs>

        {/* =========================================================
            TOP LEFT — large organic shape
        ========================================================= */}
        <g transform="translate(-95 -75) rotate(10 260 230)">
          <path
            d="M155 90 C235 35 355 50 420 125 C485 200 470 310 395 375 C320 440 195 430 115 365 C35 300 35 185 95 125 C112 108 132 97 155 90Z"
            fill="url(#melo-fill)"
            stroke="url(#melo-gradient)"
            strokeWidth="2"
            opacity="0.75"
          />
          <path
            d="M175 125 C245 80 340 92 388 150 C438 210 425 295 365 340 C300 388 210 380 150 330 C90 280 90 200 135 155 C146 143 159 133 175 125Z"
            stroke="currentColor"
            strokeWidth="1.4"
            opacity="0.24"
          />
          <path
            d="M180 205 C215 150 295 135 350 175 C405 215 395 280 350 310 C300 345 220 330 190 285 C173 260 169 230 180 205Z"
            stroke="url(#melo-gradient)"
            strokeWidth="1.5"
            opacity="0.55"
          />
          <path
            d="M205 235 C235 195 290 180 330 200 C355 212 372 235 375 260"
            stroke="currentColor"
            strokeWidth="1"
            opacity="0.28"
          />
          <circle cx="270" cy="245" r="24" stroke="url(#melo-gradient)" strokeWidth="1.5" opacity="0.5" />
          <circle cx="270" cy="245" r="6" fill="url(#melo-gradient)" opacity="0.32" />
          <path d="M135 185L115 170" stroke="currentColor" strokeWidth="1.2" opacity="0.3" />
          <path d="M390 205L410 190" stroke="currentColor" strokeWidth="1.2" opacity="0.3" />

          {/* NEW — small satellite ring + hex, filling the gap near the silhouette's edge */}
          <circle cx="40" cy="320" r="14" stroke="url(#melo-gradient-reverse)" strokeWidth="1.3" opacity="0.4" />
          <path
            d="M440 340 L458 330 L476 340 L476 360 L458 370 L440 360 Z"
            stroke="currentColor"
            strokeWidth="1.1"
            opacity="0.26"
          />
        </g>

        {/* =========================================================
            TOP RIGHT — orbital geometry
        ========================================================= */}
        <g transform="translate(1040 -55)">
          <circle cx="175" cy="175" r="125" stroke="url(#melo-gradient)" strokeWidth="2" opacity="0.58" />
          <circle cx="175" cy="175" r="92" stroke="currentColor" strokeWidth="1.3" opacity="0.22" />
          <circle cx="175" cy="175" r="48" stroke="url(#melo-gradient-reverse)" strokeWidth="1.5" opacity="0.45" />
          <ellipse
            cx="175" cy="175" rx="145" ry="48" transform="rotate(-25 175 175)"
            stroke="currentColor" strokeWidth="1.2" opacity="0.22"
          />
          <ellipse
            cx="175" cy="175" rx="48" ry="145" transform="rotate(25 175 175)"
            stroke="currentColor" strokeWidth="1" opacity="0.18"
          />
          <path
            d="M270 105 A120 120 0 0 1 282 220"
            stroke="url(#melo-gradient)" strokeWidth="4" strokeLinecap="round" opacity="0.55"
          />
          <circle cx="292" cy="102" r="5" fill="url(#melo-gradient)" opacity="0.65" />
          <circle cx="68" cy="202" r="4" fill="url(#melo-gradient-reverse)" opacity="0.5" />
          <circle cx="175" cy="175" r="9" fill="url(#melo-gradient)" opacity="0.35" />

          {/* NEW — extra outer orbit + two trailing nodes, and a small satellite ring lower-left */}
          <ellipse
            cx="175" cy="175" rx="168" ry="168" transform="rotate(10 175 175)"
            stroke="currentColor" strokeWidth="0.9" opacity="0.14" strokeDasharray="3 9"
          />
          <circle cx="45" cy="60" r="3.5" fill="url(#melo-gradient-reverse)" opacity="0.4" />
          <circle cx="-20" cy="260" r="16" stroke="url(#melo-gradient)" strokeWidth="1.2" opacity="0.3" />
        </g>

        {/* =========================================================
            CENTER RIGHT — layered flower / petal shape
        ========================================================= */}
        <g transform="translate(1110 390)">
          <path
            d="M120 135 C65 105 45 45 75 12 C105 -20 160 5 170 55 C178 90 155 120 120 135Z"
            fill="url(#melo-fill)" stroke="url(#melo-gradient)" strokeWidth="1.8" opacity="0.65"
          />
          <path
            d="M120 135 C155 85 220 78 250 112 C280 145 255 195 210 205 C165 215 130 180 120 135Z"
            stroke="currentColor" strokeWidth="1.5" opacity="0.25"
          />
          <path
            d="M120 135 C165 155 180 215 145 245 C110 275 62 245 60 200 C58 165 83 140 120 135Z"
            stroke="url(#melo-gradient-reverse)" strokeWidth="1.6" opacity="0.5"
          />
          <path
            d="M120 135 C105 105 115 80 138 72 C162 65 178 87 170 110 C163 128 142 137 120 135Z"
            stroke="currentColor" strokeWidth="1" opacity="0.25"
          />
          <circle cx="120" cy="135" r="27" stroke="url(#melo-gradient)" strokeWidth="1.5" opacity="0.5" />
          <circle cx="120" cy="135" r="7" fill="url(#melo-gradient)" opacity="0.4" />

          {/* NEW — a couple of drifting petal echoes below-left, sparser and smaller */}
          <circle cx="-40" cy="230" r="10" stroke="url(#melo-gradient-reverse)" strokeWidth="1.1" opacity="0.3" />
          <path d="M-10 300 L4 288 L18 300 L4 312 Z" stroke="currentColor" strokeWidth="1" opacity="0.24" />
        </g>

        {/* =========================================================
            BOTTOM LEFT — flowing loops
        ========================================================= */}
        <g transform="translate(-75 635)">
          <path
            d="M0 135 C75 40 195 30 260 95 C325 160 295 245 210 265 C125 285 45 235 60 165 C72 110 145 100 200 135"
            fill="url(#melo-fill)" stroke="url(#melo-gradient)" strokeWidth="2" opacity="0.65"
          />
          <path
            d="M30 145 C95 75 175 70 225 115 C270 155 245 205 195 220 C145 235 100 205 108 165 C114 135 150 130 180 145"
            stroke="currentColor" strokeWidth="1.4" opacity="0.25"
          />
          <path d="M135 115L150 100M142 107L158 113" stroke="url(#melo-gradient)" strokeWidth="1.5" opacity="0.5" />
          <circle cx="202" cy="137" r="6" fill="url(#melo-gradient)" opacity="0.55" />

          {/* NEW — a trailing wave line + small ring, extending the motif rightward */}
          <path
            d="M270 200 C310 175 345 195 370 175 C395 155 415 165 430 145"
            stroke="url(#melo-gradient-reverse)" strokeWidth="1.3" opacity="0.3"
          />
          <circle cx="320" cy="60" r="11" stroke="currentColor" strokeWidth="1.1" opacity="0.25" />
        </g>

        {/* =========================================================
            BOTTOM RIGHT — rounded geometric form
        ========================================================= */}
        <g transform="translate(1000 700) rotate(18 120 90)">
          <rect
            x="35" y="15" width="170" height="150" rx="52"
            fill="url(#melo-fill)" stroke="url(#melo-gradient-reverse)" strokeWidth="2" opacity="0.65"
          />
          <rect x="62" y="40" width="116" height="100" rx="35" stroke="currentColor" strokeWidth="1.3" opacity="0.24" />
          <path
            d="M78 98 C105 63 150 65 172 95 C187 115 177 138 153 148"
            stroke="url(#melo-gradient)" strokeWidth="1.6" opacity="0.5"
          />
          <circle cx="150" cy="70" r="9" stroke="currentColor" strokeWidth="1" opacity="0.3" />
          <circle cx="150" cy="70" r="3" fill="url(#melo-gradient)" opacity="0.6" />

          {/* NEW — small hex drifting off the top-left corner of the group */}
          <path
            d="M-20 -10 L-4 -20 L12 -10 L12 10 L-4 20 L-20 10 Z"
            stroke="url(#melo-gradient)" strokeWidth="1" opacity="0.22"
          />
        </g>

        {/* =========================================================
            NEW — CENTER CLUSTER
            Previously empty middle of the canvas; now holds a loose
            constellation of rings, a diamond lattice, and a soft
            connecting-lines motif so the pattern reads as one
            continuous field rather than four separated corners.
        ========================================================= */}
        <g transform="translate(560 300)">
          <circle cx="100" cy="130" r="60" stroke="url(#melo-gradient-diag)" strokeWidth="1.4" opacity="0.32" />
          <circle cx="100" cy="130" r="34" stroke="currentColor" strokeWidth="1" opacity="0.18" />
          <circle cx="100" cy="130" r="5" fill="url(#melo-gradient-diag)" opacity="0.4" />

          <path
            d="M100 70 L145 95 L145 165 L100 190 L55 165 L55 95 Z"
            stroke="currentColor"
            strokeWidth="0.9"
            opacity="0.16"
          />

          {/* connecting threads out to neighboring nodes */}
          <path d="M40 130 L-40 90" stroke="currentColor" strokeWidth="0.8" opacity="0.18" strokeDasharray="2 6" />
          <path d="M160 130 L235 175" stroke="currentColor" strokeWidth="0.8" opacity="0.18" strokeDasharray="2 6" />
          <path d="M100 70 L100 -10" stroke="currentColor" strokeWidth="0.8" opacity="0.16" strokeDasharray="2 6" />
          <path d="M100 190 L110 255" stroke="currentColor" strokeWidth="0.8" opacity="0.16" strokeDasharray="2 6" />

          <circle cx="-40" cy="90" r="4" fill="url(#melo-gradient-reverse)" opacity="0.5" />
          <circle cx="235" cy="175" r="4" fill="url(#melo-gradient)" opacity="0.5" />
          <circle cx="110" cy="255" r="3.5" fill="url(#melo-gradient-diag)" opacity="0.5" />
        </g>

        {/* =========================================================
            NEW — SECONDARY MID-LEFT CLUSTER
            Fills the quiet band between the top-left silhouette and
            the bottom-left loops.
        ========================================================= */}
        <g transform="translate(150 380)">
          <path
            d="M40 20 C90 0 140 25 150 70 C160 115 120 150 75 150 C30 150 -5 115 0 75 C3 50 18 30 40 20Z"
            stroke="url(#melo-gradient-reverse)"
            strokeWidth="1.3"
            opacity="0.28"
          />
          <circle cx="75" cy="80" r="16" stroke="currentColor" strokeWidth="1" opacity="0.2" />
          <circle cx="75" cy="80" r="4" fill="url(#melo-gradient-reverse)" opacity="0.4" />
          <path d="M-30 40 L-10 30" stroke="currentColor" strokeWidth="1" opacity="0.2" />
          <path d="M160 130 L185 145" stroke="currentColor" strokeWidth="1" opacity="0.2" />
        </g>

        {/* =========================================================
            NEW — SECONDARY MID-RIGHT / LOWER CLUSTER
            Fills the quiet band between the flower shape and the
            bottom-right rounded form.
        ========================================================= */}
        <g transform="translate(950 560)">
          <ellipse
            cx="60" cy="60" rx="72" ry="40" transform="rotate(-18 60 60)"
            stroke="url(#melo-gradient)" strokeWidth="1.2" opacity="0.26"
          />
          <circle cx="60" cy="60" r="10" fill="url(#melo-gradient)" opacity="0.35" />
          <path
            d="M-20 100 C10 80 40 95 55 120"
            stroke="currentColor" strokeWidth="1" opacity="0.2"
          />
          <path
            d="M120 20 L138 8"
            stroke="currentColor" strokeWidth="1" opacity="0.22"
          />
        </g>

        {/* =========================================================
            SMALL FLOATING ELEMENTS — expanded set for higher density,
            spread across previously sparse regions (center band,
            lower-middle, upper-middle).
        ========================================================= */}
        <g>
          <rect x="520" y="110" width="14" height="14" rx="3" transform="rotate(45 527 117)" stroke="url(#melo-gradient)" strokeWidth="1.5" opacity="0.55" />
          <circle cx="820" cy="130" r="8" stroke="currentColor" strokeWidth="1.4" opacity="0.3" />
          <path d="M720 720V740M710 730H730" stroke="url(#melo-gradient)" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
          <rect x="470" y="720" width="9" height="9" rx="2" transform="rotate(45 474.5 724.5)" stroke="currentColor" strokeWidth="1" opacity="0.28" />
          <circle cx="880" cy="620" r="3" fill="url(#melo-gradient)" opacity="0.55" />
          <circle cx="580" cy="370" r="3" fill="url(#melo-gradient-reverse)" opacity="0.5" />

          {/* NEW additions */}
          <circle cx="330" cy="250" r="4" fill="url(#melo-gradient-diag)" opacity="0.45" />
          <rect x="700" y="480" width="10" height="10" rx="2" transform="rotate(45 705 485)" stroke="url(#melo-gradient-reverse)" strokeWidth="1.2" opacity="0.35" />
          <circle cx="640" cy="90" r="5" stroke="currentColor" strokeWidth="1" opacity="0.22" />
          <path d="M980 380V396M972 388H988" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.3" />
          <circle cx="1200" cy="470" r="3" fill="url(#melo-gradient)" opacity="0.5" />
          <rect x="230" y="560" width="8" height="8" rx="2" transform="rotate(45 234 564)" stroke="currentColor" strokeWidth="1" opacity="0.25" />
          <path d="M60 480L44 468M52 474L36 486" stroke="url(#melo-gradient-reverse)" strokeWidth="1.1" opacity="0.3" />
          <circle cx="1080" cy="20" r="3.5" fill="url(#melo-gradient-diag)" opacity="0.4" />
          <path d="M420 640 L436 628 L452 640 L436 652 Z" stroke="currentColor" strokeWidth="1" opacity="0.24" />
          <circle cx="1250" cy="700" r="6" stroke="url(#melo-gradient)" strokeWidth="1.1" opacity="0.28" />
          <path d="M780 220 L800 205" stroke="currentColor" strokeWidth="1" opacity="0.2" />
        </g>
      </svg>

      {/* Keeps the center cleaner for messages */}
      <div
        className="
          absolute inset-0
          bg-[radial-gradient(
            ellipse_at_center,
            transparent_25%,
            rgba(0,0,0,0.08)_100%
          )]
          dark:bg-[radial-gradient(
            ellipse_at_center,
            transparent_25%,
            rgba(0,0,0,0.18)_100%
          )]
        "
      />
    </div>
  );
}