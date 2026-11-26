import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Building2,
  Clock,
  CheckCircle2,
  Search,
  Filter,
  Plus,
  ArrowRight,
  FileText,
  BadgeCheck,
  Edit3,
  Trash2,
} from 'lucide-react';
import { loadAuthSession } from '../lib/auth/dummy-accounts';
import type { BankApplicationRecord, BankSubmissionStatus } from '../lib/foundations/r3-r4-contracts';

interface PipelineLeadOption {
  id: string;
  full_name: string;
  phone_wa: string;
  unit_interest: string;
  cluster_interest: string;
  unit_price_idr: number;
  payment_scheme: string;
  stage: string;
}

interface ExtendedBankApp extends BankApplicationRecord {
  leadId?: string | null;
  sourceMode?: 'LEAD_AUTO' | 'LEAD_SELECTED' | 'MANUAL';
}

interface BankSubmissionWorkflowPageProps {
  projectName?: string;
  projectId?: string;
  userRole?: string;
}

function getAuthHeaders(): HeadersInit {
  const session = loadAuthSession();
  return {
    'Content-Type': 'application/json',
    ...(session?.token ? { Authorization: `Bearer ${session.token}` } : {}),
  };
}

function mapApiApp(row: any): ExtendedBankApp {
  return {
    id: String(row.id),
    leadId: row.lead_id ? String(row.lead_id) : null,
    applicantName: String(row.applicant_name || ''),
    applicantPhone: String(row.applicant_phone || ''),
    unitCode: String(row.unit_code || ''),
    cluster: String(row.cluster || 'Umum'),
    targetBank: (row.target_bank || 'Bank BSI') as BankApplicationRecord['targetBank'],
    plafondAmount: Number(row.plafond_amount || 0),
    submissionDate: row.submission_date ? String(row.submission_date).slice(0, 10) : '',
    status: (row.status || 'SUBMITTED_TO_BANK') as BankSubmissionStatus,
    statusNotes: String(row.status_notes || ''),
    assignedAnalyst: row.assigned_analyst ? String(row.assigned_analyst) : undefined,
    sp3kExpiryDate: row.sp3k_expiry_date ? String(row.sp3k_expiry_date).slice(0, 10) : undefined,
    sourceMode: row.source_mode || 'LEAD_SELECTED',
  };
}

const STATUS_ORDER: BankSubmissionStatus[] = [
  'SUBMITTED_TO_BANK',
  'SLIK_BI_CHECKING',
  'APPRAISAL_JAMINAN',
  'SP3K_TERBIT',
  'AKAD_KREDIT',
];

const STATUS_LABELS: Record<BankSubmissionStatus, { label: string; colorClass: string }> = {
  DOKUMEN_LENGKAP: { label: 'Dokumen Lengkap', colorClass: 'bg-sandstone text-espresso border-warmborder' },
  SUBMITTED_TO_BANK: { label: 'Berkas Masuk Bank', colorClass: 'bg-sandstone text-espresso border-warmborder' },
  SLIK_BI_CHECKING: { label: 'SLIK / BI Checking', colorClass: 'bg-amber-50 text-terracotta border-amber-200' },
  APPRAISAL_JAMINAN: { label: 'Appraisal KJPP', colorClass: 'bg-amber-100 text-espresso border-amber-300' },
  ANALISA_KOMITE: { label: 'Analisa Komite Bank', colorClass: 'bg-amber-100 text-espresso border-amber-300' },
  SP3K_TERBIT: { label: 'SP3K Terbit (Approved)', colorClass: 'bg-olive/10 text-olive border-olive/30' },
  AKAD_KREDIT: { label: 'Akad Kredit Selesai', colorClass: 'bg-olive text-white border-olive' },
  DITOLAK_BANK: { label: 'Ditolak Bank', colorClass: 'bg-rose-50 text-rose-700 border-rose-200' },
};

export const BankSubmissionWorkflowPage: React.FC<BankSubmissionWorkflowPageProps> = ({
  projectName = 'The Park Townhouse Sukoharjo',
  projectId = 'the-park-sukoharjo',
}) => {
  const [applications, setApplications] = useState<ExtendedBankApp[]>([]);
  const [leads, setLeads] = useState<PipelineLeadOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterBank, setFilterBank] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // Mode input: Pilih Lead (default) atau Manual di luar Lead
  const [inputMode, setInputMode] = useState<'LEAD' | 'MANUAL'>('LEAD');
  const [selectedLeadId, setSelectedLeadId] = useState('');
  const [applicantName, setApplicantName] = useState('');
  const [applicantPhone, setApplicantPhone] = useState('');
  const [unitCode, setUnitCode] = useState('');
  const [targetBank, setTargetBank] = useState<BankApplicationRecord['targetBank']>('Bank BSI');
  const [plafondAmount, setPlafondAmount] = useState(650000000);
  const [notes, setNotes] = useState('');

  // Edit inline state
  const [editApplicantName, setEditApplicantName] = useState('');
  const [editApplicantPhone, setEditApplicantPhone] = useState('');
  const [editUnitCode, setEditUnitCode] = useState('');
  const [editStatus, setEditStatus] = useState<BankSubmissionStatus>('SUBMITTED_TO_BANK');
  const [editBank, setEditBank] = useState<BankApplicationRecord['targetBank']>('Bank BSI');
  const [editPlafond, setEditPlafond] = useState(0);
  const [editAnalyst, setEditAnalyst] = useState('');
  const [editNotes, setEditNotes] = useState('');

  const showToastMsg = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3200);
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const headers = getAuthHeaders();
      const [appsRes, leadsRes] = await Promise.all([
        fetch(`/api/kpr/applications?projectId=${encodeURIComponent(projectId)}`, {
          credentials: 'include',
          headers,
        }),
        fetch('/api/pipeline/leads', { credentials: 'include', headers }),
      ]);
      if (appsRes.ok) {
        const aJson = await appsRes.json();
        setApplications(Array.isArray(aJson.applications) ? aJson.applications.map(mapApiApp) : []);
      }
      if (leadsRes.ok) {
        const lJson = await leadsRes.json();
        const leadRows: PipelineLeadOption[] = Array.isArray(lJson.leads) ? lJson.leads : [];
        setLeads(leadRows);
        if (leadRows.length > 0 && !selectedLeadId) {
          const first = leadRows[0];
          setSelectedLeadId(first.id);
          setUnitCode(first.unit_interest || '');
          setPlafondAmount(Math.round(Number(first.unit_price_idr || 650000000) * 0.8));
        }
      }
    } catch {
      showToastMsg('Gagal memuat data pengajuan KPR dari server.');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSelectLead = (leadId: string) => {
    setSelectedLeadId(leadId);
    const found = leads.find((l) => l.id === leadId);
    if (found) {
      setApplicantName(found.full_name);
      setApplicantPhone(found.phone_wa);
      setUnitCode(found.unit_interest || '');
      setPlafondAmount(Math.round(Number(found.unit_price_idr || 650000000) * 0.8));
    }
  };

  const handleAddApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (inputMode === 'LEAD' && !selectedLeadId) {
      showToastMsg('Pilih lead terlebih dahulu.');
      return;
    }
    if (inputMode === 'MANUAL' && (!applicantName.trim() || !unitCode.trim())) {
      showToastMsg('Nama pemohon dan kode unit wajib diisi.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/kpr/applications', {
        method: 'POST',
        credentials: 'include',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          projectId,
          leadId: inputMode === 'LEAD' ? selectedLeadId : null,
          applicantName: inputMode === 'MANUAL' ? applicantName.trim() : undefined,
          applicantPhone: inputMode === 'MANUAL' ? applicantPhone.trim() : undefined,
          unitCode: unitCode.trim(),
          targetBank,
          plafondAmount,
          statusNotes: notes.trim() || 'Berkas pengajuan baru diteruskan ke bank mitra.',
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        showToastMsg(json.error || 'Gagal menyimpan pengajuan KPR.');
        return;
      }
      setApplications((prev) => [mapApiApp(json.application), ...prev]);
      setShowAddForm(false);
      setNotes('');
      showToastMsg('Pengajuan KPR berhasil disimpan ke database.');
    } catch {
      showToastMsg('Gagal menghubungi server.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAdvanceStatus = async (app: ExtendedBankApp) => {
    const currentIdx = STATUS_ORDER.indexOf(app.status);
    if (currentIdx === -1 || currentIdx >= STATUS_ORDER.length - 1) return;
    const nextStatus = STATUS_ORDER[currentIdx + 1];

    try {
      const res = await fetch('/api/kpr/applications', {
        method: 'PATCH',
        credentials: 'include',
        headers: getAuthHeaders(),
        body: JSON.stringify({ id: app.id, status: nextStatus }),
      });
      const json = await res.json();
      if (res.ok && json.ok) {
        setApplications((prev) => prev.map((a) => (a.id === app.id ? mapApiApp(json.application) : a)));
        showToastMsg(`Status ${app.applicantName} naik ke ${STATUS_LABELS[nextStatus].label}`);
      }
    } catch {
      showToastMsg('Gagal memperbarui status KPR.');
    }
  };

  const startEdit = (app: ExtendedBankApp) => {
    setEditingId(app.id);
    setEditApplicantName(app.applicantName);
    setEditApplicantPhone(app.applicantPhone || '');
    setEditUnitCode(app.unitCode);
    setEditStatus(app.status);
    setEditBank(app.targetBank);
    setEditPlafond(app.plafondAmount);
    setEditAnalyst(app.assignedAnalyst || '');
    setEditNotes(app.statusNotes || '');
  };

  const handleSaveEdit = async (id: string) => {
    if (!editApplicantName.trim() || !editUnitCode.trim()) {
      showToastMsg('Nama pemohon dan kode unit wajib diisi.');
      return;
    }
    try {
      const res = await fetch('/api/kpr/applications', {
        method: 'PATCH',
        credentials: 'include',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          id,
          applicantName: editApplicantName.trim(),
          applicantPhone: editApplicantPhone.trim(),
          unitCode: editUnitCode.trim(),
          status: editStatus,
          targetBank: editBank,
          plafondAmount: editPlafond,
          assignedAnalyst: editAnalyst,
          statusNotes: editNotes,
        }),
      });
      const json = await res.json();
      if (res.ok && json.ok) {
        setApplications((prev) => prev.map((a) => (a.id === id ? mapApiApp(json.application) : a)));
        setEditingId(null);
        showToastMsg('Data pengajuan KPR diperbarui.');
      } else {
        showToastMsg(json.error || 'Gagal menyimpan perubahan.');
      }
    } catch {
      showToastMsg('Gagal menyimpan perubahan.');
    }
  };

  const handleDeleteApp = async (app: ExtendedBankApp) => {
    if (!window.confirm(`Hapus pengajuan KPR atas nama "${app.applicantName}" (${app.unitCode})?`)) {
      return;
    }
    try {
      const res = await fetch(`/api/kpr/applications?id=${encodeURIComponent(app.id)}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: getAuthHeaders(),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok && json.ok) {
        setApplications((prev) => prev.filter((a) => a.id !== app.id));
        showToastMsg(`Pengajuan KPR ${app.applicantName} dihapus.`);
      } else {
        showToastMsg(json.error || 'Gagal menghapus pengajuan KPR.');
      }
    } catch {
      showToastMsg('Gagal menghubungi server.');
    }
  };

  const filteredApps = useMemo(() => {
    return applications.filter((app) => {
      const matchSearch =
        app.applicantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.unitCode.toLowerCase().includes(searchTerm.toLowerCase());
      const matchBank = filterBank === 'ALL' || app.targetBank === filterBank;
      const matchStatus = filterStatus === 'ALL' || app.status === filterStatus;
      return matchSearch && matchBank && matchStatus;
    });
  }, [applications, searchTerm, filterBank, filterStatus]);

  const totalPlafondApproved = applications
    .filter((a) => a.status === 'SP3K_TERBIT' || a.status === 'AKAD_KREDIT')
    .reduce((acc, a) => acc + a.plafondAmount, 0);

  return (
    <div className="space-y-6">
      {toast && (
        <div className="fixed bottom-4 right-4 z-50 bg-espresso text-white px-4 py-3 rounded-xl shadow-lg text-sm font-medium flex items-center gap-2 border border-white/10">
          <BadgeCheck className="size-4 text-amber-400" />
          <span>{toast}</span>
        </div>
      )}

      {/* Header */}
      <div className="bg-white border border-warmborder rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="size-12 rounded-2xl bg-terracotta/10 border border-terracotta/20 flex items-center justify-center shrink-0">
              <Building2 className="size-6 text-terracotta" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-extrabold text-espresso">Alur Pengajuan KPR Bank</h1>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-olive/10 text-olive text-[11px] font-bold border border-olive/20">
                  Auto-Sync Lead KPR · DB Asli
                </span>
              </div>
              <p className="text-xs text-warmmuted mt-1">
                {projectName} · Lead kategori KPR otomatis masuk ke daftar ini; SE tinggal menyesuaikan bank, plafond &amp; progres akad.
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowAddForm((v) => !v)}
            className="px-4 py-2.5 rounded-xl bg-terracotta hover:bg-terracotta/90 text-white text-xs font-bold flex items-center gap-2 cursor-pointer shrink-0 shadow-sm"
          >
            <Plus className="size-4" /> {showAddForm ? 'Tutup Form' : 'Tambah Pengajuan KPR'}
          </button>
        </div>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white border border-warmborder rounded-xl p-4">
          <span className="text-[11px] text-warmmuted block">Total Pengajuan Aktif</span>
          <span className="text-xl font-bold text-espresso mt-1 block tabular-nums">
            {applications.length} <span className="text-xs font-normal text-warmmuted">Debitur</span>
          </span>
        </div>
        <div className="bg-white border border-warmborder rounded-xl p-4">
          <span className="text-[11px] text-warmmuted block">SLIK &amp; Appraisal Berjalan</span>
          <span className="text-xl font-bold text-terracotta mt-1 block tabular-nums">
            {applications.filter((a) => a.status === 'SLIK_BI_CHECKING' || a.status === 'APPRAISAL_JAMINAN').length}{' '}
            <span className="text-xs font-normal text-terracotta">Berkas</span>
          </span>
        </div>
        <div className="bg-white border border-warmborder rounded-xl p-4">
          <span className="text-[11px] text-warmmuted block">SP3K Terbit &amp; Akad</span>
          <span className="text-xl font-bold text-olive mt-1 block tabular-nums">
            {applications.filter((a) => a.status === 'SP3K_TERBIT' || a.status === 'AKAD_KREDIT').length}{' '}
            <span className="text-xs font-normal text-olive">Disetujui</span>
          </span>
        </div>
        <div className="bg-white border border-warmborder rounded-xl p-4">
          <span className="text-[11px] text-warmmuted block">Total Plafond Disetujui</span>
          <span className="text-xl font-bold text-espresso mt-1 block tabular-nums">
            Rp {(totalPlafondApproved / 1000000000).toFixed(2)}{' '}
            <span className="text-xs font-normal text-warmmuted">Miliar</span>
          </span>
        </div>
      </div>

      {/* Form Input Pengajuan */}
      {showAddForm && (
        <form
          onSubmit={handleAddApplication}
          className="bg-white border-2 border-terracotta/30 rounded-2xl p-5 space-y-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-warmborder">
            <h3 className="text-xs font-bold uppercase tracking-wider text-espresso flex items-center gap-2">
              <FileText className="size-3.5 text-terracotta" /> Pendaftaran Pengajuan Berkas KPR ke Bank
            </h3>
            <div className="flex items-center gap-1.5 bg-sandstone p-1 rounded-xl text-xs">
              <button
                type="button"
                onClick={() => setInputMode('LEAD')}
                className={`px-3 py-1 rounded-lg font-bold cursor-pointer ${
                  inputMode === 'LEAD' ? 'bg-espresso text-white' : 'text-warmmuted'
                }`}
              >
                Pilih dari Lead
              </button>
              <button
                type="button"
                onClick={() => setInputMode('MANUAL')}
                className={`px-3 py-1 rounded-lg font-bold cursor-pointer ${
                  inputMode === 'MANUAL' ? 'bg-espresso text-white' : 'text-warmmuted'
                }`}
              >
                Manual di Luar Lead
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 text-xs">
            {inputMode === 'LEAD' ? (
              <div className="sm:col-span-2">
                <label className="font-semibold text-espresso block mb-1">Pilih Lead dari Pipeline</label>
                <select
                  value={selectedLeadId}
                  onChange={(e) => handleSelectLead(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-warmborder bg-sandstone/50 text-espresso font-semibold"
                  required
                >
                  {leads.length === 0 ? (
                    <option value="">Belum ada lead</option>
                  ) : (
                    leads.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.full_name} ({l.payment_scheme || 'KPR'}) · {l.unit_interest || '-'}
                      </option>
                    ))
                  )}
                </select>
              </div>
            ) : (
              <>
                <div>
                  <label className="font-semibold text-espresso block mb-1">Nama Calon Debitur</label>
                  <input
                    type="text"
                    value={applicantName}
                    onChange={(e) => setApplicantName(e.target.value)}
                    placeholder="Contoh: Pak Budi Hartono"
                    className="w-full h-9 px-3 rounded-lg border border-warmborder bg-sandstone/50 text-espresso"
                    required
                  />
                </div>
                <div>
                  <label className="font-semibold text-espresso block mb-1">No. WhatsApp Debitur</label>
                  <input
                    type="text"
                    value={applicantPhone}
                    onChange={(e) => setApplicantPhone(e.target.value)}
                    placeholder="Contoh: 0812-9876-1122"
                    className="w-full h-9 px-3 rounded-lg border border-warmborder bg-sandstone/50 text-espresso"
                  />
                </div>
              </>
            )}

            <div>
              <label className="font-semibold text-espresso block mb-1">Kode Unit Kavling</label>
              <input
                type="text"
                value={unitCode}
                onChange={(e) => setUnitCode(e.target.value)}
                placeholder="Contoh: Nagoya A-02"
                className="w-full h-9 px-3 rounded-lg border border-warmborder bg-sandstone/50 text-espresso font-medium"
                required
              />
            </div>

            <div>
              <label className="font-semibold text-espresso block mb-1">Bank Rekanan Tujuan</label>
              <select
                value={targetBank}
                onChange={(e) => setTargetBank(e.target.value as BankApplicationRecord['targetBank'])}
                className="w-full h-9 px-3 rounded-lg border border-warmborder bg-sandstone/50 text-espresso font-medium"
              >
                <option value="Bank BSI">Bank BSI (Syariah)</option>
                <option value="Bank BTN">Bank BTN</option>
                <option value="Bank Mandiri">Bank Mandiri</option>
                <option value="Bank BRI">Bank BRI</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="font-semibold text-espresso block mb-1">Nilai Pengajuan Plafond (Rp)</label>
              <input
                type="number"
                value={plafondAmount}
                onChange={(e) => setPlafondAmount(Number(e.target.value))}
                className="w-full h-9 px-3 rounded-lg border border-warmborder bg-sandstone/50 text-espresso font-mono font-medium"
                step="10000000"
                min="0"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="font-semibold text-espresso block mb-1">Catatan Tambahan</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Catatan DP / kelengkapan berkas..."
                className="w-full h-9 px-3 rounded-lg border border-warmborder bg-sandstone/50 text-espresso"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-warmborder">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 rounded-xl bg-sandstone hover:bg-warmborder text-xs font-bold text-espresso cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl bg-terracotta hover:bg-terracotta/90 disabled:opacity-50 text-xs font-bold text-white cursor-pointer"
            >
              {submitting ? 'Menyimpan...' : 'Simpan Pengajuan KPR'}
            </button>
          </div>
        </form>
      )}

      {/* Filter Bar */}
      <div className="bg-white border border-warmborder rounded-2xl p-4 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1">
          <Search className="size-4 text-warmmuted absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nama pemohon atau unit kavling..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-10 pl-10 pr-4 rounded-xl border border-warmborder bg-sandstone text-xs font-medium text-espresso"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="size-3.5 text-warmmuted" />
          <select
            value={filterBank}
            onChange={(e) => setFilterBank(e.target.value)}
            className="h-10 px-3 rounded-xl border border-warmborder bg-sandstone text-xs font-bold text-espresso"
          >
            <option value="ALL">Semua Bank</option>
            <option value="Bank BSI">Bank BSI</option>
            <option value="Bank BTN">Bank BTN</option>
            <option value="Bank Mandiri">Bank Mandiri</option>
            <option value="Bank BRI">Bank BRI</option>
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="h-10 px-3 rounded-xl border border-warmborder bg-sandstone text-xs font-bold text-espresso"
          >
            <option value="ALL">Semua Tahap</option>
            {STATUS_ORDER.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s].label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Daftar Pengajuan */}
      {loading ? (
        <div className="bg-white border border-warmborder rounded-2xl p-8 text-center text-xs text-warmmuted">
          Menyelaraskan Lead KPR &amp; data pengajuan dari database...
        </div>
      ) : filteredApps.length === 0 ? (
        <div className="bg-white border border-warmborder rounded-2xl p-8 text-center text-xs text-warmmuted">
          Belum ada pengajuan KPR. Lead dengan skema pembayaran KPR akan otomatis muncul di sini.
        </div>
      ) : (
        <div className="space-y-3">
          {filteredApps.map((app) => {
            const st = STATUS_LABELS[app.status] || STATUS_LABELS.SUBMITTED_TO_BANK;
            const isEditing = editingId === app.id;
            const currentIdx = STATUS_ORDER.indexOf(app.status);
            const canAdvance = currentIdx !== -1 && currentIdx < STATUS_ORDER.length - 1;

            return (
              <div
                key={app.id}
                className="bg-white border border-warmborder rounded-2xl p-5 shadow-sm space-y-3"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-extrabold text-espresso">{app.applicantName}</h3>
                      <span className="px-2 py-0.5 rounded bg-sandstone text-espresso text-[11px] font-bold">
                        {app.unitCode}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-espresso text-white text-[11px] font-bold">
                        {app.targetBank}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-amber-50 text-terracotta border border-amber-200 text-[10px] font-bold">
                        {app.sourceMode === 'LEAD_AUTO'
                          ? 'Auto Lead KPR'
                          : app.sourceMode === 'LEAD_SELECTED'
                          ? 'Dari Lead'
                          : 'Manual'}
                      </span>
                    </div>
                    <p className="text-xs text-warmmuted mt-1">
                      Plafond: <strong className="text-espresso">Rp {app.plafondAmount.toLocaleString('id-ID')}</strong> ·
                      WA: {app.applicantPhone || '-'} · Analis: {app.assignedAnalyst || 'Belum ditentukan'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${st.colorClass}`}>
                      {st.label}
                    </span>
                    <button
                      type="button"
                      onClick={() => (isEditing ? setEditingId(null) : startEdit(app))}
                      className="px-3 py-1.5 rounded-lg bg-sandstone hover:bg-warmborder text-espresso text-xs font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Edit3 className="size-3.5" /> {isEditing ? 'Tutup' : 'Sesuaikan'}
                    </button>
                    {canAdvance && (
                      <button
                        type="button"
                        onClick={() => handleAdvanceStatus(app)}
                        className="px-3 py-1.5 rounded-lg bg-terracotta hover:bg-terracotta/90 text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
                      >
                        Majukan Tahap <ArrowRight className="size-3.5" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDeleteApp(app)}
                      className="p-1.5 rounded-lg bg-sandstone hover:bg-rose-100 text-warmmuted hover:text-rose-700 cursor-pointer"
                      title="Hapus Pengajuan KPR"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>

                {app.statusNotes && !isEditing && (
                  <p className="text-xs text-warmmuted bg-sandstone/50 px-3 py-2 rounded-xl border border-warmborder">
                    {app.statusNotes}
                  </p>
                )}

                {isEditing && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-warmborder text-xs">
                    <div>
                      <label className="font-bold text-espresso block mb-1">Nama Pemohon</label>
                      <input
                        type="text"
                        value={editApplicantName}
                        onChange={(e) => setEditApplicantName(e.target.value)}
                        className="w-full h-9 px-2.5 rounded-lg border border-warmborder bg-sandstone text-espresso font-medium"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-espresso block mb-1">No. WA Pemohon</label>
                      <input
                        type="text"
                        value={editApplicantPhone}
                        onChange={(e) => setEditApplicantPhone(e.target.value)}
                        className="w-full h-9 px-2.5 rounded-lg border border-warmborder bg-sandstone text-espresso"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-espresso block mb-1">Kode Unit</label>
                      <input
                        type="text"
                        value={editUnitCode}
                        onChange={(e) => setEditUnitCode(e.target.value)}
                        className="w-full h-9 px-2.5 rounded-lg border border-warmborder bg-sandstone text-espresso font-medium"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-espresso block mb-1">Tahap KPR</label>
                      <select
                        value={editStatus}
                        onChange={(e) => setEditStatus(e.target.value as BankSubmissionStatus)}
                        className="w-full h-9 px-2.5 rounded-lg border border-warmborder bg-sandstone text-espresso font-bold"
                      >
                        {(Object.keys(STATUS_LABELS) as BankSubmissionStatus[]).map((stKey) => (
                          <option key={stKey} value={stKey}>
                            {STATUS_LABELS[stKey].label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="font-bold text-espresso block mb-1">Bank Tujuan</label>
                      <select
                        value={editBank}
                        onChange={(e) => setEditBank(e.target.value as BankApplicationRecord['targetBank'])}
                        className="w-full h-9 px-2.5 rounded-lg border border-warmborder bg-sandstone text-espresso font-bold"
                      >
                        <option value="Bank BSI">Bank BSI</option>
                        <option value="Bank BTN">Bank BTN</option>
                        <option value="Bank Mandiri">Bank Mandiri</option>
                        <option value="Bank BRI">Bank BRI</option>
                      </select>
                    </div>
                    <div>
                      <label className="font-bold text-espresso block mb-1">Plafond (Rp)</label>
                      <input
                        type="number"
                        value={editPlafond}
                        onChange={(e) => setEditPlafond(Number(e.target.value))}
                        className="w-full h-9 px-2.5 rounded-lg border border-warmborder bg-sandstone text-espresso font-mono"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-espresso block mb-1">Analis Bank</label>
                      <input
                        type="text"
                        value={editAnalyst}
                        onChange={(e) => setEditAnalyst(e.target.value)}
                        placeholder="Nama PIC Analis Bank"
                        className="w-full h-9 px-2.5 rounded-lg border border-warmborder bg-sandstone text-espresso"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-espresso block mb-1">Catatan Progres</label>
                      <input
                        type="text"
                        value={editNotes}
                        onChange={(e) => setEditNotes(e.target.value)}
                        className="w-full h-9 px-2.5 rounded-lg border border-warmborder bg-sandstone text-espresso"
                      />
                    </div>
                    <div className="sm:col-span-2 lg:col-span-4 flex justify-end">
                      <button
                        type="button"
                        onClick={() => handleSaveEdit(app.id)}
                        className="px-4 py-1.5 rounded-lg bg-olive text-white font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <CheckCircle2 className="size-3.5" /> Simpan Penyesuaian
                      </button>
                    </div>
                  </div>
                )}

                {app.sp3kExpiryDate && (
                  <div className="text-[11px] text-olive font-semibold flex items-center gap-1">
                    <Clock className="size-3" /> Masa berlaku SP3K s/d {app.sp3kExpiryDate}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
