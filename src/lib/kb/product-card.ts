// Generator Kartu Produk 1 Halaman Siap Cetak/PDF (Fase 1A)

export function generateProductCardHtml(
  projectName = "The Park Townhouse Sukoharjo",
  developerName = "PT Andara Rejo Makmur"
): string {
  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Kartu Produk Resmi — ${projectName}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Plus Jakarta Sans', sans-serif; background-color: #F5F2EB; color: #1C1917; }
    @media print { body { background-color: #ffffff; } .no-print { display: none !important; } }
  </style>
</head>
<body class="p-6 md:p-10 antialiased">
  <div class="max-w-4xl mx-auto bg-white border border-[#E6E0D4] rounded-2xl p-8 shadow-sm">
    <div class="no-print flex justify-between items-center pb-4 mb-6 border-b border-[#E6E0D4]">
      <span class="text-xs font-bold text-[#78716C]">Kartu Produk 1 Halaman &middot; Sumber: Knowledge Base Terverifikasi</span>
      <button onclick="window.print()" class="px-4 py-1.5 rounded-lg bg-[#B45309] text-white text-xs font-bold hover:bg-[#92400E] cursor-pointer">
        Cetak / Simpan PDF
      </button>
    </div>

    <!-- Header -->
    <div class="flex items-start justify-between pb-6 border-b-2 border-[#E6E0D4]">
      <div>
        <span class="text-[10px] font-bold px-2.5 py-0.5 rounded bg-amber-100 text-[#B45309] uppercase tracking-wider">
          Lembar Fakta Resmi
        </span>
        <h1 class="text-2xl font-extrabold text-[#1C1917] mt-1">${projectName}</h1>
        <p class="text-xs text-[#78716C]">${developerName} &middot; Mandan, Sukoharjo, Jawa Tengah</p>
      </div>
      <div class="text-right">
        <span class="text-xs font-bold text-[#3F6212] block">Status Legalitas: SHM Pecah</span>
        <span class="text-[11px] text-[#78716C]">Periode Berlaku s.d. 31 Des 2026</span>
      </div>
    </div>

    <!-- 3 Clusters & Unit Types Grid -->
    <div class="grid grid-cols-3 gap-4 my-6">
      <div class="p-3.5 rounded-xl bg-[#F5F2EB] border border-[#E6E0D4]">
        <span class="text-[10px] font-bold text-[#B45309] block">Cluster 1</span>
        <h3 class="font-bold text-sm text-[#1C1917]">Nagoya (Diamond)</h3>
        <p class="text-xs font-semibold text-[#1C1917] mt-1">LB 75 / LT 90 m² (2 Lantai)</p>
        <p class="text-[11px] text-[#78716C]">3 KT &middot; 2 KM &middot; Inner Garden</p>
        <p class="text-xs font-extrabold text-[#B45309] mt-2">Mulai Rp 830 Jt</p>
      </div>
      <div class="p-3.5 rounded-xl bg-[#F5F2EB] border border-[#E6E0D4]">
        <span class="text-[10px] font-bold text-[#B45309] block">Cluster 2</span>
        <h3 class="font-bold text-sm text-[#1C1917]">Osaka (Gold)</h3>
        <p class="text-xs font-semibold text-[#1C1917] mt-1">LB 60 / LT 72 m² (1 Lantai)</p>
        <p class="text-[11px] text-[#78716C]">2 KT &middot; 1 KM &middot; Carport</p>
        <p class="text-xs font-extrabold text-[#B45309] mt-2">Mulai Rp 670 Jt</p>
      </div>
      <div class="p-3.5 rounded-xl bg-[#F5F2EB] border border-[#E6E0D4]">
        <span class="text-[10px] font-bold text-[#B45309] block">Cluster 3</span>
        <h3 class="font-bold text-sm text-[#1C1917]">Tokyo (Emerald)</h3>
        <p class="text-xs font-semibold text-[#1C1917] mt-1">LB 50 / LT 60 m² (1 Lantai)</p>
        <p class="text-[11px] text-[#78716C]">2 KT &middot; 1 KM &middot; Compact Luxury</p>
        <p class="text-xs font-extrabold text-[#B45309] mt-2">Mulai Rp 580 Jt</p>
      </div>
    </div>

    <!-- Spesifikasi Utama & Fasilitas -->
    <div class="grid grid-cols-2 gap-4 pb-6 border-b border-[#E6E0D4] text-xs">
      <div>
        <h4 class="font-bold text-[#1C1917] mb-2 uppercase text-[11px] text-[#78716C]">Spesifikasi Bangunan</h4>
        <ul class="space-y-1.5 text-[#44403C]">
          <li><strong>Pondasi:</strong> Batu belah &amp; beton bertulang SNI</li>
          <li><strong>Dinding:</strong> Bata merah ganda plester aci</li>
          <li><strong>Lantai:</strong> Homogeneous tile 60x60 motif marmer</li>
          <li><strong>Plafon:</strong> High ceiling 3,8 meter</li>
          <li><strong>Listrik/Air:</strong> PLN 2.200 VA underground &amp; sumur bor</li>
        </ul>
      </div>
      <div>
        <h4 class="font-bold text-[#1C1917] mb-2 uppercase text-[11px] text-[#78716C]">Fasilitas Kawasan &amp; Keamanan</h4>
        <ul class="space-y-1.5 text-[#44403C]">
          <li><strong>Keamanan:</strong> One gate system, security 24 jam &amp; CCTV</li>
          <li><strong>Kabel:</strong> Underground utilities bebas kabel udara</li>
          <li><strong>Taman:</strong> Zen garden tematik &amp; children play area</li>
          <li><strong>Jalan:</strong> Paving block K-300 lebar nyaman</li>
          <li><strong>Legalitas:</strong> SHM pecah per kavling &amp; PBG resmi</li>
        </ul>
      </div>
    </div>

    <!-- Jawaban Singkat Keberatan Konsumen (FAQ Ringkas) -->
    <div class="my-6">
      <h4 class="font-bold text-[#1C1917] text-xs uppercase text-[#78716C] mb-3">Jawaban Cepat Keberatan Konsumen (Sales Cheat-Sheet)</h4>
      <div class="grid grid-cols-2 gap-3 text-xs">
        <div class="p-3 bg-[#FFFBEB] rounded-xl border border-amber-200">
          <p class="font-bold text-[#B45309]">Keberatan: &ldquo;Apakah bisa cicil tanpa bank?&rdquo;</p>
          <p class="text-[#1C1917] mt-1 text-[11px]">Bisa. Tersedia skema cash tempo 6, 12, hingga 24 bulan langsung ke developer tanpa verifikasi BI checking.</p>
        </div>
        <div class="p-3 bg-[#FFFBEB] rounded-xl border border-amber-200">
          <p class="font-bold text-[#B45309]">Keberatan: &ldquo;Apakah sertifikat sudah aman?&rdquo;</p>
          <p class="text-[#1C1917] mt-1 text-[11px]">Sangat aman. SHM sudah pecah per kavling, bukan sertifikat induk, siap langsung AJB dan balik nama di notaris.</p>
        </div>
      </div>
    </div>

    <!-- Footer Card -->
    <div class="pt-4 border-t border-[#E6E0D4] flex justify-between items-center text-[10px] text-[#78716C]">
      <span>Dokumen internal resmi sales &middot; Dikeluarkan oleh Developer Sales OS</span>
      <span>WhatsApp Layanan Konsumen: 0812-3456-7890</span>
    </div>
  </div>
</body>
</html>`;
}
