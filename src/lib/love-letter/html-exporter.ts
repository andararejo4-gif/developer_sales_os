// Generator Ekspor HTML & Dokumen Cetak/PDF untuk Surat Cinta 99 Keunggulan
// Memakai layout print-friendly dengan token Warm Terracotta & Sandstone

import { LoveLetterPoint } from './points-data';

export function generateLoveLetterHtml(
  projectName: string,
  developerName: string,
  city: string,
  points: LoveLetterPoint[]
): string {
  // Group by chapter
  const chaptersMap: { [chapter: string]: LoveLetterPoint[] } = {};
  points.forEach((p) => {
    if (!chaptersMap[p.chapter]) chaptersMap[p.chapter] = [];
    chaptersMap[p.chapter].push(p);
  });

  const chaptersHtml = Object.entries(chaptersMap)
    .map(([chapterTitle, chapterPoints]) => `
      <section class="chapter-block mb-10 break-inside-avoid-page">
        <h2 class="text-xl font-bold text-terracotta border-b-2 border-amber-200 pb-2 mb-6">
          ${chapterTitle}
        </h2>
        <div class="grid grid-cols-1 gap-4">
          ${chapterPoints.map(p => `
            <article class="p-4 rounded-xl bg-white border border-[#E6E0D4] shadow-xs">
              <div class="flex items-baseline gap-2 mb-1.5">
                <span class="text-base font-extrabold text-[#B45309] font-mono">#${p.number}</span>
                <h3 class="text-base font-bold text-[#1C1917]">${p.title}</h3>
                <span class="ml-auto text-xs font-semibold px-2 py-0.5 rounded bg-[#F5F2EB] text-[#78716C] border border-[#E6E0D4]">
                  ${p.category}
                </span>
              </div>
              <p class="text-sm text-[#44403C] leading-relaxed pl-7">
                ${p.narrative}
              </p>
            </article>
          `).join('')}
        </div>
      </section>
    `).join('');

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Surat Cinta 99 Keunggulan — ${projectName}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,400;0,600;0,700;0,800;1,400&display=swap" rel="stylesheet">
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body {
      font-family: 'Plus Jakarta Sans', sans-serif;
      background-color: #F5F2EB;
      color: #1C1917;
    }
    @media print {
      body { background-color: #ffffff; }
      .no-print { display: none !important; }
      .page-break { page-break-after: always; }
    }
  </style>
</head>
<body class="p-6 md:p-12 antialiased">
  <div class="max-w-4xl mx-auto">
    <!-- Action Bar (Hidden on print) -->
    <div class="no-print flex items-center justify-between pb-6 mb-8 border-b border-[#E6E0D4]">
      <a href="/" class="text-xs font-bold text-[#78716C] hover:text-[#1C1917] flex items-center gap-1.5">
        &larr; Kembali ke Developer Sales OS
      </a>
      <div class="flex items-center gap-3">
        <button onclick="window.print()" class="px-4 py-2 rounded-xl bg-[#B45309] text-white text-xs font-semibold hover:bg-[#92400E] shadow-sm cursor-pointer">
          Cetak Dokumen / Simpan PDF
        </button>
      </div>
    </div>

    <!-- Document Header -->
    <header class="text-center mb-12">
      <span class="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest bg-amber-100 text-[#B45309] border border-amber-200 mb-3">
        Dokumen Kurasi Resmi Proyek
      </span>
      <h1 class="text-3xl md:text-5xl font-extrabold text-[#1C1917] tracking-tight mb-2">
        SURAT CINTA 99 KEUNGGULAN
      </h1>
      <p class="text-xl md:text-2xl font-bold text-[#B45309] mb-4">
        ${projectName}
      </p>
      <p class="text-xs md:text-sm text-[#78716C] max-w-xl mx-auto">
        Koleksi 99 Keunggulan Nyata &amp; Faktual Berkelanjutan · Dikurasi oleh Tim Rancang Bangun ${developerName} · ${city}
      </p>
    </header>

    <!-- Narrative Preamble -->
    <div class="p-6 rounded-2xl bg-[#1C1917] text-white mb-12 shadow-sm">
      <h2 class="text-sm font-bold uppercase tracking-wider text-amber-400 mb-2">
        Pengantar dari Pengembang
      </h2>
      <p class="text-sm md:text-base text-stone-200 leading-relaxed">
        Setiap hunian yang kami bangun bukan sekadar kompilasi dinding, atap, dan tanah kavling. Ini adalah kanvas tempat memori keluarga Anda dirajut. Di balik setiap sudut <strong>${projectName}</strong>, terdapat dedikasi rancang bangun, presisi material, dan kenyamanan lingkungan yang kami kurasi secara menyeluruh. Dokumen ini merangkum 99 keunggulan nyata—faktual, terukur, dan bebas dari janji berlebihan—sebagai panduan bagi Anda dalam memilih ruang hidup terbaik untuk masa depan keluarga tercinta.
      </p>
    </div>

    <!-- 99 Points Chapters -->
    <main>
      ${chaptersHtml}
    </main>

    <!-- Document Footer -->
    <footer class="mt-16 pt-8 border-t border-[#E6E0D4] text-center text-xs text-[#78716C]">
      <p class="font-bold text-[#1C1917]">${developerName} · ${city}</p>
      <p class="mt-1">Dihasilkan melalui sistem kurasi AI Developer Sales OS (developerproperti.giivepro.com).</p>
      <p class="mt-1">Seluruh data berbasis dokumen legalitas, arsitektur, dan koordinat faktual kawasan.</p>
    </footer>
  </div>
</body>
</html>`;
}
