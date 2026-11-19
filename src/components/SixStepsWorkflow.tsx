import React, { useState } from 'react';
import { 
  HeartHandshake, 
  MapPin, 
  TrendingUp, 
  CalendarDays, 
  BookOpenCheck, 
  Route, 
  ArrowRight, 
  CheckCircle2, 
  ExternalLink 
} from 'lucide-react';

interface StepData {
  number: number;
  title: string;
  badge: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  previewHeading: string;
  previewContent: React.ReactNode;
}

export const SixStepsWorkflow: React.FC<{ 
  onOpenLoveLetter?: () => void;
  onOpenMarketResearch?: () => void;
  onOpenSalesTarget?: () => void;
  onOpenContentCalendar?: () => void;
}> = ({ onOpenLoveLetter, onOpenMarketResearch, onOpenSalesTarget, onOpenContentCalendar }) => {
  const [activeStep, setActiveStep] = useState<number>(1);

  const steps: StepData[] = [
    {
      number: 1,
      title: "Surat Cinta 99 Keunggulan",
      badge: "GRATIS / Pintu Masuk",
      subtitle: "Narasi editorial 99 poin faktual",
      icon: HeartHandshake,
      description: "Pintu masuk utama untuk setiap developer. Dari brosur, pricelist, dan koordinat diekstraksi tepat 99 poin kurasi nilai kehidupan bebas janji palsu.",
      previewHeading: "Potongan Nyata: Surat Cinta 99 Keunggulan The Park Townhouse Sukoharjo",
      previewContent: (
        <div className="space-y-3 text-xs">
          <div className="p-3 bg-white rounded-xl border border-warmborder">
            <span className="text-[11px] font-bold text-terracotta">#1 Lokasi Strategis &amp; Aksesibilitas</span>
            <p className="font-bold text-espresso text-sm mt-0.5">Koridor Utama Menghubungkan Sukoharjo &amp; Solo Baru</p>
            <p className="text-warmmuted mt-1 leading-relaxed">
              Terletak tepat di koridor penghubung strategis, memungkinkan mobilitas harian menuju pusat perbelanjaan, sentra kuliner, dan perkantoran modern tanpa hambatan transit yang melelahkan.
            </p>
          </div>
          <div className="p-3 bg-white rounded-xl border border-warmborder">
            <span className="text-[11px] font-bold text-terracotta">#19 Desain Spasial Adaptif Tropis</span>
            <p className="font-bold text-espresso text-sm mt-0.5">Bukaan Kaca Floor-to-Ceiling Memaksimalkan Cahaya Alami</p>
            <p className="text-warmmuted mt-1 leading-relaxed">
              Kaca jendela berukuran besar mengalirkan cahaya alami secara optimal sepanjang pagi hingga sore, meminimalkan ketergantungan lampu siang hari.
            </p>
          </div>
          <div className="p-3 bg-white rounded-xl border border-warmborder">
            <span className="text-[11px] font-bold text-terracotta">#51 Keamanan Terpadu</span>
            <p className="font-bold text-espresso text-sm mt-0.5">Sistem Gerbang Tunggal (One Gate System) &amp; Underground Utilities</p>
            <p className="text-warmmuted mt-1 leading-relaxed">
              Seluruh arus keluar-masuk terpantau satu pintu dengan petugas security 24 jam dan kabel listrik tertanam rapi di bawah tanah.
            </p>
          </div>
          {onOpenLoveLetter && (
            <button
              onClick={onOpenLoveLetter}
              className="mt-2 text-xs font-bold text-terracotta hover:underline inline-flex items-center gap-1 cursor-pointer"
            >
              <span>Buka Dokumen Lengkap 99 Poin</span>
              <ExternalLink className="size-3" />
            </button>
          )}
        </div>
      )
    },
    {
      number: 2,
      title: "Riset Pasar",
      badge: "Radius 500m - 25km",
      subtitle: "5 Persona Pembeli & Peta Kompetitor",
      icon: MapPin,
      description: "Memetakan profil psikografis target konsumen, fasilitas publik terdekat, dan analisis kompetitor perumahan sekitar radius 500m sampai 25km.",
      previewHeading: "Potongan Nyata: Matriks Persona & Fasilitas The Park Sukoharjo",
      previewContent: (
        <div className="space-y-3 text-xs">
          <div className="p-3 bg-white rounded-xl border border-warmborder">
            <div className="flex items-center justify-between">
              <span className="font-bold text-espresso">Persona 1: Eksekutif Medis &amp; Bisnis Solo Baru</span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-lime-100 text-olive">Tipe Diamond 75/90</span>
            </div>
            <p className="text-warmmuted mt-1">
              <strong>Kebutuhan:</strong> Akses cepat &le;15 menit ke RS Indriati / RSUD Sukoharjo, lingkungan hening untuk istirahat, dan privasi one-gate system.
            </p>
            <p className="text-terracotta font-medium mt-1">Pemicu Beli: Desain fasad modern berwibawa &amp; legalitas SHM pecah per unit.</p>
          </div>
          <div className="p-3 bg-white rounded-xl border border-warmborder">
            <div className="flex items-center justify-between">
              <span className="font-bold text-espresso">Fasilitas Publik Terverifikasi (Radius &le;5 km)</span>
              <span className="text-[10px] font-semibold text-warmmuted">Jarak Riil</span>
            </div>
            <ul className="mt-1 space-y-1 text-warmmuted list-disc list-inside">
              <li>RSUD Ir. Soekarno: sekitar 2.1 km (6 menit)</li>
              <li>Alun-Alun Satya Negara: sekitar 3.2 km (8 menit)</li>
              <li>Stasiun Sukoharjo: sekitar 3.8 km (7 menit)</li>
            </ul>
          </div>
          {onOpenMarketResearch && (
            <button
              onClick={onOpenMarketResearch}
              className="mt-2 text-xs font-bold text-terracotta hover:underline inline-flex items-center gap-1 cursor-pointer"
            >
              <span>Buka Riset Pasar &amp; 5 Persona Lengkap</span>
              <ExternalLink className="size-3" />
            </button>
          )}
        </div>
      )
    },
    {
      number: 3,
      title: "Target Penjualan",
      badge: "s.d. Sold Out 100%",
      subtitle: "Skenario Kecepatan Jual 30 Unit",
      icon: TrendingUp,
      description: "Menghitung mundur target penyerapan 30 unit per bulan dengan skenario konservatif, realistis, dan optimis hingga sold out tuntas.",
      previewHeading: "Potongan Nyata: Skenario Penyerapan 30 Unit The Park Sukoharjo",
      previewContent: (
        <div className="space-y-2.5 text-xs">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2.5 rounded-xl bg-white border border-warmborder">
              <span className="text-[10px] font-bold text-warmmuted uppercase">Konservatif</span>
              <p className="font-extrabold text-sm text-espresso mt-0.5">2 Unit / Bln</p>
              <span className="text-[10px] text-warmmuted">Sold Out 15 Bulan</span>
            </div>
            <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200">
              <span className="text-[10px] font-bold text-terracotta uppercase">Realistis</span>
              <p className="font-extrabold text-sm text-terracotta mt-0.5">3 Unit / Bln</p>
              <span className="text-[10px] text-espresso font-semibold">Sold Out 10 Bulan</span>
            </div>
            <div className="p-2.5 rounded-xl bg-white border border-warmborder">
              <span className="text-[10px] font-bold text-warmmuted uppercase">Optimis</span>
              <p className="font-extrabold text-sm text-olive mt-0.5">4 Unit / Bln</p>
              <span className="text-[10px] text-warmmuted">Sold Out 8 Bulan</span>
            </div>
          </div>
          <p className="text-[11px] text-warmmuted italic">
            *Setiap target unit dihitung mundur menjadi kebutuhan prospek terkualifikasi (BANT &ge;7), kunjungan survei, dan volume aktivitas harian SE.
          </p>
          {onOpenSalesTarget && (
            <button
              onClick={onOpenSalesTarget}
              className="mt-2 text-xs font-bold text-terracotta hover:underline inline-flex items-center gap-1 cursor-pointer"
            >
              <span>Buka Kalkulator Target &amp; Reverse Funnel</span>
              <ExternalLink className="size-3" />
            </button>
          )}
        </div>
      )
    },
    {
      number: 4,
      title: "Kalender Konten",
      badge: "Akun Official & Sales",
      subtitle: "1 Bulan Penuh, 3 Slot / Hari",
      icon: CalendarDays,
      description: "Menyusun jadwal posting multi-platform (IG, TikTok, FB) dengan pembagian corong TOFU (edukasi), MOFU (tur unit), dan BOFU (promo cicilan/AJB).",
      previewHeading: "Potongan Nyata: Kalender Konten Mingguan The Park Sukoharjo",
      previewContent: (
        <div className="space-y-2.5 text-xs">
          <div className="p-2.5 rounded-xl bg-white border border-warmborder">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">TOFU · 09:00 WIB</span>
              <span className="text-[10px] text-warmmuted">Instagram Reels &amp; TikTok</span>
            </div>
            <p className="font-bold text-espresso mt-1">Brief: &ldquo;Kenapa Rumah dengan High Ceiling 3.8m Lebih Dingin di Solo?&rdquo;</p>
            <p className="text-warmmuted text-[11px] mt-0.5">Tautan Sumber: Surat Cinta Poin #21 (Sirkulasi Hawa Dingin).</p>
          </div>
          <div className="p-2.5 rounded-xl bg-white border border-warmborder">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-terracotta">MOFU · 13:00 WIB</span>
              <span className="text-[10px] text-warmmuted">Carousel IG &amp; FB Ads</span>
            </div>
            <p className="font-bold text-espresso mt-1">Brief: &ldquo;Room Tour Tipe Diamond: Inner Courtyard untuk Kebun Zen Privat&rdquo;</p>
            <p className="text-warmmuted text-[11px] mt-0.5">Tautan Sumber: Surat Cinta Poin #22 &amp; #28.</p>
          </div>
          <div className="p-2.5 rounded-xl bg-white border border-warmborder">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-lime-100 text-olive">BOFU · 19:30 WIB</span>
              <span className="text-[10px] text-warmmuted">WA Status &amp; Meta Ad</span>
            </div>
            <p className="font-bold text-espresso mt-1">Brief: &ldquo;Pilihan Cash Bertahap 24 Bulan Tanpa Bank, SHM Sudah Pecah&rdquo;</p>
            <p className="text-warmmuted text-[11px] mt-0.5">Tautan Sumber: Surat Cinta Poin #84 &amp; #90 (CTA WhatsApp Booking).</p>
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
      )
    },
    {
      number: 5,
      title: "Playbook Penjualan",
      badge: "SE + TL AI + SM Semi-AI",
      subtitle: "SOP Harian, BANT, & Konversi",
      icon: BookOpenCheck,
      description: "Panduan taktis terperinci untuk seluruh peran tim penjualan: SE bertindak di lapangan, TL Full AI memantau otonom, SM Semi-AI menyetujui rekomendasi strategis.",
      previewHeading: "Potongan Nyata: KPI Harian & Aturan 72 Jam Playbook SE",
      previewContent: (
        <div className="space-y-2.5 text-xs">
          <div className="p-3 bg-white rounded-xl border border-warmborder">
            <p className="font-bold text-espresso">Target Rutinitas Harian SE (Berdasarkan Funnel)</p>
            <div className="grid grid-cols-2 gap-2 mt-2 text-[11px]">
              <div className="p-1.5 bg-sandstone rounded">Dial/Call: <strong>30 nomor</strong></div>
              <div className="p-1.5 bg-sandstone rounded">Chat WA: <strong>50 pesan</strong></div>
              <div className="p-1.5 bg-sandstone rounded">Prospek BANT &ge;7: <strong>2 prospek</strong></div>
              <div className="p-1.5 bg-sandstone rounded">Survei Lokasi: <strong>1 visit</strong></div>
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200">
            <span className="text-[10px] font-bold text-terracotta uppercase">Aturan 72 Jam (SOP TL AI)</span>
            <p className="text-[11px] text-espresso mt-0.5">
              Lead baru yang tidak ditindaklanjuti dalam 72 jam otomatis ditarik kembali oleh TL AI dan didistribusikan ke SE lain yang memiliki skor responsivitas lebih tinggi.
            </p>
          </div>
        </div>
      )
    },
    {
      number: 6,
      title: "Rute Harian SE",
      badge: "Canvassing & Mobile PWA",
      subtitle: "Jadwal Jam demi Jam di Peta",
      icon: Route,
      description: "Menghasilkan rute kunjungan canvassing, open table talk (OTT), dan pertemuan prospek yang terpetakan secara logis dari titik proyek.",
      previewHeading: "Potongan Nyata: Rute Canvassing Harian SE Area Sukoharjo",
      previewContent: (
        <div className="space-y-2.5 text-xs">
          <div className="p-3 bg-white rounded-xl border border-warmborder">
            <span className="text-[10px] font-bold text-warmmuted">08.30 &ndash; 10.00 WIB</span>
            <p className="font-bold text-espresso">Zona A: Kompleks Perkantoran Pemkab Sukoharjo</p>
            <p className="text-warmmuted text-[11px]">Distribusi 50 flyer eksklusif &amp; presentasi singkat ke bagian kepegawaian dinas.</p>
          </div>
          <div className="p-3 bg-white rounded-xl border border-warmborder">
            <span className="text-[10px] font-bold text-warmmuted">10.30 &ndash; 12.00 WIB</span>
            <p className="font-bold text-espresso">Zona B: Sentra Perbankan &amp; Rumah Sakit Ir. Soekarno</p>
            <p className="text-warmmuted text-[11px]">Follow-up dokter spesialis &amp; pimpinan cabang bank untuk penawaran Tipe Diamond.</p>
          </div>
          <div className="p-3 bg-white rounded-xl border border-warmborder">
            <span className="text-[10px] font-bold text-warmmuted">14.00 &ndash; 16.30 WIB</span>
            <p className="font-bold text-espresso">Standby Show Unit The Park Sukoharjo (Nagoya &amp; Osaka)</p>
            <p className="text-warmmuted text-[11px]">Menerima jadwal kunjungan calon pembeli yang diatur via WhatsApp.</p>
          </div>
        </div>
      )
    }
  ];

  const currentStep = steps[activeStep - 1];

  return (
    <div className="bg-white border border-warmborder rounded-2xl p-6 md:p-8 shadow-xs">
      <div className="max-w-3xl mb-8">
        <span className="px-2.5 py-0.5 rounded-md bg-amber-50 text-terracotta text-xs font-bold border border-amber-200">
          Alur Inti 6 Langkah
        </span>
        <h3 className="text-2xl md:text-3xl font-extrabold text-espresso mt-2 tracking-tight">
          Dari Dokumen Mentah Jadi Mesin Penjualan Otonom
        </h3>
        <p className="text-xs md:text-sm text-warmmuted mt-1 leading-relaxed">
          Output dari tahap sebelumnya otomatis menjadi input cerdas bagi tahap berikutnya. Klik masing-masing langkah untuk melihat cuplikan dokumen riil The Park Townhouse Sukoharjo.
        </p>
      </div>

      {/* Horizontal Steps Bar */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-2 mb-8">
        {steps.map(s => {
          const Icon = s.icon;
          const isSelected = activeStep === s.number;
          return (
            <button
              key={s.number}
              onClick={() => setActiveStep(s.number)}
              className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? 'bg-espresso text-white border-espresso shadow-md ring-2 ring-terracotta/40'
                  : 'bg-sandstone/60 text-espresso border-warmborder hover:bg-sandstone'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className={`size-6 rounded-lg grid place-items-center text-xs font-bold ${
                    isSelected ? 'bg-terracotta text-white' : 'bg-white text-espresso border border-warmborder'
                  }`}>
                    {s.number}
                  </span>
                  <Icon className={`size-4 ${isSelected ? 'text-amber-400' : 'text-warmmuted'}`} />
                </div>
                <p className={`font-bold text-xs leading-tight ${isSelected ? 'text-white' : 'text-espresso'}`}>
                  {s.title}
                </p>
              </div>
              <span className={`text-[10px] font-semibold mt-2 block truncate ${
                isSelected ? 'text-amber-300' : 'text-warmmuted'
              }`}>
                {s.badge}
              </span>
            </button>
          );
        })}
      </div>

      {/* Active Step Real Document Preview Drawer */}
      <div className="bg-sandstone/50 border border-warmborder rounded-2xl p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="size-7 rounded-lg bg-terracotta text-white font-extrabold text-sm grid place-items-center">
                {currentStep.number}
              </span>
              <h4 className="text-lg font-bold text-espresso">{currentStep.title}</h4>
            </div>
            <p className="text-xs font-semibold text-terracotta mb-3">
              {currentStep.subtitle} &middot; <span className="text-warmmuted">{currentStep.badge}</span>
            </p>
            <p className="text-xs text-warmmuted leading-relaxed">
              {currentStep.description}
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-warmborder flex items-center justify-between">
            <span className="text-[11px] text-warmmuted">
              Langkah {currentStep.number} dari 6
            </span>
            {activeStep < 6 ? (
              <button
                onClick={() => setActiveStep(prev => prev + 1)}
                className="text-xs font-bold text-espresso hover:text-terracotta flex items-center gap-1 cursor-pointer"
              >
                <span>Langkah Berikutnya</span>
                <ArrowRight className="size-3.5" />
              </button>
            ) : (
              <span className="text-xs font-bold text-olive flex items-center gap-1">
                <CheckCircle2 className="size-3.5" /> Alur Lengkap Siap Eksekusi
              </span>
            )}
          </div>
        </div>

        {/* Real Document Excerpt */}
        <div className="lg:col-span-7 bg-white p-5 rounded-xl border border-warmborder shadow-xs">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-warmborder">
            <p className="text-xs font-bold text-espresso">{currentStep.previewHeading}</p>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-lime-100 text-olive">
              Data Terverifikasi
            </span>
          </div>
          {currentStep.previewContent}
        </div>
      </div>
    </div>
  );
};
