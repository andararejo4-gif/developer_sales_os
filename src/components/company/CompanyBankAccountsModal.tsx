// ============================================================================
// MODAL MANAJEMEN REKENING RESMI PERUSAHAAN (ROLE SM & ADMIN)
// Sesuai Blueprint Developer Sales OS v1.5 & Penutupan Temuan Kritis T2
// ============================================================================

import React, { useEffect, useState } from 'react';
import { Building2, Plus, Edit2, Trash2, Star, X, AlertCircle } from 'lucide-react';
import type { RoleKey, UserProfile } from '../../data';

export interface CompanyBankAccount {
  id: string;
  project_id: string;
  bank_name: string;
  account_number: string;
  account_holder: string;
  is_primary: boolean;
  is_active: boolean;
  notes: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

const BANK_ACCOUNTS_STORAGE_KEY = 'devos_company_bank_accounts';

export const DEFAULT_COMPANY_BANK_ACCOUNTS: CompanyBankAccount[] = [
  {
    id: 'acc-bca-01',
    project_id: 'the-park-townhouse',
    bank_name: 'Bank BCA',
    account_number: '016489545',
    account_holder: 'PT Andara Rejo Makmur',
    is_primary: true,
    is_active: true,
    notes: 'Rekening utama booking fee dan DP unit The Park Townhouse',
    created_by: 'direksi@andararejomakmur.co.id',
    created_at: '2026-11-20T08:00:00.000Z',
    updated_at: '2026-11-20T08:00:00.000Z',
  },
  {
    id: 'acc-mandiri-02',
    project_id: 'the-park-townhouse',
    bank_name: 'Bank Mandiri',
    account_number: '1380022334455',
    account_holder: 'PT Andara Rejo Makmur',
    is_primary: false,
    is_active: true,
    notes: 'Rekening operasional pelunasan akad KPR dan cicilan in-house',
    created_by: 'direksi@andararejomakmur.co.id',
    created_at: '2026-11-20T08:00:00.000Z',
    updated_at: '2026-11-20T08:00:00.000Z',
  },
];

function loadStoredBankAccounts(): CompanyBankAccount[] {
  if (typeof localStorage === 'undefined') return DEFAULT_COMPANY_BANK_ACCOUNTS;
  try {
    const raw = localStorage.getItem(BANK_ACCOUNTS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(BANK_ACCOUNTS_STORAGE_KEY, JSON.stringify(DEFAULT_COMPANY_BANK_ACCOUNTS));
      return DEFAULT_COMPANY_BANK_ACCOUNTS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_COMPANY_BANK_ACCOUNTS;
  } catch {
    return DEFAULT_COMPANY_BANK_ACCOUNTS;
  }
}

function saveStoredBankAccounts(accs: CompanyBankAccount[]) {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(BANK_ACCOUNTS_STORAGE_KEY, JSON.stringify(accs));
  } catch {
    /* ignore */
  }
}

interface CompanyBankAccountsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  role: RoleKey;
  projectId?: string;
  projectName?: string;
}

export const CompanyBankAccountsModal: React.FC<CompanyBankAccountsModalProps> = ({
  isOpen,
  onClose,
  user,
  role,
  projectId = 'the-park-townhouse',
  projectName = 'The Park Townhouse',
}) => {
  const [accounts, setAccounts] = useState<CompanyBankAccount[]>(() => loadStoredBankAccounts());
  const [loading, setLoading] = useState<boolean>(false);
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form Fields
  const [bankName, setBankName] = useState<string>('BCA');
  const [accountNumber, setAccountNumber] = useState<string>('');
  const [accountHolder, setAccountHolder] = useState<string>('PT Andara Rejo Makmur');
  const [isPrimary, setIsPrimary] = useState<boolean>(false);
  const [notes, setNotes] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [toast, setToast] = useState<string | null>(null);

  const canManage = ['SM', 'ADMIN', 'DIREKSI', 'IT'].includes(role);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/company/bank-accounts', {
        headers: {
          'X-User-Email': user.email,
          'X-User-Role': role,
        },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.ok && Array.isArray(data.data) && data.data.length > 0) {
          setAccounts(data.data);
          saveStoredBankAccounts(data.data);
          setLoading(false);
          return;
        }
      }
    } catch {
      // Backend API offline / proxy timeout -> fallback ke localStorage
    } finally {
      setLoading(false);
    }
    const local = loadStoredBankAccounts();
    setAccounts(local);
  };

  useEffect(() => {
    if (isOpen) {
      fetchAccounts();
    }
  }, [isOpen]);

  const handleOpenAdd = () => {
    setEditingId(null);
    setBankName('BCA');
    setAccountNumber('');
    setAccountHolder('PT Andara Rejo Makmur');
    setIsPrimary(accounts.length === 0);
    setNotes('');
    setIsFormOpen(true);
  };

  const handleOpenEdit = (acc: CompanyBankAccount) => {
    setEditingId(acc.id);
    setBankName(acc.bank_name);
    setAccountNumber(acc.account_number);
    setAccountHolder(acc.account_holder);
    setIsPrimary(acc.is_primary);
    setNotes(acc.notes || '');
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bankName.trim() || !accountNumber.trim()) {
      showToast('Nama bank dan nomor rekening wajib diisi.');
      return;
    }

    setSubmitting(true);
    const holder = accountHolder.trim() || 'PT Andara Rejo Makmur';

    try {
      const method = editingId ? 'PUT' : 'POST';
      const body = {
        id: editingId || undefined,
        projectId,
        bankName: bankName.trim(),
        accountNumber: accountNumber.trim(),
        accountHolder: holder,
        isPrimary,
        notes: notes.trim(),
      };

      await fetch('/api/company/bank-accounts', {
        method,
        headers: {
          'Content-Type': 'application/json',
          'X-User-Email': user.email,
          'X-User-Role': role,
        },
        body: JSON.stringify(body),
      });
    } catch {
      // Offline fallback: tetap lanjut simpan ke penyimpanan lokal
    }

    // Persistensi fallback ke localStorage
    const current = loadStoredBankAccounts();
    const now = new Date().toISOString();
    let updated: CompanyBankAccount[];

    if (editingId) {
      updated = current.map((item) => {
        if (item.id === editingId) {
          return {
            ...item,
            bank_name: bankName.trim(),
            account_number: accountNumber.trim(),
            account_holder: holder,
            is_primary: isPrimary,
            notes: notes.trim(),
            updated_at: now,
          };
        }
        if (isPrimary && item.project_id === projectId) {
          return { ...item, is_primary: false, updated_at: now };
        }
        return item;
      });
    } else {
      const newAcc: CompanyBankAccount = {
        id: `acc-${Date.now()}`,
        project_id: projectId,
        bank_name: bankName.trim(),
        account_number: accountNumber.trim(),
        account_holder: holder,
        is_primary: isPrimary,
        is_active: true,
        notes: notes.trim(),
        created_by: user.email,
        created_at: now,
        updated_at: now,
      };
      const adjusted = isPrimary
        ? current.map((item) => (item.project_id === projectId ? { ...item, is_primary: false } : item))
        : current;
      updated = [newAcc, ...adjusted];
    }

    saveStoredBankAccounts(updated);
    setAccounts(updated);
    showToast(editingId ? 'Rekening berhasil diperbarui!' : 'Rekening resmi baru berhasil ditambahkan!');
    setIsFormOpen(false);
    setEditingId(null);
    setSubmitting(false);
  };

  const handleDelete = async (id: string, bank: string) => {
    if (!window.confirm(`Yakin ingin menghapus rekening resmi ${bank}?`)) return;

    try {
      await fetch(`/api/company/bank-accounts?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: {
          'X-User-Email': user.email,
          'X-User-Role': role,
        },
      });
    } catch {
      // Offline fallback
    }

    const current = loadStoredBankAccounts();
    const updated = current.filter((a) => a.id !== id);
    saveStoredBankAccounts(updated);
    setAccounts(updated);
    showToast('Rekening berhasil dihapus.');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl border border-warmborder space-y-5 animate-in fade-in zoom-in-95 duration-150 my-8 max-h-[90vh] flex flex-col">
        {/* Header Modal */}
        <div className="flex items-center justify-between pb-3 border-b border-warmborder shrink-0">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-amber-50 text-terracotta flex items-center justify-center shrink-0">
              <Building2 className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-extrabold text-espresso">
                  Rekening Resmi Perusahaan &amp; Proyek
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                  Rekening Sah Terverifikasi
                </span>
              </div>
              <p className="text-xs text-warmmuted">
                Dikelola oleh <strong>SM &amp; Admin</strong> · Digunakan AI sebagai sumber kebenaran nomor rekening pembayaran.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="size-8 rounded-xl bg-sandstone hover:bg-warmborder text-espresso flex items-center justify-center cursor-pointer shrink-0"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Info Keamanan Pembayaran */}
        <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-espresso space-y-1 shrink-0">
          <div className="flex items-center gap-1.5 font-bold text-terracotta">
            <AlertCircle className="size-4 shrink-0" />
            <span>Keamanan Pembayaran &amp; Rekening Sah Perusahaan</span>
          </div>
          <p className="text-warmmuted text-[11px] leading-relaxed">
            AI dilarang merekomendasikan nomor rekening di luar daftar ini. Seluruh booking fee dan pelunasan konsumen wajib ditransfer ke rekening resmi atas nama PT Andara Rejo Makmur.
          </p>
        </div>

        {/* Content Area */}
        <div className="space-y-4 overflow-y-auto pr-1 flex-1">
          {/* Action Bar */}
          <div className="flex items-center justify-between gap-3">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-warmmuted">
              Daftar Rekening Terdaftar ({accounts.length})
            </h4>
            {canManage && !isFormOpen && (
              <button
                type="button"
                onClick={handleOpenAdd}
                className="min-h-[38px] px-3.5 rounded-xl bg-terracotta hover:bg-terracotta/90 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Plus className="size-4" />
                <span>Tambah Rekening Baru</span>
              </button>
            )}
          </div>

          {/* Form Tambah/Edit */}
          {isFormOpen && (
            <form onSubmit={handleSubmit} className="p-4 rounded-xl border border-terracotta/30 bg-amber-50/30 space-y-3.5">
              <div className="flex items-center justify-between">
                <h5 className="text-xs font-bold text-espresso">
                  {editingId ? 'Edit Rekening Resmi' : 'Tambah Rekening Resmi Baru'}
                </h5>
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="text-warmmuted hover:text-espresso text-xs font-bold"
                >
                  Batal
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-espresso mb-1">Nama Bank *</label>
                  <select
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="w-full min-h-[40px] px-3 rounded-xl border border-warmborder bg-white text-xs font-bold focus:border-terracotta focus:outline-none"
                  >
                    <option value="BCA">Bank BCA</option>
                    <option value="Bank Mandiri">Bank Mandiri</option>
                    <option value="Bank Syariah Indonesia (BSI)">Bank Syariah Indonesia (BSI)</option>
                    <option value="Bank BTN">Bank BTN (Mitra KPR)</option>
                    <option value="Bank BRI">Bank BRI</option>
                    <option value="Bank BNI">Bank BNI</option>
                    <option value="Bank Jateng">Bank Jateng</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-espresso mb-1">Nomor Rekening *</label>
                  <input
                    type="text"
                    required
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    placeholder="Contoh: 0158829100"
                    className="w-full min-h-[40px] px-3 rounded-xl border border-warmborder bg-white text-xs font-bold focus:border-terracotta focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-espresso mb-1">Atas Nama Rekening (Wajib Nama PT) *</label>
                  <input
                    type="text"
                    required
                    value={accountHolder}
                    onChange={(e) => setAccountHolder(e.target.value)}
                    placeholder="Contoh: PT Andara Rejo Makmur"
                    className="w-full min-h-[40px] px-3 rounded-xl border border-warmborder bg-white text-xs font-bold focus:border-terracotta focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-espresso mb-1">Catatan Penggunaan</label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Contoh: Rekening Utama Booking Fee & DP"
                    className="w-full min-h-[40px] px-3 rounded-xl border border-warmborder bg-white text-xs focus:border-terracotta focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="chk-primary"
                  checked={isPrimary}
                  onChange={(e) => setIsPrimary(e.target.checked)}
                  className="rounded text-terracotta focus:ring-terracotta size-4"
                />
                <label htmlFor="chk-primary" className="text-xs font-bold text-espresso cursor-pointer">
                  Jadikan Rekening Utama Proyek ({projectName})
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="min-h-[38px] px-4 rounded-xl bg-sandstone text-espresso text-xs font-bold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="min-h-[38px] px-5 rounded-xl bg-terracotta text-white text-xs font-bold cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Menyimpan...' : editingId ? 'Simpan Perubahan' : 'Simpan Rekening'}
                </button>
              </div>
            </form>
          )}

          {/* List Rekening */}
          {loading ? (
            <div className="p-8 text-center text-xs text-warmmuted">Memuat data rekening...</div>
          ) : accounts.length === 0 ? (
            <div className="p-8 text-center text-xs text-warmmuted border border-dashed border-warmborder rounded-xl">
              Belum ada rekening resmi yang terdaftar. Tambahkan rekening pertama Anda.
            </div>
          ) : (
            <div className="space-y-2.5">
              {accounts.map((acc) => (
                <div
                  key={acc.id}
                  className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    acc.is_primary
                      ? 'bg-amber-50/50 border-amber-300 ring-1 ring-amber-200'
                      : 'bg-white border-warmborder'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <strong className="text-sm font-extrabold text-espresso">{acc.bank_name}</strong>
                      {acc.is_primary && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500 text-white">
                          <Star className="size-3 fill-white" />
                          <span>Utama</span>
                        </span>
                      )}
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sandstone text-espresso">
                        {acc.is_active ? 'Aktif' : 'Non-Aktif'}
                      </span>
                    </div>

                    <p className="text-xs font-mono font-bold text-terracotta">
                      {acc.account_number} <span className="font-sans font-normal text-warmmuted">a.n</span> {acc.account_holder}
                    </p>

                    {acc.notes && <p className="text-[11px] text-warmmuted">{acc.notes}</p>}
                  </div>

                  {canManage && (
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(acc)}
                        className="size-8 rounded-lg bg-sandstone hover:bg-warmborder text-espresso flex items-center justify-center cursor-pointer"
                        title="Edit rekening"
                      >
                        <Edit2 className="size-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(acc.id, acc.bank_name)}
                        className="size-8 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 flex items-center justify-center cursor-pointer"
                        title="Hapus rekening"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-warmborder shrink-0">
          <span className="text-[11px] text-warmmuted">
            Status login: <strong>{user.name}</strong> ({role})
          </span>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[40px] px-5 rounded-xl bg-espresso text-white text-xs font-bold cursor-pointer"
          >
            Tutup
          </button>
        </div>

        {/* Toast */}
        {toast && (
          <div className="fixed bottom-6 right-6 z-50 bg-espresso text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-lg animate-in fade-in">
            {toast}
          </div>
        )}
      </div>
    </div>
  );
};
