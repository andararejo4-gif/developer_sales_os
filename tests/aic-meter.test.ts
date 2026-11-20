import { describe, it, expect } from 'bun:test';
import {
  AicWallet,
  getCostPreview,
  reserveAic,
  settleAicReservation,
  refundAicReservation,
  isOperationAllowedWithZeroAic,
  STANDARD_AIC_RATES
} from '../src/lib/aic/meter-engine';

describe('Blueprint v1.2 AIC FinOps Meter Engine', () => {
  const mockWallet: AicWallet = {
    id: 'wallet-001',
    tenant_id: 'tenant-001',
    plan_code: 'gold',
    total_aic_granted: 20000,
    balance_aic: 20000,
    reserved_aic: 0,
    valid_until: '2027-02-20T00:00:00Z'
  };

  it('harus memberikan cost preview yang akurat sesuai standar Blueprint', () => {
    const previewF13 = getCostPreview(mockWallet, 'F13', 'Generator 99 Keunggulan');
    expect(previewF13.estimatedAic).toBe(400);
    expect(previewF13.isAffordable).toBe(true);

    const previewF19 = getCostPreview(mockWallet, 'F19', 'Kalender Konten 30 Hari');
    expect(previewF19.estimatedAic).toBe(450);

    const previewF100 = getCostPreview(mockWallet, 'F100', 'AI Guide per Aktivitas SE', 1);
    expect(previewF100.estimatedAic).toBe(5);
  });

  it('harus mencadangkan (reserve) AIC dengan benar dan mengurangi saldo tersedia', () => {
    const { wallet: reservedWallet, reservation } = reserveAic(mockWallet, 'F13', 'GENERATION', 400);
    expect(reservation.status).toBe('RESERVED');
    expect(reservation.amountAic).toBe(400);
    expect(reservedWallet.balance_aic).toBe(20000);
    expect(reservedWallet.reserved_aic).toBe(400);

    // Saldo tersedia berkurang menjadi 19600
    const previewNext = getCostPreview(reservedWallet, 'F14', 'Surat Cinta', 1);
    expect(previewNext.currentBalance).toBe(19600);
  });

  it('harus menyelesaikan (settle) reservasi dan menerbitkan receipt resmi', () => {
    const { wallet: reservedWallet, reservation } = reserveAic(mockWallet, 'F13', 'GENERATION', 400);
    const { wallet: settledWallet, receipt } = settleAicReservation(reservedWallet, reservation, 1500);

    expect(receipt.debitedAic).toBe(400);
    expect(receipt.tokensUsed).toBe(1500);
    expect(settledWallet.balance_aic).toBe(19600);
    expect(settledWallet.reserved_aic).toBe(0);
  });

  it('harus mengembalikan (refund) reservasi secara utuh bila terjadi kegagalan', () => {
    const { wallet: reservedWallet, reservation } = reserveAic(mockWallet, 'F13', 'GENERATION', 400);
    expect(reservedWallet.reserved_aic).toBe(400);

    const { wallet: refundedWallet, reservation: refundedRes } = refundAicReservation(
      reservedWallet,
      reservation,
      'AI LLM API Timeout'
    );

    expect(refundedRes.status).toBe('REFUNDED');
    expect(refundedWallet.reserved_aic).toBe(0);
    expect(refundedWallet.balance_aic).toBe(20000);
  });

  it('harus menolak reservasi jika saldo tersedia tidak mencukupi', () => {
    const smallWallet: AicWallet = {
      ...mockWallet,
      balance_aic: 100,
      reserved_aic: 0
    };

    expect(() => {
      reserveAic(smallWallet, 'F13', 'GENERATION', 400);
    }).toThrow('INSUFFICIENT_AIC');
  });

  it('harus mengizinkan operasi non-generatif (F97-F99 dan CRM) berjalan saat saldo AIC 0', () => {
    expect(isOperationAllowedWithZeroAic('F97')).toBe(true); // Absensi
    expect(isOperationAllowedWithZeroAic('F98')).toBe(true); // GPS tugas
    expect(isOperationAllowedWithZeroAic('F99')).toBe(true); // Log panggilan
    expect(isOperationAllowedWithZeroAic('F43')).toBe(true); // CRM pipeline
    expect(isOperationAllowedWithZeroAic('F13')).toBe(false); // Generator butuh AIC
  });
});
