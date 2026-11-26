import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  Upload,
  Download,
  Eye,
  Building2,
  Search,
  Plus,
  ChevronDown,
  ChevronUp,
  FileText,
  Image as ImageIcon,
  FileSpreadsheet,
} from 'lucide-react';
import { loadPersistedState, savePersistedState } from '../lib/navigation/router';

export type DocCategory = 'KTP' | 'NPWP' | 'SLIP_GAJI' | 'REKENING_KORAN' | 'SURAT_NIKAH' | 'SPT_TAHUNAN' | 'FOTO_KONSUMEN' | 'FOTO_LOKASI' | 'LAINNYA';

export interface CustomerDocumentItem {
  id: string;
  docType: DocCategory;
  fileName: string;
  fileSize: string;
  fileType: 'pdf' | 'image' | 'doc';
  uploadedAt: string;
  expiresAt: string;
  status: 'TERVERIFIKASI' | 'PERLU_REVIEW' | 'EXPIRED';
  accessGrantedBanks: string[];
}

export interface CustomerVaultRecord {
  customerId: string;
  customerName: string;
  customerPhone: string;
  unitInterest: string;
  totalDocuments: number;
  lastUpdated: string;
  overallStatus: 'LENGKAP' | 'PROSES_REVIEW' | 'BELUM_LENGKAP';
  documents: CustomerDocumentItem[];
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
  const [customerVaults, setCustomerVaults] = useState<CustomerVaultRecord[]>(() =>
    loadPersistedState<CustomerVaultRecord[]>(`devos_customer_vaults_${projectId}`, [
      {
        customerId: 'cust_1',
        customerName: 'Pak Andi Pratama',
        customerPhone: '0812-3456-7890',
        unitInterest: 'Nagoya A-01',
        totalDocuments: 3,
        lastUpdated: '2026-11-24',
        overallStatus: 'LENGKAP',
        documents: [
          {
            id: 'doc_1',
            docType: 'KTP',
            fileName: 'ktp_andi_pratama_masked.pdf',
            fileSize: '1.2 MB',
            fileType: 'pdf',
            uploadedAt: '2026-11-24 14:20 WIB',
            expiresAt: '2026-12-24 (29 hari lagi)',
            status: 'TERVERIFIKASI',
            accessGrantedBanks: ['Bank BSI', 'Bank BTN'],
          },
          {
            id: 'doc_2',
            docType: 'NPWP',
            fileName: 'npwp_debitur_andi.pdf',
            fileSize: '850 KB',
            fileType: 'pdf',
            uploadedAt: '2026-11-24 14:22 WIB',
            expiresAt: '2026-12-24 (29 hari lagi)',
            status: 'TERVERIFIKASI',
            accessGrantedBanks: ['Bank BSI'],
          },
          {
            id: 'doc_3',
            docType: 'FOTO_KONSUMEN',
            fileName: 'pasfoto_andi_pratama_3x4.jpg',
            fileSize: '620 KB',
            fileType: 'image',
            uploadedAt: '2026-11-24 14:25 WIB',
            expiresAt: '2026-12-24 (29 hari lagi)',
            status: 'TERVERIFIKASI',
            accessGrantedBanks: ['Bank BSI', 'Bank BTN'],
          },
        ],
      },
      {
        customerId: 'cust_2',
        customerName: 'Ibu Ratna Dewi',
        customerPhone: '0813-9876-5432',
        unitInterest: 'Osaka B-03',
        totalDocuments: 2,
        lastUpdated: '2026-11-25',
        overallStatus: 'PROSES_REVIEW',
        documents: [
          {
            id: 'doc_4',
            docType: 'SLIP_GAJI',
            fileName: 'slip_gaji_3bln_pt_majumakmur.pdf',
            fileSize: '2.4 MB',
            fileType: 'pdf',
            uploadedAt: '2026-11-25 09:10 WIB',
            expiresAt: '2026-12-25 (30 hari lagi)',
            status: 'PERLU_REVIEW',
            accessGrantedBanks: ['Bank BSI', 'Bank BTN', 'Bank Mandiri'],
          },
          {
            id: 'doc_5',
            docType: 'REKENING_KORAN',
            fileName: 'rekening_koran_mandiri_3bln.pdf',
            fileSize: '4.8 MB',
            fileType: 'pdf',
            uploadedAt: '2026-11-25 09:15 WIB',
            expiresAt: '2026-12-25 (30 hari lagi)',
            status: 'TERVERIFIKASI',
            accessGrantedBanks: ['Bank Mandiri'],
          },
        ],
      },
      {
        customerId: 'cust_3',
        customerName: 'Pak Budi Hartono',
        customerPhone: '0811-2233-4455',
        unitInterest: 'Tokyo C-05',
        totalDocuments: 2,
        lastUpdated: '2026-11-23',
        overallStatus: 'LENGKAP',
        documents: [
          {
            id: 'doc_6',
            docType: 'SURAT_NIKAH',
            fileName: 'buku_nikah_budi_hartono.pdf',
            fileSize: '1.6 MB',
            fileType: 'pdf',
            uploadedAt: '2026-11-23 11:00 WIB',
            expiresAt: '2026-12-23 (28 hari lagi)',
            status: 'TERVERIFIKASI',
            accessGrantedBanks: ['Bank BTN', 'Bank BRI'],
          },
          {
            id: 'doc_7',
            docType: 'FOTO_LOKASI',
            fileName: 'foto_survei_unit_tokyo_c05.jpg',
            fileSize: '1.8 MB',
            fileType: 'image',
            uploadedAt: '2026-11-23 11:15 WIB',
            expiresAt: '2026-12-23 (28 hari lagi)',
            status: 'TERVERIFIKASI',
            accessGrantedBanks: ['Bank BTN'],
          },
        ],
      },
    ])
  );

  const [expandedCustomerId, setExpandedCustomerId] = useState<string | null>('cust_1');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [toast, setToast] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  // Form State
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('NEW');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [unitInterest, setUnitInterest] = useState('');
  const [docCategory, setDocCategory] = useState<DocCategory>('KTP');
  const [fileNameInput, setFileNameInput] = useState('');
  const [fileTypeCategory, setFileTypeCategory] = useState<'pdf' | 'image' | 'doc'>('pdf');
  const [bankBsi, setBankBsi] = useState(true);
  const [bankBtn, setBankBtn] = useState(false);
  const [bankMandiri, setBankMandiri] = useState(false);

  const showToastMsg = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleToggleBank = (customerId: string, docId: string, bank: string) => {
    const updated = customerVaults.map((cust) => {
      if (cust.customerId === customerId) {
        const docs = cust.documents.map((doc) => {
          if (doc.id === docId) {
            const has = doc.accessGrantedBanks.includes(bank);
            const banks = has
              ? doc.accessGrantedBanks.filter((b) => b !== bank)
              : [...doc.accessGrantedBanks, bank];
            return { ...doc, accessGrantedBanks: banks };
          }
          return doc;
        });
        return { ...cust, documents: docs };
      }
      return cust;
    });
    setCustomerVaults(updated);
    savePersistedState(`devos_customer_vaults_${projectId}`, updated);
    showToastMsg(`Hak akses dokumen untuk ${bank} berhasil diperbarui.`);
  };

  const handleAddDocument = (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = selectedCustomerId === 'NEW' ? customerName.trim() : (customerVaults.find((c) => c.customerId === selectedCustomerId)?.customerName || '');
    if (!finalName) {
      showToastMsg('Nama calon pelanggan wajib diisi');
      return;
    }

    const granted: string[] = [];
    if (bankBsi) granted.push('Bank BSI');
    if (bankBtn) granted.push('Bank BTN');
    if (bankMandiri) granted.push('Bank Mandiri');

    const ext = fileTypeCategory === 'image' ? 'jpg' : fileTypeCategory === 'doc' ? 'docx' : 'pdf';
    const computedFileName = fileNameInput.trim()
      ? (fileNameInput.includes('.') ? fileNameInput.trim() : `${fileNameInput.trim()}.${ext}`)
      : `${docCategory.toLowerCase()}_${finalName.toLowerCase().replace(/\s+/g, '_')}.${ext}`;

    const newDocItem: CustomerDocumentItem = {
      id: `doc_${Date.now()}`,
      docType: docCategory,
      fileName: computedFileName,
      fileSize: fileTypeCategory === 'image' ? '1.1 MB' : '1.4 MB',
      fileType: fileTypeCategory,
      uploadedAt: new Date().toISOString().replace('T', ' ').substring(0, 16) + ' WIB',
      expiresAt: '30 hari ke depan',
      status: 'PERLU_REVIEW',
      accessGrantedBanks: granted.length > 0 ? granted : ['Bank BSI'],
    };

    let nextVaults: CustomerVaultRecord[];
    if (selectedCustomerId !== 'NEW') {
      nextVaults = customerVaults.map((c) => {
        if (c.customerId === selectedCustomerId) {
          const updatedDocs = [newDocItem, ...c.documents];
          return {
            ...c,
            totalDocuments: updatedDocs.length,
            lastUpdated: new Date().toISOString().split('T')[0],
            documents: updatedDocs,
          };
        }
        return c;
      });
      setExpandedCustomerId(selectedCustomerId);
    } else {
      const newCustRecord: CustomerVaultRecord = {
        customerId: `cust_${Date.now()}`,
        customerName: finalName,
        customerPhone: customerPhone.trim() || '0812-xxxx-xxxx',
        unitInterest: unitInterest.trim() || 'Nagoya Townhouse',
        totalDocuments: 1,
        lastUpdated: new Date().toISOString().split('T')[0],
        overallStatus: 'PROSES_REVIEW',
        documents: [newDocItem],
      };
      nextVaults = [newCustRecord, ...customerVaults];
      setExpandedCustomerId(newCustRecord.customerId);
    }

    setCustomerVaults(nextVaults);
    savePersistedState(`devos_customer_vaults_${projectId}`, nextVaults);
    setCustomerName('');
    setCustomerPhone('');
    setUnitInterest('');
    setFileNameInput('');
    setShowAddForm(false);
    showToastMsg(`Dokumen/foto berhasil ditambahkan ke berkas ${finalName}`);
  };

  const filteredVaults = customerVaults.filter((c) => {
    const matchSearch =
      c.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.unitInterest.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.documents.some((d) => d.fileName.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchStatus = filterStatus === 'ALL' || c.overallStatus === filterStatus;
    return matchSearch && matchStatus;
  });

  const totalAllDocs = customerVaults.reduce((acc, curr) => acc + curr.documents.length, 0);
  const totalVerified = customerVaults.reduce(
    (acc, curr) => acc + curr.documents.filter((d) => d.status === 'TERVERIFIKASI').length,
    0
  );
  const totalReview = customerVaults.reduce(
    (acc, curr) => acc + curr.documents.filter((d) => d.status === 'PERLU_REVIEW').length,
    0
  );

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
                  <ShieldCheck className="size-3.5 text-olive" /> Terpusat per Pelanggan
                </span>
              </div>
              <p className="text-xs text-warmmuted mt-0.5">
                {projectName} &middot; Pengelompokan Berkas &amp; Foto Per Debitur (1 Pelanggan 1 Folder)
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
              <span>{showAddForm ? 'Tutup Form' : 'Unggah Dokumen / Foto'}</span>
            </button>
          </div>
        </div>

        {/* Banner Kepatuhan Regulasi & Privasi */}
        <div className="pt-3 border-t border-warmborder/60 text-xs text-warmmuted flex items-start gap-2">
          <ShieldCheck className="size-4 text-olive shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong className="text-espresso">Privasi Debitur Terproteksi:</strong> Seluruh berkas (KTP, NPWP, Slip Gaji, Foto) dikelompokkan rapi di bawah masing-masing nama konsumen dengan enkripsi AES-256.
          </p>
        </div>
      </div>

      {/* 4 Kartu Metrik Ringkas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white border border-warmborder rounded-xl p-4">
          <span className="text-[11px] text-warmmuted block">Total Pelanggan Terdaftar</span>
          <span className="text-xl font-bold text-espresso mt-1 block tabular-nums">
            {customerVaults.length} <span className="text-xs font-normal text-warmmuted">Nasabah</span>
          </span>
        </div>
        <div className="bg-white border border-warmborder rounded-xl p-4">
          <span className="text-[11px] text-warmmuted block">Total Dokumen &amp; Foto</span>
          <span className="text-xl font-bold text-espresso mt-1 block tabular-nums">
            {totalAllDocs} <span className="text-xs font-normal text-olive font-medium">Berkas</span>
          </span>
        </div>
        <div className="bg-white border border-warmborder rounded-xl p-4">
          <span className="text-[11px] text-warmmuted block">Terverifikasi &amp; Aman</span>
          <span className="text-xl font-bold text-espresso mt-1 block tabular-nums">
            {totalVerified} <span className="text-xs font-normal text-olive font-medium">Berkas</span>
          </span>
        </div>
        <div className="bg-white border border-warmborder rounded-xl p-4">
          <span className="text-[11px] text-warmmuted block">Perlu Verifikasi Tim</span>
          <span className="text-xl font-bold text-espresso mt-1 block tabular-nums">
            {totalReview} <span className="text-xs font-normal text-terracotta font-medium">Berkas</span>
          </span>
        </div>
      </div>

      {/* Form Tambah Dokumen / Foto */}
      {showAddForm && (
        <form
          onSubmit={handleAddDocument}
          className="bg-white border-2 border-terracotta/30 rounded-2xl p-4 sm:p-6 shadow-sm space-y-4 animate-in fade-in duration-200"
        >
          <div className="flex items-center justify-between pb-3 border-b border-warmborder">
            <h3 className="text-sm font-bold text-espresso flex items-center gap-2">
              <Upload className="size-4 text-terracotta" /> Unggah Berkas &amp; Foto Baru
            </h3>
            <span className="text-xs text-warmmuted">Pilih pelanggan yang sudah ada atau buat baru</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div>
              <label className="font-semibold text-espresso block mb-1">Target Pelanggan</label>
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="w-full h-9 px-3 rounded-lg border border-warmborder bg-sandstone/50 text-espresso font-semibold"
              >
                <option value="NEW">+ Tambah Pelanggan Baru</option>
                {customerVaults.map((c) => (
                  <option key={c.customerId} value={c.customerId}>
                    {c.customerName} ({c.unitInterest})
                  </option>
                ))}
              </select>
            </div>

            {selectedCustomerId === 'NEW' && (
              <>
                <div>
                  <label className="font-semibold text-espresso block mb-1">Nama Calon Debitur</label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Contoh: Pak Hendra Kusuma"
                    className="w-full h-9 px-3 rounded-lg border border-warmborder bg-sandstone/50 text-espresso"
                    required
                  />
                </div>
                <div>
                  <label className="font-semibold text-espresso block mb-1">Nomor WhatsApp</label>
                  <input
                    type="text"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="Contoh: 0812-3456-7890"
                    className="w-full h-9 px-3 rounded-lg border border-warmborder bg-sandstone/50 text-espresso"
                  />
                </div>
                <div>
                  <label className="font-semibold text-espresso block mb-1">Unit Minat</label>
                  <input
                    type="text"
                    value={unitInterest}
                    onChange={(e) => setUnitInterest(e.target.value)}
                    placeholder="Contoh: Nagoya A-03"
                    className="w-full h-9 px-3 rounded-lg border border-warmborder bg-sandstone/50 text-espresso"
                  />
                </div>
              </>
            )}

            <div>
              <label className="font-semibold text-espresso block mb-1">Kategori Dokumen / Foto</label>
              <select
                value={docCategory}
                onChange={(e) => setDocCategory(e.target.value as DocCategory)}
                className="w-full h-9 px-3 rounded-lg border border-warmborder bg-sandstone/50 text-espresso font-medium"
              >
                <option value="KTP">KTP (Kartu Tanda Penduduk)</option>
                <option value="NPWP">NPWP Pribadi</option>
                <option value="SLIP_GAJI">Slip Gaji 3 Bulan</option>
                <option value="REKENING_KORAN">Rekening Koran</option>
                <option value="SURAT_NIKAH">Buku / Surat Nikah</option>
                <option value="SPT_TAHUNAN">SPT Tahunan</option>
                <option value="FOTO_KONSUMEN">Pasfoto Konsumen (3x4/4x6)</option>
                <option value="FOTO_LOKASI">Foto Lokasi / Survei Unit</option>
                <option value="LAINNYA">Dokumen Tambahan Lainnya</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-espresso block mb-1">Format Berkas</label>
              <select
                value={fileTypeCategory}
                onChange={(e) => setFileTypeCategory(e.target.value as 'pdf' | 'image' | 'doc')}
                className="w-full h-9 px-3 rounded-lg border border-warmborder bg-sandstone/50 text-espresso font-medium"
              >
                <option value="pdf">PDF Dokumen Resmi (.pdf)</option>
                <option value="image">Gambar / Foto (.jpg, .png)</option>
                <option value="doc">Dokumen Word / Form (.docx)</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-espresso block mb-1">Nama File (Opsional)</label>
              <input
                type="text"
                value={fileNameInput}
                onChange={(e) => setFileNameInput(e.target.value)}
                placeholder="Biarkan kosong untuk nama otomatis"
                className="w-full h-9 px-3 rounded-lg border border-warmborder bg-sandstone/50 text-espresso"
              />
            </div>
          </div>

          <div>
            <label className="font-semibold text-espresso block mb-1 text-xs">Beri Akses Langsung ke Bank Mitra KPR:</label>
            <div className="flex flex-wrap gap-4 pt-1">
              <label className="inline-flex items-center gap-2 text-xs font-medium text-espresso cursor-pointer">
                <input
                  type="checkbox"
                  checked={bankBsi}
                  onChange={(e) => setBankBsi(e.target.checked)}
                  className="rounded text-terracotta focus:ring-terracotta"
                />
                Bank Syariah Indonesia (BSI)
              </label>
              <label className="inline-flex items-center gap-2 text-xs font-medium text-espresso cursor-pointer">
                <input
                  type="checkbox"
                  checked={bankBtn}
                  onChange={(e) => setBankBtn(e.target.checked)}
                  className="rounded text-terracotta focus:ring-terracotta"
                />
                Bank Tabungan Negara (BTN)
              </label>
              <label className="inline-flex items-center gap-2 text-xs font-medium text-espresso cursor-pointer">
                <input
                  type="checkbox"
                  checked={bankMandiri}
                  onChange={(e) => setBankMandiri(e.target.checked)}
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
              className="h-8 px-3 rounded-lg border border-warmborder text-xs font-medium text-espresso hover:bg-sandstone cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="h-8 px-4 rounded-lg bg-terracotta hover:bg-terracotta/90 text-white text-xs font-semibold cursor-pointer shadow-xs"
            >
              Simpan &amp; Enkripsi ke Vault
            </button>
          </div>
        </form>
      )}

      {/* Toolbar Filter & Pencarian */}
      <div className="bg-white border border-warmborder rounded-xl p-3.5 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="relative flex-1">
          <Search className="size-3.5 text-warmmuted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari nama pelanggan, nomor unit, atau nama berkas..."
            className="w-full h-9 pl-8 pr-3 rounded-lg border border-warmborder bg-sandstone/40 text-xs text-espresso focus:outline-none focus:border-terracotta font-medium"
          />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="h-9 px-3 rounded-lg border border-warmborder bg-sandstone/40 text-xs font-medium text-espresso focus:outline-none focus:border-terracotta"
          >
            <option value="ALL">Semua Kelengkapan</option>
            <option value="LENGKAP">Berkas Lengkap</option>
            <option value="PROSES_REVIEW">Proses Review</option>
          </select>
        </div>
      </div>

      {/* Daftar Vault Terpadu Per Pelanggan (Accordion View) */}
      <div className="space-y-3">
        {filteredVaults.length === 0 ? (
          <div className="bg-white border border-warmborder rounded-xl p-8 text-center text-xs text-warmmuted">
            Tidak ada data debitur yang cocok dengan pencarian.
          </div>
        ) : (
          filteredVaults.map((customer) => {
            const isExpanded = expandedCustomerId === customer.customerId;
            return (
              <div
                key={customer.customerId}
                className="bg-white border border-warmborder rounded-xl overflow-hidden transition-all shadow-xs"
              >
                {/* Baris Utama Pelanggan (1 Baris Ringkas) */}
                <div
                  onClick={() => setExpandedCustomerId(isExpanded ? null : customer.customerId)}
                  className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 hover:bg-sandstone/20 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="size-9 rounded-lg bg-sandstone border border-warmborder flex items-center justify-center text-espresso font-bold text-xs shrink-0">
                      {customer.customerName.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-xs text-espresso">{customer.customerName}</span>
                        <span className="text-[11px] text-warmmuted">({customer.customerPhone})</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-sandstone text-espresso border border-warmborder flex items-center gap-1">
                          <Building2 className="size-2.5 text-terracotta" /> {customer.unitInterest}
                        </span>
                      </div>
                      <span className="text-[11px] text-warmmuted mt-0.5 block">
                        Diperbarui: {customer.lastUpdated}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                        customer.overallStatus === 'LENGKAP'
                          ? 'bg-olive/10 text-olive border-olive/30'
                          : 'bg-amber-50 text-amber-800 border-amber-200'
                      }`}
                    >
                      {customer.overallStatus === 'LENGKAP' ? 'Berkas Lengkap' : 'Proses Review'}
                    </span>
                    <span className="text-xs font-semibold text-espresso bg-sandstone px-2.5 py-1 rounded-lg border border-warmborder">
                      {customer.documents.length} Berkas
                    </span>
                    <div className="text-warmmuted">
                      {isExpanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                    </div>
                  </div>
                </div>

                {/* Rincian Dokumen & Foto di Dalam Pelanggan */}
                {isExpanded && (
                  <div className="border-t border-warmborder bg-sandstone/30 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-warmmuted">
                        Daftar Berkas Terenkripsi ({customer.documents.length}):
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedCustomerId(customer.customerId);
                          setShowAddForm(true);
                        }}
                        className="text-xs text-terracotta hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="size-3" /> Tambah Berkas untuk {customer.customerName.split(' ')[0]}
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                      {customer.documents.map((doc) => (
                        <div
                          key={doc.id}
                          className="bg-white border border-warmborder rounded-lg p-3 flex items-start justify-between gap-2.5 hover:shadow-2xs transition-shadow"
                        >
                          <div className="flex items-start gap-2.5 min-w-0 flex-1">
                            <div className="size-8 rounded-lg bg-sandstone border border-warmborder flex items-center justify-center shrink-0 mt-0.5">
                              {doc.fileType === 'image' ? (
                                <ImageIcon className="size-4 text-terracotta" />
                              ) : doc.fileType === 'doc' ? (
                                <FileSpreadsheet className="size-4 text-olive" />
                              ) : (
                                <FileText className="size-4 text-espresso" />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-espresso text-white">
                                  {doc.docType.replace('_', ' ')}
                                </span>
                                <span className="font-mono text-[11px] text-espresso font-semibold truncate max-w-[160px]">
                                  {doc.fileName}
                                </span>
                              </div>
                              <span className="text-[10px] text-warmmuted mt-0.5 block">
                                {doc.fileSize} &middot; Diunggah: {doc.uploadedAt}
                              </span>
                              <div className="flex flex-wrap gap-1 mt-1.5">
                                {['Bank BSI', 'Bank BTN', 'Bank Mandiri'].map((bank) => {
                                  const active = doc.accessGrantedBanks.includes(bank);
                                  return (
                                    <button
                                      key={bank}
                                      type="button"
                                      onClick={() => handleToggleBank(customer.customerId, doc.id, bank)}
                                      className={`px-1.5 py-0.2 rounded text-[9px] font-medium border transition-colors cursor-pointer ${
                                        active
                                          ? 'bg-olive text-white border-olive'
                                          : 'bg-sandstone text-warmmuted border-warmborder hover:bg-sandstone/80'
                                      }`}
                                      title={`Klik untuk ubah akses ${bank}`}
                                    >
                                      {bank} {active ? '✓' : '+'}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => showToastMsg(`Membuka berkas ${doc.fileName}...`)}
                              className="size-7 rounded bg-sandstone hover:bg-warmborder text-espresso flex items-center justify-center cursor-pointer transition-colors"
                              title="Lihat Berkas"
                            >
                              <Eye className="size-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => showToastMsg(`Mengunduh pre-signed URL untuk ${doc.fileName}...`)}
                              className="size-7 rounded bg-espresso hover:bg-espresso/90 text-white flex items-center justify-center cursor-pointer transition-colors"
                              title="Unduh Berkas"
                            >
                              <Download className="size-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
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
