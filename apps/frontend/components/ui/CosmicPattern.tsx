"use client";

export default function CosmicPattern() {
  return (
    <div
      aria-hidden="true"
      className="
        pointer-events-none
        absolute inset-0
        overflow-hidden
        text-base-content
      "
    >
      <svg
        className="
          absolute inset-0
          h-full w-full
          opacity-[0.55]
          dark:opacity-[0.62]
        "
        viewBox="0 0 1400 900"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="melo-gradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#17A6E8" />
            <stop offset="55%" stopColor="#7029F7" />
            <stop offset="100%" stopColor="#F73EC9" />
          </linearGradient>
          <linearGradient id="melo-gradient-reverse" x1="1" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#F73EC9" />
            <stop offset="50%" stopColor="#7029F7" />
            <stop offset="100%" stopColor="#17A6E8" />
          </linearGradient>
          <linearGradient id="melo-gradient-diag" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0%" stopColor="#17A6E8" />
            <stop offset="50%" stopColor="#F73EC9" />
            <stop offset="100%" stopColor="#7029F7" />
          </linearGradient>
          <linearGradient id="melo-fill" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#17A6E8" stopOpacity="0.10" />
            <stop offset="55%" stopColor="#7029F7" stopOpacity="0.09" />
            <stop offset="100%" stopColor="#F73EC9" stopOpacity="0.10" />
          </linearGradient>
        </defs>

        {/* =========================================================
            TOP LEFT — large organic shape
        ========================================================= */}
        <g transform="translate(-95 -75) rotate(10 260 230)">
          <path
            d="M155 90 C235 35 355 50 420 125 C485 200 470 310 395 375 C320 440 195 430 115 365 C35 300 35 185 95 125 C112 108 132 97 155 90Z"
            fill="url(#melo-fill)" stroke="url(#melo-gradient)" strokeWidth="2.2" opacity="0.85"
          />
          <path
            d="M175 125 C245 80 340 92 388 150 C438 210 425 295 365 340 C300 388 210 380 150 330 C90 280 90 200 135 155 C146 143 159 133 175 125Z"
            stroke="currentColor" strokeWidth="1.5" opacity="0.34"
          />
          <path
            d="M180 205 C215 150 295 135 350 175 C405 215 395 280 350 310 C300 345 220 330 190 285 C173 260 169 230 180 205Z"
            stroke="url(#melo-gradient)" strokeWidth="1.6" opacity="0.65"
          />
          <path
            d="M205 235 C235 195 290 180 330 200 C355 212 372 235 375 260"
            stroke="currentColor" strokeWidth="1.1" opacity="0.36"
          />
          <circle cx="270" cy="245" r="24" stroke="url(#melo-gradient)" strokeWidth="1.6" opacity="0.6" />
          <circle cx="270" cy="245" r="6" fill="url(#melo-gradient)" opacity="0.42" />
          <path d="M135 185L115 170" stroke="currentColor" strokeWidth="1.3" opacity="0.38" />
          <path d="M390 205L410 190" stroke="currentColor" strokeWidth="1.3" opacity="0.38" />
          <circle cx="40" cy="320" r="14" stroke="url(#melo-gradient-reverse)" strokeWidth="1.4" opacity="0.5" />
          <path d="M440 340 L458 330 L476 340 L476 360 L458 370 L440 360 Z" stroke="currentColor" strokeWidth="1.2" opacity="0.34" />
          {/* extra density */}
          <circle cx="110" cy="60" r="3" fill="url(#melo-gradient)" opacity="0.55" />
          <circle cx="10" cy="230" r="4" fill="url(#melo-gradient-reverse)" opacity="0.5" />
          <path d="M340 45 L352 35" stroke="currentColor" strokeWidth="1.2" opacity="0.32" />
          <circle cx="420" cy="270" r="3.5" fill="url(#melo-gradient)" opacity="0.5" />
        </g>

        {/* =========================================================
            TOP RIGHT — orbital geometry
        ========================================================= */}
        <g transform="translate(1040 -55)">
          <circle cx="175" cy="175" r="125" stroke="url(#melo-gradient)" strokeWidth="2.2" opacity="0.68" />
          <circle cx="175" cy="175" r="92" stroke="currentColor" strokeWidth="1.4" opacity="0.32" />
          <circle cx="175" cy="175" r="48" stroke="url(#melo-gradient-reverse)" strokeWidth="1.6" opacity="0.55" />
          <ellipse cx="175" cy="175" rx="145" ry="48" transform="rotate(-25 175 175)" stroke="currentColor" strokeWidth="1.3" opacity="0.32" />
          <ellipse cx="175" cy="175" rx="48" ry="145" transform="rotate(25 175 175)" stroke="currentColor" strokeWidth="1.1" opacity="0.28" />
          <path d="M270 105 A120 120 0 0 1 282 220" stroke="url(#melo-gradient)" strokeWidth="4.2" strokeLinecap="round" opacity="0.65" />
          <circle cx="292" cy="102" r="5" fill="url(#melo-gradient)" opacity="0.75" />
          <circle cx="68" cy="202" r="4" fill="url(#melo-gradient-reverse)" opacity="0.6" />
          <circle cx="175" cy="175" r="9" fill="url(#melo-gradient)" opacity="0.45" />
          <ellipse cx="175" cy="175" rx="168" ry="168" transform="rotate(10 175 175)" stroke="currentColor" strokeWidth="1" opacity="0.22" strokeDasharray="3 9" />
          <circle cx="45" cy="60" r="3.5" fill="url(#melo-gradient-reverse)" opacity="0.5" />
          <circle cx="-20" cy="260" r="16" stroke="url(#melo-gradient)" strokeWidth="1.3" opacity="0.4" />
          {/* extra density */}
          <circle cx="320" cy="60" r="3" fill="url(#melo-gradient)" opacity="0.5" />
          <circle cx="20" cy="20" r="4" fill="url(#melo-gradient-reverse)" opacity="0.45" />
          <path d="M100 300 L114 290" stroke="currentColor" strokeWidth="1.1" opacity="0.3" />
        </g>

        {/* =========================================================
            CENTER RIGHT — layered flower / petal shape
        ========================================================= */}
        <g transform="translate(1110 390)">
          <path d="M120 135 C65 105 45 45 75 12 C105 -20 160 5 170 55 C178 90 155 120 120 135Z" fill="url(#melo-fill)" stroke="url(#melo-gradient)" strokeWidth="2" opacity="0.75" />
          <path d="M120 135 C155 85 220 78 250 112 C280 145 255 195 210 205 C165 215 130 180 120 135Z" stroke="currentColor" strokeWidth="1.6" opacity="0.35" />
          <path d="M120 135 C165 155 180 215 145 245 C110 275 62 245 60 200 C58 165 83 140 120 135Z" stroke="url(#melo-gradient-reverse)" strokeWidth="1.7" opacity="0.6" />
          <path d="M120 135 C105 105 115 80 138 72 C162 65 178 87 170 110 C163 128 142 137 120 135Z" stroke="currentColor" strokeWidth="1.1" opacity="0.35" />
          <circle cx="120" cy="135" r="27" stroke="url(#melo-gradient)" strokeWidth="1.6" opacity="0.6" />
          <circle cx="120" cy="135" r="7" fill="url(#melo-gradient)" opacity="0.5" />
          <circle cx="-40" cy="230" r="10" stroke="url(#melo-gradient-reverse)" strokeWidth="1.2" opacity="0.4" />
          <path d="M-10 300 L4 288 L18 300 L4 312 Z" stroke="currentColor" strokeWidth="1.1" opacity="0.34" />
          {/* extra density */}
          <circle cx="220" cy="20" r="3.5" fill="url(#melo-gradient-diag)" opacity="0.5" />
          <circle cx="30" cy="330" r="3" fill="url(#melo-gradient)" opacity="0.45" />
          <path d="M-60 100 L-46 90" stroke="currentColor" strokeWidth="1" opacity="0.28" />
        </g>

        {/* =========================================================
            BOTTOM LEFT — flowing loops
        ========================================================= */}
        <g transform="translate(-75 635)">
          <path d="M0 135 C75 40 195 30 260 95 C325 160 295 245 210 265 C125 285 45 235 60 165 C72 110 145 100 200 135" fill="url(#melo-fill)" stroke="url(#melo-gradient)" strokeWidth="2.2" opacity="0.75" />
          <path d="M30 145 C95 75 175 70 225 115 C270 155 245 205 195 220 C145 235 100 205 108 165 C114 135 150 130 180 145" stroke="currentColor" strokeWidth="1.5" opacity="0.35" />
          <path d="M135 115L150 100M142 107L158 113" stroke="url(#melo-gradient)" strokeWidth="1.6" opacity="0.6" />
          <circle cx="202" cy="137" r="6" fill="url(#melo-gradient)" opacity="0.65" />
          <path d="M270 200 C310 175 345 195 370 175 C395 155 415 165 430 145" stroke="url(#melo-gradient-reverse)" strokeWidth="1.4" opacity="0.4" />
          <circle cx="320" cy="60" r="11" stroke="currentColor" strokeWidth="1.2" opacity="0.35" />
          {/* extra density */}
          <circle cx="380" cy="230" r="3.5" fill="url(#melo-gradient)" opacity="0.5" />
          <circle cx="10" cy="30" r="3" fill="url(#melo-gradient-reverse)" opacity="0.45" />
          <path d="M240 30 L254 20" stroke="currentColor" strokeWidth="1.1" opacity="0.3" />
        </g>

        {/* =========================================================
            BOTTOM RIGHT — rounded geometric form
        ========================================================= */}
        <g transform="translate(1000 700) rotate(18 120 90)">
          <rect x="35" y="15" width="170" height="150" rx="52" fill="url(#melo-fill)" stroke="url(#melo-gradient-reverse)" strokeWidth="2.2" opacity="0.75" />
          <rect x="62" y="40" width="116" height="100" rx="35" stroke="currentColor" strokeWidth="1.4" opacity="0.34" />
          <path d="M78 98 C105 63 150 65 172 95 C187 115 177 138 153 148" stroke="url(#melo-gradient)" strokeWidth="1.7" opacity="0.6" />
          <circle cx="150" cy="70" r="9" stroke="currentColor" strokeWidth="1.1" opacity="0.4" />
          <circle cx="150" cy="70" r="3" fill="url(#melo-gradient)" opacity="0.7" />
          <path d="M-20 -10 L-4 -20 L12 -10 L12 10 L-4 20 L-20 10 Z" stroke="url(#melo-gradient)" strokeWidth="1.1" opacity="0.32" />
          {/* extra density */}
          <circle cx="220" cy="180" r="3.5" fill="url(#melo-gradient-reverse)" opacity="0.5" />
          <path d="M0 190 L14 180" stroke="currentColor" strokeWidth="1" opacity="0.3" />
        </g>

        {/* =========================================================
            CENTER CLUSTER
        ========================================================= */}
        <g transform="translate(560 300)">
          <circle cx="100" cy="130" r="60" stroke="url(#melo-gradient-diag)" strokeWidth="1.6" opacity="0.42" />
          <circle cx="100" cy="130" r="34" stroke="currentColor" strokeWidth="1.2" opacity="0.28" />
          <circle cx="100" cy="130" r="5" fill="url(#melo-gradient-diag)" opacity="0.5" />
          <path d="M100 70 L145 95 L145 165 L100 190 L55 165 L55 95 Z" stroke="currentColor" strokeWidth="1.1" opacity="0.26" />
          <path d="M40 130 L-40 90" stroke="currentColor" strokeWidth="1" opacity="0.28" strokeDasharray="2 6" />
          <path d="M160 130 L235 175" stroke="currentColor" strokeWidth="1" opacity="0.28" strokeDasharray="2 6" />
          <path d="M100 70 L100 -10" stroke="currentColor" strokeWidth="1" opacity="0.26" strokeDasharray="2 6" />
          <path d="M100 190 L110 255" stroke="currentColor" strokeWidth="1" opacity="0.26" strokeDasharray="2 6" />
          <circle cx="-40" cy="90" r="4" fill="url(#melo-gradient-reverse)" opacity="0.6" />
          <circle cx="235" cy="175" r="4" fill="url(#melo-gradient)" opacity="0.6" />
          <circle cx="110" cy="255" r="3.5" fill="url(#melo-gradient-diag)" opacity="0.6" />
          {/* extra density */}
          <circle cx="-90" cy="20" r="3" fill="url(#melo-gradient)" opacity="0.5" />
          <circle cx="280" cy="40" r="3.5" fill="url(#melo-gradient-reverse)" opacity="0.5" />
          <path d="M20 220 L36 232" stroke="currentColor" strokeWidth="1" opacity="0.26" />
        </g>

        {/* =========================================================
            MID-LEFT CLUSTER
        ========================================================= */}
        <g transform="translate(150 380)">
          <path d="M40 20 C90 0 140 25 150 70 C160 115 120 150 75 150 C30 150 -5 115 0 75 C3 50 18 30 40 20Z" stroke="url(#melo-gradient-reverse)" strokeWidth="1.5" opacity="0.4" />
          <circle cx="75" cy="80" r="16" stroke="currentColor" strokeWidth="1.1" opacity="0.3" />
          <circle cx="75" cy="80" r="4" fill="url(#melo-gradient-reverse)" opacity="0.5" />
          <path d="M-30 40 L-10 30" stroke="currentColor" strokeWidth="1.1" opacity="0.3" />
          <path d="M160 130 L185 145" stroke="currentColor" strokeWidth="1.1" opacity="0.3" />
          {/* extra density */}
          <circle cx="120" cy="10" r="3" fill="url(#melo-gradient)" opacity="0.45" />
          <circle cx="-40" cy="140" r="3.5" fill="url(#melo-gradient-diag)" opacity="0.5" />
        </g>

        {/* =========================================================
            MID-RIGHT / LOWER CLUSTER
        ========================================================= */}
        <g transform="translate(950 560)">
          <ellipse cx="60" cy="60" rx="72" ry="40" transform="rotate(-18 60 60)" stroke="url(#melo-gradient)" strokeWidth="1.4" opacity="0.36" />
          <circle cx="60" cy="60" r="10" fill="url(#melo-gradient)" opacity="0.45" />
          <path d="M-20 100 C10 80 40 95 55 120" stroke="currentColor" strokeWidth="1.1" opacity="0.3" />
          <path d="M120 20 L138 8" stroke="currentColor" strokeWidth="1.1" opacity="0.32" />
          {/* extra density */}
          <circle cx="160" cy="90" r="3.5" fill="url(#melo-gradient-reverse)" opacity="0.5" />
          <circle cx="-50" cy="30" r="3" fill="url(#melo-gradient)" opacity="0.45" />
        </g>

        {/* =========================================================
            NEW — TOP-CENTER FILLER CLUSTER
        ========================================================= */}
        <g transform="translate(700 40)">
          <circle cx="0" cy="0" r="26" stroke="url(#melo-gradient)" strokeWidth="1.2" opacity="0.3" />
          <circle cx="0" cy="0" r="4" fill="url(#melo-gradient)" opacity="0.5" />
          <path d="M-60 30 L-40 40" stroke="currentColor" strokeWidth="1" opacity="0.24" />
          <path d="M50 20 L70 10" stroke="currentColor" strokeWidth="1" opacity="0.24" />
          <circle cx="-90" cy="-10" r="3" fill="url(#melo-gradient-reverse)" opacity="0.4" />
          <circle cx="100" cy="10" r="3.5" fill="url(#melo-gradient-diag)" opacity="0.45" />
        </g>

        {/* =========================================================
            NEW — BOTTOM-CENTER FILLER CLUSTER
        ========================================================= */}
        <g transform="translate(650 800)">
          <ellipse cx="0" cy="0" rx="50" ry="22" stroke="url(#melo-gradient-reverse)" strokeWidth="1.2" opacity="0.3" />
          <circle cx="0" cy="0" r="4" fill="url(#melo-gradient-reverse)" opacity="0.5" />
          <path d="M-90 -20 L-72 -10" stroke="currentColor" strokeWidth="1" opacity="0.24" />
          <path d="M80 10 L98 0" stroke="currentColor" strokeWidth="1" opacity="0.24" />
          <circle cx="150" cy="-30" r="3" fill="url(#melo-gradient)" opacity="0.42" />
        </g>

        {/* =========================================================
            SMALL FLOATING ELEMENTS — brighter and much denser,
            covering the full canvas evenly.
        ========================================================= */}
        <g>
          <rect x="520" y="110" width="14" height="14" rx="3" transform="rotate(45 527 117)" stroke="url(#melo-gradient)" strokeWidth="1.6" opacity="0.65" />
          <circle cx="820" cy="130" r="8" stroke="currentColor" strokeWidth="1.5" opacity="0.4" />
          <path d="M720 720V740M710 730H730" stroke="url(#melo-gradient)" strokeWidth="1.6" strokeLinecap="round" opacity="0.6" />
          <rect x="470" y="720" width="9" height="9" rx="2" transform="rotate(45 474.5 724.5)" stroke="currentColor" strokeWidth="1.1" opacity="0.38" />
          <circle cx="880" cy="620" r="3" fill="url(#melo-gradient)" opacity="0.65" />
          <circle cx="580" cy="370" r="3" fill="url(#melo-gradient-reverse)" opacity="0.6" />
          <circle cx="330" cy="250" r="4" fill="url(#melo-gradient-diag)" opacity="0.55" />
          <rect x="700" y="480" width="10" height="10" rx="2" transform="rotate(45 705 485)" stroke="url(#melo-gradient-reverse)" strokeWidth="1.3" opacity="0.45" />
          <circle cx="640" cy="90" r="5" stroke="currentColor" strokeWidth="1.1" opacity="0.32" />
          <path d="M980 380V396M972 388H988" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" opacity="0.4" />
          <circle cx="1200" cy="470" r="3" fill="url(#melo-gradient)" opacity="0.6" />
          <rect x="230" y="560" width="8" height="8" rx="2" transform="rotate(45 234 564)" stroke="currentColor" strokeWidth="1.1" opacity="0.35" />
          <path d="M60 480L44 468M52 474L36 486" stroke="url(#melo-gradient-reverse)" strokeWidth="1.2" opacity="0.4" />
          <circle cx="1080" cy="20" r="3.5" fill="url(#melo-gradient-diag)" opacity="0.5" />
          <path d="M420 640 L436 628 L452 640 L436 652 Z" stroke="currentColor" strokeWidth="1.1" opacity="0.34" />
          <circle cx="1250" cy="700" r="6" stroke="url(#melo-gradient)" strokeWidth="1.2" opacity="0.38" />
          <path d="M780 220 L800 205" stroke="currentColor" strokeWidth="1.1" opacity="0.3" />

          {/* NEW — a second wave of small particles for real density */}
          <circle cx="180" cy="480" r="3" fill="url(#melo-gradient)" opacity="0.5" />
          <circle cx="260" cy="90" r="3" fill="url(#melo-gradient-reverse)" opacity="0.5" />
          <circle cx="500" cy="620" r="3.5" fill="url(#melo-gradient-diag)" opacity="0.5" />
          <circle cx="770" cy="60" r="3" fill="url(#melo-gradient)" opacity="0.5" />
          <circle cx="920" cy="330" r="3.5" fill="url(#melo-gradient-reverse)" opacity="0.5" />
          <circle cx="1030" cy="600" r="3" fill="url(#melo-gradient-diag)" opacity="0.5" />
          <circle cx="1330" cy="220" r="3.5" fill="url(#melo-gradient)" opacity="0.5" />
          <circle cx="60" cy="700" r="3" fill="url(#melo-gradient-reverse)" opacity="0.5" />
          <circle cx="410" cy="470" r="3" fill="url(#melo-gradient-diag)" opacity="0.45" />
          <circle cx="1150" cy="120" r="3" fill="url(#melo-gradient)" opacity="0.45" />
          <rect x="380" y="770" width="8" height="8" rx="2" transform="rotate(45 384 774)" stroke="currentColor" strokeWidth="1" opacity="0.3" />
          <rect x="1240" y="330" width="9" height="9" rx="2" transform="rotate(45 1244.5 334.5)" stroke="url(#melo-gradient)" strokeWidth="1.1" opacity="0.4" />
          <rect x="30" y="480" width="8" height="8" rx="2" transform="rotate(45 34 484)" stroke="url(#melo-gradient-reverse)" strokeWidth="1.1" opacity="0.4" />
          <path d="M900 750L916 738" stroke="currentColor" strokeWidth="1" opacity="0.28" />
          <path d="M240 700L256 688" stroke="currentColor" strokeWidth="1" opacity="0.28" />
          <path d="M1310 550L1326 538" stroke="currentColor" strokeWidth="1" opacity="0.28" />
          <path d="M660 200V216M652 208H668" stroke="url(#melo-gradient-diag)" strokeWidth="1.1" strokeLinecap="round" opacity="0.42" />
          <path d="M950 470V486M942 478H958" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.28" />
          <circle cx="850" cy="820" r="4" stroke="url(#melo-gradient)" strokeWidth="1.1" opacity="0.36" />
          <circle cx="60" cy="120" r="4" stroke="url(#melo-gradient-reverse)" strokeWidth="1.1" opacity="0.36" />
          <circle cx="1180" cy="800" r="3" fill="url(#melo-gradient-diag)" opacity="0.45" />
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