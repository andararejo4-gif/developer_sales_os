import React from 'react';

/**
 * Transparent 2D CAD Architectural Floorplan Vector for the Hero section.
 * Designed as a clean, drop-in SVG component so it can be replaced with
 * a custom Figma/AutoCAD export at any time.
 */
export const HeroArchitecturalSvg: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`relative w-full select-none ${className}`} aria-hidden="true">
      <svg
        viewBox="0 0 520 420"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-auto"
      >
        {/* Outer architectural dimension frame */}
        <g stroke="#1c1917" strokeOpacity="0.22" strokeWidth="1">
          {/* Top dimension line */}
          <line x1="70" y1="36" x2="450" y2="36" />
          <line x1="70" y1="28" x2="70" y2="44" />
          <line x1="450" y1="28" x2="450" y2="44" />
          {/* Left dimension line */}
          <line x1="42" y1="64" x2="42" y2="356" />
          <line x1="34" y1="64" x2="50" y2="64" />
          <line x1="34" y1="356" x2="50" y2="356" />
          {/* Subtle grid extension ticks */}
          <line x1="70" y1="64" x2="70" y2="48" strokeDasharray="2 3" />
          <line x1="450" y1="64" x2="450" y2="48" strokeDasharray="2 3" />
          <line x1="70" y1="356" x2="54" y2="356" strokeDasharray="2 3" />
        </g>

        {/* Dimension labels */}
        <g fill="#57534e" fontSize="10" fontFamily="monospace" letterSpacing="0.08em">
          <text x="260" y="28" textAnchor="middle">LEBAR KAVLING 7.50 M</text>
          <text
            x="28"
            y="210"
            textAnchor="middle"
            transform="rotate(-90 28 210)"
          >
            PANJANG 12.00 M · LUAS 90 M²
          </text>
        </g>

        {/* Lot boundary (dashed property line) */}
        <rect
          x="70"
          y="64"
          width="380"
          height="292"
          stroke="#1c1917"
          strokeOpacity="0.3"
          strokeWidth="1"
          strokeDasharray="6 4"
        />

        {/* Main building footprint - double-line architectural walls */}
        <g stroke="#1c1917" strokeWidth="1.75" strokeLinejoin="miter">
          {/* Outer structural wall */}
          <path d="M90 104 H430 V308 H250 V336 H90 V104 Z" strokeOpacity="0.82" />
          {/* Inner structural wall offset */}
          <path d="M96 110 H424 V302 H244 V330 H96 V110 Z" strokeOpacity="0.35" strokeWidth="1" />
        </g>

        {/* Interior partition walls */}
        <g stroke="#1c1917" strokeOpacity="0.65" strokeWidth="1.25">
          {/* Living / Dining divider */}
          <line x1="250" y1="110" x2="250" y2="218" />
          <line x1="250" y1="252" x2="250" y2="302" />
          {/* Bedroom 1 & 2 partition */}
          <line x1="250" y1="196" x2="424" y2="196" />
          {/* Bathroom & Service wall */}
          <line x1="96" y1="210" x2="188" y2="210" />
          <line x1="188" y1="210" x2="188" y2="256" />
          {/* Kitchen / Pantry counter */}
          <rect x="96" y="110" width="92" height="24" strokeOpacity="0.45" strokeWidth="1" />
        </g>

        {/* Architectural door swings (quarter-circle arcs + leaf) */}
        <g stroke="#b45309" strokeOpacity="0.75" strokeWidth="1.15">
          {/* Main Entrance Door */}
          <line x1="204" y1="330" x2="204" y2="296" />
          <path d="M204 296 A34 34 0 0 1 238 330" strokeDasharray="3 2" />

          {/* Bedroom 1 Door */}
          <line x1="250" y1="164" x2="282" y2="164" />
          <path d="M282 164 A32 32 0 0 1 250 196" strokeDasharray="3 2" />

          {/* Bedroom 2 Door */}
          <line x1="250" y1="252" x2="282" y2="252" />
          <path d="M282 252 A32 32 0 0 0 250 220" strokeDasharray="3 2" />

          {/* Bathroom Door */}
          <line x1="188" y1="256" x2="160" y2="256" />
          <path d="M160 256 A28 28 0 0 1 188 284" strokeDasharray="3 2" />
        </g>

        {/* Carport & Front Terrace paving lines */}
        <g stroke="#1c1917" strokeOpacity="0.25" strokeWidth="1">
          {/* Carport zone */}
          <rect x="266" y="308" width="164" height="48" />
          <line x1="286" y1="308" x2="286" y2="356" strokeOpacity="0.16" />
          <line x1="306" y1="308" x2="306" y2="356" strokeOpacity="0.16" />
          <line x1="326" y1="308" x2="326" y2="356" strokeOpacity="0.16" />
          <line x1="346" y1="308" x2="346" y2="356" strokeOpacity="0.16" />
          <line x1="366" y1="308" x2="366" y2="356" strokeOpacity="0.16" />
          <line x1="386" y1="308" x2="386" y2="356" strokeOpacity="0.16" />
          <line x1="406" y1="308" x2="406" y2="356" strokeOpacity="0.16" />

          {/* Rear Garden / Void */}
          <rect x="90" y="64" width="340" height="40" strokeOpacity="0.18" />
        </g>

        {/* Staircase schematic */}
        <g stroke="#1c1917" strokeOpacity="0.4" strokeWidth="1">
          <rect x="96" y="258" width="54" height="72" />
          <line x1="96" y1="270" x2="150" y2="270" />
          <line x1="96" y1="282" x2="150" y2="282" />
          <line x1="96" y1="294" x2="150" y2="294" />
          <line x1="96" y1="306" x2="150" y2="306" />
          <line x1="96" y1="318" x2="150" y2="318" />
          <path d="M123 324 V266 M119 271 L123 266 L127 271" stroke="#b45309" strokeOpacity="0.7" />
        </g>

        {/* Subtle room annotations */}
        <g fill="#1c1917" fillOpacity="0.55" fontSize="9.5" fontFamily="monospace" letterSpacing="0.06em">
          <text x="172" y="176" textAnchor="middle">RUANG KELUARGA</text>
          <text x="338" y="156" textAnchor="middle">KAMAR UTAMA</text>
          <text x="338" y="252" textAnchor="middle">KAMAR TIDUR 2</text>
          <text x="348" y="336" textAnchor="middle">CARPORT</text>
          <text x="260" y="88" textAnchor="middle" fillOpacity="0.4">TAMAN BELAKANG</text>
        </g>

        {/* Single Terracotta Corner Datum Marker */}
        <g>
          <circle cx="90" cy="336" r="4" fill="#b45309" />
          <circle cx="90" cy="336" r="9" stroke="#b45309" strokeOpacity="0.35" strokeWidth="1" />
          <text x="90" y="378" fill="#b45309" fontSize="9.5" fontFamily="monospace" fontWeight="600">
            TIPE 75/90 · UNIT A-01
          </text>
        </g>
      </svg>
    </div>
  );
};
