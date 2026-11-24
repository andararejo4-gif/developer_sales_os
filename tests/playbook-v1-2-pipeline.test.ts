import { describe, expect, it } from 'bun:test';
import {
  PLAYBOOK_BUYER_PERSONAS,
  PLAYBOOK_PIPELINE_STAGES,
  PLAYBOOK_UNIT_CATALOG,
  evaluatePlaybookBant,
} from '../src/lib/kb/playbook-v1-2-knowledge';
import {
  detectUnclearLeadParts,
  buildNaturalSalutation,
  formatHumanPaymentScheme,
  buildFollowupContextGuidance,
  buildContextualFallbackFollowup,
} from '../server/ai-engine';
import { encryptText, decryptText } from '../server/crypto-util';

describe('Playbook v1.2 Knowledge, BANT 0-12 & Lead Clarity Guardrails', () => {
  it('memiliki 10 tahapan pipeline resmi dan 6 persona pembeli + opsi LAINNYA', () => {
    expect(PLAYBOOK_PIPELINE_STAGES.length).toBe(10);
    expect(Object.keys(PLAYBOOK_BUYER_PERSONAS)).toEqual(['P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'LAINNYA']);
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

  it('menormalisasi sapaan gelar Indonesia dan skema pembayaran agar tidak kaku', () => {
    const doc = buildNaturalSalutation('Dr. Pak Andi Januar S.Pdi Phd', 'P3');
    expect(doc.salutation).toBe('Dokter Andi');

    const pak = buildNaturalSalutation('Pak Hendra Kusuma', 'P2');
    expect(pak.salutation).toBe('Pak Hendra');

    const ibu = buildNaturalSalutation('Ibu Hj. Endang', 'P6');
    expect(ibu.salutation).toBe('Ibu Hj. Endang');

    expect(formatHumanPaymentScheme('CASH_KERAS')).toBe('cash keras');
    expect(formatHumanPaymentScheme('CASH_TEMPO_24')).toContain('24 bulan');
  });

  it('membedakan pesan follow-up Lead Manual (Pasca-Temu) vs Lead WA Inbound (First & Ongoing Turn)', () => {
    const manualInput = {
      fullName: 'Dr. Pak Andi Januar S.Pdi Phd',
      phoneWa: '6287814925892',
      domicile: 'Plupuh, Sragen, Jawa Tengah',
      source: 'Walk-in Marketing Gallery',
      stage: 'NEW',
      personaCode: 'P3' as const,
      unitInterest: 'Osaka A.01 (Koridor Sudirman)',
      paymentScheme: 'CASH_KERAS',
      bantB: 3,
      bantA: 1,
      bantN: 2,
      bantT: 2,
      salesNotes: 'Datang sendiri ke gallery, cari rumah tenang ada ruang kerja di rumah.',
      leadOrigin: 'MANUAL' as const,
      seName: 'Raka Pratama',
    };

    const manualGuidance = buildFollowupContextGuidance(manualInput);
    expect(manualGuidance.trackType).toBe('MANUAL_POST_INTERACTION');
    const manualDraft = buildContextualFallbackFollowup(manualInput);
    expect(manualDraft).toContain('Dokter Andi');
    expect(manualDraft).not.toContain('terima kasih sudah menghubungi');
    expect(manualDraft).not.toContain('CASH_KERAS');

    const waOngoingInput = {
      ...manualInput,
      source: 'WhatsApp Inbound (Baileys)',
      leadOrigin: 'WA_BAILEYS' as const,
      lastSalesMessage: 'Apakah akhir pekan ini Dokter Andi sempat mampir melihat lokasi bersama istri?',
      lastCustomerMessage: 'Kalau hari Minggu jam 10 pagi bisa mas? Sekalian minta simulasi cash kerasnya.',
      interactionCount: 2,
    };

    const waGuidance = buildFollowupContextGuidance(waOngoingInput);
    expect(waGuidance.trackType).toBe('WA_ONGOING_CONVERSATION');
    expect(waGuidance.replyMode).toBe('FOKUS_JAWAB');
    const waDraft = buildContextualFallbackFollowup(waOngoingInput);
    expect(waDraft).not.toContain('terima kasih sudah menghubungi');

    const waShortAckInput = {
      ...waOngoingInput,
      stage: 'APPOINTMENT',
      lastCustomerMessage: 'okedeh terimakasih min jadi tambah ga sabar deh',
    };
    const shortGuidance = buildFollowupContextGuidance(waShortAckInput);
    expect(shortGuidance.replyMode).toBe('RINGKAS');
    const shortDraft = buildContextualFallbackFollowup(waShortAckInput);
    expect(shortDraft.length).toBeLessThan(240);
    expect(shortDraft).not.toContain('•');

    const waFullSpecInput = {
      ...waOngoingInput,
      lastCustomerMessage: 'Bisa jelaskan fasilitas dan spesifikasi bangunannya apa saja?',
    };
    expect(buildFollowupContextGuidance(waFullSpecInput).replyMode).toBe('LENGKAP_TERSTRUKTUR');
  });
});
