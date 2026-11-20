// ============================================================================
// SUPERADMIN PANEL - DEVELOPER SALES OS
// Central Multi-Tenant Governance, Plan Override, AI Token Audit, & POI Curation
// ============================================================================

import { useState } from 'react';
import {
  ShieldAlert,
  Cpu,
  X,
  Star,
  History,
  Search,
} from 'lucide-react';
import osmPoisData from '../data/osm_poi.json';
import { POI } from './InteractiveMap';

interface TenantRecord {
  id: string;
  name: string;
  status: 'DEMO' | 'AKTIF' | 'DEMO_BERAKHIR';
  plan: 'Gold' | 'Platinum' | 'Diamond';
  projectsCount: number;
  totalTokensUsed: number;
  estimatedCostUsd: number;
  aiMode: string;
}

interface PoiAuditRecord {
  id: string;
  poiId: string;
  poiName: string;
  prevUnggulan: boolean;
  newUnggulan: boolean;
  changedBy: string;
  reason: string;
  timestamp: string;
}

const SAMPLE_TENANTS: TenantRecord[] = [
  {
    id: 't-01',
    name: 'PT Andara Rejo Makmur',
    status: 'DEMO',
    plan: 'Platinum',
    projectsCount: 2,
    totalTokensUsed: 14250,
    estimatedCostUsd: 0.0285,
    aiMode: 'semi_ai (Virtual TL Aktif)',
  },
  {
    id: 't-02',
    name: 'PT Grogol Graha Properti',
    status: 'AKTIF',
    plan: 'Gold',
    projectsCount: 1,
    totalTokensUsed: 6400,
    estimatedCostUsd: 0.0128,
    aiMode: 'human_only',
  },
  {
    id: 't-03',
    name: 'PT Harmoni Land Nusantara',
    status: 'DEMO_BERAKHIR',
    plan: 'Diamond',
    projectsCount: 4,
    totalTokensUsed: 38900,
    estimatedCostUsd: 0.0778,
    aiMode: 'full_ai',
  },
];

interface SuperadminPanelProps {
  onClose?: () => void;
}

export function SuperadminPanel({ onClose }: SuperadminPanelProps) {
  const [activeTab, setActiveTab] = useState<'tenants' | 'poi_curation'>('tenants');
  const [tenants, setTenants] = useState<TenantRecord[]>(SAMPLE_TENANTS);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // POI Curation State
  const [poiList, setPoiList] = useState<POI[]>(osmPoisData as unknown as POI[]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [filterUnggulan, setFilterUnggulan] = useState<'all' | 'unggulan' | 'feeder'>('all');
  const [auditLogs, setAuditLogs] = useState<PoiAuditRecord[]>([
    {
      id: 'audit-001',
      poiId: 'poi-osm-001',
      poiName: 'Stadion Gelora Merdeka Sukoharjo',
      prevUnggulan: false,
      newUnggulan: true,
      changedBy: 'SUPERADMIN',
      reason: 'Fasilitas besar olahraga skala kabupaten dalam radius 1 km otomatis unggulan',
      timestamp: '2026-11-20 10:15 WIB',
    },
    {
      id: 'audit-002',
      poiId: 'poi-osm-046',
      poiName: 'Ayam Goreng Kampung Mbah Karto Tembel',
      prevUnggulan: false,
      newUnggulan: true,
      changedBy: 'SUPERADMIN',
      reason: 'Kuliner ikonik legendaris langganan presiden & daya tarik regional',
      timestamp: '2026-11-20 11:30 WIB',
    },
  ]);

  const totalTokens = tenants.reduce((acc, t) => acc + t.totalTokensUsed, 0);
  const totalCostUsd = tenants.reduce((acc, t) => acc + t.estimatedCostUsd, 0);

  const handleToggleStatus = (tenantId: string) => {
    setTenants((prev) =>
      prev.map((t) => {
        if (t.id === tenantId) {
          const nextStatus = t.status === 'DEMO' ? 'AKTIF' : t.status === 'AKTIF' ? 'DEMO_BERAKHIR' : 'DEMO';
          return { ...t, status: nextStatus };
        }
        return t;
      })
    );
    setToastMessage('Status tenant berhasil diperbarui.');
  };

  // Toggle Unggulan per POI with Audit Log recording
  const handleTogglePoiUnggulan = (poi: POI) => {
    const nextUnggulan = !poi.unggulan;
    const nowStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';
    const reasonText = nextUnggulan
      ? `Diangkat menjadi unggulan homepage oleh Superadmin (skor: ${(poi.skor_kurasi || 80).toFixed(0)})`
      : 'Diturunkan menjadi fasilitas feeder/sekunder (tampil jika opsi "Tampilkan fasilitas lainnya" aktif)';

    setPoiList((prev) =>
      prev.map((p) => (p.name === poi.name ? { ...p, unggulan: nextUnggulan } : p))
    );

    const newAuditEntry: PoiAuditRecord = {
      id: `audit-${Date.now()}`,
      poiId: poi.id || poi.osmId || 'poi-custom',
      poiName: poi.name,
      prevUnggulan: !!poi.unggulan,
      newUnggulan: nextUnggulan,
      changedBy: 'SUPERADMIN',
      reason: reasonText,
      timestamp: nowStr,
    };

    setAuditLogs((prev) => [newAuditEntry, ...prev]);
    setToastMessage(`Status unggulan untuk "${poi.name}" berhasil diubah menjadi: ${nextUnggulan ? 'UNGGULAN' : 'FEEDER'}`);
  };

  // Filtered POIs for Curation Tab
  const filteredPoiList = poiList.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.category || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' ||
      (p.categoryKey || p.category.toLowerCase()) === selectedCategory.toLowerCase();
    const matchesStatus =
      filterUnggulan === 'all'
        ? true
        : filterUnggulan === 'unggulan'
        ? p.unggulan === true
        : p.unggulan !== true;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const countUnggulan = poiList.filter((p) => p.unggulan).length;
  const countFeeder = poiList.length - countUnggulan;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-espresso/70 backdrop-blur-sm flex justify-center p-3 md:p-6 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-warmborder w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-espresso text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-2xl bg-terracotta text-white flex items-center justify-center font-black">
              <ShieldAlert className="size-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black tracking-tight">Panel Pengawasan Superadmin</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-400 text-espresso uppercase">
                  Internal Antigravity
                </span>
              </div>
              <p className="text-xs text-stone-300">
                Audit Multi-Tenant, Alokasi Paket, &amp; Kurasi Fasilitas Unggulan (Tabel poi)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Tab Selector */}
            <div className="inline-flex rounded-xl bg-white/10 p-1 border border-white/15">
              <button
                type="button"
                onClick={() => setActiveTab('tenants')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'tenants'
                    ? 'bg-amber-400 text-espresso shadow-xs'
                    : 'text-stone-300 hover:text-white'
                }`}
              >
                Tenant &amp; AI
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('poi_curation')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'poi_curation'
                    ? 'bg-amber-400 text-espresso shadow-xs'
                    : 'text-stone-300 hover:text-white'
                }`}
              >
                <Star className="size-3.5" />
                <span>Kurasi Fasilitas ({countUnggulan})</span>
              </button>
            </div>

            {onClose && (
              <button
                onClick={onClose}
                className="size-9 rounded-xl hover:bg-white/10 text-stone-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="size-5" />
              </button>
            )}
          </div>
        </div>

        {activeTab === 'tenants' ? (
          <>
            {/* Aggregate AI Metric Banner */}
            <div className="px-6 py-4 bg-sandstone/50 border-b border-warmborder grid grid-cols-1 sm:grid-cols-3 gap-4 shrink-0">
              <div className="p-3 bg-white rounded-2xl border border-warmborder">
                <span className="text-[10px] font-bold text-warmmuted uppercase">Total Tenant Terdaftar</span>
                <p className="text-xl font-black text-espresso mt-0.5">{tenants.length} Developer</p>
              </div>
              <div className="p-3 bg-white rounded-2xl border border-warmborder">
                <span className="text-[10px] font-bold text-warmmuted uppercase flex items-center gap-1">
                  <Cpu className="size-3 text-terracotta" />
                  Total Pemakaian Token AI
                </span>
                <p className="text-xl font-black text-terracotta mt-0.5">
                  {totalTokens.toLocaleString('id-ID')} Tokens
                </p>
              </div>
              <div className="p-3 bg-white rounded-2xl border border-warmborder">
                <span className="text-[10px] font-bold text-warmmuted uppercase">Estimasi Biaya API (USD)</span>
                <p className="text-xl font-black text-olive mt-0.5">${totalCostUsd.toFixed(4)} USD</p>
              </div>
            </div>

            {/* Content Table */}
            <div className="p-6 overflow-y-auto flex-1 bg-[#FBF9F5] space-y-4">
              <div className="bg-white rounded-3xl border border-warmborder shadow-sm overflow-hidden">
                <div className="p-4 border-b border-warmborder">
                  <h3 className="text-sm font-extrabold text-espresso">Daftar Tenant &amp; Status Feature Flag</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-sandstone/50 border-b border-warmborder text-[10px] font-extrabold text-warmmuted uppercase">
                        <th className="py-3 px-4">Nama Developer (Tenant)</th>
                        <th className="py-3 px-3">Paket</th>
                        <th className="py-3 px-3">Status Akun</th>
                        <th className="py-3 px-3">Mode AI Aktif</th>
                        <th className="py-3 px-3 text-right">Audit Token AI</th>
                        <th className="py-3 px-4 text-center">Aksi Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-warmborder">
                      {tenants.map((t) => (
                        <tr key={t.id} className="hover:bg-sandstone/30">
                          <td className="py-3.5 px-4 font-bold text-espresso">
                            {t.name}
                            <span className="block text-[10px] text-warmmuted font-normal">{t.projectsCount} Proyek Aktif</span>
                          </td>
                          <td className="py-3.5 px-3">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-50 text-terracotta border border-amber-200">
                              {t.plan}
                            </span>
                          </td>
                          <td className="py-3.5 px-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                t.status === 'AKTIF'
                                  ? 'bg-lime-100 text-olive'
                                  : t.status === 'DEMO'
                                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {t.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-3 text-warmmuted">{t.aiMode}</td>
                          <td className="py-3.5 px-3 text-right font-mono font-bold text-espresso">
                            {t.totalTokensUsed.toLocaleString('id-ID')}
                            <span className="block text-[10px] text-olive font-semibold">${t.estimatedCostUsd.toFixed(4)}</span>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <button
                              onClick={() => handleToggleStatus(t.id)}
                              className="px-2.5 py-1 rounded-lg bg-sandstone hover:bg-warmborder text-[11px] font-bold text-espresso transition-colors cursor-pointer"
                            >
                              Ubah Status
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        ) : (
          /* TAB 2: KURASI FASILITAS UNGGULAN (POI) */
          <div className="p-6 overflow-y-auto flex-1 bg-[#FBF9F5] space-y-6">
            {/* Header Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="p-3.5 bg-white rounded-2xl border border-warmborder">
                <span className="text-[10px] font-bold text-warmmuted uppercase">Total Fasilitas Terdata</span>
                <p className="text-xl font-black text-espresso mt-0.5">{poiList.length} Titik OSM</p>
              </div>
              <div className="p-3.5 bg-white rounded-2xl border border-emerald-300 bg-emerald-50/50">
                <span className="text-[10px] font-bold text-emerald-800 uppercase flex items-center gap-1">
                  <Star className="size-3 text-emerald-600 fill-emerald-600" />
                  Status Unggulan (Tampil)
                </span>
                <p className="text-xl font-black text-emerald-900 mt-0.5">{countUnggulan} POI</p>
                <span className="text-[10px] text-emerald-700">Tampil otomatis di peta</span>
              </div>
              <div className="p-3.5 bg-white rounded-2xl border border-warmborder">
                <span className="text-[10px] font-bold text-warmmuted uppercase">Fasilitas Feeder/Sekunder</span>
                <p className="text-xl font-black text-warmmuted mt-0.5">{countFeeder} Titik</p>
                <span className="text-[10px] text-warmmuted">Opsi &quot;Lainnya&quot; diaktifkan</span>
              </div>
              <div className="p-3.5 bg-white rounded-2xl border border-warmborder">
                <span className="text-[10px] font-bold text-warmmuted uppercase">Radius 5 km (Homepage)</span>
                <p className="text-xl font-black text-terracotta mt-0.5">25 Unggulan</p>
                <span className="text-[10px] text-terracotta font-mono">Maks 5 per kategori</span>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="p-4 rounded-2xl bg-white border border-warmborder flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="size-4 text-warmmuted absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari nama fasilitas atau kategori..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-warmborder text-xs focus:outline-none focus:border-espresso bg-sandstone/30"
                />
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <select
                  value={filterUnggulan}
                  onChange={(e) => setFilterUnggulan(e.target.value as any)}
                  className="px-3 py-2 rounded-xl border border-warmborder text-xs bg-white font-semibold cursor-pointer"
                >
                  <option value="all">Semua Status</option>
                  <option value="unggulan">Hanya Unggulan</option>
                  <option value="feeder">Hanya Feeder / Sekunder</option>
                </select>

                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-warmborder text-xs bg-white font-semibold cursor-pointer"
                >
                  <option value="all">Semua Kategori (9)</option>
                  <option value="pendidikan">Pendidikan</option>
                  <option value="tempat_ibadah">Tempat Ibadah</option>
                  <option value="kesehatan">Kesehatan</option>
                  <option value="belanja">Belanja</option>
                  <option value="transportasi">Transportasi</option>
                  <option value="layanan_publik">Layanan Publik</option>
                  <option value="keuangan">Keuangan</option>
                  <option value="rekreasi">Rekreasi</option>
                  <option value="kuliner">Kuliner</option>
                </select>
              </div>
            </div>

            {/* POI Curation Table */}
            <div className="bg-white rounded-3xl border border-warmborder shadow-sm overflow-hidden">
              <div className="p-4 border-b border-warmborder flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-extrabold text-espresso">
                    Daftar Kurasi Titik Fasilitas ({filteredPoiList.length} Ditemukan)
                  </h3>
                  <p className="text-xs text-warmmuted mt-0.5">
                    Klik tombol aksi untuk mengubah status titik antara Unggulan (tampil default) dan Feeder (disembunyikan default).
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto max-h-[380px] overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="sticky top-0 z-10 bg-sandstone border-b border-warmborder">
                    <tr className="text-[10px] font-extrabold text-warmmuted uppercase">
                      <th className="py-3 px-4">Nama Fasilitas</th>
                      <th className="py-3 px-3">Kategori</th>
                      <th className="py-3 px-3">Jarak</th>
                      <th className="py-3 px-3 text-center">Status Unggulan</th>
                      <th className="py-3 px-3">Skor &amp; Alasan Kurasi</th>
                      <th className="py-3 px-4 text-center">Aksi Kurasi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-warmborder">
                    {filteredPoiList.map((poi) => {
                      const isUng = poi.unggulan === true;
                      return (
                        <tr key={poi.name} className="hover:bg-sandstone/30">
                          <td className="py-3 px-4 font-bold text-espresso">
                            <div className="flex items-center gap-1.5">
                              {isUng && <Star className="size-3 text-amber-500 fill-amber-500 shrink-0" />}
                              <span>{poi.name}</span>
                            </div>
                            <span className="block text-[10px] text-warmmuted font-mono">{poi.subType || poi.strategicType || '-'}</span>
                          </td>
                          <td className="py-3 px-3">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sandstone text-espresso border border-warmborder capitalize">
                              {poi.categoryLabel || poi.category}
                            </span>
                          </td>
                          <td className="py-3 px-3 font-mono font-bold text-espresso text-[11px]">
                            {poi.approxDistance}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase inline-flex items-center gap-1 ${
                                isUng
                                  ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                                  : 'bg-stone-100 text-stone-600 border border-stone-200'
                              }`}
                            >
                              {isUng ? '★ Unggulan' : 'Feeder / Sekunder'}
                            </span>
                          </td>
                          <td className="py-3 px-3 max-w-[280px]">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono font-bold text-espresso text-[11px]">
                                Skor: {(poi.skor_kurasi || 80).toFixed(0)}
                              </span>
                            </div>
                            <p className="text-[11px] text-warmmuted leading-snug line-clamp-2 mt-0.5">
                              {poi.alasan_kurasi || poi.whyInteresting}
                            </p>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <button
                              type="button"
                              onClick={() => handleTogglePoiUnggulan(poi)}
                              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold cursor-pointer transition-colors border ${
                                isUng
                                  ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                                  : 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                              }`}
                            >
                              {isUng ? 'Ubah ke Feeder' : 'Jadikan Unggulan'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Audit Log Section */}
            <div className="bg-white rounded-3xl border border-warmborder p-5 space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-warmborder">
                <div className="flex items-center gap-2">
                  <History className="size-4 text-terracotta" />
                  <h4 className="font-extrabold text-espresso text-xs uppercase tracking-wider">
                    Log Audit Kurasi POI Terkini (poi_curation_audit)
                  </h4>
                </div>
                <span className="text-[10px] font-mono text-warmmuted">{auditLogs.length} Entri Tercatat</span>
              </div>

              <div className="space-y-2">
                {auditLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3 rounded-xl bg-sandstone/50 border border-warmborder flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <strong className="text-espresso">{log.poiName}</strong>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white border border-warmborder text-espresso">
                          {log.prevUnggulan ? 'UNGGULAN' : 'FEEDER'} &rarr;{' '}
                          <span className={log.newUnggulan ? 'text-emerald-700 font-bold' : 'text-stone-600'}>
                            {log.newUnggulan ? 'UNGGULAN' : 'FEEDER'}
                          </span>
                        </span>
                      </div>
                      <p className="text-[11px] text-warmmuted mt-0.5">{log.reason}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[10px] font-mono text-terracotta font-bold block">{log.changedBy}</span>
                      <span className="text-[10px] text-warmmuted">{log.timestamp}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Toast */}
        {toastMessage && (
          <div className="px-6 py-2.5 bg-espresso text-white text-xs font-medium flex items-center justify-between shrink-0">
            <span>{toastMessage}</span>
            <button onClick={() => setToastMessage(null)} className="text-amber-400 font-bold hover:underline cursor-pointer">
              Tutup
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
