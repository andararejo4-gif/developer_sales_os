import { describe, expect, it } from 'bun:test';
import { THE_PARK_99_POINTS } from '../src/lib/love-letter/points-data';
import { validateLoveLetter } from '../src/lib/love-letter/validator';
import { generateLoveLetterDocx } from '../src/lib/love-letter/docx-exporter';
import { generateLoveLetterHtml } from '../src/lib/love-letter/html-exporter';
import { FACTUAL_METRICS } from '../src/components/Hero';

describe('Phase 1 Smoke Test: End-to-End Flow & Acceptance Criteria', () => {
  it('Kriteria 1: Factual counter bar membaca angka aktual (bukan teks karangan)', () => {
    expect(FACTUAL_METRICS.length).toBe(4);
    expect(FACTUAL_METRICS[0].value).toBe('99');
    expect(FACTUAL_METRICS[1].value).toBe('6');
    expect(FACTUAL_METRICS[2].value).toBe('25 km');
    expect(FACTUAL_METRICS[3].value).toBe('30');
  });

  it('Kriteria 2: Surat Cinta The Park memiliki tepat 99 poin editorial dan lolos validasi', () => {
    const result = validateLoveLetter(THE_PARK_99_POINTS);
    expect(result.isValid).toBe(true);
    expect(result.passedCount).toBe(99);
    expect(result.errors.length).toBe(0);
  });

  it('Kriteria 3: Generator DOCX menghasilkan file binary Blob valid', async () => {
    const startTime = Date.now();
    const docxBlob = await generateLoveLetterDocx(
      "The Park Townhouse Sukoharjo",
      "PT Andara Rejo Makmur",
      "Sukoharjo",
      THE_PARK_99_POINTS
    );
    const duration = Date.now() - startTime;
    expect(docxBlob).toBeDefined();
    expect(docxBlob.size).toBeGreaterThan(10000); // Binary DOCX file
    expect(duration).toBeLessThan(5000); // Jauh di bawah batas 5 menit
  });

  it('Kriteria 4: Generator HTML & Print PDF menghasilkan dokumen lengkap 99 poin', () => {
    const html = generateLoveLetterHtml(
      "The Park Townhouse Sukoharjo",
      "PT Andara Rejo Makmur",
      "Sukoharjo",
      THE_PARK_99_POINTS
    );
    expect(html).toContain('SURAT CINTA 99 KEUNGGULAN');
    expect(html).toContain('The Park Townhouse Sukoharjo');
    expect(html).toContain('PT Andara Rejo Makmur');
    expect(html).toContain('#99');
  });
});
