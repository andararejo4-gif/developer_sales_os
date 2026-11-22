import crypto from 'node:crypto';

const DEFAULT_SECRET = 'andara-sales-os-wa-isolation-key-2026-prod';

function getKey(): Buffer {
  const secret = process.env.WA_ENCRYPTION_SECRET || DEFAULT_SECRET;
  return crypto.createHash('sha256').update(secret).digest();
}

/**
 * Enkripsi AES-256-GCM untuk kredensial Baileys & buffer pesan sementara per SE
 */
export function encryptText(plainText: string): string {
  const iv = crypto.randomBytes(12);
  const key = getKey();
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('base64')}.${tag.toString('base64')}.${encrypted.toString('base64')}`;
}

export function decryptText(cipherPayload: string): string {
  const parts = cipherPayload.split('.');
  if (parts.length !== 3) throw new Error('Format payload terenkripsi tidak valid');
  const [ivB64, tagB64, dataB64] = parts;
  const key = getKey();
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(ivB64, 'base64'));
  decipher.setAuthTag(Buffer.from(tagB64, 'base64'));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(dataB64, 'base64')),
    decipher.final(),
  ]);
  return decrypted.toString('utf8');
}
