import React, { useState } from 'react';
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
} from 'lucide-react';
import { loadPersistedState, savePersistedState } from '../lib/navigation/router';
import type { BankApplicationRecord, BankSubmissionStatus } from '../lib/foundations/r3-r4-contracts';

interface BankSubmissionWorkflowPageProps {
  projectName?: string;
  projectId?: string;
  userRole?: string;
}

export const BankSubmissionWorkflowPage: React.FC<BankSubmissionWorkflowPageProps> = ({
  projectName = 'The Park Townhouse Sukoharjo',
  projectId = 'the-park-sukoharjo',
}) => {
  const [applications, setApplications] = useState<BankApplicationRecord[]>(() =>
    loadPersistedState<BankApplicationRecord[]>(`devos_bank_apps_${projectId}`, [
      {
        id: 'app_1',
        applicantName: 'Pak Budi Hartono',
        applicantPhone: '0812-9876-1122',
        unitCode: 'Nagoya A-02',
        cluster: 'Nagoya',
        targetBank: 'Bank BSI',
        plafondAmount: 650000000,
        submissionDate: '2026-11-20',
        status: 'SP3K_TERBIT',
        statusNotes: 'SP3K telah disetujui BSI Cabang Solo Slamet Riyadi. Siap akad minggu depan.',
        assignedAnalyst: 'Ibu Cindy (BSI)',
        sp3kExpiryDate: '2026-12-20',
      },
      {
        id: 'app_2',
        applicantName: 'Ibu Ratna Dewi',
        applicantPhone: '0813-4455-8899',
        unitCode: 'Osaka B-03',
        cluster: 'Osaka',
        targetBank: 'Bank BTN',
        plafondAmount: 720000000,
        submissionDate: '2026-11-22',
        status: 'APPRAISAL_JAMINAN',
        statusNotes: 'Petugas KJPP rekanan BTN telah survei fisik unit dan lingkungan klaster.',
        assignedAnalyst: 'Pak Doni (BTN Solo)',
      },
      {
        id: 'app_3',
        applicantName: 'Pak Andi Pratama',
        applicantPhone: '0811-2233-4455',
        unitCode: 'Tokyo C-01',
        cluster: 'Tokyo',
        targetBank: 'Bank Mandiri',
        plafondAmount: 580000000,
        submissionDate: '2026-11-24',
        status: 'SLIK_BI_CHECKING',
        statusNotes: 'Verifikasi histori kredit debitur & pasangan di OJK SLIK sedang berjalan.',
        assignedAnalyst: 'Pak Fajar (Mandiri Consumer)',
      },
      {
        id: 'app_4',
        applicantName: 'Pak Hendra Kusuma',
        applicantPhone: '0857-1122-9900',
        unitCode: 'Nagoya B-01',
        cluster: 'Nagoya',
        targetBank: 'Bank BSI',
        plafondAmount: 680000000,
        submissionDate: '2026-11-25',
        status: 'SUBMITTED_TO_BANK',
        statusNotes: 'Berkas KPR dari Vault berhasil diteruskan ke sistem Consumer Financing bank.',
      },
    ])
  );

  const [searchTerm, setSearchTerm] = useState('');
  const [filterBank, setFilterBank] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [showAddForm, setShowAddForm] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Form states
  const [applicantName, setApplicantName] = useState('');
  const [applicantPhone, setApplicantPhone] = useState('');
  const [unitCode, setUnitCode] = useState('');
  const [targetBank, setTargetBank] = useState<BankApplicationRecord['targetBank']>('Bank BSI');
  const [plafondAmount, setPlafondAmount] = useState(650000000);
  const [notes, setNotes] = useState('');

  const showToastMsg = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleAddApplication = (e: React.FormEvent) => {
    e.preventDefault();
    if (!applicantName.trim() || !unitCode.trim()) {
      showToastMsg('Nama pemohon dan kode unit wajib diisi');
      return;
    }

    const newApp: BankApplicationRecord = {
      id: `app_${Date.now()}`,
      applicantName: applicantName.trim(),
      applicantPhone: applicantPhone.trim() || '0812-xxxx-xxxx',
      unitCode: unitCode.trim(),
      cluster: unitCode.toLowerCase().includes('nagoya') ? 'Nagoya' : unitCode.toLowerCase().includes('osaka') ? 'Osaka' : 'Tokyo',
      targetBank,
      plafondAmount,
      submissionDate: new Date().toISOString().split('T')[0],
      status: 'SUBMITTED_TO_BANK',
      statusNotes: notes.trim() || 'Berkas pengajuan baru diteruskan ke bank mitra.',
    };

    const next = [newApp, ...applications];
    setApplications(next);
    savePersistedState(`devos_bank_apps_${projectId}`, next);

    setApplicantName('');
    setApplicantPhone('');
    setUnitCode('');
    setNotes('');
    setShowAddForm(false);
    showToastMsg('Pengajuan KPR baru berhasil dicatat dan masuk alur perbankan');
  };

  const handleAdvanceStatus = (appId: string, nextStatus: BankSubmissionStatus) => {
    const next = applications.map((app) =>
      app.id === appId ? { ...app, status: nextStatus } : app
    );
    setApplications(next);
    savePersistedState(`devos_bank_apps_${projectId}`, next);
    showToastMsg(`Status pengajuan diperbarui ke ${nextStatus.replace(/_/g, ' ')}`);
  };

  const filteredApps = applications.filter((app) => {
    const matchSearch =
      app.applicantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.unitCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.targetBank.toLowerCase().includes(searchTerm.toLowerCase());
    const matchBank = filterBank === 'ALL' || app.targetBank === filterBank;
    const matchStatus = filterStatus === 'ALL' || app.status === filterStatus;
    return matchSearch && matchBank && matchStatus;
  });

  const sp3kCount = applications.filter((a) => a.status === 'SP3K_TERBIT').length;
  const inReviewCount = applications.filter((a) => a.status === 'SLIK_BI_CHECKING' || a.status === 'APPRAISAL_JAMINAN').length;
  const totalPlafondApproved = applications
    .filter((a) => a.status === 'SP3K_TERBIT')
    .reduce((sum, a) => sum + a.plafondAmount, 0);

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* Quiet Chrome Header */}
      <div className="bg-white border border-warmborder rounded-2xl p-5 sm:p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5 min-w-0">
            <div className="size-10 sm:size-11 rounded-xl bg-sandstone border border-warmborder text-espresso flex items-center justify-center shrink-0">
              <Building2 className="size-5 text-olive" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-espresso">
                  Alur Pengajuan KPR Bank &amp; SP3K
                </h1>
                <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-sandstone text-espresso/80 border border-warmborder">
                  Fondasi R3 &middot; F75
                </span>
              </div>
              <p className="text-xs text-warmmuted mt-0.5">
                {projectName} &middot; Pelacakan Status SLIK, Appraisal &amp; Penerbitan SP3K Bank Mitra
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
              <span>{showAddForm ? 'Tutup Form' : 'Input Pengajuan KPR'}</span>
            </button>
          </div>
        </div>

        {/* Quiet Info Bar */}
        <div className="pt-3 border-t border-warmborder/60 text-xs text-warmmuted flex items-start gap-2">
          <BadgeCheck className="size-4 text-olive shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong className="text-espresso">Kesiapan Integrasi API Bank:</strong> Modul ini terhubung dengan Secure Document Vault (F74) dan siap disambungkan ke API Host-to-Host Bank BSI, BTN, dan Mandiri saat endpoint produksi aktif.
          </p>
        </div>
      </div>

      {/* 4 Quiet Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white border border-warmborder rounded-xl p-4">
          <span className="text-[11px] text-warmmuted block">Total Pengajuan KPR</span>
          <span className="text-xl font-bold text-espresso mt-1 block tabular-nums">
            {applications.length} <span className="text-xs font-normal text-warmmuted">Debitur</span>
          </span>
        </div>
        <div className="bg-white border border-warmborder rounded-xl p-4">
          <span className="text-[11px] text-warmmuted block">Sedang Analisa / SLIK</span>
          <span className="text-xl font-bold text-espresso mt-1 block tabular-nums">
            {inReviewCount} <span className="text-xs font-normal text-amber-800 font-medium">Berkas</span>
          </span>
        </div>
        <div className="bg-white border border-warmborder rounded-xl p-4">
          <span className="text-[11px] text-warmmuted block">SP3K Terbit (Siap Akad)</span>
          <span className="text-xl font-bold text-olive mt-1 block tabular-nums">
            {sp3kCount} <span className="text-xs font-normal text-olive font-medium">Unit</span>
          </span>
        </div>
        <div className="bg-white border border-warmborder rounded-xl p-4">
          <span className="text-[11px] text-warmmuted block">Nilai Plafond Disetujui</span>
          <span className="text-xl font-bold text-espresso mt-1 block tabular-nums">
            Rp {(totalPlafondApproved / 1000000000).toFixed(2)} <span className="text-xs font-normal text-warmmuted">Miliar</span>
          </span>
        </div>
      </div>

      {/* Form Input Pengajuan Inline */}
      {showAddForm && (
        <form
          onSubmit={handleAddApplication}
          className="bg-white border border-warmborder rounded-xl p-5 space-y-4 animate-in fade-in duration-150"
        >
          <div className="flex items-center justify-between pb-3 border-b border-warmborder">
            <h3 className="text-xs font-bold uppercase tracking-wider text-espresso flex items-center gap-2">
              <FileText className="size-3.5 text-terracotta" /> Pendaftaran Pengajuan Berkas KPR ke Bank
            </h3>
            <span className="text-[11px] text-warmmuted">Koneksi otomatis dari Vault F74</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 text-xs">
            <div>
              <label className="font-semibold text-espresso block mb-1">Nama Calon Debitur</label>
              <input
                type="text"
                value={applicantName}
                onChange={(e) => setApplicantName(e.target.value)}
                placeholder="Contoh: Pak Budi Hartono"
                className="w-full h-9 px-3 rounded-lg border border-warmborder bg-sandstone/50 text-espresso focus:outline-none focus:border-terracotta"
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
                className="w-full h-9 px-3 rounded-lg border border-warmborder bg-sandstone/50 text-espresso focus:outline-none focus:border-terracotta"
              />
            </div>
            <div>
              <label className="font-semibold text-espresso block mb-1">Kode Unit Kavling</label>
              <input
                type="text"
                value={unitCode}
                onChange={(e) => setUnitCode(e.target.value)}
                placeholder="Contoh: Nagoya A-02"
                className="w-full h-9 px-3 rounded-lg border border-warmborder bg-sandstone/50 text-espresso focus:outline-none focus:border-terracotta font-medium"
                required
              />
            </div>
            <div>
              <label className="font-semibold text-espresso block mb-1">Bank Rekanan Tujuan</label>
              <select
                value={targetBank}
                onChange={(e) => setTargetBank(e.target.value as BankApplicationRecord['targetBank'])}
                className="w-full h-9 px-3 rounded-lg border border-warmborder bg-sandstone/50 text-espresso focus:outline-none focus:border-terracotta font-medium"
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
                className="w-full h-9 px-3 rounded-lg border border-warmborder bg-sandstone/50 text-espresso focus:outline-none focus:border-terracotta font-mono font-medium"
                step="10000000"
                min="100000000"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="font-semibold text-espresso block mb-1">Catatan Tambahan Analis</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Misal: Berkas slip gaji & rekening koran telah lengkap di Vault..."
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
              Kirim ke Antrean Bank
            </button>
          </div>
        </form>
      )}

      {/* Filter Bar */}
      <div className="bg-white border border-warmborder rounded-xl p-3.5 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="relative flex-1">
          <Search className="size-3.5 text-warmmuted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari pemohon, unit, atau bank..."
            className="w-full h-9 pl-8 pr-3 rounded-lg border border-warmborder bg-sandstone/40 text-xs text-espresso focus:outline-none focus:border-terracotta font-medium"
          />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Filter className="size-3.5 text-warmmuted" />
          <select
            value={filterBank}
            onChange={(e) => setFilterBank(e.target.value)}
            className="h-9 px-3 rounded-lg border border-warmborder bg-sandstone/40 text-xs font-medium text-espresso focus:outline-none focus:border-terracotta"
          >
            <option value="ALL">Semua Bank</option>
            <option value="Bank BSI">Bank BSI</option>
            <option value="Bank BTN">Bank BTN</option>
            <option value="Bank Mandiri">Bank Mandiri</option>
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="h-9 px-3 rounded-lg border border-warmborder bg-sandstone/40 text-xs font-medium text-espresso focus:outline-none focus:border-terracotta"
          >
            <option value="ALL">Semua Tahapan</option>
            <option value="SUBMITTED_TO_BANK">Submitted</option>
            <option value="SLIK_BI_CHECKING">SLIK OJK</option>
            <option value="APPRAISAL_JAMINAN">Appraisal</option>
            <option value="SP3K_TERBIT">SP3K Terbit</option>
          </select>
        </div>
      </div>

      {/* Tabel Alur Bank */}
      <div className="bg-white border border-warmborder rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-sandstone/60 border-b border-warmborder text-[11px] font-semibold text-warmmuted">
              <tr>
                <th className="py-2.5 px-4">Debitur &amp; Unit</th>
                <th className="py-2.5 px-4">Bank Mitra &amp; Plafond</th>
                <th className="py-2.5 px-4">Status &amp; Progres</th>
                <th className="py-2.5 px-4">Catatan Analis</th>
                <th className="py-2.5 px-4 text-right">Langkah Lanjut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-warmborder">
              {filteredApps.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-warmmuted">
                    Tidak ada pengajuan KPR yang cocok.
                  </td>
                </tr>
              ) : (
                filteredApps.map((app) => (
                  <tr key={app.id} className="hover:bg-sandstone/20 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-espresso">{app.applicantName}</div>
                      <div className="text-[11px] text-warmmuted mt-0.5">{app.applicantPhone}</div>
                      <div className="text-[11px] text-espresso/80 font-medium flex items-center gap-1 mt-0.5">
                        <Building2 className="size-3 text-warmmuted" /> {app.unitCode} ({app.cluster})
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-espresso">{app.targetBank}</span>
                      <div className="font-mono text-xs text-olive font-semibold mt-0.5 tabular-nums">
                        Rp {app.plafondAmount.toLocaleString('id-ID')}
                      </div>
                      <div className="text-[10px] text-warmmuted flex items-center gap-1 mt-1">
                        <Clock className="size-3" /> Diajukan: {app.submissionDate}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium ${
                          app.status === 'SP3K_TERBIT'
                            ? 'bg-olive/10 text-olive'
                            : app.status === 'APPRAISAL_JAMINAN'
                            ? 'bg-amber-50 text-amber-900 border border-amber-200'
                            : 'bg-sandstone text-espresso/80'
                        }`}
                      >
                        {app.status === 'SP3K_TERBIT' && <CheckCircle2 className="size-3" />}
                        {app.status.replace(/_/g, ' ')}
                      </span>
                      {app.sp3kExpiryDate && (
                        <div className="text-[10px] text-warmmuted mt-1">
                          SP3K s/d: {app.sp3kExpiryDate}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-[11px] text-espresso/80 leading-snug max-w-[240px]">
                        {app.statusNotes}
                      </p>
                      {app.assignedAnalyst && (
                        <div className="text-[10px] text-warmmuted mt-1">
                          Analis: {app.assignedAnalyst}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {app.status === 'SUBMITTED_TO_BANK' && (
                        <button
                          type="button"
                          onClick={() => handleAdvanceStatus(app.id, 'SLIK_BI_CHECKING')}
                          className="h-7 px-2.5 rounded bg-sandstone hover:bg-warmborder text-espresso font-medium text-xs cursor-pointer inline-flex items-center gap-1"
                        >
                          <span>Mulai SLIK</span>
                          <ArrowRight className="size-3" />
                        </button>
                      )}
                      {app.status === 'SLIK_BI_CHECKING' && (
                        <button
                          type="button"
                          onClick={() => handleAdvanceStatus(app.id, 'APPRAISAL_JAMINAN')}
                          className="h-7 px-2.5 rounded bg-sandstone hover:bg-warmborder text-espresso font-medium text-xs cursor-pointer inline-flex items-center gap-1"
                        >
                          <span>Appraisal</span>
                          <ArrowRight className="size-3" />
                        </button>
                      )}
                      {app.status === 'APPRAISAL_JAMINAN' && (
                        <button
                          type="button"
                          onClick={() => handleAdvanceStatus(app.id, 'SP3K_TERBIT')}
                          className="h-7 px-2.5 rounded bg-olive hover:bg-olive/90 text-white font-medium text-xs cursor-pointer inline-flex items-center gap-1"
                        >
                          <CheckCircle2 className="size-3" />
                          <span>Terbitkan SP3K</span>
                        </button>
                      )}
                      {app.status === 'SP3K_TERBIT' && (
                        <span className="text-[11px] text-olive font-semibold flex items-center justify-end gap-1">
                          <CheckCircle2 className="size-3" /> Siap Akad
                        </span>
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
