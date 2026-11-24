// ============================================================================
// AUDIT TRAIL / ACTIVITY LOG VIEWER PERUSAHAAN (ROLE SM, ADMIN, DIREKSI)
// Melihat siapa saja di perusahaan yang melakukan aksi CRUD sesuatu secara realtime
// ============================================================================

import React, { useEffect, useState } from 'react';
import { History, Search, RefreshCw, X, User, Clock, Trash2, Edit3, Plus, ArrowRightLeft, UserCheck } from 'lucide-react';
import type { RoleKey, UserProfile } from '../../data';

export interface ActivityAuditRecord {
  id: string;
  actor_email: string;
  actor_name: string;
  actor_role: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'CLAIM' | 'REASSIGN';
  target_entity: 'LEAD' | 'BANK_ACCOUNT' | 'UNIT' | 'ATTENDANCE' | 'SYSTEM';
  target_id: string;
  summary: string;
  details: Record<string, any>;
  created_at: string;
}

interface CompanyAuditLogsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  role: RoleKey;
}

export const CompanyAuditLogsModal: React.FC<CompanyAuditLogsModalProps> = ({
  isOpen,
  onClose,
  user,
  role,
}) => {
  const [logs, setLogs] = useState<ActivityAuditRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filterAction, setFilterAction] = useState<string>('ALL');
  const [filterEntity, setFilterEntity] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedLog, setSelectedLog] = useState<ActivityAuditRecord | null>(null);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterAction !== 'ALL') params.set('action', filterAction);
      if (filterEntity !== 'ALL') params.set('entity', filterEntity);
      params.set('limit', '100');

      const res = await fetch(`/api/company/audit-logs?${params.toString()}`, {
        headers: {
          'X-User-Email': user.email,
          'X-User-Role': role,
        },
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setLogs(data.data || []);
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchLogs();
    }
  }, [isOpen, filterAction, filterEntity]);

  const filteredLogs = logs.filter((log) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      log.actor_name.toLowerCase().includes(q) ||
      log.actor_email.toLowerCase().includes(q) ||
      log.summary.toLowerCase().includes(q) ||
      log.target_entity.toLowerCase().includes(q) ||
      log.target_id.toLowerCase().includes(q)
    );
  });

  if (!isOpen) return null;

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'CREATE':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <Plus className="size-3" /> CREATE
          </span>
        );
      case 'UPDATE':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-extrabold bg-blue-100 text-blue-800 border border-blue-300">
            <Edit3 className="size-3" /> UPDATE
          </span>
        );
      case 'DELETE':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-extrabold bg-rose-100 text-rose-800 border border-rose-300">
            <Trash2 className="size-3" /> DELETE
          </span>
        );
      case 'CLAIM':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-extrabold bg-amber-100 text-amber-800 border border-amber-300">
            <UserCheck className="size-3" /> CLAIM
          </span>
        );
      case 'REASSIGN':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-extrabold bg-purple-100 text-purple-800 border border-purple-300">
            <ArrowRightLeft className="size-3" /> REASSIGN
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-sandstone text-espresso">
            {action}
          </span>
        );
    }
  };

  const getEntityBadge = (entity: string) => {
    switch (entity) {
      case 'LEAD':
        return <span className="text-[11px] font-bold text-terracotta">Prospek Lead</span>;
      case 'BANK_ACCOUNT':
        return <span className="text-[11px] font-bold text-blue-700">Rekening Resmi</span>;
      case 'UNIT':
        return <span className="text-[11px] font-bold text-emerald-700">Inventori Unit</span>;
      case 'ATTENDANCE':
        return <span className="text-[11px] font-bold text-amber-700">Presensi &amp; GPS</span>;
      default:
        return <span className="text-[11px] font-bold text-warmmuted">{entity}</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full p-5 sm:p-6 shadow-2xl border border-warmborder space-y-4 animate-in fade-in zoom-in-95 duration-150 my-6 max-h-[92vh] flex flex-col">
        {/* Header Modal */}
        <div className="flex items-center justify-between pb-3 border-b border-warmborder shrink-0">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-espresso text-white flex items-center justify-center shrink-0">
              <History className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-extrabold text-espresso">
                  Riwayat Aktivitas &amp; Perubahan Data Tim
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sandstone text-espresso border border-warmborder">
                  Audit Trail
                </span>
              </div>
              <p className="text-xs text-warmmuted">
                Rekaman komprehensif riwayat data: siapa, kapan, dan perubahan apa yang dilakukan di sistem.
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

        {/* Filter Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 shrink-0">
          <div className="relative">
            <Search className="size-4 text-warmmuted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari karyawan, aksi, atau lead..."
              className="w-full min-h-[40px] pl-9 pr-3 rounded-xl border border-warmborder text-xs focus:border-terracotta focus:outline-none"
            />
          </div>

          <div>
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="w-full min-h-[40px] px-3 rounded-xl border border-warmborder bg-sandstone text-xs font-bold focus:border-terracotta focus:outline-none cursor-pointer"
            >
              <option value="ALL">Semua Jenis Aksi (CRUD)</option>
              <option value="CREATE">CREATE (Tambah Data)</option>
              <option value="UPDATE">UPDATE (Perubahan Data)</option>
              <option value="DELETE">DELETE (Hapus Data)</option>
              <option value="CLAIM">CLAIM (Ambil Alih Lead Pool)</option>
              <option value="REASSIGN">REASSIGN (Penugasan Lead)</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={filterEntity}
              onChange={(e) => setFilterEntity(e.target.value)}
              className="w-full min-h-[40px] px-3 rounded-xl border border-warmborder bg-sandstone text-xs font-bold focus:border-terracotta focus:outline-none cursor-pointer"
            >
              <option value="ALL">Semua Entitas Target</option>
              <option value="LEAD">Prospek / Lead</option>
              <option value="BANK_ACCOUNT">Rekening Perusahaan</option>
              <option value="UNIT">Inventori Unit Properti</option>
              <option value="ATTENDANCE">Presensi &amp; GPS</option>
              <option value="SYSTEM">Sistem Umum</option>
            </select>

            <button
              type="button"
              onClick={fetchLogs}
              className="size-10 rounded-xl bg-sandstone hover:bg-warmborder text-espresso flex items-center justify-center cursor-pointer shrink-0"
              title="Refresh log"
            >
              <RefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* List of Audit Logs */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {loading ? (
            <div className="p-10 text-center text-xs text-warmmuted">Memuat rekaman log audit...</div>
          ) : filteredLogs.length === 0 ? (
            <div className="p-10 text-center text-xs text-warmmuted border border-dashed border-warmborder rounded-xl">
              Tidak ada rekaman log audit yang cocok dengan filter.
            </div>
          ) : (
            filteredLogs.map((log) => {
              const dateStr = new Date(log.created_at).toLocaleString('id-ID', {
                dateStyle: 'medium',
                timeStyle: 'medium',
              });

              return (
                <div
                  key={log.id}
                  className="p-3.5 rounded-xl border border-warmborder bg-white hover:bg-sandstone/30 transition-colors space-y-2 text-xs"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-warmmuted">
                    <div className="flex flex-wrap items-center gap-2">
                      {getActionBadge(log.action)}
                      {getEntityBadge(log.target_entity)}
                      <span className="text-[11px] font-mono text-warmmuted">#{log.target_id.slice(0, 8)}</span>
                    </div>
                    <span className="text-[11px] flex items-center gap-1">
                      <Clock className="size-3 text-warmmuted" />
                      {dateStr}
                    </span>
                  </div>

                  <p className="text-espresso font-semibold leading-relaxed">
                    {log.summary}
                  </p>

                  <div className="flex items-center justify-between pt-1 border-t border-warmborder/40 text-[11px]">
                    <div className="flex items-center gap-1.5 text-warmmuted">
                      <User className="size-3 text-terracotta" />
                      <span>
                        Oleh: <strong>{log.actor_name}</strong> ({log.actor_role} · {log.actor_email})
                      </span>
                    </div>

                    {log.details && Object.keys(log.details).length > 0 && (
                      <button
                        type="button"
                        onClick={() => setSelectedLog(selectedLog?.id === log.id ? null : log)}
                        className="text-terracotta hover:underline font-bold text-[10px] cursor-pointer"
                      >
                        {selectedLog?.id === log.id ? 'Sembunyikan JSON' : 'Lihat Detail JSON'}
                      </button>
                    )}
                  </div>

                  {selectedLog?.id === log.id && (
                    <pre className="p-3 rounded-lg bg-espresso text-amber-200 text-[10px] font-mono overflow-x-auto max-h-48 mt-2">
                      {JSON.stringify(log.details, null, 2)}
                    </pre>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-warmborder shrink-0">
          <span className="text-xs font-bold text-warmmuted">
            Menampilkan {filteredLogs.length} dari {logs.length} entri audit log
          </span>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[40px] px-5 rounded-xl bg-espresso text-white text-xs font-bold cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
