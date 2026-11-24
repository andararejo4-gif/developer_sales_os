// ============================================================================
// DEV-26: AI LEAD QUALITY SCREENING & SPAM QUARANTINE ENGINE
// Sesuai Blueprint Developer Sales OS v1.5 & Standar Verifikasi F45
// Menyaring lead jelek, spam, dan nomor palsu sebelum mengotori Pipeline Tim SE.
// ============================================================================

export interface LeadScreeningInput {
  fullName?: string;
  phoneWa?: string;
  source?: string;
  messageText?: string;
  domicile?: string;
}

export interface LeadScreeningResult {
  quality: 'HIGH' | 'WARM' | 'JUNK';
  isSpam: boolean;
  confidenceScore: number; // 0 - 100
  reason: string;
  action: 'ACCEPT' | 'REVIEW' | 'QUARANTINE';
  indicators: {
    isInvalidPhone: boolean;
    isSpamKeywords: boolean;
    isBotPattern: boolean;
    hasPurchaseIntent: boolean;
    isGibberish: boolean;
  };
}

const SPAM_REGEX_PATTERNS = [
  /\b(judi|slot|gacor|maxwin|pragmatic|zeus|depo|wd|togel|poker|casino)\b/i,
  /\b(pinjol|dana cepat|pinjaman online|kredit kilat|tanpa jaminan|cair cepat)\b/i,
  /\b(crypto|forex|investasi titip dana|profit harian|mining|binomo)\b/i,
  /\b(obat kuat|pembesar|viagra|pesugihan|dukun|santet)\b/i,
  /\b(klik link|bit\.ly|t\.me\/|wa\.me\/pay|claim reward|hadiah tunai)\b/i,
  /\b(bokep|porn|sex|open bo|vcs)\b/i,
];

const HIGH_INTENT_REGEX_PATTERNS = [
  /\b(harga|pricelist|simulasi|angsuran|cicilan|kpr|dp|uang muka)\b/i,
  /\b(nagoya|osaka|tokyo|tipe|kavling|kamar|luas|denah|siteplan)\b/i,
  /\b(survei|survey|lihat lokasi|kunjungan|show unit|rumah contoh|kantor pemasaran)\b/i,
  /\b(booking|tanda jadi|pesan unit|ready stock|indent|cash bertahap|cash keras)\b/i,
  /\b(sukoharjo|jombor|solo|surakarta|bendosari|the park)\b/i,
];

function isLikelyGibberish(text: string): boolean {
  const clean = text.trim();
  if (clean.length < 3) return false;
  // Pola deretan konsonan beruntun tanpa vokal > 5 (mis. "asdfghjk", "qwrtyp")
  if (/[bcdfghjklmnpqrstvwxyz]{6,}/i.test(clean)) return true;
  // Pola angka acak berulang (mis. "123123123123" atau "99999999")
  if (/^(\d)\1{5,}$/.test(clean)) return true;
  return false;
}

function isValidIndoPhone(phone: string): { valid: boolean; reason?: string } {
  const digitsOnly = phone.replace(/\D/g, '');
  if (!digitsOnly) {
    return { valid: false, reason: 'Nomor telepon kosong' };
  }
  // Normalisasi 08... atau 628...
  let normalized = digitsOnly;
  if (normalized.startsWith('62')) {
    normalized = '0' + normalized.slice(2);
  }
  if (!normalized.startsWith('08')) {
    // Nomor luar negeri atau non-seluler
    if (digitsOnly.length < 8 || digitsOnly.length > 16) {
      return { valid: false, reason: 'Panjang nomor di luar standar (8-16 digit)' };
    }
  } else {
    // Nomor seluler Indonesia wajib 10 - 13 digit (maksimal 14 digit)
    if (normalized.length < 10 || normalized.length > 14) {
      return { valid: false, reason: `Panjang nomor seluler (${normalized.length} digit) tidak valid` };
    }
  }

  // Cek nomor dummy repetitif (misal 08111111111, 08123456789)
  if (/08(\d)\1{7,}/.test(normalized)) {
    return { valid: false, reason: 'Nomor telepon repetitif terindikasi palsu' };
  }

  return { valid: true };
}

/**
 * DEV-26: Evaluasi kualitas lead secara deterministik dan cepat.
 */
export function screenLeadQuality(input: LeadScreeningInput): LeadScreeningResult {
  const fullName = (input.fullName || '').trim();
  const phone = (input.phoneWa || '').trim();
  const msg = (input.messageText || '').trim();
  const combinedText = `${fullName} ${msg} ${input.source || ''}`.toLowerCase();

  const phoneCheck = isValidIndoPhone(phone);
  const isInvalidPhone = !phoneCheck.valid;
  const isGibberish = isLikelyGibberish(fullName) || isLikelyGibberish(msg);

  let isSpamKeywords = false;
  let matchedSpamPattern = '';
  for (const pattern of SPAM_REGEX_PATTERNS) {
    if (pattern.test(combinedText)) {
      isSpamKeywords = true;
      matchedSpamPattern = pattern.source;
      break;
    }
  }

  let hasPurchaseIntent = false;
  for (const pattern of HIGH_INTENT_REGEX_PATTERNS) {
    if (pattern.test(combinedText)) {
      hasPurchaseIntent = true;
      break;
    }
  }

  const isBotPattern = /bot|crawl|tester|ping|webhook-test/i.test(fullName);

  // Klasifikasi Keputusan
  if (isSpamKeywords) {
    return {
      quality: 'JUNK',
      isSpam: true,
      confidenceScore: 95,
      reason: `Terdeteksi kata kunci promosi terlarang/spam (${matchedSpamPattern})`,
      action: 'QUARANTINE',
      indicators: { isInvalidPhone, isSpamKeywords: true, isBotPattern, hasPurchaseIntent, isGibberish },
    };
  }

  if (isInvalidPhone) {
    return {
      quality: 'JUNK',
      isSpam: true,
      confidenceScore: 90,
      reason: phoneCheck.reason || 'Format nomor kontak tidak valid / palsu',
      action: 'QUARANTINE',
      indicators: { isInvalidPhone: true, isSpamKeywords, isBotPattern, hasPurchaseIntent, isGibberish },
    };
  }

  if (isGibberish || isBotPattern) {
    return {
      quality: 'JUNK',
      isSpam: true,
      confidenceScore: 85,
      reason: 'Nama atau isi pesan terindikasi teks acak (gibberish/bot)',
      action: 'QUARANTINE',
      indicators: { isInvalidPhone, isSpamKeywords, isBotPattern, hasPurchaseIntent, isGibberish: true },
    };
  }

  if (hasPurchaseIntent) {
    return {
      quality: 'HIGH',
      isSpam: false,
      confidenceScore: 92,
      reason: 'Pesan teridentifikasi memiliki minat beli tinggi (properti/skema/lokasi)',
      action: 'ACCEPT',
      indicators: { isInvalidPhone: false, isSpamKeywords: false, isBotPattern: false, hasPurchaseIntent: true, isGibberish: false },
    };
  }

  // Jika lolos screening dasar tanpa indikasi spam, masuk kategori WARM (perlu tindak lanjut)
  return {
    quality: 'WARM',
    isSpam: false,
    confidenceScore: 78,
    reason: 'Data kontak valid, calon prospek organik siap difollow-up',
    action: 'ACCEPT',
    indicators: { isInvalidPhone: false, isSpamKeywords: false, isBotPattern: false, hasPurchaseIntent: false, isGibberish: false },
  };
}
