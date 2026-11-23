import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Bell,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  FileSpreadsheet,
  MapPin,
  Navigation,
  Sparkles,
  X,
} from 'lucide-react';
import type { SeQuickStatusData } from './SeGuidedTour';

export type SeNotifTarget = 'lapangan' | 'pipeline' | 'kalender' | 'rute' | 'export';

export interface SeNotificationItem {
  id: string;
  title: string;
  badge: string;
  tone: 'rose' | 'amber' | 'espresso' | 'emerald';
  summary: string;
  recommendations: string[];
  ctaLabel: string;
  target: SeNotifTarget;
  isH5Trigger?: boolean;
}

export function getWibMinutesNow(nowMs = Date.now()): number {
  const wib = new Date(nowMs + 7 * 60 * 60 * 1000);
  return wib.getUTCHours() * 60 + wib.getUTCMinutes();
}

export function buildSeRealtimeNotifications(
  quickStatus?: SeQuickStatusData,
  nowMs = Date.now()
): SeNotificationItem[] {
  if (!quickStatus) return [];
  const mins = getWibMinutesNow(nowMs);
  const list: SeNotificationItem[] = [];

  const urgentCount = Number(quickStatus.urgentLeadsCount ?? 0);
  const checkedIn = Boolean(quickStatus.checkedIn);
  const slotsUploaded = Number(quickStatus.slotsUploadedToday ?? 0);
  const slotsTotal = Number(quickStatus.slotsTotalToday ?? 3);
  const routeVisited = Number(quickStatus.routeVisitedCount ?? 0);
  const routeTotal = Number(quickStatus.routeTotalCount ?? 0);
  const hasSavedReport = Boolean(quickStatus.reportSavedAt);

  // 1. Pengingat H-5 Menit Jadwal Konten (08:55, 13:55, 19:25 WIB)
  const contentWindows = [
    { key: 'slot1', start: 8 * 60 + 55, end: 9 * 60 + 10, label: '09:00 WIB', minUploaded: 1, title: '5 Menit Lagi: Posting Konten Pagi (09:00)' },
    { key: 'slot2', start: 13 * 60 + 55, end: 14 * 60 + 10, label: '14:00 WIB', minUploaded: 2, title: '5 Menit Lagi: Posting Konten Siang (14:00)' },
    { key: 'slot3', start: 19 * 60 + 25, end: 19 * 60 + 40, label: '19:30 WIB', minUploaded: 3, title: '5 Menit Lagi: Posting Konten Malam (19:30)' },
  ];
  for (const w of contentWindows) {
    if (mins >= w.start && mins <= w.end && slotsUploaded < w.minUploaded) {
      list.push({
        id: `h5-${w.key}`,
        title: w.title,
        badge: 'H-5 Menit',
        tone: 'amber',
        summary: `Jadwal posting ${w.label} tinggal beberapa menit lagi (${slotsUploaded}/${slotsTotal} terunggah).`,
        recommendations: [
          'Buka slot konten hari ini & pastikan gambar/video sudah siap.',
          'Klik "Posting ke Social Media Sekarang" atau simpan link hasil posting.',
        ],
        ctaLabel: 'Buka Kalender Konten',
        target: 'kalender',
        isH5Trigger: true,
      });
    }
  }

  // 2. Pengingat H-5 Menit Export Laporan Harian (17:55 WIB)
  if (mins >= 17 * 60 + 55 && mins <= 18 * 60 + 15 && !hasSavedReport) {
    list.push({
      id: 'h5-export-report',
      title: '5 Menit Lagi: Batas Export Laporan (18:00)',
      badge: 'H-5 Menit',
      tone: 'amber',
      summary: 'Rekap laporan harian SE wajib diexport sebelum pukul 18:00 WIB.',
      recommendations: [
        'Pastikan absen, rute canvassing, dan postingan hari ini sudah tercatat.',
        'Export PDF atau Excel agar laporan masuk ke rekap harian SM.',
      ],
      ctaLabel: 'Export Laporan Sekarang',
      target: 'export',
      isH5Trigger: true,
    });
  }

  // 3. Lead Urgent Belum Dibalas (SLA <= 5 menit)
  if (urgentCount > 0) {
    const firstLead = quickStatus.urgentLeadPreviews?.[0];
    list.push({
      id: 'urgent-leads',
      title: `${urgentCount} Lead Belum Dibalas`,
      badge: 'Urgent SLA',
      tone: 'rose',
      summary: firstLead
        ? `Prospek ${firstLead.fullName} (${firstLead.phoneWa}) menunggu balasan Anda.`
        : `Ada ${urgentCount} lead baru yang menunggu follow-up cepat <= 5 menit.`,
      recommendations: [
        'Buka tab "Perlu Ditangani" di halaman Pipeline.',
        'Gunakan draf follow-up AI atau hubungi langsung via WhatsApp.',
      ],
      ctaLabel: 'Tangani Lead Sekarang',
      target: 'pipeline',
    });
  }

  // 4. Wajib Absen Masuk & GPS
  if (!checkedIn) {
    list.push({
      id: 'must-checkin',
      title: 'Wajib Check-In Absensi & GPS',
      badge: 'Wajib Pagi',
      tone: 'amber',
      summary: 'Anda belum melakukan Check-In presensi GPS hari ini.',
      recommendations: [
        'Lampirkan foto kehadiran lapangan jika berada di area proyek/canvassing.',
        'Tekan tombol Check-In GPS agar kehadiran tercatat otomatis.',
      ],
      ctaLabel: 'Check-In Sekarang',
      target: 'lapangan',
    });
  }

  // 5. Konten Hari Ini Belum Lengkap (umum di luar H-5)
  if (slotsUploaded < slotsTotal && !list.some((i) => i.id.startsWith('h5-slot'))) {
    list.push({
      id: 'pending-content',
      title: `Jadwal Konten Hari Ini (${slotsUploaded}/${slotsTotal})`,
      badge: 'Tugas Harian',
      tone: 'espresso',
      summary: `Masih ada ${slotsTotal - slotsUploaded} slot konten hari ini yang belum diupload.`,
      recommendations: [
        'Cek media yang sudah selesai digenerate di Kalender Konten.',
        'Posting tepat waktu sesuai jadwal TOFU (09:00), MOFU (14:00), BOFU (19:30).',
      ],
      ctaLabel: 'Lihat Kalender Konten',
      target: 'kalender',
    });
  }

  // 6. Rute Canvassing Harian
  if (routeTotal > 0 && routeVisited < routeTotal) {
    list.push({
      id: 'pending-route',
      title: `Rute Canvassing (${routeVisited}/${routeTotal} Titik)`,
      badge: 'Lapangan',
      tone: 'espresso',
      summary: `Tersisa ${routeTotal - routeVisited} titik kunjungan canvassing untuk hari ini.`,
      recommendations: [
        'Lampirkan foto kunjungan di tiap titik rute.',
        'Klik "Validasi Lokasi" di lokasi atau isi alasan jika tanpa GPS.',
      ],
      ctaLabel: 'Buka Rute Canvassing',
      target: 'rute',
    });
  }

  return list;
}

interface SeNotificationBellProps {
  quickStatus?: SeQuickStatusData;
  onNavigateTarget: (target: SeNotifTarget) => void;
  onH5ReminderTriggered?: (item: SeNotificationItem) => void;
}

export const SeNotificationBell: React.FC<SeNotificationBellProps> = ({
  quickStatus,
  onNavigateTarget,
  onH5ReminderTriggered,
}) => {
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [isOpen, setIsOpen] = useState(false);
  const [selectedNotif, setSelectedNotif] = useState<SeNotificationItem | null>(null);
  const [triggeredH5Ids, setTriggeredH5Ids] = useState<Record<string, boolean>>({});

  // Tick real-time setiap 30 detik agar pengingat H-5 menit muncul otomatis tepat waktu
  useEffect(() => {
    const timer = setInterval(() => setNowMs(Date.now()), 30_000);
    return () => clearInterval(timer);
  }, []);

  const notifications = useMemo(
    () => buildSeRealtimeNotifications(quickStatus, nowMs),
    [quickStatus, nowMs]
  );

  useEffect(() => {
    if (!onH5ReminderTriggered) return;
    const h5Item = notifications.find((n) => n.isH5Trigger && !triggeredH5Ids[n.id]);
    if (h5Item) {
      setTriggeredH5Ids((prev) => ({ ...prev, [h5Item.id]: true }));
      onH5ReminderTriggered(h5Item);
    }
  }, [notifications, triggeredH5Ids, onH5ReminderTriggered]);

  const urgentCount = notifications.filter((n) => n.tone === 'rose' || n.isH5Trigger).length;
  const totalCount = notifications.length;

  const badgeTone = (tone: SeNotificationItem['tone']) => {
    if (tone === 'rose') return 'bg-rose-100 text-rose-700 border-rose-200';
    if (tone === 'amber') return 'bg-amber-100 text-terracotta border-amber-200';
    if (tone === 'emerald') return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    return 'bg-sandstone text-espresso border-warmborder';
  };

  const iconForTarget = (target: SeNotifTarget) => {
    if (target === 'lapangan') return Navigation;
    if (target === 'pipeline') return AlertTriangle;
    if (target === 'kalender') return Calendar;
    if (target === 'rute') return MapPin;
    return FileSpreadsheet;
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        aria-label="Notifikasi Tugas Wajib SE"
        className="relative min-h-[40px] min-w-[40px] px-2.5 rounded-xl bg-sandstone hover:bg-warmborder border border-warmborder text-espresso flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
      >
        <Bell className={`size-4 ${urgentCount > 0 ? 'text-rose-600' : 'text-espresso'}`} />
        {totalCount > 0 && (
          <span
            className={`min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-black tabular-nums grid place-items-center text-white ${
              urgentCount > 0 ? 'bg-rose-600 animate-pulse' : 'bg-terracotta'
            }`}
          >
            {totalCount}
          </span>
        )}
      </button>

      {/* Panel List Notifikasi (Mobile: Bottom-Sheet dari Bawah ke Atas | Desktop: Dropdown Kanan Atas) */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-espresso/40 md:bg-transparent"
            onClick={() => setIsOpen(false)}
          />
          <div className="fixed inset-x-0 bottom-0 z-50 md:inset-auto md:right-0 md:top-12 md:w-96 bg-white rounded-t-3xl md:rounded-2xl border border-warmborder shadow-2xl overflow-hidden animate-in slide-in-from-bottom md:fade-in duration-150">
            <div className="px-4 py-3.5 border-b border-warmborder bg-sandstone/40 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Bell className="size-4 text-terracotta" />
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-espresso">
                  Tugas &amp; Pengingat ({totalCount})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="size-8 rounded-xl bg-white border border-warmborder text-espresso grid place-items-center cursor-pointer"
                aria-label="Tutup Notifikasi"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="max-h-[60dvh] md:max-h-[420px] overflow-y-auto divide-y divide-warmborder pb-[calc(0.75rem+env(safe-area-inset-bottom))] md:pb-1">
              {notifications.length === 0 ? (
                <div className="p-6 text-center space-y-2">
                  <CheckCircle2 className="size-8 text-emerald-600 mx-auto" />
                  <p className="text-xs font-extrabold text-espresso">Semua Tugas Wajib Beres ✓</p>
                  <p className="text-[11px] text-warmmuted">Tidak ada pengingat tertunda saat ini.</p>
                </div>
              ) : (
                notifications.map((item) => {
                  const Icon = iconForTarget(item.target);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setIsOpen(false);
                        setSelectedNotif(item);
                      }}
                      className="w-full min-h-[54px] px-4 py-3 text-left hover:bg-sandstone/40 active:bg-sandstone flex items-center justify-between gap-3 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div
                          className={`size-9 rounded-xl border grid place-items-center shrink-0 ${badgeTone(
                            item.tone
                          )}`}
                        >
                          <Icon className="size-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-extrabold text-espresso truncate">
                            {item.title}
                          </p>
                          <span
                            className={`inline-block mt-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${badgeTone(
                              item.tone
                            )}`}
                          >
                            {item.badge}
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="size-4 text-warmmuted shrink-0" />
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}

      {/* Modal Detail & Rekomendasi Saat Item Notifikasi Diklik */}
      {selectedNotif && (
        <div
          className="fixed inset-0 z-60 bg-espresso/60 backdrop-blur-[2px] flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => setSelectedNotif(null)}
        >
          <div
            className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl border border-warmborder shadow-2xl overflow-hidden animate-in slide-in-from-bottom sm:zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 bg-espresso text-white flex items-center justify-between gap-3">
              <div className="min-w-0">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/15 text-amber-300 text-[10px] font-extrabold uppercase tracking-wider">
                  <Clock className="size-3" />
                  {selectedNotif.badge}
                </span>
                <h3 className="text-sm font-extrabold mt-1 truncate">{selectedNotif.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedNotif(null)}
                className="size-9 rounded-xl bg-white/10 hover:bg-white/20 text-white grid place-items-center shrink-0 cursor-pointer"
                aria-label="Tutup Detail Notifikasi"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
              <p className="text-xs font-semibold text-espresso leading-relaxed">
                {selectedNotif.summary}
              </p>

              <div className="p-3.5 rounded-2xl bg-[#FBF9F5] border border-warmborder space-y-2">
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-terracotta flex items-center gap-1.5">
                  <Sparkles className="size-3.5" />
                  Rekomendasi Aksi
                </p>
                <div className="space-y-1.5">
                  {selectedNotif.recommendations.map((rec, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-espresso">
                      <CheckCircle2 className="size-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{rec}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  const target = selectedNotif.target;
                  setSelectedNotif(null);
                  onNavigateTarget(target);
                }}
                className="w-full min-h-[44px] px-4 py-2.5 rounded-xl bg-terracotta hover:bg-terracotta/90 text-white text-xs font-extrabold flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                <span>{selectedNotif.ctaLabel}</span>
                <ArrowRight className="size-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
