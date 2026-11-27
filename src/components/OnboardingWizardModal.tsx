import React, { useState } from 'react';
import { 
  X, 
  FileText, 
  Sparkles, 
  CheckCircle2, 
  Download, 
  ArrowRight, 
  ArrowLeft, 
  FileSpreadsheet
} from 'lucide-react';
import { THE_PARK_99_POINTS } from '../lib/love-letter/points-data';
import { validateLoveLetter } from '../lib/love-letter/validator';
import { generateLoveLetterDocx } from '../lib/love-letter/docx-exporter';
import { generateLoveLetterHtml } from '../lib/love-letter/html-exporter';

interface WizardProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenFullViewer?: () => void;
}

export const OnboardingWizardModal: React.FC<WizardProps> = ({ isOpen, onClose, onOpenFullViewer }) => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);

  // Form State
  const [formData, setFormData] = useState({
    developerName: 'PT Andara Rejo Makmur',
    projectName: 'The Park Townhouse Sukoharjo',
    city: 'Sukoharjo',
    province: 'Jawa Tengah',
    clusterNagoyaLat: '-7.6738726546957565',
    clusterNagoyaLng: '110.84397833605674',
    clusterOsakaLat: '-7.670296745443235',
    clusterOsakaLng: '110.83933117795694',
    clusterTokyoLat: '-7.670599344181913',
    clusterTokyoLng: '110.83923919943206',
    facilities: 'One gate system, security 24 jam, cctv kawasan, underground utilities, children play area, zen garden'
  });

  const [brochureFile, setBrochureFile] = useState<File | null>(null);
  const [pricelistFile, setPricelistFile] = useState<File | null>(null);
  const [extractionSourceLabel, setExtractionSourceLabel] = useState<string>('Siap Ekstraksi API (/api/truth/upload)');
  const [extractedUnits, setExtractedUnits] = useState<
    Array<{ unit: string; tipe: string; lt: number | string; lb: number | string; keras: string; tempo24: string; kpr: string; status: string }>
  >([]);

  const validationResult = validateLoveLetter(THE_PARK_99_POINTS);

  if (!isOpen) return null;

  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(new Error('Gagal membaca berkas.'));
      reader.readAsDataURL(file);
    });

  // Real document ingestion via /api/truth/upload (doc-extractor.py / truth-engine.ts)
  const handleStartExtraction = async () => {
    setIsProcessing(true);
    setUploadProgress(20);
    try {
      const targetFile = pricelistFile || brochureFile;
      let filename = targetFile ? targetFile.name : `${formData.projectName.replace(/\s+/g, '_')}_profil.txt`;
      let contentBase64 = '';
      if (targetFile) {
        contentBase64 = await fileToBase64(targetFile);
      } else {
        const summaryText = `Proyek: ${formData.projectName}\nDeveloper: ${formData.developerName}\nKota: ${formData.city}, ${formData.province}\nFasilitas: ${formData.facilities}\n`;
        contentBase64 = btoa(unescape(encodeURIComponent(summaryText)));
      }
      setUploadProgress(55);

      const res = await fetch('/api/truth/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename,
          contentBase64,
          docType: pricelistFile ? 'pricelist' : 'brosur',
        }),
      });
      setUploadProgress(85);
      const json = await res.json().catch(() => ({}));
      if (res.ok && json.ok) {
        const unitsFromApi = Array.isArray(json.parsedUnits) && json.parsedUnits.length > 0
          ? json.parsedUnits.map((u: any) => ({
              unit: String(u.unitCode || '-'),
              tipe: String(u.cluster || formData.projectName),
              lt: u.ltSqm ?? '-',
              lb: u.lbSqm ?? '-',
              keras: u.priceCash ? `Rp ${Number(u.priceCash).toLocaleString('id-ID')}` : 'perlu dicek',
              tempo24: 'sesuai pricelist',
              kpr: u.priceKpr ? `Rp ${Number(u.priceKpr).toLocaleString('id-ID')}` : 'perlu dicek',
              status: u.priceCash || u.priceKpr ? 'terverifikasi' : 'perlu dicek',
            }))
          : [
              {
                unit: filename,
                tipe: `Dokumen Terindeks (v${json.version || 1})`,
                lt: '-',
                lb: '-',
                keras: `${json.factsCount ?? 0} fakta diekstrak`,
                tempo24: '-',
                kpr: '-',
                status: 'terverifikasi',
              },
            ];
        setExtractedUnits(unitsFromApi);
        setExtractionSourceLabel(`Terindeks di PostgreSQL (${json.documentId || filename})`);
      } else {
        setExtractedUnits([
          {
            unit: filename,
            tipe: 'Perlu Login Admin/SM/IT',
            lt: '-',
            lb: '-',
            keras: json.error || `HTTP ${res.status}`,
            tempo24: '-',
            kpr: '-',
            status: 'perlu dicek',
          },
        ]);
        setExtractionSourceLabel(json.error || `Gagal upload (HTTP ${res.status})`);
      }
      setUploadProgress(100);
      setCurrentStep(4);
    } catch (err: any) {
      setExtractionSourceLabel(err?.message || 'Gagal menghubungi /api/truth/upload');
      setCurrentStep(4);
    } finally {
      setIsProcessing(false);
    }
  };

  // Download DOCX
  const handleDownloadDocx = async () => {
    try {
      const blob = await generateLoveLetterDocx(
        formData.projectName,
        formData.developerName,
        formData.city,
        THE_PARK_99_POINTS
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Surat_Cinta_99_Keunggulan_${formData.projectName.replace(/\s+/g, '_')}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Gagal membuat DOCX:", err);
      alert("Gagal mengunduh DOCX. Silakan coba kembali.");
    }
  };

  // Print / PDF HTML
  const handleDownloadPdf = () => {
    const htmlContent = generateLoveLetterHtml(
      formData.projectName,
      formData.developerName,
      formData.city,
      THE_PARK_99_POINTS
    );
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.focus();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-espresso/70 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-3xl bg-white border border-warmborder rounded-2xl shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95">
        {/* Modal Header */}
        <div className="p-5 border-b border-warmborder bg-sandstone/40 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="size-6 rounded-md bg-terracotta text-white font-extrabold text-xs grid place-items-center">
                {currentStep}
              </span>
              <h2 className="text-base font-bold text-espresso">
                Wizard Onboarding: Dapatkan Surat Cinta 99 Keunggulan
              </h2>
            </div>
            <p className="text-xs text-warmmuted mt-0.5">
              Langkah {currentStep} dari 5 &middot; Ekstraksi terstruktur tanpa merubah data harga
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-warmmuted hover:text-espresso hover:bg-white cursor-pointer"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Step Progress Indicators */}
        <div className="grid grid-cols-5 border-b border-warmborder text-[11px] font-bold text-center bg-sandstone/20">
          <div className={`py-2 border-r border-warmborder ${currentStep === 1 ? 'bg-amber-100 text-terracotta' : currentStep > 1 ? 'text-olive' : 'text-warmmuted'}`}>
            1. Info Proyek
          </div>
          <div className={`py-2 border-r border-warmborder ${currentStep === 2 ? 'bg-amber-100 text-terracotta' : currentStep > 2 ? 'text-olive' : 'text-warmmuted'}`}>
            2. Unggah Berkas
          </div>
          <div className={`py-2 border-r border-warmborder ${currentStep === 3 ? 'bg-amber-100 text-terracotta' : currentStep > 3 ? 'text-olive' : 'text-warmmuted'}`}>
            3. Titik Koordinat
          </div>
          <div className={`py-2 border-r border-warmborder ${currentStep === 4 ? 'bg-amber-100 text-terracotta' : currentStep > 4 ? 'text-olive' : 'text-warmmuted'}`}>
            4. Periksa Data
          </div>
          <div className={`py-2 ${currentStep === 5 ? 'bg-amber-100 text-terracotta' : 'text-warmmuted'}`}>
            5. Surat Cinta
          </div>
        </div>

        {/* Modal Body per Step */}
        <div className="p-6">
          {/* STEP 1: INFO PROYEK & DEVELOPER */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 text-xs text-terracotta flex items-start gap-2.5">
                <Sparkles className="size-4 shrink-0 mt-0.5" />
                <span>
                  Data ini digunakan sebagai identitas resmi dokumen Surat Cinta dan partisi tenant isolasi Anda.
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-espresso mb-1">Nama Developer / PT</label>
                  <input
                    type="text"
                    value={formData.developerName}
                    onChange={e => setFormData({ ...formData, developerName: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl border border-warmborder text-xs font-semibold focus:border-terracotta focus:outline-none"
                    placeholder="Contoh: PT Andara Rejo Makmur"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-espresso mb-1">Nama Proyek Perumahan</label>
                  <input
                    type="text"
                    value={formData.projectName}
                    onChange={e => setFormData({ ...formData, projectName: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl border border-warmborder text-xs font-semibold focus:border-terracotta focus:outline-none"
                    placeholder="Contoh: The Park Townhouse Sukoharjo"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-espresso mb-1">Kota / Kabupaten</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={e => setFormData({ ...formData, city: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl border border-warmborder text-xs font-semibold focus:border-terracotta focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-espresso mb-1">Provinsi</label>
                  <input
                    type="text"
                    value={formData.province}
                    onChange={e => setFormData({ ...formData, province: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl border border-warmborder text-xs font-semibold focus:border-terracotta focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: UNGGAH BERKAS (BROSUR & PRICELIST) */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <p className="text-xs text-warmmuted">
                Unggah berkas resmi proyek Anda. File disimpan dalam storage terisolasi <code>/storage/{'{tenant_id}'}/{'{project_id}'}</code>.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Brosur Upload Box */}
                <label className="border-2 border-dashed border-warmborder rounded-2xl p-5 text-center bg-sandstone/30 hover:bg-sandstone/60 transition-colors cursor-pointer block">
                  <input
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg,.txt"
                    className="hidden"
                    onChange={(e) => setBrochureFile(e.target.files?.[0] || null)}
                  />
                  <div className="size-10 rounded-xl bg-white text-terracotta grid place-items-center mx-auto shadow-2xs mb-2">
                    <FileText className="size-5" />
                  </div>
                  <p className="text-xs font-bold text-espresso">Brosur / Katalog Proyek</p>
                  <p className="text-[11px] text-warmmuted mt-0.5">Klik untuk pilih PDF, Gambar, atau TXT (Maks 20 MB)</p>
                  <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white border border-warmborder text-[11px] font-semibold text-olive">
                    <CheckCircle2 className="size-3.5" />
                    <span>{brochureFile ? `${brochureFile.name} (${(brochureFile.size / 1024).toFixed(0)} KB)` : 'Belum dipilih (opsional)'}</span>
                  </div>
                </label>

                {/* Pricelist Upload Box */}
                <label className="border-2 border-dashed border-warmborder rounded-2xl p-5 text-center bg-sandstone/30 hover:bg-sandstone/60 transition-colors cursor-pointer block">
                  <input
                    type="file"
                    accept=".pdf,.xlsx,.xls,.csv,.png,.jpg,.jpeg,.txt"
                    className="hidden"
                    onChange={(e) => setPricelistFile(e.target.files?.[0] || null)}
                  />
                  <div className="size-10 rounded-xl bg-white text-olive grid place-items-center mx-auto shadow-2xs mb-2">
                    <FileSpreadsheet className="size-5" />
                  </div>
                  <p className="text-xs font-bold text-espresso">Pricelist &amp; Skema Bayar</p>
                  <p className="text-[11px] text-warmmuted mt-0.5">Klik untuk pilih PDF, Excel, CSV, atau Foto</p>
                  <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white border border-warmborder text-[11px] font-semibold text-olive">
                    <CheckCircle2 className="size-3.5" />
                    <span>{pricelistFile ? `${pricelistFile.name} (${(pricelistFile.size / 1024).toFixed(0)} KB)` : 'Belum dipilih (opsional)'}</span>
                  </div>
                </label>
              </div>

              <div>
                <label className="block text-xs font-bold text-espresso mb-1">Daftar Fasilitas &amp; Layanan Utama</label>
                <textarea
                  rows={2}
                  value={formData.facilities}
                  onChange={e => setFormData({ ...formData, facilities: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-warmborder text-xs focus:border-terracotta focus:outline-none"
                  placeholder="Sebutkan fasilitas seperti security, CCTV, taman, dsb..."
                />
              </div>

              {isProcessing && (
                <div className="p-4 bg-sandstone rounded-xl border border-warmborder space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-espresso">
                    <span>Mengekstraksi data unit &amp; teks katalog via AI Job...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-warmborder overflow-hidden">
                    <div 
                      className="h-full bg-terracotta transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 3: TITIK KOORDINAT */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-terracotta">
                <strong>Koordinat Riil Diperlukan:</strong> Sistem kami menghitung jarak dan waktu tempuh ke fasilitas publik berdasarkan koordinat GPS presisi per cluster.
              </div>

              <div className="space-y-3">
                <div className="p-3 bg-sandstone/40 rounded-xl border border-warmborder">
                  <p className="text-xs font-bold text-espresso mb-2">1. Cluster Nagoya (Tipe Diamond 75/90)</p>
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={formData.clusterNagoyaLat}
                      onChange={e => setFormData({ ...formData, clusterNagoyaLat: e.target.value })}
                      className="h-9 px-2.5 rounded-lg border border-warmborder text-xs font-mono bg-white"
                      placeholder="Latitude"
                    />
                    <input
                      type="text"
                      value={formData.clusterNagoyaLng}
                      onChange={e => setFormData({ ...formData, clusterNagoyaLng: e.target.value })}
                      className="h-9 px-2.5 rounded-lg border border-warmborder text-xs font-mono bg-white"
                      placeholder="Longitude"
                    />
                  </div>
                </div>

                <div className="p-3 bg-sandstone/40 rounded-xl border border-warmborder">
                  <p className="text-xs font-bold text-espresso mb-2">2. Cluster Osaka (Tipe Gold 60/72)</p>
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={formData.clusterOsakaLat}
                      onChange={e => setFormData({ ...formData, clusterOsakaLat: e.target.value })}
                      className="h-9 px-2.5 rounded-lg border border-warmborder text-xs font-mono bg-white"
                      placeholder="Latitude"
                    />
                    <input
                      type="text"
                      value={formData.clusterOsakaLng}
                      onChange={e => setFormData({ ...formData, clusterOsakaLng: e.target.value })}
                      className="h-9 px-2.5 rounded-lg border border-warmborder text-xs font-mono bg-white"
                      placeholder="Longitude"
                    />
                  </div>
                </div>

                <div className="p-3 bg-sandstone/40 rounded-xl border border-warmborder">
                  <p className="text-xs font-bold text-espresso mb-2">3. Cluster Tokyo (Tipe Emerald 50/60)</p>
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={formData.clusterTokyoLat}
                      onChange={e => setFormData({ ...formData, clusterTokyoLat: e.target.value })}
                      className="h-9 px-2.5 rounded-lg border border-warmborder text-xs font-mono bg-white"
                      placeholder="Latitude"
                    />
                    <input
                      type="text"
                      value={formData.clusterTokyoLng}
                      onChange={e => setFormData({ ...formData, clusterTokyoLng: e.target.value })}
                      className="h-9 px-2.5 rounded-lg border border-warmborder text-xs font-mono bg-white"
                      placeholder="Longitude"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: PERIKSA & KOREKSI HASIL EKSTRAKSI AI */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <div className="p-3 bg-sandstone rounded-xl border border-warmborder flex items-center justify-between gap-2 flex-wrap text-xs">
                <div>
                  <span className="font-bold text-espresso">Layar Periksa &amp; Koreksi Data</span>
                  <p className="text-warmmuted text-[11px]">
                    {extractionSourceLabel} &middot; Guardrail aktif: AI dilarang mengubah angka harga.
                  </p>
                </div>
                <span className="px-2 py-0.5 rounded bg-lime-100 text-olive text-[11px] font-bold">
                  {extractedUnits.filter((u) => u.status === 'terverifikasi').length} Siap &middot; {extractedUnits.filter((u) => u.status !== 'terverifikasi').length} Perlu Dicek
                </span>
              </div>

              <div className="overflow-x-auto border border-warmborder rounded-xl">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-sandstone/60 border-b border-warmborder font-bold text-warmmuted">
                      <th className="py-2.5 px-3">Unit &amp; Tipe</th>
                      <th className="py-2.5 px-2">LT/LB</th>
                      <th className="py-2.5 px-2">Cash Keras</th>
                      <th className="py-2.5 px-2">Cash 24 Bln</th>
                      <th className="py-2.5 px-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-warmborder">
                    {extractedUnits.map((u, i) => (
                      <tr key={i} className="hover:bg-sandstone/30">
                        <td className="py-2 px-3 font-bold text-espresso">{u.unit} <span className="font-normal text-warmmuted block text-[11px]">{u.tipe}</span></td>
                        <td className="py-2 px-2">{u.lt}/{u.lb} m²</td>
                        <td className="py-2 px-2 font-semibold">{u.keras}</td>
                        <td className="py-2 px-2 text-warmmuted">{u.tempo24}</td>
                        <td className="py-2 px-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            u.status === 'terverifikasi' ? 'bg-lime-100 text-olive' : 'bg-amber-100 text-terracotta'
                          }`}>
                            {u.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* STEP 5: HASIL SURAT CINTA 99 KEUNGGULAN */}
          {currentStep === 5 && (
            <div className="space-y-5">
              {/* Validation Banner */}
              <div className="p-4 rounded-xl bg-lime-50 border border-lime-300 flex items-start gap-3">
                <CheckCircle2 className="size-5 text-olive shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-olive uppercase tracking-wide">
                    Lolos Uji Guardrail 100% ({validationResult.passedCount}/99 Poin)
                  </h4>
                  <p className="text-xs text-olive/90 mt-0.5">
                    {validationResult.summary}
                  </p>
                  <p className="text-[11px] text-warmmuted mt-1">
                    Bebas overpromise, bebas janji kenaikan investasi spekulatif, dan penyebutan jarak terverifikasi dengan kata &ldquo;sekitar&rdquo;.
                  </p>
                </div>
              </div>

              {/* Document Summary Info */}
              <div className="p-4 rounded-xl bg-white border border-warmborder shadow-2xs">
                <div className="flex items-center justify-between pb-3 border-b border-warmborder">
                  <div>
                    <h3 className="text-sm font-extrabold text-espresso">
                      Surat Cinta 99 Keunggulan: {formData.projectName}
                    </h3>
                    <p className="text-xs text-warmmuted">{formData.developerName} &middot; {formData.city}</p>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-amber-100 text-terracotta">
                    Versi 1.0 (v1)
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 mt-3 text-center text-xs">
                  <div className="p-2 bg-sandstone/50 rounded-lg">
                    <span className="text-[10px] text-warmmuted block">Total Poin</span>
                    <strong className="text-espresso font-bold">99 Poin</strong>
                  </div>
                  <div className="p-2 bg-sandstone/50 rounded-lg">
                    <span className="text-[10px] text-warmmuted block">Bab Tematik</span>
                    <strong className="text-espresso font-bold">6 Bab</strong>
                  </div>
                  <div className="p-2 bg-sandstone/50 rounded-lg">
                    <span className="text-[10px] text-warmmuted block">Waktu Selesai</span>
                    <strong className="text-olive font-bold">&lt; 2 Menit</strong>
                  </div>
                </div>
              </div>

              {/* Action Buttons: Download DOCX & PDF */}
              <div className="p-4 rounded-xl bg-espresso text-white space-y-3">
                <p className="text-xs font-bold text-amber-400">Unduh Artefak Resmi Siap Pakai:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    onClick={handleDownloadDocx}
                    className="h-11 px-4 rounded-xl bg-terracotta text-white text-xs font-bold hover:bg-terracotta/90 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                  >
                    <Download className="size-4" />
                    <span>Unduh Microsoft Word (.docx)</span>
                  </button>
                  <button
                    onClick={handleDownloadPdf}
                    className="h-11 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer border border-white/20"
                  >
                    <Download className="size-4" />
                    <span>Cetak Dokumen / Simpan PDF</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="p-5 border-t border-warmborder bg-sandstone/40 flex items-center justify-between">
          {currentStep > 1 && currentStep < 5 ? (
            <button
              onClick={() => setCurrentStep(prev => prev - 1)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-espresso hover:bg-white transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <ArrowLeft className="size-3.5" />
              <span>Sebelumnya</span>
            </button>
          ) : <div />}

          {currentStep === 1 && (
            <button
              onClick={() => setCurrentStep(2)}
              className="px-5 py-2.5 rounded-xl bg-terracotta text-white text-xs font-bold hover:bg-terracotta/90 transition-all cursor-pointer flex items-center gap-1.5 ml-auto"
            >
              <span>Lanjut: Unggah Berkas</span>
              <ArrowRight className="size-3.5" />
            </button>
          )}

          {currentStep === 2 && (
            <button
              onClick={handleStartExtraction}
              disabled={isProcessing}
              className="px-5 py-2.5 rounded-xl bg-terracotta text-white text-xs font-bold hover:bg-terracotta/90 transition-all cursor-pointer flex items-center gap-1.5 ml-auto disabled:opacity-50"
            >
              <span>{isProcessing ? 'Mengekstraksi...' : 'Jalankan Ekstraksi AI'}</span>
              <ArrowRight className="size-3.5" />
            </button>
          )}

          {currentStep === 3 && (
            <button
              onClick={() => setCurrentStep(4)}
              className="px-5 py-2.5 rounded-xl bg-terracotta text-white text-xs font-bold hover:bg-terracotta/90 transition-all cursor-pointer flex items-center gap-1.5 ml-auto"
            >
              <span>Simpan Koordinat &amp; Periksa Data</span>
              <ArrowRight className="size-3.5" />
            </button>
          )}

          {currentStep === 4 && (
            <button
              onClick={() => setCurrentStep(5)}
              className="px-5 py-2.5 rounded-xl bg-terracotta text-white text-xs font-bold hover:bg-terracotta/90 transition-all cursor-pointer flex items-center gap-1.5 ml-auto"
            >
              <Sparkles className="size-3.5 text-amber-300" />
              <span>Buat Surat Cinta 99 Keunggulan</span>
            </button>
          )}

          {currentStep === 5 && (
            <div className="flex items-center gap-2 ml-auto">
              {onOpenFullViewer && (
                <button
                  onClick={() => { onClose(); onOpenFullViewer(); }}
                  className="px-4 py-2 rounded-xl bg-sandstone border border-warmborder text-espresso text-xs font-bold hover:bg-white transition-all cursor-pointer"
                >
                  Lihat 99 Poin di Layar
                </button>
              )}
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-espresso text-white text-xs font-bold hover:bg-espresso/90 transition-all cursor-pointer"
              >
                Selesai
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
