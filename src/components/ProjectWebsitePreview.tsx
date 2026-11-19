// ============================================================================
// PROJECT WEBSITE PREVIEW - DEVELOPER SALES OS
// Interactive Landing Page with Installment Simulator & Direct CRM Capture
// ============================================================================

import { useState } from 'react';
import {
  Globe,
  Download,
  Smartphone,
  Monitor,
  X,
  Calculator,
  CheckCircle2,
  Send,
  MessageCircle,
} from 'lucide-react';
import {
  THE_PARK_DEFAULT_WEBSITE_CONFIG,
  calculateMortgageInstallment,
  generateStandaloneHtml,
} from '../lib/website-generator/the-park-landing-data';
import { formatRupiah } from '../lib/sales-target/calculator';
import { LOVE_LETTER_POINTS, type LoveLetterPoint } from '../lib/love-letter/points-data';

interface ProjectWebsitePreviewProps {
  onClose?: () => void;
  onLeadCaptured?: (lead: { name: string; phone: string; unit: string; utmSource: string }) => void;
}

export function ProjectWebsitePreview({
  onClose,
  onLeadCaptured,
}: ProjectWebsitePreviewProps) {
  const [deviceMode, setDeviceMode] = useState<'desktop' | 'mobile'>('desktop');
  const [config] = useState(THE_PARK_DEFAULT_WEBSITE_CONFIG);
  const [selectedUnitIndex, setSelectedUnitIndex] = useState(0);

  // Mortgage Calculator States
  const [selectedPrice, setSelectedPrice] = useState(config.units[0].startingPriceIdr);
  const [dpPercent, setDpPercent] = useState(10);
  const [tenorYears, setTenorYears] = useState(15);
  const interestRate = 4.75;

  // 99 Points explorer filter
  const [activeCategory, setActiveCategory] = useState<string>('all');

  // Lead Form
  const [leadName, setLeadName] = useState('');
  const [leadPhone, setLeadPhone] = useState('');
  const [leadSubmitted, setLeadSubmitted] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const simulation = calculateMortgageInstallment({
    propertyPriceIdr: selectedPrice,
    dpPercent,
    interestRateAnnualPercent: interestRate,
    tenorYears,
  });

  const categories: string[] = Array.from(new Set(LOVE_LETTER_POINTS.map((p: LoveLetterPoint) => p.category)));
  const filteredPoints = activeCategory === 'all'
    ? LOVE_LETTER_POINTS.slice(0, 12)
    : LOVE_LETTER_POINTS.filter((p: LoveLetterPoint) => p.category === activeCategory).slice(0, 12);

  const handleDownloadHtml = () => {
    const htmlContent = generateStandaloneHtml(config);
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `landing-page-${config.subdomain}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setToastMessage('Berkas HTML mandiri berhasil diunduh!');
  };

  const handleLeadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadName || !leadPhone) return;

    if (onLeadCaptured) {
      onLeadCaptured({
        name: leadName,
        phone: leadPhone,
        unit: config.units[selectedUnitIndex].name,
        utmSource: 'Website Landing Page (thepark)',
      });
    }

    setLeadSubmitted(true);
    setToastMessage('Pesan terkirim! Lead baru otomatis tercatat di CRM Proyek.');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-espresso/70 backdrop-blur-sm flex justify-center p-3 md:p-6 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-warmborder w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Top Control Bar */}
        <div className="px-6 py-4 bg-sandstone/60 border-b border-warmborder flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-2xl bg-terracotta text-white flex items-center justify-center shadow-sm">
              <Globe className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-terracotta bg-terracotta/10 px-2 py-0.5 rounded-full border border-terracotta/20">
                  {config.subdomain}.developerproperti.giivepro.com
                </span>
                <span className="text-xs font-bold text-olive bg-lime-100 px-2 py-0.5 rounded-full">
                  Live Preview
                </span>
              </div>
              <p className="text-xs text-warmmuted mt-0.5">
                Landing Page Interaktif Proyek &middot; LCP &lt; 2.5s &middot; Terhubung Otomatis ke CRM
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Device Switcher */}
            <div className="hidden sm:flex p-1 bg-sandstone rounded-xl border border-warmborder mr-2">
              <button
                onClick={() => setDeviceMode('desktop')}
                className={`p-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                  deviceMode === 'desktop' ? 'bg-white text-espresso shadow-sm' : 'text-warmmuted'
                }`}
              >
                <Monitor className="size-3.5" />
                <span>Desktop</span>
              </button>
              <button
                onClick={() => setDeviceMode('mobile')}
                className={`p-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                  deviceMode === 'mobile' ? 'bg-white text-espresso shadow-sm' : 'text-warmmuted'
                }`}
              >
                <Smartphone className="size-3.5" />
                <span>Mobile</span>
              </button>
            </div>

            <button
              onClick={handleDownloadHtml}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-espresso text-white hover:bg-espresso/90 flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
            >
              <Download className="size-3.5 text-amber-400" />
              <span>Unduh HTML Mandiri</span>
            </button>

            {onClose && (
              <button
                onClick={onClose}
                className="size-9 rounded-xl hover:bg-sandstone text-warmmuted hover:text-espresso flex items-center justify-center transition-colors cursor-pointer ml-1"
              >
                <X className="size-5" />
              </button>
            )}
          </div>
        </div>

        {/* Website Frame Canvas */}
        <div className="flex-1 overflow-y-auto bg-[#F4EFEA] p-4 md:p-8 flex justify-center">
          <div
            className={`transition-all duration-300 bg-white rounded-3xl shadow-xl border border-warmborder overflow-hidden ${
              deviceMode === 'mobile' ? 'w-[375px] max-w-full' : 'w-full max-w-5xl'
            }`}
          >
            {/* Website Header */}
            <div className="px-6 py-4 bg-white border-b border-warmborder/80 flex items-center justify-between sticky top-0 z-10 backdrop-blur-md bg-white/95">
              <div className="flex items-center gap-2">
                <span className="size-7 rounded-lg bg-terracotta text-white font-black text-xs grid place-items-center">
                  TP
                </span>
                <span className="font-extrabold text-sm text-espresso">The Park Townhouse</span>
              </div>
              <a
                href={`https://wa.me/${config.whatsappNumber}`}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 rounded-xl bg-terracotta text-white text-xs font-bold hover:bg-terracotta/90 flex items-center gap-1.5 transition-colors"
              >
                <MessageCircle className="size-3.5" />
                <span>WhatsApp</span>
              </a>
            </div>

            {/* Hero Section */}
            <div className="px-6 py-12 md:py-16 text-center bg-gradient-to-b from-sandstone/60 to-white">
              <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-terracotta/10 text-terracotta border border-terracotta/20 uppercase tracking-wider">
                Eksklusif Hanya 30 Unit Butik
              </span>
              <h1 className="text-2xl md:text-4xl font-black text-espresso mt-4 max-w-2xl mx-auto leading-tight">
                {config.heroHeadline}
              </h1>
              <p className="text-xs md:text-sm text-warmmuted mt-3 max-w-xl mx-auto leading-relaxed">
                {config.heroSubheadline}
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <a
                  href="#unit-section"
                  className="px-5 py-2.5 rounded-xl bg-terracotta text-white text-xs font-extrabold hover:bg-terracotta/90 transition-all shadow-md shadow-terracotta/20"
                >
                  Jelajahi Pilihan Unit
                </a>
                <a
                  href="#simulasi-cicilan"
                  className="px-5 py-2.5 rounded-xl bg-white border border-warmborder text-espresso text-xs font-bold hover:bg-sandstone transition-all"
                >
                  Simulasi Cicilan KPR
                </a>
              </div>
            </div>

            {/* Interactive 99 Points Explorer */}
            <div className="p-6 md:p-8 border-t border-warmborder">
              <div className="text-center max-w-xl mx-auto mb-6">
                <span className="text-xs font-bold text-terracotta uppercase">Dokumen Faktual</span>
                <h2 className="text-lg md:text-xl font-extrabold text-espresso mt-0.5">
                  99 Keunggulan Kurasi Nilai Kehidupan
                </h2>
                <p className="text-xs text-warmmuted mt-1">
                  Dikelompokkan berdasarkan kategori spasial, kenyamanan termal, dan kepastian hukum
                </p>
              </div>

              {/* Category Pills */}
              <div className="flex gap-1.5 overflow-x-auto pb-3 mb-4">
                <button
                  onClick={() => setActiveCategory('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    activeCategory === 'all'
                      ? 'bg-espresso text-white'
                      : 'bg-sandstone text-warmmuted hover:text-espresso'
                  }`}
                >
                  Semua ({LOVE_LETTER_POINTS.length})
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                      activeCategory === cat
                        ? 'bg-terracotta text-white'
                        : 'bg-sandstone text-warmmuted hover:text-espresso'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredPoints.map((p) => (
                  <div key={p.number} className="p-3.5 rounded-2xl bg-sandstone/30 border border-warmborder/70 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between text-[10px] font-bold text-terracotta mb-1">
                        <span>#{p.number}</span>
                        <span className="text-warmmuted">{p.category}</span>
                      </div>
                      <h4 className="text-xs font-bold text-espresso leading-snug">{p.title}</h4>
                      <p className="text-[11px] text-warmmuted mt-1 leading-relaxed line-clamp-3">
                        {p.narrative}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Units Showcase */}
            <div id="unit-section" className="p-6 md:p-8 bg-sandstone/30 border-t border-warmborder">
              <div className="text-center max-w-xl mx-auto mb-6">
                <span className="text-xs font-bold text-terracotta uppercase">Klaster Hunian</span>
                <h2 className="text-lg md:text-xl font-extrabold text-espresso mt-0.5">
                  Tipe Unit The Park Townhouse
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {config.units.map((unit, idx) => (
                  <div
                    key={unit.name}
                    className="p-5 rounded-3xl bg-white border border-warmborder shadow-sm flex flex-col justify-between space-y-4"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-terracotta border border-amber-200">
                          {unit.cluster}
                        </span>
                        <span className="text-xs font-bold text-warmmuted">{unit.typeCode}</span>
                      </div>
                      <h3 className="text-base font-extrabold text-espresso mt-1.5">{unit.name}</h3>
                      <p className="text-lg font-black text-olive mt-1">
                        {formatRupiah(unit.startingPriceIdr)}
                      </p>

                      <div className="mt-3 pt-3 border-t border-warmborder/60 text-xs text-warmmuted space-y-1">
                        <p>LT {unit.landAreaM2} m² &middot; LB {unit.buildingAreaM2} m²</p>
                        <p>{unit.bedrooms} KT &middot; {unit.bathrooms} KM &middot; Carport {unit.carports} Mobil</p>
                      </div>

                      <div className="mt-3 space-y-1">
                        {unit.keyFeatures.map((f, i) => (
                          <div key={i} className="flex items-center gap-1.5 text-[11px] text-espresso">
                            <CheckCircle2 className="size-3 text-olive shrink-0" />
                            <span>{f}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedPrice(unit.startingPriceIdr);
                        setSelectedUnitIndex(idx);
                        document.getElementById('simulasi-cicilan')?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="w-full py-2.5 rounded-xl bg-sandstone hover:bg-warmborder text-espresso text-xs font-bold transition-colors cursor-pointer"
                    >
                      Hitung Cicilan Unit Ini &rarr;
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Installment Simulator */}
            <div id="simulasi-cicilan" className="p-6 md:p-8 border-t border-warmborder bg-white">
              <div className="text-center max-w-xl mx-auto mb-6">
                <span className="text-xs font-bold text-terracotta uppercase flex items-center justify-center gap-1">
                  <Calculator className="size-3.5" />
                  Kalkulator Simulasi KPR
                </span>
                <h2 className="text-lg md:text-xl font-extrabold text-espresso mt-0.5">
                  Estimasi Angsuran Bulanan Nyaman
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-sandstone/30 p-6 rounded-3xl border border-warmborder">
                {/* Inputs */}
                <div className="space-y-4 text-xs">
                  <div>
                    <label className="font-bold text-espresso block mb-1">Pilih Harga Properti:</label>
                    <select
                      value={selectedPrice}
                      onChange={(e) => setSelectedPrice(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-warmborder bg-white font-bold text-espresso"
                    >
                      {config.units.map((u) => (
                        <option key={u.name} value={u.startingPriceIdr}>
                          {u.name} — {formatRupiah(u.startingPriceIdr)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <div className="flex justify-between font-bold text-espresso mb-1">
                      <span>Uang Muka (DP): {dpPercent}%</span>
                      <span className="text-olive">{formatRupiah(simulation.dpAmountIdr)}</span>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max="50"
                      step="5"
                      value={dpPercent}
                      onChange={(e) => setDpPercent(Number(e.target.value))}
                      className="w-full accent-terracotta cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-espresso block mb-1">Jangka Waktu (Tenor):</label>
                    <div className="grid grid-cols-4 gap-2">
                      {[5, 10, 15, 20].map((t) => (
                        <button
                          key={t}
                          onClick={() => setTenorYears(t)}
                          className={`py-2 rounded-xl font-bold transition-all cursor-pointer ${
                            tenorYears === t
                              ? 'bg-terracotta text-white shadow-sm'
                              : 'bg-white border border-warmborder text-espresso'
                          }`}
                        >
                          {t} Tahun
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Result Card */}
                <div className="bg-white p-5 rounded-2xl border border-warmborder flex flex-col justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-warmmuted uppercase">Estimasi Cicilan per Bulan</span>
                    <p className="text-2xl md:text-3xl font-black text-terracotta mt-1">
                      {formatRupiah(simulation.monthlyInstallmentIdr)}
                      <span className="text-xs font-semibold text-warmmuted"> / bulan</span>
                    </p>

                    <div className="mt-4 pt-4 border-t border-warmborder/60 text-xs space-y-1 text-warmmuted">
                      <div className="flex justify-between">
                        <span>Pokok Pinjaman:</span>
                        <strong className="text-espresso">{formatRupiah(simulation.loanPrincipalIdr)}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Asumsi Suku Bunga:</span>
                        <strong className="text-espresso">{interestRate}% p.a. fixed</strong>
                      </div>
                    </div>
                  </div>

                  <p className="text-[10px] text-warmmuted mt-4 italic leading-relaxed">
                    {config.simulationDefaults.disclaimer}
                  </p>
                </div>
              </div>
            </div>

            {/* Lead Form & WhatsApp Direct */}
            <div className="p-6 md:p-8 bg-espresso text-white text-center">
              <h3 className="text-xl font-black">Konsultasi Unit &amp; Jadwalkan Kunjungan</h3>
              <p className="text-xs text-white/70 mt-1 max-w-md mx-auto">
                Dapatkan e-brochure lengkap dan pendampingan private tour bersama tim kami
              </p>

              {leadSubmitted ? (
                <div className="mt-6 p-4 rounded-2xl bg-white/10 border border-white/20 max-w-md mx-auto text-xs text-white flex items-center justify-center gap-2">
                  <CheckCircle2 className="size-4 text-emerald-400" />
                  <span>Terima kasih! Tim pemasaran kami akan menghubungi Anda segera.</span>
                </div>
              ) : (
                <form onSubmit={handleLeadSubmit} className="mt-6 max-w-md mx-auto space-y-3">
                  <input
                    required
                    type="text"
                    placeholder="Nama Lengkap Anda"
                    value={leadName}
                    onChange={(e) => setLeadName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-white/50 text-xs focus:outline-none focus:border-amber-400"
                  />
                  <input
                    required
                    type="tel"
                    placeholder="Nomor WhatsApp (Contoh: 081234567890)"
                    value={leadPhone}
                    onChange={(e) => setLeadPhone(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-white/50 text-xs focus:outline-none focus:border-amber-400"
                  />
                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl bg-terracotta hover:bg-terracotta/90 text-white text-xs font-black shadow-lg shadow-terracotta/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <Send className="size-3.5" />
                    <span>Dapatkan Brosur &amp; Jadwal Survei</span>
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* Toast */}
        {toastMessage && (
          <div className="px-6 py-2.5 bg-espresso text-white text-xs font-medium flex items-center justify-between shrink-0">
            <span>{toastMessage}</span>
            <button onClick={() => setToastMessage(null)} className="text-amber-400 font-bold hover:underline">
              Tutup
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
