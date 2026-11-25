/**
 * Opt-out UU PDP. Harus permintaan yang jelas: kata "batal"/"berhenti" saja tidak cukup
 * ("besok batal, ganti Minggu" atau "kontrak berhenti Februari" bukan opt-out).
 */
const OPT_OUT =
  /^\s*(stop|berhenti|unsubscribe|unsub)\s*[.!]*\s*$|\b(jangan|tolong jangan|mohon jangan|tidak usah|ga usah|gak usah|nggak usah)\s+(lagi\s+)?(hubungi|menghubungi|chat|wa|whatsapp|kontak|telepon|telpon|kirim pesan)\b[^.?!]{0,25}(lagi|saya)|\bjangan hubungi\b|\b(tidak|gak|ga|nggak) berkenan (dihubungi|menerima)|\bhapus (nomor|no|kontak)\b|\b(berhenti|stop) (kirim|menghubungi|hubungi|chat|wa)\b|\bunsub(scribe)?\b/i;

export function isOptOutMessage(text: string): boolean {
  return OPT_OUT.test(text || '');
}
