import React, { useState } from 'react';
import { ChevronDown, ArrowRight } from 'lucide-react';

interface FaqAndCtaProps {
  onOpenWizard: () => void;
}

export const FaqAndCta: React.FC<FaqAndCtaProps> = ({ onOpenWizard }) => {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const faqs = [
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

  return (
    <section id="dokumentasi-faq" className="py-12 sm:py-16 lg:py-20 bg-sandstone">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Asymmetric Split FAQ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 mb-12 sm:mb-16">
          <div className="lg:col-span-4 min-w-0">
            <p className="text-xs font-mono uppercase tracking-widest text-terracotta font-semibold">
              Pertanyaan Umum
            </p>
            <h2 className="text-section-display font-extrabold text-espresso mt-2">
              Transparansi, keamanan &amp; alur kerja.
            </h2>
            <p className="text-sm sm:text-base text-warmmuted mt-3 leading-relaxed">
              Tanpa klaim berlebihan, tanpa hitung mundur buatan, dan tanpa kelangkaan fiktif.
            </p>
          </div>

          <div className="lg:col-span-8 min-w-0 border-t border-warmborder divide-y divide-warmborder">
            {faqs.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div key={idx} className="bg-transparent">
                  <button
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    aria-expanded={isOpen}
                    className="w-full min-h-[56px] py-4 text-left flex items-center justify-between gap-4 cursor-pointer hover:text-terracotta transition-colors"
                  >
                    <span className="font-bold text-sm sm:text-base text-espresso pr-2">
                      {faq.q}
                    </span>
                    <ChevronDown
                      className={`size-4 text-warmmuted shrink-0 transition-transform ${
                        isOpen ? 'rotate-180 text-terracotta' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="pb-5 pr-6 text-sm text-warmmuted leading-relaxed">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Clean Closing CTA Box (Espresso surface, zero blur blobs) */}
        <div className="rounded-lg bg-espresso text-sandstone p-6 sm:p-10 lg:p-12 border border-espresso">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 lg:gap-10">
            <div className="max-w-2xl">
              <p className="text-xs font-mono uppercase tracking-widest text-sandstone/70 font-semibold">
                Gratis · Terbuka untuk Seluruh Pengembang
              </p>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-white mt-2 leading-tight">
                Siap mengubah brosur Anda menjadi Surat Cinta 99 Keunggulan?
              </h3>
              <p className="mt-2.5 text-sm sm:text-base text-sandstone/80 leading-relaxed">
                Unggah katalog dan pricelist proyek Anda sekarang untuk menyusun narasi 99 poin faktual yang siap dipakai tim penjualan.
              </p>
            </div>

            <div className="shrink-0 flex flex-col sm:flex-row lg:flex-col gap-3">
              <button
                onClick={onOpenWizard}
                className="w-full sm:w-auto min-h-[48px] px-6 rounded-md bg-terracotta text-white font-semibold text-sm sm:text-base hover:bg-terracotta/90 transition-colors cursor-pointer inline-flex items-center justify-center gap-2"
              >
                <span>Dapatkan Surat Cinta Gratis</span>
                <ArrowRight className="size-4" />
              </button>
              <p className="text-xs text-sandstone/70 text-center lg:text-left">
                Ekspor DOCX &amp; PDF · Isolasi Data Multi-Tenant
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
