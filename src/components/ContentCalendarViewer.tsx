// ============================================================================
// CONTENT CALENDAR VIEWER - DEVELOPER SALES OS
// Full 30-Day Multi-Platform Social Media Calendar (TOFU, MOFU, BOFU)
// ============================================================================

import { useEffect, useState } from 'react';
import {
  Calendar as CalendarIcon,
  Download,
  ExternalLink,
  X,
  Filter,
  CheckCircle2,
  Clock,
  Copy,
  AlertCircle,
  Link2,
  Eye,
  Sparkles,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Film,
  Image as ImageIcon,
  Send,
  Share2,
} from 'lucide-react';
import {
  getContentCalendar,
  updateSlotPosting,
  generateContentCalendarSlots,
  initProjectCalendar,
  getWibCalendarInfo,
} from '../lib/content-calendar/calendar-generator';
import { generateContentCalendarDocx } from '../lib/exporters/content-calendar-docx';
import {
  ContentSlotOverviewPage,
  type SlotMediaMeta,
} from './content/ContentSlotOverviewPage';
import {
  SocialConnectModal,
  type ConnectedSocialAccount,
} from './content/SocialConnectModal';
import {
  getQueryParam,
  setQueryParam,
  loadPersistedState,
  savePersistedState,
} from '../lib/navigation/router';
import type {
  ContentCalendarPlan,
  ContentSlot,
  ContentTrack,
  FunnelStage,
  ContentPlatform,
  PostingStatus,
} from '../lib/content-calendar/types';

type CalendarViewTab = 'month' | 'week' | 'day';
const VALID_CAL_TABS: CalendarViewTab[] = ['month', 'week', 'day'];

interface ContentCalendarViewerProps {
  projectId?: string;
  projectName?: string;
  userEmail?: string;
  userRole?: string;
  isDemoMode?: boolean;
  variant?: 'modal' | 'page';
  onClose?: () => void;
  onDataChanged?: () => void;
}

export function ContentCalendarViewer({
  projectId = 'proj-the-park-01',
  projectName = 'The Park Townhouse Sukoharjo',
  userEmail = 'raka@andararejomakmur.co.id',
  userRole = 'SE',
  isDemoMode = false,
  variant = 'modal',
  onClose,
  onDataChanged,
}: ContentCalendarViewerProps) {
  const userScope = `${projectId}_${userEmail.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
  const wibCal = getWibCalendarInfo();
  const totalDaysInMonth = isDemoMode ? 8 : wibCal.daysInMonth;

  const [track, setTrack] = useState<ContentTrack>(() =>
    loadPersistedState<ContentTrack>(
      `devos_cal_track_${userScope}`,
      userRole === 'SE' ? 'SALES_IN_HOUSE' : 'OFFICIAL'
    )
  );
  const [calendar, setCalendar] = useState<ContentCalendarPlan | null>(() => {
    const saved = loadPersistedState<ContentCalendarPlan | null>(
      `devos_cal_plan_${userScope}`,
      null
    );
    if (saved && saved.slots.length >= totalDaysInMonth * 3) return saved;
    const base = getContentCalendar(projectId, 1, isDemoMode);
    if (!base) return null;
    const slots = generateContentCalendarSlots(
      track,
      track === 'SALES_IN_HOUSE' ? userEmail : undefined,
      wibCal.daysInMonth
    );
    return {
      ...base,
      monthPeriod: `${wibCal.monthNameId} ${wibCal.year}`,
      slots: isDemoMode ? slots.filter((s) => s.dayNumber <= 8) : slots,
      postedSlotsCount: slots.filter((s) => s.status === 'SUDAH_POSTING').length,
    };
  });

  useEffect(() => {
    const saved = loadPersistedState<ContentCalendarPlan | null>(
      `devos_cal_plan_${projectId}`,
      null
    );
    if (saved && saved.slots.length >= totalDaysInMonth * 3) {
      setCalendar(saved);
      return;
    }
    const base = getContentCalendar(projectId, 1, isDemoMode);
    if (!base) {
      setCalendar(null);
      return;
    }
    const slots = generateContentCalendarSlots(
      track,
      track === 'SALES_IN_HOUSE' ? userEmail : undefined,
      wibCal.daysInMonth
    );
    setCalendar({
      ...base,
      monthPeriod: `${wibCal.monthNameId} ${wibCal.year}`,
      slots: isDemoMode ? slots.filter((s) => s.dayNumber <= 8) : slots,
    });
  }, [projectId, track, isDemoMode, totalDaysInMonth, userEmail, wibCal.daysInMonth, wibCal.monthNameId, wibCal.year]);

  const handleInitCalendar = () => {
    const newPlan = initProjectCalendar(projectId);
    const slots = generateContentCalendarSlots(
      track,
      track === 'SALES_IN_HOUSE' ? userEmail : undefined,
      wibCal.daysInMonth
    );
    const fullPlan = {
      ...newPlan,
      monthPeriod: `${wibCal.monthNameId} ${wibCal.year}`,
      slots: isDemoMode ? slots.filter((s) => s.dayNumber <= 8) : slots,
    };
    setCalendar(fullPlan);
    savePersistedState(`devos_cal_plan_${projectId}`, fullPlan);
    setToastMessage(`Kalender konten ${wibCal.daysInMonth} hari (${wibCal.monthNameId} ${wibCal.year}) berhasil diaktifkan!`);
  };

  const [viewMode, setViewMode] = useState<CalendarViewTab>(() => {
    const urlTab = variant === 'page' ? getQueryParam('tab') : null;
    if (urlTab && VALID_CAL_TABS.includes(urlTab as CalendarViewTab)) {
      return urlTab as CalendarViewTab;
    }
    return loadPersistedState<CalendarViewTab>(`devos_cal_board_view_${userScope}`, 'day');
  });
  const [selectedFunnel, setSelectedFunnel] = useState<'all' | FunnelStage>(() =>
    loadPersistedState<'all' | FunnelStage>(`devos_cal_funnel_${userScope}`, 'all')
  );
  const [selectedPlatform, setSelectedPlatform] = useState<'all' | ContentPlatform>(() =>
    loadPersistedState<'all' | ContentPlatform>(`devos_cal_platform_${userScope}`, 'all')
  );
  const [selectedStatus, setSelectedStatus] = useState<'all' | PostingStatus>(() =>
    loadPersistedState<'all' | PostingStatus>(`devos_cal_status_${userScope}`, 'all')
  );
  const [selectedDay, setSelectedDay] = useState<number>(() => {
    const defaultToday = isDemoMode ? Math.min(8, wibCal.todayDate) : wibCal.todayDate;
    const lastAutoDate = loadPersistedState<string>(`devos_cal_autodate_${userScope}`, '');
    if (lastAutoDate !== wibCal.dateStr) {
      savePersistedState(`devos_cal_autodate_${userScope}`, wibCal.dateStr);
      savePersistedState(`devos_cal_day_${userScope}`, defaultToday);
      return defaultToday;
    }
    const savedDay = loadPersistedState<number>(`devos_cal_day_${userScope}`, defaultToday);
    return Math.max(1, Math.min(totalDaysInMonth, savedDay));
  });
  const [socialAccounts, setSocialAccounts] = useState<ConnectedSocialAccount[]>([]);
  const [maxSocialAccounts, setMaxSocialAccounts] = useState<number>(4);
  const [isSocialModalOpen, setIsSocialModalOpen] = useState(false);
  const [publishingSlotId, setPublishingSlotId] = useState<string | null>(null);

  const loadSocialAccounts = async () => {
    try {
      const res = await fetch('/api/se/social/accounts', {
        headers: {
          'X-User-Email': userEmail,
          'X-User-Role': userRole,
        },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.ok) {
          setSocialAccounts(Array.isArray(data.accounts) ? data.accounts : []);
          if (data.maxAccounts) setMaxSocialAccounts(Number(data.maxAccounts));
        }
      }
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    void loadSocialAccounts();
    const onMsg = (ev: MessageEvent) => {
      if (ev.data?.type === 'ZERNIO_CONNECTED') {
        void loadSocialAccounts();
        setToastMessage(`Akun ${String(ev.data.platform || '').toUpperCase()} berhasil terhubung!`);
      }
    };
    window.addEventListener('message', onMsg);
    return () => window.removeEventListener('message', onMsg);
  }, [userEmail, userRole]);
  const [selectedWeek, setSelectedWeek] = useState<number>(() =>
    loadPersistedState<number>(`devos_cal_week_${userScope}`, Math.ceil(wibCal.todayDate / 7))
  );
  const [activeSlotModal, setActiveSlotModal] = useState<ContentSlot | null>(null);

  // Link input state for the active slot
  const [linkInput, setLinkInput] = useState<string>(() =>
    loadPersistedState<string>(`devos_cal_link_draft_${userScope}`, '')
  );
  const [isExporting, setIsExporting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [slotMediaMap, setSlotMediaMap] = useState<Record<string, SlotMediaMeta>>({});
  const [generatingSlotId, setGeneratingSlotId] = useState<string | null>(null);
  const [previewMediaSlot, setPreviewMediaSlot] = useState<ContentSlot | null>(null);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [selectedDetailSlotId, setSelectedDetailSlotId] = useState<string | null>(() =>
    variant === 'page' ? getQueryParam('slot') : null
  );

  const openSlotDetail = (slot: ContentSlot) => {
    setSelectedDetailSlotId(slot.id);
    if (variant === 'page') setQueryParam('slot', slot.id);
  };

  const closeSlotDetail = () => {
    setSelectedDetailSlotId(null);
    if (variant === 'page') setQueryParam('slot', '');
  };

  // Sinkronisasi progres & AI brief/media unik per akun SE dari PostgreSQL
  useEffect(() => {
    let active = true;
    fetch('/api/se/content-slots', {
      headers: {
        'X-User-Email': userEmail,
        'X-User-Role': userRole,
      },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!active || !data?.ok || !Array.isArray(data.slots) || data.slots.length === 0) return;
        const nextMedia: typeof slotMediaMap = {};
        const map = new Map<string, any>();
        for (const r of data.slots) {
          const sid = String(r.slot_id);
          map.set(sid, r);
          nextMedia[sid] = {
            visualPrompt: r.visual_prompt || undefined,
            durationSeconds: r.duration_seconds ? Number(r.duration_seconds) : undefined,
            personaCode: r.persona_code || undefined,
            slideDeck: Array.isArray(r.slide_deck) ? r.slide_deck : undefined,
            mediaStatus: r.media_status || 'SCHEDULED',
            mediaUrls: Array.isArray(r.media_urls) ? r.media_urls : [],
            mediaError: r.media_error || undefined,
          };
        }
        setSlotMediaMap((prev) => ({ ...prev, ...nextMedia }));
        setCalendar((prev) => {
          if (!prev) return null;
          const nextSlots = prev.slots.map((s) => {
            const saved = map.get(s.id);
            if (!saved) return s;
            return {
              ...s,
              status: (saved.status || s.status) as PostingStatus,
              postedUrl: saved.posted_url || s.postedUrl,
              format: (saved.format || s.format) as ContentSlot['format'],
              platform: (saved.platform || s.platform) as ContentSlot['platform'],
              title: saved.title || s.title,
              brief: saved.brief || s.brief,
              caption: saved.caption || s.caption,
              cta: saved.cta || s.cta,
              hashtags: Array.isArray(saved.hashtags) && saved.hashtags.length > 0 ? saved.hashtags : s.hashtags,
            };
          });
          return {
            ...prev,
            slots: nextSlots,
            postedSlotsCount: nextSlots.filter((s) => s.status === 'SUDAH_POSTING').length,
          };
        });
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [userEmail, userRole]);

  // Generate/muat brief & prompt AI unik per akun SE untuk hari yang sedang dibuka
  useEffect(() => {
    if (track !== 'SALES_IN_HOUSE') return;
    let active = true;
    fetch('/api/se/content-slots/init-day', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Email': userEmail,
        'X-User-Role': userRole,
      },
      body: JSON.stringify({ dayNumber: selectedDay }),
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!active || !data?.ok || !Array.isArray(data.slots)) return;
        const nextMedia: typeof slotMediaMap = {};
        const byId = new Map<string, any>();
        for (const r of data.slots) {
          const sid = String(r.slot_id);
          byId.set(sid, r);
          nextMedia[sid] = {
            visualPrompt: r.visual_prompt || undefined,
            durationSeconds: r.duration_seconds ? Number(r.duration_seconds) : undefined,
            personaCode: r.persona_code || undefined,
            slideDeck: Array.isArray(r.slide_deck) ? r.slide_deck : undefined,
            mediaStatus: r.media_status || 'SCHEDULED',
            mediaUrls: Array.isArray(r.media_urls) ? r.media_urls : [],
            mediaError: r.media_error || undefined,
          };
        }
        setSlotMediaMap((prev) => ({ ...prev, ...nextMedia }));
        setCalendar((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            slots: prev.slots.map((s) => {
              const r = byId.get(s.id);
              if (!r) return s;
              return {
                ...s,
                format: (r.format || s.format) as ContentSlot['format'],
                platform: (r.platform || s.platform) as ContentSlot['platform'],
                title: r.title || s.title,
                brief: r.brief || s.brief,
                caption: r.caption || s.caption,
                cta: r.cta || s.cta,
                hashtags: Array.isArray(r.hashtags) && r.hashtags.length > 0 ? r.hashtags : s.hashtags,
              };
            }),
          };
        });
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [selectedDay, track, userEmail, userRole]);

  useEffect(() => {
    savePersistedState(`devos_cal_board_view_${userScope}`, viewMode);
    if (variant === 'page') {
      setQueryParam('tab', viewMode);
    }
  }, [viewMode, userScope, variant]);

  useEffect(() => {
    savePersistedState(`devos_cal_track_${userScope}`, track);
    savePersistedState(`devos_cal_plan_${userScope}`, calendar);
    savePersistedState(`devos_cal_funnel_${userScope}`, selectedFunnel);
    savePersistedState(`devos_cal_platform_${userScope}`, selectedPlatform);
    savePersistedState(`devos_cal_status_${userScope}`, selectedStatus);
    savePersistedState(`devos_cal_day_${userScope}`, selectedDay);
    savePersistedState(`devos_cal_week_${userScope}`, selectedWeek);
    savePersistedState(`devos_cal_link_draft_${userScope}`, linkInput);
  }, [
    userScope,
    track,
    calendar,
    selectedFunnel,
    selectedPlatform,
    selectedStatus,
    selectedDay,
    selectedWeek,
    linkInput,
  ]);

  // Switch Track (Official vs Sales In-House)
  const handleTrackChange = (newTrack: ContentTrack) => {
    setTrack(newTrack);
    const slots = generateContentCalendarSlots(newTrack, userEmail, wibCal.daysInMonth);
    setCalendar((prev) => {
      if (!prev) return null;
      const nextSlots = isDemoMode ? slots.filter((s) => s.dayNumber <= 8) : slots;
      return {
        ...prev,
        slots: nextSlots,
        postedSlotsCount: nextSlots.filter((s) => s.status === 'SUDAH_POSTING').length,
      };
    });
  };

  // Filter slots
  const filteredSlots = calendar
    ? calendar.slots.filter((slot) => {
        if (selectedFunnel !== 'all' && slot.funnelStage !== selectedFunnel) return false;
        if (selectedPlatform !== 'all' && slot.platform !== selectedPlatform) return false;
        if (selectedStatus !== 'all' && slot.status !== selectedStatus) return false;
        return true;
      })
    : [];

  // Week slices (Day 1..7, 8..14, 15..21, 22..28, 29..totalDaysInMonth)
  const weekStartDay = (selectedWeek - 1) * 7 + 1;
  const weekEndDay = Math.min(totalDaysInMonth, selectedWeek * 7);
  const weekSlots = filteredSlots.filter(
    (s) => s.dayNumber >= weekStartDay && s.dayNumber <= weekEndDay
  );

  // Day slots for Day view
  const daySlots = filteredSlots.filter((s) => s.dayNumber === selectedDay);

  // Save live posting URL + sync real-time to PostgreSQL sales_os Dashboard SE
  const handleSavePostedUrl = async (slotId: string, overrideUrl?: string) => {
    const cleanUrl = (overrideUrl ?? linkInput).trim();
    if (!cleanUrl || !calendar) return;
    const targetSlot = calendar.slots.find((s) => s.id === slotId);
    updateSlotPosting(projectId, slotId, cleanUrl, 'SUDAH_POSTING');
    setCalendar((prev) => {
      if (!prev) return null;
      const nextSlots = prev.slots.map((s) =>
        s.id === slotId ? { ...s, postedUrl: cleanUrl, status: 'SUDAH_POSTING' as const } : s
      );
      return {
        ...prev,
        slots: nextSlots,
        postedSlotsCount: nextSlots.filter((s) => s.status === 'SUDAH_POSTING').length,
      };
    });
    setActiveSlotModal(null);
    setLinkInput('');
    try {
      const headers = {
        'Content-Type': 'application/json',
        'X-User-Email': userEmail,
        'X-User-Role': userRole,
      };
      await Promise.all([
        fetch('/api/se/content-slots', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            slotId,
            status: 'SUDAH_POSTING',
            postedUrl: cleanUrl,
          }),
        }),
        fetch('/api/se/content-posting', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            slotId,
            platform: targetSlot?.platform || 'Instagram',
            postedUrl: cleanUrl,
          }),
        }),
      ]);
      if (onDataChanged) onDataChanged();
    } catch {
      /* ignore fallback */
    }
    setToastMessage('Tautan posting tersimpan ke database akun Anda & tercatat di Laporan Harian SE!');
  };

  // Tandai langsung "Sudah Upload" tanpa wajib menempel link
  const handleQuickMarkUploaded = async (slot: ContentSlot) => {
    const nextUrl = slot.postedUrl || '';
    updateSlotPosting(projectId, slot.id, nextUrl, 'SUDAH_POSTING');
    setCalendar((prev) => {
      if (!prev) return null;
      const nextSlots = prev.slots.map((s) =>
        s.id === slot.id ? { ...s, status: 'SUDAH_POSTING' as const, postedUrl: nextUrl || s.postedUrl } : s
      );
      return {
        ...prev,
        slots: nextSlots,
        postedSlotsCount: nextSlots.filter((s) => s.status === 'SUDAH_POSTING').length,
      };
    });
    try {
      const headers = {
        'Content-Type': 'application/json',
        'X-User-Email': userEmail,
        'X-User-Role': userRole,
      };
      await Promise.all([
        fetch('/api/se/content-slots', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            slotId: slot.id,
            status: 'SUDAH_POSTING',
            postedUrl: nextUrl,
          }),
        }),
        fetch('/api/se/content-posting', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            slotId: slot.id,
            platform: slot.platform,
            postedUrl: nextUrl,
          }),
        }),
      ]);
      if (onDataChanged) onDataChanged();
    } catch {
      /* ignore */
    }
    setToastMessage(`Konten "${slot.title}" ditandai Sudah Upload ✓`);
  };

  // Trigger manual/uji coba generate Foto (Carousel) atau Video (Reels) via Hermes Worker
  const handleGenerateSlotMedia = async (slot: ContentSlot) => {
    setGeneratingSlotId(slot.id);
    const meta = slotMediaMap[slot.id] || {};
    setSlotMediaMap((prev) => ({
      ...prev,
      [slot.id]: { ...prev[slot.id], mediaStatus: 'GENERATING', mediaError: undefined },
    }));
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
          title: slot.title,
          brief: slot.brief,
          visualPrompt: meta.visualPrompt || slot.brief,
          durationSeconds: meta.durationSeconds || (slot.funnelStage === 'MOFU' ? 15 : 20),
        }),
      });
      const data = await res.json();
      if (data.slot) {
        setSlotMediaMap((prev) => ({
          ...prev,
          [slot.id]: {
            ...prev[slot.id],
            mediaStatus: data.slot.media_status || 'GENERATING',
            mediaUrls: Array.isArray(data.slot.media_urls) ? data.slot.media_urls : [],
            targetMediaCount: data.slot.target_media_count,
            hermesJobIds: data.slot.hermes_job_ids,
            mediaError: data.slot.media_error || undefined,
          },
        }));
      }
      if (res.ok && data.ok) {
        setToastMessage('Antrean dikirim ke Hermes VNC! Buka halaman detail untuk pantau progres 1/5..5/5.');
        openSlotDetail(slot);
      } else {
        setToastMessage(data.error || 'Gagal menghubungi Hermes media worker.');
      }
    } catch {
      setSlotMediaMap((prev) => ({
        ...prev,
        [slot.id]: {
          ...prev[slot.id],
          mediaStatus: 'FAILED',
          mediaError: 'Koneksi ke server gagal',
        },
      }));
    } finally {
      setGeneratingSlotId(null);
    }
  };

  // Copy Caption to Clipboard
  const handleCopyCaption = (caption: string, hashtags: string[], cta: string) => {
    const fullText = `${caption}\n\n${cta}\n\n${hashtags.join(' ')}`;
    navigator.clipboard.writeText(fullText);
    setToastMessage('Draf caption, CTA, dan hashtag disalin ke clipboard!');
  };

  const [isGeneratingWeek, setIsGeneratingWeek] = useState(false);

  const handleGenerateWeek = async (weekNumber: number) => {
    setIsGeneratingWeek(true);
    try {
      const res = await fetch('/api/se/content-slots/generate-week', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Email': userEmail,
          'X-User-Role': userRole,
        },
        body: JSON.stringify({ weekNumber }),
      });
      const data = await res.json();
      if (res.ok && data.ok && Array.isArray(data.slots)) {
        const nextMedia: typeof slotMediaMap = {};
        const byId = new Map<string, any>();
        for (const r of data.slots) {
          const sid = String(r.slot_id);
          byId.set(sid, r);
          nextMedia[sid] = {
            visualPrompt: r.visual_prompt || undefined,
            durationSeconds: r.duration_seconds ? Number(r.duration_seconds) : undefined,
            personaCode: r.persona_code || undefined,
            slideDeck: Array.isArray(r.slide_deck) ? r.slide_deck : undefined,
            mediaStatus: r.media_status || 'SCHEDULED',
            mediaUrls: Array.isArray(r.media_urls) ? r.media_urls : [],
            mediaError: r.media_error || undefined,
          };
        }
        setSlotMediaMap((prev) => ({ ...prev, ...nextMedia }));
        setCalendar((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            slots: prev.slots.map((s) => {
              const r = byId.get(s.id);
              return r
                ? {
                    ...s,
                    title: r.title || s.title,
                    brief: r.brief || s.brief,
                    caption: r.caption || s.caption,
                    cta: r.cta || s.cta,
                  }
                : s;
            }),
          };
        });
        setToastMessage(`Kalender AI Minggu ke-${weekNumber} (7 hari) berhasil digenerate!`);
      }
    } catch {
      setToastMessage('Gagal membuat kalender mingguan AI.');
    } finally {
      setIsGeneratingWeek(false);
    }
  };

  // Export DOCX
  const handleExportDocx = async () => {
    if (!calendar) return;
    setIsExporting(true);
    try {
      const blob = await generateContentCalendarDocx(calendar);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Kalender_Konten_30Hari_${projectName.replace(/\s+/g, '_')}_${track}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setToastMessage('Dokumen DOCX Kalender Konten berhasil diunduh (Bersih dari token)');
    } catch {
      setToastMessage('Gagal mengunduh dokumen DOCX');
    } finally {
      setIsExporting(false);
    }
  };

  const outerClass =
    variant === 'page'
      ? 'w-full'
      : 'fixed inset-0 z-50 overflow-y-auto bg-espresso/70 backdrop-blur-sm flex justify-center p-3 md:p-6 animate-in fade-in duration-200';
  const cardClass =
    variant === 'page'
      ? 'bg-white rounded-2xl border border-warmborder w-full flex flex-col overflow-hidden shadow-xs'
      : 'bg-white rounded-3xl shadow-2xl border border-warmborder w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden';

  const handlePublishSlotNow = async (slot: ContentSlot) => {
    setPublishingSlotId(slot.id);
    try {
      const res = await fetch('/api/se/content-slots/publish', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Email': userEmail,
          'X-User-Role': userRole,
        },
        body: JSON.stringify({ slotId: slot.id, platform: slot.platform }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        if (data.code === 'SOCIAL_NOT_CONNECTED') {
          setIsSocialModalOpen(true);
        }
        setToastMessage(data.error || 'Gagal memposting ke social media.');
        return;
      }
      const nextUrl = String(data.postUrl || '');
      updateSlotPosting(projectId, slot.id, nextUrl, 'SUDAH_POSTING');
      setCalendar((prev) => {
        if (!prev) return null;
        const nextSlots = prev.slots.map((s) =>
          s.id === slot.id ? { ...s, postedUrl: nextUrl, status: 'SUDAH_POSTING' as const } : s
        );
        return {
          ...prev,
          slots: nextSlots,
          postedSlotsCount: nextSlots.filter((s) => s.status === 'SUDAH_POSTING').length,
        };
      });
      if (onDataChanged) onDataChanged();
      setToastMessage(
        `Berhasil diposting ke ${slot.platform}${data.username ? ` (@${data.username})` : ''} & link terisi otomatis!`
      );
    } catch {
      setToastMessage('Koneksi gagal saat memposting ke social media.');
    } finally {
      setPublishingSlotId(null);
    }
  };

  const selectedDetailSlot = selectedDetailSlotId && calendar
    ? calendar.slots.find((s) => s.id === selectedDetailSlotId) || null
    : null;

  if (selectedDetailSlot) {
    return (
      <div className={outerClass}>
        <div className={cardClass}>
          <ContentSlotOverviewPage
            slot={selectedDetailSlot}
            mediaMeta={slotMediaMap[selectedDetailSlot.id]}
            userEmail={userEmail}
            userRole={userRole}
            socialAccounts={socialAccounts}
            isPublishing={publishingSlotId === selectedDetailSlot.id}
            onOpenSocialModal={() => setIsSocialModalOpen(true)}
            onPublishNow={() => handlePublishSlotNow(selectedDetailSlot)}
            onBack={closeSlotDetail}
            onMediaMetaUpdated={(slotId, nextMeta) =>
              setSlotMediaMap((prev) => ({ ...prev, [slotId]: nextMeta }))
            }
            onCopyCaption={handleCopyCaption}
            onQuickMarkUploaded={handleQuickMarkUploaded}
            onSavePostedUrl={handleSavePostedUrl}
          />
          <SocialConnectModal
            isOpen={isSocialModalOpen}
            onClose={() => setIsSocialModalOpen(false)}
            accounts={socialAccounts}
            maxAccounts={maxSocialAccounts}
            userEmail={userEmail}
            userRole={userRole}
            onAccountsChanged={loadSocialAccounts}
          />
        </div>
      </div>
    );
  }

  return (
    <div className={outerClass}>
      <div className={cardClass}>
        {/* Header */}
        <div className="px-4 py-4 sm:px-6 sm:py-5 bg-sandstone/60 border-b border-warmborder flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 shrink-0">
          <div className="flex items-start sm:items-center gap-3 min-w-0">
            <div className="size-10 sm:size-11 rounded-2xl bg-terracotta text-white flex items-center justify-center shadow-sm shrink-0">
              <CalendarIcon className="size-5 sm:size-6" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base sm:text-xl font-extrabold text-espresso tracking-tight leading-snug">
                  Kalender Konten Media Sosial
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-terracotta/10 text-terracotta border border-terracotta/20 shrink-0">
                  30 Hari · 3 Slot/Hari
                </span>
                {isDemoMode && (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300 shrink-0">
                    Mode Cuplikan 25% (Demo)
                  </span>
                )}
              </div>
              <p className="text-xs text-warmmuted mt-0.5 leading-relaxed">
                {projectName} · {calendar ? `${calendar.slots.length} Slot Terjadwal (${calendar.postedSlotsCount} Sudah Diposting)` : 'Belum Ada Jadwal'}
              </p>
            </div>
            {variant === 'modal' && onClose && (
              <button
                onClick={onClose}
                aria-label="Tutup Kalender Konten"
                className="sm:hidden size-10 rounded-xl hover:bg-sandstone text-warmmuted hover:text-espresso flex items-center justify-center transition-colors cursor-pointer shrink-0"
              >
                <X className="size-5" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setIsSocialModalOpen(true)}
              className="min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-extrabold bg-espresso text-white hover:bg-espresso/90 flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm whitespace-nowrap"
            >
              <Share2 className="size-3.5 text-amber-400 shrink-0" />
              <span>Akun Sosmed ({socialAccounts.length}/{maxSocialAccounts})</span>
            </button>

            <button
              onClick={handleExportDocx}
              disabled={isExporting}
              className="min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-semibold bg-terracotta text-white hover:bg-terracotta/90 flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm disabled:opacity-50 whitespace-nowrap"
            >
              <Download className="size-3.5 shrink-0" />
              <span>{isExporting ? 'Mengekspor...' : 'Ekspor DOCX'}</span>
            </button>

            <button
              onClick={() => window.print()}
              className="min-h-[40px] px-3 py-2 rounded-xl text-xs font-semibold bg-sandstone hover:bg-warmborder text-espresso items-center gap-1 transition-colors cursor-pointer hidden md:flex whitespace-nowrap"
            >
              <ExternalLink className="size-3.5" />
              <span>Cetak PDF</span>
            </button>

            {variant === 'modal' && onClose && (
              <button
                onClick={onClose}
                aria-label="Tutup Kalender Konten"
                className="hidden sm:flex size-9 rounded-xl hover:bg-sandstone text-warmmuted hover:text-espresso items-center justify-center transition-colors cursor-pointer ml-1"
              >
                <X className="size-5" />
              </button>
            )}
          </div>
        </div>

        {/* Pengingat Jadwal Unggah Hari Ini (Berdasarkan Tanggal Asli WIB) */}
        <div className="px-4 sm:px-6 py-3 bg-amber-50/80 border-b border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shrink-0">
          <div className="flex items-start sm:items-center gap-2.5 text-xs">
            <Clock className="size-4 text-terracotta shrink-0 mt-0.5 sm:mt-0" />
            <div>
              <strong className="text-espresso">
                Jadwal Tanggal {selectedDay} {wibCal.monthNameId} {wibCal.year}
                {selectedDay === wibCal.todayDate
                  ? ' (Hari Ini)'
                  : selectedDay === wibCal.todayDate + 1
                  ? ' (Besok)'
                  : ''}:
              </strong>{' '}
              <span className="text-warmmuted">
                {(calendar?.slots ?? []).filter((s) => s.dayNumber === selectedDay && s.status !== 'SUDAH_POSTING').length} slot belum diposting · Otomatis mengikuti tanggal kalender asli ({wibCal.daysInMonth} hari di bulan {wibCal.monthNameId}).
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setSelectedDay(isDemoMode ? Math.min(8, wibCal.todayDate) : wibCal.todayDate);
              setViewMode('day');
            }}
            className="min-h-[44px] md:min-h-[34px] px-3.5 py-1.5 rounded-xl bg-espresso text-white text-xs font-bold shrink-0 cursor-pointer"
          >
            Fokus Hari Ini (Tgl {wibCal.todayDate})
          </button>
        </div>

        {/* Dual Track Switcher (Non-SE saja) & View Switcher */}
        <div className="px-4 sm:px-6 py-3 bg-white border-b border-warmborder flex flex-wrap items-center justify-between gap-3 shrink-0">
          {/* Dual Track — SE selalu akses akun pribadi SE saja */}
          {userRole !== 'SE' && (
            <div className="flex items-center gap-1.5 p-1 bg-sandstone rounded-2xl border border-warmborder">
              <button
                onClick={() => handleTrackChange('OFFICIAL')}
                className={`min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  track === 'OFFICIAL'
                    ? 'bg-espresso text-white shadow-sm'
                    : 'text-warmmuted hover:text-espresso'
                }`}
              >
                Akun Official Proyek
              </button>
              <button
                onClick={() => handleTrackChange('SALES_IN_HOUSE')}
                className={`min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  track === 'SALES_IN_HOUSE'
                    ? 'bg-espresso text-white shadow-sm'
                    : 'text-warmmuted hover:text-espresso'
                }`}
              >
                Akun Sales In-House (POV)
              </button>
            </div>
          )}

          {/* View Mode: Day (Default), Week, Month */}
          <div className="flex items-center justify-between sm:justify-start gap-2 w-full sm:w-auto">
            <span className="text-xs font-bold text-warmmuted">Tampilan:</span>
            <div className="grid grid-cols-3 sm:flex p-1 bg-sandstone rounded-xl border border-warmborder flex-1 sm:flex-none">
              {(['day', 'week', 'month'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setViewMode(m)}
                  className={`min-h-[38px] md:min-h-[32px] px-3 py-1 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer ${
                    viewMode === m
                      ? 'bg-white text-espresso shadow-sm'
                      : 'text-warmmuted hover:text-espresso'
                  }`}
                >
                  {m === 'day' ? 'Harian' : m === 'week' ? 'Mingguan' : 'Bulanan'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Filters Bar — Hanya tampil di Desktop untuk mode Mingguan & Bulanan; Mobile selalu bersih */}
        {viewMode !== 'day' && (
        <div className="hidden md:flex px-6 py-2.5 bg-sandstone/30 border-b border-warmborder flex-wrap items-center gap-3 text-xs shrink-0">
          <span className="text-warmmuted font-bold flex items-center gap-1">
            <Filter className="size-3.5 text-terracotta" />
            Filter:
          </span>

          {/* Funnel Filter */}
          <div className="flex gap-1">
            {(['all', 'TOFU', 'MOFU', 'BOFU'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setSelectedFunnel(f)}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  selectedFunnel === f
                    ? 'bg-terracotta text-white'
                    : 'bg-white border border-warmborder text-warmmuted hover:text-espresso'
                }`}
              >
                {f === 'all' ? 'Semua Funnel' : f}
              </button>
            ))}
          </div>

          {/* Platform Filter */}
          <div className="flex gap-1">
            {(['all', 'Instagram', 'TikTok', 'Facebook', 'X', 'YouTube Shorts'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setSelectedPlatform(p)}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  selectedPlatform === p
                    ? 'bg-espresso text-white'
                    : 'bg-white border border-warmborder text-warmmuted hover:text-espresso'
                }`}
              >
                {p === 'all' ? 'Semua Platform' : p}
              </button>
            ))}
          </div>

          {/* Status Filter */}
          <div className="flex gap-1 ml-auto">
            {(['all', 'SIAP', 'SUDAH_POSTING'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setSelectedStatus(s)}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  selectedStatus === s
                    ? 'bg-olive text-white'
                    : 'bg-white border border-warmborder text-warmmuted hover:text-espresso'
                }`}
              >
                {s === 'all' ? 'Semua Status' : s === 'SIAP' ? 'Siap' : 'Sudah Posting'}
              </button>
            ))}
          </div>
        </div>
        )}

        {/* Papan Kerja Kertas Berpin */}
        <div className="p-4 sm:p-6 pb-24 md:pb-6 overflow-y-auto flex-1 bg-[#F3ECE0] bg-[radial-gradient(#D9CEBE_1px,transparent_1px)] [background-size:18px_18px] space-y-6">
          {!calendar ? (
            <div className="p-12 text-center rounded-3xl bg-white border border-dashed border-warmborder space-y-4 my-4">
              <div className="size-16 rounded-2xl bg-sandstone text-warmmuted grid place-items-center mx-auto">
                <CalendarIcon className="size-8 text-warmmuted" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-espresso">Belum ada kalender konten</h3>
                <p className="text-xs text-warmmuted mt-1 max-w-md mx-auto leading-relaxed">
                  Kalender konten 30 hari x 3 slot/hari (TOFU, MOFU, BOFU) belum dibuat untuk <strong>{projectName}</strong>.
                </p>
              </div>
              <button
                type="button"
                onClick={handleInitCalendar}
                className="px-4 py-2.5 rounded-xl bg-terracotta text-white text-xs font-bold hover:bg-terracotta/90 cursor-pointer shadow-xs inline-flex items-center gap-2"
              >
                <Sparkles className="size-4" />
                <span>Buat Kalender Konten Proyek Ini</span>
              </button>
            </div>
          ) : (
            <>
              {/* VIEW 1: BULANAN (Zoom-out penuh — 1 Kertas = 1 Hari) */}
              {viewMode === 'month' && (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 bg-white/90 backdrop-blur-xs px-4 py-2.5 rounded-2xl border border-warmborder text-xs">
                    <span className="font-extrabold text-espresso">
                      Papan Bulanan {wibCal.monthNameId} {wibCal.year} (Klik tanggal untuk buka jadwal harian)
                    </span>
                    <span className="text-warmmuted font-semibold">
                      Total {totalDaysInMonth} Hari
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-4 pt-2">
                    {Array.from({ length: totalDaysInMonth }).map((_, idx) => {
                      const dayNum = idx + 1;
                      const isTodayCard = dayNum === wibCal.todayDate;
                      const daySlots = filteredSlots.filter((s) => s.dayNumber === dayNum);
                      const postedCount = daySlots.filter((s) => s.status === 'SUDAH_POSTING').length;
                      const allDone = daySlots.length > 0 && postedCount === daySlots.length;
                      const paperThemes = [
                        'bg-[#FFF8E7] border-amber-300/80',
                        'bg-[#EEF8F0] border-emerald-300/80',
                        'bg-[#FFF0E8] border-orange-300/80',
                        'bg-[#F4F1FD] border-violet-300/80',
                        'bg-[#FDF6EA] border-stone-300/80',
                      ];
                      const paperClass = allDone
                        ? 'bg-[#EAF8EE] border-emerald-400'
                        : isTodayCard
                        ? 'bg-amber-50 border-terracotta ring-2 ring-terracotta/30'
                        : paperThemes[idx % paperThemes.length];
                      const pinColors = ['bg-terracotta', 'bg-olive', 'bg-espresso', 'bg-amber-600'];

                  return (
                    <button
                      type="button"
                      key={dayNum}
                      onClick={() => {
                        setSelectedDay(dayNum);
                        setViewMode('day');
                      }}
                      style={{ animationDelay: `${(idx % 5) * 0.45}s` }}
                      className={`pinned-paper-sway relative text-left rounded-xl p-3.5 pt-5 border shadow-md hover:shadow-lg transition-all cursor-pointer flex flex-col justify-between min-h-[126px] ${paperClass}`}
                    >
                      {/* Peniti / Pin di sisi atas tengah */}
                      <span
                        aria-hidden="true"
                        className={`absolute -top-2 left-1/2 -translate-x-1/2 size-4 rounded-full border-2 border-white shadow-sm ${
                          allDone ? 'bg-emerald-600' : pinColors[idx % pinColors.length]
                        }`}
                      />

                      <div className="flex items-center justify-between gap-1 pb-2 border-b border-black/10">
                        <span className="text-xs font-black text-espresso">
                          Tgl {dayNum} {wibCal.monthNameId.slice(0, 3)}
                          {isTodayCard ? ' · Hari Ini' : ''}
                        </span>
                        <span
                          className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-full ${
                            allDone
                              ? 'bg-emerald-600 text-white'
                              : postedCount > 0
                              ? 'bg-amber-200/80 text-espresso'
                              : 'bg-white/70 text-warmmuted'
                          }`}
                        >
                          {allDone ? '✓ 3/3' : `${postedCount}/${daySlots.length || 3}`}
                        </span>
                      </div>

                      <div className="space-y-1 my-2 text-[11px] font-semibold text-espresso">
                        {(['TOFU', 'MOFU', 'BOFU'] as const).map((stage) => {
                          const s = daySlots.find((x) => x.funnelStage === stage);
                          const label = stage === 'TOFU' ? 'Pagi' : stage === 'MOFU' ? 'Siang' : 'Malam';
                          const done = s?.status === 'SUDAH_POSTING';
                          return (
                            <div key={stage} className="flex items-center justify-between gap-1">
                              <span className={done ? 'line-through text-warmmuted' : 'text-espresso'}>
                                {label}
                              </span>
                              <span className={done ? 'text-emerald-700 font-black' : 'text-warmmuted'}>
                                {done ? '✓' : '○'}
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      <span className="text-[10px] font-bold text-terracotta">
                        Buka Tgl {dayNum} &rarr;
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* VIEW 2: MINGGUAN (Zoom-out 7 Hari) */}
          {viewMode === 'week' && (
            <div className="space-y-4">
              {/* Week Selector */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white p-3 rounded-2xl border border-warmborder">
                <span className="text-xs font-bold text-espresso">Pilih Minggu ({wibCal.monthNameId}):</span>
                <div className="flex flex-wrap gap-1.5">
                  {[1, 2, 3, 4, 5].map((w) => (
                    <button
                      key={w}
                      onClick={() => setSelectedWeek(w)}
                      className={`min-h-[38px] md:min-h-0 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        selectedWeek === w
                          ? 'bg-terracotta text-white shadow-xs'
                          : 'bg-sandstone text-warmmuted hover:text-espresso'
                      }`}
                    >
                      M{w} (Tgl {(w - 1) * 7 + 1}–{Math.min(totalDaysInMonth, w * 7)})
                    </button>
                  ))}
                </div>
              </div>

              {/* Rolling 7-Day Schedule Notice untuk Minggu 2+ */}
              {selectedWeek > 1 &&
                !weekSlots.some((s) => Boolean(slotMediaMap[s.id]?.visualPrompt)) && (
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div>
                      <p className="font-extrabold text-espresso">
                        Kalender AI Minggu ke-{selectedWeek} (Hari {weekStartDay}–{weekEndDay})
                      </p>
                      <p className="text-warmmuted mt-0.5">
                        Dijadwalkan otomatis dibuat AI pada{' '}
                        <strong className="text-espresso">
                          {new Date(
                            Date.now() + ((selectedWeek - 1) * 7 - 2) * 86400000
                          ).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </strong>{' '}
                        (Hari ke-6 minggu sebelumnya) agar kualitas prompt maksimal.
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={isGeneratingWeek}
                      onClick={() => handleGenerateWeek(selectedWeek)}
                      className="min-h-[44px] md:min-h-[38px] px-4 py-2 rounded-xl bg-espresso hover:bg-espresso/90 disabled:opacity-60 text-white font-extrabold inline-flex items-center gap-2 shrink-0 cursor-pointer"
                    >
                      {isGeneratingWeek ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Sparkles className="size-4 text-amber-300" />
                      )}
                      <span>
                        {isGeneratingWeek
                          ? 'Meracik 7 Hari...'
                          : `Generate Minggu ${selectedWeek} Sekarang`}
                      </span>
                    </button>
                  </div>
                )}

              {/* Papan 7 Kertas Mingguan (4 di atas, 3 di bawah tengah agar melebar natural) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-8 gap-4 sm:gap-5 pt-2">
                {Array.from({ length: weekEndDay - weekStartDay + 1 }).map((_, idx) => {
                  const dayNum = weekStartDay + idx;
                  const dayItems = weekSlots.filter((s) => s.dayNumber === dayNum);
                  const weekThemes = [
                    'bg-[#FFF8E7] border-amber-300/80',
                    'bg-[#EEF8F0] border-emerald-300/80',
                    'bg-[#FFF0E8] border-orange-300/80',
                    'bg-[#F4F1FD] border-violet-300/80',
                  ];
                  const centerBottomOffset = idx === 4 ? 'md:col-start-2' : '';

                  return (
                    <div
                      key={dayNum}
                      style={{ animationDelay: `${idx * 0.35}s` }}
                      className={`pinned-paper-sway relative md:col-span-2 ${centerBottomOffset} rounded-2xl p-3.5 pt-5 border shadow-md flex flex-col gap-2.5 ${
                        weekThemes[idx % weekThemes.length]
                      }`}
                    >
                      <span
                        aria-hidden="true"
                        className="absolute -top-2 left-1/2 -translate-x-1/2 size-4 rounded-full bg-terracotta border-2 border-white shadow-sm"
                      />
                      <div className="flex items-center justify-between pb-1.5 border-b border-black/10">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedDay(dayNum);
                            setViewMode('day');
                          }}
                          className="text-xs font-black text-espresso hover:text-terracotta cursor-pointer"
                        >
                          Hari {dayNum} &rarr;
                        </button>
                        <span className="text-[10px] text-warmmuted font-bold">
                          {dayItems.filter((i) => i.status === 'SUDAH_POSTING').length}/{dayItems.length} ✓
                        </span>
                      </div>

                      <div className="space-y-2">
                        {dayItems.map((slot) => {
                          const isUploaded = slot.status === 'SUDAH_POSTING';
                          return (
                            <div
                              key={slot.id}
                              onClick={() => openSlotDetail(slot)}
                              className={`p-2.5 rounded-xl border shadow-xs cursor-pointer space-y-1.5 transition-all ${
                                isUploaded
                                  ? 'bg-emerald-50/90 border-emerald-300'
                                  : 'bg-white/90 border-warmborder hover:border-terracotta'
                              }`}
                            >
                              <div className="flex items-center justify-between text-[10px] font-bold">
                                <span
                                  className={`px-1.5 py-0.5 rounded ${
                                    slot.funnelStage === 'TOFU'
                                      ? 'bg-amber-100 text-amber-900'
                                      : slot.funnelStage === 'MOFU'
                                      ? 'bg-emerald-100 text-emerald-900'
                                      : 'bg-orange-100 text-orange-900'
                                  }`}
                                >
                                  {slot.funnelStage}
                                </span>
                                <span className="text-warmmuted">{slot.scheduledTime}</span>
                              </div>
                              <p className="text-xs font-extrabold text-espresso leading-snug line-clamp-2">
                                {slot.title}
                              </p>
                              <div className="flex items-center justify-between text-[10px] pt-1 border-t border-black/5">
                                <span className="text-warmmuted font-semibold">{slot.platform}</span>
                                {isUploaded ? (
                                  <span className="text-emerald-700 font-extrabold inline-flex items-center gap-0.5">
                                    <CheckCircle2 className="size-3" /> Sudah Upload
                                  </span>
                                ) : (
                                  <span className="text-terracotta font-bold">Belum Upload</span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* VIEW 3: HARIAN DEFAULT (3 Kertas Berpin Pagi, Siang, Malam) */}
          {viewMode === 'day' && (
            <div className="space-y-5">
              {/* Day Navigator (Mengikuti Tanggal Asli Bulan Aktif) */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white p-3.5 rounded-2xl border border-warmborder shadow-xs">
                <div className="flex items-center justify-between sm:justify-start gap-2">
                  <span className="text-xs font-extrabold text-espresso">
                    Tanggal {selectedDay} {wibCal.monthNameId} {wibCal.year}
                    {selectedDay === wibCal.todayDate
                      ? ' · Hari Ini'
                      : selectedDay === wibCal.todayDate + 1
                      ? ' · Besok'
                      : ''}{' '}
                    <span className="text-warmmuted font-semibold">({totalDaysInMonth} Hari)</span>
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={selectedDay <= 1}
                      onClick={() => setSelectedDay((d) => Math.max(1, d - 1))}
                      className="min-h-[36px] px-2.5 rounded-lg bg-sandstone text-xs font-bold text-espresso disabled:opacity-40 cursor-pointer"
                    >
                      &lsaquo;
                    </button>
                    <button
                      type="button"
                      disabled={selectedDay >= totalDaysInMonth}
                      onClick={() => setSelectedDay((d) => Math.min(totalDaysInMonth, d + 1))}
                      className="min-h-[36px] px-2.5 rounded-lg bg-sandstone text-xs font-bold text-espresso disabled:opacity-40 cursor-pointer"
                    >
                      &rsaquo;
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-1 overflow-x-auto max-w-full sm:max-w-lg py-1 no-scrollbar">
                  {Array.from({ length: totalDaysInMonth }).map((_, idx) => {
                    const d = idx + 1;
                    const isTodayBtn = d === wibCal.todayDate;
                    return (
                      <button
                        key={d}
                        onClick={() => setSelectedDay(d)}
                        title={`Tanggal ${d} ${wibCal.monthNameId}${isTodayBtn ? ' (Hari Ini)' : ''}`}
                        className={`relative size-8 rounded-lg text-xs font-bold shrink-0 transition-all cursor-pointer ${
                          selectedDay === d
                            ? 'bg-terracotta text-white shadow-xs'
                            : isTodayBtn
                            ? 'bg-amber-100 text-terracotta border border-terracotta/50'
                            : 'bg-sandstone text-espresso hover:bg-warmborder'
                        }`}
                      >
                        {d}
                        {isTodayBtn && selectedDay !== d && (
                          <span className="absolute -top-0.5 -right-0.5 size-2 rounded-full bg-emerald-500" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3 Kertas Memo Berpin di Atas Papan */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-3">
                {daySlots.map((slot, idx) => {
                  const isUploaded = slot.status === 'SUDAH_POSTING';
                  const paperColors =
                    slot.funnelStage === 'TOFU'
                      ? 'bg-[#FFF9E8] border-amber-300/80'
                      : slot.funnelStage === 'MOFU'
                      ? 'bg-[#EEF8F1] border-emerald-300/80'
                      : 'bg-[#FFF1EB] border-orange-300/80';
                  const pinColor =
                    isUploaded
                      ? 'bg-emerald-600'
                      : slot.funnelStage === 'TOFU'
                      ? 'bg-terracotta'
                      : slot.funnelStage === 'MOFU'
                      ? 'bg-olive'
                      : 'bg-espresso';

                  return (
                    <div
                      key={slot.id}
                      onClick={() => openSlotDetail(slot)}
                      style={{ animationDelay: `${idx * 0.65}s` }}
                      className={`pinned-paper-sway relative rounded-2xl p-5 pt-7 border shadow-md hover:shadow-lg flex flex-col justify-between space-y-4 transition-shadow cursor-pointer ${paperColors}`}
                    >
                      {/* Peniti / Pushpin di sisi atas tengah */}
                      <div
                        aria-hidden="true"
                        className="absolute -top-3 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none"
                      >
                        <span className={`size-5 rounded-full border-2 border-white shadow-md ${pinColor}`} />
                        <span className="w-1 h-2 bg-black/25 rounded-b-full -mt-0.5" />
                      </div>

                      <div>
                        {/* Badge Header */}
                        <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-black/10">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold ${
                              slot.funnelStage === 'TOFU'
                                ? 'bg-amber-200/70 text-amber-950'
                                : slot.funnelStage === 'MOFU'
                                ? 'bg-emerald-200/70 text-emerald-950'
                                : 'bg-orange-200/70 text-orange-950'
                            }`}
                          >
                            {slot.funnelStage} · {slot.scheduledTime}
                          </span>
                          {isUploaded ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-extrabold shadow-xs">
                              <CheckCircle2 className="size-3" />
                              SUDAH UPLOAD
                            </span>
                          ) : (
                            <span className="text-xs font-extrabold text-espresso">{slot.platform}</span>
                          )}
                        </div>

                        <h3 className="text-sm font-extrabold text-espresso mt-3 leading-snug">
                          {slot.title}
                        </h3>
                        <p className="text-xs font-medium text-warmmuted mt-1 italic">
                          {slot.platform} · {slot.format}
                        </p>

                        {/* Brief & Prompt AI */}
                        <div className="mt-3 p-3 rounded-xl bg-white/70 border border-black/10 text-xs space-y-1.5">
                          <div>
                            <span className="font-bold text-espresso block mb-0.5">Brief Eksekusi Visual:</span>
                            <p className="text-warmmuted leading-relaxed">{slot.brief}</p>
                          </div>
                          {slotMediaMap[slot.id]?.visualPrompt && (
                            <div className="pt-1.5 border-t border-black/5">
                              <span className="font-bold text-terracotta block text-[11px]">
                                Prompt Visual AI:
                              </span>
                              <p className="text-[11px] text-espresso/80 line-clamp-2">
                                {slotMediaMap[slot.id]?.visualPrompt}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Media AI (Carousel / Reels) */}
                        {(() => {
                          const meta = slotMediaMap[slot.id];
                          const isReady = meta?.mediaStatus === 'READY' && (meta.mediaUrls?.length || 0) > 0;
                          const isGen = generatingSlotId === slot.id || meta?.mediaStatus === 'GENERATING';
                          return (
                            <div className="mt-3 p-2.5 rounded-xl bg-espresso/5 border border-black/10 flex items-center justify-between gap-2">
                              <div className="min-w-0">
                                <p className="text-[11px] font-bold text-espresso flex items-center gap-1">
                                  {slot.format.toLowerCase().includes('reels') ? (
                                    <Film className="size-3.5 text-terracotta shrink-0" />
                                  ) : (
                                    <ImageIcon className="size-3.5 text-olive shrink-0" />
                                  )}
                                  <span className="truncate">
                                    {isReady
                                      ? 'Media AI Siap'
                                      : isGen
                                      ? 'Hermes Membuat Media...'
                                      : `Jadwal Auto: ${slot.scheduledTime}`}
                                  </span>
                                </p>
                                {meta?.durationSeconds ? (
                                  <p className="text-[10px] text-warmmuted">
                                    Durasi Brief: {meta.durationSeconds} detik
                                  </p>
                                ) : null}
                              </div>
                              {isReady ? (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openSlotDetail(slot);
                                  }}
                                  className="min-h-[38px] px-3 py-1.5 rounded-xl bg-espresso hover:bg-espresso/90 text-white text-xs font-bold flex items-center gap-1.5 shrink-0 cursor-pointer"
                                >
                                  <Eye className="size-3.5" />
                                  <span>Lihat Hasil</span>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  disabled={isGen}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (isGen) {
                                      openSlotDetail(slot);
                                    } else {
                                      void handleGenerateSlotMedia(slot);
                                    }
                                  }}
                                  className="min-h-[38px] px-3 py-1.5 rounded-xl bg-terracotta hover:bg-amber-600 disabled:opacity-80 text-white text-xs font-bold flex items-center gap-1.5 shrink-0 cursor-pointer"
                                >
                                  {isGen ? (
                                    <Loader2 className="size-3.5 animate-spin" />
                                  ) : (
                                    <Sparkles className="size-3.5" />
                                  )}
                                  <span>
                                    {isGen
                                      ? `${meta?.mediaUrls?.length || 0}/${meta?.targetMediaCount || 5}`
                                      : 'Generate'}
                                  </span>
                                </button>
                              )}
                            </div>
                          );
                        })()}

                        {/* Caption Box */}
                        <div className="mt-3 p-3 rounded-xl bg-white/85 border border-black/10 text-xs">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-terracotta">Draf Caption Siap Pakai:</span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCopyCaption(slot.caption, slot.hashtags, slot.cta);
                              }}
                              className="min-h-[32px] px-2 rounded-lg bg-sandstone/70 text-[11px] font-bold text-terracotta hover:bg-sandstone flex items-center gap-1 cursor-pointer"
                            >
                              <Copy className="size-3" />
                              Salin
                            </button>
                          </div>
                          <p className="text-espresso leading-relaxed line-clamp-4">{slot.caption}</p>
                        </div>
                      </div>

                      {/* Bottom Action: Tombol Sudah Upload + Tempel Link */}
                      <div className="pt-3 border-t border-black/10 flex flex-wrap items-center justify-between gap-2">
                        {slot.postedUrl ? (
                          <a
                            href={slot.postedUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs font-bold text-emerald-700 flex items-center gap-1 hover:underline truncate max-w-[160px]"
                          >
                            <CheckCircle2 className="size-3.5 shrink-0" />
                            <span className="truncate">{slot.postedUrl}</span>
                          </a>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleQuickMarkUploaded(slot);
                            }}
                            disabled={isUploaded}
                            className={`min-h-[44px] md:min-h-[36px] px-3.5 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-colors cursor-pointer ${
                              isUploaded
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 cursor-default'
                                : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                            }`}
                          >
                            <CheckCircle2 className="size-3.5" />
                            <span>{isUploaded ? 'Sudah Upload ✓' : 'Sudah Upload'}</span>
                          </button>
                        )}

                        {!isUploaded && (slotMediaMap[slot.id]?.mediaUrls?.length || 0) > 0 && (
                          <button
                            type="button"
                            disabled={publishingSlotId === slot.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              void handlePublishSlotNow(slot);
                            }}
                            className="min-h-[44px] md:min-h-[36px] px-3 py-1.5 rounded-xl bg-terracotta hover:bg-terracotta/90 text-white text-xs font-extrabold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs disabled:opacity-60"
                          >
                            {publishingSlotId === slot.id ? (
                              <Loader2 className="size-3.5 animate-spin" />
                            ) : (
                              <Send className="size-3.5" />
                            )}
                            <span>{publishingSlotId === slot.id ? 'Memposting...' : 'Posting ke Social Media Sekarang'}</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveSlotModal(slot);
                            setLinkInput(slot.postedUrl || '');
                          }}
                          className="min-h-[44px] md:min-h-[36px] px-3 py-1.5 rounded-xl bg-white/90 hover:bg-white border border-black/10 text-espresso text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Link2 className="size-3.5 text-terracotta" />
                          <span>{slot.postedUrl ? 'Ubah Link' : 'Tempel Link'}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Mode Demo Banner */}
          {isDemoMode && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <AlertCircle className="size-4 text-amber-700 shrink-0" />
                Mode Demo menampilkan 8 hari pertama dari total 30 hari kalender konten penuh.
              </span>
              <span className="font-bold text-terracotta">Tingkatkan Paket untuk 30 Hari &rarr;</span>
            </div>
          )}
          </>
          )}
        </div>

        {/* Modal Hubungkan Akun Social Media (Zernio) */}
        <SocialConnectModal
          isOpen={isSocialModalOpen}
          onClose={() => setIsSocialModalOpen(false)}
          accounts={socialAccounts}
          maxAccounts={maxSocialAccounts}
          userEmail={userEmail}
          userRole={userRole}
          onAccountsChanged={loadSocialAccounts}
        />

        {/* Modal Detail & Tempel Link */}
        {activeSlotModal && (
          <div className="fixed inset-0 z-60 bg-espresso/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 border border-warmborder max-w-lg w-full shadow-2xl space-y-4 animate-in zoom-in-95">
              <div className="flex items-center justify-between border-b border-warmborder pb-3">
                <div>
                  <span className="text-[11px] font-extrabold text-terracotta uppercase">
                    Hari {activeSlotModal.dayNumber} · {activeSlotModal.funnelStage} ({activeSlotModal.scheduledTime})
                  </span>
                  <h3 className="text-base font-extrabold text-espresso mt-0.5">
                    {activeSlotModal.title}
                  </h3>
                </div>
                <button
                  onClick={() => setActiveSlotModal(null)}
                  className="size-8 rounded-xl hover:bg-sandstone text-warmmuted hover:text-espresso flex items-center justify-center"
                >
                  <X className="size-5" />
                </button>
              </div>

              {/* Caption Full */}
              <div className="space-y-2 text-xs">
                <div className="p-3 bg-sandstone/50 rounded-2xl border border-warmborder">
                  <span className="font-bold text-espresso block mb-1">Draf Caption Lengkap:</span>
                  <p className="text-espresso leading-relaxed whitespace-pre-line">{activeSlotModal.caption}</p>
                  <p className="text-terracotta font-semibold mt-2">{activeSlotModal.cta}</p>
                  <p className="text-warmmuted text-[11px] mt-1">{activeSlotModal.hashtags.join(' ')}</p>
                </div>

                {/* Form Tempel Link */}
                <div className="pt-2">
                  <label className="font-bold text-espresso block mb-1">
                    Tempel Tautan Hasil Posting (Live URL Instagram / TikTok / FB):
                  </label>
                  <input
                    type="url"
                    placeholder="https://instagram.com/p/..."
                    value={linkInput}
                    onChange={(e) => setLinkInput(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-warmborder text-xs font-medium text-espresso focus:outline-none focus:border-terracotta"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-warmborder flex items-center justify-between">
                <button
                  onClick={() => handleCopyCaption(activeSlotModal.caption, activeSlotModal.hashtags, activeSlotModal.cta)}
                  className="px-3.5 py-2 rounded-xl bg-sandstone hover:bg-warmborder text-espresso text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <Copy className="size-3.5 text-terracotta" />
                  <span>Salin Caption</span>
                </button>

                <div className="flex gap-2">
                  <button
                    onClick={() => setActiveSlotModal(null)}
                    className="px-4 py-2 rounded-xl bg-sandstone text-warmmuted text-xs font-semibold"
                  >
                    Batal
                  </button>
                  <button
                    onClick={() => handleSavePostedUrl(activeSlotModal.id)}
                    className="px-4 py-2 rounded-xl bg-terracotta text-white text-xs font-bold hover:bg-terracotta/90 shadow-sm cursor-pointer"
                  >
                    Simpan Tautan
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal Lihat Hasil Media AI (Carousel Slider / Video Reels Player) */}
        {previewMediaSlot && (() => {
          const meta = slotMediaMap[previewMediaSlot.id];
          const urls = meta?.mediaUrls || [];
          const isVideo =
            previewMediaSlot.format.toLowerCase().includes('reels') ||
            previewMediaSlot.format.toLowerCase().includes('video') ||
            (urls[0] || '').endsWith('.mp4');
          const activeUrl = urls[carouselIndex] || urls[0] || '';
          return (
            <div className="fixed inset-0 z-50 bg-espresso/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
              <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 border border-warmborder shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
                <div className="flex items-start justify-between gap-3 pb-3 border-b border-warmborder">
                  <div>
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-terracotta">
                      {previewMediaSlot.funnelStage} · {previewMediaSlot.format}
                    </span>
                    <h3 className="text-sm sm:text-base font-extrabold text-espresso mt-0.5">
                      {previewMediaSlot.title}
                    </h3>
                    {isVideo && meta?.durationSeconds ? (
                      <p className="text-xs font-semibold text-olive mt-0.5">
                        Durasi Video: {meta.durationSeconds} detik (Sesuai Brief)
                      </p>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    onClick={() => setPreviewMediaSlot(null)}
                    className="size-10 rounded-xl bg-sandstone hover:bg-warmborder text-espresso grid place-items-center shrink-0 cursor-pointer"
                    aria-label="Tutup Preview Hasil"
                  >
                    <X className="size-5" />
                  </button>
                </div>

                {isVideo ? (
                  <div className="rounded-2xl overflow-hidden bg-black border border-warmborder flex justify-center">
                    <video
                      key={activeUrl}
                      src={activeUrl}
                      controls
                      playsInline
                      className="w-full max-h-[440px] object-contain"
                    />
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="relative rounded-2xl overflow-hidden bg-sandstone border border-warmborder">
                      <img
                        src={activeUrl}
                        alt={`Slide ${carouselIndex + 1}`}
                        className="w-full max-h-[420px] object-contain mx-auto"
                      />
                      {urls.length > 1 && (
                        <>
                          <button
                            type="button"
                            onClick={() =>
                              setCarouselIndex((i) => (i - 1 + urls.length) % urls.length)
                            }
                            className="absolute left-2 top-1/2 -translate-y-1/2 size-10 rounded-full bg-white/90 hover:bg-white shadow-md grid place-items-center text-espresso cursor-pointer"
                            aria-label="Slide Sebelumnya"
                          >
                            <ChevronLeft className="size-5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setCarouselIndex((i) => (i + 1) % urls.length)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 size-10 rounded-full bg-white/90 hover:bg-white shadow-md grid place-items-center text-espresso cursor-pointer"
                            aria-label="Slide Berikutnya"
                          >
                            <ChevronRight className="size-5" />
                          </button>
                        </>
                      )}
                    </div>
                    {urls.length > 1 && (
                      <div className="flex items-center justify-center gap-2">
                        {urls.map((_, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => setCarouselIndex(i)}
                            className={`h-2.5 rounded-full transition-all cursor-pointer ${
                              i === carouselIndex ? 'w-6 bg-terracotta' : 'w-2.5 bg-warmborder'
                            }`}
                          />
                        ))}
                        <span className="text-xs font-bold text-warmmuted ml-2">
                          Slide {carouselIndex + 1} / {urls.length}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                <div className="pt-2 border-t border-warmborder flex flex-wrap items-center justify-between gap-2">
                  <a
                    href={activeUrl}
                    download
                    className="min-h-[44px] px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold inline-flex items-center gap-1.5"
                  >
                    <Download className="size-4" />
                    <span>{isVideo ? 'Download Video MP4' : `Download Slide ${carouselIndex + 1}`}</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => setPreviewMediaSlot(null)}
                    className="min-h-[44px] px-4 py-2 rounded-xl bg-sandstone text-espresso text-xs font-bold cursor-pointer"
                  >
                    Tutup
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

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
