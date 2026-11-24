import { describe, expect, it } from 'bun:test';
import { DIREKSI_PROJECTS } from '../src/data';
import { analyzeLeadWithAi } from '../server/ai-engine';
import { STANDARD_AIC_RATES, getCostPreview, reserveAic, settleAicReservation } from '../src/lib/aic/meter-engine';
import { getAiActivityGuide } from '../src/lib/field-ops/field-ops-store';

describe('Audit Remediation - Temuan T1: Harmonisasi Metrik Dashboard Direksi', () => {
  it('harus menghitung akumulasi Net Sales dan Omzet secara dinamis tanpa inkonsistensi', () => {
    const totalProjects = DIREKSI_PROJECTS.length;
    expect(totalProjects).toBe(3);

    const totalTargetNetSales = DIREKSI_PROJECTS.reduce((acc, p) => acc + p.targetNetSales, 0);
    const totalAktualNetSales = DIREKSI_PROJECTS.reduce((acc, p) => acc + p.aktualNetSales, 0);
    const netSalesPct = Number(((totalAktualNetSales / totalTargetNetSales) * 100).toFixed(1));

    const totalTargetOmzet = DIREKSI_PROJECTS.reduce((acc, p) => acc + p.targetOmzet, 0);
    const totalAktualOmzet = DIREKSI_PROJECTS.reduce((acc, p) => acc + p.aktualOmzet, 0);
    const omzetPct = Number(((totalAktualOmzet / totalTargetOmzet) * 100).toFixed(1));

    // Nilai target & aktual portofolio harus tepat sesuai data proyek
    expect(totalTargetNetSales).toBe(21);
    expect(totalAktualNetSales).toBe(21);
    expect(netSalesPct).toBe(100.0);

    expect(totalTargetOmzet).toBe(8656000000);
    expect(totalAktualOmzet).toBe(8071500000);
    expect(omzetPct).toBe(93.2);
  });
});

describe('Audit Remediation - Temuan T3: Privasi WhatsApp & UU PDP No. 27/2022', () => {
  it('harus mematikan AI follow-up otomatis jika kontak berstatus opt-out (STOP/REVOKED)', async () => {
    const result = await analyzeLeadWithAi({
      fullName: 'Bpk Hendra Konsumen',
      phoneWa: '6281299990001',
      domicile: 'Solo Baru',
      source: 'WA Inbound',
      stage: 'FOLLOW_UP',
      personaCode: 'P1',
      unitInterest: 'Type 60 Nagoya',
      paymentScheme: 'KPR',
      bantB: 3,
      bantA: 3,
      bantN: 3,
      bantT: 3,
      salesNotes: 'Konsumen membalas STOP tidak mau dihubungi lagi',
      seName: 'Raka Pratama',
      isSuppressed: true,
      waConsent: 'REVOKED',
    });

    expect(result.followup_draft_message).toBe('');
    expect(result.ringkas).toContain('UU PDP No. 27/2022');
    expect(result.model).toBe('PDP-SUPPRESSION-GUARD');
  });

  it('harus menyertakan klausul disclaimer opt-out pada draf pesan awal untuk kepatuhan UU PDP', async () => {
    const result = await analyzeLeadWithAi({
      fullName: 'Ibu Rina Novita',
      phoneWa: '6281234567890',
      domicile: 'Jombor Sukoharjo',
      source: 'Instagram Ads',
      stage: 'LEAD_BARU',
      personaCode: 'P1',
      unitInterest: 'Type 60 Nagoya',
      paymentScheme: 'KPR',
      bantB: 2,
      bantA: 2,
      bantN: 2,
      bantT: 2,
      salesNotes: 'Tanya info rumah 2 lantai',
      seName: 'Raka Pratama',
      interactionCount: 1,
    });

    expect(result.followup_draft_message).toContain('STOP');
    expect(result.followup_draft_message).toContain('UU PDP');
  });
});

describe('Audit Remediation - Temuan T7: AI Credit (AIC) Metering & Hard Budget Cap', () => {
  it('harus memiliki standar tarif AIC baku yang valid', () => {
    expect(STANDARD_AIC_RATES.F100).toBe(5); // AI Guide aktivitas SE
    expect(STANDARD_AIC_RATES.F64).toBe(400); // Playbook generator
    expect(STANDARD_AIC_RATES.F49).toBe(1); // Sales concierge
  });

  it('harus memblokir job bila saldo AIC tidak mencukupi (budget cap)', () => {
    const wallet = {
      id: 'wal-1',
      tenant_id: 'andara_rejo_makmur',
      plan_code: 'platinum' as const,
      total_aic_granted: 5000,
      balance_aic: 10,
      reserved_aic: 0,
      valid_until: new Date().toISOString(),
    };

    const preview = getCostPreview(wallet, 'F12', 'Riset Pasar Lengkap');
    expect(preview.estimatedAic).toBe(500);
    expect(preview.isAffordable).toBe(false);
    expect(preview.limiterNotice).toContain('Saldo AIC tidak mencukupi');

    expect(() => {
      reserveAic(wallet, 'F12', 'GEN_REPORT', 500);
    }).toThrow('INSUFFICIENT_AIC');
  });

  it('harus mencadangkan dan memotong saldo dengan tepat saat saldo mencukupi', () => {
    const wallet = {
      id: 'wal-2',
      tenant_id: 'andara_rejo_makmur',
      plan_code: 'platinum' as const,
      total_aic_granted: 5000,
      balance_aic: 100,
      reserved_aic: 0,
      valid_until: new Date().toISOString(),
    };

    const { wallet: reservedWallet, reservation } = reserveAic(wallet, 'F100', 'SE_ACTIVITY_GUIDE', 5);
    expect(reservedWallet.reserved_aic).toBe(5);

    const { wallet: settledWallet, receipt } = settleAicReservation(reservedWallet, reservation, 120);
    expect(settledWallet.balance_aic).toBe(95);
    expect(settledWallet.reserved_aic).toBe(0);
    expect(receipt.debitedAic).toBe(5);
  });
});

describe('Audit Remediation - Modul M17 F100: AI Activity Copilot Lapangan', () => {
  it('harus menghasilkan panduan eksekusi taktis terstruktur dan skrip pembuka', () => {
    const guideResult = getAiActivityGuide('PENDAMPINGAN_SURVEI_LOKASI', 'platinum', 'The Park Townhouse Sukoharjo');
    expect(guideResult.isUnlocked).toBe(true);
    expect(guideResult.guide.title).toContain('Survei Show Unit');
    expect(guideResult.guide.executionSteps.length).toBeGreaterThanOrEqual(4);
    expect(guideResult.guide.openingScript.length).toBeGreaterThan(20);
    expect(guideResult.guide.objectionHandlers.length).toBeGreaterThanOrEqual(1);
  });
});
