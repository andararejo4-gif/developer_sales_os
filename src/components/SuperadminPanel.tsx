// ============================================================================
// SUPERADMIN PANEL - DEVELOPER SALES OS
// Central Multi-Tenant Governance, Plan Override, & AI Token Audit Monitor
// ============================================================================

import { useState } from 'react';
import {
  ShieldAlert,
  Cpu,
  X,
} from 'lucide-react';

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
  const [tenants, setTenants] = useState<TenantRecord[]>(SAMPLE_TENANTS);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

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
                Audit Multi-Tenant, Alokasi Paket, &amp; Monitor Pemakaian Token AI (Tabel ai_usage)
              </p>
            </div>
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

        {/* Toast */}
        {toastMessage && (
          <div className="px-6 py-2.5 bg-espresso text-white text-xs font-medium flex items-center justify-between shrink-0">
            <span>{toastMessage}</span>
            <button onClick={() => setToastMessage(null)} className="text-amber-400 font-bold hover:underline">
              Tutup
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
