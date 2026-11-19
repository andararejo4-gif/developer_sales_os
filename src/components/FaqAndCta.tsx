import React, { useState } from 'react';
import { ChevronDown, Sparkles, ArrowRight, ShieldCheck, Lock, Database } from 'lucide-react';

interface FaqAndCtaProps {
  onOpenWizard: () => void;
}

export const FaqAndCta: React.FC<FaqAndCtaProps> = ({ onOpenWizard }) => {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const faqs = [
    {
      q: "Mengapa Surat Cinta 99 Keunggulan digratiskan untuk semua developer?",
      a: "Surat Cinta 99 Keunggulan adalah pintu masuk pembuktian kualitas platform kami. Kami ingin setiap pengembang melihat langsung bagaimana katalog dan koordinat mentah mereka dapat diubah menjadi 99 poin narasi berkelas tanpa risiko dan tanpa komitmen finansial di awal."
    },
    {
      q: "Bagaimana sistem menjamin isolasi dan keamanan data multi-tenant kami?",
      a: "Setiap developer mendapatkan partisi tenant_id independen. Database kami diprogram dengan pembatasan ketat di tingkat query dan pengujian otomatis (automated isolation test). Pengembang A tidak akan pernah bisa membaca proyek, unit, prospek, atau dokumen Pengembang B."
    },
    {
      q: "Apakah AI dapat mengubah data harga tanah atau bangunan secara sepihak?",
      a: "Sama sekali tidak. Guardrail sistem kami melarang keras AI mengubah atau menginterpolasi nominal harga unit. Seluruh angka harga diekstraksi murni apa adanya dari pricelist resmi yang Anda unggah, dan wajib melalui layar 'Periksa & Koreksi' oleh manusia."
    },
    {
      q: "Bagaimana cara kerja prinsip TL Full AI dan SM Semi-AI?",
      a: "Team Leader (TL) dijalankan otonom oleh AI untuk menegakkan SOP teknis seperti audit respon ≤5 menit, pembagian leads, dan penarikan prospek mangkrak 72 jam. Sedangkan Sales Manager (SM) bersifat Semi-AI: AI menyusun rekomendasi strategi dan tabel penawaran, namun manusia yang bertindak sebagai SM wajib meninjau dan mengeklik tombol persetujuan (tercatat di tabel approvals)."
    },
    {
      q: "Format dokumen apa yang bisa diunduh oleh developer?",
      a: "Seluruh artefak yang dihasilkan (Surat Cinta 99 Keunggulan, Riset Pasar, Target Penjualan, Kalender Konten, dan Playbook) dapat diekspor langsung ke format Microsoft Word (DOCX), dokumen siap cetak / PDF, dan halaman HTML mandiri."
    }
  ];

  return (
    <section id="dokumentasi-faq" className="py-16 md:py-24 bg-sandstone">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* FAQ Header */}
        <div className="text-center mb-10">
          <span className="px-2.5 py-0.5 rounded-md bg-amber-50 text-terracotta text-xs font-bold border border-amber-200">
            Pertanyaan yang Sering Diajukan
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-espresso mt-2">
            Transparansi, Keamanan &amp; Alur Kerja
          </h2>
          <p className="text-xs sm:text-sm text-warmmuted mt-1">
            Prinsip tanpa klaim palsu, tanpa hitung mundur buatan, dan tanpa kelangkaan fiktif.
          </p>
        </div>

        {/* FAQ Accordion */}
        <div className="space-y-3 mb-16">
          {faqs.map((faq, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div
                key={idx}
                className="bg-white border border-warmborder rounded-2xl overflow-hidden shadow-2xs"
              >
                <button
                  onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                  className="w-full p-5 text-left flex items-center justify-between gap-4 cursor-pointer hover:bg-sandstone/30 transition-colors"
                >
                  <span className="font-bold text-sm text-espresso">{faq.q}</span>
                  <ChevronDown
                    className={`size-4 text-warmmuted shrink-0 transition-transform ${
                      isOpen ? 'rotate-180 text-terracotta' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 pt-1 text-xs text-warmmuted leading-relaxed border-t border-warmborder/60">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Closing CTA Box (Espresso background with Sandstone text) */}
        <div className="rounded-3xl bg-espresso text-sandstone p-8 md:p-12 text-center shadow-xl border border-white/10 relative overflow-hidden">
          <div className="absolute top-0 right-1/2 translate-x-1/2 w-96 h-48 bg-terracotta/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-2xl mx-auto">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-amber-400 text-xs font-bold uppercase tracking-wider mb-4 border border-white/10">
              <Sparkles className="size-3.5 text-amber-300" />
              <span>Gratis &middot; Terbuka untuk Seluruh Pengembang</span>
            </span>

            <h3 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
              Siap mengubah brosur Anda menjadi Surat Cinta 99 Keunggulan?
            </h3>

            <p className="mt-3 text-xs sm:text-sm text-stone-300 leading-relaxed">
              Unggah materi katalog dan pricelist proyek Anda sekarang. Dapatkan narasi kurasi editorial 99 poin faktual terverifikasi dalam hitungan menit.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={onOpenWizard}
                className="w-full sm:w-auto h-12 px-8 rounded-xl bg-terracotta text-white font-bold text-xs sm:text-sm hover:bg-terracotta/90 transition-all shadow-md cursor-pointer flex items-center justify-center gap-2 group"
              >
                <Sparkles className="size-4 text-amber-300 group-hover:rotate-12 transition-transform" />
                <span>Dapatkan Surat Cinta Gratis</span>
                <ArrowRight className="size-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            <div className="mt-6 flex items-center justify-center gap-6 text-[11px] text-stone-400">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="size-3.5 text-olive" /> Ekspor DOCX &amp; PDF
              </span>
              <span className="flex items-center gap-1.5">
                <Lock className="size-3.5 text-olive" /> Isolasi Data Multi-Tenant
              </span>
              <span className="flex items-center gap-1.5">
                <Database className="size-3.5 text-olive" /> Faktual &amp; Bebas Overpromise
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
