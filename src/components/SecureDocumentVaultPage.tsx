import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ShieldCheck,
  Lock,
  Upload,
  Clock,
  Building2,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  XCircle,
  UserCheck,
  FileText,
  Edit3,
} from 'lucide-react';
import { loadAuthSession } from '../lib/auth/dummy-accounts';

export interface VaultDocument {
  id: string;
  leadId?: string | null;
  docType: 'KTP' | 'NPWP' | 'SLIP_GAJI' | 'REKENING_KORAN' | 'SURAT_NIKAH' | 'SPT_TAHUNAN';
  leadName: string;
  unitInterest: string;
  fileName: string;
  fileSize: string;
  uploadedAt: string;
  expiresAt: string;
  status: 'TERVERIFIKASI' | 'PERLU_REVIEW' | 'DITOLAK' | 'EXPIRED';
  reviewedBy?: string | null;
  accessGrantedBanks: string[];
}

interface PipelineLeadOption {
  id: string;
  full_name: string;
  unit_interest: string;
  payment_scheme?: string;
}

interface DraftDocRow {
  docType: VaultDocument['docType'];
  fileName: string;
  fileSize: string;
}

interface SecureDocumentVaultPageProps {
  projectName?: string;
  projectId?: string;
  userRole?: string;
}

const BANK_OPTIONS = ['Bank BSI', 'Bank BTN', 'Bank Mandiri', 'Bank BRI'] as const;

function getAuthHeaders(): HeadersInit {
  const session = loadAuthSession();
  return {
    'Content-Type': 'application/json',
    ...(session?.token ? { Authorization: `Bearer ${session.token}` } : {}),
  };
}

function mapApiDoc(row: any): VaultDocument {
  const created = row.created_at ? new Date(row.created_at) : new Date();
  const expires = row.expires_at ? String(row.expires_at).slice(0, 10) : '-';
  let banks: string[] = [];
  if (Array.isArray(row.access_granted_banks)) {
    banks = row.access_granted_banks;
  } else if (typeof row.access_granted_banks === 'string') {
    try {
      const parsed = JSON.parse(row.access_granted_banks);
      if (Array.isArray(parsed)) banks = parsed;
    } catch {
      banks = [];
    }
  }
  return {
    id: String(row.id),
    leadId: row.lead_id ? String(row.lead_id) : null,
    docType: (row.doc_type || 'KTP') as VaultDocument['docType'],
    leadName: String(row.lead_full_name || row.lead_name || 'Tanpa Nama'),
    unitInterest: String(row.unit_interest || '-'),
    fileName: String(row.file_name || ''),
    fileSize: String(row.file_size || '1.0 MB'),
    uploadedAt: created.toLocaleString('id-ID', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }),
    expiresAt: expires,
    status: (row.status || 'PERLU_REVIEW') as VaultDocument['status'],
    reviewedBy: row.reviewed_by ? String(row.reviewed_by) : null,
    accessGrantedBanks: banks,
  };
}

export const SecureDocumentVaultPage: React.FC<SecureDocumentVaultPageProps> = ({
  projectName = 'The Park Townhouse Sukoharjo',
  projectId = 'the-park-sukoharjo',
  userRole = 'SE',
}) => {
  const [documents, setDocuments] = useState<VaultDocument[]>([]);
  const [leads, setLeads] = useState<PipelineLeadOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [toast, setToast] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  // Mode input: pilih lead (default) atau manual di luar lead
  const [inputMode, setInputMode] = useState<'LEAD' | 'MANUAL'>('LEAD');
  const [selectedLeadId, setSelectedLeadId] = useState('');
  const [manualLeadName, setManualLeadName] = useState('');
  const [unitInterest, setUnitInterest] = useState('');
  const [draftDocs, setDraftDocs] = useState<DraftDocRow[]>([
    { docType: 'KTP', fileName: '', fileSize: '1.0 MB' },
  ]);
  const [selectedBanks, setSelectedBanks] = useState<string[]>(['Bank BSI']);
  const [editingDocId, setEditingDocId] = useState<string | null>(null);
  const [editDocType, setEditDocType] = useState<VaultDocument['docType']>('KTP');
  const [editFileName, setEditFileName] = useState('');
  const [editUnitInterest, setEditUnitInterest] = useState('');
  const [editLeadName, setEditLeadName] = useState('');

  const canApprove = ['SM', 'ADMIN', 'TL', 'DIREKSI', 'SUPERADMIN', 'SUPERADMIN_IT'].includes(
    userRole
  );

  const showToastMsg = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3200);
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const headers = getAuthHeaders();
      const [docsRes, leadsRes] = await Promise.all([
        fetch(`/api/vault/documents?projectId=${encodeURIComponent(projectId)}`, {
          credentials: 'include',
          headers,
        }),
        fetch('/api/pipeline/leads', { credentials: 'include', headers }),
      ]);
      if (docsRes.ok) {
        const dJson = await docsRes.json();
        setDocuments(Array.isArray(dJson.documents) ? dJson.documents.map(mapApiDoc) : []);
      }
      if (leadsRes.ok) {
        const lJson = await leadsRes.json();
        const leadRows: PipelineLeadOption[] = Array.isArray(lJson.leads) ? lJson.leads : [];
        setLeads(leadRows);
        if (leadRows.length > 0 && !selectedLeadId) {
          setSelectedLeadId(leadRows[0].id);
          setUnitInterest(leadRows[0].unit_interest || '');
        }
      }
    } catch {
      showToastMsg('Gagal memuat data Vault dari server.');
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
      setUnitInterest(found.unit_interest || '');
    }
  };

  const handleAddDraftRow = () => {
    setDraftDocs((prev) => [...prev, { docType: 'NPWP', fileName: '', fileSize: '1.0 MB' }]);
  };

  const handleRemoveDraftRow = (idx: number) => {
    setDraftDocs((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleDraftChange = (idx: number, patch: Partial<DraftDocRow>) => {
    setDraftDocs((prev) => prev.map((row, i) => (i === idx ? { ...row, ...patch } : row)));
  };

  const handleFilePick = (idx: number, file: File | undefined) => {
    if (!file) return;
    const sizeMb =
      file.size >= 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
        : `${Math.max(1, Math.round(file.size / 1024))} KB`;
    handleDraftChange(idx, { fileName: file.name, fileSize: sizeMb });
  };

  const handleAddDocuments = async (e: React.FormEvent) => {
    e.preventDefault();
    if (inputMode === 'LEAD' && !selectedLeadId) {
      showToastMsg('Pilih nama lead terlebih dahulu.');
      return;
    }
    if (inputMode === 'MANUAL' && !manualLeadName.trim()) {
      showToastMsg('Nama debitur wajib diisi.');
      return;
    }
    const validDocs = draftDocs.filter((d) => d.fileName.trim().length > 0);
    if (validDocs.length === 0) {
      showToastMsg('Minimal 1 berkas dokumen (nama file) wajib diisi.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/vault/documents', {
        method: 'POST',
        credentials: 'include',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          projectId,
          leadId: inputMode === 'LEAD' ? selectedLeadId : null,
          leadName: inputMode === 'MANUAL' ? manualLeadName.trim() : undefined,
          unitInterest: unitInterest.trim(),
          documents: validDocs.map((d) => ({
            docType: d.docType,
            fileName: d.fileName.trim(),
            fileSize: d.fileSize,
            accessGrantedBanks: selectedBanks,
          })),
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        showToastMsg(json.error || 'Gagal menyimpan dokumen ke database.');
        return;
      }
      const created = Array.isArray(json.documents) ? json.documents.map(mapApiDoc) : [];
      setDocuments((prev) => [...created, ...prev]);
      setDraftDocs([{ docType: 'KTP', fileName: '', fileSize: '1.0 MB' }]);
      setManualLeadName('');
      setShowAddForm(false);
      showToastMsg(`${created.length} dokumen berhasil disimpan ke database.`);
    } catch {
      showToastMsg('Gagal terhubung ke server.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleBankAccess = async (doc: VaultDocument, bankName: string) => {
    const hasAccess = doc.accessGrantedBanks.includes(bankName);
    const nextBanks = hasAccess
      ? doc.accessGrantedBanks.filter((b) => b !== bankName)
      : [...doc.accessGrantedBanks, bankName];

    try {
      const res = await fetch('/api/vault/documents', {
        method: 'PATCH',
        credentials: 'include',
        headers: getAuthHeaders(),
        body: JSON.stringify({ id: doc.id, accessGrantedBanks: nextBanks }),
      });
      if (res.ok) {
        setDocuments((prev) =>
          prev.map((d) => (d.id === doc.id ? { ...d, accessGrantedBanks: nextBanks } : d))
        );
        showToastMsg(
          hasAccess
            ? `Akses ${bankName} untuk ${doc.fileName} dicabut`
            : `Akses ${bankName} untuk ${doc.fileName} dibuka`
        );
      }
    } catch {
      showToastMsg('Gagal memperbarui akses bank.');
    }
  };

  const handleApproval = async (
    doc: VaultDocument,
    status: 'TERVERIFIKASI' | 'DITOLAK'
  ) => {
    try {
      const res = await fetch('/api/vault/documents', {
        method: 'PATCH',
        credentials: 'include',
        headers: getAuthHeaders(),
        body: JSON.stringify({ id: doc.id, status }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        showToastMsg(json.error || 'Gagal memperbarui status verifikasi.');
        return;
      }
      setDocuments((prev) =>
        prev.map((d) => (d.id === doc.id ? mapApiDoc(json.document) : d))
      );
      showToastMsg(
        status === 'TERVERIFIKASI'
          ? `Dokumen ${doc.fileName} disetujui.`
          : `Dokumen ${doc.fileName} ditolak.`
      );
    } catch {
      showToastMsg('Gagal menghubungi server.');
    }
  };

  const startEditDoc = (doc: VaultDocument) => {
    setEditingDocId(doc.id);
    setEditDocType(doc.docType);
    setEditFileName(doc.fileName);
    setEditUnitInterest(doc.unitInterest === '-' ? '' : doc.unitInterest);
    setEditLeadName(doc.leadName);
  };

  const handleSaveEditDoc = async (doc: VaultDocument) => {
    if (!editFileName.trim()) {
      showToastMsg('Nama berkas wajib diisi.');
      return;
    }
    try {
      const res = await fetch('/api/vault/documents', {
        method: 'PATCH',
        credentials: 'include',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          id: doc.id,
          docType: editDocType,
          fileName: editFileName.trim(),
          unitInterest: editUnitInterest.trim(),
          leadName: editLeadName.trim() || doc.leadName,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        showToastMsg(json.error || 'Gagal memperbarui dokumen.');
        return;
      }
      setDocuments((prev) =>
        prev.map((d) =>
          d.id === doc.id
            ? {
                ...mapApiDoc(json.document),
                leadName: editLeadName.trim() || d.leadName,
              }
            : d
        )
      );
      setEditingDocId(null);
      showToastMsg(`Dokumen ${editFileName.trim()} diperbarui.`);
    } catch {
      showToastMsg('Gagal terhubung ke server.');
    }
  };

  const handleDeleteDoc = async (doc: VaultDocument) => {
    if (!window.confirm(`Hapus dokumen "${doc.fileName}" milik ${doc.leadName}?`)) return;
    try {
      const res = await fetch(`/api/vault/documents?id=${encodeURIComponent(doc.id)}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: getAuthHeaders(),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok && json.ok) {
        setDocuments((prev) => prev.filter((d) => d.id !== doc.id));
        showToastMsg(`Dokumen ${doc.fileName} dihapus.`);
      } else {
        showToastMsg(json.error || 'Gagal menghapus dokumen.');
      }
    } catch {
      showToastMsg('Gagal menghapus dokumen.');
    }
  };

  const filteredDocs = useMemo(() => {
    return documents.filter((doc) => {
      const matchSearch =
        doc.leadName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.unitInterest.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.fileName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchType = filterType === 'ALL' || doc.docType === filterType;
      const matchStatus = filterStatus === 'ALL' || doc.status === filterStatus;
      return matchSearch && matchType && matchStatus;
    });
  }, [documents, searchTerm, filterType, filterStatus]);

  // Kelompokkan berdasarkan nama pengguna / debitur agar multi-dokumen terlihat rapi per nama
  const groupedByUser = useMemo(() => {
    const map = new Map<
      string,
      { key: string; leadName: string; unitInterest: string; docs: VaultDocument[] }
    >();
    for (const doc of filteredDocs) {
      const key = `${doc.leadId || doc.leadName.toLowerCase()}__${doc.leadName}`;
      const existing = map.get(key);
      if (existing) {
        existing.docs.push(doc);
      } else {
        map.set(key, {
          key,
          leadName: doc.leadName,
          unitInterest: doc.unitInterest,
          docs: [doc],
        });
      }
    }
    return Array.from(map.values());
  }, [filteredDocs]);

  const verifiedCount = documents.filter((d) => d.status === 'TERVERIFIKASI').length;
  const reviewCount = documents.filter((d) => d.status === 'PERLU_REVIEW').length;

  return (
    <div className="space-y-6">
      {toast && (
        <div className="fixed bottom-4 right-4 z-50 bg-espresso text-white px-4 py-3 rounded-xl shadow-lg text-sm font-medium flex items-center gap-2 border border-white/10">
          <ShieldCheck className="size-4 text-amber-400" />
          <span>{toast}</span>
        </div>
      )}

      {/* Header */}
      <div className="bg-white border border-warmborder rounded-2xl p-4 sm:p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5 min-w-0">
            <div className="size-12 rounded-2xl bg-olive/10 border border-olive/20 flex items-center justify-center shrink-0">
              <Lock className="size-6 text-olive" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg sm:text-xl font-extrabold text-espresso">Dokumen Vault KPR</h1>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-olive/10 text-olive text-[11px] font-bold border border-olive/20">
                  <ShieldCheck className="size-3" /> Data Nyata PostgreSQL
                </span>
              </div>
              <p className="text-xs text-warmmuted mt-1">
                {projectName} · Berkas Pemohon KPR Dikelompokkan per Nama Debitur &amp; Hak Akses Perbankan
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowAddForm((v) => !v)}
            className="px-4 py-2.5 rounded-xl bg-terracotta hover:bg-terracotta/90 text-white text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer shrink-0 self-start lg:self-center shadow-sm whitespace-nowrap"
          >
            <Plus className="size-4" /> {showAddForm ? 'Tutup Form' : 'Unggah Dokumen Debitur'}
          </button>
        </div>
      </div>

      {/* Ringkasan KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white border border-warmborder rounded-xl p-4">
          <span className="text-[11px] text-warmmuted block">Total Debitur Terdaftar</span>
          <span className="text-xl font-bold text-espresso mt-1 block tabular-nums">
            {groupedByUser.length} <span className="text-xs font-normal text-warmmuted">Nama</span>
          </span>
        </div>
        <div className="bg-white border border-warmborder rounded-xl p-4">
          <span className="text-[11px] text-warmmuted block">Total Dokumen Vault</span>
          <span className="text-xl font-bold text-espresso mt-1 block tabular-nums">
            {documents.length} <span className="text-xs font-normal text-warmmuted">Berkas</span>
          </span>
        </div>
        <div className="bg-white border border-warmborder rounded-xl p-4">
          <span className="text-[11px] text-warmmuted block">Terverifikasi &amp; Aman</span>
          <span className="text-xl font-bold text-olive mt-1 block tabular-nums">
            {verifiedCount} <span className="text-xs font-normal text-olive font-medium">Berkas</span>
          </span>
        </div>
        <div className="bg-white border border-warmborder rounded-xl p-4">
          <span className="text-[11px] text-warmmuted block">Menunggu Review SM/Admin</span>
          <span className="text-xl font-bold text-terracotta mt-1 block tabular-nums">
            {reviewCount} <span className="text-xs font-normal text-terracotta font-medium">Berkas</span>
          </span>
        </div>
      </div>

      {/* Form Tambah Multi-Dokumen */}
      {showAddForm && (
        <form
          onSubmit={handleAddDocuments}
          className="bg-white border-2 border-terracotta/30 rounded-2xl p-4 sm:p-6 shadow-sm space-y-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-warmborder">
            <h3 className="text-sm font-extrabold text-espresso flex items-center gap-2">
              <Upload className="size-4 text-terracotta" /> Unggah Multi-Dokumen per Debitur
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
                Input Manual
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            {inputMode === 'LEAD' ? (
              <div>
                <label className="font-bold text-espresso block mb-1">
                  Pilih Nama Lead (Dari Pipeline)
                </label>
                <select
                  value={selectedLeadId}
                  onChange={(e) => handleSelectLead(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-warmborder bg-sandstone text-espresso font-semibold"
                  required
                >
                  {leads.length === 0 ? (
                    <option value="">Belum ada lead di pipeline</option>
                  ) : (
                    leads.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.full_name} {l.unit_interest ? `· ${l.unit_interest}` : ''}
                      </option>
                    ))
                  )}
                </select>
              </div>
            ) : (
              <div>
                <label className="font-bold text-espresso block mb-1">
                  Nama Calon Debitur (Manual di Luar Lead)
                </label>
                <input
                  type="text"
                  value={manualLeadName}
                  onChange={(e) => setManualLeadName(e.target.value)}
                  placeholder="Contoh: Pak Budi Santoso"
                  className="w-full h-10 px-3 rounded-xl border border-warmborder bg-sandstone text-espresso font-medium"
                  required
                />
              </div>
            )}

            <div>
              <label className="font-bold text-espresso block mb-1">Unit Pilihan Konsumen</label>
              <input
                type="text"
                value={unitInterest}
                onChange={(e) => setUnitInterest(e.target.value)}
                placeholder="Contoh: Nagoya A-02"
                className="w-full h-10 px-3 rounded-xl border border-warmborder bg-sandstone text-espresso font-medium"
              />
            </div>
          </div>

          {/* Daftar Multi-Dokumen */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="font-bold text-espresso text-xs">
                Daftar Dokumen yang Diunggah untuk Nama Ini ({draftDocs.length} Berkas)
              </label>
              <button
                type="button"
                onClick={handleAddDraftRow}
                className="px-3 py-1.5 rounded-lg bg-sandstone hover:bg-warmborder text-espresso text-xs font-bold flex items-center gap-1 cursor-pointer"
              >
                <Plus className="size-3.5" /> Tambah Baris Dokumen
              </button>
            </div>

            {draftDocs.map((row, idx) => (
              <div
                key={idx}
                className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center bg-sandstone/60 p-3 rounded-xl border border-warmborder text-xs"
              >
                <div className="sm:col-span-3">
                  <select
                    value={row.docType}
                    onChange={(e) =>
                      handleDraftChange(idx, {
                        docType: e.target.value as VaultDocument['docType'],
                      })
                    }
                    className="w-full h-9 px-2.5 rounded-lg border border-warmborder bg-white text-espresso font-bold"
                  >
                    <option value="KTP">KTP</option>
                    <option value="NPWP">NPWP</option>
                    <option value="SLIP_GAJI">Slip Gaji 3 Bln</option>
                    <option value="REKENING_KORAN">Rekening Koran 3 Bln</option>
                    <option value="SURAT_NIKAH">Buku / Surat Nikah</option>
                    <option value="SPT_TAHUNAN">SPT Tahunan PPh 21</option>
                  </select>
                </div>
                <div className="sm:col-span-5">
                  <input
                    type="text"
                    value={row.fileName}
                    onChange={(e) => handleDraftChange(idx, { fileName: e.target.value })}
                    placeholder="Nama berkas, mis: ktp_debitur.pdf"
                    className="w-full h-9 px-3 rounded-lg border border-warmborder bg-white text-espresso"
                    required
                  />
                </div>
                <div className="sm:col-span-3">
                  <input
                    type="file"
                    onChange={(e) => handleFilePick(idx, e.target.files?.[0])}
                    className="w-full text-[11px] text-warmmuted file:mr-2 file:py-1 file:px-2 file:rounded-lg file:border-0 file:bg-espresso file:text-white file:font-semibold"
                  />
                </div>
                <div className="sm:col-span-1 flex justify-end">
                  {draftDocs.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveDraftRow(idx)}
                      className="p-2 rounded-lg text-rose-600 hover:bg-rose-50 cursor-pointer"
                      title="Hapus baris"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Akses Bank */}
          <div>
            <label className="font-bold text-espresso block mb-1 text-xs">
              Beri Akses Langsung ke Bank Mitra KPR:
            </label>
            <div className="flex flex-wrap gap-4 pt-1">
              {BANK_OPTIONS.map((bank) => {
                const checked = selectedBanks.includes(bank);
                return (
                  <label
                    key={bank}
                    className="inline-flex items-center gap-2 text-xs font-semibold text-espresso cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() =>
                        setSelectedBanks((prev) =>
                          checked ? prev.filter((b) => b !== bank) : [...prev, bank]
                        )
                      }
                      className="rounded text-terracotta focus:ring-terracotta"
                    />
                    {bank}
                  </label>
                );
              })}
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
              {submitting ? 'Menyimpan...' : `Simpan ${draftDocs.length} Dokumen ke DB`}
            </button>
          </div>
        </form>
      )}

      {/* Filter & Search Bar */}
      <div className="bg-white border border-warmborder rounded-2xl p-4 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1">
          <Search className="size-4 text-warmmuted absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari berdasarkan nama debitur, nomor unit, atau nama berkas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-10 pl-10 pr-4 rounded-xl border border-warmborder bg-sandstone text-xs font-medium text-espresso focus:outline-none focus:ring-1 focus:ring-terracotta"
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-warmmuted font-medium">
            <Filter className="size-3.5" /> Filter:
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="h-10 px-3 rounded-xl border border-warmborder bg-sandstone text-xs font-bold text-espresso"
          >
            <option value="ALL">Semua Tipe Berkas</option>
            <option value="KTP">KTP</option>
            <option value="NPWP">NPWP</option>
            <option value="SLIP_GAJI">Slip Gaji</option>
            <option value="REKENING_KORAN">Rekening Koran</option>
            <option value="SURAT_NIKAH">Buku Nikah</option>
            <option value="SPT_TAHUNAN">SPT Tahunan</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="h-10 px-3 rounded-xl border border-warmborder bg-sandstone text-xs font-bold text-espresso"
          >
            <option value="ALL">Semua Status</option>
            <option value="TERVERIFIKASI">Terverifikasi</option>
            <option value="PERLU_REVIEW">Perlu Review</option>
            <option value="DITOLAK">Ditolak</option>
          </select>
        </div>
      </div>

      {/* Daftar Terkelompok per Nama Pengguna */}
      {loading ? (
        <div className="bg-white border border-warmborder rounded-2xl p-8 text-center text-xs text-warmmuted">
          Memuat dokumen vault dari database...
        </div>
      ) : groupedByUser.length === 0 ? (
        <div className="bg-white border border-warmborder rounded-2xl p-8 text-center text-xs text-warmmuted">
          Belum ada dokumen vault pada proyek ini. Klik <strong>Unggah Dokumen Debitur</strong> untuk menambahkan dari daftar Lead.
        </div>
      ) : (
        <div className="space-y-4">
          {groupedByUser.map((group) => (
            <div
              key={group.key}
              className="bg-white border border-warmborder rounded-2xl overflow-hidden shadow-sm"
            >
              {/* Header Nama Pengguna */}
              <div className="px-5 py-3.5 bg-sandstone/70 border-b border-warmborder flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="size-9 rounded-xl bg-espresso text-white flex items-center justify-center font-bold text-xs">
                    <UserCheck className="size-4 text-amber-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-espresso">{group.leadName}</h3>
                    <p className="text-[11px] text-warmmuted flex items-center gap-1">
                      <Building2 className="size-3 text-terracotta" /> {group.unitInterest || 'Unit belum ditentukan'}
                    </p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-white border border-warmborder text-[11px] font-bold text-espresso">
                  {group.docs.length} Dokumen Tersimpan
                </span>
              </div>

              {/* Daftar Dokumen Milik Pengguna Tersebut */}
              <div className="divide-y divide-warmborder">
                {group.docs.map((doc) => (
                  <React.Fragment key={doc.id}>
                  <div
                    className="p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3 hover:bg-sandstone/30"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2 py-0.5 rounded bg-espresso text-white text-[10px] font-bold">
                          {doc.docType}
                        </span>
                        <span className="font-mono text-xs font-bold text-espresso flex items-center gap-1.5">
                          <FileText className="size-3.5 text-terracotta" /> {doc.fileName}
                        </span>
                        <span className="text-[11px] text-warmmuted">({doc.fileSize})</span>
                      </div>
                      <div className="text-[11px] text-warmmuted flex items-center gap-3 flex-wrap">
                        <span>Diunggah: {doc.uploadedAt}</span>
                        <span className="inline-flex items-center gap-1">
                          <Clock className="size-3" /> Berlaku s/d: {doc.expiresAt}
                        </span>
                        {doc.reviewedBy && (
                          <span className="text-olive font-semibold">
                            Direview: {doc.reviewedBy}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {/* Status */}
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                          doc.status === 'TERVERIFIKASI'
                            ? 'bg-olive/10 text-olive border-olive/20'
                            : doc.status === 'DITOLAK'
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : 'bg-amber-50 text-terracotta border-amber-200'
                        }`}
                      >
                        {doc.status === 'TERVERIFIKASI' ? (
                          <CheckCircle2 className="size-3" />
                        ) : doc.status === 'DITOLAK' ? (
                          <XCircle className="size-3" />
                        ) : (
                          <AlertCircle className="size-3" />
                        )}
                        {doc.status}
                      </span>

                      {/* Akses Bank */}
                      <div className="flex flex-wrap gap-1">
                        {BANK_OPTIONS.slice(0, 3).map((bank) => {
                          const hasAccess = doc.accessGrantedBanks.includes(bank);
                          return (
                            <button
                              key={bank}
                              type="button"
                              onClick={() => handleToggleBankAccess(doc, bank)}
                              className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                                hasAccess
                                  ? 'bg-olive text-white'
                                  : 'bg-sandstone text-warmmuted hover:bg-warmborder'
                              }`}
                            >
                              {bank} {hasAccess ? '✓' : '+'}
                            </button>
                          );
                        })}
                      </div>

                      {/* Tombol Approve/Tolak untuk SM/Admin/TL/Direksi */}
                      {canApprove && doc.status !== 'TERVERIFIKASI' && (
                        <button
                          type="button"
                          onClick={() => handleApproval(doc, 'TERVERIFIKASI')}
                          className="px-2.5 py-1 rounded-lg bg-olive text-white text-[11px] font-bold hover:opacity-90 cursor-pointer"
                        >
                          Setujui
                        </button>
                      )}
                      {canApprove && doc.status === 'PERLU_REVIEW' && (
                        <button
                          type="button"
                          onClick={() => handleApproval(doc, 'DITOLAK')}
                          className="px-2.5 py-1 rounded-lg bg-rose-600 text-white text-[11px] font-bold hover:opacity-90 cursor-pointer"
                        >
                          Tolak
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() =>
                          editingDocId === doc.id ? setEditingDocId(null) : startEditDoc(doc)
                        }
                        className="p-1.5 rounded-lg bg-sandstone hover:bg-warmborder text-espresso cursor-pointer"
                        title="Edit Dokumen"
                      >
                        <Edit3 className="size-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteDoc(doc)}
                        className="p-1.5 rounded-lg bg-sandstone hover:bg-rose-100 text-warmmuted hover:text-rose-700 cursor-pointer"
                        title="Hapus Dokumen"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </div>
                  {editingDocId === doc.id && (
                    <div className="px-4 pb-4 pt-2 bg-sandstone/40 border-t border-warmborder grid grid-cols-1 sm:grid-cols-12 gap-2 items-end text-xs">
                      <div className="sm:col-span-3">
                        <label className="font-bold text-espresso block mb-1">Tipe Dokumen</label>
                        <select
                          value={editDocType}
                          onChange={(e) => setEditDocType(e.target.value as VaultDocument['docType'])}
                          className="w-full h-9 px-2.5 rounded-lg border border-warmborder bg-white text-espresso font-bold"
                        >
                          <option value="KTP">KTP</option>
                          <option value="NPWP">NPWP</option>
                          <option value="SLIP_GAJI">Slip Gaji 3 Bln</option>
                          <option value="REKENING_KORAN">Rekening Koran 3 Bln</option>
                          <option value="SURAT_NIKAH">Buku / Surat Nikah</option>
                          <option value="SPT_TAHUNAN">SPT Tahunan PPh 21</option>
                        </select>
                      </div>
                      <div className="sm:col-span-3">
                        <label className="font-bold text-espresso block mb-1">Nama Debitur</label>
                        <input
                          type="text"
                          value={editLeadName}
                          onChange={(e) => setEditLeadName(e.target.value)}
                          className="w-full h-9 px-2.5 rounded-lg border border-warmborder bg-white text-espresso"
                        />
                      </div>
                      <div className="sm:col-span-3">
                        <label className="font-bold text-espresso block mb-1">Nama Berkas</label>
                        <input
                          type="text"
                          value={editFileName}
                          onChange={(e) => setEditFileName(e.target.value)}
                          className="w-full h-9 px-2.5 rounded-lg border border-warmborder bg-white text-espresso"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="font-bold text-espresso block mb-1">Unit</label>
                        <input
                          type="text"
                          value={editUnitInterest}
                          onChange={(e) => setEditUnitInterest(e.target.value)}
                          className="w-full h-9 px-2.5 rounded-lg border border-warmborder bg-white text-espresso"
                        />
                      </div>
                      <div className="sm:col-span-1 flex justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => handleSaveEditDoc(doc)}
                          className="h-9 px-3 rounded-lg bg-olive text-white font-bold cursor-pointer"
                        >
                          Simpan
                        </button>
                      </div>
                    </div>
                  )}
                </React.Fragment>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
