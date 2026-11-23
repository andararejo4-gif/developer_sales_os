import React, { useState } from 'react';
import {
  Clock,
  Download,
  CheckCircle2,
  ChevronDown,
  MessageSquarePlus,
  Sparkles,
} from 'lucide-react';
import type { ReportItem, Status, ScoreRow } from '../../data';

interface SeMobileActionCardProps {
  hits: number;
  totalItems: number;
  onJumpToReport: () => void;
  onExportReport: () => void;
}

export const SeMobileActionCard: React.FC<SeMobileActionCardProps> = ({
  hits,
  totalItems,
  onJumpToReport,
  onExportReport,
}) => {
  const remaining = Math.max(0, totalItems - hits);

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
            Progres {hits}/{totalItems} target hit aktivitas harian.
          </p>
        </div>
        {remaining === 0 && <CheckCircle2 className="size-6 text-olive shrink-0" />}
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
          onClick={onExportReport}
          className="min-h-[44px] px-3 rounded-xl bg-terracotta text-white text-xs font-bold flex items-center justify-center gap-1.5 active:bg-terracotta/90 cursor-pointer"
        >
          <Download className="size-3.5 shrink-0" />
          <span>Export Laporan</span>
        </button>
      </div>
    </section>
  );
};

interface SeMobileScorecardListProps {
  rows: ScoreRow[];
}

export const SeMobileScorecardList: React.FC<SeMobileScorecardListProps> = ({ rows }) => {
  const [expandedKey, setExpandedKey] = useState<string | null>(null);

  const totalPoin = rows.reduce((sum, r) => {
    const num = parseFloat(String(r.poin).replace(/[^0-9.]/g, '')) || 0;
    return sum + num;
  }, 0);
  const activeKpiCount = rows.filter(
    (r) => (parseFloat(String(r.poin).replace(/[^0-9.]/g, '')) || 0) > 0
  ).length;
  const totalPct = Math.min(100, Math.round(totalPoin));

  return (
    <div className="md:hidden">
      {/* Visual Summary Strip */}
      <div className="p-4 bg-[#FBF9F5] border-b border-warmborder space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-warmmuted block">
              Progres Skor Bulanan
            </span>
            <p className="text-lg font-extrabold text-espresso tabular-nums">
              {totalPoin.toFixed(1).replace(/\.0$/, '')}{' '}
              <span className="text-xs font-semibold text-warmmuted">/ 100 Poin</span>
            </p>
          </div>
          <span className="px-2.5 py-1 rounded-xl bg-amber-50 border border-amber-200 text-[11px] font-extrabold text-terracotta tabular-nums">
            {activeKpiCount}/{rows.length} KPI Terisi
          </span>
        </div>
        <div className="h-2.5 rounded-full bg-sandstone overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              totalPct >= 80 ? 'bg-olive' : totalPct >= 50 ? 'bg-terracotta' : 'bg-amber-500'
            }`}
            style={{ width: `${Math.max(6, totalPct)}%` }}
          />
        </div>
      </div>

      {/* Compact Visual KPI Cards */}
      <div className="p-3 space-y-2.5 bg-sandstone/25">
        {rows.map((s, idx) => {
          const bobotMax = parseFloat(String(s.bobot).replace(/[^0-9.]/g, '')) || 10;
          const poinVal = parseFloat(String(s.poin).replace(/[^0-9.]/g, '')) || 0;
          const kpiPct = Math.min(100, Math.round((poinVal / Math.max(1, bobotMax)) * 100));
          const isOpen = expandedKey === s.komponen;

          return (
            <div
              key={s.komponen}
              className="rounded-2xl bg-white border border-warmborder overflow-hidden shadow-2xs"
            >
              <button
                type="button"
                onClick={() => setExpandedKey(isOpen ? null : s.komponen)}
                aria-expanded={isOpen}
                className="w-full p-3.5 text-left space-y-2.5 cursor-pointer active:bg-sandstone/40 transition-colors"
              >
                <div className="flex items-start justify-between gap-2.5">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <span
                      className={`size-6 rounded-lg text-[11px] font-black grid place-items-center shrink-0 mt-0.5 ${
                        kpiPct >= 80
                          ? 'bg-lime-100 text-olive'
                          : poinVal > 0
                          ? 'bg-amber-100 text-terracotta'
                          : 'bg-sandstone text-warmmuted'
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-extrabold text-espresso leading-snug">
                        {s.komponen}
                      </p>
                      <div className="flex items-center gap-1.5 flex-wrap mt-1">
                        <span className="px-1.5 py-0.5 rounded bg-sandstone text-[10px] font-bold text-espresso tabular-nums">
                          Bobot {s.bobot}
                        </span>
                        <span className="text-[11px] font-semibold text-warmmuted truncate">
                          {s.capaian} <span className="text-warmmuted/70">/ {s.target}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <div className="text-right">
                      <span
                        className={`text-sm font-black tabular-nums block leading-none ${
                          kpiPct >= 80
                            ? 'text-olive'
                            : poinVal > 0
                            ? 'text-terracotta'
                            : 'text-warmmuted'
                        }`}
                      >
                        +{s.poin}
                      </span>
                      <span className="text-[9px] font-bold uppercase text-warmmuted">
                        / {s.bobot.replace('%', '')} pt
                      </span>
                    </div>
                    <ChevronDown
                      className={`size-4 text-warmmuted transition-transform ${
                        isOpen ? 'rotate-180 text-terracotta' : ''
                      }`}
                    />
                  </div>
                </div>

                {/* Progress Bar per KPI */}
                <div className="h-1.5 rounded-full bg-sandstone overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      kpiPct >= 80
                        ? 'bg-olive'
                        : poinVal > 0
                        ? 'bg-terracotta'
                        : 'bg-warmborder'
                    }`}
                    style={{ width: `${poinVal > 0 ? Math.max(10, kpiPct) : 0}%` }}
                  />
                </div>
              </button>

              {isOpen && (
                <div className="px-3.5 pb-3 pt-2 bg-[#FBF9F5] border-t border-warmborder/60 text-[11px] space-y-1.5">
                  <div className="flex items-center justify-between text-espresso">
                    <span className="text-warmmuted font-semibold">Target Bulanan:</span>
                    <strong className="font-extrabold">{s.target}</strong>
                  </div>
                  <div className="flex items-center justify-between text-espresso">
                    <span className="text-warmmuted font-semibold">Realisasi Otomatis:</span>
                    <strong className="font-extrabold text-terracotta">{s.capaian}</strong>
                  </div>
                  {s.note && (
                    <p className="text-warmmuted pt-1 border-t border-warmborder/50 leading-relaxed">
                      {s.note}
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
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

const QUICK_NOTE_PRESETS = [
  'Sesuai target hari ini',
  'Follow-up lanjut besok pagi',
  'Prospek minta simulasi KPR',
  'Kendala cuaca / jadwal ulang',
];

export const SeMobileDailyReportList: React.FC<SeMobileDailyReportListProps> = ({
  items,
  evalStatus,
  renderBadge,
  onUpdateItem,
  renderCustomRealisasi,
}) => {
  const [openNoteIds, setOpenNoteIds] = useState<Record<number, boolean>>({});

  const toggleNote = (id: number) => {
    setOpenNoteIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="md:hidden p-3 space-y-2.5 bg-sandstone/25">
      {items.map((r) => {
        const status = evalStatus(r);
        const isManualStepper = Boolean(renderCustomRealisasi && [2, 4, 5].includes(r.id));
        const hasNote = Boolean(r.catatan && r.catatan.trim().length > 0);
        const isNoteOpen = Boolean(openNoteIds[r.id]);

        return (
          <div
            key={r.id}
            className={`rounded-2xl bg-white border transition-colors overflow-hidden shadow-2xs ${
              status === 'hit'
                ? 'border-lime-300/90'
                : isManualStepper
                ? 'border-amber-300'
                : 'border-warmborder'
            }`}
          >
            <div className="p-3.5 space-y-2.5">
              {/* Baris Utama: Nomor + Judul + Realisasi Ringkas + Badge */}
              <div className="flex items-start justify-between gap-2.5">
                <div className="flex items-start gap-2.5 min-w-0 flex-1">
                  <span
                    className={`size-6 rounded-lg text-[11px] font-black grid place-items-center shrink-0 mt-0.5 tabular-nums ${
                      status === 'hit'
                        ? 'bg-lime-100 text-olive'
                        : 'bg-sandstone text-espresso'
                    }`}
                  >
                    {r.id}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-extrabold text-espresso leading-snug">
                      {r.item}
                    </p>
                    <div className="flex items-center gap-2 flex-wrap mt-1 text-[11px]">
                      <span className="font-extrabold text-terracotta tabular-nums">
                        {r.realisasi}
                      </span>
                      <span className="text-warmmuted">· Target: {r.target}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  {renderBadge(status)}
                  <button
                    type="button"
                    onClick={() => toggleNote(r.id)}
                    className={`min-h-[30px] px-2.5 py-1 rounded-lg text-[10px] font-extrabold inline-flex items-center gap-1 cursor-pointer border transition-colors ${
                      hasNote || isNoteOpen
                        ? 'bg-amber-50 text-terracotta border-amber-200'
                        : 'bg-sandstone/70 text-warmmuted border-warmborder hover:text-espresso'
                    }`}
                  >
                    <MessageSquarePlus className="size-3 shrink-0" />
                    <span>{hasNote ? 'Catatan ✓' : '+ Catatan'}</span>
                  </button>
                </div>
              </div>

              {/* Kontrol Stepper (+ / -) Khusus 3 Item Input Manual */}
              {isManualStepper && renderCustomRealisasi && (
                <div className="pt-2 border-t border-warmborder/60 flex items-center justify-between gap-2 flex-wrap">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-terracotta flex items-center gap-1">
                    <Sparkles className="size-3" />
                    Tap + / -
                  </span>
                  {renderCustomRealisasi(r)}
                </div>
              )}

              {/* Cuplikan Catatan (Jika Sudah Ada & Sedang Tertutup) */}
              {hasNote && !isNoteOpen && (
                <button
                  type="button"
                  onClick={() => toggleNote(r.id)}
                  className="w-full text-left px-2.5 py-1.5 rounded-xl bg-[#FBF9F5] border border-warmborder/70 text-[11px] text-espresso truncate cursor-pointer"
                >
                  <span className="font-bold text-terracotta">Catatan: </span>
                  {r.catatan}
                </button>
              )}
            </div>

            {/* Panel Input Catatan On-Demand (Hanya Terbuka Saat Diklik) */}
            {isNoteOpen && (
              <div className="p-3.5 pt-2.5 bg-[#FBF9F5] border-t border-warmborder/70 space-y-2">
                <input
                  value={r.catatan}
                  placeholder="Ketik catatan singkat atau pilih chip di bawah..."
                  onChange={(e) => onUpdateItem(r.id, 'catatan', e.target.value)}
                  className="w-full min-h-[42px] px-3 rounded-xl border border-warmborder bg-white focus:border-terracotta focus:outline-none text-xs text-espresso"
                />
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
                  {QUICK_NOTE_PRESETS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => onUpdateItem(r.id, 'catatan', preset)}
                      className="px-2.5 py-1 rounded-lg bg-white border border-warmborder hover:border-terracotta text-[10px] font-bold text-espresso whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
