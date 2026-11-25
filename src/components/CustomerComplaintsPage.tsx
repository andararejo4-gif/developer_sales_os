import React, { useState } from 'react';
import {
  Wrench,
  Clock,
  CheckCircle2,
  Building2,
  Search,
  Filter,
  Plus,
  Shield,
} from 'lucide-react';
import { loadPersistedState, savePersistedState } from '../lib/navigation/router';

export interface ComplaintTicket {
  id: string;
  ticketNo: string;
  unitBlock: string;
  residentName: string;
  residentPhone: string;
  category: 'KEBOCORAN_ATAP' | 'RETAK_DINDING' | 'KELISTRIKAN' | 'PIPA_AIR' | 'PINTU_JENDELA' | 'KERAMIK';
  description: string;
  reportedAt: string;
  dlpExpiryDate: string;
  slaTargetHours: number;
  status: 'TIKET_BARU' | 'SURVEI_TEKNISI' | 'DALAM_PERBAIKAN' | 'SELESAI_BAST';
  technicianAssigned?: string;
}

interface CustomerComplaintsPageProps {
  projectName?: string;
  projectId?: string;
  userRole?: string;
}

export const CustomerComplaintsPage: React.FC<CustomerComplaintsPageProps> = ({
  projectName = 'The Park Townhouse Sukoharjo',
  projectId = 'the-park-sukoharjo',
}) => {
  const [tickets, setTickets] = useState<ComplaintTicket[]>(() =>
    loadPersistedState<ComplaintTicket[]>(`devos_complaints_${projectId}`, [
      {
        id: 'comp_1',
        ticketNo: 'DLP-2026-001',
        unitBlock: 'Nagoya A-02',
        residentName: 'Pak Hendra Pratama',
        residentPhone: '0812-3456-7890',
        category: 'KEBOCORAN_ATAP',
        description: 'Terdapat rembesan air di plafon kamar utama saat hujan lebat sore kemarin.',
        reportedAt: '2026-11-24 16:30 WIB',
        dlpExpiryDate: '2027-02-28 (Masa DLP Aktif)',
        slaTargetHours: 24,
        status: 'DALAM_PERBAIKAN',
        technicianAssigned: 'Tim Sipil (Mandor Joko)',
      },
      {
        id: 'comp_2',
        ticketNo: 'DLP-2026-002',
        unitBlock: 'Osaka B-04',
        residentName: 'Ibu Ratna Susanti',
        residentPhone: '0857-1122-3344',
        category: 'PINTU_JENDELA',
        description: 'Kunci pintu geser aluminium taman belakang sedikit seret saat dikunci.',
        reportedAt: '2026-11-25 08:15 WIB',
        dlpExpiryDate: '2027-03-15 (Masa DLP Aktif)',
        slaTargetHours: 48,
        status: 'SURVEI_TEKNISI',
        technicianAssigned: 'Tim Finishing (Pak Dedi)',
      },
      {
        id: 'comp_3',
        ticketNo: 'DLP-2026-003',
        unitBlock: 'Tokyo C-01',
        residentName: 'Pak Irwan Nugroho',
        residentPhone: '0818-4455-6677',
        category: 'KELISTRIKAN',
        description: 'MCB meteran turun saat menyalakan pompa air pendorong dan water heater bersamaan.',
        reportedAt: '2026-11-23 10:00 WIB',
        dlpExpiryDate: '2027-01-20 (Masa DLP Aktif)',
        slaTargetHours: 12,
        status: 'SELESAI_BAST',
        technicianAssigned: 'Tim ME (Pak Aris)',
      },
    ])
  );

  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [showAddForm, setShowAddForm] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Form states
  const [unitBlock, setUnitBlock] = useState('');
  const [residentName, setResidentName] = useState('');
  const [residentPhone, setResidentPhone] = useState('');
  const [category, setCategory] = useState<ComplaintTicket['category']>('KEBOCORAN_ATAP');
  const [description, setDescription] = useState('');

  const showToastMsg = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleAddTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!unitBlock.trim() || !residentName.trim() || !description.trim()) {
      showToastMsg('Nomor unit, nama penghuni, dan deskripsi keluhan wajib diisi.');
      return;
    }

    const nextNo = `DLP-2026-00${tickets.length + 1}`;
    const newTicket: ComplaintTicket = {
      id: `comp_${Date.now()}`,
      ticketNo: nextNo,
      unitBlock: unitBlock.trim(),
      residentName: residentName.trim(),
      residentPhone: residentPhone.trim() || '0812-xxxx-xxxx',
      category,
      description: description.trim(),
      reportedAt: 'Hari ini (Baru)',
      dlpExpiryDate: '100 Hari sejak Serah Terima',
      slaTargetHours: 24,
      status: 'TIKET_BARU',
    };

    const next = [newTicket, ...tickets];
    setTickets(next);
    savePersistedState(`devos_complaints_${projectId}`, next);

    setUnitBlock('');
    setResidentName('');
    setResidentPhone('');
    setDescription('');
    setShowAddForm(false);
    showToastMsg(`Tiket garansi ${nextNo} berhasil dibuat dan diteruskan ke tim teknisi lapangan.`);
  };

  const handleUpdateStatus = (ticketId: string, nextStatus: ComplaintTicket['status']) => {
    const updated = tickets.map((t) => (t.id === ticketId ? { ...t, status: nextStatus } : t));
    setTickets(updated);
    savePersistedState(`devos_complaints_${projectId}`, updated);
    showToastMsg('Status tiket perbaikan berhasil diperbarui.');
  };

  const filteredTickets = tickets.filter((t) => {
    const matchSearch =
      t.ticketNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.unitBlock.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.residentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCategory = filterCategory === 'ALL' || t.category === filterCategory;
    const matchStatus = filterStatus === 'ALL' || t.status === filterStatus;
    return matchSearch && matchCategory && matchStatus;
  });

  const activeCount = tickets.filter((t) => t.status !== 'SELESAI_BAST').length;
  const inProgressCount = tickets.filter((t) => t.status === 'DALAM_PERBAIKAN').length;
  const completedCount = tickets.filter((t) => t.status === 'SELESAI_BAST').length;

  return (
    <div className="space-y-5 pb-20 md:pb-8">
      {/* Header Halaman Utama (Quiet Chrome) */}
      <div className="bg-white border border-warmborder rounded-2xl p-5 sm:p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5 min-w-0">
            <div className="size-10 sm:size-11 rounded-xl bg-sandstone border border-warmborder text-espresso flex items-center justify-center shrink-0">
              <Wrench className="size-5 text-terracotta" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-espresso">
                  Keluhan &amp; Garansi DLP
                </h1>
                <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-sandstone text-espresso/80 border border-warmborder flex items-center gap-1 shrink-0">
                  <Shield className="size-3.5 text-olive" /> Garansi 100 Hari DLP
                </span>
              </div>
              <p className="text-xs text-warmmuted mt-0.5">
                {projectName} &middot; Manajemen Tiket Perbaikan Unit &amp; BAST Pemeliharaan
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
              <span>{showAddForm ? 'Tutup Form' : 'Input Tiket Keluhan'}</span>
            </button>
          </div>
        </div>

        {/* SLA Commitment Banner */}
        <div className="pt-3 border-t border-warmborder/60 text-xs text-warmmuted flex items-start gap-2">
          <Clock className="size-4 text-terracotta shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong className="text-espresso">SLA Garansi Pengembang:</strong> Respon teknisi maksimal <strong>24 jam</strong>. Perbaikan kebocoran &amp; kelistrikan maksimal <strong>3 hari kerja</strong> dengan BAST tertandatangani.
          </p>
        </div>
      </div>

      {/* 4 Kartu Metrik Ringkas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white border border-warmborder rounded-xl p-4">
          <span className="text-[11px] text-warmmuted block">Tiket Aktif</span>
          <span className="text-xl font-bold text-espresso mt-1 block tabular-nums">
            {activeCount} <span className="text-xs font-normal text-warmmuted">Tiket</span>
          </span>
        </div>
        <div className="bg-white border border-warmborder rounded-xl p-4">
          <span className="text-[11px] text-warmmuted block">Dalam Perbaikan</span>
          <span className="text-xl font-bold text-espresso mt-1 block tabular-nums">
            {inProgressCount} <span className="text-xs font-normal text-terracotta font-medium">Unit</span>
          </span>
        </div>
        <div className="bg-white border border-warmborder rounded-xl p-4">
          <span className="text-[11px] text-warmmuted block">Selesai &amp; BAST</span>
          <span className="text-xl font-bold text-espresso mt-1 block tabular-nums">
            {completedCount} <span className="text-xs font-normal text-olive font-medium">Unit</span>
          </span>
        </div>
        <div className="bg-white border border-warmborder rounded-xl p-4">
          <span className="text-[11px] text-warmmuted block">Rata-rata Durasi</span>
          <span className="text-xl font-bold text-espresso mt-1 block tabular-nums">
            2.1 <span className="text-xs font-normal text-warmmuted">Hari (SLA &le; 3)</span>
          </span>
        </div>
      </div>

      {/* Form Input Keluhan Inline */}
      {showAddForm && (
        <form
          onSubmit={handleAddTicket}
          className="bg-white border-2 border-terracotta/30 rounded-2xl p-4 sm:p-6 shadow-sm space-y-4 animate-in fade-in duration-200"
        >
          <div className="flex items-center justify-between pb-3 border-b border-warmborder">
            <h3 className="text-sm font-extrabold text-espresso flex items-center gap-2">
              <Wrench className="size-4 text-terracotta" /> Form Registrasi Keluhan / Klaim Garansi DLP
            </h3>
            <span className="text-xs text-warmmuted">Otomatis mencatat nomor tiket</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="font-bold text-espresso block mb-1">Blok &amp; Nomor Unit</label>
              <input
                type="text"
                value={unitBlock}
                onChange={(e) => setUnitBlock(e.target.value)}
                placeholder="Contoh: Nagoya A-05"
                className="w-full h-10 px-3 rounded-xl border border-warmborder bg-sandstone text-espresso focus:outline-none focus:ring-1 focus:ring-terracotta font-medium"
                required
              />
            </div>
            <div>
              <label className="font-bold text-espresso block mb-1">Nama Pemilik / Penghuni</label>
              <input
                type="text"
                value={residentName}
                onChange={(e) => setResidentName(e.target.value)}
                placeholder="Contoh: Pak Hendra Pratama"
                className="w-full h-10 px-3 rounded-xl border border-warmborder bg-sandstone text-espresso focus:outline-none focus:ring-1 focus:ring-terracotta font-medium"
                required
              />
            </div>
            <div>
              <label className="font-bold text-espresso block mb-1">No. WhatsApp Penghuni</label>
              <input
                type="text"
                value={residentPhone}
                onChange={(e) => setResidentPhone(e.target.value)}
                placeholder="Contoh: 0812-3456-7890"
                className="w-full h-10 px-3 rounded-xl border border-warmborder bg-sandstone text-espresso focus:outline-none focus:ring-1 focus:ring-terracotta font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="font-bold text-espresso block mb-1">Kategori Masalah Kerusakan</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ComplaintTicket['category'])}
                className="w-full h-10 px-3 rounded-xl border border-warmborder bg-sandstone text-espresso focus:outline-none focus:ring-1 focus:ring-terracotta font-bold"
              >
                <option value="KEBOCORAN_ATAP">Kebocoran Genteng / Plafon</option>
                <option value="RETAK_DINDING">Retak Rambut Dinding</option>
                <option value="KELISTRIKAN">Kelistrikan / Saklar / MCB</option>
                <option value="PIPA_AIR">Pipa Air / Sanitair / Kran</option>
                <option value="PINTU_JENDELA">Pintu / Jendela Aluminium</option>
                <option value="KERAMIK">Keramik Kopong / Nat Terkelupas</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="font-bold text-espresso block mb-1">Deskripsi Detail Keluhan</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Jelaskan titik lokasi kerusakan dan kondisinya secara spesifik..."
                className="w-full h-10 px-3 rounded-xl border border-warmborder bg-sandstone text-espresso focus:outline-none focus:ring-1 focus:ring-terracotta font-medium"
                required
              />
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
              Terbitkan Tiket Garansi &amp; Tugaskan Teknisi
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
            placeholder="Cari nomor tiket, blok unit, nama pemilik, atau deskripsi keluhan..."
            className="w-full h-10 pl-9 pr-3 rounded-xl border border-warmborder bg-sandstone text-xs text-espresso focus:outline-none focus:ring-1 focus:ring-terracotta font-medium"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <div className="flex items-center gap-1.5 text-xs text-warmmuted font-bold">
            <Filter className="size-3.5" /> Filter:
          </div>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="h-10 px-3 rounded-xl border border-warmborder bg-sandstone text-xs font-bold text-espresso focus:outline-none focus:ring-1 focus:ring-terracotta"
          >
            <option value="ALL">Semua Kategori</option>
            <option value="KEBOCORAN_ATAP">Kebocoran Plafon</option>
            <option value="RETAK_DINDING">Retak Dinding</option>
            <option value="KELISTRIKAN">Kelistrikan</option>
            <option value="PIPA_AIR">Pipa Air</option>
            <option value="PINTU_JENDELA">Pintu &amp; Jendela</option>
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="h-10 px-3 rounded-xl border border-warmborder bg-sandstone text-xs font-bold text-espresso focus:outline-none focus:ring-1 focus:ring-terracotta"
          >
            <option value="ALL">Semua Status</option>
            <option value="TIKET_BARU">Tiket Baru</option>
            <option value="SURVEI_TEKNISI">Survei Teknisi</option>
            <option value="DALAM_PERBAIKAN">Dalam Perbaikan</option>
            <option value="SELESAI_BAST">Selesai &amp; BAST</option>
          </select>
        </div>
      </div>

      {/* Tabel Tiket Keluhan Garansi */}
      <div className="bg-white border border-warmborder rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-sandstone/70 border-b border-warmborder text-[11px] font-black uppercase tracking-wider text-warmmuted">
              <tr>
                <th className="py-3 px-4">Nomor Tiket &amp; Unit</th>
                <th className="py-3 px-4">Deskripsi Masalah &amp; Pelapor</th>
                <th className="py-3 px-4">Masa Garansi &amp; Teknisi</th>
                <th className="py-3 px-4">Status &amp; SLA</th>
                <th className="py-3 px-4 text-right">Ubah Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-warmborder">
              {filteredTickets.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-warmmuted">
                    Tidak ada tiket keluhan garansi yang cocok.
                  </td>
                </tr>
              ) : (
                filteredTickets.map((t) => (
                  <tr key={t.id} className="hover:bg-sandstone/30 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-mono font-extrabold text-terracotta text-xs">{t.ticketNo}</div>
                      <div className="text-xs font-bold text-espresso flex items-center gap-1 mt-1">
                        <Building2 className="size-3.5 text-espresso" /> {t.unitBlock}
                      </div>
                      <div className="text-[10px] text-warmmuted mt-0.5">{t.reportedAt}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-espresso leading-snug max-w-[280px]">
                        {t.description}
                      </div>
                      <div className="text-[11px] text-warmmuted mt-1">
                        Pelapor: <strong>{t.residentName}</strong> ({t.residentPhone})
                      </div>
                      <span className="inline-block mt-1 px-2 py-0.5 rounded-md bg-sandstone border border-warmborder text-[10px] font-bold text-espresso/80">
                        {t.category.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-xs text-espresso font-semibold flex items-center gap-1">
                        <Shield className="size-3.5 text-olive" /> {t.dlpExpiryDate}
                      </div>
                      <div className="text-[11px] text-warmmuted mt-1">
                        Teknisi: <strong className="text-espresso">{t.technicianAssigned || 'Belum Ditugaskan'}</strong>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${
                          t.status === 'SELESAI_BAST'
                            ? 'bg-olive/10 text-olive border-olive/30'
                            : t.status === 'DALAM_PERBAIKAN'
                            ? 'bg-amber-100 text-amber-900 border-amber-300'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}
                      >
                        {t.status === 'SELESAI_BAST' && <CheckCircle2 className="size-3" />}
                        {t.status.replace('_', ' ')}
                      </span>
                      <div className="text-[10px] text-warmmuted flex items-center gap-1 mt-1">
                        <Clock className="size-3" /> Target SLA: {t.slaTargetHours} Jam
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5 justify-end">
                        {t.status === 'TIKET_BARU' && (
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(t.id, 'SURVEI_TEKNISI')}
                            className="px-2.5 py-1 rounded-lg bg-sandstone hover:bg-warmborder text-espresso font-bold text-xs cursor-pointer"
                          >
                            Survei
                          </button>
                        )}
                        {t.status === 'SURVEI_TEKNISI' && (
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(t.id, 'DALAM_PERBAIKAN')}
                            className="px-2.5 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold text-xs cursor-pointer"
                          >
                            Mulai Kerjakan
                          </button>
                        )}
                        {t.status === 'DALAM_PERBAIKAN' && (
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(t.id, 'SELESAI_BAST')}
                            className="px-3 py-1.5 rounded-lg bg-olive text-white font-bold text-xs hover:bg-olive/90 cursor-pointer shadow-2xs"
                          >
                            Tandai BAST Selesai
                          </button>
                        )}
                        {t.status === 'SELESAI_BAST' && (
                          <span className="text-[11px] text-olive font-extrabold flex items-center gap-1 justify-end">
                            <CheckCircle2 className="size-3.5" /> BAST Selesai
                          </span>
                        )}
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
