
"use client";

import { useReducedMotion } from "framer-motion";

export function Glows() {
  const reduceMotion = useReducedMotion();

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      <svg
        className="absolute inset-x-0 bottom-0 h-[50%] w-full"
        viewBox="0 0 800 300"
        preserveAspectRatio="none"
      >
        <defs>
          <filter id="whisp-soften" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1.4" />
          </filter>

          <linearGradient id="whisp-fade" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="white" stopOpacity="0" />
            <stop offset="45%" stopColor="white" stopOpacity="1" />
            <stop offset="100%" stopColor="white" stopOpacity="1" />
          </linearGradient>
          <mask id="whisp-fade-mask">
            <rect width="800" height="300" fill="url(#whisp-fade)" />
          </mask>

          {/* Back layer: slow, wide, faintest */}
          <pattern
            id="whisp-wave-a"
            x="0"
            y="0"
            width="400"
            height="300"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M0,210 C50,168 150,252 200,210 C250,168 350,252 400,210"
              fill="none"
              stroke="#2854D9"
              strokeOpacity="0.16"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            {!reduceMotion && (
              <animateTransform
                attributeName="patternTransform"
                type="translate"
                from="0 0"
                to="400 0"
                dur="26s"
                repeatCount="indefinite"
              />
            )}
          </pattern>

          {/* Middle layer: opposite direction, tighter wavelength */}
          <pattern
            id="whisp-wave-b"
            x="0"
            y="0"
            width="320"
            height="300"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M0,160 C40,128 120,192 160,160 C200,128 280,192 320,160"
              fill="none"
              stroke="#2854D9"
              strokeOpacity="0.2"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            {!reduceMotion && (
              <animateTransform
                attributeName="patternTransform"
                type="translate"
                from="320 0"
                to="0 0"
                dur="19s"
                repeatCount="indefinite"
              />
            )}
          </pattern>

          {/* Front layer: fastest, smallest amplitude, most visible */}
          <pattern
            id="whisp-wave-c"
            x="0"
            y="0"
            width="220"
            height="300"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M0,120 C27,102 83,138 110,120 C137,102 193,138 220,120"
              fill="none"
              stroke="#2854D9"
              strokeOpacity="0.28"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            {!reduceMotion && (
              <animateTransform
                attributeName="patternTransform"
                type="translate"
                from="0 0"
                to="220 0"
                dur="13s"
                repeatCount="indefinite"
              />
            )}
          </pattern>
        </defs>

        <g mask="url(#whisp-fade-mask)" filter="url(#whisp-soften)">
          <rect width="800" height="300" fill="url(#whisp-wave-a)" />
          <rect width="800" height="300" fill="url(#whisp-wave-b)" />
          <rect width="800" height="300" fill="url(#whisp-wave-c)" />
        </g>
      </svg>
    </div>
  );
}