import { describe, it, expect } from 'bun:test';
import {
  FEATURES_CATALOG,
  AGENTS_REGISTRY,
  has_feature,
  get_accessible_features,
  get_features_count_by_module
} from '../src/lib/plans/features-catalog';

describe('Blueprint v1.2 Features & Entitlement Catalog', () => {
  it('harus memuat tepat 100 fitur F01-F100', () => {
    expect(FEATURES_CATALOG.length).toBe(100);
    const ids = new Set(FEATURES_CATALOG.map(f => f.id));
    expect(ids.size).toBe(100);
    expect(ids.has('F01')).toBe(true);
    expect(ids.has('F100')).toBe(true);
  });

  it('harus memuat tepat 48 agent A01-A48', () => {
    expect(AGENTS_REGISTRY.length).toBe(48);
    const ids = new Set(AGENTS_REGISTRY.map(a => a.id));
    expect(ids.size).toBe(48);
    expect(ids.has('A01')).toBe(true);
    expect(ids.has('A48')).toBe(true);
  });

  it('harus memiliki entitlement tepat: Gold = 63, Platinum = 88, Diamond = 100', () => {
    const goldFeatures = get_accessible_features('gold');
    const platFeatures = get_accessible_features('platinum');
    const diamFeatures = get_accessible_features('diamond');

    expect(goldFeatures.length).toBe(63);
    expect(platFeatures.length).toBe(88);
    expect(diamFeatures.length).toBe(100);
  });

  it('harus memenuhi distribusi modul M17 (Presensi, GPS, Call Log, AI Guide): 3 / 4 / 4', () => {
    const countsGold = get_features_count_by_module('gold');
    const countsPlat = get_features_count_by_module('platinum');
    const countsDiam = get_features_count_by_module('diamond');

    expect(countsGold['M17'].accessible).toBe(3); // F97, F98, F99
    expect(countsPlat['M17'].accessible).toBe(4); // F97, F98, F99, F100
    expect(countsDiam['M17'].accessible).toBe(4); // F97, F98, F99, F100

    // F100 terkunci di Gold, terbuka di Platinum dan Diamond
    expect(has_feature('gold', 'F100')).toBe(false);
    expect(has_feature('platinum', 'F100')).toBe(true);
    expect(has_feature('diamond', 'F100')).toBe(true);
  });

  it('harus memastikan fitur keamanan & lapangan dasar (F91-F93 & F97-F99) terbuka di seluruh paket', () => {
    const coreFeatures = ['F91', 'F92', 'F93', 'F97', 'F98', 'F99'];
    for (const fid of coreFeatures) {
      expect(has_feature('gold', fid)).toBe(true);
      expect(has_feature('platinum', fid)).toBe(true);
      expect(has_feature('diamond', fid)).toBe(true);
    }
  });

  it('harus mengizinkan Module Pass untuk membuka modul M05-M15 pada paket Gold', () => {
    // Feature F27 (M05) minimum Platinum
    expect(has_feature('gold', 'F27')).toBe(false);
    // Dengan module pass M05
    expect(has_feature('gold', 'F27', ['M05'])).toBe(true);
  });
});
