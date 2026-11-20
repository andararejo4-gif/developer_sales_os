import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export type EcosystemFocus = 'ecosystem' | 'architect' | 'marketing' | 'teamlead';

const FOCUS_COPY: Record<EcosystemFocus, { tag: string; title: string; detail: string }> = {
  ecosystem: {
    tag: 'EKOSISTEM MASTERPLAN HIDUP',
    title: 'Klaster townhouse, arus marketing, dan kendali Team Lead dalam satu aliran',
    detail: 'Spesifikasi klaster diekstrak menjadi 99 Keunggulan, mendatangkan prospek ke gerbang, lalu diaudit SLA ≤5 menit oleh Team Lead AI.',
  },
  architect: {
    tag: '01 · ARCHITECT & MASTERPLAN',
    title: 'Klaster townhouse Jepang 2 lantai · High Ceiling 3.8m · SHM & PBG',
    detail: 'Bangunan dan data teknis menjadi jangkar faktual. Harga tanah & bangunan terkunci verifikasi manusia tanpa interpolasi AI.',
  },
  marketing: {
    tag: '02 · MARKETING & 99 KEUNGGULAN',
    title: 'Ekstrak brosur menjadi 99 poin faktual & kalender konten 30 hari',
    detail: 'Setiap fitur arsitektur otomatis diterjemahkan menjadi konten TOFU–MOFU–BOFU yang mengalirkan prospek berkualitas ke gerbang proyek.',
  },
  teamlead: {
    tag: '03 · TEAM LEAD AI 24/7',
    title: 'Radar SLA ≤5 menit, skor BANT ≥7 & rotasi otomatis 72 jam',
    detail: 'Setiap prospek yang masuk dipantau otonom agar direspons cepat, terukur di scorecard, dan fokus menuju target sold out.',
  },
};

export const HeroExplodedSvg: React.FC = () => {
  const stageRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [focus, setFocus] = useState<EcosystemFocus>('ecosystem');

  // GSAP living idle animations + subtle scroll depth parallax
  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced || !svgRef.current) return;

    const ctx = gsap.context(() => {
      // 1. Live SLA radar hand sweep (Team Lead right wing)
      gsap.to('.v3-eco-radar', {
        rotation: 360,
        transformOrigin: '734px 124px',
        duration: 5.2,
        repeat: -1,
        ease: 'none',
      });

      // 2. Flowing lead particles from Marketing -> One Gate Cluster Entrance
      gsap.fromTo(
        '.v3-eco-lead-a',
        { x: 0, y: 0, opacity: 0 },
        {
          keyframes: [
            { x: 0, y: 0, opacity: 1, duration: 0.25 },
            { x: 66, y: 74, opacity: 1, duration: 1.2 },
            { x: 138, y: 122, opacity: 0, duration: 0.55 },
          ],
          repeat: -1,
          repeatDelay: 0.5,
          ease: 'power1.inOut',
        }
      );

      gsap.fromTo(
        '.v3-eco-lead-b',
        { x: 0, y: 0, opacity: 0 },
        {
          keyframes: [
            { x: 0, y: 0, opacity: 1, duration: 0.25 },
            { x: 66, y: 74, opacity: 1, duration: 1.2 },
            { x: 138, y: 122, opacity: 0, duration: 0.55 },
          ],
          repeat: -1,
          delay: 1.05,
          repeatDelay: 0.5,
          ease: 'power1.inOut',
        }
      );

      // 3. Telemetry pulse from Cluster -> Team Lead AI
      gsap.fromTo(
        '.v3-eco-telemetry',
        { strokeDashoffset: 220 },
        {
          strokeDashoffset: 0,
          duration: 2.6,
          repeat: -1,
          ease: 'none',
        }
      );

      // 4. 72h rerouting arc pulse inside Team Lead console
      gsap.fromTo(
        '.v3-eco-reroute',
        { strokeDashoffset: 90 },
        {
          strokeDashoffset: 0,
          duration: 2.2,
          repeat: -1,
          ease: 'power2.inOut',
        }
      );

      // 5. Gentle architectural entrance on townhouses
      gsap.from('.v3-eco-house-rise', {
        y: 16,
        opacity: 0,
        duration: 0.9,
        stagger: 0.12,
        ease: 'power3.out',
      });

      // 6. Subtle scroll parallax depth (wings float gently, houses stay grounded)
      if (stageRef.current) {
        gsap.to('.v3-wing-left-scroll', {
          y: -14,
          ease: 'none',
          scrollTrigger: {
            trigger: stageRef.current,
            start: 'top 78%',
            end: 'bottom 20%',
            scrub: 0.8,
          },
        });
        gsap.to('.v3-wing-right-scroll', {
          y: -18,
          ease: 'none',
          scrollTrigger: {
            trigger: stageRef.current,
            start: 'top 78%',
            end: 'bottom 20%',
            scrub: 0.8,
          },
        });
      }
    }, svgRef);

    return () => ctx.revert();
  }, []);

  // Smooth GSAP focus transition without ever overlapping or hiding the houses
  useEffect(() => {
    if (!svgRef.current) return;
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const dur = prefersReduced ? 0 : 0.45;

    const states: Record<
      EcosystemFocus,
      { archOp: number; mktOp: number; tlOp: number; cadOp: number; archY: number; mktY: number; tlY: number }
    > = {
      ecosystem: { archOp: 1, mktOp: 1, tlOp: 1, cadOp: 0.65, archY: 0, mktY: 0, tlY: 0 },
      architect: { archOp: 1, mktOp: 0.34, tlOp: 0.34, cadOp: 1, archY: -4, mktY: 4, tlY: 4 },
      marketing: { archOp: 0.72, mktOp: 1, tlOp: 0.32, cadOp: 0.25, archY: 2, mktY: -6, tlY: 4 },
      teamlead: { archOp: 0.72, mktOp: 0.32, tlOp: 1, cadOp: 0.25, archY: 2, mktY: 4, tlY: -6 },
    };

    const s = states[focus];
    gsap.to('.v3-eco-architect', { opacity: s.archOp, y: s.archY, duration: dur, ease: 'power2.out' });
    gsap.to('.v3-eco-marketing', { opacity: s.mktOp, y: s.mktY, duration: dur, ease: 'power2.out' });
    gsap.to('.v3-eco-teamlead', { opacity: s.tlOp, y: s.tlY, duration: dur, ease: 'power2.out' });
    gsap.to('.v3-eco-cad-badges', { opacity: s.cadOp, duration: dur, ease: 'power2.out' });
  }, [focus]);

  const info = FOCUS_COPY[focus];

  return (
    <div ref={stageRef} className="w-full">
      {/* Touch-first Domain Controls (2x2 symmetrical grid on mobile, clean inline row on sm+) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 sm:gap-3 mb-4">
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 w-full sm:w-auto">
          {(
            [
              { key: 'ecosystem', label: 'Ekosistem Penuh' },
              { key: 'architect', label: '01 Architect' },
              { key: 'marketing', label: '02 Marketing' },
              { key: 'teamlead', label: '03 Team Lead' },
            ] as { key: EcosystemFocus; label: string }[]
          ).map((btn) => {
            const active = focus === btn.key;
            return (
              <button
                key={btn.key}
                onClick={() => setFocus(btn.key)}
                className={`min-h-[44px] px-3 sm:px-4 rounded-full text-xs font-bold transition-colors cursor-pointer border text-center flex items-center justify-center ${
                  active
                    ? 'bg-[#0B3D2E] text-[#C6F432] border-[#0B3D2E]'
                    : 'bg-white text-[#0B3D2E] border-[#CFE1D5] hover:border-[#2F9E5B]'
                }`}
              >
                {btn.label}
              </button>
            );
          })}
        </div>

        <span className="text-[11px] font-mono uppercase tracking-wider text-[#3B5E50] text-center sm:text-right">
          Tap area diorama untuk fokus ranah
        </span>
      </div>

      {/* Main Living Masterplan Diorama Canvas */}
      <div className="rounded-2xl bg-white border border-[#CFE1D5] shadow-[0_24px_64px_-24px_rgba(11,61,46,0.16)] overflow-hidden">
        <div className="p-3 sm:p-5">
          <svg
            ref={svgRef}
            viewBox="0 0 920 500"
            className="w-full h-auto select-none"
            role="img"
            aria-label="Diorama ekosistem Developer Sales OS: Klaster Townhouse Architect terhubung dengan Marketing 99 Keunggulan dan Team Lead AI"
          >
            <defs>
              <linearGradient id="v3-sky-wash" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#F6FAF7" />
                <stop offset="100%" stopColor="#FFFFFF" />
              </linearGradient>
              <pattern id="v3-eco-dots" width="28" height="28" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="1" fill="#DCEBE1" />
              </pattern>
            </defs>

            {/* Clean Light Architectural Backdrop */}
            <rect width="920" height="500" rx="14" fill="url(#v3-sky-wash)" />
            <rect width="920" height="500" rx="14" fill="url(#v3-eco-dots)" opacity="0.65" />

            {/* ===================================================== */}
            {/* DATA FLOW CONDUITS CONNECTING THE 3 DOMAINS           */}
            {/* ===================================================== */}
            <g fill="none" strokeLinecap="round">
              {/* Marketing -> Cluster One Gate (Animated Lead Stream) */}
              <path
                d="M 182 222 C 218 286, 266 324, 326 346"
                stroke="#2F9E5B"
                strokeWidth="2.4"
                strokeDasharray="6 6"
              />
              {/* Animated lead particles traveling into the cluster gate */}
              <circle className="v3-eco-lead-a" cx="182" cy="222" r="5.5" fill="#C6F432" stroke="#0B3D2E" strokeWidth="1.6" />
              <circle className="v3-eco-lead-b" cx="182" cy="222" r="4.5" fill="#2F9E5B" stroke="#0B3D2E" strokeWidth="1.4" />

              {/* Architect House -> Marketing (Spec Extraction Line) */}
              <path
                d="M 358 214 C 316 184, 286 154, 256 146"
                stroke="#0B3D2E"
                strokeWidth="1.6"
                strokeDasharray="3 5"
                opacity="0.55"
              />

              {/* Cluster -> Team Lead AI (Live SLA Telemetry Conduit) */}
              <path
                className="v3-eco-telemetry"
                d="M 604 344 C 668 320, 712 280, 742 222"
                stroke="#2F9E5B"
                strokeWidth="2.4"
                strokeDasharray="8 6"
              />
            </g>

            {/* ===================================================== */}
            {/* CENTER-BOTTOM ANCHOR: 01 ARCHITECT — LIVING CLUSTER   */}
            {/* ===================================================== */}
            <g
              className="v3-eco-architect cursor-pointer"
              onClick={() => setFocus(focus === 'architect' ? 'ecosystem' : 'architect')}
            >
              {/* Isometric Ground Masterplan Platform (open to sky!) */}
              <polygon
                points="460,260 726,356 460,452 194,356"
                fill="#E4F1E8"
                stroke="#0B3D2E"
                strokeWidth="2"
              />
              <polygon
                points="194,356 460,452 460,468 194,372"
                fill="#CFE1D5"
                stroke="#0B3D2E"
                strokeWidth="1.6"
              />
              <polygon
                points="726,356 460,452 460,468 726,372"
                fill="#B5D3BF"
                stroke="#0B3D2E"
                strokeWidth="1.6"
              />

              {/* Cluster Paving Boulevard Road */}
              <polygon
                points="324,309 596,407 540,428 268,330"
                fill="#FFFFFF"
                stroke="#8BB89C"
                strokeWidth="1.2"
              />
              {/* Road center dashes */}
              <line x1="312" y1="326" x2="554" y2="413" stroke="#CFE1D5" strokeWidth="1.5" strokeDasharray="8 8" />

              {/* ONE GATE SYSTEM Entrance Arch (Front-Left of Boulevard) */}
              <g transform="translate(306, 302)">
                <rect x="0" y="14" width="10" height="32" rx="2" fill="#0B3D2E" />
                <rect x="44" y="28" width="10" height="32" rx="2" fill="#0B3D2E" />
                <polygon points="-4,14 58,34 58,24 -4,4" fill="#C6F432" stroke="#0B3D2E" strokeWidth="1.5" />
                <rect x="16" y="42" width="22" height="4" rx="2" fill="#2F9E5B" />
              </g>

              {/* TOWNHOUSE UNIT A (Left-Back — Tipe Diamond 2 Lantai) */}
              <g className="v3-eco-house-rise">
                {/* Main 2-story left facade */}
                <polygon points="348,300 434,332 434,238 348,206" fill="#FFFFFF" stroke="#0B3D2E" strokeWidth="1.9" />
                {/* Right facade */}
                <polygon points="434,332 496,308 496,214 434,238" fill="#F6FAF7" stroke="#0B3D2E" strokeWidth="1.9" />
                {/* Upper balcony recess */}
                <polygon points="362,258 420,280 420,248 362,226" fill="#E4F1E8" stroke="#2F9E5B" strokeWidth="1.4" />
                {/* Floor-to-ceiling ground glass */}
                <polygon points="362,302 406,318 406,282 362,266" fill="#D5ECDD" stroke="#2F9E5B" strokeWidth="1.4" />
                <line x1="384" y1="274" x2="384" y2="310" stroke="#2F9E5B" strokeWidth="1.2" />
                {/* Warm timber door */}
                <polygon points="414,322 428,327 428,292 414,287" fill="#0B3D2E" />
                {/* Japanese asymmetrical pitched roof (Chartreuse accent) */}
                <polygon points="338,206 436,242 504,214 410,178" fill="#C6F432" stroke="#0B3D2E" strokeWidth="2" />
                <polygon points="338,206 436,242 436,250 338,214" fill="#9FD423" stroke="#0B3D2E" strokeWidth="1.5" />
              </g>

              {/* TOWNHOUSE UNIT B (Right-Front — Tipe Gold 2 Lantai) */}
              <g className="v3-eco-house-rise">
                <polygon points="476,348 558,378 558,288 476,258" fill="#FFFFFF" stroke="#0B3D2E" strokeWidth="1.9" />
                <polygon points="558,378 618,354 618,264 558,288" fill="#F6FAF7" stroke="#0B3D2E" strokeWidth="1.9" />
                {/* Upper window */}
                <polygon points="490,308 544,328 544,298 490,278" fill="#D5ECDD" stroke="#2F9E5B" strokeWidth="1.4" />
                {/* Ground glass */}
                <polygon points="490,350 532,366 532,332 490,316" fill="#E4F1E8" stroke="#2F9E5B" strokeWidth="1.4" />
                {/* Pitched roof */}
                <polygon points="466,258 560,292 626,264 536,230" fill="#2F9E5B" stroke="#0B3D2E" strokeWidth="2" />
                <polygon points="466,258 560,292 560,299 466,265" fill="#1D7A46" stroke="#0B3D2E" strokeWidth="1.5" />
              </g>

              {/* Botanical Landscape Trees & Courtyard Hedges */}
              <g>
                {/* Tree 1 near left courtyard */}
                <line x1="274" y1="354" x2="274" y2="334" stroke="#0B3D2E" strokeWidth="2.2" />
                <circle cx="274" cy="326" r="14" fill="#2F9E5B" stroke="#0B3D2E" strokeWidth="1.6" />
                <circle cx="268" cy="322" r="5" fill="#C6F432" opacity="0.85" />

                {/* Tree 2 near right corner */}
                <line x1="652" y1="358" x2="652" y2="338" stroke="#0B3D2E" strokeWidth="2.2" />
                <circle cx="652" cy="330" r="15" fill="#2F9E5B" stroke="#0B3D2E" strokeWidth="1.6" />
                <circle cx="646" cy="325" r="5.5" fill="#C6F432" opacity="0.85" />

                {/* Tree 3 behind Unit A */}
                <line x1="518" y1="246" x2="518" y2="230" stroke="#0B3D2E" strokeWidth="2" />
                <circle cx="518" cy="222" r="12" fill="#E4F1E8" stroke="#0B3D2E" strokeWidth="1.6" />
              </g>

              {/* CAD Architectural Spec Badges around Cluster */}
              <g className="v3-eco-cad-badges">
                <rect x="380" y="132" width="160" height="32" rx="999" fill="#FFFFFF" stroke="#0B3D2E" strokeWidth="1.6" />
                <circle cx="398" cy="148" r="5" fill="#C6F432" stroke="#0B3D2E" strokeWidth="1.4" />
                <text x="410" y="152" fontSize="11" fontWeight="800" fill="#0B3D2E" fontFamily="monospace">
                  01 · ARCHITECT · SHM
                </text>

                <rect x="394" y="468" width="132" height="24" rx="999" fill="#0B3D2E" />
                <text x="460" y="484" textAnchor="middle" fontSize="10" fontWeight="700" fill="#C6F432" fontFamily="monospace">
                  3 KLASTER · 30 UNIT
                </text>
              </g>
            </g>

            {/* ===================================================== */}
            {/* LEFT WING: 02 MARKETING — 99 KEUNGGULAN & KONTEN      */}
            {/* ===================================================== */}
            <g className="v3-wing-left-scroll">
              <g
                className="v3-eco-marketing cursor-pointer"
                onClick={() => setFocus(focus === 'marketing' ? 'ecosystem' : 'marketing')}
              >
                <rect
                  x="26"
                  y="38"
                  width="230"
                  height="184"
                  rx="14"
                  fill="#FFFFFF"
                  stroke="#0B3D2E"
                  strokeWidth="2"
                />
                {/* Header bar */}
                <rect x="42" y="54" width="114" height="22" rx="999" fill="#EAF4D3" stroke="#2F9E5B" strokeWidth="1.2" />
                <text x="99" y="69" textAnchor="middle" fontSize="10" fontWeight="800" fill="#0B3D2E" fontFamily="monospace">
                  02 · MARKETING
                </text>

                {/* 99 Keunggulan Block */}
                <g transform="translate(42, 88)">
                  <rect x="0" y="0" width="96" height="62" rx="8" fill="#F6FAF7" stroke="#CFE1D5" strokeWidth="1.4" />
                  <text x="12" y="28" fontSize="22" fontWeight="800" fill="#0B3D2E">
                    99
                  </text>
                  <text x="44" y="25" fontSize="10" fontWeight="700" fill="#2F9E5B">
                    Poin
                  </text>
                  <rect x="12" y="38" width="72" height="6" rx="3" fill="#C6F432" />
                  <rect x="12" y="48" width="52" height="5" rx="2.5" fill="#CFE1D5" />
                </g>

                {/* 30-Day Content Calendar Block */}
                <g transform="translate(148, 88)">
                  <rect x="0" y="0" width="92" height="62" rx="8" fill="#F6FAF7" stroke="#CFE1D5" strokeWidth="1.4" />
                  <text x="10" y="18" fontSize="9" fontWeight="800" fill="#0B3D2E" fontFamily="monospace">
                    KONTEN 30H
                  </text>
                  <rect x="10" y="26" width="15" height="12" rx="2.5" fill="#2F9E5B" />
                  <rect x="29" y="26" width="15" height="12" rx="2.5" fill="#C6F432" stroke="#0B3D2E" strokeWidth="1" />
                  <rect x="48" y="26" width="15" height="12" rx="2.5" fill="#0B3D2E" />
                  <rect x="67" y="26" width="15" height="12" rx="2.5" fill="#CFE1D5" />

                  <rect x="10" y="42" width="15" height="12" rx="2.5" fill="#CFE1D5" />
                  <rect x="29" y="42" width="15" height="12" rx="2.5" fill="#2F9E5B" />
                  <rect x="48" y="42" width="15" height="12" rx="2.5" fill="#C6F432" stroke="#0B3D2E" strokeWidth="1" />
                  <rect x="67" y="42" width="15" height="12" rx="2.5" fill="#2F9E5B" />
                </g>

                {/* Outbound Lead Stream Footer */}
                <rect x="42" y="162" width="198" height="44" rx="9" fill="#0B3D2E" />
                <text x="56" y="181" fontSize="10.5" fontWeight="800" fill="#C6F432">
                  Arus Lead TOFU → BOFU
                </text>
                <text x="56" y="196" fontSize="9.5" fill="#E4F1E8" fontFamily="monospace">
                  Mengalir ke gerbang klaster ↓
                </text>
              </g>
            </g>

            {/* ===================================================== */}
            {/* RIGHT WING: 03 TEAM LEAD AI — RADAR SLA & 72H ROUTING */}
            {/* ===================================================== */}
            <g className="v3-wing-right-scroll">
              <g
                className="v3-eco-teamlead cursor-pointer"
                onClick={() => setFocus(focus === 'teamlead' ? 'ecosystem' : 'teamlead')}
              >
                <rect
                  x="664"
                  y="38"
                  width="230"
                  height="184"
                  rx="14"
                  fill="#FFFFFF"
                  stroke="#0B3D2E"
                  strokeWidth="2"
                />
                {/* Header bar */}
                <rect x="680" y="54" width="124" height="22" rx="999" fill="#C6F432" stroke="#0B3D2E" strokeWidth="1.2" />
                <text x="742" y="69" textAnchor="middle" fontSize="10" fontWeight="800" fill="#0B3D2E" fontFamily="monospace">
                  03 · TEAM LEAD AI
                </text>

                {/* Live SLA Radar Dial */}
                <g>
                  <circle cx="734" cy="124" r="32" fill="#F6FAF7" stroke="#0B3D2E" strokeWidth="1.8" />
                  <circle cx="734" cy="124" r="19" fill="none" stroke="#CFE1D5" strokeWidth="1.2" />
                  <g className="v3-eco-radar">
                    <line x1="734" y1="124" x2="734" y2="95" stroke="#2F9E5B" strokeWidth="2.5" strokeLinecap="round" />
                    <circle cx="734" cy="96" r="4" fill="#C6F432" stroke="#0B3D2E" strokeWidth="1.3" />
                  </g>
                  <circle cx="734" cy="124" r="4" fill="#0B3D2E" />
                </g>

                {/* SLA & BANT Metrics */}
                <g transform="translate(778, 92)">
                  <rect x="0" y="0" width="100" height="29" rx="7" fill="#EAF4D3" stroke="#2F9E5B" strokeWidth="1.2" />
                  <text x="10" y="18" fontSize="10.5" fontWeight="800" fill="#0B3D2E">
                    SLA &le; 5 mnt
                  </text>

                  <rect x="0" y="36" width="100" height="29" rx="7" fill="#F6FAF7" stroke="#CFE1D5" strokeWidth="1.2" />
                  <text x="10" y="54" fontSize="10.5" fontWeight="800" fill="#0B3D2E">
                    BANT &ge; 7/10
                  </text>
                </g>

                {/* 72h Rerouting Arc & Sold Out Bar */}
                <g transform="translate(680, 166)">
                  <rect x="0" y="0" width="198" height="40" rx="9" fill="#F6FAF7" stroke="#CFE1D5" strokeWidth="1.3" />
                  <text x="12" y="16" fontSize="9.5" fontWeight="800" fill="#2F9E5B" fontFamily="monospace">
                    ROTASI 72 JAM → SOLD OUT
                  </text>
                  <path
                    className="v3-eco-reroute"
                    d="M 12 31 Q 62 19 108 31"
                    fill="none"
                    stroke="#0B3D2E"
                    strokeWidth="2"
                    strokeDasharray="90"
                  />
                  <rect x="120" y="25" width="66" height="7" rx="3.5" fill="#E4F1E8" />
                  <rect x="120" y="25" width="48" height="7" rx="3.5" fill="#2F9E5B" />
                </g>
              </g>
            </g>
          </svg>
        </div>

        {/* Synchronized Caption Strip */}
        <div className="px-5 py-4 sm:px-6 bg-[#F6FAF7] border-t border-[#CFE1D5] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#2F9E5B]">
              {info.tag}
            </span>
            <p className="font-display-v3 font-bold text-base text-[#0B3D2E] mt-0.5">
              {info.title}
            </p>
          </div>
          <p className="text-xs sm:text-sm text-[#3B5E50] max-w-md leading-relaxed">
            {info.detail}
          </p>
        </div>
      </div>
    </div>
  );
};
