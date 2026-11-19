// ============================================================================
// THE PARK TOWNHOUSE SUKOHARJO - LANDING PAGE DATA & SIMULATION CALCULATOR
// ============================================================================

import type {
  ProjectWebsiteConfig,
  InstallmentSimulationInput,
  InstallmentSimulationResult,
  WebsiteUnitType,
} from './types';

export function calculateMortgageInstallment(
  input: InstallmentSimulationInput
): InstallmentSimulationResult {
  const { propertyPriceIdr, dpPercent, interestRateAnnualPercent, tenorYears } = input;
  const dpAmountIdr = (propertyPriceIdr * dpPercent) / 100;
  const loanPrincipalIdr = propertyPriceIdr - dpAmountIdr;

  const monthlyRate = interestRateAnnualPercent / 100 / 12;
  const totalMonths = tenorYears * 12;

  let monthlyInstallmentIdr = 0;
  if (monthlyRate > 0) {
    monthlyInstallmentIdr = Math.round(
      (loanPrincipalIdr * (monthlyRate * Math.pow(1 + monthlyRate, totalMonths))) /
        (Math.pow(1 + monthlyRate, totalMonths) - 1)
    );
  } else {
    monthlyInstallmentIdr = Math.round(loanPrincipalIdr / totalMonths);
  }

  return {
    propertyPriceIdr,
    dpAmountIdr,
    loanPrincipalIdr,
    monthlyInstallmentIdr,
    tenorYears,
  };
}

export const THE_PARK_WEBSITE_UNITS: WebsiteUnitType[] = [
  {
    cluster: 'Nagoya',
    name: 'Nagoya Deluxe 2 Lantai',
    typeCode: 'Tipe 75/90',
    buildingAreaM2: 75,
    landAreaM2: 90,
    bedrooms: 3,
    bathrooms: 2,
    carports: 2,
    startingPriceIdr: 850000000,
    keyFeatures: ['Bata Merah Plester Aci', 'Plafon 3.8m Sejuk', 'SHM Pecah Siap Balik Nama', 'Carport 2 Mobil'],
  },
  {
    cluster: 'Osaka',
    name: 'Osaka Premiere 2 Lantai',
    typeCode: 'Tipe 85/100',
    buildingAreaM2: 85,
    landAreaM2: 100,
    bedrooms: 3,
    bathrooms: 2,
    carports: 2,
    startingPriceIdr: 950000000,
    keyFeatures: ['Bukaan Inner Courtyard', 'Balkon Kamar Utama', 'Smart Digital Door Lock', 'Sanitari TOTO'],
  },
  {
    cluster: 'Tokyo',
    name: 'Tokyo Executive Hook 2 Lantai',
    typeCode: 'Tipe 100/120',
    buildingAreaM2: 100,
    landAreaM2: 120,
    bedrooms: 4,
    bathrooms: 3,
    carports: 2,
    startingPriceIdr: 1150000000,
    keyFeatures: ['Posisi Hook Halaman Samping', 'Kamar Tidur Utama Mewah', 'Row Jalan Komplek 7m', 'One Gate System 24 Jam'],
  },
];

export const THE_PARK_WEBSITE_FAQS = [
  {
    question: 'Bagaimana status legalitas tanah dan izin bangunan di The Park Townhouse?',
    answer: 'Seluruh unit telah memiliki Sertifikat Hak Milik (SHM) yang sudah pecah per kavling masing-masing dan Persetujuan Bangunan Gedung (PBG) resmi. Anda dapat langsung memproses Akta Jual Beli (AJB) di hadapan PPAT.',
  },
  {
    question: 'Berapa jarak riil dari komplek menuju pusat fasilitas di Solo Baru?',
    answer: 'The Park Townhouse terletak tepat di koridor Mandan Sukoharjo: hanya 7-8 menit ke RS Indriati Solo Baru, 12 menit ke The Park Mall & Pakuwon Mall Solo Baru, dan 15 menit ke pusat kota Surakarta.',
  },
  {
    question: 'Apakah ada fasilitas cicilan langsung ke pengembang tanpa KPR bank?',
    answer: 'Ya, kami menyediakan opsi Cash Bertahap hingga 24 bulan langsung ke developer tanpa BI checking, di samping skema pelunasan Cash Keras berdiskon dan KPR bank rekanan (BTN, BSI, Mandiri, BCA).',
  },
  {
    question: 'Apakah perumahan bebas dari risiko genangan air atau banjir?',
    answer: 'Lokasi The Park Townhouse berada di kontur tanah matang yang tinggi dengan sistem drainase bawah tanah tertutup terpadu, menjamin kawasan 100% bebas dari risiko genangan air.',
  },
];

export const THE_PARK_DEFAULT_WEBSITE_CONFIG: ProjectWebsiteConfig = {
  projectId: 'proj-the-park-01',
  projectName: 'The Park Townhouse Sukoharjo',
  subdomain: 'thepark',
  siteTitle: 'The Park Townhouse Sukoharjo — Hunian Butik 2 Lantai Mewah',
  heroHeadline: 'Ketenangan Hidup Modern di Koridor Emas Solo Baru',
  heroSubheadline: 'Townhouse butik 2 lantai berprivasi tinggi dengan sertifikat SHM sudah pecah per kavling. Menghadirkan kesejukan alami plafon 3.8 meter hanya 7 menit dari RS Indriati.',
  units: THE_PARK_WEBSITE_UNITS,
  simulationDefaults: {
    defaultDpPercent: 10,
    interestRatePercent: 4.75,
    availableTenors: [5, 10, 15, 20],
    disclaimer: '*Perhitungan simulasi ini bersifat estimasi matematis dan bukan merupakan penawaran pembiayaan yang mengikat. Syarat dan suku bunga aktual ditentukan oleh bank penyalur KPR.',
  },
  faqs: THE_PARK_WEBSITE_FAQS,
  whatsappNumber: '6281234567890',
  whatsappMessage: 'Halo Tim Pemasaran The Park Townhouse, saya tertarik dengan informasi unit dan ingin berkonsultasi mengenai simulasi cicilan serta survei lokasi.',
  publishedUrl: 'https://thepark.developerproperti.giivepro.com',
};

/**
 * Generates clean standalone HTML for single-page export.
 */
export function generateStandaloneHtml(config: ProjectWebsiteConfig): string {
  const unitsHtml = config.units.map((u) => `
    <div style="background:#fff; border:1px solid #D4C3B3; border-radius:18px; padding:24px; box-shadow:0 4px 12px rgba(0,0,0,0.03);">
      <span style="font-size:11px; font-weight:800; color:#C86D51; text-transform:uppercase;">${u.cluster}</span>
      <h3 style="font-size:18px; font-weight:800; color:#3A2E2B; margin:4px 0 8px 0;">${u.name}</h3>
      <p style="font-size:20px; font-weight:900; color:#526E48; margin:0 0 16px 0;">Mulai Rp ${(u.startingPriceIdr / 1000000).toLocaleString('id-ID')} Juta</p>
      <div style="font-size:13px; color:#8C7E72; line-height:1.8;">
        <p>• Luas Bangunan: <strong>${u.buildingAreaM2} m²</strong> | Luas Tanah: <strong>${u.landAreaM2} m²</strong></p>
        <p>• Kamar Tidur: <strong>${u.bedrooms}</strong> | Kamar Mandi: <strong>${u.bathrooms}</strong> | Carport: <strong>${u.carports}</strong></p>
        <p>• ${u.keyFeatures.join(', ')}</p>
      </div>
      <a href="https://wa.me/${config.whatsappNumber}?text=${encodeURIComponent(config.whatsappMessage + ' untuk ' + u.name)}" style="display:block; text-align:center; background:#C86D51; color:#fff; text-decoration:none; padding:12px; border-radius:12px; font-weight:700; font-size:13px; margin-top:16px;">Tanya Unit Ini via WhatsApp &rarr;</a>
    </div>
  `).join('');

  const faqsHtml = config.faqs.map((f) => `
    <div style="background:#fff; border:1px solid #D4C3B3; border-radius:14px; padding:18px; margin-bottom:12px;">
      <h4 style="font-size:14px; font-weight:800; color:#3A2E2B; margin:0 0 8px 0;">${f.question}</h4>
      <p style="font-size:13px; color:#554A43; line-height:1.6; margin:0;">${f.answer}</p>
    </div>
  `).join('');

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${config.siteTitle}</title>
  <meta name="description" content="${config.heroSubheadline}">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background:#FBF9F5; color:#3A2E2B; margin:0; padding:0; }
    .container { max-width: 1080px; margin: 0 auto; padding: 24px; }
    .hero { text-align: center; padding: 60px 20px; background: linear-gradient(180deg, #F5EFEB 0%, #FBF9F5 100%); }
    .btn { display: inline-block; background: #C86D51; color:#fff; padding: 14px 28px; border-radius: 14px; text-decoration:none; font-weight:800; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin: 30px 0; }
  </style>
</head>
<body>
  <header style="padding:16px 24px; background:#fff; border-bottom:1px solid #D4C3B3; display:flex; justify-content:space-between; align-items:center;">
    <div style="font-weight:900; font-size:16px; color:#C86D51;">The Park Townhouse</div>
    <a href="https://wa.me/${config.whatsappNumber}" style="background:#3A2E2B; color:#fff; text-decoration:none; padding:8px 16px; border-radius:10px; font-size:12px; font-weight:700;">WhatsApp Official</a>
  </header>

  <div class="hero">
    <span style="font-size:12px; font-weight:800; color:#C86D51; letter-spacing:1px; text-transform:uppercase;">Hunian Eksklusif 30 Unit Butik</span>
    <h1 style="font-size:36px; font-weight:900; color:#3A2E2B; max-width:800px; margin:16px auto;">${config.heroHeadline}</h1>
    <p style="font-size:16px; color:#8C7E72; max-width:680px; margin:0 auto 30px auto; line-height:1.6;">${config.heroSubheadline}</p>
    <a href="https://wa.me/${config.whatsappNumber}?text=${encodeURIComponent(config.whatsappMessage)}" class="btn">Konsultasi Unit & Jadwal Survei &rarr;</a>
  </div>

  <div class="container">
    <h2 style="font-size:24px; font-weight:900; text-align:center; margin-bottom:10px;">Pilihan Unit & Klaster</h2>
    <p style="text-align:center; color:#8C7E72; font-size:13px; margin-bottom:30px;">Arsitektur modern kontemporer dengan spesifikasi material bata merah & SHM pecah</p>
    <div class="grid">${unitsHtml}</div>

    <!-- 99 Keunggulan Highlight -->
    <div style="margin:50px 0; padding:28px; background:#fff; border:1px solid #D4C3B3; border-radius:20px; text-align:center;">
      <span style="font-size:11px; font-weight:800; color:#C86D51; text-transform:uppercase;">Dokumen Resmi Proyek</span>
      <h3 style="font-size:22px; font-weight:900; color:#3A2E2B; margin:8px 0;">99 Keunggulan Otentik &amp; Surat Cinta Proyek</h3>
      <p style="font-size:13px; color:#8C7E72; max-width:640px; margin:0 auto 20px auto; line-height:1.6;">
        Setiap jengkal The Park Townhouse dibangun dengan perhitungan matang: kontur tanah tinggi bebas banjir, legalitas SHM pecah, dan akses ring 1 Sukoharjo - Solo Baru.
      </p>
      <a href="https://${config.subdomain}.developerproperti.giivepro.com" style="display:inline-block; border:1.5px solid #C86D51; color:#C86D51; font-weight:800; font-size:12px; padding:10px 20px; border-radius:12px; text-decoration:none;">Kunjungi Portal Resmi: ${config.subdomain}.developerproperti.giivepro.com &rarr;</a>
    </div>

    <!-- Simulasi Angsuran KPR Bank Rekanan -->
    <div style="background:#fff; border:1px solid #D4C3B3; border-radius:24px; padding:32px; margin:40px 0;">
      <h3 style="font-size:20px; font-weight:900; color:#3A2E2B; margin:0 0 8px 0; text-align:center;">Simulasi Angsuran KPR Bank Rekanan</h3>
      <p style="text-align:center; color:#8C7E72; font-size:12px; margin:0 0 24px 0;">Estimasi perhitungan angsuran anuitas bulanan (BSI, BTN, Mandiri, BCA)</p>
      <div style="text-align:center; padding:20px; background:#FBF9F5; border-radius:16px; border:1px solid #E8DFD8;">
        <span style="font-size:11px; font-weight:800; color:#C86D51; text-transform:uppercase;">Estimasi Angsuran Mulai Dari</span>
        <div style="font-size:32px; font-weight:900; color:#526E48; margin:6px 0;">Rp 5,9 Juta / Bulan*</div>
        <p style="font-size:11px; color:#8C7E72; margin:0; line-height:1.6;">*Catatan: Hasil simulasi merupakan estimasi indikatif dan bukan komitmen kredit final. Keputusan suku bunga dan persetujuan plafon pembiayaan sepenuhnya merupakan wewenang bank rekanan penyedia KPR.</p>
      </div>
    </div>

    <h2 style="font-size:24px; font-weight:900; text-align:center; margin:60px 0 20px 0;">Pertanyaan yang Sering Diajukan (FAQ)</h2>
    <div>${faqsHtml}</div>

    <footer style="margin-top:60px; padding:30px 0; border-top:1px solid #D4C3B3; text-align:center; font-size:12px; color:#8C7E72;">
      <p>© ${new Date().getFullYear()} ${config.projectName}. Seluruh hak cipta dilindungi undang-undang.</p>
    </footer>
  </div>
</body>
</html>`;
}
