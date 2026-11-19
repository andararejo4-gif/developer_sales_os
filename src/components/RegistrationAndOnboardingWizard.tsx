import React, { useState, useEffect } from 'react';
import { X, ArrowRight, ArrowLeft, CheckCircle2, Building2, Users, Share2, Sparkles } from 'lucide-react';
import { OrgProfile, OrgRoleItem, computeEffectiveFeatures } from '../lib/org/adaptation-engine';

interface RegistrationProps {
  isOpen: boolean;
  onClose: () => void;
  onCompleteRegistration: (tenantData: any) => void;
}

const DRAFT_STORAGE_KEY = 'devos_registration_draft_v1';

export const RegistrationAndOnboardingWizard: React.FC<RegistrationProps> = ({
  isOpen,
  onClose,
  onCompleteRegistration
}) => {
  const [step, setStep] = useState<number>(1); // 1: Akun, 2: Kuesioner, 3: Konfirmasi & Masuk Proyek

  // (1) Akun
  const [accountData, setAccountData] = useState({
    name: 'Bambang Soedirjo',
    email: 'bambang.owner@andararejo.com',
    password: 'password123',
    phone: '081234567890'
  });

  // (2) Kuesioner Bagian A: Profil Perusahaan
  const [companyProfile, setCompanyProfile] = useState<OrgProfile>({
    company_name: 'PT Andara Rejo Makmur',
    headquarters_city: 'Sukoharjo',
    employee_count_range: '16-50',
    active_projects_count: 1,
    social_channels: ['instagram', 'tiktok', 'facebook'],
    has_official_social: true,
    has_website: true,
    lead_tool: 'excel',
    monthly_sales_target_range: 'Rp 2 Milyar - Rp 5 Milyar',
    monthly_ad_budget_range: 'Rp 10 Juta - Rp 25 Juta'
  });

  // (2) Kuesioner Bagian B & D: Struktur Tim & Pilihan AI
  const [rolesConfig, setRolesConfig] = useState<OrgRoleItem[]>([
    { role_key: 'SALES_EXECUTIVE', enabled: true, headcount: 3, ai_mode: 'semi_ai', custom_label: 'Sales Executive In-House' },
    { role_key: 'TEAM_LEADER', enabled: true, headcount: 1, ai_mode: 'full_ai', custom_label: 'Team Leader' },
    { role_key: 'SALES_MANAGER', enabled: true, headcount: 1, ai_mode: 'semi_ai', custom_label: 'Sales Manager' },
    { role_key: 'ADMIN', enabled: true, headcount: 1, ai_mode: 'human_only', custom_label: 'Admin Penjualan' },
    { role_key: 'DIGITAL_MARKETING', enabled: true, headcount: 1, ai_mode: 'semi_ai', custom_label: 'Digital Marketer' },
    { role_key: 'FREELANCE_AGENT', enabled: false, headcount: 0, ai_mode: 'human_only', custom_label: 'Freelance Agent' },
    { role_key: 'AFFILIATOR', enabled: false, headcount: 0, ai_mode: 'human_only', custom_label: 'Affiliator' },
  ]);

  // Muat draft sementara jika ada
  useEffect(() => {
    try {
      const draft = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (draft) {
        const parsed = JSON.parse(draft);
        if (parsed.accountData) setAccountData(parsed.accountData);
        if (parsed.companyProfile) setCompanyProfile(parsed.companyProfile);
        if (parsed.rolesConfig) setRolesConfig(parsed.rolesConfig);
      }
    } catch {
      // ignore
    }
  }, []);

  // Simpan draft setiap ada perubahan
  useEffect(() => {
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify({ accountData, companyProfile, rolesConfig }));
  }, [accountData, companyProfile, rolesConfig]);

  if (!isOpen) return null;

  const handleRoleToggle = (key: string) => {
    setRolesConfig(prev => prev.map(r => r.role_key === key ? { ...r, enabled: !r.enabled } : r));
  };

  const handleHeadcountChange = (key: string, count: number) => {
    setRolesConfig(prev => prev.map(r => r.role_key === key ? { ...r, headcount: Math.max(0, count) } : r));
  };

  const handleAiModeChange = (key: string, mode: 'human_only' | 'semi_ai' | 'full_ai') => {
    setRolesConfig(prev => prev.map(r => r.role_key === key ? { ...r, ai_mode: mode } : r));
  };

  const handleSocialToggle = (channel: string) => {
    setCompanyProfile(prev => {
      const exists = prev.social_channels.includes(channel);
      return {
        ...prev,
        social_channels: exists 
          ? prev.social_channels.filter(c => c !== channel)
          : [...prev.social_channels, channel]
      };
    });
  };

  const effectiveFeatures = computeEffectiveFeatures('diamond', companyProfile, rolesConfig);

  const canProceedStep1 = 
    accountData.name.trim() !== '' && 
    accountData.email.trim() !== '' && 
    accountData.password.trim() !== '';

  const canProceedStep2 = 
    companyProfile.company_name.trim() !== '' && 
    companyProfile.employee_count_range !== undefined;

  const handleSubmitAll = () => {
    localStorage.removeItem(DRAFT_STORAGE_KEY);
    onCompleteRegistration({
      account: accountData,
      profile: companyProfile,
      roles: rolesConfig,
      effectiveFeatures
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-espresso/70 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-2xl bg-white border border-warmborder rounded-2xl shadow-2xl overflow-hidden my-6 animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="p-5 border-b border-warmborder bg-sandstone/50 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="size-6 rounded-md bg-terracotta text-white font-extrabold text-xs grid place-items-center">
                {step}
              </span>
              <h2 className="text-base font-bold text-espresso">
                Pendaftaran Developer &amp; Adaptasi Organisasi
              </h2>
            </div>
            <p className="text-xs text-warmmuted mt-0.5">
              Langkah {step} dari 3 &middot; Akun otomatis aktif dalam mode Demo 30 Hari
            </p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-warmmuted hover:text-espresso cursor-pointer">
            <X className="size-5" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-1 bg-warmborder">
          <div 
            className="h-full bg-terracotta transition-all duration-300"
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>

        {/* Content Body */}
        <div className="p-6 max-h-[72vh] overflow-y-auto space-y-5">
          {/* STEP 1: DATA AKUN */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-terracotta flex items-start gap-2">
                <Sparkles className="size-4 shrink-0 mt-0.5" />
                <span>Akun pertama otomatis menjadi <strong>DEVELOPER_OWNER</strong> dengan wewenang penuh atas seluruh proyek.</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-espresso mb-1">Nama Lengkap Pemilik / Direksi (*)</label>
                <input
                  type="text"
                  required
                  value={accountData.name}
                  onChange={e => setAccountData({ ...accountData, name: e.target.value })}
                  className="w-full h-10 px-3 rounded-xl border border-warmborder text-xs focus:border-terracotta focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-espresso mb-1">Email Perusahaan / Login (*)</label>
                <input
                  type="email"
                  required
                  value={accountData.email}
                  onChange={e => setAccountData({ ...accountData, email: e.target.value })}
                  className="w-full h-10 px-3 rounded-xl border border-warmborder text-xs focus:border-terracotta focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-espresso mb-1">Kata Sandi (*)</label>
                  <input
                    type="password"
                    required
                    value={accountData.password}
                    onChange={e => setAccountData({ ...accountData, password: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl border border-warmborder text-xs focus:border-terracotta focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-espresso mb-1">Nomor WhatsApp (*)</label>
                  <input
                    type="tel"
                    required
                    value={accountData.phone}
                    onChange={e => setAccountData({ ...accountData, phone: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl border border-warmborder text-xs focus:border-terracotta focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: KUESIONER ADAPTASI ORGANISASI */}
          {step === 2 && (
            <div className="space-y-6">
              {/* Bagian A: Profil Perusahaan */}
              <div className="space-y-3 pb-5 border-b border-warmborder">
                <h3 className="text-xs font-bold uppercase tracking-wider text-terracotta flex items-center gap-1.5">
                  <Building2 className="size-4" /> A. Profil Perusahaan Pengembang
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-espresso mb-1">Nama Legal Developer / PT (*)</label>
                    <input
                      type="text"
                      required
                      value={companyProfile.company_name}
                      onChange={e => setCompanyProfile({ ...companyProfile, company_name: e.target.value })}
                      className="w-full h-9 px-3 rounded-lg border border-warmborder text-xs font-semibold focus:border-terracotta focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-espresso mb-1">Kota Kantor Pusat</label>
                    <input
                      type="text"
                      value={companyProfile.headquarters_city}
                      onChange={e => setCompanyProfile({ ...companyProfile, headquarters_city: e.target.value })}
                      className="w-full h-9 px-3 rounded-lg border border-warmborder text-xs focus:border-terracotta focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-espresso mb-1">Jumlah Karyawan Total (*)</label>
                    <select
                      value={companyProfile.employee_count_range}
                      onChange={e => setCompanyProfile({ ...companyProfile, employee_count_range: e.target.value as any })}
                      className="w-full h-9 px-2.5 rounded-lg border border-warmborder text-xs bg-sandstone/30 focus:border-terracotta focus:outline-none"
                    >
                      <option value="1-5">1 - 5 Orang (Tim Ringkas)</option>
                      <option value="6-15">6 - 15 Orang (Bertumbuh)</option>
                      <option value="16-50">16 - 50 Orang (Menengah)</option>
                      <option value="51-100">51 - 100 Orang (Korporasi)</option>
                      <option value=">100">&gt; 100 Orang (Enterprise)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-espresso mb-1">Jumlah Proyek yang Sedang Dipasarkan</label>
                    <input
                      type="number"
                      min={1}
                      value={companyProfile.active_projects_count}
                      onChange={e => setCompanyProfile({ ...companyProfile, active_projects_count: parseInt(e.target.value, 10) || 1 })}
                      className="w-full h-9 px-3 rounded-lg border border-warmborder text-xs focus:border-terracotta focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Bagian B & D: Struktur Tim & Pilihan AI */}
              <div className="space-y-3 pb-5 border-b border-warmborder">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-terracotta flex items-center gap-1.5">
                    <Users className="size-4" /> B &amp; D. Struktur Tim &amp; Peran AI
                  </h3>
                  <span className="text-[11px] text-warmmuted">Centang role yang aktif</span>
                </div>

                <div className="space-y-2 text-xs">
                  {rolesConfig.map(r => (
                    <div key={r.role_key} className={`p-3 rounded-xl border transition-all ${
                      r.enabled ? 'bg-white border-warmborder shadow-2xs' : 'bg-sandstone/30 border-warmborder/60 opacity-60'
                    }`}>
                      <div className="flex items-center justify-between gap-2">
                        <label className="flex items-center gap-2 font-bold text-espresso cursor-pointer">
                          <input
                            type="checkbox"
                            checked={r.enabled}
                            onChange={() => handleRoleToggle(r.role_key)}
                            className="size-4 rounded accent-terracotta"
                          />
                          <span>{r.custom_label}</span>
                        </label>

                        {r.enabled && (
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1">
                              <span className="text-[11px] text-warmmuted">Jumlah:</span>
                              <input
                                type="number"
                                min={1}
                                value={r.headcount}
                                onChange={e => handleHeadcountChange(r.role_key, parseInt(e.target.value, 10) || 1)}
                                className="w-14 h-7 text-center rounded border border-warmborder text-xs font-bold"
                              />
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-[11px] text-warmmuted">Mode:</span>
                              <select
                                value={r.ai_mode}
                                onChange={e => handleAiModeChange(r.role_key, e.target.value as any)}
                                className="h-7 px-1.5 rounded border border-warmborder text-[11px] bg-sandstone"
                              >
                                <option value="human_only">Manusia</option>
                                <option value="semi_ai">Semi-AI</option>
                                <option value="full_ai">Full AI</option>
                              </select>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bagian C: Kanal Media Sosial */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-terracotta flex items-center gap-1.5">
                  <Share2 className="size-4" /> C. Kanal Pemasaran &amp; Media Sosial
                </h3>
                <div className="flex flex-wrap gap-2 text-xs">
                  {['instagram', 'tiktok', 'facebook', 'youtube_short', 'x_twitter'].map(ch => (
                    <button
                      type="button"
                      key={ch}
                      onClick={() => handleSocialToggle(ch)}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-semibold capitalize transition-colors cursor-pointer ${
                        companyProfile.social_channels.includes(ch)
                          ? 'bg-espresso text-white border-espresso'
                          : 'bg-sandstone text-espresso border-warmborder'
                      }`}
                    >
                      {ch.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: HASIL ADAPTASI SISTEM & KONFIRMASI */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-lime-50 border border-lime-300 text-xs text-olive space-y-1">
                <div className="flex items-center gap-2 font-bold text-sm">
                  <CheckCircle2 className="size-4" />
                  <span>Sistem Berhasil Menyesuaikan Diri dengan Organisasi Anda!</span>
                </div>
                <p className="text-[11px] text-olive/90">
                  Mesin <code>effective_features()</code> telah mengatur konfigurasi navigasi, target per sales, dan hierarki supervisi.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-white border border-warmborder space-y-3 text-xs">
                <div className="flex justify-between pb-2 border-b border-warmborder">
                  <span className="text-warmmuted">Pengembang:</span>
                  <strong className="text-espresso">{companyProfile.company_name}</strong>
                </div>
                <div className="flex justify-between pb-2 border-b border-warmborder">
                  <span className="text-warmmuted">Struktur Hierarki:</span>
                  <strong className="text-terracotta font-mono uppercase">{effectiveFeatures.hierarchy_type}</strong>
                </div>
                <div className="flex justify-between pb-2 border-b border-warmborder">
                  <span className="text-warmmuted">Target Rutinitas per SE:</span>
                  <strong className="text-espresso">{effectiveFeatures.target_per_se.monthly_units} Unit / Bln ({effectiveFeatures.target_per_se.daily_calls} Call, {effectiveFeatures.target_per_se.daily_chats} Chat)</strong>
                </div>
                <div className="flex justify-between pb-2 border-b border-warmborder">
                  <span className="text-warmmuted">Mode Supervisi TL:</span>
                  <strong className="text-espresso">{effectiveFeatures.tl_mode}</strong>
                </div>
                <div className="flex justify-between pb-2 border-b border-warmborder">
                  <span className="text-warmmuted">Rekomendasi Paket:</span>
                  <span className="px-2 py-0.5 rounded bg-amber-100 text-terracotta font-bold uppercase">{effectiveFeatures.recommended_plan}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-warmmuted">Status Akun Awal:</span>
                  <span className="px-2 py-0.5 rounded bg-lime-100 text-olive font-bold">DEMO 30 HARI</span>
                </div>
              </div>

              <p className="text-[11px] text-warmmuted italic">
                *Begitu Anda menekan tombol di bawah, akun tenant dibuat dan Anda akan langsung diarahkan ke wizard pembuatan proyek pertama untuk mengunggah berkas dan mendapatkan Surat Cinta 99 Keunggulan.
              </p>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="p-4 border-t border-warmborder bg-sandstone/50 flex items-center justify-between">
          {step > 1 ? (
            <button
              onClick={() => setStep(prev => prev - 1)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-espresso hover:bg-white flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="size-3.5" />
              <span>Sebelumnya</span>
            </button>
          ) : <div />}

          {step === 1 && (
            <button
              disabled={!canProceedStep1}
              onClick={() => setStep(2)}
              className="px-5 py-2.5 rounded-xl bg-terracotta text-white text-xs font-bold hover:bg-terracotta/90 flex items-center gap-1.5 ml-auto disabled:opacity-50 cursor-pointer shadow-xs"
            >
              <span>Lanjut: Kuesioner Organisasi</span>
              <ArrowRight className="size-3.5" />
            </button>
          )}

          {step === 2 && (
            <button
              disabled={!canProceedStep2}
              onClick={() => setStep(3)}
              className="px-5 py-2.5 rounded-xl bg-terracotta text-white text-xs font-bold hover:bg-terracotta/90 flex items-center gap-1.5 ml-auto disabled:opacity-50 cursor-pointer shadow-xs"
            >
              <span>Tinjau Adaptasi Sistem</span>
              <ArrowRight className="size-3.5" />
            </button>
          )}

          {step === 3 && (
            <button
              onClick={handleSubmitAll}
              className="px-6 py-2.5 rounded-xl bg-terracotta text-white text-xs font-bold hover:bg-terracotta/90 flex items-center gap-1.5 ml-auto cursor-pointer shadow-xs"
            >
              <Sparkles className="size-4 text-amber-300" />
              <span>Buat Akun &amp; Lanjut Proyek Pertama</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
