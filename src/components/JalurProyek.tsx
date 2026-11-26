// ============================================================================
// JALUR PROYEK (PROJECT PIPELINE) COMPONENT - DEVELOPER SALES OS
// Visual sequential roadmap & permission-guarded stage controller
// ============================================================================

import { useEffect, useState } from "react";
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
  RefreshCw,
  Eye,
  AlertCircle,
  X,
  ShieldCheck,
  Download,
  Layers,
  Plus,
  ExternalLink,
  Copy,
} from "lucide-react";
import {
  loadPersistedState,
  savePersistedState,
} from "../lib/navigation/router";
import {
  type CompanyProject,
  getProjectCoordinates,
  type ProjectGpsLocation,
} from "../lib/projects/projects-data";
import { ManageClusterCoordsModal } from "./projects/ManageClusterCoordsModal";

export interface ProjectStageItem {
  key: string;
  order: number;
  title: string;
  description: string;
  isFree: boolean;
  phase: string;
  status: "COMPLETED" | "READY" | "LOCKED";
  version: number;
  icon: typeof FileText;
}

export const PIPELINE_STAGES: ProjectStageItem[] = [
  {
    key: "input",
    order: 1,
    title: "Input Dokumen Proyek",
    description:
      "Brosur/katalog, pricelist harga bertahap, koordinat GPS cluster, fasilitas.",
    isFree: true,
    phase: "Fase 1",
    status: "COMPLETED",
    version: 1,
    icon: UploadCloud,
  },
  {
    key: "surat_cinta_99",
    order: 2,
    title: "Surat Cinta 99 Keunggulan",
    description:
      "Narasi editorial emosional & 99 poin faktual terkurasi (Gratis selamanya).",
    isFree: true,
    phase: "Fase 1",
    status: "COMPLETED",
    version: 1,
    icon: FileText,
  },
  {
    key: "riset_pasar",
    order: 3,
    title: "Riset Pasar & Analisis Kompetitor",
    description:
      "5 Persona target, fasilitas publik & kompetitor cincin radius 500m - 25km.",
    isFree: false,
    phase: "Fase 2",
    status: "COMPLETED",
    version: 1,
    icon: Compass,
  },
  {
    key: "target_penjualan",
    order: 4,
    title: "Target Penjualan 100% Sold Out",
    description:
      "Skenario kecepatan jual, reverse funnel leads, dan pembagian kuota per SE.",
    isFree: false,
    phase: "Fase 2",
    status: "COMPLETED",
    version: 1,
    icon: TrendingUp,
  },
  {
    key: "kalender_konten",
    order: 5,
    title: "Kalender Konten Media Sosial (30 Hari)",
    description:
      "Slot TOFU/MOFU/BOFU harian multi-platform untuk akun proyek & sales.",
    isFree: false,
    phase: "Fase 3",
    status: "READY",
    version: 1,
    icon: Calendar,
  },
  {
    key: "playbook",
    order: 6,
    title: "Playbook Sales (SE, TL, SM)",
    description:
      "SOP closing, penanganan keberatan, skrip follow-up, dan aturan eskalasi.",
    isFree: false,
    phase: "Fase 4",
    status: "READY",
    version: 1,
    icon: BookOpen,
  },
  {
    key: "rute_harian",
    order: 7,
    title: "Rute Harian & Kanvasing SE",
    description: "Pemetaan rute harian kanvasing B2B & titik keramaian per SE.",
    isFree: false,
    phase: "Fase 4",
    status: "READY",
    version: 1,
    icon: MapPin,
  },
  {
    key: "website_landing",
    order: 8,
    title: "Website Landing Page Proyek",
    description:
      "Landing page berkonversi tinggi dengan formulir lead terintegrasi CRM.",
    isFree: false,
    phase: "Fase 5",
    status: "READY",
    version: 1,
    icon: Globe,
  },
];

interface JalurProyekProps {
  projectName?: string;
  project?: CompanyProject;
  userRole?: string;
  isDemoMode?: boolean;
  variant?: "modal" | "page";
  onOpenStage?: (stageKey: string) => void;
  onOpenNewProject?: () => void;
  onClose?: () => void;
}

export function JalurProyek({
  projectName = "The Park Townhouse Sukoharjo",
  project,
  userRole = "DIREKSI",
  isDemoMode = false,
  variant = "modal",
  onOpenStage,
  onClose,
}: JalurProyekProps) {
  const projectId = project?.id || "the-park-sukoharjo";

  // Periksa apakah proyek memiliki data jalur proyek
  // Hanya The Park Sukoharjo yang memiliki jalur proyek awal terisi lengkap secara bawaan
  const isPark =
    projectId === "the-park-sukoharjo" || projectId === "proj-the-park-01";
  const [stages, setStages] = useState<ProjectStageItem[]>(() => {
    return loadPersistedState<ProjectStageItem[]>(
      `devos_jalur_stages_${projectId}`,
      isPark ? PIPELINE_STAGES : [],
    );
  });

  useEffect(() => {
    const loaded = loadPersistedState<ProjectStageItem[]>(
      `devos_jalur_stages_${projectId}`,
      isPark ? PIPELINE_STAGES : [],
    );
    setStages(loaded);
  }, [projectId, isPark]);

  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [isClusterCoordsModalOpen, setIsClusterCoordsModalOpen] =
    useState(false);
  const [projectCoords, setProjectCoords] = useState<ProjectGpsLocation[]>(() =>
    getProjectCoordinates(project),
  );

  useEffect(() => {
    setProjectCoords(getProjectCoordinates(project));
  }, [project]);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Role capability permissions check:
  // proyek.buat, proyek.unggah, proyek.generate are ONLY permitted for OWNER, DIREKSI, SM
  const canManageProject = [
    "DEVELOPER_OWNER",
    "DIREKSI",
    "SALES_MANAGER",
    "SM",
  ].includes(userRole);

  const handleStageClick = (stage: ProjectStageItem) => {
    if (stage.status === "LOCKED") {
      setToastMessage("Tahap ini masih terkunci.");
      return;
    }
    if (stage.key === "input") {
      setShowDocumentModal(true);
      return;
    }
    if (onOpenStage) {
      onOpenStage(stage.key);
    } else {
      setToastMessage(`Membuka ${stage.title}`);
    }
  };

  const handleInisialisasiJalur = () => {
    if (!canManageProject) {
      setToastMessage(
        "Akses ditolak: Hanya Direksi dan Sales Manager yang dapat menginisialisasi jalur proyek.",
      );
      return;
    }
    const initialStages = PIPELINE_STAGES.map((s, idx) => ({
      ...s,
      status:
        idx < 4
          ? ("COMPLETED" as const)
          : idx < 6
            ? ("READY" as const)
            : ("LOCKED" as const),
    }));
    setStages(initialStages);
    savePersistedState(`devos_jalur_stages_${projectId}`, initialStages);
    setToastMessage(`Jalur proyek untuk ${projectName} berhasil diaktifkan!`);
  };

  const handleRegenerateStage = (stageKey: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!canManageProject) {
      setToastMessage(
        "Akses ditolak: Hanya Direksi dan Sales Manager yang dapat me-regenerate tahap proyek.",
      );
      return;
    }

    setStages((prev) => {
      const next = prev.map((s) =>
        s.key === stageKey
          ? { ...s, version: s.version + 1, status: "COMPLETED" as const }
          : s,
      );
      savePersistedState(`devos_jalur_stages_${projectId}`, next);
      return next;
    });
    setToastMessage(`Tahap ${stageKey} berhasil di-regenerate ke versi baru!`);
  };

  const outerClass =
    variant === "page"
      ? "w-full"
      : "fixed inset-0 z-50 overflow-y-auto bg-espresso/70 backdrop-blur-sm flex justify-center p-3 md:p-6 animate-in fade-in duration-200";
  const cardClass =
    variant === "page"
      ? "bg-white rounded-2xl border border-warmborder w-full flex flex-col overflow-hidden shadow-xs"
      : "bg-white rounded-3xl shadow-2xl border border-warmborder w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden";

  return (
    <div className={outerClass}>
      <div className={cardClass}>
        {/* Header */}
        <div className="px-4 py-4 sm:px-6 sm:py-5 bg-sandstone/60 border-b border-warmborder flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shrink-0">
          <div className="flex items-start justify-between gap-3 min-w-0">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-terracotta text-white shrink-0">
                  Jalur Proyek
                </span>
                <h2 className="text-base sm:text-xl font-extrabold text-espresso leading-snug">
                  {projectName}
                </h2>
                {isDemoMode && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 shrink-0">
                    Demo
                  </span>
                )}
              </div>
              <p className="text-xs text-warmmuted mt-1 leading-relaxed">
                Alur berurutan 8 tahap pemasaran &amp; penjualan. Tiap tahap
                menjadi masukan tahap berikutnya.
              </p>
            </div>
            {variant === "modal" && onClose && (
              <button
                onClick={onClose}
                aria-label="Tutup Jalur Proyek"
                className="sm:hidden size-10 rounded-xl hover:bg-sandstone text-warmmuted hover:text-espresso flex items-center justify-center transition-colors cursor-pointer shrink-0"
              >
                <X className="size-5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {variant === "modal" && onClose && (
              <button
                onClick={onClose}
                aria-label="Tutup Jalur Proyek"
                className="hidden sm:flex size-9 rounded-xl hover:bg-sandstone text-warmmuted hover:text-espresso items-center justify-center transition-colors cursor-pointer ml-1"
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
              Mode Read-Only ({userRole}): Anda dapat melihat hasil tahap proyek
              yang ditugaskan. Pembuatan dan regenerasi proyek dikelola oleh
              Direksi & Sales Manager.
            </span>
          </div>
        )}

        {/* Gerbang Kesiapan G0-G3 (Blueprint v1.2 Bab 05) - Hanya muncul jika jalur sudah diinisialisasi */}
        {stages.length > 0 && (
          <div className="bg-sandstone/70 border-b border-warmborder px-6 py-3 shrink-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-espresso/70">
                Gerbang Kesiapan Operasional (Readiness Gates)
              </span>
              <span className="text-[11px] text-warmmuted">
                Keluaran sebelum gerbang lulus berstatus{" "}
                <strong className="text-espresso">
                  draf &amp; simulasi internal
                </strong>
                .
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="p-2 rounded-lg bg-surface border border-warmborder flex items-center gap-2">
                <span className="size-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <div>
                  <p className="font-bold text-xs text-espresso">
                    G0 · Draft-ready
                  </p>
                  <p className="text-[10px] text-emerald-700 font-medium">
                    Lolos (6 Draf Aktif)
                  </p>
                </div>
              </div>
              <div className="p-2 rounded-lg bg-surface border border-warmborder flex items-center gap-2">
                <span className="size-2 rounded-full bg-amber-400 shrink-0" />
                <div>
                  <p className="font-bold text-xs text-espresso">
                    G1 · Publish-ready
                  </p>
                  <p className="text-[10px] text-warmmuted">
                    Perlu PIC Approval
                  </p>
                </div>
              </div>
              <div className="p-2 rounded-lg bg-surface border border-warmborder flex items-center gap-2">
                <span className="size-2 rounded-full bg-slate-300 shrink-0" />
                <div>
                  <p className="font-bold text-xs text-espresso">
                    G2 · Demand-ready
                  </p>
                  <p className="text-[10px] text-warmmuted">
                    Iklan &amp; WA Mandat
                  </p>
                </div>
              </div>
              <div className="p-2 rounded-lg bg-surface border border-warmborder flex items-center gap-2">
                <span className="size-2 rounded-full bg-slate-300 shrink-0" />
                <div>
                  <p className="font-bold text-xs text-espresso">
                    G3 · Transaction
                  </p>
                  <p className="text-[10px] text-warmmuted">
                    Rekening Resmi Sah
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Content Stages Timeline */}
        <div className="p-6 overflow-y-auto flex-1 bg-[#FBF9F5] space-y-4">
          {stages.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-white border border-dashed border-warmborder space-y-4 my-4">
              <div className="size-16 rounded-2xl bg-sandstone text-warmmuted grid place-items-center mx-auto">
                <Layers className="size-8 text-warmmuted" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-espresso">
                  Belum ada jalur proyek
                </h3>
                <p className="text-xs text-warmmuted mt-1 max-w-md mx-auto leading-relaxed">
                  Jalur 8 tahap kesiapan pemasaran &amp; penjualan belum dibuat
                  untuk <strong>{projectName}</strong>.
                </p>
              </div>
              {canManageProject && (
                <button
                  type="button"
                  onClick={handleInisialisasiJalur}
                  className="px-4 py-2.5 rounded-xl bg-terracotta text-white text-xs font-bold hover:bg-terracotta/90 cursor-pointer shadow-xs inline-flex items-center gap-2"
                >
                  <Plus className="size-4" /> Inisialisasi Jalur Proyek
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3.5">
              {stages.map((stage) => {
                const Icon = stage.icon;
                const isCompleted = stage.status === "COMPLETED";
                const isReady = stage.status === "READY";

                return (
                  <div
                    key={stage.key}
                    onClick={() => handleStageClick(stage)}
                    className={`p-4 md:p-5 rounded-2xl border transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                      isCompleted
                        ? "bg-white border-warmborder hover:border-terracotta/60 shadow-sm"
                        : isReady
                          ? "bg-white/80 border-dashed border-warmborder hover:bg-white"
                          : "bg-sandstone/30 border-warmborder/40 opacity-60 cursor-not-allowed"
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className={`size-11 rounded-2xl flex items-center justify-center shrink-0 font-extrabold text-sm ${
                          isCompleted
                            ? "bg-terracotta text-white shadow-sm"
                            : isReady
                              ? "bg-sandstone text-espresso border border-warmborder"
                              : "bg-warmborder text-warmmuted"
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

                      <button className="px-3 py-2 rounded-xl bg-terracotta hover:bg-terracotta/90 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm">
                        <Eye className="size-3.5" />
                        <span>Buka</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Lihat Dokumen & Parameter Proyek (Tahap 1) */}
        {showDocumentModal && (
          <div className="fixed inset-0 z-60 bg-espresso/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl p-5 sm:p-7 border border-warmborder max-w-xl w-full shadow-2xl space-y-5 animate-in zoom-in-95 my-auto">
              <div className="flex items-center justify-between border-b border-warmborder pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="p-2 rounded-xl bg-terracotta/10 text-terracotta">
                    <UploadCloud className="size-5" />
                  </span>
                  <div>
                    <h3 className="text-base sm:text-lg font-extrabold text-espresso">
                      Dokumen &amp; Parameter Proyek
                    </h3>
                    <p className="text-[11px] text-warmmuted">
                      {project?.nama || projectName}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowDocumentModal(false)}
                  className="text-warmmuted hover:text-espresso p-1.5 rounded-xl hover:bg-sandstone cursor-pointer shrink-0"
                >
                  <X className="size-5" />
                </button>
              </div>

              <div className="space-y-4 text-xs">
                {/* 1. Berkas Brosur / Katalog */}
                <div className="p-3.5 rounded-2xl bg-sandstone/50 border border-warmborder space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-espresso flex items-center gap-1.5">
                      <FileText className="size-4 text-terracotta" />
                      <span>Brosur / Katalog Proyek</span>
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-lime-100 text-olive flex items-center gap-1">
                      <ShieldCheck className="size-3" /> Terverifikasi
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-warmborder">
                    <div className="min-w-0 pr-2">
                      <p className="font-bold text-espresso truncate font-mono text-[11px]">
                        {project?.katalogFile || "e-katalog_resmi.pdf"}
                      </p>
                      <p className="text-[10px] text-warmmuted mt-0.5">
                        Denah arsitektur, visual fasad 3D, dan spesifikasi
                        material
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setToastMessage(
                          `Mengunduh berkas ${project?.katalogFile || "katalog"}...`,
                        )
                      }
                      className="px-2.5 py-1.5 rounded-lg bg-sandstone hover:bg-warmborder text-espresso font-bold text-[10px] flex items-center gap-1 shrink-0 cursor-pointer"
                    >
                      <Download className="size-3" /> Unduh
                    </button>
                  </div>
                </div>

                {/* 2. Berkas Pricelist & Skema Bertahap */}
                <div className="p-3.5 rounded-2xl bg-sandstone/50 border border-warmborder space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-espresso flex items-center gap-1.5">
                      <TrendingUp className="size-4 text-terracotta" />
                      <span>Pricelist &amp; Skema Bertahap</span>
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-lime-100 text-olive flex items-center gap-1">
                      <ShieldCheck className="size-3" />{" "}
                      {project?.totalUnit || 30} Unit Terdaftar
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-warmborder">
                    <div className="min-w-0 pr-2">
                      <p className="font-bold text-espresso truncate font-mono text-[11px]">
                        {project?.pricelistFile ||
                          "pricelist_skema_bertahap.xlsx"}
                      </p>
                      <p className="text-[10px] text-warmmuted mt-0.5">
                        Harga: {project?.kisaranHarga || "Rp 450 Jt - Rp 1 M"}{" "}
                        (Cash Keras, Tempo 6/12/24 Bulan)
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setToastMessage(
                          `Mengunduh berkas ${project?.pricelistFile || "pricelist"}...`,
                        )
                      }
                      className="px-2.5 py-1.5 rounded-lg bg-sandstone hover:bg-warmborder text-espresso font-bold text-[10px] flex items-center gap-1 shrink-0 cursor-pointer"
                    >
                      <Download className="size-3" /> Unduh
                    </button>
                  </div>
                </div>

                {/* 3. Parameter Geospatial & Akses Multi-Cluster */}
                <div className="p-3.5 rounded-2xl bg-sandstone/50 border border-warmborder space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-extrabold text-espresso flex items-center gap-1.5 text-xs">
                      <MapPin className="size-4 text-terracotta" />
                      <span>
                        Titik Koordinat GPS Multi-Cluster (
                        {projectCoords.length} Titik)
                      </span>
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-terracotta">
                        Radius {project?.radiusKm || 25} km
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsClusterCoordsModalOpen(true)}
                        className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-terracotta text-white hover:bg-terracotta/90 cursor-pointer shadow-2xs flex items-center gap-1 transition-colors"
                      >
                        <Plus className="size-3" />
                        <span>Kelola Multi Titik Cluster</span>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    {projectCoords.map((loc, idx) => {
                      const mapsUrl = `https://www.google.com/maps?q=${encodeURIComponent(loc.koordinat)}`;
                      return (
                        <div
                          key={loc.id || idx}
                          className="p-2.5 bg-white rounded-xl border border-warmborder flex items-center justify-between gap-2 text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <span className="size-5 rounded-full bg-sandstone text-espresso text-[9px] font-bold flex items-center justify-center shrink-0">
                              {idx + 1}
                            </span>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-espresso text-[11px]">
                                  {loc.namaCluster}
                                </span>
                                {loc.isPrimary && (
                                  <span className="text-[8px] font-black uppercase px-1.5 py-0.2 rounded bg-terracotta text-white">
                                    Utama
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-1.5 font-mono text-[10px] text-warmmuted">
                                <span>{loc.koordinat}</span>
                                {loc.keterangan && (
                                  <>
                                    <span>&middot;</span>
                                    <span className="font-sans text-[10px] text-espresso italic">
                                      {loc.keterangan}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(loc.koordinat);
                                setToastMessage(
                                  `Koordinat ${loc.namaCluster} disalin!`,
                                );
                              }}
                              className="p-1.5 rounded-lg hover:bg-sandstone text-warmmuted hover:text-espresso cursor-pointer transition-colors"
                              title="Salin Koordinat"
                            >
                              <Copy className="size-3" />
                            </button>
                            <a
                              href={mapsUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 rounded-lg hover:bg-sandstone text-terracotta cursor-pointer transition-colors"
                              title="Buka di Google Maps"
                            >
                              <ExternalLink className="size-3" />
                            </a>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="p-2.5 bg-white rounded-xl border border-warmborder flex flex-wrap items-center justify-between gap-2 text-[11px]">
                    <div>
                      <span className="text-warmmuted">Lokasi Wilayah: </span>
                      <strong className="text-espresso">
                        {project?.lokasi || "Sukoharjo, Jawa Tengah"}
                      </strong>
                    </div>
                    <div>
                      <span className="text-warmmuted">Tipe Hunian: </span>
                      <strong className="text-terracotta">
                        {project?.tipe || "Mewah"}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* 4. Readiness Summary */}
                <div className="p-3 rounded-xl bg-lime-50 border border-lime-200 text-olive flex items-start gap-2 text-[11px]">
                  <CheckCircle2 className="size-4 shrink-0 mt-0.5" />
                  <span>
                    Seluruh dokumen proyek telah memenuhi{" "}
                    <strong>Gerbang G0 (Draft-ready)</strong> dan{" "}
                    <strong>G1 (Publish-ready)</strong>. Siap dilanjutkan ke
                    tahap Surat Cinta, Riset Pasar, dan Target Penjualan.
                  </span>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowDocumentModal(false)}
                  className="px-4 py-2 rounded-xl bg-espresso hover:bg-espresso/90 text-white font-bold text-xs cursor-pointer shadow-sm"
                >
                  Tutup Dokumen
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Kelola Multi Titik Koordinat Cluster */}
        {project && (
          <ManageClusterCoordsModal
            isOpen={isClusterCoordsModalOpen}
            onClose={() => setIsClusterCoordsModalOpen(false)}
            project={project}
            onCoordinatesUpdated={(updatedList) => {
              setProjectCoords(updatedList);
              setToastMessage("Titik koordinat cluster berhasil diperbarui.");
            }}
          />
        )}

        {/* Toast */}
        {toastMessage && (
          <div className="px-6 py-2.5 bg-espresso text-white text-xs font-medium flex items-center justify-between shrink-0">
            <span>{toastMessage}</span>
            <button
              onClick={() => setToastMessage(null)}
              className="text-amber-400 font-bold hover:underline"
            >
              Tutup
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
