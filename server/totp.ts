import crypto from 'node:crypto';

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

export function generateTotpSecret(numBytes = 20): string {
  const bytes = crypto.randomBytes(numBytes);
  let bits = 0;
  let value = 0;
  let output = '';

  for (let i = 0; i < bytes.length; i++) {
    value = (value << 8) | bytes[i];
    bits += 8;
    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }
  return output;
}

function decodeBase32(input: string): Buffer {
  const clean = input.toUpperCase().replace(/[^A-Z2-7]/g, '');
  let bits = 0;
  let value = 0;
  const out: number[] = [];

  for (let i = 0; i < clean.length; i++) {
    const idx = BASE32_ALPHABET.indexOf(clean[i]);
    if (idx === -1) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return Buffer.from(out);
}

export function computeTotpCode(secret: string, counter: number): string {
  const key = decodeBase32(secret);
  const counterBuf = Buffer.alloc(8);
  counterBuf.writeBigUInt64BE(BigInt(counter));
  const hmac = crypto.createHmac('sha1', key).update(counterBuf).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const codeInt =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);
  return String(codeInt % 1_000_000).padStart(6, '0');
}

export function verifyTotpToken(
  secret: string,
  tokenRaw: string,
  lastUsedStep?: number | null,
  windowSteps = 1
): { valid: boolean; matchedStep?: number } {
  const token = tokenRaw.replace(/\s+/g, '');
  if (!/^\d{6}$/.test(token) || !secret) return { valid: false };

  const currentStep = Math.floor(Date.now() / 1000 / 30);
  for (let delta = -windowSteps; delta <= windowSteps; delta++) {
    const step = currentStep + delta;
    if (lastUsedStep !== undefined && lastUsedStep !== null && step <= lastUsedStep) {
      continue;
    }
    const expected = computeTotpCode(secret, step);
    if (crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expected))) {
      return { valid: true, matchedStep: step };
    }
  }
  return { valid: false };
}

export function buildOtpAuthUri(params: {
  email: string;
  secret: string;
  issuer?: string;
}): string {
  const issuer = params.issuer || 'Developer Sales OS';
  const label = encodeURIComponent(`${issuer}:${params.email}`);
  return `otpauth://totp/${label}?secret=${encodeURIComponent(params.secret)}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;
}

export function generateRecoveryCodes(count = 6): { plain: string[]; hashes: string[] } {
  const plain: string[] = [];
  const hashes: string[] = [];
  for (let i = 0; i < count; i++) {
    const raw = crypto.randomBytes(4).toString('hex').toUpperCase();
    const formatted = `${raw.slice(0, 4)}-${raw.slice(4, 8)}`;
    plain.push(formatted);
    hashes.push(crypto.createHash('sha256').update(formatted).digest('hex'));
  }
  return { plain, hashes };
}

export function hashRecoveryCode(code: string): string {
  return crypto
    .createHash('sha256')
    .update(code.trim().toUpperCase())
    .digest('hex');
}
