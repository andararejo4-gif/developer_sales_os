import React, { useState } from 'react';
import {
  MapPin,
  Plus,
  Trash2,
  ExternalLink,
  Copy,
  CheckCircle2,
  X,
  Compass,
} from 'lucide-react';
import {
  type CompanyProject,
  type ProjectGpsLocation,
  getProjectCoordinates,
  saveProjectCoordinates,
} from '../../lib/projects/projects-data';

interface ManageClusterCoordsModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: CompanyProject;
  onCoordinatesUpdated: (updatedList: ProjectGpsLocation[]) => void;
}

export const ManageClusterCoordsModal: React.FC<ManageClusterCoordsModalProps> = ({
  isOpen,
  onClose,
  project,
  onCoordinatesUpdated,
}) => {
  const [coordsList, setCoordsList] = useState<ProjectGpsLocation[]>(() =>
    getProjectCoordinates(project)
  );

  // Form input baru
  const [namaCluster, setNamaCluster] = useState('');
  const [koordinat, setKoordinat] = useState('');
  const [keterangan, setKeterangan] = useState('');
  const [isPrimary, setIsPrimary] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopyCoord = (loc: ProjectGpsLocation) => {
    navigator.clipboard.writeText(loc.koordinat);
    setCopiedId(loc.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleAddLocation = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const trimmedName = namaCluster.trim();
    const trimmedCoord = koordinat.trim();

    if (!trimmedName || !trimmedCoord) {
      setErrorMsg('Nama cluster dan titik koordinat wajib diisi.');
      return;
    }

    const parts = trimmedCoord.split(',').map((p) => parseFloat(p.trim()));
    if (parts.length < 2 || isNaN(parts[0]) || isNaN(parts[1])) {
      setErrorMsg('Format koordinat tidak valid. Gunakan format "Lat, Lng" (contoh: -7.674150, 110.844320).');
      return;
    }

    const newLoc: ProjectGpsLocation = {
      id: `loc-${Date.now()}`,
      namaCluster: trimmedName,
      koordinat: `${parts[0].toFixed(6)}, ${parts[1].toFixed(6)}`,
      keterangan: keterangan.trim() || undefined,
      isPrimary: isPrimary || coordsList.length === 0,
    };

    let updated = [...coordsList];
    if (newLoc.isPrimary) {
      updated = updated.map((l) => ({ ...l, isPrimary: false }));
    }
    updated.push(newLoc);

    setCoordsList(updated);
    saveProjectCoordinates(project.id, updated);
    onCoordinatesUpdated(updated);

    // Reset form
    setNamaCluster('');
    setKoordinat('');
    setKeterangan('');
    setIsPrimary(false);
  };

  const handleDeleteLocation = (locId: string) => {
    if (coordsList.length <= 1) {
      setErrorMsg('Proyek harus memiliki minimal 1 titik koordinat acuan.');
      return;
    }

    const updated = coordsList.filter((l) => l.id !== locId);
    if (!updated.some((l) => l.isPrimary) && updated.length > 0) {
      updated[0].isPrimary = true;
    }

    setCoordsList(updated);
    saveProjectCoordinates(project.id, updated);
    onCoordinatesUpdated(updated);
  };

  const handleSetPrimary = (locId: string) => {
    const updated = coordsList.map((l) => ({
      ...l,
      isPrimary: l.id === locId,
    }));

    setCoordsList(updated);
    saveProjectCoordinates(project.id, updated);
    onCoordinatesUpdated(updated);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-espresso/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-white border border-warmborder rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header Modal */}
        <div className="p-5 border-b border-warmborder bg-sandstone/40 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="size-9 rounded-xl bg-terracotta text-white flex items-center justify-center shadow-xs">
              <Compass className="size-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-espresso">
                Multi-Titik Koordinat Cluster ({project.nama})
              </h2>
              <p className="text-[11px] text-warmmuted">
                1 proyek dengan multi cluster/tahap: atur koordinat spesifik per cluster, gerbang, atau marketing gallery
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="size-8 rounded-xl hover:bg-sandstone text-warmmuted hover:text-espresso flex items-center justify-center cursor-pointer"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="p-6 space-y-5 overflow-y-auto text-xs">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-semibold">
              {errorMsg}
            </div>
          )}

          {/* Form Tambah Titik Cluster Baru */}
          <form onSubmit={handleAddLocation} className="p-4 rounded-2xl bg-sandstone/40 border border-warmborder space-y-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-terracotta block">
              + Tambah Titik Koordinat Cluster Baru
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-espresso block mb-1">
                  Nama Cluster / Gerbang / Tahap *
                </label>
                <input
                  type="text"
                  required
                  value={namaCluster}
                  onChange={(e) => setNamaCluster(e.target.value)}
                  placeholder="Contoh: Cluster Tokyo (Tahap 2)"
                  className="w-full h-9 px-3 rounded-xl border border-warmborder bg-white text-espresso font-medium focus:border-terracotta focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-espresso block mb-1">
                  Koordinat GPS (Lat, Lng) *
                </label>
                <div className="relative">
                  <MapPin className="size-3.5 text-warmmuted absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={koordinat}
                    onChange={(e) => setKoordinat(e.target.value)}
                    placeholder="-7.674150, 110.844320"
                    className="w-full h-9 pl-9 pr-3 rounded-xl border border-warmborder bg-white text-espresso font-mono text-[11px] focus:border-terracotta focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              <div className="sm:col-span-8">
                <label className="font-bold text-espresso block mb-1">
                  Keterangan Titik (Opsional)
                </label>
                <input
                  type="text"
                  value={keterangan}
                  onChange={(e) => setKeterangan(e.target.value)}
                  placeholder="Contoh: Zona 15 unit baru, taman bermain & jalan utama"
                  className="w-full h-9 px-3 rounded-xl border border-warmborder bg-white text-espresso text-[11px] focus:border-terracotta focus:outline-none"
                />
              </div>

              <div className="sm:col-span-4 flex items-end">
                <button
                  type="submit"
                  className="w-full h-9 rounded-xl bg-terracotta hover:bg-terracotta/90 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                >
                  <Plus className="size-3.5" />
                  <span>Tambahkan Titik</span>
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="isPrimaryCoord"
                checked={isPrimary}
                onChange={(e) => setIsPrimary(e.target.checked)}
                className="size-4 rounded text-terracotta border-warmborder focus:ring-terracotta cursor-pointer"
              />
              <label htmlFor="isPrimaryCoord" className="text-espresso font-medium cursor-pointer">
                Jadikan titik koordinat utama proyek (acuan radius riset &amp; marketing)
              </label>
            </div>
          </form>

          {/* Daftar Titik Cluster yang Terdaftar */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-espresso text-xs flex items-center gap-1.5">
                <MapPin className="size-4 text-terracotta" />
                <span>Titik Koordinat Terdaftar di Proyek Ini ({coordsList.length} Titik)</span>
              </span>
              <span className="text-[10px] text-warmmuted">
                Klik 'Buka di Maps' untuk verifikasi lokasi
              </span>
            </div>

            <div className="space-y-2">
              {coordsList.map((loc, idx) => {
                const mapsUrl = `https://www.google.com/maps?q=${encodeURIComponent(loc.koordinat)}`;
                return (
                  <div
                    key={loc.id}
                    className={`p-3.5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      loc.isPrimary
                        ? 'bg-amber-50/60 border-amber-300 ring-1 ring-amber-400/40'
                        : 'bg-white border-warmborder hover:bg-sandstone/30'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="size-5 rounded-full bg-espresso text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <h4 className="font-bold text-espresso text-sm">{loc.namaCluster}</h4>
                        {loc.isPrimary && (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-terracotta text-white uppercase tracking-wider">
                            Titik Utama
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 font-mono text-[11px] text-warmmuted pl-7">
                        <span>{loc.koordinat}</span>
                        {loc.keterangan && (
                          <>
                            <span>&middot;</span>
                            <span className="font-sans text-[11px] text-espresso italic">{loc.keterangan}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 pl-7 sm:pl-0 shrink-0">
                      {!loc.isPrimary && (
                        <button
                          type="button"
                          onClick={() => handleSetPrimary(loc.id)}
                          className="px-2.5 py-1 rounded-lg border border-warmborder hover:bg-sandstone text-espresso text-[10px] font-bold cursor-pointer"
                        >
                          Set Utama
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleCopyCoord(loc)}
                        className="p-1.5 rounded-lg border border-warmborder hover:bg-sandstone text-warmmuted hover:text-espresso cursor-pointer transition-colors"
                        title="Salin Koordinat"
                      >
                        {copiedId === loc.id ? (
                          <CheckCircle2 className="size-3.5 text-olive" />
                        ) : (
                          <Copy className="size-3.5" />
                        )}
                      </button>

                      <a
                        href={mapsUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1.5 rounded-lg bg-sandstone hover:bg-warmborder text-espresso font-bold text-[10px] flex items-center gap-1 transition-colors"
                        title="Buka di Google Maps"
                      >
                        <ExternalLink className="size-3 text-terracotta" />
                        <span>Maps</span>
                      </a>

                      {coordsList.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleDeleteLocation(loc.id)}
                          className="p-1.5 rounded-lg hover:bg-rose-50 text-warmmuted hover:text-rose-700 cursor-pointer transition-colors"
                          title="Hapus Titik"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-warmborder bg-sandstone/30 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-espresso hover:bg-espresso/90 text-white font-bold text-xs cursor-pointer shadow-sm"
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
};
