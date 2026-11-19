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

  // Mock Extracted Units for Review & Correction Screen
  const [extractedUnits] = useState([
    { unit: 'A.01', tipe: 'Diamond (Nagoya)', lt: 90, lb: 75, keras: 'Rp 850.000.000', tempo24: 'Rp 950.000.000', kpr: 'Rp 900.000.000', status: 'terverifikasi' },
    { unit: 'A.02', tipe: 'Diamond (Nagoya)', lt: 90, lb: 75, keras: 'Rp 830.000.000', tempo24: 'Rp 930.000.000', kpr: 'Rp 880.000.000', status: 'terverifikasi' },
    { unit: 'B.01', tipe: 'Gold (Osaka)', lt: 72, lb: 60, keras: 'Rp 680.000.000', tempo24: 'Rp 760.000.000', kpr: 'Rp 720.000.000', status: 'terverifikasi' },
    { unit: 'B.02', tipe: 'Gold (Osaka)', lt: 72, lb: 60, keras: 'Rp 670.000.000', tempo24: 'Rp 750.000.000', kpr: 'Rp 710.000.000', status: 'terverifikasi' },
    { unit: 'C.01', tipe: 'Emerald (Tokyo)', lt: 60, lb: 50, keras: 'Rp 580.000.000', tempo24: 'Rp 650.000.000', kpr: 'Rp 620.000.000', status: 'terverifikasi' },
    { unit: 'C.02', tipe: 'Emerald (Tokyo)', lt: 60, lb: 50, keras: 'Rp 580.000.000', tempo24: 'Rp 650.000.000', kpr: 'Rp 620.000.000', status: 'terverifikasi' },
    { unit: 'C.10 (Hook)', tipe: 'Emerald Plus', lt: 78, lb: 50, keras: 'perlu dicek', tempo24: 'perlu dicek', kpr: 'perlu dicek', status: 'perlu dicek' },
  ]);

  const validationResult = validateLoveLetter(THE_PARK_99_POINTS);

  if (!isOpen) return null;

  // Simulate AI extraction job
  const handleStartExtraction = () => {
    setIsProcessing(true);
    setUploadProgress(15);
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 95) {
          clearInterval(interval);
          setIsProcessing(false);
          setCurrentStep(4); // Move to Review & Correction screen
          return 100;
        }
        return prev + 25;
      });
    }, 250);
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
                <div className="border-2 border-dashed border-warmborder rounded-2xl p-5 text-center bg-sandstone/30 hover:bg-sandstone/60 transition-colors">
                  <div className="size-10 rounded-xl bg-white text-terracotta grid place-items-center mx-auto shadow-2xs mb-2">
                    <FileText className="size-5" />
                  </div>
                  <p className="text-xs font-bold text-espresso">Brosur / Katalog Proyek</p>
                  <p className="text-[11px] text-warmmuted mt-0.5">Format: PDF atau Gambar (Maks 25 MB)</p>
                  <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white border border-warmborder text-[11px] font-semibold text-olive">
                    <CheckCircle2 className="size-3.5" />
                    <span>the_park_katalog_v2.pdf (14.2 MB)</span>
                  </div>
                </div>

                {/* Pricelist Upload Box */}
                <div className="border-2 border-dashed border-warmborder rounded-2xl p-5 text-center bg-sandstone/30 hover:bg-sandstone/60 transition-colors">
                  <div className="size-10 rounded-xl bg-white text-olive grid place-items-center mx-auto shadow-2xs mb-2">
                    <FileSpreadsheet className="size-5" />
                  </div>
                  <p className="text-xs font-bold text-espresso">Pricelist &amp; Skema Bayar</p>
                  <p className="text-[11px] text-warmmuted mt-0.5">Format: PDF, Excel, atau Foto Pricelist</p>
                  <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white border border-warmborder text-[11px] font-semibold text-olive">
                    <CheckCircle2 className="size-3.5" />
                    <span>pricelist_the_park_sukoharjo.xlsx (1.8 MB)</span>
                  </div>
                </div>
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
              <div className="p-3 bg-sandstone rounded-xl border border-warmborder flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-espresso">Layar Periksa &amp; Koreksi Data</span>
                  <p className="text-warmmuted text-[11px]">
                    Aturan Guardrail: AI dilarang mengubah angka harga. Data yang tidak terbaca ditandai &ldquo;perlu dicek&rdquo;.
                  </p>
                </div>
                <span className="px-2 py-0.5 rounded bg-lime-100 text-olive text-[11px] font-bold">
                  6 Unit Siap &middot; 1 Perlu Dicek
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
