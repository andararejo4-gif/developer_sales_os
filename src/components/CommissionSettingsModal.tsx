// ============================================================================
// COMMISSION SETTINGS MODAL - DEVELOPER SALES OS
// Configurable Commission Sharing Rules for Owner & Sales Manager
// ============================================================================

import { useEffect, useState } from 'react';
import { Percent, X } from 'lucide-react';
import { getCommissionStructure, updateCommissionStructure } from '../lib/crm/crm-store';
import { loadPersistedState, savePersistedState } from '../lib/navigation/router';
import type { CommissionStructure } from '../lib/crm/types';

interface CommissionSettingsModalProps {
  variant?: 'modal' | 'page';
  onClose?: () => void;
  onSaved?: (structure: CommissionStructure) => void;
}

export function CommissionSettingsModal({
  variant = 'modal',
  onClose,
  onSaved,
}: CommissionSettingsModalProps) {
  const [comm, setComm] = useState<CommissionStructure>(() =>
    loadPersistedState<CommissionStructure>('devos_commission_draft', getCommissionStructure())
  );
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    savePersistedState('devos_commission_draft', comm);
  }, [comm]);

  const totalPercent =
    comm.companySharePercent +
    comm.smSharePercent +
    comm.tlSharePercent +
    comm.seSharePercent +
    comm.affiliatorSharePercent;

  const isValid = totalPercent === 100;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) {
      setToast('Total pembagian komisi harus tepat 100%!');
      return;
    }
    const saved = updateCommissionStructure(comm);
    if (onSaved) onSaved(saved);
    setToast('Aturan komisi berhasil diperbarui.');
    if (variant === 'modal' && onClose) {
      setTimeout(() => onClose(), 800);
    }
  };

  const outerClass =
    variant === 'page'
      ? 'w-full max-w-xl'
      : 'fixed inset-0 z-60 bg-espresso/70 backdrop-blur-sm flex items-center justify-center p-4';
  const cardClass =
    variant === 'page'
      ? 'bg-white rounded-2xl p-5 sm:p-6 border border-warmborder w-full shadow-xs space-y-5'
      : 'bg-white rounded-3xl p-6 border border-warmborder max-w-md w-full shadow-2xl space-y-5 animate-in zoom-in-95';

  return (
    <div className={outerClass}>
      <div className={cardClass}>
        <div className="flex items-center justify-between border-b border-warmborder pb-3">
          <div className="flex items-center gap-2.5">
            <div className="size-9 rounded-xl bg-terracotta text-white flex items-center justify-center shrink-0">
              <Percent className="size-4" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-espresso">Aturan Komisi Penjualan</h3>
              <p className="text-[11px] text-warmmuted">Dikelola oleh Owner &amp; Sales Manager</p>
            </div>
          </div>
          {variant === 'modal' && onClose && (
            <button onClick={onClose} className="text-warmmuted hover:text-espresso p-1.5">
              <X className="size-5" />
            </button>
          )}
        </div>

        <form onSubmit={handleSave} className="space-y-3.5 text-xs">
          <div>
            <div className="flex justify-between font-bold text-espresso mb-1">
              <span>Bagian Perusahaan / Developer</span>
              <span className="text-terracotta">{comm.companySharePercent}%</span>
            </div>
            <input
              type="number"
              min="0"
              max="100"
              value={comm.companySharePercent}
              onChange={(e) => setComm({ ...comm, companySharePercent: Number(e.target.value) })}
              className="w-full px-3 py-2 rounded-xl border border-warmborder text-espresso font-bold bg-sandstone/30"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="flex justify-between font-bold text-espresso mb-1">
                <span>Sales Manager (SM)</span>
                <span className="text-terracotta">{comm.smSharePercent}%</span>
              </div>
              <input
                type="number"
                min="0"
                max="50"
                value={comm.smSharePercent}
                onChange={(e) => setComm({ ...comm, smSharePercent: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl border border-warmborder text-espresso font-bold bg-sandstone/30"
              />
            </div>
            <div>
              <div className="flex justify-between font-bold text-espresso mb-1">
                <span>Team Leader (TL)</span>
                <span className="text-terracotta">{comm.tlSharePercent}%</span>
              </div>
              <input
                type="number"
                min="0"
                max="50"
                value={comm.tlSharePercent}
                onChange={(e) => setComm({ ...comm, tlSharePercent: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl border border-warmborder text-espresso font-bold bg-sandstone/30"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="flex justify-between font-bold text-espresso mb-1">
                <span>Sales Executive (SE)</span>
                <span className="text-terracotta">{comm.seSharePercent}%</span>
              </div>
              <input
                type="number"
                min="0"
                max="50"
                value={comm.seSharePercent}
                onChange={(e) => setComm({ ...comm, seSharePercent: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl border border-warmborder text-espresso font-bold bg-sandstone/30"
              />
            </div>
            <div>
              <div className="flex justify-between font-bold text-espresso mb-1">
                <span>Affiliator / Freelance</span>
                <span className="text-terracotta">{comm.affiliatorSharePercent}%</span>
              </div>
              <input
                type="number"
                min="0"
                max="50"
                value={comm.affiliatorSharePercent}
                onChange={(e) => setComm({ ...comm, affiliatorSharePercent: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl border border-warmborder text-espresso font-bold bg-sandstone/30"
              />
            </div>
          </div>

          {/* Validation Total */}
          <div
            className={`p-3 rounded-2xl flex items-center justify-between text-xs font-bold ${
              isValid ? 'bg-lime-50 text-olive border border-lime-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}
          >
            <span>Total Alokasi:</span>
            <span>{totalPercent}% {isValid ? '(Valid 100%)' : '(Harus 100%)'}</span>
          </div>

          {toast && <p className="text-xs font-bold text-terracotta text-center">{toast}</p>}

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-sandstone font-semibold text-espresso"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={!isValid}
              className="px-4 py-2 rounded-xl bg-terracotta hover:bg-terracotta/90 disabled:opacity-50 font-bold text-white shadow-sm"
            >
              Simpan Aturan Komisi
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
