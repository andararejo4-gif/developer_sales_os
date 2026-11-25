import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
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
  Smartphone,
  Sparkles,
  Users,
  X,
} from 'lucide-react';
import type { SeQuickStatusData } from './SeGuidedTour';

export type SeNotifTarget = 'lapangan' | 'pipeline' | 'kalender' | 'rute' | 'export' | 'profile';

export interface SeNotificationExtra {
  leadsTodayValidCount?: number;
  needsCompletionLeadsCount?: number;
  waConnectionStatus?: string;
  totpEnabled?: boolean;
}

export interface SeNotificationItem {
  id: string;
  title: string;
  badge: string;
  tone: 'rose' | 'amber' | 'espresso' | 'emerald';
  summary: string;
  details: Array<{ label: string; value: string }>;
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
  nowMs = Date.now(),
  extra?: SeNotificationExtra
): SeNotificationItem[] {
  if (!quickStatus) return [];
  const mins = getWibMinutesNow(nowMs);
  const list: SeNotificationItem[] = [];

  if (extra?.totpEnabled === false) {
    list.push({
      id: 'recommend-totp-2fa',
      title: 'Rekomendasi Keamanan: Aktifkan 2FA (TOTP)',
      badge: 'Keamanan Akun',
      tone: 'amber',
      summary: 'Akun Anda belum mengaktifkan autentikasi 2 faktor (Google Authenticator). Aktifkan gratis di halaman Profil.',
      details: [
        { label: 'Status 2FA', value: 'Nonaktif (Default)' },
        { label: 'Metode', value: 'Google Authenticator / Authy (Rp0)' },
      ],
      recommendations: [
        'Klik tombol di bawah untuk membuka halaman Profil.',
        'Scan QR Code di aplikasi Google Authenticator agar akun lebih aman.',
      ],
      ctaLabel: 'Aktifkan TOTP di Profil →',
      target: 'profile',
    });
  }

  const urgentCount = Number(quickStatus.urgentLeadsCount ?? 0);
  const checkedIn = Boolean(quickStatus.checkedIn);
  const checkedOut = Boolean(quickStatus.checkedOut);
  const slotsUploaded = Number(quickStatus.slotsUploadedToday ?? 0);
  const slotsTotal = Number(quickStatus.slotsTotalToday ?? 3);
  const slotsReady = Number(quickStatus.slotsReadyToPostToday ?? 0);
  const routeVisited = Number(quickStatus.routeVisitedCount ?? 0);
  const routeTotal = Number(quickStatus.routeTotalCount ?? 0);
  const hasSavedReport = Boolean(quickStatus.reportSavedAt);
  const leadsToday = Number(extra?.leadsTodayValidCount ?? 0);
  const needsCompletion = Number(extra?.needsCompletionLeadsCount ?? 0);
  const waStatus = extra?.waConnectionStatus || 'DISCONNECTED';

  // 1. Pengingat H-5 Menit Jadwal Konten (08:55, 13:55, 19:25 WIB)
  const contentWindows = [
    {
      key: 'slot1',
      start: 8 * 60 + 55,
      end: 9 * 60 + 10,
      label: '09:00 WIB',
      funnel: 'TOFU · Edukasi',
      minUploaded: 1,
      title: '5 Menit Lagi: Posting Konten Pagi (09:00)',
    },
    {
      key: 'slot2',
      start: 13 * 60 + 55,
      end: 14 * 60 + 10,
      label: '14:00 WIB',
      funnel: 'MOFU · Pertimbangan',
      minUploaded: 2,
      title: '5 Menit Lagi: Posting Konten Siang (14:00)',
    },
    {
      key: 'slot3',
      start: 19 * 60 + 25,
      end: 19 * 60 + 40,
      label: '19:30 WIB',
      funnel: 'BOFU · Penawaran',
      minUploaded: 3,
      title: '5 Menit Lagi: Posting Konten Malam (19:30)',
    },
  ];
  for (const w of contentWindows) {
    if (mins >= w.start && mins <= w.end && slotsUploaded < w.minUploaded) {
      list.push({
        id: `h5-${w.key}`,
        title: w.title,
        badge: 'H-5 Menit',
        tone: 'amber',
        summary: `Jadwal posting ${w.label} (${w.funnel}) tinggal beberapa menit lagi. Pastikan konten langsung terunggah tepat waktu.`,
        details: [
          { label: 'Jadwal Target', value: w.label },
          { label: 'Progres Hari Ini', value: `${slotsUploaded} dari ${slotsTotal} slot terposting` },
          { label: 'Media Siap', value: `${slotsReady} slot siap diposting` },
        ],
        recommendations: [
          'Buka slot konten hari ini & cek hasil gambar/video Hermes AI.',
          'Klik "Posting ke Social Media Sekarang" agar link postingan otomatis tercatat.',
          'Jika posting manual, simpan link postingan di form Lapor Link Hasil Posting.',
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
      summary: 'Rekap 13 item Laporan Harian SE wajib diexport sebelum pukul 18:00 WIB untuk evaluasi SM.',
      details: [
        { label: 'Batas Waktu', value: '18:00 WIB (Hari Ini)' },
        { label: 'Konten Terposting', value: `${slotsUploaded}/${slotsTotal} slot` },
        { label: 'Rute Selesai', value: `${routeVisited}/${routeTotal || 4} titik` },
      ],
      recommendations: [
        'Pastikan absen masuk/keluar dan bukti foto rute sudah lengkap.',
        'Export Laporan ke format PDF atau Excel (.xls) sekarang.',
      ],
      ctaLabel: 'Export Laporan Sekarang',
      target: 'export',
      isH5Trigger: true,
    });
  }

  // 3. Lead Urgent Belum Dibalas (SLA <= 5 menit)
  if (urgentCount > 0) {
    const previews = quickStatus.urgentLeadPreviews || [];
    const leadNames = previews.map((p) => `${p.fullName} (${p.phoneWa})`).join(', ');
    list.push({
      id: 'urgent-leads',
      title: `${urgentCount} Lead Belum Dibalas (SLA ≤ 5m)`,
      badge: 'Urgent SLA',
      tone: 'rose',
      summary: `Terdapat ${urgentCount} prospek baru/WhatsApp masuk yang belum mendapat balasan dari Anda.`,
      details: [
        { label: 'Jumlah Urgent', value: `${urgentCount} prospek` },
        { label: 'Standar SLA', value: 'Maksimal 5 menit respon pertama' },
        ...(leadNames ? [{ label: 'Daftar Prospek', value: leadNames }] : []),
      ],
      recommendations: [
        'Buka tab "Perlu Ditangani" di halaman Pipeline.',
        'Kirim sapaan ramah menggunakan draf follow-up AI atau hubungi via WhatsApp.',
        'Lengkapi skor BANT (0–12) setelah mendapat respons awal.',
      ],
      ctaLabel: 'Tangani Lead Sekarang',
      target: 'pipeline',
    });
  }

  // 4. Wajib Check-In / Check-Out GPS
  if (!checkedIn) {
    list.push({
      id: 'must-checkin',
      title: 'Wajib Check-In Absensi & GPS',
      badge: 'Wajib Pagi',
      tone: 'amber',
      summary: 'Anda belum melakukan Check-In presensi GPS hari ini. Kehadiran & koordinat awal belum tercatat.',
      details: [
        { label: 'Status Absen', value: 'Belum Check-In' },
        { label: 'Bukti Wajib', value: 'Koordinat GPS + Foto Lapangan' },
      ],
      recommendations: [
        'Buka menu Absen, GPS, Call lalu lampirkan foto lokasi Anda.',
        'Tekan Check-In GPS & izinkan akses lokasi di browser.',
      ],
      ctaLabel: 'Check-In Sekarang',
      target: 'lapangan',
    });
  } else if (!checkedOut && mins >= 16 * 60 + 55) {
    list.push({
      id: 'must-checkout',
      title: 'Wajib Check-Out Selesai Tugas',
      badge: 'Sore ≥ 17:00',
      tone: 'amber',
      summary: 'Jangan lupa melakukan Check-Out GPS setelah aktivitas lapangan hari ini selesai.',
      details: [
        { label: 'Check-In Masuk', value: quickStatus.checkInTime ? new Date(quickStatus.checkInTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB' : 'Sudah' },
        { label: 'Status Pulang', value: 'Belum Check-Out' },
      ],
      recommendations: [
        'Pastikan seluruh titik rute & log panggilan sudah tersimpan.',
        'Tekan tombol Check-Out di menu Absen, GPS, Call.',
      ],
      ctaLabel: 'Check-Out Sekarang',
      target: 'lapangan',
    });
  }

  // 5. Lead Perlu Dilengkapi Data (AI Clarity Check)
  if (needsCompletion > 0) {
    list.push({
      id: 'leads-incomplete',
      title: `${needsCompletion} Lead Perlu Dilengkapi Datanya`,
      badge: 'Validasi AI',
      tone: 'amber',
      summary: `AI mendeteksi ${needsCompletion} data prospek masih kurang lengkap (nama, domisili, atau catatan kebutuhan).`,
      details: [
        { label: 'Jumlah Lead', value: `${needsCompletion} prospek` },
        { label: 'Dampak', value: 'Memengaruhi akurasi skor & rekomendasi follow-up AI' },
      ],
      recommendations: [
        'Buka filter "Perlu Dilengkapi" di halaman Pipeline.',
        'Klik Edit pada lead terkait lalu lengkapi domisili, minat unit, & catatan.',
      ],
      ctaLabel: 'Lengkapi Data Lead',
      target: 'pipeline',
    });
  }

  // 6. Konten Hari Ini Belum Lengkap
  if (slotsUploaded < slotsTotal && !list.some((i) => i.id.startsWith('h5-slot'))) {
    list.push({
      id: 'pending-content',
      title: `Jadwal Konten Hari Ini (${slotsUploaded}/${slotsTotal} Selesai)`,
      badge: slotsReady > 0 ? `${slotsReady} Siap Post` : 'Konten Harian',
      tone: slotsReady > 0 ? 'amber' : 'espresso',
      summary: `Masih tersisa ${slotsTotal - slotsUploaded} dari ${slotsTotal} slot konten harian (09:00 TOFU, 14:00 MOFU, 19:30 BOFU) yang perlu diposting.`,
      details: [
        { label: 'Sudah Diposting', value: `${slotsUploaded} dari ${slotsTotal} slot` },
        { label: 'Media Siap Posting', value: `${slotsReady} slot siap` },
        { label: 'Slot Jadwal Wajib', value: '09:00 WIB · 14:00 WIB · 19:30 WIB' },
      ],
      recommendations: [
        'Cek media Carousel / Poster / Reels yang sudah selesai dirender Hermes AI.',
        'Gunakan tombol "Posting ke Social Media Sekarang" agar link postingan otomatis tersimpan.',
      ],
      ctaLabel: 'Buka Kalender Konten',
      target: 'kalender',
    });
  }

  // 7. Rute Canvassing Harian
  if (routeTotal > 0 && routeVisited < routeTotal) {
    list.push({
      id: 'pending-route',
      title: `Rute Canvassing (${routeVisited}/${routeTotal} Titik)`,
      badge: 'Lapangan',
      tone: 'espresso',
      summary: `Masih ada ${routeTotal - routeVisited} titik kunjungan canvassing (${quickStatus.routeDayName || 'Hari Ini'}) yang belum divalidasi.`,
      details: [
        { label: 'Titik Selesai', value: `${routeVisited} dari ${routeTotal} titik` },
        { label: 'Syarat Wajib', value: 'Foto kunjungan + Validasi Lokasi GPS (atau alasan)' },
      ],
      recommendations: [
        'Ambil foto bukti kunjungan di lokasi tujuan.',
        'Klik "Validasi Lokasi" saat di titik tujuan, atau "Tidak Input GPS" dengan alasan jelas.',
      ],
      ctaLabel: 'Buka Rute Canvassing',
      target: 'rute',
    });
  }

  // 8. Target Lead Valid Harian (8 Lead/hari)
  if (leadsToday < 8) {
    list.push({
      id: 'daily-lead-target',
      title: `Target Lead Harian (${leadsToday}/8 Lead)`,
      badge: 'Target Harian',
      tone: 'espresso',
      summary: `Capaian lead valid hari ini baru ${leadsToday} dari target minimal 8 lead sesuai Playbook.`,
      details: [
        { label: 'Lead Valid Hari Ini', value: `${leadsToday} prospek` },
        { label: 'Target Playbook', value: '8 lead valid / hari' },
      ],
      recommendations: [
        'Input prospek hasil canvassing/referral/iklan di menu Input Lead Baru.',
        'Pastikan WhatsApp SE aktif agar lead inbound otomatis tercatat.',
      ],
      ctaLabel: 'Input Lead di Pipeline',
      target: 'pipeline',
    });
  }

  // 9. Status WhatsApp Terdiskonek
  if (waStatus !== 'CONNECTED') {
    list.push({
      id: 'wa-disconnected',
      title: 'WhatsApp SE Belum Terhubung',
      badge: 'Koneksi WA',
      tone: 'rose',
      summary: 'Koneksi WhatsApp Baileys sedang terdiskonek sehingga pesan masuk calon pembeli belum tertangkap otomatis.',
      details: [
        { label: 'Status WA', value: waStatus },
        { label: 'Risiko', value: 'Lead WA masuk tidak otomatis masuk ke tab Perlu Ditangani' },
      ],
      recommendations: [
        'Buka halaman Pipeline → klik tombol "Hubungkan" / "Hubungkan WA SE (QR)".',
        'Scan QR Code menggunakan WhatsApp kerja SE Anda.',
      ],
      ctaLabel: 'Hubungkan WA Sekarang',
      target: 'pipeline',
    });
  }

  // 10. Export Laporan Harian (Umum sebelum 18:00)
  if (!hasSavedReport && !list.some((i) => i.id === 'h5-export-report')) {
    list.push({
      id: 'daily-export-report',
      title: 'Export Laporan Harian (PDF / Excel)',
      badge: 'Wajib ≤ 18:00',
      tone: 'espresso',
      summary: 'Laporan Harian 13 item SE hari ini belum diexport. Rekap wajib dikirim maksimal pukul 18:00 WIB.',
      details: [
        { label: 'Status Laporan', value: 'Belum Diexport Hari Ini' },
        { label: 'Format Tersedia', value: 'PDF & Excel (.xls)' },
      ],
      recommendations: [
        'Lengkapi catatan aktivitas harian jika ada hambatan lapangan.',
        'Klik Export Laporan di Dashboard SE untuk mengunduh PDF/Excel.',
      ],
      ctaLabel: 'Export Laporan Sekarang',
      target: 'export',
    });
  }

  return list;
}

interface SeNotificationBellProps {
  quickStatus?: SeQuickStatusData;
  extra?: SeNotificationExtra;
  externalOpen?: boolean;
  onExternalOpenChange?: (open: boolean) => void;
  onNavigateTarget: (target: SeNotifTarget) => void;
  onH5ReminderTriggered?: (item: SeNotificationItem) => void;
}

export const SeNotificationBell: React.FC<SeNotificationBellProps> = ({
  quickStatus,
  extra,
  externalOpen,
  onExternalOpenChange,
  onNavigateTarget,
  onH5ReminderTriggered,
}) => {
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = externalOpen !== undefined ? externalOpen : internalOpen;
  const setIsOpen = (val: boolean | ((prev: boolean) => boolean)) => {
    const next = typeof val === 'function' ? val(isOpen) : val;
    setInternalOpen(next);
    onExternalOpenChange?.(next);
  };
  const [selectedNotif, setSelectedNotif] = useState<SeNotificationItem | null>(null);
  const [triggeredH5Ids, setTriggeredH5Ids] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const timer = setInterval(() => setNowMs(Date.now()), 30_000);
    return () => clearInterval(timer);
  }, []);

  const notifications = useMemo(
    () => buildSeRealtimeNotifications(quickStatus, nowMs, extra),
    [quickStatus, nowMs, extra]
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
    if (tone === 'rose') return 'bg-rose-100 text-rose-800 border-rose-200';
    if (tone === 'amber') return 'bg-amber-100 text-amber-900 border-amber-200';
    if (tone === 'emerald') return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    return 'bg-slate-200/80 text-slate-700 border-slate-300/80';
  };

  const listCardSurface = (tone: SeNotificationItem['tone']) => {
    if (tone === 'rose') {
      return 'bg-rose-50/90 hover:bg-rose-100/75 border-rose-200/90 text-rose-950';
    }
    if (tone === 'amber') {
      return 'bg-amber-50/85 hover:bg-amber-100/70 border-amber-200/90 text-slate-900';
    }
    return 'bg-slate-50/90 hover:bg-slate-100/80 border-slate-200/90 text-slate-900';
  };

  const iconBoxTone = (tone: SeNotificationItem['tone']) => {
    if (tone === 'rose') return 'bg-rose-600 text-white border-rose-600 shadow-2xs';
    if (tone === 'amber') return 'bg-amber-500 text-white border-amber-500 shadow-2xs';
    return 'bg-emerald-600 text-white border-emerald-600 shadow-2xs';
  };

  const modalTheme = (tone: SeNotificationItem['tone']) => {
    if (tone === 'rose') {
      return {
        cardBorder: 'border-rose-200',
        headerBg: 'bg-rose-50/85 border-b border-rose-200/80',
        statTile: 'bg-rose-50/50 border-rose-200/70',
        statLabel: 'text-rose-700/80',
        statValue: 'text-rose-950',
        recBox: 'bg-rose-50/40 border-rose-200/70',
        recTitle: 'text-rose-700',
        recBadge: 'bg-rose-600 text-white',
        primaryBtn: 'bg-rose-600 hover:bg-rose-700 text-white',
      };
    }
    if (tone === 'amber') {
      return {
        cardBorder: 'border-amber-200',
        headerBg: 'bg-amber-50/85 border-b border-amber-200/80',
        statTile: 'bg-amber-50/45 border-amber-200/70',
        statLabel: 'text-amber-800/80',
        statValue: 'text-slate-900',
        recBox: 'bg-amber-50/40 border-amber-200/70',
        recTitle: 'text-amber-800',
        recBadge: 'bg-amber-500 text-white',
        primaryBtn: 'bg-amber-600 hover:bg-amber-700 text-white',
      };
    }
    return {
      cardBorder: 'border-slate-200',
      headerBg: 'bg-emerald-50/70 border-b border-emerald-200/70',
      statTile: 'bg-slate-50 border-slate-200/80',
      statLabel: 'text-slate-500',
      statValue: 'text-slate-900',
      recBox: 'bg-emerald-50/45 border-emerald-200/70',
      recTitle: 'text-emerald-800',
      recBadge: 'bg-emerald-600 text-white',
      primaryBtn: 'bg-emerald-600 hover:bg-emerald-700 text-white',
    };
  };

  const iconForItem = (item: SeNotificationItem) => {
    if (item.id === 'wa-disconnected') return Smartphone;
    if (item.id === 'daily-lead-target' || item.id === 'leads-incomplete') return Users;
    if (item.target === 'lapangan') return Navigation;
    if (item.target === 'pipeline') return AlertTriangle;
    if (item.target === 'kalender') return Calendar;
    if (item.target === 'rute') return MapPin;
    return FileSpreadsheet;
  };

  const listOverlay =
    isOpen && typeof document !== 'undefined'
      ? createPortal(
          <div className="fixed inset-0 z-[80] flex items-end md:items-start md:justify-end md:pt-16 md:pr-6">
            <div
              className="fixed inset-0 bg-slate-900/45 backdrop-blur-[2px] md:bg-slate-900/20"
              onClick={() => setIsOpen(false)}
            />
            <div className="relative z-10 w-full md:w-[410px] bg-white rounded-t-3xl md:rounded-3xl border border-slate-200 shadow-2xl overflow-hidden animate-in slide-in-from-bottom md:fade-in duration-150">
              <div className="md:hidden pt-2.5 pb-1">
                <div className="w-10 h-1 rounded-full bg-slate-200 mx-auto" />
              </div>
              <div className="px-4 py-3.5 border-b border-slate-100 bg-white flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="size-9 rounded-xl bg-emerald-50 border border-emerald-200/80 text-emerald-600 grid place-items-center">
                    <Bell className="size-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900">
                      Tugas &amp; Pengingat ({totalCount})
                    </h3>
                    <p className="text-[10px] font-medium text-slate-500">
                      Warna kartu mengikuti tingkat urgensi tugas
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="size-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 grid place-items-center cursor-pointer transition-colors"
                  aria-label="Tutup Notifikasi"
                >
                  <X className="size-4" />
                </button>
              </div>

              <div className="max-h-[68dvh] md:max-h-[450px] overflow-y-auto p-3 space-y-2 pb-[calc(1rem+env(safe-area-inset-bottom))] md:pb-3">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center space-y-2">
                    <CheckCircle2 className="size-8 text-emerald-600 mx-auto" />
                    <p className="text-xs font-extrabold text-slate-900">Semua Tugas Wajib Beres ✓</p>
                    <p className="text-[11px] text-slate-500">Tidak ada pengingat tertunda saat ini.</p>
                  </div>
                ) : (
                  notifications.map((item) => {
                    const Icon = iconForItem(item);
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setIsOpen(false);
                          setSelectedNotif(item);
                        }}
                        className={`w-full min-h-[60px] p-3 rounded-2xl border text-left flex items-center justify-between gap-3 cursor-pointer transition-all active:scale-[0.99] ${listCardSurface(
                          item.tone
                        )}`}
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div
                            className={`size-10 rounded-xl border grid place-items-center shrink-0 ${iconBoxTone(
                              item.tone
                            )}`}
                          >
                            <Icon className="size-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span
                                className={`px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase tracking-wider border ${badgeTone(
                                  item.tone
                                )}`}
                              >
                                {item.badge}
                              </span>
                            </div>
                            <p className="text-xs font-extrabold truncate mt-1">
                              {item.title}
                            </p>
                          </div>
                        </div>
                        <ChevronRight className="size-4 opacity-50 shrink-0" />
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>,
          document.body
        )
      : null;

  const detailModal =
    selectedNotif && typeof document !== 'undefined'
      ? (() => {
          const theme = modalTheme(selectedNotif.tone);
          const DetailIcon = iconForItem(selectedNotif);
          return createPortal(
            <div
              className="fixed inset-0 z-[90] bg-slate-900/45 backdrop-blur-[3px] flex items-center justify-center p-4"
              onClick={() => setSelectedNotif(null)}
            >
              <div
                className={`w-full max-w-md bg-white rounded-3xl border ${theme.cardBorder} shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-150`}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Urgency-Tinted Header Card Surface (Tanpa Garis Tepi Atas) */}
                <div className={`p-5 ${theme.headerBg} flex items-start justify-between gap-3`}>
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div
                      className={`size-11 rounded-2xl border grid place-items-center shrink-0 ${iconBoxTone(
                        selectedNotif.tone
                      )}`}
                    >
                      <DetailIcon className="size-5" />
                    </div>
                    <div className="min-w-0">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${badgeTone(
                          selectedNotif.tone
                        )}`}
                      >
                        <Clock className="size-3" />
                        {selectedNotif.badge}
                      </span>
                      <h3 className="text-sm sm:text-base font-extrabold text-slate-900 mt-1 leading-snug">
                        {selectedNotif.title}
                      </h3>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedNotif(null)}
                    className="size-9 rounded-xl bg-white/80 hover:bg-white border border-slate-200/80 text-slate-600 grid place-items-center shrink-0 cursor-pointer transition-colors"
                    aria-label="Tutup Detail Notifikasi"
                  >
                    <X className="size-4" />
                  </button>
                </div>

                <div className="p-5 space-y-4 max-h-[75dvh] overflow-y-auto">
                  <p className="text-xs sm:text-sm font-medium text-slate-600 leading-relaxed">
                    {selectedNotif.summary}
                  </p>

                  {/* Urgency-Tinted Stat Tiles Grid */}
                  {selectedNotif.details.length > 0 && (
                    <div
                      className={`grid gap-2 ${
                        selectedNotif.details.length === 3 ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-2'
                      }`}
                    >
                      {selectedNotif.details.map((d, idx) => (
                        <div
                          key={idx}
                          className={`p-3 rounded-2xl border flex flex-col justify-between gap-1 ${theme.statTile}`}
                        >
                          <span className={`text-[10px] font-bold uppercase tracking-wider ${theme.statLabel}`}>
                            {d.label}
                          </span>
                          <span className={`text-xs font-extrabold leading-snug ${theme.statValue}`}>
                            {d.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Numbered Actionable Recommendations */}
                  <div className={`p-4 rounded-2xl border space-y-2.5 ${theme.recBox}`}>
                    <p className={`text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1.5 ${theme.recTitle}`}>
                      <Sparkles className="size-3.5" />
                      Langkah yang Perlu Dilakukan
                    </p>
                    <div className="space-y-2">
                      {selectedNotif.recommendations.map((rec, i) => (
                        <div key={i} className="flex items-start gap-2.5 text-xs text-slate-800">
                          <span className={`size-5 rounded-full text-[10px] font-black grid place-items-center shrink-0 mt-0.5 ${theme.recBadge}`}>
                            {i + 1}
                          </span>
                          <span className="font-medium leading-relaxed">{rec}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        const target = selectedNotif.target;
                        setSelectedNotif(null);
                        onNavigateTarget(target);
                      }}
                      className={`flex-1 min-h-[46px] px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 cursor-pointer shadow-sm transition-colors ${theme.primaryBtn}`}
                    >
                      <span>{selectedNotif.ctaLabel}</span>
                      <ArrowRight className="size-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedNotif(null)}
                      className="min-h-[46px] px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer transition-colors"
                    >
                      Tutup
                    </button>
                  </div>
                </div>
              </div>
            </div>,
            document.body
          );
        })()
      : null;

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        aria-label="Notifikasi Tugas Wajib SE"
        className="relative size-10 rounded-xl bg-sandstone hover:bg-warmborder border border-warmborder text-espresso flex items-center justify-center gap-1.5 cursor-pointer transition-colors shrink-0"
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
      {listOverlay}
      {detailModal}
    </>
  );
};
