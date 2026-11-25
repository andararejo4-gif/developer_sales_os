import React, { useState } from 'react';
import {
  Share2,
  Copy,
  Users,
  CheckCircle2,
  Plus,
  Search,
  Building2,
  Calendar,
  Check,
} from 'lucide-react';
import { loadPersistedState, savePersistedState } from '../lib/navigation/router';

export interface ReferralLeadRecord {
  id: string;
  advocateName: string;
  advocatePhone: string;
  advocateType: 'KONSUMEN_PEMILIK' | 'AGENT_EXTERNAL' | 'KARYAWAN';
  referredFriendName: string;
  referredFriendPhone: string;
  unitInterest: string;
  status: 'TERDAFTAR' | 'SURVEI_LOKASI' | 'BOOKING' | 'AKAD_SELESAI' | 'BATAL';
  rewardAmount: number;
  rewardStatus: 'PENDING_AKAD' | 'SIAP_CAIR' | 'SUDAH_DITRANSFER';
  registeredAt: string;
}

interface ReferralProgramPageProps {
  projectName?: string;
  projectId?: string;
  userRole?: string;
}

export const ReferralProgramPage: React.FC<ReferralProgramPageProps> = ({
  projectName = 'The Park Townhouse Sukoharjo',
  projectId = 'the-park-sukoharjo',
}) => {
  const [referrals, setReferrals] = useState<ReferralLeadRecord[]>(() =>
    loadPersistedState<ReferralLeadRecord[]>(`devos_referrals_${projectId}`, [
      {
        id: 'ref_1',
        advocateName: 'Ibu Anita Wijaya',
        advocatePhone: '0812-9876-5432',
        advocateType: 'KONSUMEN_PEMILIK',
        referredFriendName: 'Pak Hendra Kusuma',
        referredFriendPhone: '0813-1122-3344',
        unitInterest: 'Nagoya A-03',
        status: 'AKAD_SELESAI',
        rewardAmount: 5000000,
        rewardStatus: 'SUDAH_DITRANSFER',
        registeredAt: '2026-11-10',
      },
      {
        id: 'ref_2',
        advocateName: 'Pak Dimas Anggoro',
        advocatePhone: '0857-2233-4455',
        advocateType: 'AGENT_EXTERNAL',
        referredFriendName: 'Ibu Maya Safitri',
        referredFriendPhone: '0812-4455-6677',
        unitInterest: 'Osaka B-02',
        status: 'BOOKING',
        rewardAmount: 5000000,
        rewardStatus: 'PENDING_AKAD',
        registeredAt: '2026-11-18',
      },
      {
        id: 'ref_3',
        advocateName: 'Ibu Anita Wijaya',
        advocatePhone: '0812-9876-5432',
        advocateType: 'KONSUMEN_PEMILIK',
        referredFriendName: 'Pak Rully Setiawan',
        referredFriendPhone: '0818-7788-9900',
        unitInterest: 'Tokyo C-01',
        status: 'SURVEI_LOKASI',
        rewardAmount: 5000000,
        rewardStatus: 'PENDING_AKAD',
        registeredAt: '2026-11-23',
      },
      {
        id: 'ref_4',
        advocateName: 'Pak Joko Santoso',
        advocatePhone: '0811-3344-5566',
        advocateType: 'KONSUMEN_PEMILIK',
        referredFriendName: 'Ibu Clara Melinda',
        referredFriendPhone: '0878-1234-5678',
        unitInterest: 'Nagoya B-05',
        status: 'BOOKING',
        rewardAmount: 5000000,
        rewardStatus: 'SIAP_CAIR',
        registeredAt: '2026-11-20',
      },
    ])
  );

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [showAddForm, setShowAddForm] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  // Form states
  const [advocateName, setAdvocateName] = useState('');
  const [advocatePhone, setAdvocatePhone] = useState('');
  const [advocateType, setAdvocateType] = useState<ReferralLeadRecord['advocateType']>('KONSUMEN_PEMILIK');
  const [friendName, setFriendName] = useState('');
  const [friendPhone, setFriendPhone] = useState('');
  const [unitInterest, setUnitInterest] = useState('');

  const referralUrl = `https://theparktownhouse.com/ref?src=advocate_portal&proj=${projectId}`;

  const showToastMsg = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleCopyLink = () => {
    navigator.clipboard?.writeText(referralUrl);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
    showToastMsg('Tautan referral disalin');
  };

  const handleShareWa = () => {
    const text = encodeURIComponent(
      `Halo! Dapatkan info eksklusif & penawaran perdana unit di ${projectName} melalui tautan resmi ini: ${referralUrl}`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const handleAddReferral = (e: React.FormEvent) => {
    e.preventDefault();
    if (!advocateName.trim() || !friendName.trim()) {
      showToastMsg('Nama pemberi referral dan nama teman wajib diisi');
      return;
    }

    const newRecord: ReferralLeadRecord = {
      id: `ref_${Date.now()}`,
      advocateName: advocateName.trim(),
      advocatePhone: advocatePhone.trim() || '0812-xxxx-xxxx',
      advocateType,
      referredFriendName: friendName.trim(),
      referredFriendPhone: friendPhone.trim() || '0813-xxxx-xxxx',
      unitInterest: unitInterest.trim() || 'Nagoya Townhouse',
      status: 'TERDAFTAR',
      rewardAmount: 5000000,
      rewardStatus: 'PENDING_AKAD',
      registeredAt: new Date().toISOString().split('T')[0],
    };

    const next = [newRecord, ...referrals];
    setReferrals(next);
    savePersistedState(`devos_referrals_${projectId}`, next);

    setAdvocateName('');
    setAdvocatePhone('');
    setFriendName('');
    setFriendPhone('');
    setUnitInterest('');
    setShowAddForm(false);
    showToastMsg('Data referral baru berhasil dicatat');
  };

  const filteredReferrals = referrals.filter((item) => {
    const matchSearch =
      item.advocateName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.referredFriendName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.unitInterest.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = filterStatus === 'ALL' || item.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const totalRewardsDisbursed = referrals
    .filter((r) => r.rewardStatus === 'SUDAH_DITRANSFER')
    .reduce((acc, curr) => acc + curr.rewardAmount, 0);

  const readyToDisburseCount = referrals.filter((r) => r.rewardStatus === 'SIAP_CAIR').length;
  const closedCount = referrals.filter((r) => r.status === 'AKAD_SELESAI').length;

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* Quiet Chrome Header */}
      <div className="bg-white border border-warmborder rounded-2xl p-5 sm:p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5 min-w-0">
            <div className="size-10 sm:size-11 rounded-xl bg-sandstone border border-warmborder text-espresso flex items-center justify-center shrink-0">
              <Share2 className="size-5 text-terracotta" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-espresso">
                  Program Referral &amp; Advokasi
                </h1>
                <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-sandstone text-espresso/80 border border-warmborder">
                  Reward Rp 5.000.000 / Akad
                </span>
              </div>
              <p className="text-xs text-warmmuted mt-0.5">
                {projectName} &middot; Pelacakan Tautan Konsumen &amp; Penyaluran Insentif
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleCopyLink}
              className="h-9 px-3 rounded-lg border border-warmborder bg-white hover:bg-sandstone text-espresso text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {isCopied ? <Check className="size-3.5 text-olive" /> : <Copy className="size-3.5 text-warmmuted" />}
              <span>{isCopied ? 'Tersalin' : 'Salin Link'}</span>
            </button>
            <button
              type="button"
              onClick={() => setShowAddForm(!showAddForm)}
              className="h-9 px-3.5 rounded-lg bg-terracotta hover:bg-terracotta/90 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="size-3.5 shrink-0" />
              <span>{showAddForm ? 'Tutup Form' : 'Input Referral'}</span>
            </button>
          </div>
        </div>

        {/* Calm Link Bar */}
        <div className="pt-3 border-t border-warmborder/60 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <span className="text-warmmuted text-[11px] shrink-0">Landing Link:</span>
            <div className="px-2.5 py-1.5 rounded-lg bg-sandstone/70 border border-warmborder font-mono text-[11px] text-espresso truncate max-w-xl">
              {referralUrl}
            </div>
          </div>
          <button
            type="button"
            onClick={handleShareWa}
            className="h-8 px-3 rounded-lg bg-sandstone hover:bg-warmborder text-espresso font-medium text-xs flex items-center justify-center gap-1.5 cursor-pointer shrink-0 transition-colors"
          >
            <span>Bagikan via WhatsApp</span>
          </button>
        </div>
      </div>

      {/* 4 Quiet Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white border border-warmborder rounded-xl p-4">
          <span className="text-[11px] text-warmmuted block">Total Advokat &amp; Referral</span>
          <span className="text-xl font-bold text-espresso mt-1 block tabular-nums">
            {referrals.length} <span className="text-xs font-normal text-warmmuted">Prospek</span>
          </span>
        </div>
        <div className="bg-white border border-warmborder rounded-xl p-4">
          <span className="text-[11px] text-warmmuted block">Closing / Akad Selesai</span>
          <span className="text-xl font-bold text-espresso mt-1 block tabular-nums">
            {closedCount} <span className="text-xs font-normal text-olive font-medium">Unit</span>
          </span>
        </div>
        <div className="bg-white border border-warmborder rounded-xl p-4">
          <span className="text-[11px] text-warmmuted block">Reward Siap Dicairkan</span>
          <span className="text-xl font-bold text-espresso mt-1 block tabular-nums">
            {readyToDisburseCount} <span className="text-xs font-normal text-terracotta font-medium">Penerima</span>
          </span>
        </div>
        <div className="bg-white border border-warmborder rounded-xl p-4">
          <span className="text-[11px] text-warmmuted block">Total Reward Disalurkan</span>
          <span className="text-xl font-bold text-espresso mt-1 block tabular-nums">
            Rp {(totalRewardsDisbursed / 1000000).toFixed(0)} <span className="text-xs font-normal text-warmmuted">Juta</span>
          </span>
        </div>
      </div>

      {/* Form Input Referral Inline */}
      {showAddForm && (
        <form
          onSubmit={handleAddReferral}
          className="bg-white border border-warmborder rounded-xl p-5 space-y-4 animate-in fade-in duration-150"
        >
          <div className="flex items-center justify-between pb-3 border-b border-warmborder">
            <h3 className="text-xs font-bold uppercase tracking-wider text-espresso flex items-center gap-2">
              <Users className="size-3.5 text-terracotta" /> Pendaftaran Referral Baru
            </h3>
            <span className="text-[11px] text-warmmuted">Klaim komisi tercatat otomatis</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 text-xs">
            <div>
              <label className="font-semibold text-espresso block mb-1">Nama Pengirim (Advokat)</label>
              <input
                type="text"
                value={advocateName}
                onChange={(e) => setAdvocateName(e.target.value)}
                placeholder="Contoh: Ibu Anita Wijaya"
                className="w-full h-9 px-3 rounded-lg border border-warmborder bg-sandstone/50 text-espresso focus:outline-none focus:border-terracotta"
                required
              />
            </div>
            <div>
              <label className="font-semibold text-espresso block mb-1">WhatsApp Pengirim</label>
              <input
                type="text"
                value={advocatePhone}
                onChange={(e) => setAdvocatePhone(e.target.value)}
                placeholder="Contoh: 0812-9876-5432"
                className="w-full h-9 px-3 rounded-lg border border-warmborder bg-sandstone/50 text-espresso focus:outline-none focus:border-terracotta"
              />
            </div>
            <div>
              <label className="font-semibold text-espresso block mb-1">Kategori</label>
              <select
                value={advocateType}
                onChange={(e) => setAdvocateType(e.target.value as ReferralLeadRecord['advocateType'])}
                className="w-full h-9 px-3 rounded-lg border border-warmborder bg-sandstone/50 text-espresso focus:outline-none focus:border-terracotta font-medium"
              >
                <option value="KONSUMEN_PEMILIK">Konsumen Pemilik Unit</option>
                <option value="AGENT_EXTERNAL">Agen Properti Eksternal</option>
                <option value="KARYAWAN">Karyawan Developer</option>
              </select>
            </div>
            <div>
              <label className="font-semibold text-espresso block mb-1">Nama Calon Pembeli</label>
              <input
                type="text"
                value={friendName}
                onChange={(e) => setFriendName(e.target.value)}
                placeholder="Contoh: Pak Hendra Kusuma"
                className="w-full h-9 px-3 rounded-lg border border-warmborder bg-sandstone/50 text-espresso focus:outline-none focus:border-terracotta"
                required
              />
            </div>
            <div>
              <label className="font-semibold text-espresso block mb-1">WhatsApp Calon Pembeli</label>
              <input
                type="text"
                value={friendPhone}
                onChange={(e) => setFriendPhone(e.target.value)}
                placeholder="Contoh: 0813-1122-3344"
                className="w-full h-9 px-3 rounded-lg border border-warmborder bg-sandstone/50 text-espresso focus:outline-none focus:border-terracotta"
              />
            </div>
            <div>
              <label className="font-semibold text-espresso block mb-1">Tipe Unit Minat</label>
              <input
                type="text"
                value={unitInterest}
                onChange={(e) => setUnitInterest(e.target.value)}
                placeholder="Contoh: Nagoya A-03"
                className="w-full h-9 px-3 rounded-lg border border-warmborder bg-sandstone/50 text-espresso focus:outline-none focus:border-terracotta"
              />
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
              className="h-8 px-4 rounded-lg bg-terracotta hover:bg-terracotta/90 text-white text-xs font-semibold cursor-pointer"
            >
              Simpan Referral
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
            placeholder="Cari pengirim, calon pembeli, atau unit..."
            className="w-full h-9 pl-8 pr-3 rounded-lg border border-warmborder bg-sandstone/40 text-xs text-espresso focus:outline-none focus:border-terracotta font-medium"
          />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="h-9 px-3 rounded-lg border border-warmborder bg-sandstone/40 text-xs font-medium text-espresso focus:outline-none focus:border-terracotta"
          >
            <option value="ALL">Semua Status</option>
            <option value="TERDAFTAR">Terdaftar</option>
            <option value="SURVEI_LOKASI">Survei Lokasi</option>
            <option value="BOOKING">Booking</option>
            <option value="AKAD_SELESAI">Akad Selesai</option>
          </select>
        </div>
      </div>

      {/* Tabel Riwayat Program Referral */}
      <div className="bg-white border border-warmborder rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-sandstone/60 border-b border-warmborder text-[11px] font-semibold text-warmmuted">
              <tr>
                <th className="py-2.5 px-4">Pengirim Referral</th>
                <th className="py-2.5 px-4">Calon Pembeli &amp; Unit</th>
                <th className="py-2.5 px-4">Status Prospek</th>
                <th className="py-2.5 px-4">Reward Komisi</th>
                <th className="py-2.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-warmborder">
              {filteredReferrals.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-warmmuted">
                    Tidak ada catatan referral yang cocok.
                  </td>
                </tr>
              ) : (
                filteredReferrals.map((item) => (
                  <tr key={item.id} className="hover:bg-sandstone/20 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-espresso">{item.advocateName}</div>
                      <div className="text-[11px] text-warmmuted mt-0.5">{item.advocatePhone}</div>
                      <span className="inline-block mt-0.5 text-[10px] text-warmmuted">
                        {item.advocateType === 'KONSUMEN_PEMILIK'
                          ? 'Pemilik Unit'
                          : item.advocateType === 'AGENT_EXTERNAL'
                          ? 'Agen Luar'
                          : 'Karyawan'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-espresso">{item.referredFriendName}</div>
                      <div className="text-[11px] text-warmmuted mt-0.5">{item.referredFriendPhone}</div>
                      <div className="text-[11px] text-espresso/80 flex items-center gap-1 mt-0.5">
                        <Building2 className="size-3 text-warmmuted" /> {item.unitInterest}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium ${
                          item.status === 'AKAD_SELESAI'
                            ? 'bg-olive/10 text-olive'
                            : item.status === 'BOOKING'
                            ? 'bg-amber-50 text-amber-900 border border-amber-200'
                            : 'bg-sandstone text-espresso/80'
                        }`}
                      >
                        {item.status === 'AKAD_SELESAI' && <CheckCircle2 className="size-3" />}
                        {item.status.replace('_', ' ')}
                      </span>
                      <div className="text-[10px] text-warmmuted flex items-center gap-1 mt-1">
                        <Calendar className="size-3" /> {item.registeredAt}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-espresso tabular-nums">
                        Rp {item.rewardAmount.toLocaleString('id-ID')}
                      </div>
                      <span
                        className={`inline-block mt-0.5 text-[11px] ${
                          item.rewardStatus === 'SUDAH_DITRANSFER'
                            ? 'text-olive font-medium'
                            : item.rewardStatus === 'SIAP_CAIR'
                            ? 'text-terracotta font-semibold'
                            : 'text-warmmuted'
                        }`}
                      >
                        {item.rewardStatus === 'SUDAH_DITRANSFER'
                          ? 'Sudah Ditransfer'
                          : item.rewardStatus === 'SIAP_CAIR'
                          ? 'Siap Dicairkan'
                          : 'Menunggu Akad'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {item.rewardStatus === 'SIAP_CAIR' ? (
                        <button
                          type="button"
                          onClick={() => {
                            const next = referrals.map((r) =>
                              r.id === item.id ? { ...r, rewardStatus: 'SUDAH_DITRANSFER' as const } : r
                            );
                            setReferrals(next);
                            savePersistedState(`devos_referrals_${projectId}`, next);
                            showToastMsg(`Reward untuk ${item.advocateName} dicatat cair`);
                          }}
                          className="h-7 px-2.5 rounded bg-olive hover:bg-olive/90 text-white font-medium text-xs cursor-pointer"
                        >
                          Tandai Cair
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => showToastMsg(`Membuka WhatsApp ${item.advocateName}...`)}
                          className="h-7 px-2.5 rounded bg-sandstone hover:bg-warmborder text-espresso font-medium text-xs cursor-pointer transition-colors"
                        >
                          Hubungi
                        </button>
                      )}
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
