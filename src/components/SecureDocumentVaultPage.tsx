import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  Upload,
  Clock,
  Download,
  Eye,
  Building2,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Plus,
} from 'lucide-react';
import { loadPersistedState, savePersistedState } from '../lib/navigation/router';

export interface VaultDocument {
  id: string;
  docType: 'KTP' | 'NPWP' | 'SLIP_GAJI' | 'REKENING_KORAN' | 'SURAT_NIKAH' | 'SPT_TAHUNAN';
  leadName: string;
  unitInterest: string;
  fileName: string;
  fileSize: string;
  uploadedAt: string;
  expiresAt: string;
  status: 'TERVERIFIKASI' | 'PERLU_REVIEW' | 'EXPIRED';
  accessGrantedBanks: string[];
}

interface SecureDocumentVaultPageProps {
  projectName?: string;
  projectId?: string;
  userRole?: string;
}

export const SecureDocumentVaultPage: React.FC<SecureDocumentVaultPageProps> = ({
  projectName = 'The Park Townhouse Sukoharjo',
  projectId = 'the-park-sukoharjo',
}) => {
  const [documents, setDocuments] = useState<VaultDocument[]>(() =>
    loadPersistedState<VaultDocument[]>(`devos_vault_docs_${projectId}`, [
      {
        id: 'doc_1',
        docType: 'KTP',
        leadName: 'Pak Andi Pratama',
        unitInterest: 'Nagoya A-01',
        fileName: 'ktp_andi_pratama_masked.pdf',
        fileSize: '1.2 MB',
        uploadedAt: '2026-11-24 14:20 WIB',
        expiresAt: '2026-12-24 (29 hari lagi)',
        status: 'TERVERIFIKASI',
        accessGrantedBanks: ['Bank BSI', 'Bank BTN'],
      },
      {
        id: 'doc_2',
        docType: 'NPWP',
        leadName: 'Pak Andi Pratama',
        unitInterest: 'Nagoya A-01',
        fileName: 'npwp_debitur_andi.pdf',
        fileSize: '850 KB',
        uploadedAt: '2026-11-24 14:22 WIB',
        expiresAt: '2026-12-24 (29 hari lagi)',
        status: 'TERVERIFIKASI',
        accessGrantedBanks: ['Bank BSI'],
      },
      {
        id: 'doc_3',
        docType: 'SLIP_GAJI',
        leadName: 'Ibu Ratna Dewi',
        unitInterest: 'Osaka B-03',
        fileName: 'slip_gaji_3bln_pt_majumakmur.pdf',
        fileSize: '2.4 MB',
        uploadedAt: '2026-11-25 09:10 WIB',
        expiresAt: '2026-12-25 (30 hari lagi)',
        status: 'PERLU_REVIEW',
        accessGrantedBanks: ['Bank BSI', 'Bank BTN', 'Bank Mandiri'],
      },
      {
        id: 'doc_4',
        docType: 'REKENING_KORAN',
        leadName: 'Ibu Ratna Dewi',
        unitInterest: 'Osaka B-03',
        fileName: 'rekening_koran_mandiri_3bln.pdf',
        fileSize: '4.8 MB',
        uploadedAt: '2026-11-25 09:15 WIB',
        expiresAt: '2026-12-25 (30 hari lagi)',
        status: 'TERVERIFIKASI',
        accessGrantedBanks: ['Bank Mandiri'],
      },
      {
        id: 'doc_5',
        docType: 'SURAT_NIKAH',
        leadName: 'Pak Budi Hartono',
        unitInterest: 'Tokyo C-05',
        fileName: 'buku_nikah_budi_hartono.pdf',
        fileSize: '1.6 MB',
        uploadedAt: '2026-11-23 11:00 WIB',
        expiresAt: '2026-12-23 (28 hari lagi)',
        status: 'TERVERIFIKASI',
        accessGrantedBanks: ['Bank BTN', 'Bank BRI'],
      },
    ])
  );

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [toast, setToast] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  // Form State
  const [newLeadName, setNewLeadName] = useState('');
  const [newUnit, setNewUnit] = useState('');
  const [newDocType, setNewDocType] = useState<VaultDocument['docType']>('KTP');
  const [newBankBsi, setNewBankBsi] = useState(true);
  const [newBankBtn, setNewBankBtn] = useState(false);
  const [newBankMandiri, setNewBankMandiri] = useState(false);

  const showToastMsg = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleToggleBank = (docId: string, bank: string) => {
    const updated = documents.map((doc) => {
      if (doc.id === docId) {
        const has = doc.accessGrantedBanks.includes(bank);
        const banks = has
          ? doc.accessGrantedBanks.filter((b) => b !== bank)
          : [...doc.accessGrantedBanks, bank];
        return { ...doc, accessGrantedBanks: banks };
      }
      return doc;
    });
    setDocuments(updated);
    savePersistedState(`devos_vault_docs_${projectId}`, updated);
    showToastMsg(`Hak akses dokumen untuk ${bank} berhasil diperbarui.`);
  };

  const handleAddDocument = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLeadName.trim()) {
      showToastMsg('Nama calon debitur wajib diisi');
      return;
    }

    const granted: string[] = [];
    if (newBankBsi) granted.push('Bank BSI');
    if (newBankBtn) granted.push('Bank BTN');
    if (newBankMandiri) granted.push('Bank Mandiri');

    const newDoc: VaultDocument = {
      id: `doc_${Date.now()}`,
      docType: newDocType,
      leadName: newLeadName.trim(),
      unitInterest: newUnit.trim() || 'Unit Standard',
      fileName: `${newDocType.toLowerCase()}_${newLeadName.toLowerCase().replace(/\s+/g, '_')}_encrypted.pdf`,
      fileSize: '1.5 MB',
      uploadedAt: 'Hari ini (Baru)',
      expiresAt: '30 hari ke depan',
      status: 'PERLU_REVIEW',
      accessGrantedBanks: granted.length > 0 ? granted : ['Bank BSI'],
    };

    const next = [newDoc, ...documents];
    setDocuments(next);
    savePersistedState(`devos_vault_docs_${projectId}`, next);
    setNewLeadName('');
    setNewUnit('');
    setShowAddForm(false);
    showToastMsg('Dokumen KPR baru berhasil diunggah ke Vault Terenkripsi AES-256.');
  };

  const filteredDocs = documents.filter((doc) => {
    const matchSearch =
      doc.leadName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.unitInterest.toLowerCase().includes(searchTerm.toLowerCase());
    const matchType = filterType === 'ALL' || doc.docType === filterType;
    const matchStatus = filterStatus === 'ALL' || doc.status === filterStatus;
    return matchSearch && matchType && matchStatus;
  });

  const verifiedCount = documents.filter((d) => d.status === 'TERVERIFIKASI').length;
  const reviewCount = documents.filter((d) => d.status === 'PERLU_REVIEW').length;

  return (
    <div className="space-y-5 pb-20 md:pb-8">
      {/* Header Halaman Utama (Quiet Chrome) */}
      <div className="bg-white border border-warmborder rounded-2xl p-5 sm:p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5 min-w-0">
            <div className="size-10 sm:size-11 rounded-xl bg-sandstone border border-warmborder text-espresso flex items-center justify-center shrink-0">
              <Lock className="size-5 text-olive" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-espresso">
                  Dokumen Vault KPR
                </h1>
                <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-sandstone text-espresso/80 border border-warmborder flex items-center gap-1 shrink-0">
                  <ShieldCheck className="size-3.5 text-olive" /> AES-256 GCM
                </span>
              </div>
              <p className="text-xs text-warmmuted mt-0.5">
                {projectName} &middot; Berkas Pemohon KPR &amp; Hak Akses Perbankan
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowAddForm(!showAddForm)}
              className="h-9 px-3.5 rounded-lg bg-terracotta hover:bg-terracotta/90 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="size-3.5 shrink-0" />
              <span>{showAddForm ? 'Tutup Form' : 'Unggah Dokumen'}</span>
            </button>
          </div>
        </div>

        {/* Banner Kepatuhan Regulasi & Privasi */}
        <div className="pt-3 border-t border-warmborder/60 text-xs text-warmmuted flex items-start gap-2">
          <ShieldCheck className="size-4 text-olive shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong className="text-espresso">UU PDP &amp; Standar Perbankan:</strong> Berkas terenkripsi dengan pre-signed URL (kadaluarsa 30 hari). Akses terbatas hanya untuk bank mitra yang disetujui.
          </p>
        </div>
      </div>

      {/* 4 Kartu Metrik Ringkas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white border border-warmborder rounded-xl p-4">
          <span className="text-[11px] text-warmmuted block">Total Dokumen Vault</span>
          <span className="text-xl font-bold text-espresso mt-1 block tabular-nums">
            {documents.length} <span className="text-xs font-normal text-warmmuted">Berkas</span>
          </span>
        </div>
        <div className="bg-white border border-warmborder rounded-xl p-4">
          <span className="text-[11px] text-warmmuted block">Terverifikasi &amp; Aman</span>
          <span className="text-xl font-bold text-espresso mt-1 block tabular-nums">
            {verifiedCount} <span className="text-xs font-normal text-olive font-medium">Berkas</span>
          </span>
        </div>
        <div className="bg-white border border-warmborder rounded-xl p-4">
          <span className="text-[11px] text-warmmuted block">Perlu Review</span>
          <span className="text-xl font-bold text-espresso mt-1 block tabular-nums">
            {reviewCount} <span className="text-xs font-normal text-terracotta font-medium">Berkas</span>
          </span>
        </div>
        <div className="bg-white border border-warmborder rounded-xl p-4">
          <span className="text-[11px] text-warmmuted block">Bank Mitra Terkoneksi</span>
          <span className="text-xl font-bold text-espresso mt-1 block tabular-nums">
            4 Bank <span className="text-xs font-normal text-warmmuted">(BSI, BTN, Mandiri, BRI)</span>
          </span>
        </div>
      </div>

      {/* Form Tambah Dokumen (Inline Page Form, Bukan Popup) */}
      {showAddForm && (
        <form
          onSubmit={handleAddDocument}
          className="bg-white border-2 border-terracotta/30 rounded-2xl p-4 sm:p-6 shadow-sm space-y-4 animate-in fade-in duration-200"
        >
          <div className="flex items-center justify-between pb-3 border-b border-warmborder">
            <h3 className="text-sm font-extrabold text-espresso flex items-center gap-2">
              <Upload className="size-4 text-terracotta" /> Form Unggah Dokumen Sensitif Debitur KPR
            </h3>
            <span className="text-xs text-warmmuted">Enkripsi otomatis saat simpan</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="font-bold text-espresso block mb-1">Nama Calon Debitur / Nasabah</label>
              <input
                type="text"
                value={newLeadName}
                onChange={(e) => setNewLeadName(e.target.value)}
                placeholder="Contoh: Budi Santoso"
                className="w-full h-10 px-3 rounded-xl border border-warmborder bg-sandstone text-espresso focus:outline-none focus:ring-1 focus:ring-terracotta font-medium"
                required
              />
            </div>
            <div>
              <label className="font-bold text-espresso block mb-1">Unit Pilihan Konsumen</label>
              <input
                type="text"
                value={newUnit}
                onChange={(e) => setNewUnit(e.target.value)}
                placeholder="Contoh: Nagoya A-02"
                className="w-full h-10 px-3 rounded-xl border border-warmborder bg-sandstone text-espresso focus:outline-none focus:ring-1 focus:ring-terracotta font-medium"
              />
            </div>
            <div>
              <label className="font-bold text-espresso block mb-1">Jenis Dokumen KPR</label>
              <select
                value={newDocType}
                onChange={(e) => setNewDocType(e.target.value as VaultDocument['docType'])}
                className="w-full h-10 px-3 rounded-xl border border-warmborder bg-sandstone text-espresso focus:outline-none focus:ring-1 focus:ring-terracotta font-bold"
              >
                <option value="KTP">KTP (Kartu Tanda Penduduk)</option>
                <option value="NPWP">NPWP Pribadi</option>
                <option value="SLIP_GAJI">Slip Gaji 3 Bulan Terakhir</option>
                <option value="REKENING_KORAN">Rekening Koran 3 Bulan</option>
                <option value="SURAT_NIKAH">Buku / Surat Nikah</option>
                <option value="SPT_TAHUNAN">SPT Tahunan PPh 21</option>
              </select>
            </div>
          </div>

          <div>
            <label className="font-bold text-espresso block mb-1 text-xs">Beri Akses Langsung ke Bank Mitra KPR:</label>
            <div className="flex flex-wrap gap-4 pt-1">
              <label className="inline-flex items-center gap-2 text-xs font-semibold text-espresso cursor-pointer">
                <input
                  type="checkbox"
                  checked={newBankBsi}
                  onChange={(e) => setNewBankBsi(e.target.checked)}
                  className="rounded text-terracotta focus:ring-terracotta"
                />
                Bank Syariah Indonesia (BSI)
              </label>
              <label className="inline-flex items-center gap-2 text-xs font-semibold text-espresso cursor-pointer">
                <input
                  type="checkbox"
                  checked={newBankBtn}
                  onChange={(e) => setNewBankBtn(e.target.checked)}
                  className="rounded text-terracotta focus:ring-terracotta"
                />
                Bank Tabungan Negara (BTN)
              </label>
              <label className="inline-flex items-center gap-2 text-xs font-semibold text-espresso cursor-pointer">
                <input
                  type="checkbox"
                  checked={newBankMandiri}
                  onChange={(e) => setNewBankMandiri(e.target.checked)}
                  className="rounded text-terracotta focus:ring-terracotta"
                />
                Bank Mandiri KPR
              </label>
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-2 border-t border-warmborder">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 rounded-xl border border-warmborder text-xs font-bold text-espresso hover:bg-sandstone cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-terracotta hover:bg-terracotta/90 text-white text-xs font-bold cursor-pointer shadow-xs"
            >
              Simpan &amp; Enkripsi ke Vault
            </button>
          </div>
        </form>
      )}

      {/* Toolbar Filter & Pencarian */}
      <div className="bg-white border border-warmborder rounded-2xl p-4 shadow-2xs flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="relative flex-1">
          <Search className="size-4 text-warmmuted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari berdasarkan nama debitur, nomor unit, atau nama berkas..."
            className="w-full h-10 pl-9 pr-3 rounded-xl border border-warmborder bg-sandstone text-xs text-espresso focus:outline-none focus:ring-1 focus:ring-terracotta font-medium"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <div className="flex items-center gap-1.5 text-xs text-warmmuted font-bold">
            <Filter className="size-3.5" /> Filter:
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="h-10 px-3 rounded-xl border border-warmborder bg-sandstone text-xs font-bold text-espresso focus:outline-none focus:ring-1 focus:ring-terracotta"
          >
            <option value="ALL">Semua Tipe Berkas</option>
            <option value="KTP">KTP</option>
            <option value="NPWP">NPWP</option>
            <option value="SLIP_GAJI">Slip Gaji</option>
            <option value="REKENING_KORAN">Rekening Koran</option>
            <option value="SURAT_NIKAH">Buku Nikah</option>
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="h-10 px-3 rounded-xl border border-warmborder bg-sandstone text-xs font-bold text-espresso focus:outline-none focus:ring-1 focus:ring-terracotta"
          >
            <option value="ALL">Semua Status</option>
            <option value="TERVERIFIKASI">Terverifikasi</option>
            <option value="PERLU_REVIEW">Perlu Review</option>
          </select>
        </div>
      </div>

      {/* Tabel Dokumen Vault */}
      <div className="bg-white border border-warmborder rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-sandstone/70 border-b border-warmborder text-[11px] font-black uppercase tracking-wider text-warmmuted">
              <tr>
                <th className="py-3 px-4">Debitur &amp; Unit</th>
                <th className="py-3 px-4">Tipe &amp; Nama Berkas</th>
                <th className="py-3 px-4">Status &amp; Masa Berlaku</th>
                <th className="py-3 px-4">Hak Akses Bank</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-warmborder">
              {filteredDocs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-warmmuted">
                    Tidak ada dokumen vault yang cocok dengan kriteria pencarian.
                  </td>
                </tr>
              ) : (
                filteredDocs.map((doc) => (
                  <tr key={doc.id} className="hover:bg-sandstone/30 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-espresso text-xs">{doc.leadName}</div>
                      <div className="text-[11px] text-warmmuted flex items-center gap-1 mt-0.5">
                        <Building2 className="size-3 text-terracotta" /> {doc.unitInterest}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-espresso text-white text-[10px] font-extrabold shrink-0">
                          {doc.docType}
                        </span>
                        <span className="font-mono text-xs text-espresso font-semibold truncate max-w-[180px] sm:max-w-[240px]">
                          {doc.fileName}
                        </span>
                      </div>
                      <div className="text-[11px] text-warmmuted mt-0.5 flex items-center gap-2">
                        <span>{doc.fileSize}</span>
                        <span>&bull;</span>
                        <span>Diunggah: {doc.uploadedAt}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5">
                        {doc.status === 'TERVERIFIKASI' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-olive/10 text-olive border border-olive/30">
                            <CheckCircle2 className="size-3" /> Terverifikasi
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-50 text-amber-800 border border-amber-300">
                            <AlertCircle className="size-3" /> Perlu Review
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-warmmuted flex items-center gap-1 mt-1">
                        <Clock className="size-3 text-warmmuted" /> Berlaku s/d: {doc.expiresAt}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap gap-1.5 max-w-[200px]">
                        {['Bank BSI', 'Bank BTN', 'Bank Mandiri'].map((bank) => {
                          const active = doc.accessGrantedBanks.includes(bank);
                          return (
                            <button
                              key={bank}
                              type="button"
                              onClick={() => handleToggleBank(doc.id, bank)}
                              className={`px-2 py-0.5 rounded-md text-[10px] font-bold border transition-colors cursor-pointer ${
                                active
                                  ? 'bg-olive text-white border-olive shadow-2xs'
                                  : 'bg-sandstone text-warmmuted border-warmborder hover:bg-sandstone/80'
                              }`}
                              title={`Klik untuk mengaktifkan / menonaktifkan akses ${bank}`}
                            >
                              {bank} {active ? '✓' : '+'}
                            </button>
                          );
                        })}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5 justify-end">
                        <button
                          type="button"
                          onClick={() => showToastMsg(`Membuka berkas terenkripsi ${doc.fileName} via secure viewer...`)}
                          className="size-8 rounded-lg bg-sandstone hover:bg-warmborder text-espresso flex items-center justify-center cursor-pointer transition-colors"
                          title="Lihat Berkas Terenkripsi"
                        >
                          <Eye className="size-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => showToastMsg(`Menghasilkan Signed URL aman (kadaluarsa 10 menit) untuk ${doc.fileName}...`)}
                          className="size-8 rounded-lg bg-espresso hover:bg-espresso/90 text-white flex items-center justify-center cursor-pointer transition-colors shadow-2xs"
                          title="Unduh Berkas Aman"
                        >
                          <Download className="size-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Floating Notification Toast */}
      {toast && (
        <div className="fixed bottom-20 md:bottom-6 right-4 z-50 bg-espresso text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-lg border border-white/10 animate-fade-in">
          {toast}
        </div>
      )}
    </div>
  );
};
