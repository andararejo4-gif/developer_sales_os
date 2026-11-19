// ============================================================================
// MARKET RESEARCH TEST SUITE - DEVELOPER SALES OS (FASE 2)
// ============================================================================

import { describe, expect, test } from 'bun:test';
import {
  DEFAULT_THE_PARK_RESEARCH_REPORT,
  THE_PARK_5_PERSONAS,
  THE_PARK_PUBLIC_FACILITIES,
  THE_PARK_COMPETITORS,
  THE_PARK_MARKET_SHARE,
} from '../src/lib/market-research/the-park-market-research';
import {
  getMarketResearchReport,
  regenerateMarketResearch,
  applyMarketResearchTeaser,
  generateMarketShareSvg,
} from '../src/lib/market-research/market-research-engine';

describe('Fase 2: Market Research & Persona Engine', () => {
  test('Memiliki minimal 5 persona target terstruktur dengan kebutuhan, keberatan, kanal, dan pemicu beli', () => {
    expect(THE_PARK_5_PERSONAS.length).toBeGreaterThanOrEqual(5);

    THE_PARK_5_PERSONAS.forEach((persona) => {
      expect(persona.id).toBeDefined();
      expect(persona.name).toBeDefined();
      expect(persona.demographics.ageRange).toBeDefined();
      expect(persona.demographics.monthlyIncome).toBeDefined();
      expect(persona.demographics.profession.length).toBeGreaterThan(0);
      expect(persona.needsAndPains.length).toBeGreaterThan(0);
      expect(persona.commonObjections.length).toBeGreaterThan(0);
      expect(persona.preferredChannels.length).toBeGreaterThan(0);
      expect(persona.buyingTriggers.length).toBeGreaterThan(0);
      // Validasi sitasi fakta KB
      expect(persona.relevantFactIds.length).toBeGreaterThan(0);
    });
  });

  test('Fasilitas publik memetakan cincin radius dari 500 m s.d. 25 km secara komprehensif', () => {
    const requiredRings = [500, 1000, 2000, 3000, 5000, 10000, 15000, 20000, 25000];
    const coveredRings = new Set(THE_PARK_PUBLIC_FACILITIES.map((f) => f.radiusRing));

    requiredRings.forEach((ring) => {
      expect(coveredRings.has(ring as any)).toBe(true);
    });

    // Validasi jarak riil dan waktu tempuh
    THE_PARK_PUBLIC_FACILITIES.forEach((fac) => {
      expect(fac.distanceMeters).toBeGreaterThan(0);
      expect(fac.driveTimeMinutes).toBeGreaterThan(0);
      expect(fac.coordinates.lat).toBeDefined();
      expect(fac.coordinates.lng).toBeDefined();
    });
  });

  test('Kompetitor terpetakan per cincin radius dengan rentang harga dan keunggulan pembeda', () => {
    expect(THE_PARK_COMPETITORS.length).toBeGreaterThanOrEqual(3);

    THE_PARK_COMPETITORS.forEach((comp) => {
      expect(comp.name).toBeDefined();
      expect(comp.distanceKm).toBeGreaterThan(0);
      expect(comp.priceStartIdr).toBeGreaterThan(0);
      expect(comp.priceEndIdr).toBeGreaterThan(comp.priceStartIdr);
      expect(comp.theParkAdvantage).toBeDefined();
      expect(comp.advantageFactId).toBeDefined();
    });
  });

  test('Analisis pangsa pasar (Market Share) berbasis data riil dan menghasilkan SVG terstruktur', () => {
    const totalShare = THE_PARK_MARKET_SHARE.slices.reduce((acc, s) => acc + s.sharePercent, 0);
    expect(Math.round(totalShare)).toBe(100);

    const ourSlice = THE_PARK_MARKET_SHARE.slices.find((s) => s.isOurProject);
    expect(ourSlice).toBeDefined();
    expect(ourSlice!.sharePercent).toBeGreaterThan(10);

    const svgOutput = generateMarketShareSvg(DEFAULT_THE_PARK_RESEARCH_REPORT);
    expect(svgOutput).toContain('<svg');
    expect(svgOutput).toContain('viewBox="0 0 220 220"');
    expect(svgOutput).toContain('stroke-dasharray');
  });

  test('Mode Demo memotong data riset pasar secara server-side ke 25% cuplikan', () => {
    const full = DEFAULT_THE_PARK_RESEARCH_REPORT;
    const teaser = applyMarketResearchTeaser(full);

    // Di mode demo, hanya 1 persona (20%), fasilitas dan kompetitor dipotong
    expect(teaser.personas.length).toBe(1);
    expect(teaser.facilities.length).toBeLessThan(full.facilities.length);
    expect(teaser.competitors.length).toBe(1);
    expect(teaser.marketShare.competitiveEdgeSummary).toContain('[Cuplikan Demo 25%]');
  });

  test('Wewenang regenerasi riset pasar dibatasi untuk Direksi dan Sales Manager', () => {
    // SM dan Direksi berhasil
    const repDireksi = regenerateMarketResearch('proj-the-park-01', 'The Park Townhouse', 'DIREKSI');
    expect(repDireksi.version).toBeGreaterThanOrEqual(2);

    const repSM = regenerateMarketResearch('proj-the-park-01', 'The Park Townhouse', 'SALES_MANAGER');
    expect(repSM.version).toBeGreaterThanOrEqual(3);

    // SE dan TL ditolak
    expect(() => {
      regenerateMarketResearch('proj-the-park-01', 'The Park Townhouse', 'SALES_EXECUTIVE');
    }).toThrow('Hanya Direksi atau Sales Manager');

    expect(() => {
      regenerateMarketResearch('proj-the-park-01', 'The Park Townhouse', 'TEAM_LEADER');
    }).toThrow('Hanya Direksi atau Sales Manager');
  });
});
