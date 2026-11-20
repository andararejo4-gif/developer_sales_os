import React, { useRef, useState } from 'react';
import { ArrowRight } from 'lucide-react';

interface FaqAndFooterV3Props {
  onOpenWizard: () => void;
}

const FAQS_V3 = [
  {
    num: '01',
    q: 'Mengapa Surat Cinta 99 Keunggulan digratiskan untuk semua developer?',
    a: 'Surat Cinta 99 Keunggulan adalah pintu pembuktian kualitas sistem kami. Setiap pengembang dapat melihat langsung bagaimana katalog dan koordinat mentah diubah menjadi 99 poin narasi faktual tanpa komitmen finansial di awal.',
  },
  {
    num: '02',
    q: 'Bagaimana sistem menjamin isolasi dan keamanan data multi-tenant?',
    a: 'Setiap developer mendapatkan partisi tenant_id independen dengan pembatasan ketat di tingkat query dan pengujian isolasi otomatis. Pengembang A tidak dapat membaca proyek, unit, prospek, atau dokumen Pengembang B.',
  },
  {
    num: '03',
    q: 'Apakah AI dapat mengubah data harga tanah atau bangunan secara sepihak?',
    a: 'Tidak. Guardrail sistem melarang AI mengubah atau menginterpolasi nominal harga unit. Seluruh angka harga diekstraksi apa adanya dari pricelist resmi dan wajib melalui layar Periksa & Koreksi oleh manusia.',
  },
  {
    num: '04',
    q: 'Bagaimana cara kerja prinsip TL Full AI dan SM Semi-AI?',
    a: 'Team Leader (TL) berjalan otonom untuk menegakkan SOP teknis seperti audit respon ≤5 menit, pembagian lead, dan penarikan prospek mangkrak 72 jam. Sales Manager (SM) bersifat Semi-AI: sistem menyusun rekomendasi strategi, namun manusia wajib meninjau dan menyetujui.',
  },
  {
    num: '05',
    q: 'Format dokumen apa saja yang dapat diunduh?',
    a: 'Seluruh artefak (Surat Cinta 99 Keunggulan, Riset Pasar, Target Penjualan, Kalender Konten, dan Playbook) dapat diekspor ke Microsoft Word (DOCX), PDF siap cetak, dan HTML mandiri.',
  },
];

export const FaqAndFooterV3: React.FC<FaqAndFooterV3Props> = ({ onOpenWizard }) => {
  const [activeIdx, setActiveIdx] = useState<number>(0);
  const btnRef = useRef<HTMLButtonElement>(null);

  // Subtle magnetic CTA micro-interaction on desktop pointer devices
  const handleMagnetMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    const btn = btnRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const dx = (e.clientX - (rect.left + rect.width / 2)) * 0.14;
    const dy = (e.clientY - (rect.top + rect.height / 2)) * 0.18;
    btn.style.transform = `translate3d(${dx}px, ${dy}px, 0)`;
  };

  const handleMagnetLeave = () => {
    if (btnRef.current) {
      btnRef.current.style.transform = 'translate3d(0, 0, 0)';
    }
  };

  return (
    <>
      {/* ========================================================= */}
      {/* BAB 07: INDEKS FAQ BERNOMOR + GRAND LIGHT CLOSING CTA     */}
      {/* ========================================================= */}
      <section
        id="dokumentasi-faq"
        className="bg-white border-b border-[#CFE1D5] py-14 sm:py-20 lg:py-24"
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-8 lg:px-12">
          <div className="max-w-2xl mb-10 sm:mb-12">
            <p className="text-xs font-mono uppercase tracking-widest text-[#2F9E5B] font-bold">
              Bab 07 · Indeks Transparansi &amp; Keamanan
            </p>
            <h2 className="font-display-v3 text-v3-chapter font-extrabold text-[#0B3D2E] mt-2">
              Jawaban terbuka tanpa jargon berlebih.
            </h2>
          </div>

          {/* Numbered Index List (No Accordion Clutter) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 mb-14 sm:mb-20">
            {/* Left Sticky Index Selector (Desktop) */}
            <div className="hidden lg:block lg:col-span-4 lg:sticky lg:top-24 self-start space-y-1.5">
              {FAQS_V3.map((item, idx) => (
                <button
                  key={item.num}
                  onClick={() => {
                    setActiveIdx(idx);
                    document.getElementById(`v3-faq-${item.num}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }}
                  className={`w-full min-h-[48px] px-3.5 py-2.5 rounded-xl text-left flex items-start gap-3 transition-colors cursor-pointer ${
                    activeIdx === idx
                      ? 'bg-[#EAF4D3] text-[#0B3D2E] font-bold'
                      : 'text-[#3B5E50] hover:bg-[#F6FAF7]'
                  }`}
                >
                  <span className="font-mono text-xs font-bold text-[#2F9E5B] mt-0.5">
                    {item.num}
                  </span>
                  <span className="text-xs leading-snug">{item.q}</span>
                </button>
              ))}
            </div>

            {/* Right Open Editorial Answers */}
            <div className="lg:col-span-8 divide-y divide-[#CFE1D5] border-t border-[#CFE1D5]">
              {FAQS_V3.map((item, idx) => (
                <article
                  key={item.num}
                  id={`v3-faq-${item.num}`}
                  onMouseEnter={() => setActiveIdx(idx)}
                  className="py-6 sm:py-7 grid grid-cols-1 sm:grid-cols-12 gap-3 sm:gap-6"
                >
                  <div className="sm:col-span-2">
                    <span className="font-display-v3 text-2xl sm:text-3xl font-extrabold text-[#2F9E5B] tabular-nums">
                      {item.num}
                    </span>
                  </div>
                  <div className="sm:col-span-10">
                    <h3 className="font-display-v3 text-lg sm:text-xl font-extrabold text-[#0B3D2E] leading-snug">
                      {item.q}
                    </h3>
                    <p className="text-sm sm:text-base text-[#3B5E50] mt-2.5 leading-relaxed">
                      {item.a}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </div>

          {/* Grand All-Light Closing CTA Banner */}
          <div className="rounded-3xl bg-[#EAF4D3] border-2 border-[#0B3D2E] p-7 sm:p-12 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <div className="max-w-2xl">
              <span className="inline-block px-3 py-1 rounded-full bg-[#C6F432] text-[#0B3D2E] text-xs font-mono font-bold uppercase tracking-wider">
                Siap diuji pada proyek Anda
              </span>
              <h3 className="font-display-v3 text-2xl sm:text-4xl font-extrabold text-[#0B3D2E] mt-4 leading-tight">
                Ubah brosur proyek Anda menjadi 99 Keunggulan hari ini.
              </h3>
              <p className="text-sm sm:text-base text-[#3B5E50] mt-3 leading-relaxed">
                Gratis untuk seluruh pengembang. Hasil langsung tampil dalam format editorial siap ekspor ke Word, PDF, dan HTML.
              </p>
            </div>

            <button
              ref={btnRef}
              onMouseMove={handleMagnetMove}
              onMouseLeave={handleMagnetLeave}
              onClick={onOpenWizard}
              className="min-h-[56px] px-7 rounded-full bg-[#0B3D2E] text-white font-bold text-sm sm:text-base hover:bg-[#135440] transition-[background-color,transform] duration-150 cursor-pointer inline-flex items-center justify-center gap-3 shrink-0 shadow-[0_16px_36px_-14px_rgba(11,61,46,0.45)]"
            >
              <span>Mulai Gratis Sekarang</span>
              <span className="size-8 rounded-full bg-[#C6F432] text-[#0B3D2E] grid place-items-center">
                <ArrowRight className="size-4" />
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* CENTERED ARCHITECTURAL FOOTER WITH GIANT WORDMARK         */}
      {/* ========================================================= */}
      <footer className="bg-[#F6FAF7] pt-12 pb-24 sm:pb-12 text-center">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 lg:px-12 space-y-8">
          <div className="flex flex-col items-center gap-5 border-b border-[#CFE1D5] pb-8 text-xs sm:text-sm text-[#3B5E50]">
            <nav
              aria-label="Navigasi footer"
              className="grid grid-cols-2 sm:flex sm:flex-wrap items-center justify-center gap-x-6 gap-y-2.5 font-semibold text-[#0B3D2E] w-full max-w-md sm:max-w-none"
            >
              <a href="#studi-kasus" className="min-h-[36px] inline-flex items-center justify-center hover:text-[#2F9E5B] transition-colors">Studi Kasus</a>
              <a href="#alur-6-langkah" className="min-h-[36px] inline-flex items-center justify-center hover:text-[#2F9E5B] transition-colors">6 Langkah</a>
              <a href="#peta-demo" className="min-h-[36px] inline-flex items-center justify-center hover:text-[#2F9E5B] transition-colors">Peta Radius 25 km</a>
              <a href="#peran-ai" className="min-h-[36px] inline-flex items-center justify-center hover:text-[#2F9E5B] transition-colors">Playbook AI</a>
              <a href="#paket-harga" className="min-h-[36px] inline-flex items-center justify-center hover:text-[#2F9E5B] transition-colors">Paket</a>
              <a href="#dokumentasi-faq" className="min-h-[36px] inline-flex items-center justify-center hover:text-[#2F9E5B] transition-colors">Privasi &amp; FAQ</a>
            </nav>

            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 font-mono text-xs">
              <a href="mailto:support@giivepro.com" className="text-[#0B3D2E] hover:text-[#2F9E5B] hover:underline">
                support@giivepro.com
              </a>
              <a href="mailto:halo@giivepro.com" className="text-[#0B3D2E] hover:text-[#2F9E5B] hover:underline">
                halo@giivepro.com
              </a>
            </div>
          </div>

          {/* Monumental Architectural Wordmark */}
          <div className="overflow-hidden">
            <p className="font-display-v3 font-extrabold text-[#0B3D2E]/12 tracking-tighter leading-none select-none text-center text-[clamp(2.1rem,8vw,6.6rem)]">
              DEVELOPER SALES OS
            </p>
          </div>

          <div className="flex flex-col items-center justify-center gap-2 text-xs text-[#3B5E50]">
            <p className="max-w-xl leading-relaxed">
              &copy; 2026 Developer Sales OS · giivepro · Studi Kasus: The Park Townhouse Sukoharjo (PT Andara Rejo Makmur).
            </p>
            <p className="font-mono text-[#0B3D2E]/80">developerproperti.giivepro.com</p>
          </div>
        </div>
      </footer>
    </>
  );
};
