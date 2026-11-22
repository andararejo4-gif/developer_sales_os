import { describe, expect, it } from 'bun:test';
import {
  PLAYBOOK_BUYER_PERSONAS,
  PLAYBOOK_PIPELINE_STAGES,
  PLAYBOOK_UNIT_CATALOG,
  evaluatePlaybookBant,
} from '../src/lib/kb/playbook-v1-2-knowledge';
import { detectUnclearLeadParts } from '../server/ai-engine';
import { encryptText, decryptText } from '../server/crypto-util';

describe('Playbook v1.2 Knowledge, BANT 0-12 & Lead Clarity Guardrails', () => {
  it('memiliki 10 tahapan pipeline resmi dan 6 persona pembeli (P1-P6)', () => {
    expect(PLAYBOOK_PIPELINE_STAGES.length).toBe(10);
    expect(Object.keys(PLAYBOOK_BUYER_PERSONAS)).toEqual(['P1', 'P2', 'P3', 'P4', 'P5', 'P6']);
    expect(PLAYBOOK_UNIT_CATALOG[0].priceCashIdr).toBe(650000000);
  });

  it('menghitung rubrik skor BANT 0-12 dan Grade A-D dengan akurat sesuai Playbook Bab 5.2', () => {
    const hot = evaluatePlaybookBant(3, 3, 2, 2);
    expect(hot.total).toBe(10);
    expect(hot.grade).toBe('A');
    expect(hot.isHotGrade).toBe(true);
    expect(hot.isQualifiedProspect).toBe(true);

    const warm = evaluatePlaybookBant(2, 2, 2, 1);
    expect(warm.total).toBe(7);
    expect(warm.grade).toBe('B');
    expect(warm.isQualifiedProspect).toBe(true);
    expect(warm.isHotGrade).toBe(false);

    const cold = evaluatePlaybookBant(1, 1, 2, 1);
    expect(cold.total).toBe(5);
    expect(cold.grade).toBe('C');
    expect(cold.isQualifiedProspect).toBe(false);

    const archive = evaluatePlaybookBant(0, 1, 1, 0);
    expect(archive.total).toBe(2);
    expect(archive.grade).toBe('D');
  });

  it('mendeteksi lead yang tidak jelas dan memberikan alasan serta contoh kalimat yang benar', () => {
    const unclear = detectUnclearLeadParts({
      fullName: 'tes',
      phoneWa: '628123456789',
      domicile: '',
      source: 'WhatsApp Inbound',
      stage: 'NEW',
      personaCode: 'P1',
      unitInterest: 'Nagoya B.02',
      paymentScheme: 'KPR',
      bantB: 1,
      bantA: 1,
      bantN: 1,
      bantT: 1,
      salesNotes: 'info harga',
      seName: 'Raka Pratama',
    });

    expect(unclear.length).toBeGreaterThanOrEqual(3);
    expect(unclear.some((u) => u.field.includes('Nama'))).toBe(true);
    expect(unclear.some((u) => u.field.includes('Domisili'))).toBe(true);
    expect(unclear.some((u) => u.field.includes('Catatan'))).toBe(true);
    for (const item of unclear) {
      expect(item.example.length).toBeGreaterThan(10);
    }
  });

  it('meloloskan lead yang sudah memiliki nama, domisili, dan catatan kebutuhan yang jelas', () => {
    const clear = detectUnclearLeadParts({
      fullName: 'Pak Andi Pratama',
      phoneWa: '628123456789',
      domicile: 'Jombor, Bendosari, Sukoharjo',
      source: 'Iklan Meta CTWA',
      stage: 'NEW',
      personaCode: 'P1',
      unitInterest: 'Nagoya B.02',
      paymentScheme: 'KPR',
      bantB: 2,
      bantA: 3,
      bantN: 3,
      bantT: 2,
      salesNotes: 'Keluarga muda penghasilan Rp18 juta per bulan mencari rumah 3 kamar KPR dan ingin survei Sabtu ini.',
      seName: 'Raka Pratama',
    });

    expect(clear.length).toBe(0);
  });

  it('mengenkripsi dan mendekripsi buffer pesan WA dengan AES-256-GCM secara utuh', () => {
    const original = 'Halo mas, saya tertarik unit Nagoya B.02 Rp650 juta KPR.';
    const enc = encryptText(original);
    expect(enc).not.toContain('Nagoya');
    expect(decryptText(enc)).toBe(original);
  });
});
