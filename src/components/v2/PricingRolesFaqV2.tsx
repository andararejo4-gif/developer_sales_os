import React, { useState } from 'react';
import { ArrowRight, Check, ChevronDown, Minus } from 'lucide-react';
import { PLANS_CONFIG, getPlanDisplayPrice } from '../../lib/plans/plans-config';

interface PricingRolesFaqV2Props {
  onOpenWizard: () => void;
}

const COMPARISON_ROWS = [
  { name: 'Surat Cinta 99 Keunggulan', gold: 'Gratis Semua', plat: 'Gratis Semua', diam: 'Gratis Semua' },
  { name: 'Riset Pasar Radius 500m - 25km', gold: 'Tingkat Dasar', plat: 'Lengkap', diam: 'Lengkap + Berkala' },
  { name: 'Target Penjualan s.d. Sold Out', gold: true, plat: true, diam: true },
  { name: 'Website Landing Page Per Proyek', gold: 'Template Standar', plat: 'Kustom Section', diam: 'Kustom Penuh + Domain' },
  { name: 'Kalender Konten Akun Official', gold: '1 Bulan', plat: '1 Bulan + Hashtag', diam: 'Jadwal + Pengingat' },
  { name: 'Kalender Konten Sales In-House', gold: false, plat: 'Add-on', diam: 'Termasuk' },
  { name: 'Playbook Sales Executive & Rute', gold: true, plat: true, diam: true },
  { name: 'Peran AI: Team Leader (TL)', gold: 'Dokumen Manual', plat: 'TL Full AI', diam: 'TL Full AI' },
  { name: 'Peran AI: Sales Manager (SM)', gold: 'Dokumen Manual', plat: 'Dokumen Manual', diam: 'SM Semi-AI (Manusia Setuju)' },
  { name: 'CRM & Pipeline Penjualan', gold: 'Dasar', plat: 'Penuh + KPI Harian', diam: 'Penuh + Dasbor Eksekutif' },
  { name: 'Batas Proyek Aktif', gold: '1 Proyek', plat: '3 Proyek', diam: 'Tak Terbatas' },
  { name: 'Batas Akun Sales In-House', gold: '5 User', plat: '20 User', diam: 'Tak Terbatas' },
  { name: 'Tingkat Layanan Dukungan', gold: 'Email', plat: 'Prioritas', diam: 'Pendamping Khusus' },
];

const AI_ROLES = [
  {
    key: 'se',
    code: '01 / COPILOT',
    title: 'Sales Executive (SE)',
    mode: 'Manusia Dibantu AI',
    highlight: false,
    summary:
      'Interaksi hangat tetap dipegang manusia: telepon, chat WhatsApp personal, canvassing, open table talk, dan pendampingan survei lokasi.',
    points: [
      'Draf balasan cepat merujuk langsung pada 99 Keunggulan.',
      'Rute canvassing harian tersusun otomatis per jam.',
      'Input laporan harian sebelum 18.00 WIB via voice-to-text.',
    ],
    availability: 'Tersedia di semua paket (Gold, Platinum, Diamond)',
  },
  {
    key: 'tl',
    code: '02 / OTONOM 24/7',
    title: 'Team Leader (TL)',
    mode: 'TL Full AI',
    highlight: true,
    summary:
      'AI menjalankan pengawasan teknis secara objektif: kualifikasi BANT, pembagian lead adil, evaluasi respon ≤5 menit, dan penegakan aturan 72 jam.',
    points: [
      'Lead tanpa tindak lanjut >72 jam otomatis dialihkan ke SE lain.',
      'Audit scorecard mingguan berbasis data tanpa bias.',
      'Direksi dan SM tetap dapat memantau seluruh log audit TL.',
    ],
    availability: 'Tersedia di paket Platinum & Diamond',
  },
  {
    key: 'sm',
    code: '03 / APPROVAL',
    title: 'Sales Manager (SM)',
    mode: 'SM Semi-AI',
    highlight: false,
    summary:
      'AI menyiapkan analisis dan draf strategi penawaran, namun keputusan final tetap membutuhkan persetujuan eksplisit manusia.',
    points: [
      'Rekomendasi penyesuaian promo klaster berbasis serapan unit.',
      'Setiap keputusan tercatat permanen di log persetujuan.',
      'Angka harga tanah dan bangunan tidak bisa diubah AI.',
    ],
    availability: 'Tersedia penuh di paket Diamond',
  },
];

const FAQS = [
  {
    q: 'Mengapa Surat Cinta 99 Keunggulan digratiskan untuk semua developer?',
    a: 'Surat Cinta 99 Keunggulan adalah pintu pembuktian kualitas sistem kami. Setiap pengembang dapat melihat langsung bagaimana katalog dan koordinat mentah diubah menjadi 99 poin narasi faktual tanpa komitmen finansial di awal.',
  },
  {
    q: 'Bagaimana sistem menjamin isolasi dan keamanan data multi-tenant?',
    a: 'Setiap developer mendapatkan partisi tenant_id independen dengan pembatasan ketat di tingkat query dan pengujian isolasi otomatis. Pengembang A tidak dapat membaca proyek, unit, prospek, atau dokumen Pengembang B.',
  },
  {
    q: 'Apakah AI dapat mengubah data harga tanah atau bangunan secara sepihak?',
    a: 'Tidak. Guardrail sistem melarang AI mengubah atau menginterpolasi nominal harga unit. Seluruh angka harga diekstraksi apa adanya dari pricelist resmi dan wajib melalui layar Periksa & Koreksi oleh manusia.',
  },
  {
    q: 'Bagaimana cara kerja prinsip TL Full AI dan SM Semi-AI?',
    a: 'Team Leader (TL) berjalan otonom untuk menegakkan SOP teknis seperti audit respon ≤5 menit, pembagian lead, dan penarikan prospek mangkrak 72 jam. Sales Manager (SM) bersifat Semi-AI: sistem menyusun rekomendasi strategi, namun manusia wajib meninjau dan menyetujui.',
  },
  {
    q: 'Format dokumen apa saja yang dapat diunduh?',
    a: 'Seluruh artefak (Surat Cinta 99 Keunggulan, Riset Pasar, Target Penjualan, Kalender Konten, dan Playbook) dapat diekspor ke Microsoft Word (DOCX), PDF siap cetak, dan HTML mandiri.',
  },
];

export const PricingRolesFaqV2: React.FC<PricingRolesFaqV2Props> = ({ onOpenWizard }) => {
  const [activeTab, setActiveTab] = useState<'cards' | 'matrix'>('cards');
  const [selectedRoleKey, setSelectedRoleKey] = useState<string>('tl');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const renderCell = (val: string | boolean) => {
    if (val === true) return <Check className="size-4 text-[#2563EB] mx-auto" />;
    if (val === false) return <Minus className="size-4 text-slate-300 mx-auto" />;
    return <span className="text-xs font-medium text-slate-700">{val}</span>;
  };

  return (
    <>
      {/* 5. PRICING & DYNAMIC FEATURE MATRIX (#paket-harga) */}
      <section id="paket-harga" className="py-12 sm:py-16 lg:py-20 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8 sm:mb-10">
            <div className="max-w-2xl">
              <p className="text-xs font-mono uppercase tracking-widest text-[#2563EB] font-semibold">
                Skala &amp; Kapasitas
              </p>
              <h2 className="text-section-display font-extrabold text-slate-900 mt-2">
                Pilih kapasitas mesin penjualan proyek Anda.
              </h2>
              <p className="text-sm sm:text-base text-slate-600 mt-2 leading-relaxed">
                Seluruh paket membuka Surat Cinta 99 Keunggulan gratis di awal. Fitur dikontrol dinamis sesuai skala tim developer.
              </p>
            </div>

            <div className="inline-flex self-start p-1 bg-slate-100 rounded-lg border border-slate-200">
              <button
                onClick={() => setActiveTab('cards')}
                className={`min-h-[44px] px-4 rounded-md text-xs sm:text-sm font-semibold transition-colors cursor-pointer ${
                  activeTab === 'cards' ? 'bg-[#2563EB] text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Ringkasan Paket
              </button>
              <button
                onClick={() => setActiveTab('matrix')}
                className={`min-h-[44px] px-4 rounded-md text-xs sm:text-sm font-semibold transition-colors cursor-pointer ${
                  activeTab === 'matrix' ? 'bg-[#2563EB] text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Matriks Fitur
              </button>
            </div>
          </div>

          {activeTab === 'cards' ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-6">
              {PLANS_CONFIG.map((plan) => {
                const isPopular = plan.badge === 'Paling Populer';
                return (
                  <div
                    key={plan.id}
                    className={`rounded-xl p-6 sm:p-7 flex flex-col justify-between bg-white border ${
                      isPopular ? 'border-[#2563EB] border-2 bg-blue-50/20' : 'border-slate-200'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 min-h-[26px]">
                        <h3 className="text-xl font-extrabold text-slate-900">{plan.name}</h3>
                        {plan.badge && (
                          <span className="px-2.5 py-0.5 rounded-md text-[11px] font-mono font-bold bg-blue-50 text-[#1D4ED8] border border-blue-200">
                            {plan.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-xs sm:text-sm text-slate-600 mt-1.5 min-h-[44px] leading-relaxed">
                        {plan.description}
                      </p>
                      <div className="mt-4 pt-4 border-t border-slate-200">
                        <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tabular-nums">
                          {getPlanDisplayPrice(plan)}
                        </span>
                        <p className="text-xs text-slate-500 mt-1">
                          Penyesuaian sesuai jumlah klaster &amp; unit
                        </p>
                      </div>

                      <ul className="mt-5 space-y-2.5 text-sm text-slate-700">
                        <li className="flex items-start gap-2.5 font-medium text-slate-900">
                          <Check className="size-4 text-[#2563EB] shrink-0 mt-0.5" />
                          <span>
                            Maks. {plan.max_active_projects >= 999 ? 'Tak Terbatas' : `${plan.max_active_projects} Proyek Aktif`}
                          </span>
                        </li>
                        <li className="flex items-start gap-2.5 font-medium text-slate-900">
                          <Check className="size-4 text-[#2563EB] shrink-0 mt-0.5" />
                          <span>
                            Maks. {plan.max_sales_users >= 999 ? 'Tak Terbatas' : `${plan.max_sales_users} User Sales`}
                          </span>
                        </li>
                        <li className="flex items-start gap-2.5">
                          <Check className="size-4 text-[#2563EB] shrink-0 mt-0.5" />
                          <span>Surat Cinta 99 Keunggulan (Gratis)</span>
                        </li>
                        <li className="flex items-start gap-2.5">
                          <Check className="size-4 text-[#2563EB] shrink-0 mt-0.5" />
                          <span>Target Penjualan s.d. Sold Out</span>
                        </li>
                        <li className="flex items-start gap-2.5">
                          <Check className="size-4 text-[#2563EB] shrink-0 mt-0.5" />
                          <span>{plan.code === 'gold' ? 'Playbook Manual' : 'Playbook + TL Full AI'}</span>
                        </li>
                        {plan.code === 'diamond' && (
                          <li className="flex items-start gap-2.5 text-[#1D4ED8] font-semibold">
                            <Check className="size-4 text-[#2563EB] shrink-0 mt-0.5" />
                            <span>SM Semi-AI (Persetujuan Manusia)</span>
                          </li>
                        )}
                      </ul>
                    </div>

                    <button
                      onClick={onOpenWizard}
                      className={`mt-6 w-full min-h-[44px] rounded-lg font-semibold text-sm transition-colors cursor-pointer ${
                        isPopular
                          ? 'bg-[#2563EB] text-white hover:bg-[#1D4ED8]'
                          : 'bg-slate-900 text-white hover:bg-slate-800'
                      }`}
                    >
                      Mulai dengan {plan.name}
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-xl border border-slate-200 overflow-hidden bg-white">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[640px]">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-xs font-mono uppercase text-slate-600">
                      <th className="p-4 font-bold text-slate-900">Fitur &amp; Kapasitas</th>
                      <th className="p-4 text-center font-bold text-slate-900">Gold</th>
                      <th className="p-4 text-center font-bold text-[#1D4ED8] bg-blue-50/60">Platinum</th>
                      <th className="p-4 text-center font-bold text-slate-900">Diamond</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-sm">
                    {COMPARISON_ROWS.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/70">
                        <td className="p-4 font-medium text-slate-800">{row.name}</td>
                        <td className="p-4 text-center">{renderCell(row.gold)}</td>
                        <td className="p-4 text-center bg-blue-50/30">{renderCell(row.plat)}</td>
                        <td className="p-4 text-center">{renderCell(row.diam)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 6. AI ROLES EXPLANATION (#peran-ai) — Mobile Role Switcher + Desktop 3-Column Ledger */}
      <section id="peran-ai" className="py-12 sm:py-16 lg:py-20 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-8 sm:mb-10">
            <p className="text-xs font-mono uppercase tracking-widest text-[#2563EB] font-semibold">
              Pembagian Peran Manusia &amp; Sistem
            </p>
            <h2 className="text-section-display font-extrabold text-slate-900 mt-2">
              AI mengotomasi pengawasan, manusia fokus pada closing.
            </h2>
            <p className="text-sm sm:text-base text-slate-600 mt-3 leading-relaxed">
              Kami memisahkan peran secara tegas agar teknologi tidak menggantikan empati saat negosiasi dengan calon pembeli rumah.
            </p>
          </div>

          {/* Mobile/Tablet Role Tabs (hidden on lg+) */}
          <div className="flex lg:hidden gap-2 mb-4 overflow-x-auto pb-1">
            {AI_ROLES.map((r) => (
              <button
                key={r.key}
                onClick={() => setSelectedRoleKey(r.key)}
                className={`min-h-[44px] px-4 rounded-lg text-xs font-semibold shrink-0 cursor-pointer border transition-colors ${
                  selectedRoleKey === r.key
                    ? 'bg-[#2563EB] text-white border-[#2563EB]'
                    : 'bg-white text-slate-700 border-slate-200'
                }`}
              >
                {r.title}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 lg:gap-6">
            {AI_ROLES.map((role) => {
              const isHiddenOnMobile = selectedRoleKey !== role.key;
              return (
                <div
                  key={role.code}
                  className={`${isHiddenOnMobile ? 'hidden lg:flex' : 'flex'} rounded-xl p-6 sm:p-7 flex-col justify-between border ${
                    role.highlight
                      ? 'bg-[#0F172A] text-white border-[#0F172A]'
                      : 'bg-white text-slate-900 border-slate-200'
                  }`}
                >
                  <div>
                    <div className={`flex items-center justify-between gap-2 pb-4 border-b ${
                      role.highlight ? 'border-white/15' : 'border-slate-200'
                    }`}>
                      <span className={`text-[11px] font-mono font-semibold tracking-wider ${
                        role.highlight ? 'text-blue-300' : 'text-[#2563EB]'
                      }`}>
                        {role.code}
                      </span>
                      <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-md ${
                        role.highlight
                          ? 'bg-[#2563EB] text-white'
                          : 'bg-blue-50 text-[#1D4ED8] border border-blue-200'
                      }`}>
                        {role.mode}
                      </span>
                    </div>

                    <h3 className="text-lg sm:text-xl font-extrabold mt-5">{role.title}</h3>
                    <p className={`text-sm mt-2 leading-relaxed ${
                      role.highlight ? 'text-slate-300' : 'text-slate-600'
                    }`}>
                      {role.summary}
                    </p>

                    <ul className="mt-5 space-y-2.5 text-sm">
                      {role.points.map((pt, i) => (
                        <li key={i} className="flex items-start gap-2.5">
                          <Check className={`size-4 shrink-0 mt-0.5 ${
                            role.highlight ? 'text-blue-400' : 'text-[#2563EB]'
                          }`} />
                          <span className={role.highlight ? 'text-slate-200' : 'text-slate-700'}>
                            {pt}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <p className={`mt-6 pt-4 border-t text-xs font-mono ${
                    role.highlight ? 'border-white/15 text-slate-400' : 'border-slate-200 text-slate-500'
                  }`}>
                    {role.availability}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 7. FAQ & CLOSING CTA (#dokumentasi-faq) */}
      <section id="dokumentasi-faq" className="py-12 sm:py-16 lg:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 mb-12 sm:mb-16">
            <div className="lg:col-span-4 min-w-0">
              <p className="text-xs font-mono uppercase tracking-widest text-[#2563EB] font-semibold">
                Pertanyaan Umum
              </p>
              <h2 className="text-section-display font-extrabold text-slate-900 mt-2">
                Transparansi, keamanan &amp; alur kerja.
              </h2>
              <p className="text-sm sm:text-base text-slate-600 mt-3 leading-relaxed">
                Tanpa klaim berlebihan, tanpa hitung mundur buatan, dan tanpa kelangkaan fiktif.
              </p>
            </div>

            <div className="lg:col-span-8 min-w-0 border-t border-slate-200 divide-y divide-slate-200">
              {FAQS.map((faq, idx) => {
                const isOpen = openFaqIndex === idx;
                return (
                  <div key={idx}>
                    <button
                      onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                      aria-expanded={isOpen}
                      className="w-full min-h-[56px] py-4 text-left flex items-center justify-between gap-4 cursor-pointer hover:text-[#2563EB] transition-colors"
                    >
                      <span className="font-bold text-sm sm:text-base text-slate-900 pr-2">
                        {faq.q}
                      </span>
                      <ChevronDown
                        className={`size-4 text-slate-500 shrink-0 transition-transform ${
                          isOpen ? 'rotate-180 text-[#2563EB]' : ''
                        }`}
                      />
                    </button>
                    {isOpen && (
                      <div className="pb-5 pr-6 text-sm text-slate-600 leading-relaxed">
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Closing CTA Banner */}
          <div className="rounded-xl bg-[#0F172A] text-white p-6 sm:p-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6 border border-slate-800">
            <div className="max-w-2xl">
              <span className="text-xs font-mono uppercase tracking-widest text-blue-300 font-semibold">
                Siap diuji pada proyek Anda
              </span>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-white mt-2 leading-tight">
                Buat Surat Cinta 99 Keunggulan proyek perumahan Anda sekarang.
              </h3>
              <p className="text-sm sm:text-base text-slate-300 mt-2">
                Gratis untuk seluruh pengembang. Hasil langsung tampil dalam format editorial siap ekspor.
              </p>
            </div>
            <button
              onClick={onOpenWizard}
              className="min-h-[48px] px-6 rounded-lg bg-[#2563EB] text-white font-semibold text-sm sm:text-base hover:bg-[#1D4ED8] transition-colors cursor-pointer inline-flex items-center justify-center gap-2 shrink-0"
            >
              <span>Mulai Gratis Sekarang</span>
              <ArrowRight className="size-4" />
            </button>
          </div>
        </div>
      </section>

      {/* 8. FOOTER */}
      <footer className="bg-slate-50 text-slate-600 py-10 sm:py-12 border-t border-slate-200 text-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
            <div className="space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="size-8 rounded-lg bg-[#2563EB] text-white grid place-items-center font-extrabold text-xs">
                  GP
                </div>
                <span className="font-extrabold text-base text-slate-900">Developer Sales OS</span>
              </div>
              <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                Platform mesin penjualan dan digitalisasi perumahan multi-tenant oleh <strong className="text-slate-900">giivepro</strong>.
              </p>
              <p className="text-xs text-slate-500 font-mono">
                developerproperti.giivepro.com
              </p>
            </div>

            <div>
              <h4 className="font-mono font-semibold text-slate-900 text-xs uppercase tracking-wider mb-3">
                Produk &amp; Modul
              </h4>
              <ul className="space-y-2 text-xs sm:text-sm">
                <li><a href="#alur-6-langkah" className="hover:text-[#2563EB] transition-colors inline-block py-0.5">Surat Cinta 99 Keunggulan</a></li>
                <li><a href="#peta-demo" className="hover:text-[#2563EB] transition-colors inline-block py-0.5">Riset Pasar Radius 25 km</a></li>
                <li><a href="#alur-6-langkah" className="hover:text-[#2563EB] transition-colors inline-block py-0.5">Target Penjualan Sold Out</a></li>
                <li><a href="#peran-ai" className="hover:text-[#2563EB] transition-colors inline-block py-0.5">Playbook SE, TL AI &amp; SM</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-mono font-semibold text-slate-900 text-xs uppercase tracking-wider mb-3">
                Kebijakan &amp; Keamanan
              </h4>
              <ul className="space-y-2 text-xs sm:text-sm">
                <li><a href="#dokumentasi-faq" className="hover:text-[#2563EB] transition-colors inline-block py-0.5">Privasi Data Tenant</a></li>
                <li><a href="#dokumentasi-faq" className="hover:text-[#2563EB] transition-colors inline-block py-0.5">Standar Isolasi Multi-Tenant</a></li>
                <li><a href="#dokumentasi-faq" className="hover:text-[#2563EB] transition-colors inline-block py-0.5">Guardrail Etika AI</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-mono font-semibold text-slate-900 text-xs uppercase tracking-wider mb-3">
                Kontak
              </h4>
              <div className="space-y-2 text-xs sm:text-sm">
                <p>
                  Email: <a href="mailto:support@giivepro.com" className="text-[#2563EB] hover:underline">support@giivepro.com</a>
                </p>
                <p>
                  Konsultasi: <a href="mailto:halo@giivepro.com" className="text-[#2563EB] hover:underline">halo@giivepro.com</a>
                </p>
                <p className="text-xs text-slate-500 pt-1">
                  Studi Kasus: The Park Townhouse Sukoharjo (PT Andara Rejo Makmur).
                </p>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-slate-500">
            <p>&copy; 2026 Developer Sales OS · giivepro. Seluruh hak cipta dilindungi.</p>
            <p className="font-mono">Multi-Tenant Architecture</p>
          </div>
        </div>
      </footer>
    </>
  );
};
