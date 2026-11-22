import { describe, expect, it } from 'bun:test';
import {
  VIEW_PATHS,
  getPathnameForView,
  getViewFromPathname,
  type DashboardView,
} from '../src/lib/navigation/router';

describe('Dashboard URL Router', () => {
  it('memetakan setiap DashboardView ke URL unik', () => {
    const paths = Object.values(VIEW_PATHS);
    const unique = new Set(paths);
    expect(unique.size).toBe(paths.length);
  });

  it('mengembalikan view yang tepat dari pathname', () => {
    for (const [view, path] of Object.entries(VIEW_PATHS)) {
      expect(getViewFromPathname(path)).toBe(view as DashboardView);
      expect(getViewFromPathname(`${path}/`)).toBe(view as DashboardView);
    }
    expect(getViewFromPathname('/')).toBe('dashboard');
    expect(getViewFromPathname('/tidak-dikenal')).toBe('dashboard');
  });

  it('mengembalikan pathname yang tepat untuk setiap view', () => {
    expect(getPathnameForView('riset')).toBe('/riset-pasar');
    expect(getPathnameForView('kalender')).toBe('/kalender-konten');
    expect(getPathnameForView('crm')).toBe('/crm');
  });
});
