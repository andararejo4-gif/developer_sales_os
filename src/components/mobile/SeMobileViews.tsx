import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Clock,
  Download,
  CheckCircle2,
  ChevronDown,
  MessageSquarePlus,
  Sparkles,
  SlidersHorizontal,
  Database,
  ShieldAlert,
  X,
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

const SHORT_ITEM_LABELS: Record<number, string> = {
  1: 'Lead Baru Masuk',
  2: 'Telepon & Tersambung',
  3: 'Chat WA & Follow-Up',
  4: 'Canvassing Lapangan',
  5: 'Posting Konten Sosmed',
  6: 'Prospek BANT ≥ 7',
  7: 'Janji Temu (Appt)',
  8: 'Kunjungan Lokasi',
  9: 'Penawaran Tertulis',
  10: 'Hot Prospek Aktif',
  11: 'Booking & Berkas KPR',
  12: 'Referral Diperoleh',
  13: 'Hambatan & Bantuan SM',
};

const QUICK_NOTE_PRESETS = [
  'Sesuai target hari ini',
  'Follow-up lanjut besok pagi',
  'Prospek minta simulasi KPR',
  'Sudah dikirim penawaran WA',
];

const HAMBATAN_PRESETS = [
  'Aman & lancar sesuai target',
  'Butuh bantuan closing SM',
  'Butuh materi promo terbaru',
  'Kendala cuaca saat canvassing',
];

export const SeMobileDailyReportList: React.FC<SeMobileDailyReportListProps> = ({
  items,
  evalStatus,
  renderBadge,
  onUpdateItem,
  renderCustomRealisasi,
}) => {
  const [selectedSheetItem, setSelectedSheetItem] = useState<ReportItem | null>(null);

  const manualItems = items.filter((r) => [2, 4, 5].includes(r.id));
  const autoItems = items.filter((r) => ![2, 4, 5, 13].includes(r.id));
  const closingIssueItem = items.find((r) => r.id === 13);

  const targetItems = items.filter((r) => r.targetNum !== null);
  const hitCount = targetItems.filter((r) => evalStatus(r) === 'hit').length;
  const hitPct =
    targetItems.length > 0 ? Math.min(100, Math.round((hitCount / targetItems.length) * 100)) : 0;

  const activeSheetItem = selectedSheetItem
    ? items.find((i) => i.id === selectedSheetItem.id) || selectedSheetItem
    : null;

  return (
    <div className="md:hidden">
      {/* LAPIS 1: Executive Daily Progress Strip */}
      <div className="p-4 bg-[#FBF9F5] border-b border-warmborder space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-warmmuted block">
              Realisasi Target Harian
            </span>
            <p className="text-lg font-extrabold text-espresso tabular-nums">
              {hitCount} <span className="text-xs font-semibold text-warmmuted">/ {targetItems.length} Target Hit</span>
            </p>
          </div>
          <span className="px-2.5 py-1 rounded-xl bg-amber-50 border border-amber-200 text-[11px] font-extrabold text-terracotta">
            Batas 18:00 WIB
          </span>
        </div>
        <div className="h-2.5 rounded-full bg-sandstone overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              hitPct >= 80 ? 'bg-olive' : hitPct >= 40 ? 'bg-terracotta' : 'bg-amber-500'
            }`}
            style={{ width: `${Math.max(8, hitPct)}%` }}
          />
        </div>
      </div>

      <div className="p-3.5 space-y-4 bg-sandstone/25">
        {/* LAPIS 2: Deck Input Cepat Lapangan (3 Item Interaktif) */}
        {manualItems.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between px-0.5">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-espresso flex items-center gap-1.5">
                <SlidersHorizontal className="size-3.5 text-terracotta" />
                Input Cepat Aktivitas ({manualItems.length})
              </span>
              <span className="text-[10px] font-semibold text-warmmuted">Tap + / - langsung</span>
            </div>

            <div className="space-y-2.5">
              {manualItems.map((r) => {
                const status = evalStatus(r);
                const hasNote = Boolean(r.catatan && r.catatan.trim());
                return (
                  <div
                    key={r.id}
                    className="p-3.5 rounded-2xl bg-white border border-amber-300/90 shadow-2xs space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="px-1.5 py-0.5 rounded-md bg-amber-100 text-terracotta text-[10px] font-black tabular-nums">
                            #{r.id}
                          </span>
                          <p className="text-xs font-extrabold text-espresso truncate">
                            {SHORT_ITEM_LABELS[r.id] || r.item}
                          </p>
                        </div>
                        <p className="text-[11px] font-semibold text-warmmuted mt-0.5 tabular-nums">
                          Capaian: <strong className="text-espresso">{r.realisasi}</strong> · Target: {r.target}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {renderBadge(status)}
                        <button
                          type="button"
                          onClick={() => setSelectedSheetItem(r)}
                          className={`min-h-[30px] px-2 py-1 rounded-lg text-[10px] font-extrabold border cursor-pointer ${
                            hasNote
                              ? 'bg-amber-50 text-terracotta border-amber-200'
                              : 'bg-sandstone/70 text-warmmuted border-warmborder'
                          }`}
                        >
                          {hasNote ? 'Catatan ✓' : '+ Catatan'}
                        </button>
                      </div>
                    </div>

                    {renderCustomRealisasi && (
                      <div className="pt-2 border-t border-warmborder/60">
                        {renderCustomRealisasi(r)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* LAPIS 3: Grid 2-Kolom Metrik Otomatis CRM (9 Item) */}
        {autoItems.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between px-0.5">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-espresso flex items-center gap-1.5">
                <Database className="size-3.5 text-olive" />
                Rekap Otomatis Pipeline ({autoItems.length})
              </span>
              <span className="text-[10px] font-semibold text-warmmuted">Ketuk kartu untuk catatan</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {autoItems.map((r) => {
                const status = evalStatus(r);
                const isHit = status === 'hit';
                const hasNote = Boolean(r.catatan && r.catatan.trim());
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setSelectedSheetItem(r)}
                    className={`p-3 rounded-2xl bg-white border text-left flex flex-col justify-between gap-2 cursor-pointer active:scale-[0.99] transition-all shadow-2xs ${
                      isHit ? 'border-lime-300' : 'border-warmborder hover:border-terracotta'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1.5 w-full">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[9px] font-black tabular-nums ${
                          isHit ? 'bg-lime-100 text-olive' : 'bg-sandstone text-warmmuted'
                        }`}
                      >
                        #{r.id}
                      </span>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold ${
                          isHit
                            ? 'bg-lime-100 text-olive'
                            : status === 'note'
                            ? 'bg-amber-50 text-terracotta'
                            : 'bg-sandstone text-warmmuted'
                        }`}
                      >
                        {isHit ? 'Hit ✓' : r.target !== '—' ? `Target ${r.target}` : 'Info'}
                      </span>
                    </div>

                    <div className="min-w-0">
                      <p className="text-[11px] font-bold text-warmmuted truncate">
                        {SHORT_ITEM_LABELS[r.id] || r.item}
                      </p>
                      <p className="text-base font-extrabold text-espresso tabular-nums truncate mt-0.5">
                        {r.realisasi}
                      </p>
                    </div>

                    <div className="pt-1.5 border-t border-warmborder/60 flex items-center justify-between gap-1 text-[10px]">
                      <span className={`truncate font-semibold ${hasNote ? 'text-terracotta' : 'text-warmmuted'}`}>
                        {hasNote ? r.catatan : '+ Tambah catatan'}
                      </span>
                      <MessageSquarePlus className="size-3 text-warmmuted shrink-0" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* LAPIS 4: Kartu Penutup Hambatan & Bantuan SM (Item #13) */}
        {closingIssueItem && (
          <div className="p-4 rounded-2xl bg-white border border-warmborder shadow-2xs space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="size-8 rounded-xl bg-amber-50 border border-amber-200 text-terracotta grid place-items-center shrink-0">
                  <ShieldAlert className="size-4" />
                </div>
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-terracotta block">
                    Item #13 · Penutup Harian
                  </span>
                  <h4 className="text-xs font-extrabold text-espresso">
                    Hambatan &amp; Bantuan yang Dibutuhkan
                  </h4>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {HAMBATAN_PRESETS.map((preset) => {
                const active = closingIssueItem.catatan === preset;
                return (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => onUpdateItem(closingIssueItem.id, 'catatan', preset)}
                    className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold border cursor-pointer transition-colors ${
                      active
                        ? 'bg-espresso text-white border-espresso'
                        : 'bg-sandstone/60 text-espresso border-warmborder hover:border-terracotta'
                    }`}
                  >
                    {preset}
                  </button>
                );
              })}
            </div>

            <input
              value={closingIssueItem.catatan}
              placeholder="Ketik catatan atau kebutuhan bantuan SM hari ini..."
              onChange={(e) => onUpdateItem(closingIssueItem.id, 'catatan', e.target.value)}
              className="w-full min-h-[44px] px-3.5 rounded-xl border border-warmborder bg-[#FBF9F5] focus:bg-white focus:border-terracotta focus:outline-none text-xs text-espresso"
            />
          </div>
        )}
      </div>

      {/* Bottom-Sheet Detail & Catatan per Item (Portal z-[85] Menutupi Bottom Nav) */}
      {activeSheetItem &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed inset-0 z-[85] bg-espresso/60 backdrop-blur-[2px] flex items-end justify-center"
            onClick={() => setSelectedSheetItem(null)}
          >
            <div
              className="w-full bg-white rounded-t-3xl border-t border-warmborder shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-150"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="pt-2.5 pb-1">
                <div className="w-10 h-1 rounded-full bg-warmborder mx-auto" />
              </div>
              <div className="px-4 py-3 border-b border-warmborder flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-terracotta">
                    Item #{activeSheetItem.id} · Target: {activeSheetItem.target}
                  </span>
                  <h4 className="text-sm font-extrabold text-espresso truncate">
                    {activeSheetItem.item}
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedSheetItem(null)}
                  className="size-9 rounded-xl bg-sandstone text-espresso grid place-items-center shrink-0 cursor-pointer"
                  aria-label="Tutup catatan item"
                >
                  <X className="size-4" />
                </button>
              </div>

              <div className="p-4 space-y-3.5 pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
                <div className="p-3 rounded-2xl bg-sandstone/50 border border-warmborder flex items-center justify-between">
                  <span className="text-xs font-bold text-warmmuted">Realisasi Tercatat DB</span>
                  <span className="text-base font-extrabold text-espresso tabular-nums">
                    {activeSheetItem.realisasi}
                  </span>
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold text-espresso mb-1.5">
                    Catatan / Keterangan Item #{activeSheetItem.id}
                  </label>
                  <input
                    value={activeSheetItem.catatan}
                    placeholder="Ketik catatan atau pilih rekomendasi cepat di bawah..."
                    onChange={(e) =>
                      onUpdateItem(activeSheetItem.id, 'catatan', e.target.value)
                    }
                    className="w-full min-h-[44px] px-3.5 rounded-xl border border-warmborder bg-white focus:border-terracotta focus:outline-none text-xs text-espresso"
                  />
                </div>

                <div className="space-y-1.5">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-warmmuted flex items-center gap-1">
                    <Sparkles className="size-3 text-terracotta" />
                    Isi Cepat 1-Ketuk
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {QUICK_NOTE_PRESETS.map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() =>
                          onUpdateItem(activeSheetItem.id, 'catatan', preset)
                        }
                        className="px-2.5 py-1.5 rounded-xl bg-sandstone/70 hover:bg-amber-50 border border-warmborder text-[11px] font-bold text-espresso cursor-pointer"
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedSheetItem(null)}
                  className="w-full min-h-[44px] rounded-xl bg-espresso text-white text-xs font-extrabold cursor-pointer"
                >
                  Simpan &amp; Tutup
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};
