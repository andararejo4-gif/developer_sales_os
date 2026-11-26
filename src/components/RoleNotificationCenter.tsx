import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowRight,
  Bell,
  ChevronRight,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react';
import type { RoleKey } from '../data';

export interface RoleNotifAction {
  type: 'view' | 'section' | 'profile';
  target: string;
}

export interface RoleNotificationItem {
  id: string;
  title: string;
  badge: string;
  tone: 'rose' | 'amber' | 'espresso' | 'emerald';
  summary: string;
  details: Array<{ label: string; value: string }>;
  ctaLabel: string;
  action: RoleNotifAction;
}

export interface RoleGreetingMetric {
  label: string;
  value: string;
  highlight?: boolean;
}

export interface RoleGreetingSummary {
  subtitle: string;
  metrics: [RoleGreetingMetric, RoleGreetingMetric, RoleGreetingMetric];
  notifications: RoleNotificationItem[];
}

export interface DashboardSummarySnapshot {
  seTeamPerformance?: Array<{
    nama?: string;
    laporanHariIni?: string;
    rataResponsMenit?: number;
    leadBulanIni?: number;
  }>;
  liveSlaLeads?: Array<{
    id?: string;
    namaLead?: string;
    seNama?: string;
    durasiMenit?: number;
    statusSla?: string;
  }>;
  bookingTransactions?: Array<{
    id?: string;
    pembeli?: string;
    statusAdminH1?: string;
  }>;
  escalations?: Array<{ status?: string }>;
  auditLogs?: Array<{ id?: string; summary?: string }>;
  campaigns?: Array<{ id?: string; status?: string; name?: string }>;
  leadFeedbacks?: Array<{ id?: string; quality?: string }>;
  counts?: {
    totalUnits?: number;
    availableUnits?: number;
    bookingUnits?: number;
    soldUnits?: number;
    totalLeads?: number;
    kprApplications?: number;
    vaultPending?: number;
  };
}

export function buildRoleGreetingAndNotifications(
  role: RoleKey,
  summary: DashboardSummarySnapshot | null,
  localEscalations: Array<{ status?: string }> = [],
  totpEnabled?: boolean
): RoleGreetingSummary {
  const counts = summary?.counts ?? {};
  const seTeam = Array.isArray(summary?.seTeamPerformance) ? summary.seTeamPerformance : [];
  const slaLeads = Array.isArray(summary?.liveSlaLeads) ? summary.liveSlaLeads : [];
  const bookings = Array.isArray(summary?.bookingTransactions) ? summary.bookingTransactions : [];
  const escList =
    Array.isArray(summary?.escalations) && summary.escalations.length > 0
      ? summary.escalations
      : localEscalations;
  const auditLogs = Array.isArray(summary?.auditLogs) ? summary.auditLogs : [];
  const campaigns = Array.isArray(summary?.campaigns) ? summary.campaigns : [];
  const feedbacks = Array.isArray(summary?.leadFeedbacks) ? summary.leadFeedbacks : [];

  const totalLeads = Number(counts.totalLeads ?? slaLeads.length ?? 0);
  const totalUnits = Number(counts.totalUnits ?? 0);
  const availableUnits = Number(counts.availableUnits ?? 0);
  const bookingUnits = Number(counts.bookingUnits ?? bookings.length ?? 0);
  const soldUnits = Number(counts.soldUnits ?? 0);
  const kprApps = Number(counts.kprApplications ?? 0);
  const vaultPending = Number(counts.vaultPending ?? 0);

  const slaAlerts = slaLeads.filter((l) => l.statusSla && l.statusSla !== 'aman');
  const unsubmittedSe = seTeam.filter((s) => s.laporanHariIni === 'belum_kirim');
  const submittedSeCount = seTeam.length - unsubmittedSe.length;
  const pendingBookings = bookings.filter((b) => b.statusAdminH1 === 'Menunggu Verifikasi');
  const pendingEscalations = escList.filter(
    (e) => String(e.status || '').toLowerCase().includes('menunggu')
  );
  const activeCampaigns = campaigns.filter(
    (c) => String(c.status || '').toUpperCase() === 'ACTIVE' || String(c.status || '').toLowerCase() === 'aktif'
  );

  const notifications: RoleNotificationItem[] = [];

  if (totpEnabled !== true) {
    notifications.push({
      id: 'recommend-totp-2fa',
      title: 'Rekomendasi Keamanan: Aktifkan 2FA (TOTP)',
      badge: 'Keamanan Akun',
      tone: 'amber',
      summary:
        'Lindungi akun Anda gratis dengan Google Authenticator agar akses dashboard tetap aman.',
      details: [
        { label: 'Status 2FA', value: 'Nonaktif (Default)' },
        { label: 'Biaya', value: 'Gratis (Rp0) via Profil' },
      ],
      ctaLabel: 'Buka Profil & Aktifkan TOTP',
      action: { type: 'profile', target: 'profile' },
    });
  }

  let subtitle =
    'Ringkasan operasional dan item prioritas untuk peran Anda sudah disiapkan di menu Notifikasi.';
  let metrics: [RoleGreetingMetric, RoleGreetingMetric, RoleGreetingMetric] = [
    { label: 'Agenda Aktif', value: '0' },
    { label: 'Prospek Aktif', value: `${totalLeads}` },
    { label: 'Unit Tersedia', value: `${availableUnits}` },
  ];

  if (role === 'SM') {
    subtitle =
      'Ringkasan performa tim SE, radar SLA prospek, serta antrean persetujuan Vault & Eskalasi sudah dirangkum di menu Notifikasi.';
    if (slaAlerts.length > 0) {
      notifications.push({
        id: 'sm-sla-alerts',
        title: `${slaAlerts.length} Lead Butuh Perhatian SLA`,
        badge: 'Radar SLA',
        tone: 'rose',
        summary: 'Terdapat prospek dengan respons >5 menit atau dialihkan ke pool yang perlu dipantau.',
        details: [
          { label: 'Lead Warning / Pool', value: `${slaAlerts.length} prospek` },
          { label: 'Total Lead Terpantau', value: `${totalLeads} lead` },
        ],
        ctaLabel: 'Pantau Kinerja Tim SE',
        action: { type: 'view', target: 'kinerja_se' },
      });
    }
    if (unsubmittedSe.length > 0) {
      notifications.push({
        id: 'sm-se-reports',
        title: `${unsubmittedSe.length} SE Belum Mengirim Laporan`,
        badge: 'Laporan Tim',
        tone: 'amber',
        summary: 'Pantau kelengkapan laporan harian tim Sales Executive untuk evaluasi hari ini.',
        details: [
          { label: 'SE Sudah Lapor', value: `${submittedSeCount}/${seTeam.length} SE` },
          { label: 'Belum Lapor', value: `${unsubmittedSe.length} SE` },
        ],
        ctaLabel: 'Cek Kinerja 3 SE',
        action: { type: 'view', target: 'kinerja_se' },
      });
    }
    if (vaultPending > 0) {
      notifications.push({
        id: 'sm-vault-pending',
        title: `${vaultPending} Berkas Vault KPR Menunggu Approval`,
        badge: 'Approval Vault',
        tone: 'espresso',
        summary: 'Dokumen debitur di Vault KPR membutuhkan review dan persetujuan Sales Manager.',
        details: [
          { label: 'Berkas Pending', value: `${vaultPending} dokumen` },
          { label: 'Pengajuan KPR', value: `${kprApps} aplikasi` },
        ],
        ctaLabel: 'Buka Vault KPR',
        action: { type: 'view', target: 'vault' },
      });
    }
    if (pendingEscalations.length > 0) {
      notifications.push({
        id: 'sm-escalations',
        title: `${pendingEscalations.length} Eskalasi Menunggu Review`,
        badge: 'Eskalasi',
        tone: 'amber',
        summary: 'Ada pengajuan diskon atau ketentuan khusus yang sedang menunggu keputusan.',
        details: [{ label: 'Status Antrean', value: `${pendingEscalations.length} pengajuan` }],
        ctaLabel: 'Lihat Daftar Unit & Pipeline',
        action: { type: 'view', target: 'unit_park' },
      });
    }
    metrics = [
      { label: 'Agenda Aktif', value: `${notifications.length}` },
      { label: 'Tim SE Lapor', value: `${submittedSeCount}/${seTeam.length || 0}`, highlight: true },
      { label: 'Vault Pending', value: `${vaultPending} Berkas` },
    ];
  } else if (role === 'TL') {
    subtitle =
      'Pantauan SLA <=5 menit, antrean pool 72 jam, dan kedisiplinan laporan harian tim SE siap Anda cek di menu Notifikasi.';
    if (slaAlerts.length > 0) {
      notifications.push({
        id: 'tl-sla-radar',
        title: `${slaAlerts.length} Prospek Warning SLA / Pool`,
        badge: 'SLA <=5 Menit',
        tone: 'rose',
        summary: 'Segera koordinasikan tindak lanjut prospek agar tidak terlewat batas SLA 5 menit.',
        details: [
          { label: 'Warning / Pool', value: `${slaAlerts.length} lead` },
          { label: 'Lead Aman', value: `${slaLeads.length - slaAlerts.length} lead` },
        ],
        ctaLabel: 'Buka Radar SLA',
        action: { type: 'section', target: 'live-sla' },
      });
    }
    if (unsubmittedSe.length > 0) {
      notifications.push({
        id: 'tl-unsubmitted-se',
        title: `${unsubmittedSe.length} Anggota Tim Belum Lapor`,
        badge: 'Evaluasi Harian',
        tone: 'amber',
        summary: 'Ingatkan SE yang belum mencatat aktivitas lapangan hari ini.',
        details: [
          { label: 'Aktif Lapor', value: `${submittedSeCount}/${seTeam.length} SE` },
        ],
        ctaLabel: 'Cek Pool & Tim',
        action: { type: 'section', target: 'aturan-72jam' },
      });
    }
    metrics = [
      { label: 'Agenda Aktif', value: `${notifications.length}` },
      { label: 'Warning SLA', value: `${slaAlerts.length}/${slaLeads.length}`, highlight: slaAlerts.length === 0 },
      { label: 'SE Sudah Lapor', value: `${submittedSeCount}/${seTeam.length || 0}` },
    ];
  } else if (role === 'ADMIN') {
    subtitle =
      'Antrean verifikasi booking H+1, dokumen Vault KPR debitur, dan progres pengajuan KPR bank sudah dirangkum di menu Notifikasi.';
    if (vaultPending > 0) {
      notifications.push({
        id: 'admin-vault-review',
        title: `${vaultPending} Dokumen Vault Perlu Verifikasi`,
        badge: 'Vault KPR',
        tone: 'rose',
        summary: 'Periksa kelengkapan KTP, NPWP, slip gaji, dan dokumen debitur di Vault KPR.',
        details: [
          { label: 'Perlu Review', value: `${vaultPending} berkas` },
          { label: 'Total Pengajuan KPR', value: `${kprApps} aplikasi` },
        ],
        ctaLabel: 'Verifikasi Vault KPR',
        action: { type: 'view', target: 'vault' },
      });
    }
    if (pendingBookings.length > 0) {
      notifications.push({
        id: 'admin-booking-verify',
        title: `${pendingBookings.length} Booking Menunggu Verifikasi H+1`,
        badge: 'Verifikasi H+1',
        tone: 'amber',
        summary: 'Konfirmasi tanda jadi dan kelengkapan berkas awal transaksi booking.',
        details: [
          { label: 'Menunggu Verifikasi', value: `${pendingBookings.length} transaksi` },
          { label: 'Total Booking', value: `${bookings.length} transaksi` },
        ],
        ctaLabel: 'Buka Pipeline Booking',
        action: { type: 'section', target: 'booking-pipeline' },
      });
    }
    if (kprApps > 0) {
      notifications.push({
        id: 'admin-kpr-apps',
        title: `${kprApps} Pengajuan KPR Bank Aktif`,
        badge: 'KPR Bank',
        tone: 'emerald',
        summary: 'Pantau tahapan SLIK, appraisal, hingga akad pada pengajuan KPR multi-bank.',
        details: [{ label: 'Aplikasi Berjalan', value: `${kprApps} debitur` }],
        ctaLabel: 'Pantau KPR Multi-Bank',
        action: { type: 'view', target: 'kpr_bank' },
      });
    }
    metrics = [
      { label: 'Agenda Aktif', value: `${notifications.length}` },
      { label: 'Vault Pending', value: `${vaultPending} Berkas`, highlight: vaultPending === 0 },
      { label: 'Verif / KPR', value: `${pendingBookings.length}/${kprApps}` },
    ];
  } else if (role === 'DIREKSI') {
    subtitle =
      'Ringkasan eskalasi persetujuan Direksi, status stok unit proyek, dan pergerakan penjualan sudah disiapkan di menu Notifikasi.';
    if (pendingEscalations.length > 0) {
      notifications.push({
        id: 'direksi-escalations',
        title: `${pendingEscalations.length} Eskalasi Menunggu Persetujuan`,
        badge: 'Keputusan Direksi',
        tone: 'rose',
        summary: 'Pengajuan diskon khusus atau skema pembayaran membutuhkan persetujuan Anda.',
        details: [
          { label: 'Menunggu Review', value: `${pendingEscalations.length} pengajuan` },
          { label: 'Total Eskalasi', value: `${escList.length} pengajuan` },
        ],
        ctaLabel: 'Review Eskalasi Sekarang',
        action: { type: 'section', target: 'eskalasi-persetujuan' },
      });
    }
    notifications.push({
      id: 'direksi-portfolio',
      title: `Status Stok: ${availableUnits} Tersedia · ${bookingUnits} Booking · ${soldUnits} Terjual`,
      badge: 'Portofolio Proyek',
      tone: 'emerald',
      summary: `Total ${totalUnits} unit terdaftar dengan ${totalLeads} prospek aktif di pipeline.`,
      details: [
        { label: 'Total Unit', value: `${totalUnits} unit` },
        { label: 'Booking / Terjual', value: `${bookingUnits} / ${soldUnits} unit` },
      ],
      ctaLabel: 'Lihat Portofolio Proyek',
      action: { type: 'section', target: 'portofolio-proyek' },
    });
    metrics = [
      { label: 'Agenda Aktif', value: `${notifications.length}` },
      { label: 'Eskalasi Pending', value: `${pendingEscalations.length}`, highlight: pendingEscalations.length === 0 },
      { label: 'Book / Sold', value: `${bookingUnits}/${soldUnits}` },
    ];
  } else if (role === 'DIGITAL_MARKETING') {
    subtitle =
      'Status kampanye iklan aktif, umpan balik kualitas lead dari tim SE, dan total perolehan lead sudah dirangkum di menu Notifikasi.';
    if (feedbacks.length > 0) {
      notifications.push({
        id: 'dm-lead-feedback',
        title: `${feedbacks.length} Umpan Balik Kualitas Lead dari SE`,
        badge: 'Kualitas Lead',
        tone: 'amber',
        summary: 'Evaluasi kualitas prospek masuk untuk mengoptimalkan targeting iklan.',
        details: [
          { label: 'Total Feedback', value: `${feedbacks.length} catatan` },
          { label: 'Total Lead Masuk', value: `${totalLeads} lead` },
        ],
        ctaLabel: 'Lihat Umpan Balik Lead',
        action: { type: 'section', target: 'se-feedback' },
      });
    }
    notifications.push({
      id: 'dm-campaigns',
      title: `${activeCampaigns.length} Kampanye Iklan Aktif`,
      badge: 'Kampanye Iklan',
      tone: 'emerald',
      summary: `Memantau ${campaigns.length} kampanye iklan dan perolehan ${totalLeads} lead proyek.`,
      details: [
        { label: 'Kampanye Aktif', value: `${activeCampaigns.length} dari ${campaigns.length}` },
        { label: 'Total Lead', value: `${totalLeads} lead` },
      ],
      ctaLabel: 'Buka Kampanye & CPL',
      action: { type: 'section', target: 'ad-campaigns' },
    });
    metrics = [
      { label: 'Agenda Aktif', value: `${notifications.length}` },
      { label: 'Kampanye Aktif', value: `${activeCampaigns.length}/${campaigns.length}`, highlight: true },
      { label: 'Total Lead', value: `${totalLeads} Lead` },
    ];
  } else if (role === 'IT' || role === 'SUPERADMIN_IT' || role === 'SUPERADMIN') {
    subtitle =
      'Status Knowledge AI Terpusat, jejak audit aktivitas sistem, dan kesehatan data proyek siap dipantau di menu Notifikasi.';
    notifications.push({
      id: 'it-knowledge-ai',
      title: 'Knowledge AI Terpusat & OCR Lokal',
      badge: 'Divisi IT',
      tone: 'emerald',
      summary: 'Kelola 1 sumber kebenaran materi AI dan ekstraksi brosur PDF/gambar untuk seluruh tim.',
      details: [
        { label: 'Unit Terdaftar', value: `${totalUnits} unit` },
        { label: 'Lead Aktif', value: `${totalLeads} lead` },
      ],
      ctaLabel: 'Buka Knowledge AI',
      action: { type: 'section', target: 'knowledge-ai' },
    });
    if (auditLogs.length > 0) {
      notifications.push({
        id: 'it-audit-log',
        title: `${auditLogs.length} Aktivitas Audit Trail Terbaru`,
        badge: 'Audit Trail',
        tone: 'espresso',
        summary: 'Pantau riwayat perubahan data, akses pengguna, dan integritas skema database.',
        details: [{ label: 'Log Tercatat', value: `${auditLogs.length} entri terbaru` }],
        ctaLabel: 'Lihat Audit Trail Log',
        action: { type: 'section', target: 'audit-log' },
      });
    }
    metrics = [
      { label: 'Agenda Aktif', value: `${notifications.length}` },
      { label: 'Data Proyek', value: `${totalUnits} Unit`, highlight: true },
      { label: 'Audit Log', value: `${auditLogs.length} Entri` },
    ];
  } else {
    subtitle =
      'Status tautan referral, prospek Anda, dan rekomendasi keamanan akun tersedia di menu Notifikasi.';
    metrics = [
      { label: 'Agenda Aktif', value: `${notifications.length}` },
      { label: 'Prospek Proyek', value: `${totalLeads}`, highlight: true },
      { label: 'Keamanan 2FA', value: totpEnabled ? 'Aktif' : 'Belum Aktif' },
    ];
  }

  return { subtitle, metrics, notifications };
}

export function RoleNotificationBell({
  role,
  summary,
  escalations = [],
  totpEnabled,
  externalOpen,
  onExternalOpenChange,
  onNavigateAction,
}: {
  role: RoleKey;
  summary: DashboardSummarySnapshot | null;
  escalations?: Array<{ status?: string }>;
  totpEnabled?: boolean;
  externalOpen?: boolean;
  onExternalOpenChange?: (open: boolean) => void;
  onNavigateAction: (action: RoleNotifAction) => void;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<RoleNotificationItem | null>(null);

  const open = externalOpen !== undefined ? externalOpen : internalOpen;
  const setOpen = (next: boolean) => {
    setInternalOpen(next);
    onExternalOpenChange?.(next);
  };

  useEffect(() => {
    if (externalOpen) {
      setInternalOpen(true);
    }
  }, [externalOpen]);

  const { notifications } = useMemo(
    () => buildRoleGreetingAndNotifications(role, summary, escalations, totpEnabled),
    [role, summary, escalations, totpEnabled]
  );

  const totalCount = notifications.length;
  const hasUrgent = notifications.some((n) => n.tone === 'rose' || n.tone === 'amber');

  const toneBadgeClass = (tone: RoleNotificationItem['tone']) => {
    if (tone === 'rose') return 'bg-rose-100 text-rose-800 border-rose-200';
    if (tone === 'amber') return 'bg-amber-100 text-amber-800 border-amber-200';
    if (tone === 'emerald') return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    return 'bg-sandstone text-espresso border-warmborder';
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`relative h-10 w-10 rounded-xl border transition-colors cursor-pointer grid place-items-center ${
          hasUrgent
            ? 'bg-amber-50 border-amber-300 text-amber-900 hover:bg-amber-100'
            : 'bg-white border-warmborder text-espresso hover:bg-sandstone'
        }`}
        title={`Notifikasi & Pengingat ${role}`}
        aria-label={`Notifikasi ${role}`}
      >
        <Bell className="size-4" />
        {totalCount > 0 && (
          <span
            className={`absolute -top-1 -right-1 h-4 min-w-[16px] rounded-full px-1 text-[10px] font-black text-white grid place-items-center ${
              hasUrgent ? 'bg-amber-600' : 'bg-emerald-600'
            }`}
          >
            {totalCount}
          </span>
        )}
      </button>

      {open &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed inset-0 z-[90] bg-slate-900/40 backdrop-blur-[2px] flex items-start justify-end p-3 sm:p-5"
            onClick={() => setOpen(false)}
          >
            <div
              className="w-full max-w-md bg-white rounded-3xl border border-warmborder shadow-2xl overflow-hidden animate-in slide-in-from-right-4 fade-in duration-150 max-h-[88vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 sm:p-5 bg-sandstone/60 border-b border-warmborder flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="size-9 rounded-xl bg-espresso text-white grid place-items-center shrink-0">
                    <Sparkles className="size-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-espresso">
                      Notifikasi &amp; Pengingat ({totalCount})
                    </h3>
                    <p className="text-[11px] font-medium text-warmmuted">
                      Ringkasan real-time untuk peran {role}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="size-8 rounded-lg bg-white border border-warmborder text-espresso grid place-items-center cursor-pointer hover:bg-sandstone"
                  aria-label="Tutup Notifikasi"
                >
                  <X className="size-4" />
                </button>
              </div>

              <div className="p-4 space-y-2.5 overflow-y-auto flex-1">
                {notifications.length === 0 ? (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-900 flex items-center gap-2.5">
                    <ShieldCheck className="size-5 shrink-0 text-emerald-700" />
                    <span>Semua agenda dan keamanan akun Anda dalam kondisi aman.</span>
                  </div>
                ) : (
                  notifications.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSelectedItem(item)}
                      className="w-full text-left p-3.5 rounded-2xl border border-warmborder bg-white hover:bg-sandstone/40 transition-colors flex items-start justify-between gap-3 cursor-pointer"
                    >
                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${toneBadgeClass(
                              item.tone
                            )}`}
                          >
                            {item.badge}
                          </span>
                        </div>
                        <p className="text-xs font-extrabold text-espresso leading-snug">
                          {item.title}
                        </p>
                        <p className="text-[11px] text-warmmuted line-clamp-2 leading-relaxed">
                          {item.summary}
                        </p>
                      </div>
                      <ChevronRight className="size-4 text-warmmuted shrink-0 mt-1" />
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>,
          document.body
        )}

      {selectedItem &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed inset-0 z-[95] bg-slate-900/50 backdrop-blur-[2px] flex items-center justify-center p-4"
            onClick={() => setSelectedItem(null)}
          >
            <div
              className="w-full max-w-md bg-white rounded-3xl border border-warmborder shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-150"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-5 bg-sandstone/60 border-b border-warmborder flex items-start justify-between gap-3">
                <div>
                  <span
                    className={`inline-block text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border mb-1.5 ${toneBadgeClass(
                      selectedItem.tone
                    )}`}
                  >
                    {selectedItem.badge}
                  </span>
                  <h4 className="text-base font-extrabold text-espresso leading-snug">
                    {selectedItem.title}
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedItem(null)}
                  className="size-8 rounded-lg bg-white border border-warmborder text-espresso grid place-items-center cursor-pointer"
                  aria-label="Tutup Detail"
                >
                  <X className="size-4" />
                </button>
              </div>

              <div className="p-5 space-y-4">
                <p className="text-xs text-warmmuted leading-relaxed">{selectedItem.summary}</p>
                {selectedItem.details.length > 0 && (
                  <div className="rounded-2xl bg-sandstone/40 border border-warmborder p-3 space-y-1.5">
                    {selectedItem.details.map((d) => (
                      <div key={d.label} className="flex items-center justify-between text-xs">
                        <span className="text-warmmuted font-medium">{d.label}</span>
                        <span className="font-extrabold text-espresso">{d.value}</span>
                      </div>
                    ))}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => {
                    const act = selectedItem.action;
                    setSelectedItem(null);
                    setOpen(false);
                    onNavigateAction(act);
                  }}
                  className="w-full min-h-[44px] px-4 py-2.5 rounded-xl bg-espresso hover:bg-espresso/90 text-white text-xs font-extrabold flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>{selectedItem.ctaLabel}</span>
                  <ArrowRight className="size-4" />
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
