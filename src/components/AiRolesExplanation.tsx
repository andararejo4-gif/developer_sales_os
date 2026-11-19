import React from 'react';
import { UserCheck, Bot, UserCog, CheckCircle2, FileCheck } from 'lucide-react';

export const AiRolesExplanation: React.FC = () => {
  return (
    <section id="peran-ai" className="py-16 md:py-24 bg-white border-b border-warmborder">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="px-2.5 py-0.5 rounded-md bg-amber-50 text-terracotta text-xs font-bold border border-amber-200">
            Kolaborasi Manusia &amp; AI
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-espresso mt-2 tracking-tight">
            Prinsip Peran AI yang Bertanggung Jawab
          </h2>
          <p className="text-xs sm:text-sm text-warmmuted mt-2">
            Kami tidak menggantikan interaksi hangat manusia, melainkan mengotomasi beban pengawasan dan administrasi agar tim penjualan fokus pada negosiasi dan closing.
          </p>
        </div>

        {/* 3 Role Columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* SE: Dibantu AI */}
          <div className="bg-sandstone/30 border border-warmborder rounded-2xl p-6 md:p-8 flex flex-col justify-between">
            <div>
              <div className="size-12 rounded-xl bg-amber-100 text-terracotta grid place-items-center mb-4">
                <UserCheck className="size-6" />
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white text-espresso border border-warmborder">
                Garda Terdepan
              </span>
              <h3 className="text-lg font-bold text-espresso mt-2">Sales Executive (SE)</h3>
              <p className="text-xs font-semibold text-terracotta mt-0.5">SE Dibantu AI (Copilot)</p>
              <p className="text-xs text-warmmuted mt-3 leading-relaxed">
                Manusia menjalankan interaksi langsung: panggilan telepon, chat WhatsApp personal, canvassing, open table talk (OTT), dan mendampingi survei lokasi pembeli.
              </p>

              <div className="mt-5 space-y-2 text-xs border-t border-warmborder pt-4">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="size-3.5 text-olive shrink-0 mt-0.5" />
                  <span>Draf balasan pesan cepat berdasarkan Surat Cinta 99 Keunggulan.</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="size-3.5 text-olive shrink-0 mt-0.5" />
                  <span>Rute harian canvassing otomatis terpeta per jam.</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="size-3.5 text-olive shrink-0 mt-0.5" />
                  <span>Voice-to-text input laporan harian sebelum batas 18.00 WIB.</span>
                </div>
              </div>
            </div>
            <div className="mt-6 pt-3 border-t border-warmborder text-[11px] text-warmmuted">
              Tersedia di semua paket (Gold, Platinum, Diamond)
            </div>
          </div>

          {/* TL: Full AI */}
          <div className="bg-espresso text-white rounded-2xl p-6 md:p-8 flex flex-col justify-between shadow-md relative overflow-hidden">
            <div className="absolute top-0 right-0 w-28 h-28 bg-terracotta/20 rounded-full blur-xl pointer-events-none" />
            <div>
              <div className="size-12 rounded-xl bg-terracotta/30 text-amber-400 border border-terracotta/40 grid place-items-center mb-4">
                <Bot className="size-6" />
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white/10 text-amber-300 border border-white/15">
                Pengawasan Otonom 24/7
              </span>
              <h3 className="text-lg font-bold text-white mt-2">Team Leader (TL)</h3>
              <p className="text-xs font-semibold text-amber-400 mt-0.5">TL Full AI</p>
              <p className="text-xs text-stone-300 mt-3 leading-relaxed">
                AI sepenuhnya menyusun dan menjalankan rutinitas supervisor: kualifikasi BANT, pembagian lead cerdas, evaluasi respon &le;5 menit, dan penegakan aturan 72 jam.
              </p>

              <div className="mt-5 space-y-2 text-xs border-t border-white/10 pt-4 text-stone-200">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="size-3.5 text-amber-400 shrink-0 mt-0.5" />
                  <span>Lead mangkrak &gt;72 jam ditarik &amp; dialihkan otomatis ke SE lain.</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="size-3.5 text-amber-400 shrink-0 mt-0.5" />
                  <span>Audit scorecard mingguan tanpa bias personal.</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="size-3.5 text-amber-400 shrink-0 mt-0.5" />
                  <span>Manusia tetap dapat login memantau ringkasan log audit TL.</span>
                </div>
              </div>
            </div>
            <div className="mt-6 pt-3 border-t border-white/10 text-[11px] text-amber-300">
              Paket Platinum &amp; Diamond
            </div>
          </div>

          {/* SM: Semi AI */}
          <div className="bg-sandstone/30 border border-warmborder rounded-2xl p-6 md:p-8 flex flex-col justify-between">
            <div>
              <div className="size-12 rounded-xl bg-olive/20 text-olive grid place-items-center mb-4">
                <UserCog className="size-6" />
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white text-espresso border border-warmborder">
                Keputusan Strategis Manusia
              </span>
              <h3 className="text-lg font-bold text-espresso mt-2">Sales Manager (SM)</h3>
              <p className="text-xs font-semibold text-olive mt-0.5">SM Semi-AI (Manusia Menyetujui)</p>
              <p className="text-xs text-warmmuted mt-3 leading-relaxed">
                AI merumuskan rekomendasi penyesuaian target penjualan, pricelist promo, dan strategi canvassing. <strong>Manusia (SM) wajib meninjau dan menyetujui</strong> sebelum diberlakukan.
              </p>

              <div className="mt-5 space-y-2 text-xs border-t border-warmborder pt-4">
                <div className="flex items-start gap-2">
                  <FileCheck className="size-3.5 text-olive shrink-0 mt-0.5" />
                  <span>Persetujuan tercatat di tabel database <code>approvals</code>.</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="size-3.5 text-olive shrink-0 mt-0.5" />
                  <span>Manusia memiliki kontrol penuh CRUD proyek dan unit.</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="size-3.5 text-olive shrink-0 mt-0.5" />
                  <span>AI tidak dapat mengubah harga sepihak tanpa tanda tangan digital SM.</span>
                </div>
              </div>
            </div>
            <div className="mt-6 pt-3 border-t border-warmborder text-[11px] text-warmmuted">
              Fitur Eksklusif Paket Diamond
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
