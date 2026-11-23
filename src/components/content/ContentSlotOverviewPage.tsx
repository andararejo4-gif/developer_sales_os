import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
  ExternalLink,
  Film,
  Image as ImageIcon,
  Link2,
  Loader2,
  RefreshCw,
  Sparkles,
  AlertTriangle,
  Send,
  Share2,
} from 'lucide-react';
import type { ContentSlot } from '../../lib/content-calendar/types';
import type { ConnectedSocialAccount } from './SocialConnectModal';

export interface SlotMediaMeta {
  visualPrompt?: string;
  durationSeconds?: number;
  mediaStatus?: string;
  mediaUrls?: string[];
  mediaError?: string;
  targetMediaCount?: number;
  personaCode?: string;
  slideDeck?: Array<{
    kicker: string;
    headline: string;
    subheadline: string;
    visualPrompt?: string;
  }>;
  hermesJobIds?: Array<{
    slideIndex: number;
    jobId: string;
    status: string;
    localUrl?: string;
    error?: string;
  }>;
}

interface HermesHealth {
  ok: boolean;
  chrome_ready?: boolean;
  active_account?: string;
  account_status?: string;
  queue_size?: number;
}

interface ContentSlotOverviewPageProps {
  slot: ContentSlot;
  mediaMeta?: SlotMediaMeta;
  userEmail: string;
  userRole: string;
  socialAccounts?: ConnectedSocialAccount[];
  isPublishing?: boolean;
  onOpenSocialModal?: () => void;
  onPublishNow?: () => void;
  onBack: () => void;
  onMediaMetaUpdated: (slotId: string, nextMeta: SlotMediaMeta) => void;
  onCopyCaption: (caption: string, hashtags: string[], cta: string) => void;
  onQuickMarkUploaded: (slot: ContentSlot) => void;
  onSavePostedUrl: (slotId: string, url: string) => Promise<void>;
}

export const ContentSlotOverviewPage: React.FC<ContentSlotOverviewPageProps> = ({
  slot,
  mediaMeta,
  userEmail,
  userRole,
  socialAccounts = [],
  isPublishing = false,
  onOpenSocialModal,
  onPublishNow,
  onBack,
  onMediaMetaUpdated,
  onCopyCaption,
  onQuickMarkUploaded,
  onSavePostedUrl,
}) => {
  const [meta, setMeta] = useState<SlotMediaMeta>(mediaMeta || {});
  const [hermesHealth, setHermesHealth] = useState<HermesHealth | null>(null);
  const [busyWindow, setBusyWindow] = useState<{
    busy: boolean;
    windowLabel?: string;
    unlockTime?: string;
    reason?: string;
  } | null>(null);
  const [globalQueuePending, setGlobalQueuePending] = useState<number>(0);
  const [queueInfo, setQueueInfo] = useState<{
    activeOtherSlotForUser: {
      slotId: string;
      title: string;
      scheduledTime: string;
    } | null;
    itemsAhead: number;
    estimatedWaitMinutes: number;
    cooldownSecondsLeft: number;
  } | null>(null);
  const [carouselIdx, setCarouselIdx] = useState(0);
  const [urlInput, setUrlInput] = useState(slot.postedUrl || '');
  const [isEnqueuing, setIsEnqueuing] = useState(false);
  const [isRegeneratingBrief, setIsRegeneratingBrief] = useState(false);
  const [isSavingUrl, setIsSavingUrl] = useState(false);
  const [localOverride, setLocalOverride] = useState<{
    title?: string;
    brief?: string;
    caption?: string;
    cta?: string;
    hashtags?: string[];
  }>({});
  const [notice, setNotice] = useState<string | null>(null);

  const isVideo =
    slot.format.toLowerCase().includes('reels') ||
    slot.format.toLowerCase().includes('video');
  const isSinglePoster =
    !isVideo &&
    (slot.format.toLowerCase().includes('single') ||
      slot.format.toLowerCase().includes('poster') ||
      slot.format.toLowerCase().includes('quote'));
  const targetCount = meta.targetMediaCount || (isVideo || isSinglePoster ? 1 : 5);
  const readyUrls = meta.mediaUrls || [];
  const completedCount = readyUrls.length;
  const progressPct = Math.min(100, Math.round((completedCount / Math.max(1, targetCount)) * 100));
  const isGenerating = meta.mediaStatus === 'GENERATING';
  const isUploaded = slot.status === 'SUDAH_POSTING';

  // Sinkronkan urlInput otomatis ketika slot.postedUrl terisi (mis. dari auto-publish Zernio)
  useEffect(() => {
    if (slot.postedUrl && slot.postedUrl.trim()) {
      setUrlInput(slot.postedUrl.trim());
    }
  }, [slot.id, slot.postedUrl]);

  // Fetch status awal + polling setiap 3 detik saat GENERATING (background di server tetap jalan walau ditinggal)
  useEffect(() => {
    let active = true;
    const fetchStatus = async () => {
      try {
        const res = await fetch(
          `/api/se/content-slots/status?slotId=${encodeURIComponent(slot.id)}`,
          {
            headers: {
              'X-User-Email': userEmail,
              'X-User-Role': userRole,
            },
          }
        );
        if (!res.ok || !active) return;
        const data = await res.json();
        if (!active) return;
        if (data.hermesHealth) setHermesHealth(data.hermesHealth);
        if (data.busyWindow) setBusyWindow(data.busyWindow);
        if (typeof data.globalQueuePending === 'number') setGlobalQueuePending(data.globalQueuePending);
        if (data.queueInfo) setQueueInfo(data.queueInfo);
        if (data.slot) {
          if (typeof data.slot.posted_url === 'string' && data.slot.posted_url.trim()) {
            setUrlInput((prev) => prev.trim() || String(data.slot.posted_url).trim());
          }
          const nextMeta: SlotMediaMeta = {
            visualPrompt: data.slot.visual_prompt || meta.visualPrompt,
            durationSeconds: data.slot.duration_seconds
              ? Number(data.slot.duration_seconds)
              : meta.durationSeconds,
            mediaStatus: data.slot.media_status || 'SCHEDULED',
            mediaUrls: Array.isArray(data.slot.media_urls) ? data.slot.media_urls : [],
            mediaError: data.slot.media_error || undefined,
            targetMediaCount: data.slot.target_media_count
              ? Number(data.slot.target_media_count)
              : isVideo
              ? 1
              : 5,
            personaCode: data.slot.persona_code || undefined,
            slideDeck: Array.isArray(data.slot.slide_deck) ? data.slot.slide_deck : undefined,
            hermesJobIds: Array.isArray(data.slot.hermes_job_ids)
              ? data.slot.hermes_job_ids
              : [],
          };
          setMeta(nextMeta);
          onMediaMetaUpdated(slot.id, nextMeta);
        }
      } catch {
        /* ignore */
      }
    };

    void fetchStatus();
    const timer = setInterval(() => {
      if (isGenerating) void fetchStatus();
    }, 3000);

    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [slot.id, userEmail, userRole, isGenerating]);

  const handleStartGenerate = async () => {
    setIsEnqueuing(true);
    setNotice(null);
    try {
      const res = await fetch('/api/se/content-slots/generate-media', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Email': userEmail,
          'X-User-Role': userRole,
        },
        body: JSON.stringify({
          slotId: slot.id,
          format: slot.format,
          funnelStage: slot.funnelStage,
          title: slot.title,
          brief: slot.brief,
          visualPrompt: meta.visualPrompt || slot.brief,
          durationSeconds: meta.durationSeconds || (slot.funnelStage === 'MOFU' ? 15 : 20),
          slideDeck: meta.slideDeck,
        }),
      });
      const data = await res.json();
      if (data.busyWindow) setBusyWindow(data.busyWindow);
      if (data.queueInfo) setQueueInfo(data.queueInfo);
      if (data.slot) {
        const nextMeta: SlotMediaMeta = {
          visualPrompt: data.slot.visual_prompt || meta.visualPrompt,
          durationSeconds: data.slot.duration_seconds || meta.durationSeconds,
          mediaStatus: data.slot.media_status || 'GENERATING',
          mediaUrls: Array.isArray(data.slot.media_urls) ? data.slot.media_urls : [],
          mediaError: data.slot.media_error || undefined,
          targetMediaCount: data.slot.target_media_count || (isVideo ? 1 : 5),
          hermesJobIds: Array.isArray(data.slot.hermes_job_ids) ? data.slot.hermes_job_ids : [],
        };
        setMeta(nextMeta);
        onMediaMetaUpdated(slot.id, nextMeta);
      }
      if (!res.ok) {
        setNotice(data.error || 'Gagal mendaftarkan antrean ke Hermes.');
      } else if (data.queuedBehindOthers && data.queueInfo?.itemsAhead > 0) {
        setNotice(
          `Antrean FIFO diterima! Saat ini ada ${data.queueInfo.itemsAhead} proses milik SE lain yang masuk lebih dulu — proses Anda otomatis jalan setelahnya dengan jeda aman minimal 1 menit (estimasi tunggu ±${data.queueInfo.estimatedWaitMinutes} menit).`
        );
      } else {
        setNotice(
          'Antrean dikirim ke Hermes VNC! Proses berjalan 1-per-1 di background—aman meski halaman ini ditinggal.'
        );
      }
    } catch {
      setNotice('Gagal menghubungi server lokal.');
    } finally {
      setIsEnqueuing(false);
    }
  };

  const handleSubmitUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;
    setIsSavingUrl(true);
    await onSavePostedUrl(slot.id, urlInput.trim());
    setIsSavingUrl(false);
    setNotice('Link postingan tersimpan ke akun Anda & Laporan Harian SE!');
  };

  const displayTitle = (localOverride.title || slot.title)
    .replace(/^\[[^\]]+\]\s*/i, '')
    .replace(/\s*\(H-\d+\)$/i, '');
  const trimmedUrl = urlInput.trim();
  const normalizedExternalUrl = trimmedUrl
    ? /^https?:\/\//i.test(trimmedUrl)
      ? trimmedUrl
      : `https://${trimmedUrl}`
    : '';
  const displayBrief = localOverride.brief || slot.brief;
  const displayCaption = localOverride.caption || slot.caption;
  const displayCta = localOverride.cta || slot.cta;
  const displayHashtags = localOverride.hashtags || slot.hashtags;

  const handleRegenerateBrief = async () => {
    setIsRegeneratingBrief(true);
    setNotice(null);
    try {
      const res = await fetch('/api/se/content-slots/regenerate-brief', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Email': userEmail,
          'X-User-Role': userRole,
        },
        body: JSON.stringify({ slotId: slot.id }),
      });
      const data = await res.json();
      if (res.ok && data.ok && data.generated) {
        setLocalOverride({
          title: data.generated.title,
          brief: data.generated.brief,
          caption: data.generated.caption,
          cta: data.generated.cta,
          hashtags: data.generated.hashtags,
        });
        onMediaMetaUpdated(slot.id, {
          ...meta,
          visualPrompt: data.generated.visualPrompt,
          slideDeck: data.generated.slideDeck,
        });
        setNotice('Brief, Hook & Caption AI berhasil diperbarui sesuai TOFU/MOFU/BOFU!');
      } else {
        setNotice(data.error || 'Gagal memperbarui brief.');
      }
    } catch {
      setNotice('Koneksi gagal saat memperbarui brief.');
    } finally {
      setIsRegeneratingBrief(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#FBF9F5] overflow-x-hidden">
      {/* Sticky Top Header (True Mobile-First Hierarchy) */}
      <div className="sticky top-0 z-20 bg-white border-b border-warmborder px-4 sm:px-6 py-3 space-y-2.5 shadow-xs">
        {/* Baris 1: App Bar (Back di kiri, Status / Sosmed di kanan) */}
        <div className="flex items-center justify-between gap-2.5">
          <button
            type="button"
            onClick={onBack}
            className="min-h-[44px] px-3.5 rounded-xl bg-sandstone hover:bg-warmborder active:scale-[0.98] text-espresso text-xs font-extrabold inline-flex items-center gap-1.5 shrink-0 cursor-pointer"
          >
            <ArrowLeft className="size-4" />
            <span>Kembali</span>
          </button>

          <div className="flex items-center gap-2 min-w-0">
            {onOpenSocialModal && (
              <button
                type="button"
                onClick={onOpenSocialModal}
                className="min-h-[44px] px-3 rounded-xl bg-sandstone border border-warmborder text-espresso hover:bg-warmborder/40 text-xs font-bold inline-flex items-center gap-1.5 shrink-0 cursor-pointer whitespace-nowrap"
              >
                <Share2 className="size-3.5 text-terracotta shrink-0" />
                <span>Sosmed ({socialAccounts.length}/4)</span>
              </button>
            )}
            {isUploaded && (
              <span className="min-h-[44px] px-3 rounded-xl bg-emerald-600 text-white text-xs font-extrabold inline-flex items-center gap-1.5 shrink-0 whitespace-nowrap">
                <CheckCircle2 className="size-3.5 shrink-0" />
                <span>Sudah Upload</span>
              </span>
            )}
          </div>
        </div>

        {/* Baris 2: Metadata & Judul Lengkap (Bebas Potong Sempit) */}
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-950 text-[11px] font-extrabold">
              Hari {slot.dayNumber} · {slot.funnelStage} · {slot.scheduledTime}
            </span>
            <span className="text-xs font-bold text-warmmuted">{slot.platform}</span>
          </div>
          <h2 className="text-sm sm:text-base font-extrabold text-espresso leading-snug line-clamp-2 mt-1">
            {displayTitle}
          </h2>
        </div>

        {/* Baris 3: Primary Upload Actions (Hanya tampil jika belum diupload) */}
        {!isUploaded && (
          <div className="grid grid-cols-1 sm:flex sm:flex-wrap items-center gap-2.5 pt-0.5">
            {readyUrls.length > 0 && onPublishNow && (
              <button
                type="button"
                disabled={isPublishing}
                onClick={onPublishNow}
                className="w-full sm:w-auto min-h-[44px] px-4 py-2 rounded-xl bg-terracotta hover:bg-terracotta/90 text-white text-xs font-extrabold inline-flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-60"
              >
                {isPublishing ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                <span>{isPublishing ? 'Memposting...' : 'Posting ke Social Media Sekarang'}</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => onQuickMarkUploaded(slot)}
              className="w-full sm:w-auto min-h-[44px] px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold inline-flex items-center justify-center gap-2 cursor-pointer"
            >
              <CheckCircle2 className="size-4" />
              <span>Tandai Sudah Upload</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Content Body (Mobile 1 Kolom + Safe Bottom Padding, Desktop 12 Kolom) */}
      <div className="flex-1 overflow-y-auto px-3.5 py-4 sm:p-6 pb-28 md:pb-8">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5">
          {/* Kolom Kiri (7 cols): Progres Render + Media Preview */}
          <div className="lg:col-span-7 space-y-4 min-w-0">
            {/* Status & Progres Render Card */}
            <div className="bg-white rounded-2xl border border-warmborder p-4 sm:p-5 shadow-xs space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] font-extrabold text-espresso uppercase tracking-wider">
                      Status Render Hermes AI
                    </span>
                    {hermesHealth && (
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          hermesHealth.account_status === 'needs_login'
                            ? 'bg-amber-100 text-amber-900'
                            : hermesHealth.ok
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {hermesHealth.ok
                          ? `VNC ${hermesHealth.active_account || 'acc'} · ${
                              hermesHealth.account_status === 'needs_login'
                                ? 'Perlu Login VNC'
                                : 'Siap'
                            } · Antrean ${hermesHealth.queue_size ?? 0}`
                          : 'Hermes Offline'}
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-extrabold text-terracotta mt-1">
                    {isGenerating
                      ? isVideo
                        ? 'Sedang merender video Reels di background...'
                        : isSinglePoster
                        ? 'Sedang merender Poster Flow di background...'
                        : `Progres Carousel: ${completedCount} dari ${targetCount} Slide Selesai (${progressPct}%)`
                      : completedCount > 0
                      ? isVideo
                        ? 'Video Reels Siap Diunduh ✓'
                        : isSinglePoster
                        ? 'Poster Flow Siap Diunduh ✓'
                        : `${completedCount} / ${targetCount} Slide Carousel Siap ✓`
                      : isVideo
                      ? `Menunggu jadwal ${slot.scheduledTime} WIB (Durasi Brief: ${meta.durationSeconds || 15}s)`
                      : isSinglePoster
                      ? `Target 1 Poster Flow (Jadwal ${slot.scheduledTime} WIB)`
                      : `Target ${targetCount} Slide Carousel (Jadwal ${slot.scheduledTime} WIB)`}
                  </p>
                </div>

                <button
                  type="button"
                  disabled={
                    isEnqueuing ||
                    Boolean(busyWindow?.busy) ||
                    Boolean(queueInfo?.activeOtherSlotForUser) ||
                    isGenerating
                  }
                  onClick={handleStartGenerate}
                  className="min-h-[44px] px-4 py-2 rounded-xl bg-espresso hover:bg-espresso/90 disabled:opacity-60 text-white text-xs font-extrabold inline-flex items-center justify-center gap-2 shrink-0 cursor-pointer"
                >
                  {isEnqueuing || isGenerating ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : completedCount > 0 ? (
                    <RefreshCw className="size-4" />
                  ) : (
                    <Sparkles className="size-4 text-amber-300" />
                  )}
                  <span>
                    {busyWindow?.busy
                      ? `Terkunci s.d. ${busyWindow.unlockTime || 'Jadwal'}`
                      : queueInfo?.activeOtherSlotForUser
                      ? 'Selesaikan Slot Aktif Dulu'
                      : isEnqueuing
                      ? 'Mengirim Antrean...'
                      : isGenerating
                      ? 'Sedang Diproses...'
                      : completedCount > 0
                      ? 'Generate Ulang'
                      : 'Generate Sekarang'}
                  </span>
                </button>
              </div>

              {busyWindow?.busy && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-300 text-xs text-amber-900 font-semibold">
                  ⏳ {busyWindow.reason}
                </div>
              )}

              {queueInfo?.activeOtherSlotForUser && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-300 text-xs text-rose-900 font-semibold flex items-start gap-2">
                  <AlertTriangle className="size-4 shrink-0 text-rose-600 mt-0.5" />
                  <span>
                    Fokus ke generate yang sedang berjalan terlebih dahulu! Anda masih punya proses aktif di{' '}
                    <strong>{queueInfo.activeOtherSlotForUser.title}</strong>
                    {queueInfo.activeOtherSlotForUser.scheduledTime
                      ? ` (${queueInfo.activeOtherSlotForUser.scheduledTime})`
                      : ''}
                    . Tunggu selesai sebelum memulai generate di kalender konten ini.
                  </span>
                </div>
              )}

              {queueInfo && queueInfo.itemsAhead > 0 && (
                <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900 font-semibold">
                  🕒 Antrean FIFO Global: ada <strong>{queueInfo.itemsAhead}</strong> item dari SE lain yang masuk lebih dulu (tanpa interupsi). Giliran Anda akan diproses setelahnya dengan jeda aman minimal <strong>1 menit</strong> (estimasi tunggu ±{queueInfo.estimatedWaitMinutes} menit).
                </div>
              )}

              {globalQueuePending > 0 && (
                <p className="text-[11px] font-semibold text-warmmuted">
                  Antrean Global Sekuensial (1-per-1 · jeda antar slot min. 1 menit): <strong className="text-espresso">{globalQueuePending}</strong> item aktif/menunggu
                  {queueInfo && queueInfo.cooldownSecondsLeft > 0 ? ` · jeda aman tersisa ${queueInfo.cooldownSecondsLeft} dtk` : ''}.
                </p>
              )}

              {/* Progress Bar */}
              <div className="w-full h-2.5 bg-sandstone rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${
                    completedCount >= targetCount ? 'bg-emerald-600' : 'bg-terracotta'
                  }`}
                  style={{ width: `${isGenerating && completedCount === 0 ? 12 : progressPct}%` }}
                />
              </div>

              {hermesHealth?.account_status === 'needs_login' && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
                  <AlertTriangle className="size-4 shrink-0 text-amber-600 mt-0.5" />
                  <span>
                    Info dari Hermes (`/health`): akun <strong>{hermesHealth.active_account}</strong> di layar VNC berstatus{' '}
                    <strong>needs_login</strong>. Proses tetap berjalan di background server dan otomatis masuk ke halaman ini begitu selesai.
                  </span>
                </div>
              )}

              {meta.mediaError && (
                <p className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">
                  Catatan render terakhir: {meta.mediaError}
                </p>
              )}

              {notice && (
                <p className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 font-semibold">
                  {notice}
                </p>
              )}
            </div>

            {/* Media Preview Studio (Carousel Slider / Video Player) */}
            <div className="bg-white rounded-2xl border border-warmborder p-4 sm:p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between gap-2.5 flex-wrap">
                <h3 className="text-sm font-extrabold text-espresso flex items-center gap-2 min-w-0">
                  {isVideo ? (
                    <Film className="size-4 text-terracotta shrink-0" />
                  ) : (
                    <ImageIcon className="size-4 text-olive shrink-0" />
                  )}
                  <span className="truncate">
                    {isVideo
                      ? `Preview Video Reels (${meta.durationSeconds || 15}s)`
                      : isSinglePoster
                      ? `Preview Poster Flow (${completedCount}/${targetCount})`
                      : `Preview Carousel (${completedCount}/${targetCount} Slide)`}
                  </span>
                </h3>
                {readyUrls[carouselIdx] && (
                  isVideo ? (
                    <a
                      href={readyUrls[carouselIdx]}
                      download
                      className="min-h-[44px] px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold inline-flex items-center gap-1.5 shrink-0 whitespace-nowrap"
                    >
                      <Download className="size-3.5 shrink-0" />
                      <span>Download MP4</span>
                    </a>
                  ) : (
                    <a
                      href={readyUrls[carouselIdx]}
                      download={`poster-the-park-h${slot.dayNumber}-slide-${carouselIdx + 1}.jpg`}
                      className="min-h-[44px] px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold inline-flex items-center gap-1.5 shrink-0 whitespace-nowrap"
                    >
                      <Download className="size-3.5 shrink-0" />
                      <span>
                        {isSinglePoster ? 'Download Poster' : `Download Slide ${carouselIdx + 1}`}
                      </span>
                    </a>
                  )
                )}
              </div>

              {isVideo ? (
                readyUrls[0] ? (
                  <div className="rounded-2xl overflow-hidden bg-black border border-warmborder">
                    <video
                      src={readyUrls[0]}
                      controls
                      playsInline
                      className="w-full max-h-[460px] object-contain mx-auto"
                    />
                  </div>
                ) : (
                  <div className="aspect-[9/16] max-h-[380px] mx-auto rounded-2xl bg-sandstone/70 border border-dashed border-warmborder flex flex-col items-center justify-center p-6 text-center gap-2">
                    {isGenerating ? (
                      <>
                        <Loader2 className="size-8 text-terracotta animate-spin" />
                        <p className="text-xs font-bold text-espresso">
                          Video Reels sedang diproses di Hermes VNC...
                        </p>
                        <p className="text-[11px] text-warmmuted">
                          Anda boleh meninggalkan halaman ini, video akan otomatis muncul saat selesai.
                        </p>
                      </>
                    ) : (
                      <>
                        <Film className="size-8 text-warmmuted" />
                        <p className="text-xs font-bold text-espresso">Video Belum Digenerate</p>
                        <p className="text-[11px] text-warmmuted">
                          Klik <strong>Generate Sekarang</strong> di atas untuk langsung memulai render Reels.
                        </p>
                      </>
                    )}
                  </div>
                )
              ) : (
                <div className="space-y-3">
                  {/* Main Branded Poster Slide Frame */}
                  {readyUrls.length > 0 ? (
                    <div className="relative">
                      <div className="relative w-full aspect-[3/4] max-w-[440px] mx-auto rounded-2xl overflow-hidden bg-[#F7F5EF] shadow-lg border border-warmborder">
                        <img
                          src={readyUrls[carouselIdx] || readyUrls[0]}
                          alt={`Poster Flow Slide ${carouselIdx + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      {readyUrls.length > 1 && (
                        <>
                          <button
                            type="button"
                            onClick={() =>
                              setCarouselIdx((i) => (i - 1 + readyUrls.length) % readyUrls.length)
                            }
                            className="absolute left-2 top-1/2 -translate-y-1/2 z-20 size-11 rounded-full bg-white/95 shadow-md grid place-items-center text-espresso cursor-pointer"
                            aria-label="Slide Sebelumnya"
                          >
                            <ChevronLeft className="size-5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setCarouselIdx((i) => (i + 1) % readyUrls.length)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 z-20 size-11 rounded-full bg-white/95 shadow-md grid place-items-center text-espresso cursor-pointer"
                            aria-label="Slide Berikutnya"
                          >
                            <ChevronRight className="size-5" />
                          </button>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="h-60 rounded-2xl bg-sandstone/70 border border-dashed border-warmborder flex flex-col items-center justify-center p-6 text-center gap-2">
                      {isGenerating ? (
                        <>
                          <Loader2 className="size-8 text-terracotta animate-spin" />
                          <p className="text-xs font-bold text-espresso">
                            Menunggu Slide 1 selesai dari Hermes VNC...
                          </p>
                          <p className="text-[11px] text-warmmuted">
                            Begitu 1 slide selesai, gambar langsung muncul di sini secara bertahap.
                          </p>
                        </>
                      ) : (
                        <>
                          <ImageIcon className="size-8 text-warmmuted" />
                          <p className="text-xs font-bold text-espresso">
                            {targetCount} Slide Carousel Belum Digenerate
                          </p>
                        </>
                      )}
                    </div>
                  )}

                  {/* Thumbnail & Skeleton Progress Strip (hanya untuk Carousel multi-slide) */}
                  {targetCount > 1 && (
                    <div className="grid grid-cols-5 gap-2">
                      {Array.from({ length: targetCount }).map((_, idx) => {
                        const url = readyUrls[idx];
                        const active = idx === carouselIdx;
                        return url ? (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setCarouselIdx(idx)}
                            className={`relative aspect-[3/4] rounded-xl overflow-hidden border-2 cursor-pointer ${
                              active ? 'border-terracotta ring-2 ring-terracotta/30' : 'border-warmborder'
                            }`}
                          >
                            <img src={url} alt={`Thumb ${idx + 1}`} className="w-full h-full object-cover" />
                            <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-emerald-600 text-white text-[9px] font-extrabold">
                              {idx + 1} ✓
                            </span>
                          </button>
                        ) : (
                          <div
                            key={idx}
                            className={`aspect-[3/4] rounded-xl border border-dashed border-warmborder bg-sandstone/60 flex flex-col items-center justify-center text-[10px] font-bold text-warmmuted ${
                              isGenerating ? 'animate-pulse' : ''
                            }`}
                          >
                            <span>#{idx + 1}</span>
                            <span className="text-[9px]">{isGenerating ? 'Proses' : 'Antre'}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Kolom Kanan (5 cols): Brief, Prompt Visual AI, Caption & Upload */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white rounded-2xl border border-warmborder p-4 sm:p-5 shadow-xs space-y-3 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-extrabold text-espresso uppercase tracking-wider text-[11px]">
                  Panduan Eksekusi Konten ({slot.funnelStage})
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded-full bg-amber-50 text-terracotta border border-amber-200 text-[10px] font-extrabold">
                    {slot.funnelStage === 'TOFU'
                      ? 'Edukasi & Save'
                      : slot.funnelStage === 'MOFU'
                      ? 'Bukti & Pertimbangan'
                      : 'Penawaran & Closing'}
                  </span>
                  <button
                    type="button"
                    disabled={isRegeneratingBrief}
                    onClick={handleRegenerateBrief}
                    className="px-2.5 py-1 rounded-lg bg-sandstone hover:bg-warmborder text-espresso text-[10px] font-extrabold inline-flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    {isRegeneratingBrief ? <Loader2 className="size-3 animate-spin" /> : <Sparkles className="size-3 text-terracotta" />}
                    <span>{isRegeneratingBrief ? 'Menyusun...' : 'Perbarui Brief AI'}</span>
                  </button>
                </div>
              </div>
              <p className="text-espresso leading-relaxed">
                {displayBrief
                  .replace(/Carousel 5 slide edukasi Playbook v1\.2 untuk [^.]+\.\s*/i, '')
                  .replace(/Konten BOFU untuk [^:]+:\s*/i, '')
                  .replace(/\.\./g, '.')}
              </p>
              {Array.isArray(meta.slideDeck) && meta.slideDeck.length > 0 && (
                <div className="pt-2 border-t border-warmborder/70 space-y-1.5">
                  <p className="text-[11px] font-extrabold text-warmmuted uppercase tracking-wider">
                    Alur Cerita {meta.slideDeck.length} Slide
                  </p>
                  <div className="space-y-1">
                    {meta.slideDeck.map((sl, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-[11px] bg-[#FBF9F5] px-2.5 py-1.5 rounded-lg border border-warmborder/60">
                        <span className="font-black text-terracotta shrink-0">#{idx + 1}</span>
                        <span className="text-espresso font-semibold">
                          {sl.headline} <span className="text-warmmuted font-normal">— {sl.subheadline}</span>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {meta.visualPrompt && (
                <details className="pt-2 border-t border-warmborder/70">
                  <summary className="text-[11px] font-bold text-warmmuted hover:text-espresso cursor-pointer select-none">
                    Detail Teknis Prompt Visual AI (Opsional)
                  </summary>
                  <p className="text-warmmuted leading-relaxed mt-1.5 font-mono text-[10px] bg-sandstone/50 p-2.5 rounded-xl">
                    {meta.visualPrompt}
                  </p>
                </details>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-warmborder p-4 sm:p-5 shadow-xs space-y-3 text-xs">
              <div className="flex items-center justify-between gap-2">
                <span className="font-extrabold text-espresso uppercase tracking-wider text-[11px]">
                  Caption Siap Pakai
                </span>
                <button
                  type="button"
                  onClick={() => onCopyCaption(displayCaption, displayHashtags, displayCta)}
                  className="min-h-[40px] px-3 py-1.5 rounded-xl bg-sandstone hover:bg-warmborder text-terracotta font-bold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Copy className="size-3.5" />
                  <span>Salin Semua</span>
                </button>
              </div>
              <p className="text-espresso leading-relaxed whitespace-pre-line bg-amber-50/40 p-3 rounded-xl border border-amber-100">
                {displayCaption}
              </p>
              <p className="font-semibold text-terracotta">{displayCta}</p>
              <p className="text-[11px] text-warmmuted">{displayHashtags.join(' ')}</p>
            </div>

            <form
              onSubmit={handleSubmitUrl}
              className="bg-white rounded-2xl border border-warmborder p-4 sm:p-5 shadow-xs space-y-3 text-xs"
            >
              <div className="flex items-center justify-between gap-2">
                <label className="font-extrabold text-espresso uppercase tracking-wider text-[11px] block">
                  Lapor Link Hasil Posting
                </label>
                {isUploaded && normalizedExternalUrl && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-extrabold">
                    Terisi Otomatis ✓
                  </span>
                )}
              </div>
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://instagram.com/p/..."
                className="w-full min-h-[44px] px-3.5 rounded-xl border border-warmborder text-xs text-espresso bg-[#FBF9F5] focus:bg-white focus:outline-none focus:border-terracotta"
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {normalizedExternalUrl && (
                  <a
                    href={normalizedExternalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full min-h-[44px] px-4 py-2 rounded-xl bg-espresso hover:bg-espresso/90 text-white font-extrabold inline-flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <ExternalLink className="size-4 shrink-0" />
                    <span>Akses Link Postingan</span>
                  </a>
                )}
                <button
                  type="submit"
                  disabled={isSavingUrl}
                  className={`w-full min-h-[44px] px-4 py-2 rounded-xl bg-terracotta hover:bg-amber-600 text-white font-extrabold inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 ${
                    normalizedExternalUrl ? '' : 'sm:col-span-2'
                  }`}
                >
                  <Link2 className="size-4 shrink-0" />
                  <span>
                    {isSavingUrl
                      ? 'Menyimpan...'
                      : isUploaded
                      ? 'Perbarui Link ✓'
                      : 'Simpan Link & Tandai Upload ✓'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
