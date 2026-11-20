import React, { useState } from 'react';
import { ArrowRight, ExternalLink } from 'lucide-react';

interface StepData {
  number: number;
  title: string;
  badge: string;
  subtitle: string;
  description: string;
  previewHeading: string;
  previewContent: React.ReactNode;
}

export const SixStepsWorkflow: React.FC<{
  onOpenLoveLetter?: () => void;
  onOpenMarketResearch?: () => void;
  onOpenSalesTarget?: () => void;
  onOpenContentCalendar?: () => void;
  onOpenPlaybook?: () => void;
  onOpenDailyRoute?: () => void;
}> = ({
  onOpenLoveLetter,
  onOpenMarketResearch,
  onOpenSalesTarget,
  onOpenContentCalendar,
  onOpenPlaybook,
  onOpenDailyRoute,
}) => {
  const [activeStep, setActiveStep] = useState<number>(1);

  const steps: StepData[] = [
    {
      number: 1,
      title: 'Surat Cinta 99 Keunggulan',
      badge: 'GRATIS',
      subtitle: 'Narasi editorial 99 poin faktual',
      description:
        'Pintu masuk utama untuk setiap developer. Dari brosur, pricelist, dan koordinat diekstraksi 99 poin kurasi nilai proyek bebas janji palsu.',
      previewHeading: 'Cuplikan: 99 Keunggulan The Park Townhouse',
      previewContent: (
        <div className="space-y-3 text-sm">
          <div className="p-3.5 bg-sandstone/40 rounded-md border border-warmborder">
            <span className="text-xs font-mono font-semibold text-terracotta">#01 · Lokasi &amp; Akses</span>
            <p className="font-bold text-espresso mt-1">Koridor Utama Sukoharjo &amp; Solo Baru</p>
            <p className="text-warmmuted mt-1 leading-relaxed text-xs sm:text-sm">
              Terletak di koridor penghubung strategis, memudahkan mobilitas harian menuju pusat belanja, sentra kuliner, dan perkantoran.
            </p>
          </div>
          <div className="p-3.5 bg-sandstone/40 rounded-md border border-warmborder">
            <span className="text-xs font-mono font-semibold text-terracotta">#19 · Desain Spasial</span>
            <p className="font-bold text-espresso mt-1">Bukaan Kaca Floor-to-Ceiling</p>
            <p className="text-warmmuted mt-1 leading-relaxed text-xs sm:text-sm">
              Kaca jendela berukuran besar mengalirkan cahaya alami optimal sepanjang pagi hingga sore.
            </p>
          </div>
          <div className="p-3.5 bg-sandstone/40 rounded-md border border-warmborder">
            <span className="text-xs font-mono font-semibold text-terracotta">#51 · Keamanan Terpadu</span>
            <p className="font-bold text-espresso mt-1">One Gate System &amp; Kabel Bawah Tanah</p>
            <p className="text-warmmuted mt-1 leading-relaxed text-xs sm:text-sm">
              Arus keluar-masuk terpantau satu pintu dengan petugas 24 jam dan utilitas kabel tertanam rapi.
            </p>
          </div>
          {onOpenLoveLetter && (
            <button
              onClick={onOpenLoveLetter}
              className="min-h-[44px] px-3 -ml-3 text-sm font-semibold text-terracotta hover:underline inline-flex items-center gap-1.5 cursor-pointer"
            >
              <span>Buka Dokumen Lengkap 99 Poin</span>
              <ExternalLink className="size-3.5" />
            </button>
          )}
        </div>
      ),
    },
    {
      number: 2,
      title: 'Riset Pasar',
      badge: '500m – 25km',
      subtitle: '5 Persona Pembeli & Peta Kompetitor',
      description:
        'Memetakan profil psikografis target konsumen, fasilitas publik terdekat, dan analisis kompetitor perumahan sekitar radius 500m sampai 25km.',
      previewHeading: 'Cuplikan: Matriks Persona & Fasilitas',
      previewContent: (
        <div className="space-y-3 text-sm">
          <div className="p-3.5 bg-sandstone/40 rounded-md border border-warmborder">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-bold text-espresso">Persona 1: Eksekutif Medis &amp; Bisnis</span>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-olive/10 text-olive font-semibold">
                Tipe Diamond 75/90
              </span>
            </div>
            <p className="text-warmmuted mt-2 text-xs sm:text-sm">
              <strong className="text-espresso">Kebutuhan:</strong> Akses &le;15 menit ke RS Indriati / RSUD Sukoharjo dan privasi one-gate system.
            </p>
            <p className="text-terracotta font-medium mt-1.5 text-xs sm:text-sm">
              Pemicu beli: Fasad modern berwibawa &amp; legalitas SHM pecah per unit.
            </p>
          </div>
          <div className="p-3.5 bg-sandstone/40 rounded-md border border-warmborder">
            <span className="font-bold text-espresso block mb-1.5">Fasilitas Publik Terverifikasi (Radius &le;5 km)</span>
            <ul className="space-y-1 text-warmmuted text-xs sm:text-sm list-disc list-inside">
              <li>RSUD Ir. Soekarno: ~2.1 km (6 menit)</li>
              <li>Alun-Alun Satya Negara: ~3.2 km (8 menit)</li>
              <li>Stasiun Sukoharjo: ~3.8 km (7 menit)</li>
            </ul>
          </div>
          {onOpenMarketResearch && (
            <button
              onClick={onOpenMarketResearch}
              className="min-h-[44px] px-3 -ml-3 text-sm font-semibold text-terracotta hover:underline inline-flex items-center gap-1.5 cursor-pointer"
            >
              <span>Buka Riset Pasar &amp; 5 Persona Lengkap</span>
              <ExternalLink className="size-3.5" />
            </button>
          )}
        </div>
      ),
    },
    {
      number: 3,
      title: 'Target Penjualan',
      badge: 'Sold Out 100%',
      subtitle: 'Skenario Kecepatan Jual 30 Unit',
      description:
        'Menghitung mundur target penyerapan unit per bulan dengan skenario konservatif, realistis, dan optimis hingga seluruh klaster terjual habis.',
      previewHeading: 'Cuplikan: Skenario Penyerapan 30 Unit',
      previewContent: (
        <div className="space-y-3 text-sm">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div className="p-3.5 rounded-md bg-sandstone/40 border border-warmborder">
              <span className="text-[11px] font-mono font-semibold text-warmmuted uppercase">Konservatif</span>
              <p className="font-extrabold text-base text-espresso mt-0.5">2 Unit / Bln</p>
              <span className="text-xs text-warmmuted">Sold out 15 bulan</span>
            </div>
            <div className="p-3.5 rounded-md bg-surface border-2 border-terracotta">
              <span className="text-[11px] font-mono font-semibold text-terracotta uppercase">Realistis</span>
              <p className="font-extrabold text-base text-terracotta mt-0.5">3 Unit / Bln</p>
              <span className="text-xs text-espresso font-medium">Sold out 10 bulan</span>
            </div>
            <div className="p-3.5 rounded-md bg-sandstone/40 border border-warmborder">
              <span className="text-[11px] font-mono font-semibold text-warmmuted uppercase">Optimis</span>
              <p className="font-extrabold text-base text-olive mt-0.5">4 Unit / Bln</p>
              <span className="text-xs text-warmmuted">Sold out 8 bulan</span>
            </div>
          </div>
          <p className="text-xs text-warmmuted">
            Setiap target unit dihitung mundur menjadi kebutuhan prospek terkualifikasi (BANT &ge;7), survei lokasi, dan aktivitas harian SE.
          </p>
          {onOpenSalesTarget && (
            <button
              onClick={onOpenSalesTarget}
              className="min-h-[44px] px-3 -ml-3 text-sm font-semibold text-terracotta hover:underline inline-flex items-center gap-1.5 cursor-pointer"
            >
              <span>Buka Kalkulator Target &amp; Reverse Funnel</span>
              <ExternalLink className="size-3.5" />
            </button>
          )}
        </div>
      ),
    },
    {
      number: 4,
      title: 'Kalender Konten',
      badge: 'Official & Sales',
      subtitle: '1 Bulan Penuh, 3 Slot / Hari',
      description:
        'Menyusun jadwal posting multi-platform (IG, TikTok, FB) dengan pembagian corong TOFU (edukasi), MOFU (tur unit), dan BOFU (promo cicilan/AJB).',
      previewHeading: 'Cuplikan: Jadwal Konten Mingguan',
      previewContent: (
        <div className="space-y-3 text-sm">
          <div className="p-3.5 rounded-md bg-sandstone/40 border border-warmborder">
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="font-mono font-semibold text-espresso">TOFU · 09:00 WIB</span>
              <span className="text-warmmuted">Instagram Reels &amp; TikTok</span>
            </div>
            <p className="font-bold text-espresso mt-1">
              &ldquo;Kenapa Rumah dengan High Ceiling 3.8m Lebih Sejuk?&rdquo;
            </p>
            <p className="text-warmmuted text-xs mt-1">Sumber: Surat Cinta Poin #21 (Sirkulasi Udara).</p>
          </div>
          <div className="p-3.5 rounded-md bg-sandstone/40 border border-warmborder">
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="font-mono font-semibold text-terracotta">MOFU · 13:00 WIB</span>
              <span className="text-warmmuted">Carousel IG &amp; FB Ads</span>
            </div>
            <p className="font-bold text-espresso mt-1">
              &ldquo;Room Tour Tipe Diamond: Inner Courtyard Privat&rdquo;
            </p>
            <p className="text-warmmuted text-xs mt-1">Sumber: Surat Cinta Poin #22 &amp; #28.</p>
          </div>
          <div className="p-3.5 rounded-md bg-sandstone/40 border border-warmborder">
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="font-mono font-semibold text-olive">BOFU · 19:30 WIB</span>
              <span className="text-warmmuted">WA Status &amp; Meta Ad</span>
            </div>
            <p className="font-bold text-espresso mt-1">
              &ldquo;Skema Cash Bertahap 24 Bulan, SHM Sudah Pecah&rdquo;
            </p>
            <p className="text-warmmuted text-xs mt-1">Sumber: Surat Cinta Poin #84 &amp; #90.</p>
          </div>
          {onOpenContentCalendar && (
            <button
              onClick={onOpenContentCalendar}
              className="mt-2 text-xs font-bold text-terracotta hover:underline inline-flex items-center gap-1 cursor-pointer"
            >
              <span>Buka Kalender Konten 30 Hari Lengkap</span>
              <ExternalLink className="size-3" />
            </button>
          )}
        </div>
      ),
    },
    {
      number: 5,
      title: 'Playbook Penjualan',
      badge: 'SE + TL + SM',
      subtitle: 'SOP Harian, BANT, & Konversi',
      description:
        'Panduan taktis untuk seluruh peran tim penjualan: SE bertindak di lapangan, TL Full AI memantau otonom, SM Semi-AI menyetujui strategi.',
      previewHeading: 'Cuplikan: KPI Harian & Aturan 72 Jam',
      previewContent: (
        <div className="space-y-3 text-sm">
          <div className="p-3.5 bg-sandstone/40 rounded-md border border-warmborder">
            <p className="font-bold text-espresso mb-2.5">Target Rutinitas Harian SE</p>
            <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm">
              <div className="p-2.5 bg-surface border border-warmborder rounded">Dial/Call: <strong>30 nomor</strong></div>
              <div className="p-2.5 bg-surface border border-warmborder rounded">Chat WA: <strong>50 pesan</strong></div>
              <div className="p-2.5 bg-surface border border-warmborder rounded">BANT &ge;7: <strong>2 prospek</strong></div>
              <div className="p-2.5 bg-surface border border-warmborder rounded">Survei: <strong>1 visit</strong></div>
            </div>
          </div>
          <div className="p-3.5 rounded-md bg-surface border border-terracotta/50">
            <span className="text-xs font-mono font-semibold text-terracotta uppercase">Aturan 72 Jam (SOP TL AI)</span>
            <p className="text-xs sm:text-sm text-espresso mt-1 leading-relaxed">
              Lead baru yang tidak ditindaklanjuti dalam 72 jam otomatis ditarik dan dialihkan ke SE lain dengan skor responsivitas lebih tinggi.
            </p>
          </div>
          {onOpenPlaybook && (
            <button
              onClick={onOpenPlaybook}
              className="mt-2 text-xs font-bold text-terracotta hover:underline inline-flex items-center gap-1 cursor-pointer"
            >
              <span>Buka Playbook SE, TL, SM Lengkap</span>
              <ExternalLink className="size-3" />
            </button>
          )}
        </div>
      ),
    },
    {
      number: 6,
      title: 'Rute Harian SE',
      badge: 'Canvassing',
      subtitle: 'Jadwal Jam demi Jam di Peta',
      description:
        'Menghasilkan rute kunjungan canvassing, open table talk (OTT), dan pertemuan prospek yang terpetakan logis dari titik proyek.',
      previewHeading: 'Cuplikan: Rute Canvassing Area Sukoharjo',
      previewContent: (
        <div className="space-y-3 text-sm">
          <div className="p-3.5 bg-sandstone/40 rounded-md border border-warmborder">
            <span className="text-xs font-mono font-semibold text-terracotta">08.30 – 10.00 WIB</span>
            <p className="font-bold text-espresso mt-0.5">Zona A: Kompleks Perkantoran Pemkab Sukoharjo</p>
            <p className="text-warmmuted text-xs sm:text-sm mt-1">Distribusi 50 flyer eksklusif &amp; presentasi ke bagian kepegawaian dinas.</p>
          </div>
          <div className="p-3.5 bg-sandstone/40 rounded-md border border-warmborder">
            <span className="text-xs font-mono font-semibold text-terracotta">10.30 – 12.00 WIB</span>
            <p className="font-bold text-espresso mt-0.5">Zona B: Sentra Perbankan &amp; RS Ir. Soekarno</p>
            <p className="text-warmmuted text-xs sm:text-sm mt-1">Follow-up dokter spesialis &amp; pimpinan cabang bank untuk Tipe Diamond.</p>
          </div>
          <div className="p-3.5 bg-sandstone/40 rounded-md border border-warmborder">
            <span className="text-xs font-mono font-semibold text-terracotta">14.00 – 16.30 WIB</span>
            <p className="font-bold text-espresso mt-0.5">Standby Show Unit The Park (Nagoya &amp; Osaka)</p>
            <p className="text-warmmuted text-xs sm:text-sm mt-1">Menerima jadwal survei calon pembeli yang diatur via WhatsApp.</p>
          </div>
          {onOpenDailyRoute && (
            <button
              onClick={onOpenDailyRoute}
              className="mt-2 text-xs font-bold text-terracotta hover:underline inline-flex items-center gap-1 cursor-pointer"
            >
              <span>Buka Peta Rute Harian Kanvasing SE</span>
              <ExternalLink className="size-3" />
            </button>
          )}
        </div>
      ),
    },
  ];

  const currentStep = steps[activeStep - 1];

  return (
    <div className="space-y-8">
      {/* Left-aligned Section Header */}
      <div className="max-w-2xl">
        <p className="text-xs font-mono uppercase tracking-widest text-terracotta font-semibold">
          Alur Kerja 6 Modul
        </p>
        <h2 className="text-section-display font-extrabold text-espresso mt-2">
          Dari dokumen mentah menjadi alur eksekusi harian.
        </h2>
        <p className="text-sm sm:text-base text-warmmuted mt-3 leading-relaxed">
          Output dari satu tahap otomatis menjadi bahan tahap berikutnya. Pilih langkah di bawah untuk melihat cuplikan dokumen riil proyek The Park.
        </p>
      </div>

      {/* Responsive Step Selector: 2 cols on mobile, 3 on tablet, 6 on desktop */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {steps.map((s) => {
          const isSelected = activeStep === s.number;
          return (
            <button
              key={s.number}
              onClick={() => setActiveStep(s.number)}
              className={`min-h-[72px] p-3.5 rounded-md border text-left transition-colors cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? 'bg-espresso text-sandstone border-espresso'
                  : 'bg-surface text-espresso border-warmborder hover:border-espresso/40'
              }`}
            >
              <div className="flex items-center justify-between gap-2 w-full">
                <span
                  className={`text-xs font-mono font-bold ${
                    isSelected ? 'text-terracotta' : 'text-warmmuted'
                  }`}
                >
                  0{s.number}
                </span>
                <span
                  className={`text-[10px] font-mono uppercase truncate ${
                    isSelected ? 'text-sandstone/75' : 'text-warmmuted'
                  }`}
                >
                  {s.badge}
                </span>
              </div>
              <p className="font-bold text-xs sm:text-sm leading-snug mt-2">{s.title}</p>
            </button>
          );
        })}
      </div>

      {/* Split Preview Drawer */}
      <div className="border border-warmborder rounded-lg bg-surface overflow-hidden grid grid-cols-1 lg:grid-cols-12">
        {/* Left Explanation */}
        <div className="lg:col-span-5 p-5 sm:p-7 bg-sandstone/40 border-b lg:border-b-0 lg:border-r border-warmborder flex flex-col justify-between min-w-0">
          <div>
            <span className="text-xs font-mono font-semibold text-terracotta">
              MODUL 0{currentStep.number} · {currentStep.badge}
            </span>
            <h3 className="text-xl font-extrabold text-espresso mt-1.5">
              {currentStep.title}
            </h3>
            <p className="text-xs font-semibold text-warmmuted mt-1">
              {currentStep.subtitle}
            </p>
            <p className="text-sm text-espresso/85 mt-4 leading-relaxed">
              {currentStep.description}
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-warmborder flex items-center justify-between gap-3">
            <span className="text-xs font-mono text-warmmuted">
              {currentStep.number} / 6
            </span>
            {activeStep < 6 ? (
              <button
                onClick={() => setActiveStep((prev) => prev + 1)}
                className="min-h-[44px] px-3 -mr-3 text-sm font-semibold text-espresso hover:text-terracotta inline-flex items-center gap-1.5 cursor-pointer"
              >
                <span>Langkah Berikutnya</span>
                <ArrowRight className="size-4" />
              </button>
            ) : (
              <span className="text-xs font-semibold text-olive">
                Alur Lengkap Siap Eksekusi
              </span>
            )}
          </div>
        </div>

        {/* Right Document Excerpt */}
        <div className="lg:col-span-7 p-5 sm:p-7 min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-4 border-b border-warmborder">
            <p className="text-xs sm:text-sm font-bold text-espresso">
              {currentStep.previewHeading}
            </p>
            <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-olive/10 text-olive">
              Data Terverifikasi
            </span>
          </div>
          {currentStep.previewContent}
        </div>
      </div>
    </div>
  );
};
