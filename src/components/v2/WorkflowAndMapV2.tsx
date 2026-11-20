import React, { useState } from 'react';
import { ExternalLink, Layers } from 'lucide-react';
import { InteractiveMap } from '../InteractiveMap';

interface WorkflowAndMapV2Props {
  onOpenLoveLetter: () => void;
  onOpenMarketResearch: () => void;
  onOpenSalesTarget: () => void;
}

interface StepItemV2 {
  number: number;
  title: string;
  badge: string;
  subtitle: string;
  description: string;
  previewHeading: string;
  renderPreview: () => React.ReactNode;
}

export const WorkflowAndMapV2: React.FC<WorkflowAndMapV2Props> = ({
  onOpenLoveLetter,
  onOpenMarketResearch,
  onOpenSalesTarget,
}) => {
  const [activeStep, setActiveStep] = useState<number>(1);

  const steps: StepItemV2[] = [
    {
      number: 1,
      title: 'Surat Cinta 99 Keunggulan',
      badge: 'GRATIS',
      subtitle: 'Narasi editorial 99 poin faktual',
      description:
        'Pintu masuk utama untuk setiap developer. Dari brosur, pricelist, dan koordinat diekstraksi 99 poin kurasi nilai proyek bebas janji palsu.',
      previewHeading: 'Cuplikan: 99 Keunggulan The Park Townhouse',
      renderPreview: () => (
        <div className="space-y-3 text-sm">
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
            <span className="text-xs font-mono font-semibold text-[#2563EB]">#01 · Lokasi &amp; Akses</span>
            <p className="font-bold text-slate-900 mt-1">Koridor Utama Sukoharjo &amp; Solo Baru</p>
            <p className="text-slate-600 mt-1 leading-relaxed text-xs sm:text-sm">
              Terletak di koridor penghubung strategis, memudahkan mobilitas harian menuju pusat belanja, sentra kuliner, dan perkantoran.
            </p>
          </div>
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
            <span className="text-xs font-mono font-semibold text-[#2563EB]">#19 · Desain Spasial</span>
            <p className="font-bold text-slate-900 mt-1">Bukaan Kaca Floor-to-Ceiling</p>
            <p className="text-slate-600 mt-1 leading-relaxed text-xs sm:text-sm">
              Kaca jendela berukuran besar mengalirkan cahaya alami optimal sepanjang pagi hingga sore.
            </p>
          </div>
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
            <span className="text-xs font-mono font-semibold text-[#2563EB]">#51 · Keamanan Terpadu</span>
            <p className="font-bold text-slate-900 mt-1">One Gate System &amp; Kabel Bawah Tanah</p>
            <p className="text-slate-600 mt-1 leading-relaxed text-xs sm:text-sm">
              Arus keluar-masuk terpantau satu pintu dengan petugas 24 jam dan utilitas kabel tertanam rapi.
            </p>
          </div>
          <button
            onClick={onOpenLoveLetter}
            className="min-h-[44px] px-4 rounded-lg bg-blue-50 text-[#1D4ED8] border border-blue-200 text-sm font-semibold hover:bg-blue-100 transition-colors inline-flex items-center gap-2 cursor-pointer"
          >
            <span>Buka Dokumen Lengkap 99 Poin</span>
            <ExternalLink className="size-4" />
          </button>
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
      renderPreview: () => (
        <div className="space-y-3 text-sm">
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-bold text-slate-900">Persona 1: Eksekutif Medis &amp; Bisnis</span>
              <span className="text-xs font-mono px-2.5 py-0.5 rounded bg-blue-50 text-[#1D4ED8] border border-blue-200 font-semibold">
                Tipe Diamond 75/90
              </span>
            </div>
            <p className="text-slate-600 mt-2 text-xs sm:text-sm">
              <strong className="text-slate-900">Kebutuhan:</strong> Akses &le;15 menit ke RS Indriati / RSUD Sukoharjo dan privasi one-gate system.
            </p>
            <p className="text-[#2563EB] font-medium mt-1.5 text-xs sm:text-sm">
              Pemicu beli: Fasad modern berwibawa &amp; legalitas SHM pecah per unit.
            </p>
          </div>
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
            <span className="font-bold text-slate-900 block mb-1.5">Fasilitas Publik Terverifikasi (Radius &le;5 km)</span>
            <ul className="space-y-1 text-slate-600 text-xs sm:text-sm list-disc list-inside">
              <li>RSUD Ir. Soekarno: ~2.1 km (6 menit)</li>
              <li>Alun-Alun Satya Negara: ~3.2 km (8 menit)</li>
              <li>Stasiun Sukoharjo: ~3.8 km (7 menit)</li>
            </ul>
          </div>
          <button
            onClick={onOpenMarketResearch}
            className="min-h-[44px] px-4 rounded-lg bg-blue-50 text-[#1D4ED8] border border-blue-200 text-sm font-semibold hover:bg-blue-100 transition-colors inline-flex items-center gap-2 cursor-pointer"
          >
            <span>Buka Riset Pasar &amp; 5 Persona Lengkap</span>
            <ExternalLink className="size-4" />
          </button>
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
      renderPreview: () => (
        <div className="space-y-3 text-sm">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-[11px] font-mono font-semibold text-slate-500 uppercase">Konservatif</span>
              <p className="font-extrabold text-base text-slate-900 mt-0.5 tabular-nums">2 Unit / Bln</p>
              <span className="text-xs text-slate-500">Sold out 15 bulan</span>
            </div>
            <div className="p-3.5 rounded-lg bg-blue-50 border-2 border-[#2563EB]">
              <span className="text-[11px] font-mono font-semibold text-[#1D4ED8] uppercase">Realistis</span>
              <p className="font-extrabold text-base text-[#2563EB] mt-0.5 tabular-nums">3 Unit / Bln</p>
              <span className="text-xs text-slate-800 font-medium">Sold out 10 bulan</span>
            </div>
            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-[11px] font-mono font-semibold text-slate-500 uppercase">Optimis</span>
              <p className="font-extrabold text-base text-slate-900 mt-0.5 tabular-nums">4 Unit / Bln</p>
              <span className="text-xs text-slate-500">Sold out 8 bulan</span>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-slate-600">
            Setiap target unit dihitung mundur menjadi kebutuhan prospek terkualifikasi (BANT &ge;7), survei lokasi, dan aktivitas harian SE.
          </p>
          <button
            onClick={onOpenSalesTarget}
            className="min-h-[44px] px-4 rounded-lg bg-blue-50 text-[#1D4ED8] border border-blue-200 text-sm font-semibold hover:bg-blue-100 transition-colors inline-flex items-center gap-2 cursor-pointer"
          >
            <span>Buka Kalkulator Target &amp; Reverse Funnel</span>
            <ExternalLink className="size-4" />
          </button>
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
      renderPreview: () => (
        <div className="space-y-3 text-sm">
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="font-mono font-semibold text-slate-900">TOFU · 09:00 WIB</span>
              <span className="text-slate-500">Instagram Reels &amp; TikTok</span>
            </div>
            <p className="font-bold text-slate-900 mt-1">
              &ldquo;Kenapa Rumah dengan High Ceiling 3.8m Lebih Sejuk?&rdquo;
            </p>
            <p className="text-slate-500 text-xs mt-1">Sumber: Surat Cinta Poin #21 (Sirkulasi Udara).</p>
          </div>
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="font-mono font-semibold text-[#2563EB]">MOFU · 13:00 WIB</span>
              <span className="text-slate-500">Carousel IG &amp; FB Ads</span>
            </div>
            <p className="font-bold text-slate-900 mt-1">
              &ldquo;Room Tour Tipe Diamond: Inner Courtyard Privat&rdquo;
            </p>
            <p className="text-slate-500 text-xs mt-1">Sumber: Surat Cinta Poin #22 &amp; #28.</p>
          </div>
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="font-mono font-semibold text-slate-900">BOFU · 19:30 WIB</span>
              <span className="text-slate-500">WA Status &amp; Meta Ad</span>
            </div>
            <p className="font-bold text-slate-900 mt-1">
              &ldquo;Skema Cash Bertahap 24 Bulan, SHM Sudah Pecah&rdquo;
            </p>
            <p className="text-slate-500 text-xs mt-1">Sumber: Surat Cinta Poin #84 &amp; #90.</p>
          </div>
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
      renderPreview: () => (
        <div className="space-y-3 text-sm">
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
            <p className="font-bold text-slate-900 mb-2.5">Target Rutinitas Harian SE</p>
            <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm">
              <div className="p-2.5 bg-white border border-slate-200 rounded-md">Dial/Call: <strong className="text-[#2563EB]">30 nomor</strong></div>
              <div className="p-2.5 bg-white border border-slate-200 rounded-md">Chat WA: <strong className="text-[#2563EB]">50 pesan</strong></div>
              <div className="p-2.5 bg-white border border-slate-200 rounded-md">BANT &ge;7: <strong className="text-[#2563EB]">2 prospek</strong></div>
              <div className="p-2.5 bg-white border border-slate-200 rounded-md">Survei: <strong className="text-[#2563EB]">1 visit</strong></div>
            </div>
          </div>
          <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
            <span className="text-xs font-mono font-semibold text-[#1D4ED8] uppercase">Aturan 72 Jam (SOP TL AI)</span>
            <p className="text-xs sm:text-sm text-slate-800 mt-1 leading-relaxed">
              Lead baru yang tidak ditindaklanjuti dalam 72 jam otomatis ditarik dan dialihkan ke SE lain dengan skor responsivitas lebih tinggi.
            </p>
          </div>
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
      renderPreview: () => (
        <div className="space-y-3 text-sm">
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
            <span className="text-xs font-mono font-semibold text-[#2563EB]">08.30 – 10.00 WIB</span>
            <p className="font-bold text-slate-900 mt-0.5">Zona A: Kompleks Perkantoran Pemkab Sukoharjo</p>
            <p className="text-slate-600 text-xs sm:text-sm mt-1">Distribusi 50 flyer eksklusif &amp; presentasi ke bagian kepegawaian dinas.</p>
          </div>
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
            <span className="text-xs font-mono font-semibold text-[#2563EB]">10.30 – 12.00 WIB</span>
            <p className="font-bold text-slate-900 mt-0.5">Zona B: Sentra Perbankan &amp; RS Ir. Soekarno</p>
            <p className="text-slate-600 text-xs sm:text-sm mt-1">Follow-up dokter spesialis &amp; pimpinan cabang bank untuk Tipe Diamond.</p>
          </div>
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
            <span className="text-xs font-mono font-semibold text-[#2563EB]">14.00 – 16.30 WIB</span>
            <p className="font-bold text-slate-900 mt-0.5">Standby Show Unit The Park (Nagoya &amp; Osaka)</p>
            <p className="text-slate-600 text-xs sm:text-sm mt-1">Menerima jadwal survei calon pembeli yang diatur via WhatsApp.</p>
          </div>
        </div>
      ),
    },
  ];

  const currentStep = steps[activeStep - 1];

  return (
    <>
      {/* 3. MASTER-DETAIL STICKY SPLIT: ALUR 6 LANGKAH (#alur-6-langkah) */}
      <section id="alur-6-langkah" className="py-12 sm:py-16 lg:py-20 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-8 sm:mb-10">
            <p className="text-xs font-mono uppercase tracking-widest text-[#2563EB] font-semibold">
              Alur Kerja 6 Modul
            </p>
            <h2 className="text-section-display font-extrabold text-slate-900 mt-2">
              Satu input proyek, enam output penjualan terstruktur.
            </h2>
            <p className="text-sm sm:text-base text-slate-600 mt-2.5 leading-relaxed">
              Pilih tiap langkah di sisi kiri untuk melihat preview dokumen dan otomasi yang dihasilkan sistem.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
            {/* Master List (Sticky on desktop) */}
            <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-2 min-w-0">
              {steps.map((step) => {
                const isActive = activeStep === step.number;
                return (
                  <button
                    key={step.number}
                    onClick={() => setActiveStep(step.number)}
                    className={`w-full min-h-[60px] p-3.5 sm:p-4 rounded-xl border text-left transition-colors cursor-pointer flex items-start gap-3.5 ${
                      isActive
                        ? 'bg-blue-50/70 border-[#2563EB]'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <span
                      className={`size-8 rounded-lg font-mono text-xs font-extrabold grid place-items-center shrink-0 mt-0.5 ${
                        isActive
                          ? 'bg-[#2563EB] text-white'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      0{step.number}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className={`font-bold text-sm sm:text-base ${isActive ? 'text-slate-900' : 'text-slate-800'}`}>
                          {step.title}
                        </span>
                        <span
                          className={`text-[11px] font-mono px-2 py-0.5 rounded font-semibold ${
                            isActive
                              ? 'bg-white text-[#1D4ED8] border border-blue-200'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {step.badge}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 truncate">
                        {step.subtitle}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Detail Preview Panel */}
            <div className="lg:col-span-7 min-w-0 rounded-xl border border-slate-200 bg-white overflow-hidden">
              <div className="px-5 py-4 sm:px-6 sm:py-5 border-b border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <span className="text-[11px] font-mono uppercase tracking-wider text-[#2563EB] font-semibold">
                    Langkah 0{currentStep.number} / 06 · {currentStep.badge}
                  </span>
                  <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 mt-0.5">
                    {currentStep.previewHeading}
                  </h3>
                </div>
                <span className="inline-flex items-center gap-1.5 text-xs font-mono text-slate-500">
                  <Layers className="size-3.5 text-[#2563EB]" />
                  Live Preview
                </span>
              </div>

              <div className="p-5 sm:p-6 space-y-5">
                <p className="text-sm text-slate-600 leading-relaxed">
                  {currentStep.description}
                </p>
                {currentStep.renderPreview()}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. SPATIAL COMMAND FRAME: PETA RADIUS (#peta-demo) */}
      <section id="peta-demo" className="py-12 sm:py-16 lg:py-20 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6">
            <InteractiveMap />
          </div>
        </div>
      </section>
    </>
  );
};
