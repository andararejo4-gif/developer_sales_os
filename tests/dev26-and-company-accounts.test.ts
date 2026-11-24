import { describe, expect, it } from 'bun:test';
import { screenLeadQuality } from '../src/lib/leads/dev26-screening';

describe('DEV-26 AI Lead Quality Screening & Spam Filter', () => {
  it('harus meloloskan calon pembeli berintensi tinggi sebagai HIGH quality', () => {
    const res = screenLeadQuality({
      fullName: 'dr. Hendra Kusuma',
      phoneWa: '+6281234567890',
      domicile: 'Solo Baru',
      source: 'Meta Ads CTWA',
      messageText: 'Halo mas, tertarik rumah Nagoya 2 lantai. Bisa minta pricelist dan simulasi angsuran KPR DP 10%?',
    });

    expect(res.quality).toBe('HIGH');
    expect(res.isSpam).toBe(false);
    expect(res.action).toBe('ACCEPT');
    expect(res.indicators.hasPurchaseIntent).toBe(true);
    expect(res.indicators.isSpamKeywords).toBe(false);
  });

  it('harus mengkarantina lead dengan kata kunci judi slot/pinjol sebagai JUNK', () => {
    const res = screenLeadQuality({
      fullName: 'Promo Slot Gacor Maxwin',
      phoneWa: '085712345678',
      messageText: 'Daftar sekarang bonus depo 100% wd kilat slot zeus maxwin hari ini!',
    });

    expect(res.quality).toBe('JUNK');
    expect(res.isSpam).toBe(true);
    expect(res.action).toBe('QUARANTINE');
    expect(res.indicators.isSpamKeywords).toBe(true);
  });

  it('harus mengkarantina nomor telepon yang tidak valid atau terlalu pendek sebagai JUNK', () => {
    const res = screenLeadQuality({
      fullName: 'Bambang',
      phoneWa: '12345',
      messageText: 'Tanya rumah',
    });

    expect(res.quality).toBe('JUNK');
    expect(res.isSpam).toBe(true);
    expect(res.action).toBe('QUARANTINE');
    expect(res.indicators.isInvalidPhone).toBe(true);
  });

  it('harus mendeteksi teks acak / gibberish sebagai JUNK', () => {
    const res = screenLeadQuality({
      fullName: 'asdfghjklqwerty',
      phoneWa: '081299988877',
      messageText: 'zzzzxxxxccccvvvv',
    });

    expect(res.quality).toBe('JUNK');
    expect(res.isSpam).toBe(true);
    expect(res.action).toBe('QUARANTINE');
    expect(res.indicators.isGibberish).toBe(true);
  });

  it('harus menerima kontak prospek valid tanpa intensi eksplisit sebagai WARM', () => {
    const res = screenLeadQuality({
      fullName: 'Ibu Ratna',
      phoneWa: '081399887766',
      domicile: 'Sukoharjo',
      messageText: 'Selamat sore',
    });

    expect(res.quality).toBe('WARM');
    expect(res.isSpam).toBe(false);
    expect(res.action).toBe('ACCEPT');
  });
});
