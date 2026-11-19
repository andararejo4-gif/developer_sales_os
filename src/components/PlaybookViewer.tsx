// ============================================================================
// PLAYBOOK VIEWER COMPONENT - DEVELOPER SALES OS
// Reverse-Funnel Math, BANT >= 7 Scoring, SOP, & Dual/Triple Role Hierarchy
// ============================================================================

import { useState } from 'react';
import {
  BookOpen,
  Download,
  X,
  AlertCircle,
  Clock,
} from 'lucide-react';
import { getPlaybook } from '../lib/playbook/playbook-generator';
import { generatePlaybookDocx } from '../lib/exporters/playbook-docx';
import type { PlaybookPlan, PlaybookRole } from '../lib/playbook/types';

interface PlaybookViewerProps {
  projectId?: string;
  projectName?: string;
  initialRole?: PlaybookRole;
  isDemoMode?: boolean;
  onClose?: () => void;
}

export function PlaybookViewer({
  projectId = 'proj-the-park-01',
  projectName = 'The Park Townhouse Sukoharjo',
  initialRole = 'SE',
  isDemoMode = false,
  onClose,
}: PlaybookViewerProps) {
  const [role, setRole] = useState<PlaybookRole>(initialRole);
  const [playbook, setPlaybook] = useState<PlaybookPlan>(() =>
    getPlaybook(projectId, initialRole, isDemoMode)
  );
  const [activeTab, setActiveTab] = useState<'sop' | 'bant' | 'kpi' | 'funnel'>('sop');
  const [isExporting, setIsExporting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // BANT interactive simulator state (score 1..10 per dimension)
  const [bantScores, setBantScores] = useState<{ [dim: string]: number }>({
    Budget: 8,
    Authority: 8,
    Need: 9,
    Timeline: 7,
  });

  const handleRoleChange = (newRole: PlaybookRole) => {
    setRole(newRole);
    setPlaybook(getPlaybook(projectId, newRole, isDemoMode));
  };

  const calculatedBantAverage = Number(
    (
      (bantScores.Budget * 0.3 +
        bantScores.Authority * 0.25 +
        bantScores.Need * 0.25 +
        bantScores.Timeline * 0.2)
    ).toFixed(1)
  );

  const isBantQualified = calculatedBantAverage >= 7.0;

  const handleExportDocx = async () => {
    setIsExporting(true);
    try {
      const blob = await generatePlaybookDocx(playbook);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Playbook_${role}_${projectName.replace(/\s+/g, '_')}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setToastMessage('Dokumen DOCX Playbook berhasil diunduh (Bersih dari token)');
    } catch {
      setToastMessage('Gagal mengunduh DOCX Playbook');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-espresso/70 backdrop-blur-sm flex justify-center p-3 md:p-6 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-warmborder w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 bg-sandstone/60 border-b border-warmborder flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="size-11 rounded-2xl bg-terracotta text-white flex items-center justify-center shadow-sm">
              <BookOpen className="size-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg md:text-xl font-extrabold text-espresso tracking-tight">
                  Playbook Penjualan &amp; Standar Operasional
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-terracotta/10 text-terracotta border border-terracotta/20">
                  Role: {role}
                </span>
                {isDemoMode && (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                    Mode Cuplikan 25% (Demo)
                  </span>
                )}
              </div>
              <p className="text-xs text-warmmuted">
                {projectName} · Panduan Kerja Taktis, Kualifikasi BANT &ge; 7, &amp; KPI Terukur
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportDocx}
              disabled={isExporting}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-terracotta text-white hover:bg-terracotta/90 flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm disabled:opacity-50"
            >
              <Download className="size-3.5" />
              <span>{isExporting ? 'Mengekspor...' : 'Ekspor DOCX'}</span>
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

        {/* Role Selector & Tab Bar */}
        <div className="px-6 py-3 bg-white border-b border-warmborder flex flex-wrap items-center justify-between gap-3 shrink-0">
          {/* Role Switcher */}
          <div className="flex items-center gap-1 p-1 bg-sandstone rounded-2xl border border-warmborder">
            {(['SE', 'TL', 'SM'] as PlaybookRole[]).map((r) => (
              <button
                key={r}
                onClick={() => handleRoleChange(r)}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                  role === r
                    ? 'bg-espresso text-white shadow-sm'
                    : 'text-warmmuted hover:text-espresso'
                }`}
              >
                {r === 'SE' ? 'Sales Executive (SE)' : r === 'TL' ? 'Team Leader (TL)' : 'Sales Manager (SM)'}
              </button>
            ))}
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-1">
            {(
              [
                { key: 'sop', label: 'SOP Harian' },
                { key: 'bant', label: 'Kualifikasi BANT' },
                { key: 'kpi', label: 'Matriks KPI' },
                { key: 'funnel', label: 'Reverse Funnel' },
              ] as const
            ).map((t) => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === t.key
                    ? 'bg-terracotta text-white shadow-sm'
                    : 'bg-sandstone text-warmmuted hover:text-espresso'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto flex-1 bg-[#FBF9F5] space-y-6">
          {/* TAB 1: SOP HARIAN */}
          {activeTab === 'sop' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-sm font-extrabold text-espresso">
                  Rutinitas Kerja Harian ({role})
                </h3>
                <span className="text-xs text-warmmuted">
                  Wajib dipatuhi untuk menjaga ritme kerja closing bulanan
                </span>
              </div>

              <div className="space-y-3">
                {playbook.dailySop.map((sop, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-white border border-warmborder shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3"
                  >
                    <div className="flex items-start gap-3.5">
                      <div className="size-9 rounded-xl bg-sandstone border border-warmborder flex items-center justify-center font-bold text-xs text-espresso shrink-0">
                        {idx + 1}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-terracotta flex items-center gap-1">
                            <Clock className="size-3" />
                            {sop.timeOrFrequency}
                          </span>
                          <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-sandstone text-warmmuted">
                            {sop.channel}
                          </span>
                          {sop.slaMinutes && (
                            <span className="px-2 py-0.2 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300">
                              SLA ≤ {sop.slaMinutes}m
                            </span>
                          )}
                        </div>
                        <h4 className="text-xs font-extrabold text-espresso mt-0.5">
                          {sop.activityName}
                        </h4>
                        <p className="text-xs text-warmmuted mt-1 leading-relaxed">
                          {sop.instruction}
                        </p>
                      </div>
                    </div>

                    <div className="md:text-right shrink-0 p-2.5 rounded-xl bg-amber-50/50 border border-amber-100 md:max-w-xs">
                      <span className="text-[10px] font-bold text-warmmuted block">Target Output:</span>
                      <span className="text-xs font-bold text-espresso">{sop.targetOutput}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: BANT QUALIFICATION */}
          {activeTab === 'bant' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Simulator Card */}
                <div className="lg:col-span-5 bg-white p-5 rounded-3xl border border-warmborder shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-warmborder pb-3">
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-espresso">
                      Kalkulator Skor BANT Prospek
                    </h4>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-black ${
                        isBantQualified
                          ? 'bg-lime-100 text-olive border border-lime-300'
                          : 'bg-rose-100 text-rose-800 border border-rose-300'
                      }`}
                    >
                      Skor: {calculatedBantAverage} / 10 &middot; {isBantQualified ? 'LOLOS (Hot)' : 'BELUM LOLOS'}
                    </span>
                  </div>

                  <p className="text-xs text-warmmuted">
                    Hanya prospek dengan skor gabungan berbobot <strong>&ge; 7.0</strong> yang diteruskan ke tahap booking/survei VIP.
                  </p>

                  <div className="space-y-3">
                    {playbook.bantCriteria.map((b) => (
                      <div key={b.dimension} className="space-y-1">
                        <div className="flex justify-between text-xs font-bold text-espresso">
                          <span>{b.dimension} (Bobot {b.weightPercent}%)</span>
                          <span className="text-terracotta">{bantScores[b.dimension]}/10</span>
                        </div>
                        <input
                          type="range"
                          min="1"
                          max="10"
                          value={bantScores[b.dimension]}
                          onChange={(e) =>
                            setBantScores({ ...bantScores, [b.dimension]: Number(e.target.value) })
                          }
                          className="w-full accent-terracotta cursor-pointer"
                        />
                      </div>
                    ))}
                  </div>

                  <div className="p-3.5 rounded-2xl bg-sandstone/50 border border-warmborder text-xs text-espresso">
                    <span className="font-bold text-espresso block mb-1">Rekomendasi Tindakan:</span>
                    {isBantQualified ? (
                      <p className="text-olive font-semibold leading-relaxed">
                        ✓ Segera jadwalkan survei lokasi fisik atau Zoom Private Preview dalam 48 jam. Kirimkan berkas simulasi KPR/Cash bertahap.
                      </p>
                    ) : (
                      <p className="text-warmmuted leading-relaxed">
                        Masukkan ke alur edukasi rutin (nurturing via WhatsApp status &amp; newsletter mingguan). Jangan paksakan survei sebelum skor meningkat.
                      </p>
                    )}
                  </div>
                </div>

                {/* Criteria Detail */}
                <div className="lg:col-span-7 space-y-3">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-warmmuted">
                    Standar Pertanyaan &amp; Indikator Kelulusan
                  </h4>
                  {playbook.bantCriteria.map((b) => (
                    <div key={b.dimension} className="p-4 rounded-2xl bg-white border border-warmborder shadow-sm space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold text-terracotta uppercase">
                          {b.dimension} &middot; Bobot {b.weightPercent}%
                        </span>
                        <span className="text-[11px] font-bold text-warmmuted">Ambang: &ge; {b.minScoreToPass}/10</span>
                      </div>
                      <p className="text-xs font-semibold text-espresso">{b.indicatorPassing}</p>
                      <div className="pt-2 border-t border-warmborder/60 text-xs">
                        <span className="font-bold text-warmmuted block text-[11px] mb-1">Pertanyaan Skrining SE:</span>
                        <ul className="list-disc list-inside space-y-0.5 text-warmmuted">
                          {b.qualificationQuestions.map((q, i) => (
                            <li key={i}>{q}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: KPI METRICS */}
          {activeTab === 'kpi' && (
            <div className="bg-white rounded-3xl border border-warmborder shadow-sm overflow-hidden">
              <div className="p-5 border-b border-warmborder">
                <h4 className="text-sm font-extrabold text-espresso">Matriks KPI &amp; Target Kinerja ({role})</h4>
                <p className="text-xs text-warmmuted">Parameter evaluasi performa mingguan dan bulanan</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-sandstone/50 border-b border-warmborder text-[11px] font-extrabold text-espresso uppercase tracking-wider">
                      <th className="py-3 px-4">Indikator Kinerja (KPI)</th>
                      <th className="py-3 px-3">Periode</th>
                      <th className="py-3 px-3">Target Ideal</th>
                      <th className="py-3 px-3">Batas Minimum</th>
                      <th className="py-3 px-3 text-right">Bobot</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-warmborder">
                    {playbook.kpiMetrics.map((kpi, idx) => (
                      <tr key={idx} className="hover:bg-sandstone/30">
                        <td className="py-3.5 px-4 font-bold text-espresso">{kpi.metric}</td>
                        <td className="py-3.5 px-3 font-semibold text-warmmuted">{kpi.targetPeriod}</td>
                        <td className="py-3.5 px-3 font-extrabold text-terracotta">{kpi.targetValue}</td>
                        <td className="py-3.5 px-3 text-warmmuted">{kpi.minimumAcceptableValue}</td>
                        <td className="py-3.5 px-3 font-mono font-bold text-espresso text-right">
                          {kpi.scoringWeightPercent}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: REVERSE FUNNEL */}
          {activeTab === 'funnel' && (
            <div className="bg-white p-6 rounded-3xl border border-warmborder shadow-sm space-y-4">
              <div className="border-b border-warmborder pb-3">
                <h4 className="text-sm font-extrabold text-espresso">
                  Perhitungan Reverse-Funnel Aktivitas Bulanan SE
                </h4>
                <p className="text-xs text-warmmuted">
                  Dihitung mundur dari target 1 unit closing per SE per bulan
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-6 gap-3 text-center">
                <div className="p-4 rounded-2xl bg-sandstone/50 border border-warmborder">
                  <span className="text-[10px] font-bold text-warmmuted uppercase">1. Leads Baru</span>
                  <p className="text-2xl font-black text-espresso mt-1">{playbook.reverseFunnelTargets.leads}</p>
                  <span className="text-[10px] text-warmmuted">Kontak/bln</span>
                </div>
                <div className="p-4 rounded-2xl bg-sandstone/50 border border-warmborder">
                  <span className="text-[10px] font-bold text-warmmuted uppercase">2. Prospek</span>
                  <p className="text-2xl font-black text-espresso mt-1">{playbook.reverseFunnelTargets.prospek}</p>
                  <span className="text-[10px] text-warmmuted">BANT terisi</span>
                </div>
                <div className="p-4 rounded-2xl bg-sandstone/50 border border-warmborder">
                  <span className="text-[10px] font-bold text-warmmuted uppercase">3. Hot Prospek</span>
                  <p className="text-2xl font-black text-terracotta mt-1">{playbook.reverseFunnelTargets.hot_prospek}</p>
                  <span className="text-[10px] text-warmmuted">BANT &ge; 7</span>
                </div>
                <div className="p-4 rounded-2xl bg-sandstone/50 border border-warmborder">
                  <span className="text-[10px] font-bold text-warmmuted uppercase">4. Survei Lokasi</span>
                  <p className="text-2xl font-black text-espresso mt-1">{playbook.reverseFunnelTargets.survei}</p>
                  <span className="text-[10px] text-warmmuted">Kunjungan fisik</span>
                </div>
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200">
                  <span className="text-[10px] font-bold text-terracotta uppercase">5. Booking SPK</span>
                  <p className="text-2xl font-black text-terracotta mt-1">{playbook.reverseFunnelTargets.booking}</p>
                  <span className="text-[10px] text-espresso font-semibold">Tanda jadi</span>
                </div>
                <div className="p-4 rounded-2xl bg-lime-100 border border-lime-300">
                  <span className="text-[10px] font-bold text-olive uppercase">6. Akad / Lunas</span>
                  <p className="text-2xl font-black text-olive mt-1">{playbook.reverseFunnelTargets.closing}</p>
                  <span className="text-[10px] text-olive font-extrabold">Unit Sold</span>
                </div>
              </div>
            </div>
          )}

          {/* Mode Demo Banner */}
          {isDemoMode && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <AlertCircle className="size-4 text-amber-700 shrink-0" />
                Mode Demo menampilkan cuplikan 25% SOP dan parameter playbook.
              </span>
              <span className="font-bold text-terracotta">Tingkatkan Paket untuk Versi Lengkap &rarr;</span>
            </div>
          )}
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
