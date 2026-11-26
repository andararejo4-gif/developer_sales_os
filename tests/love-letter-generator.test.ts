import { describe, expect, it } from 'bun:test';
import { generateGroundedLoveLetter } from '../server/love-letter-generator';

describe('Generator Surat Cinta Hingga 99 Keunggulan (No-Filler, POI Nyata & Anti-Kontaminasi)', () => {
  it('menghasilkan poin 100% faktual khusus PT Graha Padma Internusa Semarang tanpa filler & tanpa kata Sukoharjo/The Park', async () => {
    const result = await generateGroundedLoveLetter({
      developerName: 'PT Graha Padma Internusa',
      projectName: 'Graha Padma Semarang',
      city: 'Kota Semarang',
      province: 'Jawa Tengah',
      facilities:
        'The Club Sports & Function Center (kolam renang utama, fitness center, sauna, 2 lapangan badminton indoor, 2 lapangan tenis indoor, futsal indoor, yoga studio), daCON Dapur Container, Sekolah Nasional Karangturi, Taman Rusa Eco-Green, Underground Utilities, Rumah Pompa Pengendali Banjir, Fly Over Gerbang Utama, Masjid Al-Ikhlas, Keamanan 24 Jam & CCTV Kawasan',
      clusters: [
        { name: 'Cluster Taman Lavender', lat: '-6.974500', lng: '110.363500' },
        { name: 'Cluster Taman Rafflesia', lat: '-6.973611', lng: '110.367500' },
        { name: 'Cluster Taman Anggrek', lat: '-6.972500', lng: '110.363500' },
        { name: 'Cluster Taman Alamanda', lat: '-6.969700', lng: '110.364700' },
        { name: 'Cluster Taman Adenia', lat: '-6.969180', lng: '110.367350' },
      ],
      verifiedUnits: [
        { unit: 'Salvia', tipe: 'CLUSTER TAMAN LAVENDER', lt: 108, lb: 60, keras: 1363400000, tempo24: 1527008000, kpr: 1431570000, status: 'terverifikasi' },
        { unit: 'Phyla', tipe: 'CLUSTER TAMAN RAFFLESIA', lt: 126, lb: 62, keras: 1701100000, tempo24: 1905232000, kpr: 1786155000, status: 'terverifikasi' },
        { unit: 'Maranta', tipe: 'CLUSTER TAMAN ADENIA', lt: 298, lb: 125, keras: 3561700000, tempo24: 3989104000, kpr: 3739785000, status: 'terverifikasi' },
      ],
      extractedText: 'Harga sudah termasuk: PPN, IMB, Biaya AJB/BN.SHGB. T.Lavender = 1300 VA; T.Rafflesia = 2200 VA. Belum termasuk BPHTB 5% & biaya KPR.',
      nearbyPois: [
        { name: 'Bandara Internasional Jenderal Ahmad Yani', category: 'Transportasi', distanceKm: 2.8, driveMinutes: 8 },
        { name: 'Gerbang Tol Krapyak', category: 'Transportasi', distanceKm: 1.9, driveMinutes: 5 },
        { name: 'RS Columbia Asia Semarang', category: 'Kesehatan', distanceKm: 2.3, driveMinutes: 6 },
      ],
      skipExternalLookup: true,
      useAiEditorial: false,
    });

    expect(result.points.length).toBeGreaterThanOrEqual(25);
    expect(result.points.length).toBeLessThanOrEqual(99);
    expect(result.validation.isValid).toBe(true);

    const fullText = result.points.map((p) => `${p.title} ${p.narrative}`).join(' ');
    // Fakta nyata Graha Padma + POI nyata Semarang masuk!
    expect(fullText).toContain('Bandara Internasional Jenderal Ahmad Yani');
    expect(fullText).toContain('RS Columbia Asia Semarang');
    expect(fullText).toContain('Salvia');
    expect(fullText).toContain('Cluster Taman Lavender');
    expect(fullText).toContain('Taman Rusa Eco-Green');
    // Nol kontaminasi proyek lain & nol filler generik!
    expect(/Sukoharjo|Solo Baru|The Park|Nagoya|Osaka|Tokyo|RSUD Ir\. Soekarno/i.test(fullText)).toBe(false);
    expect(/Aspek #|Detail #|\(#\d+\)/i.test(fullText)).toBe(false);
    // Jujur melaporkan gap rekomendasi karena poin < 99
    expect(result.gapRecommendations.length).toBeGreaterThan(0);
  });
});
