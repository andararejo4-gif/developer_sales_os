import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  CreditCard,
  FileSpreadsheet,
  FileText,
  Lock,
  MapPin,
  Plus,
  ShieldCheck,
  Sparkles,
  Trash2,
} from 'lucide-react';
import type { LoveLetterPoint } from '../lib/love-letter/points-data';

type PlanCode = 'gold' | 'platinum' | 'diamond';

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

interface OnboardingRegistrationPageProps {
  initialPlan?: PlanCode;
}

const ONBOARDING_DRAFT_KEY = 'dsos_onboarding_draft_v1';

const PLAN_CATALOG: Record<
  PlanCode,
  { name: string; price: string; period: string; aic: string; summary: string }
> = {
  gold: {
    name: 'Gold',
    price: 'Rp 4.900.000',
    period: '/ 3 bulan',
    aic: '2.500 AIC',
    summary: '1 Proyek · Tim sales inti · OCR & Surat Cinta',
  },
  platinum: {
    name: 'Platinum',
    price: 'Rp 9.900.000',
    period: '/ 3 bulan',
    aic: '5.000 AIC',
    summary: 'Multi-cluster · Automasi WA & AI Copilot penuh',
  },
  diamond: {
    name: 'Diamond',
    price: 'Rp 19.900.000',
    period: '/ 3 bulan',
    aic: '12.000 AIC',
    summary: 'Enterprise multi-proyek · Prioritas AI & Voice',
  },
};

const STEPS = [
  { num: 1, title: 'Info Tim & Proyek', sub: 'Identitas developer & akun Admin IT' },
  { num: 2, title: 'Unggah Berkas OCR', sub: 'Brosur, pricelist & fasilitas' },
  { num: 3, title: 'Titik Koordinat', sub: 'Lokasi riil cluster untuk POI' },
  { num: 4, title: 'Periksa Data', sub: 'Koreksi unit & harga hasil OCR' },
  { num: 5, title: 'Pembayaran Paket', sub: 'Kunci Surat Cinta & aktivasi Midtrans' },
];

function loadDraft() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(ONBOARDING_DRAFT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Gagal membaca file'));
    reader.readAsDataURL(file);
  });
}

export const OnboardingRegistrationPage: React.FC<OnboardingRegistrationPageProps> = ({
  initialPlan,
}) => {
  const initialDraft = loadDraft();
  const resolvedPlan: PlanCode =
    initialPlan && initialPlan in PLAN_CATALOG
      ? initialPlan
      : initialDraft?.selectedPlan && initialDraft.selectedPlan in PLAN_CATALOG
      ? initialDraft.selectedPlan
      : 'platinum';

  const [selectedPlan, setSelectedPlan] = useState<PlanCode>(resolvedPlan);
  const [currentStep, setCurrentStep] = useState<number>(
    Math.min(5, Math.max(1, Number(initialDraft?.currentStep || 1)))
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [brosurFile, setBrosurFile] = useState<File | null>(null);
  const [pricelistFile, setPricelistFile] = useState<File | null>(null);
  const [onboardingSessionId, setOnboardingSessionId] = useState<string | null>(
    initialDraft?.onboardingSessionId || null
  );
  const [ocrPreview, setOcrPreview] = useState<string>(initialDraft?.ocrPreview || '');
  const [pendingInvoiceNo, setPendingInvoiceNo] = useState<string | null>(
    initialDraft?.pendingInvoiceNo || null
  );

  const [formData, setFormData] = useState(
    initialDraft?.formData || {
      developerName: '',
      projectName: '',
      city: '',
      province: '',
      ownerName: 'Admin IT Tim',
      ownerEmail: '',
      ownerPassword: '',
      facilities: 'One gate system, security 24 jam, CCTV kawasan, akses jalan utama',
    }
  );

  const [clusters, setClusters] = useState<Array<{ name: string; lat: string; lng: string }>>(
    Array.isArray(initialDraft?.clusters) && initialDraft.clusters.length > 0
      ? initialDraft.clusters
      : [{ name: 'Cluster Utama', lat: '', lng: '' }]
  );

  const [extractedUnits, setExtractedUnits] = useState<ExtractedUnitRow[]>(
    Array.isArray(initialDraft?.extractedUnits) && initialDraft.extractedUnits.length > 0
      ? initialDraft.extractedUnits
      : [
          {
            unit: 'A.01',
            tipe: 'Tipe Standar',
            lt: 72,
            lb: 60,
            keras: 650000000,
            tempo24: 720000000,
            kpr: 685000000,
            status: 'terverifikasi',
          },
        ]
  );

  const [generatedPoints, setGeneratedPoints] = useState<Array<LoveLetterPoint & { sourceTag?: string }>>(
    Array.isArray(initialDraft?.generatedPoints) ? initialDraft.generatedPoints : []
  );
  const [gapRecommendations, setGapRecommendations] = useState<string[]>(
    Array.isArray(initialDraft?.gapRecommendations) ? initialDraft.gapRecommendations : []
  );
  const [poisCount, setPoisCount] = useState<number>(Number(initialDraft?.poisCount || 0));
  const [aiEnriched, setAiEnriched] = useState<boolean>(Boolean(initialDraft?.aiEnriched));

  const planMeta = PLAN_CATALOG[selectedPlan];

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(
        ONBOARDING_DRAFT_KEY,
        JSON.stringify({
          currentStep,
          selectedPlan,
          onboardingSessionId,
          pendingInvoiceNo,
          ocrPreview,
          formData,
          clusters,
          extractedUnits,
          generatedPoints,
          gapRecommendations,
          poisCount,
          aiEnriched,
          savedAt: new Date().toISOString(),
        })
      );
    } catch {
      /* ignore quota */
    }
  }, [
    currentStep,
    selectedPlan,
    onboardingSessionId,
    pendingInvoiceNo,
    ocrPreview,
    formData,
    clusters,
    extractedUnits,
    generatedPoints,
    gapRecommendations,
    poisCount,
    aiEnriched,
  ]);

  const handlePlanChange = (nextPlan: PlanCode) => {
    setSelectedPlan(nextPlan);
    if (typeof window !== 'undefined') {
      window.history.replaceState({}, '', `/daftar/${nextPlan}`);
    }
  };

  const handleNextFromStep1 = () => {
    if (!formData.developerName.trim() || !formData.projectName.trim()) {
      setErrorMsg('Nama Developer/PT dan Nama Proyek wajib diisi.');
      return;
    }
    if (!formData.ownerEmail.trim() || !formData.ownerEmail.includes('@')) {
      setErrorMsg('Masukkan email Admin/IT tim yang valid.');
      return;
    }
    if (!formData.ownerPassword.trim() || formData.ownerPassword.trim().length < 6) {
      setErrorMsg('Kata sandi akun tim minimal 6 karakter.');
      return;
    }
    setErrorMsg(null);
    setCurrentStep(2);
  };

  const handleStartExtraction = async () => {
    setErrorMsg(null);
    setIsProcessing(true);
    setUploadProgress(25);
    try {
      const files: Array<{ filename: string; contentBase64: string }> = [];
      if (brosurFile) files.push({ filename: brosurFile.name, contentBase64: await fileToBase64(brosurFile) });
      if (pricelistFile) files.push({ filename: pricelistFile.name, contentBase64: await fileToBase64(pricelistFile) });
      setUploadProgress(60);

      const res = await fetch('/api/onboarding/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          selectedPlan,
          companyName: formData.developerName.trim() || 'Developer Properti',
          projectName: formData.projectName.trim() || 'Proyek Hunian',
          city: formData.city.trim(),
          province: formData.province.trim(),
          facilities: formData.facilities.trim(),
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
      setErrorMsg('Koneksi ke server OCR gagal. Pastikan koneksi internet aktif.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGenerateLoveLetter = async () => {
    setErrorMsg(null);
    setIsProcessing(true);
    try {
      const res = await fetch('/api/onboarding/generate-love-letter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          developerName: formData.developerName.trim() || 'Developer Properti',
          projectName: formData.projectName.trim() || 'Proyek Hunian',
          city: formData.city.trim() || 'Indonesia',
          province: formData.province.trim(),
          facilities: formData.facilities.trim(),
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

  const handleProceedToCheckout = async () => {
    if (!formData.ownerEmail.trim() || !formData.ownerEmail.includes('@')) {
      setErrorMsg('Email Admin/IT tim pada Langkah 1 wajib valid.');
      return;
    }
    if (!formData.ownerPassword.trim() || formData.ownerPassword.trim().length < 6) {
      setErrorMsg('Kata sandi akun tim pada Langkah 1 minimal 6 karakter.');
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
            companyName: formData.developerName.trim() || 'Developer Properti',
            projectName: formData.projectName.trim() || 'Proyek Hunian',
            city: formData.city.trim(),
            province: formData.province.trim(),
            facilities: formData.facilities.trim(),
            files: [],
          }),
        });
        const exJson = await exRes.json();
        if (exRes.ok && exJson.session?.id) {
          sessId = String(exJson.session.id);
          setOnboardingSessionId(sessId);
        }
      }
      if (!sessId) {
        setErrorMsg('Sesi pendaftaran belum terbentuk. Coba ulangi.');
        return;
      }

      const res = await fetch('/api/onboarding/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: sessId,
          ownerEmail: formData.ownerEmail.trim(),
          ownerName: formData.ownerName.trim() || 'Admin IT Tim',
          ownerPassword: formData.ownerPassword.trim(),
          clusterCoords: clusters.map((c, idx) => ({
            namaCluster: c.name.trim() || `Cluster ${idx + 1}`,
            koordinat: `${c.lat.trim()}, ${c.lng.trim()}`,
          })),
          verifiedUnits: extractedUnits,
          loveLetterPoints: generatedPoints,
        }),
      });
      const json = await res.json();
      if (res.ok && json.ok && json.checkoutPath) {
        setPendingInvoiceNo(String(json.invoiceNo || ''));
        window.location.href = String(json.checkoutPath);
      } else {
        setErrorMsg(json.error || 'Gagal membuat transaksi pembayaran Midtrans.');
      }
    } catch {
      setErrorMsg('Gagal menghubungi server pembayaran.');
    } finally {
      setIsProcessing(false);
    }
  };

  const updateUnitField = (index: number, patch: Partial<ExtractedUnitRow>) => {
    setExtractedUnits((prev) => prev.map((row, idx) => (idx === index ? { ...row, ...patch } : row)));
  };

  return (
    <div className="min-h-dvh bg-sandstone text-espresso flex flex-col lg:grid lg:grid-cols-12">
      {/* LEFT RAIL (Desktop) / TOP SUMMARY (Mobile & Tablet) */}
      <aside className="bg-[#111814] text-white lg:col-span-4 lg:sticky lg:top-0 lg:h-dvh lg:flex lg:flex-col lg:justify-between p-4 sm:p-6 lg:p-9">
        <div className="space-y-5 lg:space-y-7">
          <div className="flex items-center justify-between gap-3">
            <a
              href="/"
              className="inline-flex items-center gap-2 min-h-[44px] pr-3 text-xs font-semibold text-white/80 hover:text-white"
            >
              <ArrowLeft className="size-4" />
              <span>Beranda</span>
            </a>
            <div className="flex items-center gap-2">
              <span className="size-7 rounded-md bg-terracotta text-white font-extrabold text-xs grid place-items-center">
                DS
              </span>
              <span className="text-sm font-bold tracking-tight">Developer Sales OS</span>
            </div>
          </div>

          {/* Plan Switcher */}
          <div className="space-y-2.5">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-white/55">
              Pilih Paket Workspace
            </div>
            <div className="grid grid-cols-3 gap-2">
              {(['gold', 'platinum', 'diamond'] as PlanCode[]).map((code) => {
                const active = selectedPlan === code;
                return (
                  <button
                    key={code}
                    type="button"
                    onClick={() => handlePlanChange(code)}
                    className={`min-h-[44px] px-2.5 py-2 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                      active
                        ? 'bg-terracotta border-terracotta text-white'
                        : 'bg-white/5 border-white/15 text-white/75 hover:bg-white/10'
                    }`}
                  >
                    {PLAN_CATALOG[code].name}
                  </button>
                );
              })}
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-1">
              <div className="flex items-baseline justify-between gap-2 flex-wrap">
                <span className="text-xl sm:text-2xl font-extrabold tracking-tight">{planMeta.price}</span>
                <span className="text-xs text-white/65">{planMeta.period} · {planMeta.aic}</span>
              </div>
              <p className="text-xs text-white/70">{planMeta.summary}</p>
            </div>
          </div>

          {/* Desktop Vertical Stepper */}
          <ol className="hidden lg:block space-y-2.5 pt-1">
            {STEPS.map((st) => {
              const done = currentStep > st.num;
              const active = currentStep === st.num;
              return (
                <li key={st.num}>
                  <button
                    type="button"
                    onClick={() => {
                      if (st.num < currentStep) setCurrentStep(st.num);
                    }}
                    disabled={st.num > currentStep}
                    className={`w-full text-left flex items-start gap-3 p-2.5 rounded-xl transition-colors ${
                      active
                        ? 'bg-white/10 text-white'
                        : done
                        ? 'text-white/85 hover:bg-white/5 cursor-pointer'
                        : 'text-white/40 cursor-default'
                    }`}
                  >
                    <span
                      className={`size-6 rounded-md text-xs font-bold grid place-items-center shrink-0 mt-0.5 ${
                        done
                          ? 'bg-emerald-600 text-white'
                          : active
                          ? 'bg-terracotta text-white'
                          : 'bg-white/10 text-white/60'
                      }`}
                    >
                      {done ? <Check className="size-3.5" /> : st.num}
                    </span>
                    <div className="min-w-0">
                      <div className="text-xs font-bold leading-snug">{st.title}</div>
                      <div className="text-[11px] text-white/60 leading-snug">{st.sub}</div>
                    </div>
                  </button>
                </li>
              );
            })}
          </ol>

          {/* Mobile/Tablet Compact Progress Bar */}
          <div className="lg:hidden space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-white">
                Langkah {currentStep}/5 · {STEPS[currentStep - 1].title}
              </span>
              <span className="text-white/65">{Math.round((currentStep / 5) * 100)}%</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-white/15 overflow-hidden">
              <div
                className="h-full bg-terracotta transition-all duration-300"
                style={{ width: `${(currentStep / 5) * 100}%` }}
              />
            </div>
          </div>
        </div>

        <div className="hidden lg:flex items-center gap-2 text-[11px] text-white/60 border-t border-white/10 pt-5">
          <ShieldCheck className="size-4 text-emerald-400 shrink-0" />
          <span>Draft otomatis tersimpan di perangkat — aman bila halaman di-refresh.</span>
        </div>
      </aside>

      {/* RIGHT WORKSPACE */}
      <main className="flex-1 lg:col-span-8 flex flex-col min-w-0">
        <div className="flex-1 w-full max-w-3xl mx-auto px-4 sm:px-6 lg:px-10 py-6 sm:py-8 lg:py-10 pb-28 lg:pb-12">
          <div className="bg-white border border-warmborder rounded-2xl p-5 sm:p-7 space-y-6">
            <header className="space-y-1 border-b border-warmborder pb-4">
              <div className="text-[11px] font-bold uppercase tracking-wider text-terracotta">
                Langkah {currentStep} dari 5
              </div>
              <h1 className="text-[clamp(1.2rem,2.2vw,1.65rem)] font-extrabold tracking-tight text-espresso">
                {STEPS[currentStep - 1].title}
              </h1>
              <p className="text-xs sm:text-sm text-warmmuted">{STEPS[currentStep - 1].sub}</p>
            </header>

            {errorMsg && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 font-semibold">
                {errorMsg}
              </div>
            )}

            {/* STEP 1 */}
            {currentStep === 1 && (
              <div className="space-y-5">
                <div className="p-3.5 rounded-xl bg-sandstone/70 border border-warmborder text-xs text-espresso flex items-start gap-2.5">
                  <ShieldCheck className="size-4 text-terracotta shrink-0 mt-0.5" />
                  <span>
                    Setiap developer mendapat <strong>partisi tenant_id terisolasi</strong>. Akun login aktif otomatis setelah pembayaran paket lunas.
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-espresso">Nama Developer / PT *</label>
                    <input
                      type="text"
                      value={formData.developerName}
                      onChange={(e) => setFormData({ ...formData, developerName: e.target.value })}
                      placeholder="PT Contoh Properti Nusantara"
                      className="w-full min-h-[44px] px-3.5 rounded-lg border border-warmborder text-sm font-medium bg-white"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-espresso">Nama Proyek Perumahan *</label>
                    <input
                      type="text"
                      value={formData.projectName}
                      onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
                      placeholder="Griya Harmoni Residence"
                      className="w-full min-h-[44px] px-3.5 rounded-lg border border-warmborder text-sm font-medium bg-white"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-espresso">Kota / Kabupaten</label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder="Semarang / Sukoharjo"
                      className="w-full min-h-[44px] px-3.5 rounded-lg border border-warmborder text-sm font-medium bg-white"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-espresso">Provinsi</label>
                    <input
                      type="text"
                      value={formData.province}
                      onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                      placeholder="Jawa Tengah"
                      className="w-full min-h-[44px] px-3.5 rounded-lg border border-warmborder text-sm font-medium bg-white"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-espresso">Email Admin / IT Pertama *</label>
                    <input
                      type="email"
                      value={formData.ownerEmail}
                      onChange={(e) => setFormData({ ...formData, ownerEmail: e.target.value })}
                      placeholder="admin@perusahaananda.co.id"
                      className="w-full min-h-[44px] px-3.5 rounded-lg border border-warmborder text-sm font-medium bg-white"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-espresso">Kata Sandi Akun Tim *</label>
                    <input
                      type="password"
                      value={formData.ownerPassword}
                      onChange={(e) => setFormData({ ...formData, ownerPassword: e.target.value })}
                      placeholder="Minimal 6 karakter"
                      className="w-full min-h-[44px] px-3.5 rounded-lg border border-warmborder text-sm font-medium bg-white"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2 */}
            {currentStep === 2 && (
              <div className="space-y-5">
                <p className="text-xs sm:text-sm text-warmmuted">
                  Unggah brosur &amp; pricelist agar dibaca otomatis oleh <strong>PyMuPDF + RapidOCR</strong>. Anda juga bisa lanjut tanpa berkas lalu lengkapi data manual.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <label className="border-2 border-dashed border-warmborder rounded-xl p-5 text-center bg-sandstone/40 hover:bg-sandstone/70 transition-colors cursor-pointer block">
                    <input
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg,.txt,.csv"
                      className="hidden"
                      onChange={(e) => setBrosurFile(e.target.files?.[0] || null)}
                    />
                    <div className="size-11 rounded-lg bg-white border border-warmborder text-terracotta grid place-items-center mx-auto mb-2.5">
                      <FileText className="size-5" />
                    </div>
                    <p className="text-xs font-bold text-espresso">Brosur / Katalog Proyek</p>
                    <p className="text-[11px] text-warmmuted mt-0.5">PDF atau Foto (Maks 25 MB)</p>
                    <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-warmborder text-[11px] font-semibold text-olive max-w-full truncate">
                      <CheckCircle2 className="size-3.5 shrink-0" />
                      <span className="truncate">{brosurFile ? brosurFile.name : 'Pilih berkas'}</span>
                    </div>
                  </label>

                  <label className="border-2 border-dashed border-warmborder rounded-xl p-5 text-center bg-sandstone/40 hover:bg-sandstone/70 transition-colors cursor-pointer block">
                    <input
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg,.txt,.csv,.xlsx"
                      className="hidden"
                      onChange={(e) => setPricelistFile(e.target.files?.[0] || null)}
                    />
                    <div className="size-11 rounded-lg bg-white border border-warmborder text-olive grid place-items-center mx-auto mb-2.5">
                      <FileSpreadsheet className="size-5" />
                    </div>
                    <p className="text-xs font-bold text-espresso">Pricelist &amp; Skema Bayar</p>
                    <p className="text-[11px] text-warmmuted mt-0.5">PDF, CSV, atau Foto Pricelist</p>
                    <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-warmborder text-[11px] font-semibold text-olive max-w-full truncate">
                      <CheckCircle2 className="size-3.5 shrink-0" />
                      <span className="truncate">{pricelistFile ? pricelistFile.name : 'Pilih berkas'}</span>
                    </div>
                  </label>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-espresso">Fasilitas &amp; Layanan Kawasan</label>
                  <textarea
                    rows={3}
                    value={formData.facilities}
                    onChange={(e) => setFormData({ ...formData, facilities: e.target.value })}
                    className="w-full p-3 rounded-lg border border-warmborder text-sm bg-white"
                  />
                </div>

                {isProcessing && (
                  <div className="p-4 bg-sandstone rounded-xl border border-warmborder space-y-2">
                    <div className="flex items-center justify-between text-xs font-semibold text-espresso">
                      <span>Menjalankan PyMuPDF + RapidOCR...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-warmborder overflow-hidden">
                      <div className="h-full bg-terracotta transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* STEP 3 */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <div className="p-3.5 bg-sandstone/70 rounded-xl border border-warmborder flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-2.5 text-xs text-espresso">
                    <MapPin className="size-4 text-terracotta shrink-0 mt-0.5" />
                    <span>Isi titik koordinat GPS nyata tiap cluster untuk deteksi otomatis POI (tol, RS, sekolah, kampus).</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setClusters((prev) => [...prev, { name: `Cluster ${prev.length + 1}`, lat: '', lng: '' }])}
                    className="min-h-[44px] px-3.5 rounded-lg bg-espresso text-white text-xs font-bold flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
                  >
                    <Plus className="size-4" />
                    <span>Tambah Cluster</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {clusters.map((c, idx) => (
                    <div key={idx} className="p-4 bg-sandstone/35 rounded-xl border border-warmborder space-y-3">
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
                          placeholder="Nama Cluster"
                          className="flex-1 min-w-0 min-h-[44px] px-3 rounded-lg border border-warmborder text-sm font-semibold bg-white"
                        />
                        {clusters.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setClusters((prev) => prev.filter((_, i) => i !== idx))}
                            aria-label="Hapus cluster"
                            className="min-h-[44px] min-w-[44px] rounded-lg text-warmmuted hover:text-rose-600 hover:bg-white grid place-items-center cursor-pointer"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <input
                          type="text"
                          value={c.lat}
                          onChange={(e) => {
                            const next = [...clusters];
                            next[idx] = { ...c, lat: e.target.value };
                            setClusters(next);
                          }}
                          placeholder="Latitude (contoh: -7.673872)"
                          className="min-h-[44px] px-3 rounded-lg border border-warmborder text-xs font-mono bg-white"
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
                          className="min-h-[44px] px-3 rounded-lg border border-warmborder text-xs font-mono bg-white"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 4 */}
            {currentStep === 4 && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 p-3.5 bg-sandstone/70 rounded-xl border border-warmborder text-xs">
                  <div>
                    <span className="font-bold text-espresso">Verifikasi &amp; Koreksi Unit</span>
                    <p className="text-[11px] text-warmmuted">Edit langsung unit &amp; harga sebelum dikunci ke workspace Anda.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setExtractedUnits((prev) => [
                        ...prev,
                        { unit: `U.${prev.length + 1}`, tipe: 'Standar', lt: 72, lb: 60, keras: 650000000, tempo24: null, kpr: null, status: 'terverifikasi' },
                      ])
                    }
                    className="min-h-[44px] px-3 rounded-lg bg-espresso text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="size-3.5" /> Tambah Unit
                  </button>
                </div>

                {ocrPreview && (
                  <pre className="p-3 rounded-lg bg-sandstone/50 border border-warmborder text-[11px] max-h-28 overflow-auto whitespace-pre-wrap">
                    {ocrPreview}
                  </pre>
                )}

                {/* Mobile Card List (Zero Horizontal Scroll) */}
                <div className="space-y-3 md:hidden">
                  {extractedUnits.map((u, i) => (
                    <div key={i} className="p-3.5 rounded-xl border border-warmborder bg-sandstone/25 space-y-2.5">
                      <div className="grid grid-cols-2 gap-2.5">
                        <div>
                          <label className="block text-[11px] font-bold text-warmmuted mb-1">Kode Unit</label>
                          <input
                            type="text"
                            value={u.unit}
                            onChange={(e) => updateUnitField(i, { unit: e.target.value })}
                            className="w-full min-h-[44px] px-3 rounded-lg border border-warmborder bg-white text-xs font-bold"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-warmmuted mb-1">Tipe / Cluster</label>
                          <input
                            type="text"
                            value={u.tipe}
                            onChange={(e) => updateUnitField(i, { tipe: e.target.value })}
                            className="w-full min-h-[44px] px-3 rounded-lg border border-warmborder bg-white text-xs"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="block text-[11px] font-bold text-warmmuted mb-1">LT (m²)</label>
                          <input
                            type="number"
                            value={u.lt}
                            onChange={(e) => updateUnitField(i, { lt: Number(e.target.value) || 0 })}
                            className="w-full min-h-[44px] px-2.5 rounded-lg border border-warmborder bg-white text-xs font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-warmmuted mb-1">LB (m²)</label>
                          <input
                            type="number"
                            value={u.lb}
                            onChange={(e) => updateUnitField(i, { lb: Number(e.target.value) || 0 })}
                            className="w-full min-h-[44px] px-2.5 rounded-lg border border-warmborder bg-white text-xs font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-warmmuted mb-1">Cash (Rp)</label>
                          <input
                            type="number"
                            value={u.keras ?? ''}
                            onChange={(e) => updateUnitField(i, { keras: Number(e.target.value) || null, status: 'terverifikasi' })}
                            className="w-full min-h-[44px] px-2.5 rounded-lg border border-warmborder bg-white text-xs font-mono"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop Table */}
                <div className="hidden md:block border border-warmborder rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-sandstone/70 border-b border-warmborder font-bold text-warmmuted">
                        <th className="py-2.5 px-3">Unit</th>
                        <th className="py-2.5 px-2">Tipe</th>
                        <th className="py-2.5 px-2">LT / LB</th>
                        <th className="py-2.5 px-2">Cash Keras (Rp)</th>
                        <th className="py-2.5 px-2">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-warmborder">
                      {extractedUnits.map((u, i) => (
                        <tr key={i}>
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              value={u.unit}
                              onChange={(e) => updateUnitField(i, { unit: e.target.value })}
                              className="w-24 h-9 px-2 rounded-lg border border-warmborder font-bold"
                            />
                          </td>
                          <td className="py-2 px-2">
                            <input
                              type="text"
                              value={u.tipe}
                              onChange={(e) => updateUnitField(i, { tipe: e.target.value })}
                              className="w-32 h-9 px-2 rounded-lg border border-warmborder"
                            />
                          </td>
                          <td className="py-2 px-2 font-mono whitespace-nowrap">
                            {u.lt}/{u.lb} m²
                          </td>
                          <td className="py-2 px-2">
                            <input
                              type="number"
                              value={u.keras ?? ''}
                              onChange={(e) => updateUnitField(i, { keras: Number(e.target.value) || null, status: 'terverifikasi' })}
                              className="w-36 h-9 px-2 rounded-lg border border-warmborder font-mono"
                            />
                          </td>
                          <td className="py-2 px-2">
                            <span
                              className={`px-2 py-1 rounded text-[10px] font-bold ${
                                u.status === 'terverifikasi' ? 'bg-olive/10 text-olive' : 'bg-amber-100 text-amber-900'
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

            {/* STEP 5 */}
            {currentStep === 5 && (
              <div className="space-y-5">
                <div className="p-4 rounded-xl bg-olive/10 border border-olive/30 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="font-bold text-olive flex items-center gap-2">
                    <CheckCircle2 className="size-4 shrink-0" />
                    <span>{generatedPoints.length} Poin Faktual Surat Cinta Siap ({poisCount} POI GPS{aiEnriched ? ' · AI Verified' : ''})</span>
                  </div>
                </div>

                {gapRecommendations.length > 0 && (
                  <div className="p-4 rounded-xl bg-sandstone/70 border border-warmborder space-y-2 text-xs">
                    <div className="font-bold text-espresso">Saran Kelengkapan Data:</div>
                    <ul className="list-disc pl-4 space-y-1 text-warmmuted">
                      {gapRecommendations.slice(0, 4).map((g, i) => (
                        <li key={i}>{g}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="p-5 rounded-xl border border-amber-300 bg-amber-50/70 space-y-2.5">
                  <div className="flex items-center gap-2 text-sm font-bold text-espresso">
                    <Lock className="size-4 text-amber-700 shrink-0" />
                    <span>Surat Cinta &amp; Akses Login Terkunci Sebelum Pembayaran</span>
                  </div>
                  <p className="text-xs text-espresso/80 leading-relaxed">
                    Selesaikan pembayaran Paket <strong>{planMeta.name}</strong> ({planMeta.price} {planMeta.period}) melalui halaman checkout <strong>Midtrans</strong> untuk langsung membuka dokumen Surat Cinta (.docx &amp; PDF) serta mengaktifkan akun login <strong>{formData.ownerEmail}</strong>.
                  </p>
                </div>

                <div className="p-5 rounded-xl border border-warmborder bg-sandstone/35 space-y-3">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2 text-xs font-bold text-espresso">
                      <CreditCard className="size-4 text-terracotta" />
                      <span>Ringkasan Paket {planMeta.name}</span>
                    </div>
                    <span className="text-sm font-extrabold text-espresso">{planMeta.price} {planMeta.period}</span>
                  </div>

                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={handleProceedToCheckout}
                    className="w-full min-h-[48px] px-5 rounded-xl bg-terracotta hover:bg-terracotta/90 text-white text-sm font-bold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                  >
                    <span>{isProcessing ? 'Menyiapkan Halaman Pembayaran...' : 'Lanjut ke Halaman Pembayaran Midtrans →'}</span>
                  </button>

                  {pendingInvoiceNo && (
                    <a
                      href={`/checkout/${encodeURIComponent(pendingInvoiceNo)}`}
                      className="block text-center text-xs font-semibold text-terracotta underline py-1"
                    >
                      Lanjutkan Invoice Tertunda ({pendingInvoiceNo})
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Desktop Action Footer */}
            <div className="hidden lg:flex items-center justify-between pt-4 border-t border-warmborder">
              {currentStep > 1 ? (
                <button
                  type="button"
                  onClick={() => setCurrentStep((s) => Math.max(1, s - 1))}
                  className="min-h-[44px] px-4 rounded-xl border border-warmborder text-xs font-bold text-espresso hover:bg-sandstone flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="size-4" />
                  <span>Sebelumnya</span>
                </button>
              ) : (
                <div />
              )}

              {currentStep === 1 && (
                <button
                  type="button"
                  onClick={handleNextFromStep1}
                  className="min-h-[44px] px-6 rounded-xl bg-terracotta text-white text-xs font-bold flex items-center gap-2 cursor-pointer"
                >
                  <span>Lanjut: Unggah Berkas OCR</span>
                  <ArrowRight className="size-4" />
                </button>
              )}
              {currentStep === 2 && (
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={handleStartExtraction}
                  className="min-h-[44px] px-6 rounded-xl bg-terracotta text-white text-xs font-bold flex items-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  <span>{isProcessing ? 'Mengekstraksi OCR...' : 'Jalankan OCR + Lanjut'}</span>
                  <ArrowRight className="size-4" />
                </button>
              )}
              {currentStep === 3 && (
                <button
                  type="button"
                  onClick={() => setCurrentStep(4)}
                  className="min-h-[44px] px-6 rounded-xl bg-terracotta text-white text-xs font-bold flex items-center gap-2 cursor-pointer"
                >
                  <span>Lanjut: Periksa Data</span>
                  <ArrowRight className="size-4" />
                </button>
              )}
              {currentStep === 4 && (
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={handleGenerateLoveLetter}
                  className="min-h-[44px] px-6 rounded-xl bg-terracotta text-white text-xs font-bold flex items-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  <Sparkles className="size-4" />
                  <span>{isProcessing ? 'Menyusun Surat Cinta...' : 'Lanjut: Kunci & Bayar'}</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Sticky Mobile/Tablet Bottom Action Bar */}
        <div className="lg:hidden fixed inset-x-0 bottom-0 z-30 bg-white border-t border-warmborder px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] flex items-center justify-between gap-3">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={() => setCurrentStep((s) => Math.max(1, s - 1))}
              className="min-h-[44px] px-4 rounded-xl border border-warmborder text-xs font-bold text-espresso flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="size-4" />
              <span>Kembali</span>
            </button>
          ) : (
            <div className="text-xs font-bold text-espresso">{planMeta.price}</div>
          )}

          {currentStep === 1 && (
            <button
              type="button"
              onClick={handleNextFromStep1}
              className="flex-1 min-h-[44px] px-5 rounded-xl bg-terracotta text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Lanjut OCR</span>
              <ArrowRight className="size-4" />
            </button>
          )}
          {currentStep === 2 && (
            <button
              type="button"
              disabled={isProcessing}
              onClick={handleStartExtraction}
              className="flex-1 min-h-[44px] px-5 rounded-xl bg-terracotta text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              <span>{isProcessing ? 'Memproses...' : 'Jalankan OCR'}</span>
              <ArrowRight className="size-4" />
            </button>
          )}
          {currentStep === 3 && (
            <button
              type="button"
              onClick={() => setCurrentStep(4)}
              className="flex-1 min-h-[44px] px-5 rounded-xl bg-terracotta text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Periksa Data</span>
              <ArrowRight className="size-4" />
            </button>
          )}
          {currentStep === 4 && (
            <button
              type="button"
              disabled={isProcessing}
              onClick={handleGenerateLoveLetter}
              className="flex-1 min-h-[44px] px-5 rounded-xl bg-terracotta text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              <span>{isProcessing ? 'Menyusun...' : 'Lanjut Bayar'}</span>
              <ArrowRight className="size-4" />
            </button>
          )}
          {currentStep === 5 && (
            <button
              type="button"
              disabled={isProcessing}
              onClick={handleProceedToCheckout}
              className="flex-1 min-h-[44px] px-5 rounded-xl bg-terracotta text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              <span>{isProcessing ? 'Menyiapkan...' : 'Bayar Midtrans →'}</span>
            </button>
          )}
        </div>
      </main>
    </div>
  );
};
