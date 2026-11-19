// ============================================================================
// DIREKSI MULTI-PROJECT VIEW - DEVELOPER SALES OS
// Target vs Actual Revenue, Project Cards, & Project Document Trays
// ============================================================================

import React, { useState } from 'react';
import {
  Plus,
  FileText,
  Eye,
  X,
} from 'lucide-react';
import { computeDireksiRevenue } from '../lib/membership/project-guard';

interface DireksiMultiProjectViewProps {
  isDemoAccount?: boolean;
  onOpenDocument?: (docType: string, projectId: string) => void;
  onAddNewProject?: () => void;
}

export const DireksiMultiProjectView: React.FC<DireksiMultiProjectViewProps> = ({
  isDemoAccount = false,
  onOpenDocument,
  onAddNewProject,
}) => {
  const [showNewProjModal, setShowNewProjModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const projects = [
    {
      id: 'proj-01',
      name: 'The Park Townhouse Sukoharjo',
      target_omset: 27000000000,
      total_units: 30,
      city: 'Sukoharjo / Solo Baru',
      documents: [
        { type: 'surat_cinta_99', title: 'Surat Cinta 99 Keunggulan', version: 1, publishedDate: '19 Nov 2026', status: 'READY', isFree: true },
        { type: 'kartu_produk', title: 'Kartu Produk 1 Halaman', version: 1, publishedDate: '19 Nov 2026', status: 'READY', isFree: false },
        { type: 'riset_pasar', title: 'Riset Pasar (Radius 25km)', version: 1, publishedDate: '19 Nov 2026', status: 'READY', isFree: false },
        { type: 'target_penjualan', title: 'Target Penjualan 100% Sold Out', version: 1, publishedDate: '19 Nov 2026', status: 'READY', isFree: false },
        { type: 'kalender_konten', title: 'Kalender Konten 30 Hari', version: 1, publishedDate: '19 Nov 2026', status: 'READY', isFree: false },
        { type: 'playbook', title: 'Playbook Sales (SE, TL, SM)', version: 1, publishedDate: '19 Nov 2026', status: 'READY', isFree: false },
        { type: 'website', title: 'Website Landing Page Proyek', version: 1, publishedDate: '19 Nov 2026', status: 'READY', isFree: false },
      ],
    },
    {
      id: 'proj-02',
      name: 'Andara Garden Regency (Tahap 2)',
      target_omset: 18000000000,
      total_units: 24,
      city: 'Solo Baru Utara',
      documents: [
        { type: 'surat_cinta_99', title: 'Surat Cinta 99 Keunggulan', version: 1, publishedDate: '18 Nov 2026', status: 'READY', isFree: true },
        { type: 'kartu_produk', title: 'Kartu Produk 1 Halaman', version: 1, publishedDate: '18 Nov 2026', status: 'READY', isFree: false },
        { type: 'riset_pasar', title: 'Riset Pasar (Radius 25km)', version: 0, publishedDate: '-', status: 'NOT_CREATED', isFree: false },
        { type: 'target_penjualan', title: 'Target Penjualan 100% Sold Out', version: 0, publishedDate: '-', status: 'NOT_CREATED', isFree: false },
        { type: 'kalender_konten', title: 'Kalender Konten 30 Hari', version: 0, publishedDate: '-', status: 'NOT_CREATED', isFree: false },
        { type: 'playbook', title: 'Playbook Sales', version: 0, publishedDate: '-', status: 'NOT_CREATED', isFree: false },
        { type: 'website', title: 'Website Landing Page', version: 0, publishedDate: '-', status: 'NOT_CREATED', isFree: false },
      ],
    },
  ];

  const units = [
    // The Park Units
    { project_id: 'proj-01', price_cash_hard: 850000000, status: 'terjual' as const },
    { project_id: 'proj-01', price_cash_hard: 830000000, status: 'terjual' as const },
    { project_id: 'proj-01', price_cash_hard: 830000000, status: 'terjual' as const },
    { project_id: 'proj-01', price_cash_hard: 950000000, status: 'terjual' as const },
    { project_id: 'proj-01', price_cash_hard: 1150000000, status: 'terjual' as const },
    { project_id: 'proj-01', price_cash_hard: 850000000, status: 'booking' as const },
    { project_id: 'proj-01', price_cash_hard: 950000000, status: 'booking' as const },
    { project_id: 'proj-01', price_cash_hard: 580000000, status: 'tersedia' as const },

    // Andara Garden Regency Units
    { project_id: 'proj-02', price_cash_hard: 600000000, status: 'terjual' as const },
    { project_id: 'proj-02', price_cash_hard: 600000000, status: 'terjual' as const },
    { project_id: 'proj-02', price_cash_hard: 600000000, status: 'booking' as const },
  ];

  const revenueSummary = computeDireksiRevenue(projects, units);

  const rupiah = (val: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);

  return (
    <div className="space-y-6">
      {/* Top Banner Notice */}
      <div className="p-5 rounded-3xl bg-espresso text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-md">
        <div>
          <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-terracotta text-white uppercase tracking-wider">
            Dasbor Direksi &amp; Owner
          </span>
          <h2 className="text-xl font-black mt-1">Konsolidasi Portofolio Penjualan Properti</h2>
          <p className="text-xs text-stone-300 mt-0.5">
            Aktual Pendapatan murni dihitung dari unit berstatus Akad / Closing. Booking dicatat sebagai pipeline berjalan.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isDemoAccount && (
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
              Mode Cuplikan (Demo)
            </span>
          )}

          <button
            onClick={() => {
              if (onAddNewProject) onAddNewProject();
              else setShowNewProjModal(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-terracotta hover:bg-terracotta/90 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-terracotta/20 cursor-pointer"
          >
            <Plus className="size-4" />
            <span>Tambah Proyek Baru</span>
          </button>
        </div>
      </div>

      {/* Aggregate Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-3xl bg-white border border-warmborder shadow-sm">
          <span className="text-xs font-extrabold text-warmmuted uppercase tracking-wider">Total Target Omset</span>
          <p className="text-2xl font-black text-espresso mt-1">{rupiah(revenueSummary.total_target)}</p>
          <span className="text-[11px] text-warmmuted mt-1 block">Gabungan 2 Proyek Aktif</span>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-warmborder shadow-sm">
          <span className="text-xs font-extrabold text-olive uppercase tracking-wider">Aktual Realisasi (Akad)</span>
          <p className="text-2xl font-black text-olive mt-1">{rupiah(revenueSummary.total_aktual)}</p>
          <span className="text-[11px] text-olive font-semibold mt-1 block">
            {revenueSummary.total_persentase}% Tercapai ({revenueSummary.total_unit_akad} Unit Akad)
          </span>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-warmborder shadow-sm">
          <span className="text-xs font-extrabold text-terracotta uppercase tracking-wider">Pipeline Berjalan (Booking)</span>
          <p className="text-2xl font-black text-terracotta mt-1">{rupiah(revenueSummary.total_pipeline_booking)}</p>
          <span className="text-[11px] text-warmmuted mt-1 block">
            {revenueSummary.total_unit_booking} Unit Berkas SPK &amp; SLIK KPR
          </span>
        </div>
      </div>

      {/* Table Per-Project Breakdown */}
      <div className="bg-white border border-warmborder rounded-3xl overflow-hidden shadow-sm">
        <div className="p-5 border-b border-warmborder flex items-center justify-between">
          <h3 className="text-sm font-extrabold text-espresso">Rincian Performa Target vs Aktual per Proyek</h3>
          <span className="text-xs font-semibold text-warmmuted">Tahun Berjalan 2026</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-sandstone/50 border-b border-warmborder font-extrabold text-warmmuted uppercase text-[10px]">
                <th className="py-3 px-4">Nama Proyek</th>
                <th className="py-3 px-3">Target Omset</th>
                <th className="py-3 px-3">Aktual Pendapatan (Akad)</th>
                <th className="py-3 px-3">Pipeline Booking</th>
                <th className="py-3 px-3">Capaian (%)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-warmborder">
              {revenueSummary.per_project.map((p) => (
                <tr key={p.project_id} className="hover:bg-sandstone/30 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-espresso">{p.project_name}</td>
                  <td className="py-3.5 px-3 font-medium">{rupiah(p.target_pendapatan)}</td>
                  <td className="py-3.5 px-3 font-bold text-olive">{rupiah(p.aktual_pendapatan)} ({p.unit_akad_count} Unit)</td>
                  <td className="py-3.5 px-3 text-terracotta font-semibold">{rupiah(p.pipeline_booking_nilai)} ({p.unit_booking_count} Unit)</td>
                  <td className="py-3.5 px-3">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-amber-50 text-terracotta border border-amber-200">
                      {p.persentase_capaian}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Project Cards with Document Trays */}
      <div className="space-y-4">
        <h3 className="text-sm font-black text-espresso uppercase tracking-wider">
          Portofolio Proyek &amp; Baki Dokumen Pemasaran (Document Tray)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {projects.map((proj) => (
            <div key={proj.id} className="bg-white rounded-3xl border border-warmborder p-6 shadow-sm flex flex-col justify-between space-y-5">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-terracotta">{proj.city}</span>
                  <span className="text-xs font-bold text-warmmuted">{proj.total_units} Unit</span>
                </div>
                <h4 className="text-lg font-black text-espresso mt-1">{proj.name}</h4>
                <p className="text-xs font-bold text-olive mt-0.5">Target Omset: {rupiah(proj.target_omset)}</p>

                {/* Document Tray */}
                <div className="mt-4 pt-4 border-t border-warmborder space-y-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-warmmuted block mb-2">
                    Dokumen Pemasaran Proyek:
                  </span>

                  {proj.documents.map((doc) => {
                    const isCreated = doc.status === 'READY';
                    return (
                      <div
                        key={doc.type}
                        className="p-2.5 rounded-2xl bg-sandstone/30 border border-warmborder/60 flex items-center justify-between text-xs hover:bg-sandstone/60 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <FileText className={`size-3.5 ${isCreated ? 'text-terracotta' : 'text-warmmuted/50'}`} />
                          <span className={`font-semibold ${isCreated ? 'text-espresso' : 'text-warmmuted/60 italic'}`}>
                            {doc.title}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          {isCreated ? (
                            <>
                              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-sandstone text-warmmuted">
                                v{doc.version}
                              </span>
                              {isDemoAccount && !doc.isFree ? (
                                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 border border-amber-300">
                                  Cuplikan
                                </span>
                              ) : null}
                              <button
                                onClick={() => {
                                  if (onOpenDocument) onOpenDocument(doc.type, proj.id);
                                  else setToastMessage(`Membuka ${doc.title}`);
                                }}
                                className="px-2.5 py-1 rounded-lg bg-terracotta text-white font-bold text-[11px] hover:bg-terracotta/90 flex items-center gap-1 cursor-pointer"
                              >
                                <Eye className="size-3" />
                                <span>Buka</span>
                              </button>
                            </>
                          ) : (
                            <span className="text-[11px] font-semibold text-warmmuted/60 italic">
                              Belum dibuat
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal Tambah Proyek Baru */}
      {showNewProjModal && (
        <div className="fixed inset-0 z-60 bg-espresso/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 border border-warmborder max-w-md w-full shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-warmborder pb-3">
              <h3 className="text-base font-extrabold text-espresso">Tambah Proyek Perumahan Baru</h3>
              <button onClick={() => setShowNewProjModal(false)} className="text-warmmuted hover:text-espresso">
                <X className="size-5" />
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setToastMessage('Proyek baru berhasil didaftarkan ke portofolio.');
                setShowNewProjModal(false);
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="font-bold text-espresso block mb-1">Nama Proyek *</label>
                <input required placeholder="Contoh: The Park Townhouse Phase 2" className="w-full px-3 py-2 rounded-xl border border-warmborder" />
              </div>
              <div>
                <label className="font-bold text-espresso block mb-1">Target Total Unit *</label>
                <input required type="number" defaultValue="30" className="w-full px-3 py-2 rounded-xl border border-warmborder" />
              </div>
              <div>
                <label className="font-bold text-espresso block mb-1">Target Omset (IDR) *</label>
                <input required type="number" defaultValue="27000000000" className="w-full px-3 py-2 rounded-xl border border-warmborder" />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setShowNewProjModal(false)} className="px-4 py-2 rounded-xl bg-sandstone">Batal</button>
                <button type="submit" className="px-4 py-2 rounded-xl bg-terracotta text-white font-bold">Simpan Proyek</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast */}
      {toastMessage && (
        <div className="px-6 py-2.5 bg-espresso text-white text-xs font-medium flex items-center justify-between rounded-xl shadow-lg">
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="text-amber-400 font-bold hover:underline">Tutup</button>
        </div>
      )}
    </div>
  );
};
