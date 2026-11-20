import React from 'react';

export type HeroDomain = 'all' | 'marketing' | 'teamlead' | 'architect';

interface HeroTriDomainSvgProps {
  activeDomain: HeroDomain;
  onSelectDomain: (domain: HeroDomain) => void;
}

export const HeroTriDomainSvg: React.FC<HeroTriDomainSvgProps> = ({
  activeDomain,
  onSelectDomain,
}) => {
  const isLit = (domain: Exclude<HeroDomain, 'all'>) =>
    activeDomain === 'all' || activeDomain === domain;

  const strokeFor = (domain: Exclude<HeroDomain, 'all'>) =>
    activeDomain === domain ? '#2563EB' : isLit(domain) ? '#334155' : '#CBD5E1';

  const fillTintFor = (domain: Exclude<HeroDomain, 'all'>) =>
    activeDomain === domain ? '#EFF6FF' : '#FFFFFF';

  const opacityFor = (domain: Exclude<HeroDomain, 'all'>) =>
    isLit(domain) ? 1 : 0.42;

  return (
    <svg
      viewBox="0 0 640 440"
      className="w-full h-auto select-none"
      role="img"
      aria-label="Diagram arsitektur Developer Sales OS: menyatukan ranah Architect, Marketing, dan Team Lead"
    >
      <defs>
        <pattern id="v2-subtle-dots" width="24" height="24" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1" fill="#E2E8F0" />
        </pattern>
      </defs>

      {/* Clean White Canvas with Subtle Registration Dots */}
      <rect width="640" height="440" rx="12" fill="#FFFFFF" />
      <rect width="640" height="440" rx="12" fill="url(#v2-subtle-dots)" opacity="0.65" />

      {/* Outer Technical Frame */}
      <rect
        x="12"
        y="12"
        width="616"
        height="416"
        rx="8"
        fill="none"
        stroke="#E2E8F0"
        strokeWidth="1.2"
      />

      {/* Orthogonal System Bus Lines Connecting 3 Domains to Core */}
      <g fill="none" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        {/* Architect -> Core */}
        <path
          d="M 165 206 L 165 256 L 268 256"
          stroke={activeDomain === 'architect' ? '#2563EB' : '#94A3B8'}
          strokeDasharray={activeDomain === 'architect' ? 'none' : '4 4'}
        />
        {/* Marketing -> Core */}
        <path
          d="M 475 206 L 475 256 L 372 256"
          stroke={activeDomain === 'marketing' ? '#2563EB' : '#94A3B8'}
          strokeDasharray={activeDomain === 'marketing' ? 'none' : '4 4'}
        />
        {/* Team Lead -> Core */}
        <path
          d="M 320 292 L 320 282"
          stroke={activeDomain === 'teamlead' ? '#2563EB' : '#94A3B8'}
        />
      </g>

      {/* ========================================================= */}
      {/* DOMAIN 1 (TOP LEFT): ARCHITECT — Siteplan & Unit Spec     */}
      {/* ========================================================= */}
      <g
        opacity={opacityFor('architect')}
        className="cursor-pointer transition-opacity duration-200"
        onClick={() => onSelectDomain(activeDomain === 'architect' ? 'all' : 'architect')}
      >
        <rect
          x="32"
          y="32"
          width="268"
          height="174"
          rx="10"
          fill={fillTintFor('architect')}
          stroke={strokeFor('architect')}
          strokeWidth={activeDomain === 'architect' ? '2' : '1.25'}
        />
        {/* Domain Header */}
        <rect x="46" y="46" width="84" height="20" rx="4" fill="#EFF6FF" stroke="#BFDBFE" strokeWidth="1" />
        <text x="88" y="60" textAnchor="middle" fontSize="10" fontWeight="700" fill="#1D4ED8" fontFamily="monospace">
          ARCHITECT
        </text>
        <text x="284" y="60" textAnchor="end" fontSize="10" fill="#64748B" fontFamily="monospace">
          SHM · PBG · 75/90
        </text>

        {/* Clean 2D Architectural Townhouse Elevation + Floorplan Grid */}
        <g transform="translate(48, 80)">
          {/* Siteplan plot */}
          <rect x="0" y="14" width="112" height="92" rx="4" fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="1.2" />
          {/* Architectural House Massing */}
          <polygon points="14,52 56,22 98,52" fill="#EFF6FF" stroke="#2563EB" strokeWidth="1.6" />
          <rect x="20" y="52" width="72" height="44" fill="#FFFFFF" stroke="#0F172A" strokeWidth="1.5" />
          {/* Floor-to-ceiling glass window */}
          <rect x="30" y="60" width="24" height="28" fill="#DBEAFE" stroke="#2563EB" strokeWidth="1.2" />
          <line x1="42" y1="60" x2="42" y2="88" stroke="#2563EB" strokeWidth="1" />
          {/* Door */}
          <rect x="64" y="64" width="18" height="32" fill="#F1F5F9" stroke="#0F172A" strokeWidth="1.2" />
          {/* Dimension line */}
          <line x1="14" y1="102" x2="98" y2="102" stroke="#2563EB" strokeWidth="1" />
          <circle cx="14" cy="102" r="2" fill="#2563EB" />
          <circle cx="98" cy="102" r="2" fill="#2563EB" />

          {/* Spec Callouts on Right */}
          <rect x="126" y="14" width="110" height="26" rx="4" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1" />
          <text x="134" y="31" fontSize="10.5" fontWeight="700" fill="#0F172A">
            3 Klaster Jepang
          </text>

          <rect x="126" y="47" width="110" height="26" rx="4" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1" />
          <text x="134" y="64" fontSize="10.5" fontWeight="600" fill="#334155">
            Radius Riset 25km
          </text>

          <rect x="126" y="80" width="110" height="26" rx="4" fill="#EFF6FF" stroke="#BFDBFE" strokeWidth="1" />
          <text x="134" y="97" fontSize="10.5" fontWeight="700" fill="#1D4ED8">
            Harga Terverifikasi
          </text>
        </g>
      </g>

      {/* ========================================================= */}
      {/* DOMAIN 2 (TOP RIGHT): MARKETING — 99 Poin & Konten        */}
      {/* ========================================================= */}
      <g
        opacity={opacityFor('marketing')}
        className="cursor-pointer transition-opacity duration-200"
        onClick={() => onSelectDomain(activeDomain === 'marketing' ? 'all' : 'marketing')}
      >
        <rect
          x="340"
          y="32"
          width="268"
          height="174"
          rx="10"
          fill={fillTintFor('marketing')}
          stroke={strokeFor('marketing')}
          strokeWidth={activeDomain === 'marketing' ? '2' : '1.25'}
        />
        {/* Domain Header */}
        <rect x="354" y="46" width="88" height="20" rx="4" fill="#EFF6FF" stroke="#BFDBFE" strokeWidth="1" />
        <text x="398" y="60" textAnchor="middle" fontSize="10" fontWeight="700" fill="#1D4ED8" fontFamily="monospace">
          MARKETING
        </text>
        <text x="592" y="60" textAnchor="end" fontSize="10" fill="#64748B" fontFamily="monospace">
          99 POIN · KONTEN
        </text>

        {/* Marketing Funnel + 99 Poin Document + Calendar Grid */}
        <g transform="translate(356, 82)">
          {/* 99 Poin Editorial Card */}
          <rect x="0" y="10" width="118" height="96" rx="6" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1.2" />
          <text x="12" y="30" fontSize="18" fontWeight="800" fill="#2563EB" fontFamily="sans-serif">
            99
          </text>
          <text x="38" y="29" fontSize="10" fontWeight="700" fill="#0F172A">
            Keunggulan
          </text>
          <line x1="12" y1="40" x2="104" y2="40" stroke="#E2E8F0" strokeWidth="1" />
          <rect x="12" y="49" width="82" height="6" rx="3" fill="#CBD5E1" />
          <rect x="12" y="62" width="68" height="6" rx="3" fill="#E2E8F0" />
          <rect x="12" y="75" width="90" height="6" rx="3" fill="#E2E8F0" />
          <rect x="12" y="88" width="54" height="8" rx="4" fill="#2563EB" />

          {/* Campaign Pulse / Content Schedule */}
          <rect x="130" y="10" width="106" height="96" rx="6" fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="1.2" />
          <text x="140" y="28" fontSize="10" fontWeight="700" fill="#0F172A">
            Kalender 30 Hari
          </text>
          {/* Mini 4x3 Calendar Cells */}
          <rect x="140" y="36" width="18" height="14" rx="2" fill="#2563EB" />
          <rect x="163" y="36" width="18" height="14" rx="2" fill="#DBEAFE" />
          <rect x="186" y="36" width="18" height="14" rx="2" fill="#2563EB" />
          <rect x="209" y="36" width="18" height="14" rx="2" fill="#E2E8F0" />

          <rect x="140" y="55" width="18" height="14" rx="2" fill="#DBEAFE" />
          <rect x="163" y="55" width="18" height="14" rx="2" fill="#2563EB" />
          <rect x="186" y="55" width="18" height="14" rx="2" fill="#E2E8F0" />
          <rect x="209" y="55" width="18" height="14" rx="2" fill="#2563EB" />

          {/* Lead Stream Indicator */}
          <path d="M 142 88 L 164 80 L 188 84 L 222 73" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" />
          <circle cx="222" cy="73" r="3" fill="#2563EB" />
        </g>
      </g>

      {/* ========================================================= */}
      {/* CENTRAL HUB: SALES OS CORE                                */}
      {/* ========================================================= */}
      <g>
        <rect
          x="268"
          y="230"
          width="104"
          height="52"
          rx="8"
          fill="#0F172A"
          stroke="#2563EB"
          strokeWidth="2"
        />
        <text x="320" y="253" textAnchor="middle" fontSize="11" fontWeight="800" fill="#FFFFFF" letterSpacing="0.5">
          SALES OS
        </text>
        <text x="320" y="269" textAnchor="middle" fontSize="9.5" fontWeight="600" fill="#93C5FD" fontFamily="monospace">
          SINGLE CORE
        </text>
      </g>

      {/* ========================================================= */}
      {/* DOMAIN 3 (BOTTOM): TEAM LEAD — SLA, BANT & Playbook       */}
      {/* ========================================================= */}
      <g
        opacity={opacityFor('teamlead')}
        className="cursor-pointer transition-opacity duration-200"
        onClick={() => onSelectDomain(activeDomain === 'teamlead' ? 'all' : 'teamlead')}
      >
        <rect
          x="76"
          y="292"
          width="488"
          height="118"
          rx="10"
          fill={fillTintFor('teamlead')}
          stroke={strokeFor('teamlead')}
          strokeWidth={activeDomain === 'teamlead' ? '2' : '1.25'}
        />
        {/* Domain Header */}
        <rect x="92" y="306" width="92" height="20" rx="4" fill="#EFF6FF" stroke="#BFDBFE" strokeWidth="1" />
        <text x="138" y="320" textAnchor="middle" fontSize="10" fontWeight="700" fill="#1D4ED8" fontFamily="monospace">
          TEAM LEAD
        </text>
        <text x="548" y="320" textAnchor="end" fontSize="10" fill="#64748B" fontFamily="monospace">
          TL FULL AI · SM SEMI-AI · SE COPILOT
        </text>

        {/* 3 Pipeline Nodes inside Team Lead */}
        <g transform="translate(92, 338)">
          {/* Node 1: Respon <= 5 Menit */}
          <rect x="0" y="0" width="144" height="56" rx="6" fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="1.2" />
          <text x="12" y="22" fontSize="11" fontWeight="800" fill="#0F172A">
            Respon &le; 5 Menit
          </text>
          <text x="12" y="40" fontSize="10" fill="#475569">
            Audit SLA Lead Masuk
          </text>

          {/* Arrow */}
          <path d="M 148 28 L 162 28" stroke="#2563EB" strokeWidth="1.8" strokeLinecap="round" />

          {/* Node 2: Kualifikasi BANT & 72h */}
          <rect x="166" y="0" width="148" height="56" rx="6" fill="#EFF6FF" stroke="#93C5FD" strokeWidth="1.2" />
          <text x="178" y="22" fontSize="11" fontWeight="800" fill="#1D4ED8">
            BANT &amp; Aturan 72j
          </text>
          <text x="178" y="40" fontSize="10" fill="#1E40AF">
            Distribusi &amp; Rotasi Adil
          </text>

          {/* Arrow */}
          <path d="M 318 28 L 332 28" stroke="#2563EB" strokeWidth="1.8" strokeLinecap="round" />

          {/* Node 3: Scorecard & Closing */}
          <rect x="336" y="0" width="120" height="56" rx="6" fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="1.2" />
          <text x="348" y="22" fontSize="11" fontWeight="800" fill="#0F172A">
            Target Sold Out
          </text>
          <rect x="348" y="34" width="96" height="8" rx="4" fill="#E2E8F0" />
          <rect x="348" y="34" width="72" height="8" rx="4" fill="#2563EB" />
        </g>
      </g>
    </svg>
  );
};
