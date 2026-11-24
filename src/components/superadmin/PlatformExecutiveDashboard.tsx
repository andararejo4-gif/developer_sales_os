import { useState } from 'react';
import {
  TrendingUp,
  Building2,
  Globe,
  Phone,
  ShieldCheck,
  Search,
  PieChart,
  BarChart3,
} from 'lucide-react';

interface DeveloperPortfolioItem {
  id: string;
  companyName: string;
  ownerName: string;
  phone: string;
  location: string;
  projectsCount: number;
  totalUnits: number;
  activePlan: 'Diamond' | 'Platinum' | 'Gold';
  status: 'AKTIF' | 'DEMO' | 'PERPANJANGAN';
  monthlyFee: number;
  tokenUsed: number;
  aiCostUsd: number;
  gmvSalesIdr: number;
  joinDate: string;
}

const SAMPLE_DEVELOPERS_PORTFOLIO: DeveloperPortfolioItem[] = [
  {
    id: 'dev-001',
    companyName: 'PT Andara Rejo Makmur',
    ownerName: 'Bpk. Bambang Soedirjo',
    phone: '081122334401',
    location: 'Sukoharjo & Boyolali',
    projectsCount: 3,
    totalUnits: 195,
    activePlan: 'Diamond',
    status: 'AKTIF',
    monthlyFee: 15000000,
    tokenUsed: 24800,
    aiCostUsd: 0.0496,
    gmvSalesIdr: 8071500000,
    joinDate: '2026-08-15',
  },
  {
    id: 'dev-002',
    companyName: 'PT Graha Mandiri Propertindo',
    ownerName: 'Bpk. Hendra Gunawan',
    phone: '081234567890',
    location: 'Colomadu, Karanganyar',
    projectsCount: 2,
    totalUnits: 90,
    activePlan: 'Diamond',
    status: 'AKTIF',
    monthlyFee: 15000000,
    tokenUsed: 19400,
    aiCostUsd: 0.0388,
    gmvSalesIdr: 4500000000,
    joinDate: '2026-09-01',
  },
  {
    id: 'dev-003',
    companyName: 'PT Solo Makmur Jaya',
    ownerName: 'Ibu Ratna Susilowati',
    phone: '081390112233',
    location: 'Solo Baru, Sukoharjo',
    projectsCount: 1,
    totalUnits: 45,
    activePlan: 'Platinum',
    status: 'AKTIF',
    monthlyFee: 10000000,
    tokenUsed: 14200,
    aiCostUsd: 0.0284,
    gmvSalesIdr: 3200000000,
    joinDate: '2026-09-20',
  },
  {
    id: 'dev-004',
    companyName: 'PT Grogol Graha Properti',
    ownerName: 'Bpk. Wibowo Santoso',
    phone: '081578990011',
    location: 'Grogol, Sukoharjo',
    projectsCount: 1,
    totalUnits: 35,
    activePlan: 'Gold',
    status: 'AKTIF',
    monthlyFee: 5000000,
    tokenUsed: 6200,
    aiCostUsd: 0.0124,
    gmvSalesIdr: 2100000000,
    joinDate: '2026-10-05',
  },
  {
    id: 'dev-005',
    companyName: 'PT Pesona Karanganyar Asri',
    ownerName: 'Bpk. Irwan Hidayat',
    phone: '081223344556',
    location: 'Tasikmadu, Karanganyar',
    projectsCount: 1,
    totalUnits: 60,
    activePlan: 'Platinum',
    status: 'PERPANJANGAN',
    monthlyFee: 10000000,
    tokenUsed: 16800,
    aiCostUsd: 0.0336,
    gmvSalesIdr: 2950000000,
    joinDate: '2026-10-18',
  },
  {
    id: 'dev-006',
    companyName: 'PT Grand Pesona Mandiri',
    ownerName: 'Bpk. Irfan Hakim',
    phone: '081298765432',
    location: 'Kartasura, Sukoharjo',
    projectsCount: 1,
    totalUnits: 45,
    activePlan: 'Diamond',
    status: 'DEMO',
    monthlyFee: 0,
    tokenUsed: 12500,
    aiCostUsd: 0.025,
    gmvSalesIdr: 0,
    joinDate: '2026-11-20',
  },
];

interface PlatformExecutiveDashboardProps {
  onOpenSuperadminModal: () => void;
  onImpersonate?: (role: string, projectId?: string) => void;
}

export function PlatformExecutiveDashboard({
  onOpenSuperadminModal,
}: PlatformExecutiveDashboardProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPlan, setFilterPlan] = useState<'all' | 'Diamond' | 'Platinum' | 'Gold'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'AKTIF' | 'DEMO' | 'PERPANJANGAN'>('all');

  const filteredDevelopers = SAMPLE_DEVELOPERS_PORTFOLIO.filter((dev) => {
    const matchSearch =
      dev.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dev.ownerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dev.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchPlan = filterPlan === 'all' || dev.activePlan === filterPlan;
    const matchStatus = filterStatus === 'all' || dev.status === filterStatus;
    return matchSearch && matchPlan && matchStatus;
  });

  const totalActiveDevelopers = SAMPLE_DEVELOPERS_PORTFOLIO.filter((d) => d.status === 'AKTIF').length;
  const totalDemoDevelopers = SAMPLE_DEVELOPERS_PORTFOLIO.filter((d) => d.status === 'DEMO').length;
  const totalMrr = SAMPLE_DEVELOPERS_PORTFOLIO.reduce((acc, d) => acc + d.monthlyFee, 0);
  const totalGmv = SAMPLE_DEVELOPERS_PORTFOLIO.reduce((acc, d) => acc + d.gmvSalesIdr, 0);
  const totalUnitsManaged = SAMPLE_DEVELOPERS_PORTFOLIO.reduce((acc, d) => acc + d.totalUnits, 0);

  const formatRupiah = (val: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);

  return (
    <div className="space-y-6">
      {/* Executive Hero Banner */}
      <div className="p-6 sm:p-8 rounded-2xl bg-espresso text-white border border-stone-800 shadow-sm relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md text-[11px] font-medium tracking-wide bg-stone-800 text-stone-200 border border-stone-700">
                Eksekutif &amp; Pemilik Platform
              </span>
              <span className="text-xs text-stone-300">Portofolio Bisnis Developer Sales OS</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight mt-2.5 text-white">
              Kinerja Platform &amp; Portofolio SaaS Developer Sales OS
            </h2>
            <p className="text-xs sm:text-sm text-stone-300 mt-1.5 max-w-2xl leading-relaxed">
              Memantau pertumbuhan trafik web publik, penetrasi akun developer properti, retensi langganan, efisiensi konsumsi AI, dan nilai transaksi properti nasional.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={onOpenSuperadminModal}
              className="px-4 py-2.5 rounded-xl bg-terracotta hover:bg-terracotta/90 text-white font-semibold text-xs shadow-sm transition-colors flex items-center gap-2 cursor-pointer"
            >
              <ShieldCheck className="size-4 text-white" />
              <span>Kelola Panel Superadmin</span>
            </button>
          </div>
        </div>

        {/* 4 Core Financial & Traffic KPI */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 mt-6 pt-6 border-t border-white/10">
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <span className="text-[10px] font-semibold text-white/70 uppercase tracking-wider block">
              Monthly Recurring Revenue (MRR)
            </span>
            <p className="text-xl sm:text-2xl font-bold text-amber-300 mt-1">
              {formatRupiah(totalMrr)}
            </p>
            <span className="text-[11px] text-emerald-300 font-medium flex items-center gap-1 mt-0.5">
              <TrendingUp className="size-3" /> +18.4% bulan ini
            </span>
          </div>

          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <span className="text-[10px] font-semibold text-white/70 uppercase tracking-wider block">
              Akun Developer Terdaftar
            </span>
            <p className="text-xl sm:text-2xl font-bold text-white mt-1">
              {SAMPLE_DEVELOPERS_PORTFOLIO.length} Developer
            </p>
            <span className="text-[11px] text-white/80 mt-0.5 block">
              {totalActiveDevelopers} Berlangganan · {totalDemoDevelopers} Masa Uji Coba
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-white/10 border border-white/10">
            <span className="text-[10px] font-bold text-white/70 uppercase tracking-wider block">
              Trafik Web Publik &amp; Landing Page
            </span>
            <p className="text-xl sm:text-2xl font-black text-white mt-1">
              14.280 Pengunjung
            </p>
            <span className="text-[11px] text-emerald-300 font-semibold mt-0.5 block">
              684 Leads (Konversi 4.8%)
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-white/10 border border-white/10">
            <span className="text-[10px] font-bold text-white/70 uppercase tracking-wider block">
              Total GMV Properti Dikelola
            </span>
            <p className="text-xl sm:text-2xl font-black text-emerald-300 mt-1">
              {formatRupiah(totalGmv)}
            </p>
            <span className="text-[11px] text-white/80 mt-0.5 block">
              {totalUnitsManaged} Unit Kavling Terdata
            </span>
          </div>
        </div>
      </div>

      {/* Row: Web Traffic & Lead Generation Insights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Web Traffic & Public Funnel Card */}
        <div className="bg-white rounded-3xl border border-warmborder p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-warmborder">
            <div className="flex items-center gap-2.5">
              <div className="size-9 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center">
                <Globe className="size-5" />
              </div>
              <div>
                <h4 className="font-extrabold text-espresso text-sm">Pengunjung Web Publik</h4>
                <p className="text-[11px] text-warmmuted">developerproperti.glivepro.com</p>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
              Live Tracker
            </span>
          </div>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-warmmuted">Iklan Meta &amp; Google Ads</span>
                <span className="text-espresso font-bold">6.420 (45%)</span>
              </div>
              <div className="h-2 rounded-full bg-sandstone overflow-hidden">
                <div className="h-full bg-terracotta rounded-full" style={{ width: '45%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-warmmuted">Pencarian Organik &amp; SEO Properti</span>
                <span className="text-espresso font-bold">4.570 (32%)</span>
              </div>
              <div className="h-2 rounded-full bg-sandstone overflow-hidden">
                <div className="h-full bg-olive rounded-full" style={{ width: '32%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-warmmuted">Rekomendasi Asosiasi REI / APERSI</span>
                <span className="text-espresso font-bold">2.140 (15%)</span>
              </div>
              <div className="h-2 rounded-full bg-sandstone overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full" style={{ width: '15%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-warmmuted">Direct &amp; WhatsApp Outreach VIP</span>
                <span className="text-espresso font-bold">1.150 (8%)</span>
              </div>
              <div className="h-2 rounded-full bg-sandstone overflow-hidden">
                <div className="h-full bg-espresso rounded-full" style={{ width: '8%' }} />
              </div>
            </div>
          </div>

          <div className="p-3.5 bg-sandstone/50 rounded-2xl border border-warmborder text-[11px] text-espresso leading-relaxed">
            <strong>Insight Bisnis:</strong> Fitur <em>"Surat Cinta 99 Keunggulan Gratis"</em> di beranda publik menghasilkan <strong>684 kontak nomor WhatsApp pemilik developer</strong> dalam 30 hari terakhir.
          </div>
        </div>

        {/* Breakdown Paket Berlangganan SaaS */}
        <div className="bg-white rounded-3xl border border-warmborder p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-warmborder">
            <div className="flex items-center gap-2.5">
              <div className="size-9 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center">
                <PieChart className="size-5" />
              </div>
              <div>
                <h4 className="font-extrabold text-espresso text-sm">Sebaran Paket SaaS</h4>
                <p className="text-[11px] text-warmmuted">Alokasi langganan berulang</p>
              </div>
            </div>
            <span className="text-xs font-mono font-bold text-terracotta">ARR: Rp 2,58 M</span>
          </div>

          <div className="space-y-3">
            <div className="p-3 bg-sandstone/40 rounded-xl border border-warmborder flex items-center justify-between">
              <div>
                <span className="text-xs font-black text-espresso flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-purple-600" />
                  Paket Diamond (Multi-Proyek)
                </span>
                <p className="text-[11px] text-warmmuted mt-0.5">Rp 15.000.000 / bln / developer</p>
              </div>
              <span className="text-sm font-black text-espresso">3 Tenant</span>
            </div>

            <div className="p-3 bg-sandstone/40 rounded-xl border border-warmborder flex items-center justify-between">
              <div>
                <span className="text-xs font-black text-espresso flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-blue-600" />
                  Paket Platinum (Virtual TL)
                </span>
                <p className="text-[11px] text-warmmuted mt-0.5">Rp 10.000.000 / bln / developer</p>
              </div>
              <span className="text-sm font-black text-espresso">2 Tenant</span>
            </div>

            <div className="p-3 bg-sandstone/40 rounded-xl border border-warmborder flex items-center justify-between">
              <div>
                <span className="text-xs font-black text-espresso flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-amber-500" />
                  Paket Gold (SOP &amp; Web)
                </span>
                <p className="text-[11px] text-warmmuted mt-0.5">Rp 5.000.000 / bln / developer</p>
              </div>
              <span className="text-sm font-black text-espresso">1 Tenant</span>
            </div>
          </div>

          <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200 text-[11px] text-emerald-900 leading-relaxed">
            <strong>Retensi 100%:</strong> Nol pembatalan langganan (churn rate 0%). Rata-rata developer menggunakan sistem lebih dari 9 bulan sampai proyek sold out.
          </div>
        </div>

        {/* Efisiensi Token AI vs Profit Margin */}
        <div className="bg-white rounded-3xl border border-warmborder p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-warmborder">
            <div className="flex items-center gap-2.5">
              <div className="size-9 rounded-xl bg-amber-100 text-terracotta flex items-center justify-center">
                <BarChart3 className="size-5" />
              </div>
              <div>
                <h4 className="font-extrabold text-espresso text-sm">Margin Keuntungan AI</h4>
                <p className="text-[11px] text-warmmuted">Pendapatan SaaS vs Biaya API LLM</p>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-100 text-emerald-800">
              Margin 99.3%
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1.5 border-b border-warmborder">
              <span className="text-warmmuted">Total Pemakaian Token AI</span>
              <strong className="text-espresso">93.900 Tokens</strong>
            </div>
            <div className="flex justify-between py-1.5 border-b border-warmborder">
              <span className="text-warmmuted">Estimasi Biaya API (OpenAI/Gemini)</span>
              <strong className="text-terracotta font-mono">$0.1878 USD (~Rp 2.950)</strong>
            </div>
            <div className="flex justify-between py-1.5 border-b border-warmborder">
              <span className="text-warmmuted">Total Tagihan Langganan Developer</span>
              <strong className="text-emerald-800 font-bold">Rp 55.000.000 / bln</strong>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-warmmuted">Nett Gross Profit Margin</span>
              <strong className="text-emerald-700 font-black">99.9% Bersih</strong>
            </div>
          </div>

          <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200 text-[11px] text-amber-900 leading-relaxed">
            ⚡ <strong>Skalabilitas Tinggi:</strong> Arsitektur hybrid (rule-based engine + selective LLM call) memangkas biaya server hingga 95% dibandingkan chatbot murni.
          </div>
        </div>
      </div>

      {/* Portofolio Akun Developer Yang Menggunakan Sistem */}
      <div className="bg-white rounded-3xl border border-warmborder p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-warmborder">
          <div>
            <h3 className="text-base font-extrabold text-espresso">
              Portofolio Akun Developer Klien Developer Sales OS
            </h3>
            <p className="text-xs text-warmmuted mt-0.5">
              Menampilkan {filteredDevelopers.length} developer yang aktif mengelola proyek di platform ini.
            </p>
          </div>

          {/* Filter & Search */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search className="size-3.5 text-warmmuted absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari developer / owner..."
                className="pl-8 pr-3 py-1.5 rounded-xl border border-warmborder text-xs focus:outline-none focus:border-terracotta bg-sandstone/30 w-48"
              />
            </div>

            <select
              value={filterPlan}
              onChange={(e) => setFilterPlan(e.target.value as any)}
              className="px-2.5 py-1.5 rounded-xl border border-warmborder text-xs font-semibold bg-white cursor-pointer"
            >
              <option value="all">Semua Paket</option>
              <option value="Diamond">Diamond</option>
              <option value="Platinum">Platinum</option>
              <option value="Gold">Gold</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="px-2.5 py-1.5 rounded-xl border border-warmborder text-xs font-semibold bg-white cursor-pointer"
            >
              <option value="all">Semua Status</option>
              <option value="AKTIF">Hanya Aktif</option>
              <option value="DEMO">Masa Uji Coba</option>
              <option value="PERPANJANGAN">Perlu Perpanjangan</option>
            </select>
          </div>
        </div>

        {/* Tabel Developer Portofolio */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-sandstone/70 border-b border-warmborder text-[11px] font-extrabold uppercase tracking-wider text-warmmuted">
                <th className="py-3 px-4">Nama Developer (PT) &amp; Lokasi</th>
                <th className="py-3 px-3">Owner / Direktur</th>
                <th className="py-3 px-3 text-center">Proyek &amp; Unit</th>
                <th className="py-3 px-3 text-center">Paket SaaS</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3 text-right">Nilai GMV Jual</th>
                <th className="py-3 px-3 text-right">Tagihan / Bln</th>
                <th className="py-3 px-4 text-center">Aksi Direksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-warmborder">
              {filteredDevelopers.map((dev) => (
                <tr key={dev.id} className="hover:bg-sandstone/30 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2.5">
                      <div className="size-8 rounded-lg bg-terracotta/10 text-terracotta flex items-center justify-center font-bold text-xs shrink-0">
                        <Building2 className="size-4" />
                      </div>
                      <div>
                        <strong className="text-espresso font-extrabold block">{dev.companyName}</strong>
                        <span className="text-[11px] text-warmmuted">{dev.location}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-3">
                    <span className="font-semibold text-espresso block">{dev.ownerName}</span>
                    <a
                      href={`https://wa.me/${dev.phone.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] text-emerald-700 hover:underline flex items-center gap-1 font-mono"
                    >
                      <Phone className="size-3" />
                      {dev.phone}
                    </a>
                  </td>
                  <td className="py-3.5 px-3 text-center">
                    <span className="font-bold text-espresso">{dev.projectsCount} Proyek</span>
                    <span className="block text-[11px] text-warmmuted">{dev.totalUnits} Unit Kavling</span>
                  </td>
                  <td className="py-3.5 px-3 text-center">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        dev.activePlan === 'Diamond'
                          ? 'bg-purple-100 text-purple-900 border border-purple-300'
                          : dev.activePlan === 'Platinum'
                          ? 'bg-blue-100 text-blue-900 border border-blue-300'
                          : 'bg-amber-100 text-amber-900 border border-amber-300'
                      }`}
                    >
                      {dev.activePlan}
                    </span>
                  </td>
                  <td className="py-3.5 px-3 text-center">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        dev.status === 'AKTIF'
                          ? 'bg-emerald-100 text-emerald-800'
                          : dev.status === 'DEMO'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {dev.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-3 text-right font-mono font-semibold text-espresso">
                    {dev.gmvSalesIdr > 0 ? formatRupiah(dev.gmvSalesIdr) : '-'}
                  </td>
                  <td className="py-3.5 px-3 text-right font-mono font-bold text-emerald-800">
                    {dev.monthlyFee > 0 ? formatRupiah(dev.monthlyFee) : 'Free Trial'}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <a
                      href={`https://wa.me/${dev.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                        `Halo ${dev.ownerName}, kami dari Manajemen Developer Sales OS. Ingin menanyakan perkembangan operasional ${dev.companyName}. Apakah ada kebutuhan ekspansi proyek baru?`
                      )}`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] inline-flex items-center gap-1 transition-colors"
                    >
                      <Phone className="size-3" />
                      <span>Chat Owner</span>
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
