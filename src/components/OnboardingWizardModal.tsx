import React, { useState } from 'react';
import {
  X,
  FileText,
  Sparkles,
  CheckCircle2,
  Download,
  ArrowRight,
  ArrowLeft,
  FileSpreadsheet,
  CreditCard,
  ShieldCheck,
  Plus,
  Trash2,
} from 'lucide-react';
import type { LoveLetterPoint } from '../lib/love-letter/points-data';
import { validateLoveLetter } from '../lib/love-letter/validator';
import { generateLoveLetterDocx } from '../lib/love-letter/docx-exporter';
import { generateLoveLetterHtml } from '../lib/love-letter/html-exporter';
import { loginWithServer } from '../lib/auth/dummy-accounts';

interface WizardProps {
  isOpen: boolean;
  selectedPlan?: 'gold' | 'platinum' | 'diamond';
  onClose: () => void;
  onOpenFullViewer?: () => void;
  onEnterDashboard?: (role?: string) => void;
}

interface ExtractedUnitRow {
  unit: string;
  tipe: string;
  lt: number;
  lb: number;
  keras: number | null;
  tempo24: number | null;
  kpr: number | null;
  status: 'terverifikasi' | 'perlu dicek';
}

const PLAN_PRICING_LABEL: Record<'gold' | 'platinum' | 'diamond', { name: string; price: string; aic: string }> = {
  gold: { name: 'Gold', price: 'Rp 4.900.000 / 3 bln', aic: '2.500 AIC' },
  platinum: { name: 'Platinum', price: 'Rp 9.900.000 / 3 bln', aic: '5.000 AIC' },
  diamond: { name: 'Diamond', price: 'Rp 19.900.000 / 3 bln', aic: '12.000 AIC' },
};

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Gagal membaca file'));
    reader.readAsDataURL(file);
  });
}

export const OnboardingWizardModal: React.FC<WizardProps> = ({
  isOpen,
  selectedPlan = 'platinum',
  onClose,
  onOpenFullViewer,
  onEnterDashboard,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [brosurFile, setBrosurFile] = useState<File | null>(null);
  const [pricelistFile, setPricelistFile] = useState<File | null>(null);
  const [onboardingSessionId, setOnboardingSessionId] = useState<string | null>(null);
  const [ocrPreview, setOcrPreview] = useState<string>('');
  const [activationResult, setActivationResult] = useState<{
    tenantId: string;
    slug: string;
    invoiceNo: string;
    initialAic: number;
  } | null>(null);

  const [formData, setFormData] = useState({
    developerName: 'PT Andara Rejo Makmur',
    projectName: 'The Park Townhouse Sukoharjo',
    city: 'Sukoharjo',
    province: 'Jawa Tengah',
    ownerName: 'Admin IT Tim',
    ownerEmail: '',
    ownerPassword: '',
    facilities: 'One gate system, security 24 jam, cctv kawasan, underground utilities, children play area, zen garden',
  });

  const [clusters, setClusters] = useState<Array<{ name: string; lat: string; lng: string }>>([
    { name: 'Cluster Utama / Nagoya', lat: '-7.6738726546957565', lng: '110.84397833605674' },
    { name: 'Cluster Osaka', lat: '-7.670296745443235', lng: '110.83933117795694' },
    { name: 'Cluster Tokyo', lat: '-7.670599344181913', lng: '110.83923919943206' },
  ]);

  const [extractedUnits, setExtractedUnits] = useState<ExtractedUnitRow[]>([
    { unit: 'A.01', tipe: 'Diamond (Nagoya)', lt: 90, lb: 75, keras: 850000000, tempo24: 950000000, kpr: 900000000, status: 'terverifikasi' },
    { unit: 'B.01', tipe: 'Gold (Osaka)', lt: 72, lb: 60, keras: 680000000, tempo24: 760000000, kpr: 720000000, status: 'terverifikasi' },
    { unit: 'C.10 (Hook)', tipe: 'Emerald Plus', lt: 78, lb: 50, keras: null, tempo24: null, kpr: null, status: 'perlu dicek' },
  ]);
  const [generatedPoints, setGeneratedPoints] = useState<Array<LoveLetterPoint & { sourceTag?: string }>>([]);
  const [gapRecommendations, setGapRecommendations] = useState<string[]>([]);
  const [poisCount, setPoisCount] = useState<number>(0);
  const [aiEnriched, setAiEnriched] = useState<boolean>(false);

  const validationResult = validateLoveLetter(generatedPoints);
  const planMeta = PLAN_PRICING_LABEL[selectedPlan] || PLAN_PRICING_LABEL.platinum;

  if (!isOpen) return null;

  const handleGenerateLoveLetter = async () => {
    setErrorMsg(null);
    setIsProcessing(true);
    try {
      const res = await fetch('/api/onboarding/generate-love-letter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          developerName: formData.developerName,
          projectName: formData.projectName,
          city: formData.city,
          province: formData.province,
          facilities: formData.facilities,
          clusters,
          verifiedUnits: extractedUnits,
          extractedText: ocrPreview,
        }),
      });
      const json = await res.json();
      if (res.ok && json.ok && Array.isArray(json.points)) {
        setGeneratedPoints(json.points);
        setGapRecommendations(Array.isArray(json.gapRecommendations) ? json.gapRecommendations : []);
        setPoisCount(Array.isArray(json.poisUsed) ? json.poisUsed.length : 0);
        setAiEnriched(Boolean(json.aiEnriched));
        setCurrentStep(5);
      } else {
        setErrorMsg(json.error || 'Gagal menyusun Surat Cinta 99 Keunggulan.');
      }
    } catch {
      setErrorMsg('Gagal menghubungi server untuk menyusun Surat Cinta.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStartExtraction = async () => {
    setErrorMsg(null);
    setIsProcessing(true);
    setUploadProgress(25);
    try {
      const files: Array<{ filename: string; contentBase64: string }> = [];
      if (brosurFile) files.push({ filename: brosurFile.name, contentBase64: await fileToBase64(brosurFile) });
      if (pricelistFile) files.push({ filename: pricelistFile.name, contentBase64: await fileToBase64(pricelistFile) });
      setUploadProgress(55);

      const res = await fetch('/api/onboarding/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          selectedPlan,
          companyName: formData.developerName,
          projectName: formData.projectName,
          city: formData.city,
          province: formData.province,
          facilities: formData.facilities,
          files,
        }),
      });
      const json = await res.json();
      setUploadProgress(100);
      if (res.ok && json.ok) {
        if (json.session?.id) setOnboardingSessionId(String(json.session.id));
        if (json.extractedTextPreview) setOcrPreview(String(json.extractedTextPreview));
        if (Array.isArray(json.extractedUnits) && json.extractedUnits.length > 0 && files.length > 0) {
          setExtractedUnits(json.extractedUnits);
        }
        setCurrentStep(3);
      } else {
        setErrorMsg(json.error || 'Gagal menjalankan ekstraksi OCR + AI.');
      }
    } catch {
      setErrorMsg('Koneksi ke server OCR gagal. Pastikan backend aktif.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleActivateWithDummyPg = async () => {
    if (!formData.ownerEmail.trim()) {
      setErrorMsg('Masukkan Email Admin/IT pertama tim pada Langkah 1 atau di bawah ini sebelum aktivasi.');
      return;
    }
    setErrorMsg(null);
    setIsProcessing(true);
    try {
      let sessId = onboardingSessionId;
      if (!sessId) {
        const exRes = await fetch('/api/onboarding/extract', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            selectedPlan,
            companyName: formData.developerName,
            projectName: formData.projectName,
            city: formData.city,
            province: formData.province,
            facilities: formData.facilities,
            files: [],
          }),
        });
        const exJson = await exRes.json();
        if (exRes.ok && exJson.session?.id) sessId = String(exJson.session.id);
      }
      if (!sessId) {
        setErrorMsg('Sesi onboarding tidak ditemukan.');
        return;
      }

      const res = await fetch('/api/onboarding/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: sessId,
          ownerEmail: formData.ownerEmail.trim(),
          ownerName: formData.ownerName.trim() || 'Admin IT Tim',
          ownerPassword: formData.ownerPassword.trim() || 'Andara2026!',
          clusterCoords: clusters.map((c, idx) => ({
            namaCluster: c.name.trim() || `Cluster ${idx + 1}`,
            koordinat: `${c.lat.trim()}, ${c.lng.trim()}`,
          })),
          verifiedUnits: extractedUnits,
          loveLetterPoints: generatedPoints,
        }),
      });
      const json = await res.json();
      if (res.ok && json.ok) {
        setActivationResult({
          tenantId: String(json.tenantId),
          slug: String(json.slug),
          invoiceNo: String(json.invoiceNo),
          initialAic: Number(json.initialAic || 0),
        });
        // Auto-login sesi tim baru agar saat klik Selesai langsung masuk Dashboard proyek sendiri
        await loginWithServer(
          formData.ownerEmail.trim(),
          formData.ownerPassword.trim() || 'Andara2026!'
        ).catch(() => {});
      } else {
        setErrorMsg(json.error || 'Aktivasi paket & pembayaran dummy gagal.');
      }
    } catch {
      setErrorMsg('Gagal menghubungi server aktivasi.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadDocx = async () => {
    try {
      const blob = await generateLoveLetterDocx(
        formData.projectName,
        formData.developerName,
        formData.city,
        generatedPoints
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Surat_Cinta_99_Keunggulan_${formData.projectName.replace(/\s+/g, '_')}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      alert('Gagal mengunduh DOCX. Silakan coba kembali.');
    }
  };

  const handleDownloadPdf = () => {
    const htmlContent = generateLoveLetterHtml(
      formData.projectName,
      formData.developerName,
      formData.city,
      generatedPoints
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
      <div className="w-full max-w-3xl bg-white border border-warmborder rounded-2xl shadow-2xl overflow-hidden my-8">
        <div className="p-5 border-b border-warmborder bg-sandstone/40 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="size-6 rounded-md bg-terracotta text-white font-extrabold text-xs grid place-items-center">
                {currentStep}
              </span>
              <h2 className="text-base font-bold text-espresso">
                Wizard Onboarding: Paket {planMeta.name} &amp; Surat Cinta 99 Keunggulan
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-olive/10 text-olive text-[10px] font-bold">
                {planMeta.price} · {planMeta.aic}
              </span>
            </div>
            <p className="text-xs text-warmmuted mt-0.5">
              Langkah {currentStep} dari 5 · OCR PyMuPDF + RapidOCR + Isolasi Multi-Tenant
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-warmmuted hover:text-espresso hover:bg-white cursor-pointer"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="grid grid-cols-5 border-b border-warmborder text-[11px] font-bold text-center bg-sandstone/20">
          {['1. Info Tim & Proyek', '2. Unggah Berkas OCR', '3. Titik Koordinat', '4. Periksa Data', '5. Surat Cinta & Bayar'].map(
            (label, idx) => (
              <div
                key={label}
                className={`py-2 border-r last:border-r-0 border-warmborder ${
                  currentStep === idx + 1 ? 'bg-amber-100 text-terracotta' : currentStep > idx + 1 ? 'text-olive' : 'text-warmmuted'
                }`}
              >
                {label}
              </div>
            )
          )}
        </div>

        <div className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 font-medium">
              {errorMsg}
            </div>
          )}

          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 text-xs text-terracotta flex items-start gap-2.5">
                <ShieldCheck className="size-4 shrink-0 mt-0.5" />
                <span>
                  Setiap tim developer mendapatkan <strong>partisi tenant_id terisolasi</strong>. Data Anda tidak akan pernah tercampur dengan tim perusahaan lain.
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-espresso mb-1">Nama Developer / PT *</label>
                  <input
                    type="text"
                    value={formData.developerName}
                    onChange={(e) => setFormData({ ...formData, developerName: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl border border-warmborder text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-espresso mb-1">Nama Proyek Perumahan *</label>
                  <input
                    type="text"
                    value={formData.projectName}
                    onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl border border-warmborder text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-espresso mb-1">Kota / Kabupaten</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl border border-warmborder text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-espresso mb-1">Provinsi</label>
                  <input
                    type="text"
                    value={formData.province}
                    onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl border border-warmborder text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-espresso mb-1">Email Admin / IT Pertama Tim *</label>
                  <input
                    type="email"
                    value={formData.ownerEmail}
                    onChange={(e) => setFormData({ ...formData, ownerEmail: e.target.value })}
                    placeholder="it@perusahaananda.co.id"
                    className="w-full h-10 px-3 rounded-xl border border-warmborder text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-espresso mb-1">Kata Sandi Akun Tim *</label>
                  <input
                    type="password"
                    value={formData.ownerPassword}
                    onChange={(e) => setFormData({ ...formData, ownerPassword: e.target.value })}
                    placeholder="Minimal 8 karakter"
                    className="w-full h-10 px-3 rounded-xl border border-warmborder text-xs font-semibold"
                  />
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-4">
              <p className="text-xs text-warmmuted">
                Unggah berkas proyek untuk dibaca oleh <strong>PyMuPDF + RapidOCR</strong> di server. Bisa PDF, Foto (JPG/PNG), atau CSV/TXT.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="border-2 border-dashed border-warmborder rounded-2xl p-5 text-center bg-sandstone/30 hover:bg-sandstone/60 transition-colors cursor-pointer block">
                  <input
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg,.txt,.csv"
                    className="hidden"
                    onChange={(e) => setBrosurFile(e.target.files?.[0] || null)}
                  />
                  <div className="size-10 rounded-xl bg-white text-terracotta grid place-items-center mx-auto shadow-2xs mb-2">
                    <FileText className="size-5" />
                  </div>
                  <p className="text-xs font-bold text-espresso">Brosur / Katalog Proyek</p>
                  <p className="text-[11px] text-warmmuted mt-0.5">PDF atau Foto (Maks 25 MB)</p>
                  <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white border border-warmborder text-[11px] font-semibold text-olive">
                    <CheckCircle2 className="size-3.5" />
                    <span>{brosurFile ? brosurFile.name : 'Klik untuk pilih berkas'}</span>
                  </div>
                </label>

                <label className="border-2 border-dashed border-warmborder rounded-2xl p-5 text-center bg-sandstone/30 hover:bg-sandstone/60 transition-colors cursor-pointer block">
                  <input
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg,.txt,.csv,.xlsx"
                    className="hidden"
                    onChange={(e) => setPricelistFile(e.target.files?.[0] || null)}
                  />
                  <div className="size-10 rounded-xl bg-white text-olive grid place-items-center mx-auto shadow-2xs mb-2">
                    <FileSpreadsheet className="size-5" />
                  </div>
                  <p className="text-xs font-bold text-espresso">Pricelist &amp; Skema Bayar</p>
                  <p className="text-[11px] text-warmmuted mt-0.5">PDF, CSV, atau Foto Pricelist</p>
                  <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white border border-warmborder text-[11px] font-semibold text-olive">
                    <CheckCircle2 className="size-3.5" />
                    <span>{pricelistFile ? pricelistFile.name : 'Klik untuk pilih berkas'}</span>
                  </div>
                </label>
              </div>

              <div>
                <label className="block text-xs font-bold text-espresso mb-1">Daftar Fasilitas &amp; Layanan Utama</label>
                <textarea
                  rows={2}
                  value={formData.facilities}
                  onChange={(e) => setFormData({ ...formData, facilities: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-warmborder text-xs"
                />
              </div>

              {isProcessing && (
                <div className="p-4 bg-sandstone rounded-xl border border-warmborder space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-espresso">
                    <span>Menjalankan PyMuPDF + RapidOCR di server...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-warmborder overflow-hidden">
                    <div className="h-full bg-terracotta transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                  </div>
                </div>
              )}
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-terracotta flex items-center justify-between gap-2">
                <div>
                  <strong>Koordinat Riil Multi-Cluster:</strong> Edit nama cluster &amp; titik GPS, atau tambah cluster baru.
                </div>
                <button
                  type="button"
                  onClick={() => setClusters((prev) => [...prev, { name: `Cluster ${prev.length + 1}`, lat: '', lng: '' }])}
                  className="px-2.5 py-1.5 rounded-lg bg-espresso text-white text-[11px] font-bold flex items-center gap-1 shrink-0 cursor-pointer"
                >
                  <Plus className="size-3.5" /> Tambah Cluster
                </button>
              </div>
              <div className="space-y-3 max-h-[45vh] overflow-y-auto pr-1">
                {clusters.map((c, idx) => (
                  <div key={idx} className="p-3 bg-sandstone/40 rounded-xl border border-warmborder space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-espresso shrink-0">{idx + 1}.</span>
                      <input
                        type="text"
                        value={c.name}
                        onChange={(e) => {
                          const next = [...clusters];
                          next[idx] = { ...c, name: e.target.value };
                          setClusters(next);
                        }}
                        placeholder="Nama Cluster (misal Cluster Utama)"
                        className="flex-1 h-8 px-2.5 rounded-lg border border-warmborder text-xs font-bold text-espresso bg-white"
                      />
                      {clusters.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setClusters((prev) => prev.filter((_, i) => i !== idx))}
                          className="p-1.5 rounded-lg text-warmmuted hover:text-rose-600 hover:bg-white cursor-pointer"
                          title="Hapus Cluster"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        value={c.lat}
                        onChange={(e) => {
                          const next = [...clusters];
                          next[idx] = { ...c, lat: e.target.value };
                          setClusters(next);
                        }}
                        placeholder="Latitude (contoh: -7.673872)"
                        className="h-9 px-2.5 rounded-lg border border-warmborder text-xs font-mono bg-white"
                      />
                      <input
                        type="text"
                        value={c.lng}
                        onChange={(e) => {
                          const next = [...clusters];
                          next[idx] = { ...c, lng: e.target.value };
                          setClusters(next);
                        }}
                        placeholder="Longitude (contoh: 110.843978)"
                        className="h-9 px-2.5 rounded-lg border border-warmborder text-xs font-mono bg-white"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-4">
              <div className="p-3 bg-sandstone rounded-xl border border-warmborder flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-espresso">Layar Periksa &amp; Koreksi Data OCR</span>
                  <p className="text-warmmuted text-[11px]">
                    Anda dapat mengedit langsung angka unit/harga di bawah sebelum dikunci ke database tim.
                  </p>
                </div>
                <span className="px-2 py-0.5 rounded bg-lime-100 text-olive text-[11px] font-bold">
                  {extractedUnits.filter((u) => u.status === 'terverifikasi').length} Siap ·{' '}
                  {extractedUnits.filter((u) => u.status !== 'terverifikasi').length} Perlu Dicek
                </span>
              </div>

              {ocrPreview && (
                <pre className="p-2.5 rounded-lg bg-sandstone/50 border border-warmborder text-[10px] max-h-24 overflow-auto whitespace-pre-wrap">
                  {ocrPreview}
                </pre>
              )}

              <div className="overflow-x-auto border border-warmborder rounded-xl">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-sandstone/60 border-b border-warmborder font-bold text-warmmuted">
                      <th className="py-2 px-3">Unit</th>
                      <th className="py-2 px-2">LT / LB</th>
                      <th className="py-2 px-2">Cash Keras (Rp)</th>
                      <th className="py-2 px-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-warmborder">
                    {extractedUnits.map((u, i) => (
                      <tr key={i}>
                        <td className="py-2 px-3">
                          <input
                            type="text"
                            value={u.unit}
                            onChange={(e) => {
                              const next = [...extractedUnits];
                              next[i] = { ...u, unit: e.target.value };
                              setExtractedUnits(next);
                            }}
                            className="w-24 px-2 py-1 rounded border border-warmborder font-bold text-xs"
                          />
                        </td>
                        <td className="py-2 px-2 text-[11px]">{u.lt}/{u.lb} m²</td>
                        <td className="py-2 px-2">
                          <input
                            type="number"
                            value={u.keras ?? ''}
                            placeholder="Perlu dicek"
                            onChange={(e) => {
                              const val = e.target.value ? Number(e.target.value) : null;
                              const next = [...extractedUnits];
                              next[i] = {
                                ...u,
                                keras: val,
                                kpr: val ? Math.round(val * 1.05) : null,
                                status: val && val >= 100_000_000 ? 'terverifikasi' : 'perlu dicek',
                              };
                              setExtractedUnits(next);
                            }}
                            className="w-36 px-2 py-1 rounded border border-warmborder font-mono text-xs"
                          />
                        </td>
                        <td className="py-2 px-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              u.status === 'terverifikasi' ? 'bg-lime-100 text-olive' : 'bg-amber-100 text-terracotta'
                            }`}
                          >
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

          {currentStep === 5 && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-lime-50 border border-lime-300 flex items-start gap-3">
                <CheckCircle2 className="size-5 text-olive shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="text-xs font-bold text-olive uppercase">
                      {validationResult.passedCount}/99 Poin Faktual Terverifikasi (Nol Filler)
                    </h4>
                    <span className="px-2 py-0.5 rounded-full bg-white border border-lime-300 text-[10px] font-bold text-olive">
                      {poisCount} POI GPS Nyata
                    </span>
                    {aiEnriched && (
                      <span className="px-2 py-0.5 rounded-full bg-amber-100 text-[10px] font-bold text-terracotta">
                        Editorial AI Aktif
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-olive/90">{validationResult.summary}</p>
                </div>
              </div>

              {gapRecommendations.length > 0 && (
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs space-y-1.5">
                  <div className="font-bold text-terracotta flex items-center justify-between gap-2">
                    <span>Data Tambahan untuk Menuju 99 Poin Penuh (Saat ini {generatedPoints.length} poin nyata):</span>
                    <button
                      type="button"
                      onClick={() => setCurrentStep(2)}
                      className="px-2.5 py-1 rounded-lg bg-white border border-amber-300 text-[11px] font-bold text-terracotta cursor-pointer"
                    >
                      Lengkapi Data
                    </button>
                  </div>
                  <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-espresso/85">
                    {gapRecommendations.map((g, i) => (
                      <li key={i}>{g}</li>
                    ))}
                  </ul>
                </div>
              )}

              {generatedPoints.length > 0 && (
                <div className="border border-warmborder rounded-xl p-3 max-h-44 overflow-y-auto space-y-2 bg-sandstone/20">
                  <div className="text-[11px] font-bold text-warmmuted uppercase">
                    Preview Poin Faktual ({formData.projectName})
                  </div>
                  {generatedPoints.slice(0, 12).map((pt) => (
                    <div key={pt.number} className="p-2 rounded-lg bg-white border border-warmborder text-xs">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-espresso">
                          #{pt.number} {pt.title}
                        </span>
                        {pt.sourceTag && (
                          <span className="px-1.5 py-0.5 rounded bg-sandstone text-[9px] font-mono text-warmmuted shrink-0">
                            {pt.sourceTag}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-warmmuted mt-0.5">{pt.narrative}</p>
                    </div>
                  ))}
                </div>
              )}

              <div className="p-4 rounded-xl bg-espresso text-white space-y-3">
                <p className="text-xs font-bold text-amber-400">Unduh Artefak Surat Cinta 99 Keunggulan:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    onClick={handleDownloadDocx}
                    className="h-10 px-4 rounded-xl bg-terracotta text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Download className="size-4" />
                    <span>Unduh Word (.docx)</span>
                  </button>
                  <button
                    onClick={handleDownloadPdf}
                    className="h-10 px-4 rounded-xl bg-white/10 text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer border border-white/20"
                  >
                    <Download className="size-4" />
                    <span>Cetak / Simpan PDF</span>
                  </button>
                </div>
              </div>

              {/* Checkout Paket via Dummy Payment Gateway */}
              <div className="p-4 rounded-xl border border-warmborder bg-sandstone/40 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-espresso flex items-center gap-1.5">
                    <CreditCard className="size-4 text-terracotta" />
                    <span>Aktivasi Paket {planMeta.name} (Mode Dummy Payment Gateway)</span>
                  </div>
                  <span className="text-xs font-extrabold text-espresso">{planMeta.price}</span>
                </div>

                {activationResult ? (
                  <div className="p-3 rounded-lg bg-olive/10 border border-olive/30 text-xs text-olive space-y-1">
                    <div className="font-bold">Tim &amp; Workspace Terisolasi Aktif!</div>
                    <div>Tenant ID: <span className="font-mono font-bold">{activationResult.tenantId}</span></div>
                    <div>Invoice Dummy: <span className="font-mono">{activationResult.invoiceNo}</span> (PAID)</div>
                    <div>Kuota AIC Awal: <strong>{activationResult.initialAic.toLocaleString('id-ID')} AIC</strong></div>
                    <div>Website Publik: <span className="font-mono">/site/{activationResult.slug}</span></div>
                  </div>
                ) : (
                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={handleActivateWithDummyPg}
                    className="w-full h-10 rounded-xl bg-olive hover:bg-olive/90 text-white text-xs font-bold cursor-pointer disabled:opacity-60"
                  >
                    {isProcessing ? 'Memproses Aktivasi & Tenant...' : 'Buat Invoice & Simulasi Bayar Lunas (Aktifkan Tim)'}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="p-5 border-t border-warmborder bg-sandstone/40 flex items-center justify-between">
          {currentStep > 1 && currentStep < 5 ? (
            <button
              onClick={() => setCurrentStep((prev) => prev - 1)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-espresso hover:bg-white cursor-pointer flex items-center gap-1.5"
            >
              <ArrowLeft className="size-3.5" />
              <span>Sebelumnya</span>
            </button>
          ) : (
            <div />
          )}

          {currentStep === 1 && (
            <button
              onClick={() => setCurrentStep(2)}
              className="px-5 py-2.5 rounded-xl bg-terracotta text-white text-xs font-bold cursor-pointer flex items-center gap-1.5 ml-auto"
            >
              <span>Lanjut: Unggah Berkas OCR</span>
              <ArrowRight className="size-3.5" />
            </button>
          )}

          {currentStep === 2 && (
            <button
              onClick={handleStartExtraction}
              disabled={isProcessing}
              className="px-5 py-2.5 rounded-xl bg-terracotta text-white text-xs font-bold cursor-pointer flex items-center gap-1.5 ml-auto disabled:opacity-50"
            >
              <span>{isProcessing ? 'Mengekstraksi OCR...' : 'Jalankan OCR + AI'}</span>
              <ArrowRight className="size-3.5" />
            </button>
          )}

          {currentStep === 3 && (
            <button
              onClick={() => setCurrentStep(4)}
              className="px-5 py-2.5 rounded-xl bg-terracotta text-white text-xs font-bold cursor-pointer flex items-center gap-1.5 ml-auto"
            >
              <span>Lanjut: Periksa Data</span>
              <ArrowRight className="size-3.5" />
            </button>
          )}

          {currentStep === 4 && (
            <button
              onClick={handleGenerateLoveLetter}
              disabled={isProcessing}
              className="px-5 py-2.5 rounded-xl bg-terracotta text-white text-xs font-bold cursor-pointer flex items-center gap-1.5 ml-auto disabled:opacity-60"
            >
              <Sparkles className="size-3.5 text-amber-300" />
              <span>{isProcessing ? 'Menyusun 99 Keunggulan...' : 'Lanjut: Surat Cinta & Bayar'}</span>
            </button>
          )}

          {currentStep === 5 && (
            <div className="flex items-center gap-2 ml-auto">
              {onOpenFullViewer && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenFullViewer();
                  }}
                  className="px-4 py-2 rounded-xl bg-sandstone border border-warmborder text-espresso text-xs font-bold cursor-pointer"
                >
                  Lihat 99 Poin
                </button>
              )}
              <button
                onClick={() => {
                  onClose();
                  if (activationResult && onEnterDashboard) {
                    onEnterDashboard('IT');
                  }
                }}
                className="px-4 py-2 rounded-xl bg-espresso text-white text-xs font-bold cursor-pointer"
              >
                {activationResult ? 'Masuk ke Dashboard Tim →' : 'Selesai'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
