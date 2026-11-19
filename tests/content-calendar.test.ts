// ============================================================================
// CONTENT CALENDAR TEST SUITE - DEVELOPER SALES OS (FASE 3)
// ============================================================================

import { describe, expect, test } from 'bun:test';
import {
  generateContentCalendarSlots,
  createDefaultContentCalendar,
  getContentCalendar,
  applyCalendarTeaser,
  updateSlotPosting,
} from '../src/lib/content-calendar/calendar-generator';
import {
  assertNoTokenLeakage,
  FORBIDDEN_EXPORT_TERMS,
} from '../src/lib/exporters/clean-export-guard';

describe('Fase 3: Content Calendar Engine (30 Days x 3 Slots/Day)', () => {
  test('Menghasilkan tepat 90 slot untuk 30 hari penuh (3 slot per hari)', () => {
    const slots = generateContentCalendarSlots('OFFICIAL');
    expect(slots.length).toBe(90);

    // Periksa setiap hari 1..30 memiliki tepat 3 slot
    for (let day = 1; day <= 30; day++) {
      const daySlots = slots.filter((s) => s.dayNumber === day);
      expect(daySlots.length).toBe(3);

      // Slot 1: TOFU (Pagi)
      expect(daySlots[0].slotOrder).toBe(1);
      expect(daySlots[0].funnelStage).toBe('TOFU');
      expect(daySlots[0].scheduledTime).toContain('09:00');

      // Slot 2: MOFU (Siang/Sore)
      expect(daySlots[1].slotOrder).toBe(2);
      expect(daySlots[1].funnelStage).toBe('MOFU');
      expect(daySlots[1].scheduledTime).toContain('14:00');

      // Slot 3: BOFU (Malam)
      expect(daySlots[2].slotOrder).toBe(3);
      expect(daySlots[2].funnelStage).toBe('BOFU');
      expect(daySlots[2].scheduledTime).toContain('19:30');
    }
  });

  test('Setiap slot konten wajib memiliki data lengkap, caption, CTA, dan sitasi sumber', () => {
    const slots = generateContentCalendarSlots('OFFICIAL');

    slots.forEach((slot) => {
      expect(slot.id).toBeDefined();
      expect(slot.title.length).toBeGreaterThan(5);
      expect(slot.brief.length).toBeGreaterThan(10);
      expect(slot.caption.length).toBeGreaterThan(20);
      expect(slot.hashtags.length).toBeGreaterThan(0);
      expect(slot.cta.length).toBeGreaterThan(5);
      expect(slot.platform).toBeDefined();
      expect(slot.format).toBeDefined();

      // Sitasi wajib ke sumber kebenaran produk (KB fact_id & Surat Cinta 99)
      expect(slot.sourceFactId).toBeDefined();
      expect(slot.sourceFactId.startsWith('FACT_')).toBe(true);
      expect(slot.sourceLoveLetterPoint).toBeGreaterThanOrEqual(1);
      expect(slot.sourceLoveLetterPoint).toBeLessThanOrEqual(99);
    });
  });

  test('Mendukung multi-platform yang dapat dikonfigurasi (IG, TikTok, FB, X, YT Shorts)', () => {
    const calendar = createDefaultContentCalendar();
    expect(calendar.activePlatforms).toContain('Instagram');
    expect(calendar.activePlatforms).toContain('TikTok');
    expect(calendar.activePlatforms).toContain('Facebook');
    expect(calendar.activePlatforms).toContain('X');
    expect(calendar.activePlatforms).toContain('YouTube Shorts');

    const platformsUsed = new Set(calendar.slots.map((s) => s.platform));
    expect(platformsUsed.has('Instagram')).toBe(true);
    expect(platformsUsed.has('TikTok')).toBe(true);
    expect(platformsUsed.has('Facebook')).toBe(true);
    expect(platformsUsed.has('X')).toBe(true);
    expect(platformsUsed.has('YouTube Shorts')).toBe(true);
  });

  test('Mendukung dua jalur: Akun Official Proyek dan Akun Sales In-House', () => {
    const officialSlots = generateContentCalendarSlots('OFFICIAL');
    const salesSlots = generateContentCalendarSlots('SALES_IN_HOUSE');

    expect(officialSlots.length).toBe(90);
    expect(salesSlots.length).toBe(90);

    // Jalur sales memiliki format POV personal agen
    const salesSample = salesSlots[0];
    expect(salesSample.title).toContain('[POV Sales]');
    expect(salesSample.caption).toContain('DM saya');
  });

  test('Dapat memperbarui tautan hasil posting (postedUrl) dan status menjadi SUDAH_POSTING', () => {
    const plan = getContentCalendar('proj-the-park-01');
    const targetSlotId = plan.slots[10].id; // Slot hari ke-4
    const testLiveUrl = 'https://instagram.com/p/live_test_thepark_123';

    const updated = updateSlotPosting('proj-the-park-01', targetSlotId, testLiveUrl, 'SUDAH_POSTING');
    expect(updated).not.toBeNull();
    expect(updated!.postedUrl).toBe(testLiveUrl);
    expect(updated!.status).toBe('SUDAH_POSTING');
    expect(updated!.postedAt).toBeDefined();
  });

  test('Mode Demo memotong kalender konten secara server-side ke 8 hari pertama (~25%)', () => {
    const fullCalendar = createDefaultContentCalendar();
    const teaser = applyCalendarTeaser(fullCalendar);

    // 8 hari x 3 slot = 24 slot (dari total 90 slot = 26.6%)
    expect(teaser.slots.length).toBe(24);
    const maxDay = Math.max(...teaser.slots.map((s) => s.dayNumber));
    expect(maxDay).toBeLessThanOrEqual(8);
  });

  test('Ekspor kalender konten bersih 100% dari istilah token internal AI', () => {
    const calendar = createDefaultContentCalendar();
    const rawExportText = JSON.stringify(
      calendar.slots.map((s) => ({
        title: s.title,
        brief: s.brief,
        caption: s.caption,
        hashtags: s.hashtags,
        cta: s.cta,
      }))
    );

    // Guardrail tidak boleh melempar exception
    expect(() => {
      assertNoTokenLeakage(rawExportText, 'Kalender Konten 30 Hari');
    }).not.toThrow();

    FORBIDDEN_EXPORT_TERMS.forEach((term) => {
      expect(rawExportText.toLowerCase().includes(term)).toBe(false);
    });
  });
});
