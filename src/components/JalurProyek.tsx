// ============================================================================
// JALUR PROYEK (PROJECT PIPELINE) COMPONENT - DEVELOPER SALES OS
// Visual sequential roadmap & permission-guarded stage controller
// ============================================================================

import { useState } from 'react';
import {
  FileText,
  Compass,
  TrendingUp,
  Calendar,
  BookOpen,
  MapPin,
  Globe,
  UploadCloud,
  CheckCircle2,
  Clock,
  Plus,
  RefreshCw,
  Eye,
  AlertCircle,
  X,
} from 'lucide-react';

export interface ProjectStageItem {
  key: string;
  order: number;
  title: string;
  description: string;
  isFree: boolean;
  phase: string;
  status: 'COMPLETED' | 'READY' | 'LOCKED';
  version: number;
  icon: typeof FileText;
}

export const PIPELINE_STAGES: ProjectStageItem[] = [
  {
    key: 'input',
    order: 1,
    title: 'Input Dokumen Proyek',
    description: 'Brosur/katalog, pricelist harga bertahap, koordinat GPS cluster, fasilitas.',
    isFree: true,
    phase: 'Fase 1',
    status: 'COMPLETED',
    version: 1,
    icon: UploadCloud,
  },
  {
    key: 'surat_cinta_99',
    order: 2,
    title: 'Surat Cinta 99 Keunggulan',
    description: 'Narasi editorial emosional & 99 poin faktual terkurasi (Gratis selamanya).',
    isFree: true,
    phase: 'Fase 1',
    status: 'COMPLETED',
    version: 1,
    icon: FileText,
  },
  {
    key: 'riset_pasar',
    order: 3,
    title: 'Riset Pasar & Analisis Kompetitor',
    description: '5 Persona target, fasilitas publik & kompetitor cincin radius 500m - 25km.',
    isFree: false,
    phase: 'Fase 2',
    status: 'COMPLETED',
    version: 1,
    icon: Compass,
  },
  {
    key: 'target_penjualan',
    order: 4,
    title: 'Target Penjualan 100% Sold Out',
    description: 'Skenario kecepatan jual, reverse funnel leads, dan pembagian kuota per SE.',
    isFree: false,
    phase: 'Fase 2',
    status: 'COMPLETED',
    version: 1,
    icon: TrendingUp,
  },
  {
    key: 'kalender_konten',
    order: 5,
    title: 'Kalender Konten Media Sosial (30 Hari)',
    description: 'Slot TOFU/MOFU/BOFU harian multi-platform untuk akun proyek & sales.',
    isFree: false,
    phase: 'Fase 3',
    status: 'READY',
    version: 1,
    icon: Calendar,
  },
  {
    key: 'playbook',
    order: 6,
    title: 'Playbook Sales (SE, TL, SM)',
    description: 'SOP closing, penanganan keberatan, skrip follow-up, dan aturan eskalasi.',
    isFree: false,
    phase: 'Fase 4',
    status: 'READY',
    version: 1,
    icon: BookOpen,
  },
  {
    key: 'rute_harian',
    order: 7,
    title: 'Rute Harian & Kanvasing SE',
    description: 'Pemetaan rute harian kanvasing B2B & titik keramaian per SE.',
    isFree: false,
    phase: 'Fase 4',
    status: 'READY',
    version: 1,
    icon: MapPin,
  },
  {
    key: 'website_landing',
    order: 8,
    title: 'Website Landing Page Proyek',
    description: 'Landing page berkonversi tinggi dengan formulir lead terintegrasi CRM.',
    isFree: false,
    phase: 'Fase 5',
    status: 'READY',
    version: 1,
    icon: Globe,
  },
];

interface JalurProyekProps {
  projectName?: string;
  userRole?: string;
  isDemoMode?: boolean;
  onOpenStage?: (stageKey: string) => void;
  onClose?: () => void;
}

export function JalurProyek({
  projectName = 'The Park Townhouse Sukoharjo',
  userRole = 'DIREKSI',
  isDemoMode = false,
  onOpenStage,
  onClose,
}: JalurProyekProps) {
  const [stages, setStages] = useState<ProjectStageItem[]>(PIPELINE_STAGES);
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Role capability permissions check:
  // proyek.buat, proyek.unggah, proyek.generate are ONLY permitted for OWNER, DIREKSI, SM
  const canManageProject = ['DEVELOPER_OWNER', 'DIREKSI', 'SALES_MANAGER', 'SM'].includes(userRole);

  const handleStageClick = (stage: ProjectStageItem) => {
    if (stage.status === 'LOCKED') {
      setToastMessage('Tahap ini masih terkunci.');
      return;
    }
    if (onOpenStage) {
      onOpenStage(stage.key);
    } else {
      setToastMessage(`Membuka ${stage.title}`);
    }
  };

  const handleRegenerateStage = (stageKey: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!canManageProject) {
      setToastMessage('Akses ditolak: Hanya Direksi dan Sales Manager yang dapat me-regenerate tahap proyek.');
      return;
    }

    setStages((prev) =>
      prev.map((s) => (s.key === stageKey ? { ...s, version: s.version + 1, status: 'COMPLETED' } : s))
    );
    setToastMessage(`Tahap ${stageKey} berhasil di-regenerate ke versi baru!`);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-espresso/70 backdrop-blur-sm flex justify-center p-3 md:p-6 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-warmborder w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 bg-sandstone/60 border-b border-warmborder flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-terracotta text-white">
                Jalur Proyek
              </span>
              <h2 className="text-lg md:text-xl font-extrabold text-espresso">
                {projectName}
              </h2>
              {isDemoMode && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                  Demo
                </span>
              )}
            </div>
            <p className="text-xs text-warmmuted mt-0.5">
              Alur berurutan 8 tahap pemasaran & penjualan. Tiap tahap menjadi masukan tahap berikutnya.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {canManageProject && (
              <button
                onClick={() => setShowNewProjectModal(true)}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-espresso text-white hover:bg-espresso/90 flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
              >
                <Plus className="size-3.5 text-amber-400" />
                <span>Tambah Proyek Baru</span>
              </button>
            )}

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

        {/* Permission Notice Banner for SE & TL */}
        {!canManageProject && (
          <div className="bg-amber-50 px-6 py-2.5 border-b border-amber-200 flex items-center gap-2 text-xs text-amber-900 shrink-0">
            <AlertCircle className="size-4 text-amber-700 shrink-0" />
            <span>
              Mode Read-Only ({userRole}): Anda dapat melihat hasil tahap proyek yang ditugaskan. Pembuatan dan regenerasi proyek dikelola oleh Direksi & Sales Manager.
            </span>
          </div>
        )}

        {/* Gerbang Kesiapan G0-G3 (Blueprint v1.2 Bab 05) */}
        <div className="bg-sandstone/70 border-b border-warmborder px-6 py-3 shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-espresso/70">
              Gerbang Kesiapan Operasional (Readiness Gates)
            </span>
            <span className="text-[11px] text-warmmuted">
              Keluaran sebelum gerbang lulus berstatus <strong className="text-espresso">draf &amp; simulasi internal</strong>.
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="p-2 rounded-lg bg-surface border border-warmborder flex items-center gap-2">
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <div>
                <p className="font-bold text-xs text-espresso">G0 · Draft-ready</p>
                <p className="text-[10px] text-emerald-700 font-medium">Lolos (6 Draf Aktif)</p>
              </div>
            </div>
            <div className="p-2 rounded-lg bg-surface border border-warmborder flex items-center gap-2">
              <span className="size-2 rounded-full bg-amber-400 shrink-0" />
              <div>
                <p className="font-bold text-xs text-espresso">G1 · Publish-ready</p>
                <p className="text-[10px] text-warmmuted">Perlu PIC Approval</p>
              </div>
            </div>
            <div className="p-2 rounded-lg bg-surface border border-warmborder flex items-center gap-2">
              <span className="size-2 rounded-full bg-slate-300 shrink-0" />
              <div>
                <p className="font-bold text-xs text-espresso">G2 · Demand-ready</p>
                <p className="text-[10px] text-warmmuted">Iklan &amp; WA Mandat</p>
              </div>
            </div>
            <div className="p-2 rounded-lg bg-surface border border-warmborder flex items-center gap-2">
              <span className="size-2 rounded-full bg-slate-300 shrink-0" />
              <div>
                <p className="font-bold text-xs text-espresso">G3 · Transaction</p>
                <p className="text-[10px] text-warmmuted">Whitelist Rekening</p>
              </div>
            </div>
          </div>
        </div>

        {/* Content Stages Timeline */}
        <div className="p-6 overflow-y-auto flex-1 bg-[#FBF9F5] space-y-4">
          <div className="grid grid-cols-1 gap-3.5">
            {stages.map((stage) => {
              const Icon = stage.icon;
              const isCompleted = stage.status === 'COMPLETED';
              const isReady = stage.status === 'READY';

              return (
                <div
                  key={stage.key}
                  onClick={() => handleStageClick(stage)}
                  className={`p-4 md:p-5 rounded-2xl border transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                    isCompleted
                      ? 'bg-white border-warmborder hover:border-terracotta/60 shadow-sm'
                      : isReady
                      ? 'bg-white/80 border-dashed border-warmborder hover:bg-white'
                      : 'bg-sandstone/30 border-warmborder/40 opacity-60 cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`size-11 rounded-2xl flex items-center justify-center shrink-0 font-extrabold text-sm ${
                        isCompleted
                          ? 'bg-terracotta text-white shadow-sm'
                          : isReady
                          ? 'bg-sandstone text-espresso border border-warmborder'
                          : 'bg-warmborder text-warmmuted'
                      }`}
                    >
                      <Icon className="size-5" />
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-extrabold text-warmmuted">
                          Tahap {stage.order}
                        </span>
                        <span className="text-[11px] font-bold px-2 py-0.2 rounded-full bg-sandstone text-espresso">
                          {stage.phase}
                        </span>
                        {stage.isFree && (
                          <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded bg-lime-100 text-olive">
                            GRATIS
                          </span>
                        )}
                        {isCompleted && (
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-50 text-terracotta border border-amber-200">
                            v{stage.version}
                          </span>
                        )}
                      </div>

                      <h4 className="text-sm font-extrabold text-espresso mt-0.5">
                        {stage.title}
                      </h4>
                      <p className="text-xs text-warmmuted mt-0.5 max-w-xl">
                        {stage.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                    {isCompleted ? (
                      <span className="flex items-center gap-1 text-xs font-bold text-olive bg-lime-50 px-2.5 py-1 rounded-xl border border-lime-200">
                        <CheckCircle2 className="size-3.5" />
                        Selesai
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs font-bold text-warmmuted bg-sandstone px-2.5 py-1 rounded-xl">
                        <Clock className="size-3.5" />
                        Siap Dibuat
                      </span>
                    )}

                    {canManageProject && isCompleted && (
                      <button
                        onClick={(e) => handleRegenerateStage(stage.key, e)}
                        title="Regenerate Versi Baru"
                        className="p-2 rounded-xl bg-sandstone hover:bg-warmborder text-espresso text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer border border-warmborder"
                      >
                        <RefreshCw className="size-3.5" />
                        <span className="hidden sm:inline">Regen</span>
                      </button>
                    )}

                    <button
                      className="px-3 py-2 rounded-xl bg-terracotta hover:bg-terracotta/90 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                    >
                      <Eye className="size-3.5" />
                      <span>Buka</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Tambah Proyek Baru (Direksi / SM Only) */}
        {showNewProjectModal && (
          <div className="fixed inset-0 z-60 bg-espresso/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 border border-warmborder max-w-md w-full shadow-2xl space-y-4 animate-in zoom-in-95">
              <div className="flex items-center justify-between border-b border-warmborder pb-3">
                <h3 className="text-base font-extrabold text-espresso">Tambah Proyek Baru</h3>
                <button onClick={() => setShowNewProjectModal(false)} className="text-warmmuted hover:text-espresso">
                  <X className="size-5" />
                </button>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const fd = new FormData(e.currentTarget);
                  const name = fd.get('namaProyek') as string;
                  setToastMessage(`Proyek baru "${name}" berhasil dibuat! Memulai Jalur Proyek...`);
                  setShowNewProjectModal(false);
                }}
                className="space-y-3 text-xs"
              >
                <div>
                  <label className="font-bold text-espresso block mb-1">Nama Proyek Perumahan *</label>
                  <input
                    required
                    name="namaProyek"
                    placeholder="Contoh: The Park Townhouse Sukoharjo Phase 2"
                    className="w-full px-3 py-2 rounded-xl border border-warmborder text-espresso focus:outline-none focus:border-terracotta"
                  />
                </div>

                <div>
                  <label className="font-bold text-espresso block mb-1">Titik Koordinat GPS *</label>
                  <input
                    required
                    name="koordinat"
                    placeholder="-7.673872, 110.843978"
                    className="w-full px-3 py-2 rounded-xl border border-warmborder text-espresso focus:outline-none focus:border-terracotta"
                  />
                </div>

                <div>
                  <label className="font-bold text-espresso block mb-1">Unggah Brosur / Katalog (PDF/Gambar)</label>
                  <input
                    type="file"
                    className="w-full px-3 py-2 rounded-xl border border-warmborder text-warmmuted focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-espresso block mb-1">Unggah Pricelist (Excel/PDF)</label>
                  <input
                    type="file"
                    className="w-full px-3 py-2 rounded-xl border border-warmborder text-warmmuted focus:outline-none"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowNewProjectModal(false)}
                    className="px-4 py-2 rounded-xl bg-sandstone hover:bg-warmborder font-semibold text-espresso"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-terracotta hover:bg-terracotta/90 font-bold text-white shadow-sm"
                  >
                    Buat Proyek & Mulai Jalur
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

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
