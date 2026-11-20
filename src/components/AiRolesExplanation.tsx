import React from 'react';
import { Check } from 'lucide-react';

export const AiRolesExplanation: React.FC = () => {
  const roles = [
    {
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

  return (
    <section id="peran-ai" className="py-12 sm:py-16 lg:py-20 bg-surface border-b border-warmborder">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Left-aligned Editorial Header (breaks centered-heading monotony) */}
        <div className="max-w-2xl mb-8 sm:mb-12">
          <p className="text-xs font-mono uppercase tracking-widest text-terracotta font-semibold">
            Pembagian Peran Manusia &amp; Sistem
          </p>
          <h2 className="text-section-display font-extrabold text-espresso mt-2">
            AI mengotomasi pengawasan, manusia fokus pada closing.
          </h2>
          <p className="text-sm sm:text-base text-warmmuted mt-3 leading-relaxed">
            Kami memisahkan peran secara tegas agar teknologi tidak menggantikan empati saat negosiasi dengan calon pembeli rumah.
          </p>
        </div>

        {/* Structured 3-Column Hairline Ledger Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-6">
          {roles.map((role) => (
            <div
              key={role.code}
              className={`rounded-lg p-6 sm:p-7 flex flex-col justify-between border ${
                role.highlight
                  ? 'bg-espresso text-sandstone border-espresso'
                  : 'bg-sandstone/35 text-espresso border-warmborder'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 pb-4 border-b border-current/15">
                  <span
                    className={`text-[11px] font-mono font-semibold tracking-wider ${
                      role.highlight ? 'text-sandstone/70' : 'text-warmmuted'
                    }`}
                  >
                    {role.code}
                  </span>
                  <span
                    className={`text-xs font-semibold px-2.5 py-0.5 rounded ${
                      role.highlight
                        ? 'bg-terracotta text-white'
                        : 'bg-surface border border-warmborder text-espresso'
                    }`}
                  >
                    {role.mode}
                  </span>
                </div>

                <h3 className="text-lg sm:text-xl font-extrabold mt-5">{role.title}</h3>
                <p
                  className={`text-sm mt-2.5 leading-relaxed ${
                    role.highlight ? 'text-sandstone/85' : 'text-warmmuted'
                  }`}
                >
                  {role.summary}
                </p>

                <ul className="mt-5 space-y-2.5 pt-4 border-t border-current/15 text-sm">
                  {role.points.map((pt, idx) => (
                    <li key={idx} className="flex items-start gap-2.5">
                      <Check
                        className={`size-4 shrink-0 mt-0.5 ${
                          role.highlight ? 'text-terracotta' : 'text-olive'
                        }`}
                      />
                      <span className={role.highlight ? 'text-sandstone/90' : 'text-espresso/90'}>
                        {pt}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div
                className={`mt-6 pt-4 border-t border-current/15 text-xs font-medium ${
                  role.highlight ? 'text-sandstone/70' : 'text-warmmuted'
                }`}
              >
                {role.availability}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
