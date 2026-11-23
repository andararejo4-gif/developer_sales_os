import React from 'react';
import { Clock, Share2, CheckCircle2 } from 'lucide-react';
import type { ReportItem, Status } from '../../data';
import type { ScoreRow } from '../../data';

interface SeMobileActionCardProps {
  hits: number;
  totalItems: number;
  onJumpToReport: () => void;
  onCopyWa: () => void;
}

export const SeMobileActionCard: React.FC<SeMobileActionCardProps> = ({
  hits,
  totalItems,
  onJumpToReport,
  onCopyWa,
}) => {
  const remaining = Math.max(0, 10 - hits);

  return (
    <section
      aria-label="Tindakan Hari Ini"
      className="md:hidden bg-white border border-warmborder rounded-2xl p-4 space-y-3"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-xs font-bold text-terracotta">
            <Clock className="size-3.5 shrink-0" />
            <span>Batas Kirim 18.00 WIB</span>
          </div>
          <h2 className="text-base font-extrabold text-espresso mt-1">
            {remaining === 0
              ? 'Target laporan hari ini tercapai'
              : `${remaining} item target belum terpenuhi`}
          </h2>
          <p className="text-xs text-warmmuted mt-0.5">
            Progres {hits}/10 target hit dari {totalItems} item aktivitas harian.
          </p>
        </div>
        {remaining === 0 && (
          <CheckCircle2 className="size-6 text-olive shrink-0" />
        )}
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <button
          type="button"
          onClick={onJumpToReport}
          className="min-h-[44px] px-3 rounded-xl bg-espresso text-white text-xs font-bold flex items-center justify-center active:bg-espresso/90 cursor-pointer"
        >
          Isi Laporan
        </button>
        <button
          type="button"
          onClick={onCopyWa}
          className="min-h-[44px] px-3 rounded-xl bg-terracotta text-white text-xs font-bold flex items-center justify-center gap-1.5 active:bg-terracotta/90 cursor-pointer"
        >
          <Share2 className="size-3.5 shrink-0" />
          <span>Salin Laporan WA</span>
        </button>
      </div>
    </section>
  );
};

interface SeMobileScorecardListProps {
  rows: ScoreRow[];
}

export const SeMobileScorecardList: React.FC<SeMobileScorecardListProps> = ({ rows }) => {
  return (
    <div className="md:hidden divide-y divide-warmborder">
      {rows.map((s) => (
        <div key={s.komponen} className="p-4 space-y-2">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-bold text-espresso leading-snug">{s.komponen}</p>
              <p className="text-xs text-warmmuted mt-0.5">{s.note}</p>
            </div>
            <div className="text-right shrink-0">
              <span className="text-base font-extrabold text-espresso tabular-nums">{s.poin}</span>
              <span className="block text-[11px] font-semibold text-warmmuted">poin</span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs pt-1">
            <span>
              <span className="text-warmmuted">Bobot: </span>
              <strong className="text-terracotta tabular-nums">{s.bobot}</strong>
            </span>
            <span>
              <span className="text-warmmuted">Target: </span>
              <strong className="text-espresso">{s.target}</strong>
            </span>
            <span>
              <span className="text-warmmuted">Capaian: </span>
              <strong className="text-espresso">{s.capaian}</strong>
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

interface SeMobileDailyReportListProps {
  items: ReportItem[];
  evalStatus: (item: ReportItem) => Status;
  renderBadge: (status: Status) => React.ReactNode;
  onUpdateItem: (id: number, field: 'realisasi' | 'catatan', value: string) => void;
  renderCustomRealisasi?: (item: ReportItem) => React.ReactNode;
}

export const SeMobileDailyReportList: React.FC<SeMobileDailyReportListProps> = ({
  items,
  evalStatus,
  renderBadge,
  onUpdateItem,
  renderCustomRealisasi,
}) => {
  return (
    <div className="md:hidden divide-y divide-warmborder">
      {items.map((r) => {
        const status = evalStatus(r);
        return (
          <div key={r.id} className="p-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-bold text-espresso leading-snug">{r.item}</p>
                <p className="text-xs text-warmmuted mt-0.5 tabular-nums">Target: {r.target}</p>
              </div>
              <div className="shrink-0">{renderBadge(status)}</div>
            </div>

            <div className="space-y-2">
              {renderCustomRealisasi && [2, 4, 5].includes(r.id) ? (
                <div className="px-3 py-2.5 rounded-xl bg-sandstone/60 border border-warmborder space-y-1.5">
                  <span className="block text-[11px] font-semibold text-warmmuted">
                    Realisasi Hari Ini (Klik + / - untuk Update DB)
                  </span>
                  {renderCustomRealisasi(r)}
                </div>
              ) : (
                <div className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-sandstone/60 border border-warmborder">
                  <span className="text-[11px] font-semibold text-warmmuted">
                    Realisasi Hari Ini (Otomatis dari DB)
                  </span>
                  <span className="text-sm font-extrabold text-espresso tabular-nums">
                    {r.realisasi}
                  </span>
                </div>
              )}

              <label className="block">
                <span className="block text-[11px] font-semibold text-warmmuted mb-1">
                  Catatan / Hambatan
                </span>
                <input
                  value={r.catatan}
                  placeholder="Tambahkan catatan atau hambatan..."
                  onChange={(e) => onUpdateItem(r.id, 'catatan', e.target.value)}
                  className="w-full min-h-[44px] px-3 rounded-xl border border-warmborder bg-white focus:border-terracotta focus:outline-none text-xs"
                />
              </label>
            </div>
          </div>
        );
      })}
    </div>
  );
};
