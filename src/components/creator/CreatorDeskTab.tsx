import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Video,
  Radio,
  Sparkles,
  Copy,
  Check,
  Plus,
  ShieldCheck,
  Wallet,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Link2,
} from 'lucide-react';
import { loadAuthSession } from '../../lib/auth/dummy-accounts';
import { loadPersistedState, savePersistedState } from '../../lib/navigation/router';
import {
  buildCreatorSmartLink,
  calculateKantongAAmount,
  calculatePph21Estimate,
  INITIAL_DEMO_CREATORS,
  type ContentSubmissionType,
  type CreatorContentMetric,
  type CreatorLedgerEntry,
  type CreatorProfile,
  type CreatorRoleType,
  type LedgerStatus,
} from '../../lib/creator/creator-desk-store';

interface CreatorDeskTabProps {
  projectId: string;
  projectName: string;
  userRole?: string;
}

interface OfflineCreatorStore {
  creators: CreatorProfile[];
  submissions: CreatorContentMetric[];
  ledger: CreatorLedgerEntry[];
}

function getAuthHeaders(): HeadersInit {
  const session = loadAuthSession();
  return {
    'Content-Type': 'application/json',
    ...(session?.token ? { Authorization: `Bearer ${session.token}` } : {}),
  };
}

function formatIdr(n: number): string {
  return `Rp ${Math.round(n).toLocaleString('id-ID')}`;
}

export const CreatorDeskTab: React.FC<CreatorDeskTabProps> = ({
  projectId,
  projectName,
  userRole = 'SM',
}) => {
  const storageKey = `devos_creator_desk_${projectId}`;
  const isVerifier = ['SM', 'ADMIN', 'DIREKSI', 'IT', 'DIGITAL_MARKETING', 'SUPERADMIN', 'SUPERADMIN_IT'].includes(
    userRole
  );

  const [creators, setCreators] = useState<CreatorProfile[]>(() => {
    const saved = loadPersistedState<Partial<OfflineCreatorStore>>(storageKey, {
      creators: INITIAL_DEMO_CREATORS,
      submissions: [],
      ledger: [],
    });
    return Array.isArray(saved?.creators) ? saved.creators : INITIAL_DEMO_CREATORS;
  });
  const [submissions, setSubmissions] = useState<CreatorContentMetric[]>(() => {
    const saved = loadPersistedState<Partial<OfflineCreatorStore>>(storageKey, {
      creators: INITIAL_DEMO_CREATORS,
      submissions: [],
      ledger: [],
    });
    return Array.isArray(saved?.submissions) ? saved.submissions : [];
  });
  const [ledger, setLedger] = useState<CreatorLedgerEntry[]>(() => {
    const saved = loadPersistedState<Partial<OfflineCreatorStore>>(storageKey, {
      creators: INITIAL_DEMO_CREATORS,
      submissions: [],
      ledger: [],
    });
    return Array.isArray(saved?.ledger) ? saved.ledger : [];
  });

  const [toast, setToast] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 3500);
  };

  // Persist offline mirror whenever state updates
  useEffect(() => {
    savePersistedState(storageKey, { creators, submissions, ledger });
  }, [storageKey, creators, submissions, ledger]);

  const loadFromServer = useCallback(async () => {
    try {
      const headers = getAuthHeaders();
      const [cRes, sRes, lRes] = await Promise.all([
        fetch(`/api/creators?projectId=${encodeURIComponent(projectId)}`, { credentials: 'include', headers }),
        fetch(`/api/creator-submissions?projectId=${encodeURIComponent(projectId)}`, {
          credentials: 'include',
          headers,
        }),
        fetch(`/api/creator-ledger?projectId=${encodeURIComponent(projectId)}`, { credentials: 'include', headers }),
      ]);

      if (cRes.ok) {
        const cJson = await cRes.json();
        if (Array.isArray(cJson.creators) && cJson.creators.length > 0) {
          setCreators(
            cJson.creators.map((r: any) => ({
              id: String(r.id),
              creatorCode: String(r.creator_code),
              fullName: String(r.full_name),
              roleType: r.role_type as CreatorRoleType,
              platform: String(r.platform || 'TikTok'),
              socialHandle: String(r.social_handle || ''),
              phoneWa: String(r.phone_wa || ''),
              kycStatus: r.kyc_status || 'TERVERIFIKASI',
              tier: r.tier || 'AKTIF',
              integrityScore: Number(r.integrity_score ?? 100),
              monthlyCapIdr: Number(r.monthly_cap_idr ?? 3000000),
              status: r.status || 'ACTIVE',
              createdAt: String(r.created_at || '').slice(0, 10),
            }))
          );
        }
      }
      if (sRes.ok) {
        const sJson = await sRes.json();
        if (Array.isArray(sJson.submissions)) {
          setSubmissions(
            sJson.submissions.map((r: any) => ({
              id: String(r.id),
              creatorCode: String(r.creator_code),
              contentCode: String(r.content_code),
              contentType: r.content_type as ContentSubmissionType,
              platform: String(r.platform || 'TikTok'),
              contentUrl: String(r.content_url),
              rawViews: Number(r.raw_views || 0),
              verifiedViews: Number(r.verified_views || 0),
              sessionMinutes: Number(r.session_minutes || 0),
              flatFeeIdr: Number(r.flat_fee_idr || 0),
              auditStatus: r.audit_status,
              auditNotes: String(r.audit_notes || ''),
              grossAmountIdr: Number(r.gross_amount_idr || 0),
              cappedAmountIdr: Number(r.capped_amount_idr || 0),
              lockAt: String(r.lock_at || ''),
              verifiedBy: r.verified_by ? String(r.verified_by) : undefined,
              createdAt: String(r.created_at || '').slice(0, 10),
            }))
          );
        }
      }
      if (lRes.ok) {
        const lJson = await lRes.json();
        if (Array.isArray(lJson.entries)) {
          setLedger(
            lJson.entries.map((r: any) => ({
              id: String(r.id),
              creatorCode: String(r.creator_code),
              pocket: r.pocket,
              entryType: r.entry_type,
              referenceId: String(r.reference_id || ''),
              description: String(r.description || ''),
              grossAmountIdr: Number(r.gross_amount_idr || 0),
              taxPphIdr: Number(r.tax_pph_idr || 0),
              netAmountIdr: Number(r.net_amount_idr || 0),
              status: r.status as LedgerStatus,
              approvedBy: r.approved_by ? String(r.approved_by) : undefined,
              createdAt: String(r.created_at || '').slice(0, 10),
            }))
          );
        }
      }
    } catch {
      /* mode offline lokal memakai localStorage */
    }
  }, [projectId]);

  useEffect(() => {
    loadFromServer();
  }, [loadFromServer]);

  // Smart Link Generator state
  const [selectedCreatorCode, setSelectedCreatorCode] = useState(creators?.[0]?.creatorCode || 'AC-RN27');
  const [smartContentCode, setSmartContentCode] = useState('tpth-klip-001');
  const [smartPersona, setSmartPersona] = useState('keluarga');
  const [copiedLink, setCopiedLink] = useState(false);

  const generatedSmartLink = useMemo(() => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://developerproperti.giivepro.com';
    return buildCreatorSmartLink({
      origin,
      slug: projectId,
      creatorCode: selectedCreatorCode,
      contentCode: smartContentCode,
      persona: smartPersona,
    });
  }, [projectId, selectedCreatorCode, smartContentCode, smartPersona]);

  const handleCopySmartLink = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(generatedSmartLink).catch(() => {});
    }
    setCopiedLink(true);
    showToast('Smart Link kreator berhasil disalin!');
    window.setTimeout(() => setCopiedLink(false), 2000);
  };

  // Add Creator form state
  const [showAddCreator, setShowAddCreator] = useState(false);
  const [newCreatorName, setNewCreatorName] = useState('');
  const [newCreatorRole, setNewCreatorRole] = useState<CreatorRoleType>('AFILIATOR_CLIPPER');
  const [newCreatorPlatform, setNewCreatorPlatform] = useState('TikTok');
  const [newCreatorHandle, setNewCreatorHandle] = useState('');
  const [newCreatorPhone, setNewCreatorPhone] = useState('');

  const handleAddCreator = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCreatorName.trim()) return;
    const prefix = newCreatorRole === 'AFILIATOR_LIVE' ? 'AL' : newCreatorRole === 'AFILIATOR_KOL' ? 'AK' : 'AC';
    const code = `${prefix}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

    try {
      const res = await fetch('/api/creators', {
        method: 'POST',
        credentials: 'include',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          projectId,
          creatorCode: code,
          fullName: newCreatorName.trim(),
          roleType: newCreatorRole,
          platform: newCreatorPlatform,
          socialHandle: newCreatorHandle.trim(),
          phoneWa: newCreatorPhone.trim(),
        }),
      });
      if (res.ok) {
        await loadFromServer();
      } else {
        throw new Error('offline');
      }
    } catch {
      const localItem: CreatorProfile = {
        id: `cr-${Date.now()}`,
        creatorCode: code,
        fullName: newCreatorName.trim(),
        roleType: newCreatorRole,
        platform: newCreatorPlatform,
        socialHandle: newCreatorHandle.trim(),
        phoneWa: newCreatorPhone.trim(),
        kycStatus: 'TERVERIFIKASI',
        tier: 'AKTIF',
        integrityScore: 100,
        monthlyCapIdr: newCreatorRole === 'AFILIATOR_CLIPPER' ? 3000000 : 5000000,
        status: 'ACTIVE',
        createdAt: new Date().toISOString().slice(0, 10),
      };
      setCreators((prev) => [localItem, ...prev]);
    }
    setNewCreatorName('');
    setNewCreatorHandle('');
    setNewCreatorPhone('');
    setShowAddCreator(false);
    showToast(`Kreator ${code} berhasil didaftarkan.`);
  };

  // F104 Submission form state
  const [showAddSubmission, setShowAddSubmission] = useState(false);
  const [subCreatorCode, setSubCreatorCode] = useState(creators[0]?.creatorCode || 'AC-RN27');
  const [subContentType, setSubContentType] = useState<ContentSubmissionType>('KLIP');
  const [subContentCode, setSubContentCode] = useState(`tpth-klip-${Math.floor(100 + Math.random() * 899)}`);
  const subPlatform = 'TikTok';
  const [subUrl, setSubUrl] = useState('');
  const [subRawViews, setSubRawViews] = useState(5000);
  const [subSessionMinutes, setSubSessionMinutes] = useState(90);
  const [subFlatFee, setSubFlatFee] = useState(1000000);

  const handleAddSubmission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subUrl.trim()) {
      showToast('URL karya wajib diisi.');
      return;
    }
    try {
      const res = await fetch('/api/creator-submissions', {
        method: 'POST',
        credentials: 'include',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          projectId,
          creatorCode: subCreatorCode,
          contentCode: subContentCode.trim(),
          contentType: subContentType,
          platform: subPlatform,
          contentUrl: subUrl.trim(),
          rawViews: subRawViews,
          verifiedViews: subRawViews,
          sessionMinutes: subSessionMinutes,
          flatFeeIdr: subFlatFee,
        }),
      });
      if (res.ok) {
        await loadFromServer();
      } else {
        throw new Error('offline');
      }
    } catch {
      const lockAt = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString();
      const localSub: CreatorContentMetric = {
        id: `sub-${Date.now()}`,
        creatorCode: subCreatorCode,
        contentCode: subContentCode.trim(),
        contentType: subContentType,
        platform: subPlatform,
        contentUrl: subUrl.trim(),
        rawViews: subRawViews,
        verifiedViews: subRawViews,
        sessionMinutes: subSessionMinutes,
        flatFeeIdr: subFlatFee,
        auditStatus: 'UNDER_REVIEW',
        auditNotes: 'Menunggu audit 7 hari (F104)',
        grossAmountIdr: 0,
        cappedAmountIdr: 0,
        lockAt,
        createdAt: new Date().toISOString().slice(0, 10),
      };
      setSubmissions((prev) => [localSub, ...prev]);
    }
    setSubUrl('');
    setShowAddSubmission(false);
    showToast('Karya diajukan ke antrean verifikasi.');
  };

  const handleVerifySubmission = async (item: CreatorContentMetric, action: 'VERIFY' | 'REJECT') => {
    try {
      const res = await fetch('/api/creator-submissions', {
        method: 'PATCH',
        credentials: 'include',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          id: item.id,
          action,
          verifiedViews: item.verifiedViews || item.rawViews,
          sessionMinutes: item.sessionMinutes,
          flatFeeIdr: item.flatFeeIdr,
        }),
      });
      if (res.ok) {
        await loadFromServer();
        showToast(action === 'VERIFY' ? 'Karya diverifikasi & masuk Ledger Kantong A.' : 'Karya ditolak.');
        return;
      }
      throw new Error('offline');
    } catch {
      if (action === 'REJECT') {
        setSubmissions((prev) =>
          prev.map((s) => (s.id === item.id ? { ...s, auditStatus: 'REJECTED', auditNotes: 'Ditolak saat audit' } : s))
        );
        showToast('Karya ditolak.');
        return;
      }
      const calc = calculateKantongAAmount({
        contentType: item.contentType,
        verifiedViews: item.verifiedViews || item.rawViews,
        sessionMinutes: item.sessionMinutes,
        flatFeeIdr: item.flatFeeIdr,
      });
      setSubmissions((prev) =>
        prev.map((s) =>
          s.id === item.id
            ? {
                ...s,
                auditStatus: 'VERIFIED',
                auditNotes: calc.note,
                grossAmountIdr: calc.grossIdr,
                cappedAmountIdr: calc.cappedIdr,
              }
            : s
        )
      );
      if (calc.cappedIdr > 0) {
        const { taxIdr, netIdr } = calculatePph21Estimate(calc.cappedIdr);
        const entry: CreatorLedgerEntry = {
          id: `led-${Date.now()}`,
          creatorCode: item.creatorCode,
          pocket: 'A',
          entryType: calc.entryType,
          referenceId: item.contentCode,
          description: `Verifikasi ${item.contentType} (${item.contentCode})`,
          grossAmountIdr: calc.cappedIdr,
          taxPphIdr: taxIdr,
          netAmountIdr: netIdr,
          status: 'ACCRUED',
          createdAt: new Date().toISOString().slice(0, 10),
        };
        setLedger((prev) => [entry, ...prev]);
      }
      showToast('Karya diverifikasi & masuk Ledger Kantong A.');
    }
  };

  const handleUpdateLedgerStatus = async (id: string, status: LedgerStatus) => {
    try {
      const res = await fetch('/api/creator-ledger', {
        method: 'PATCH',
        credentials: 'include',
        headers: getAuthHeaders(),
        body: JSON.stringify({ id, status }),
      });
      if (res.ok) {
        await loadFromServer();
        showToast(`Status ledger diperbarui menjadi ${status}.`);
        return;
      }
      throw new Error('offline');
    } catch {
      setLedger((prev) => prev.map((l) => (l.id === id ? { ...l, status } : l)));
      showToast(`Status ledger diperbarui menjadi ${status}.`);
    }
  };

  const totalPocketA = useMemo(
    () =>
      ledger
        .filter((l) => l.pocket === 'A' && l.status !== 'REVERSED')
        .reduce((acc, l) => acc + l.netAmountIdr, 0),
    [ledger]
  );
  const totalPocketB = useMemo(
    () =>
      ledger
        .filter((l) => l.pocket === 'B' && l.status !== 'REVERSED')
        .reduce((acc, l) => acc + l.netAmountIdr, 0),
    [ledger]
  );

  return (
    <div className="space-y-5">
      {toast && (
        <div className="fixed bottom-20 md:bottom-6 right-4 z-50 bg-espresso text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-lg">
          {toast}
        </div>
      )}

      {/* Ringkasan & Smart Link Generator Kreator */}
      <div className="bg-white border border-warmborder rounded-2xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-terracotta">
              Creator Desk · Clipper, Live Streaming &amp; KOL ({projectName})
            </span>
            <h3 className="text-base font-bold text-espresso mt-0.5">
              Smart Link Kreator &amp; Atribusi 90 Hari
            </h3>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setShowAddCreator((v) => !v)}
              className="h-9 px-3.5 rounded-lg bg-sandstone hover:bg-warmborder text-espresso text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="size-3.5" />
              <span>Tambah Kreator</span>
            </button>
            <button
              type="button"
              onClick={() => setShowAddSubmission((v) => !v)}
              className="h-9 px-3.5 rounded-lg bg-terracotta hover:bg-terracotta/90 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <Link2 className="size-3.5" />
              <span>Ajukan URL Karya</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-2">
          <div>
            <label className="block text-[11px] font-semibold text-warmmuted mb-1">Kreator (k=)</label>
            <select
              value={selectedCreatorCode}
              onChange={(e) => setSelectedCreatorCode(e.target.value)}
              className="w-full h-9 px-2.5 rounded-lg border border-warmborder bg-sandstone/40 text-xs text-espresso"
            >
              {creators.map((c) => (
                <option key={c.id} value={c.creatorCode}>
                  {c.creatorCode} · {c.fullName}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-warmmuted mb-1">Kode Konten (c=)</label>
            <input
              type="text"
              value={smartContentCode}
              onChange={(e) => setSmartContentCode(e.target.value)}
              className="w-full h-9 px-2.5 rounded-lg border border-warmborder bg-sandstone/40 text-xs text-espresso font-mono"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-warmmuted mb-1">Persona</label>
            <select
              value={smartPersona}
              onChange={(e) => setSmartPersona(e.target.value)}
              className="w-full h-9 px-2.5 rounded-lg border border-warmborder bg-sandstone/40 text-xs text-espresso"
            >
              <option value="keluarga">keluarga (P1)</option>
              <option value="pengusaha">pengusaha (P2)</option>
              <option value="nakes">nakes (P3)</option>
              <option value="perantau">perantau (P4)</option>
              <option value="upgrader">upgrader (P5)</option>
              <option value="orangtua">orangtua (P6)</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              type="button"
              onClick={handleCopySmartLink}
              className="w-full h-9 px-3 rounded-lg bg-espresso hover:bg-espresso/90 text-white text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {copiedLink ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
              <span>{copiedLink ? 'Tersalin' : 'Salin Smart Link'}</span>
            </button>
          </div>
        </div>
        <div className="px-3 py-2 rounded-lg bg-sandstone/60 border border-warmborder font-mono text-[11px] text-espresso truncate">
          {generatedSmartLink}
        </div>
      </div>

      {/* KPI Ringkas Kreator & Dua Kantong */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white border border-warmborder rounded-xl p-4">
          <span className="text-[11px] text-warmmuted block">Kreator Aktif</span>
          <span className="text-xl font-bold text-espresso mt-1 block">{creators.length} Akun</span>
        </div>
        <div className="bg-white border border-warmborder rounded-xl p-4">
          <span className="text-[11px] text-warmmuted block">Karya Diajukan</span>
          <span className="text-xl font-bold text-espresso mt-1 block">{submissions.length} Karya</span>
        </div>
        <div className="bg-white border border-warmborder rounded-xl p-4">
          <span className="text-[11px] text-warmmuted block">Kantong A (Biaya Konten Netto)</span>
          <span className="text-xl font-bold text-terracotta mt-1 block">{formatIdr(totalPocketA)}</span>
        </div>
        <div className="bg-white border border-warmborder rounded-xl p-4">
          <span className="text-[11px] text-warmmuted block">Kantong B (Source Fee 0,30%)</span>
          <span className="text-xl font-bold text-olive mt-1 block">{formatIdr(totalPocketB)}</span>
        </div>
      </div>

      {/* Form Tambah Kreator */}
      {showAddCreator && (
        <form onSubmit={handleAddCreator} className="bg-white border border-warmborder rounded-2xl p-5 space-y-3">
          <h4 className="text-sm font-bold text-espresso">Registrasi Kreator Baru (Clipper / Live / KOL)</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <input
              type="text"
              placeholder="Nama Lengkap"
              value={newCreatorName}
              onChange={(e) => setNewCreatorName(e.target.value)}
              className="h-9 px-3 rounded-lg border border-warmborder text-xs"
              required
            />
            <select
              value={newCreatorRole}
              onChange={(e) => setNewCreatorRole(e.target.value as CreatorRoleType)}
              className="h-9 px-3 rounded-lg border border-warmborder text-xs"
            >
              <option value="AFILIATOR_CLIPPER">Afiliator Clipper (AC-)</option>
              <option value="AFILIATOR_LIVE">Afiliator Live (AL-)</option>
              <option value="AFILIATOR_KOL">KOL (AK-)</option>
            </select>
            <input
              type="text"
              placeholder="Platform (TikTok / IG / YT)"
              value={newCreatorPlatform}
              onChange={(e) => setNewCreatorPlatform(e.target.value)}
              className="h-9 px-3 rounded-lg border border-warmborder text-xs"
            />
            <input
              type="text"
              placeholder="Handle (@akun)"
              value={newCreatorHandle}
              onChange={(e) => setNewCreatorHandle(e.target.value)}
              className="h-9 px-3 rounded-lg border border-warmborder text-xs"
            />
            <input
              type="text"
              placeholder="No. WhatsApp"
              value={newCreatorPhone}
              onChange={(e) => setNewCreatorPhone(e.target.value)}
              className="h-9 px-3 rounded-lg border border-warmborder text-xs"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowAddCreator(false)}
              className="h-8 px-3 rounded-lg border border-warmborder text-xs text-warmmuted cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="h-8 px-4 rounded-lg bg-espresso text-white text-xs font-semibold cursor-pointer"
            >
              Simpan Kreator
            </button>
          </div>
        </form>
      )}

      {/* Form Pengajuan Karya (F104) */}
      {showAddSubmission && (
        <form onSubmit={handleAddSubmission} className="bg-white border border-warmborder rounded-2xl p-5 space-y-3">
          <h4 className="text-sm font-bold text-espresso">Ajukan URL Karya / Sesi Live</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <select
              value={subCreatorCode}
              onChange={(e) => setSubCreatorCode(e.target.value)}
              className="h-9 px-3 rounded-lg border border-warmborder text-xs"
            >
              {creators.map((c) => (
                <option key={c.id} value={c.creatorCode}>
                  {c.creatorCode} · {c.fullName}
                </option>
              ))}
            </select>
            <select
              value={subContentType}
              onChange={(e) => setSubContentType(e.target.value as ContentSubmissionType)}
              className="h-9 px-3 rounded-lg border border-warmborder text-xs"
            >
              <option value="KLIP">Klip Pendek (Rp3.000/1.000 view, maks Rp300rb)</option>
              <option value="LIVE">Sesi Live (Rp100.000/jam, maks 120 mnt)</option>
              <option value="KOL">Karya KOL (Flat Fee Kontrak)</option>
            </select>
            <input
              type="text"
              placeholder="Kode Konten (mis. tpth-klip-012)"
              value={subContentCode}
              onChange={(e) => setSubContentCode(e.target.value)}
              className="h-9 px-3 rounded-lg border border-warmborder text-xs font-mono"
            />
            <input
              type="url"
              placeholder="URL Postingan / Rekaman Live (https://...)"
              value={subUrl}
              onChange={(e) => setSubUrl(e.target.value)}
              className="h-9 px-3 rounded-lg border border-warmborder text-xs lg:col-span-2"
              required
            />
            {subContentType === 'KLIP' && (
              <input
                type="number"
                min={0}
                placeholder="View Mentah"
                value={subRawViews}
                onChange={(e) => setSubRawViews(Number(e.target.value))}
                className="h-9 px-3 rounded-lg border border-warmborder text-xs"
              />
            )}
            {subContentType === 'LIVE' && (
              <input
                type="number"
                min={0}
                placeholder="Durasi Sesi (menit)"
                value={subSessionMinutes}
                onChange={(e) => setSubSessionMinutes(Number(e.target.value))}
                className="h-9 px-3 rounded-lg border border-warmborder text-xs"
              />
            )}
            {subContentType === 'KOL' && (
              <input
                type="number"
                min={0}
                placeholder="Flat Fee Kontrak (Rp)"
                value={subFlatFee}
                onChange={(e) => setSubFlatFee(Number(e.target.value))}
                className="h-9 px-3 rounded-lg border border-warmborder text-xs"
              />
            )}
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowAddSubmission(false)}
              className="h-8 px-3 rounded-lg border border-warmborder text-xs text-warmmuted cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="h-8 px-4 rounded-lg bg-terracotta text-white text-xs font-semibold cursor-pointer"
            >
              Kirim untuk Audit 7 Hari
            </button>
          </div>
        </form>
      )}

      {/* Direktori Kreator */}
      <div className="bg-white border border-warmborder rounded-2xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-warmborder flex items-center justify-between">
          <h4 className="text-sm font-bold text-espresso flex items-center gap-2">
            <Sparkles className="size-4 text-terracotta" />
            <span>Direktori Kreator (Clipper, Live Host &amp; KOL)</span>
          </h4>
          <span className="text-[11px] text-warmmuted">Tanpa bobot jumlah pengikut</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-sandstone/50 text-[11px] text-warmmuted uppercase">
              <tr>
                <th className="py-2.5 px-4">Kode</th>
                <th className="py-2.5 px-3">Nama &amp; Handle</th>
                <th className="py-2.5 px-3">Peran</th>
                <th className="py-2.5 px-3">Jenjang &amp; Integritas</th>
                <th className="py-2.5 px-4 text-right">Pagu / Bln</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-warmborder">
              {creators.map((c) => (
                <tr key={c.id} className="hover:bg-sandstone/30">
                  <td className="py-2.5 px-4 font-mono font-bold text-espresso">{c.creatorCode}</td>
                  <td className="py-2.5 px-3">
                    <span className="font-semibold text-espresso block">{c.fullName}</span>
                    <span className="text-[11px] text-warmmuted">
                      {c.platform} {c.socialHandle}
                    </span>
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-sandstone text-espresso font-medium text-[11px]">
                      {c.roleType === 'AFILIATOR_LIVE' ? (
                        <Radio className="size-3 text-rose-600" />
                      ) : c.roleType === 'AFILIATOR_KOL' ? (
                        <Sparkles className="size-3 text-amber-600" />
                      ) : (
                        <Video className="size-3 text-terracotta" />
                      )}
                      {c.roleType.replace('AFILIATOR_', '')}
                    </span>
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="font-semibold text-olive">{c.tier}</span> · Skor {c.integrityScore}
                  </td>
                  <td className="py-2.5 px-4 text-right font-semibold tabular-nums">{formatIdr(c.monthlyCapIdr)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Antrean Verifikasi F104 */}
      <div className="bg-white border border-warmborder rounded-2xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-warmborder flex items-center justify-between">
          <h4 className="text-sm font-bold text-espresso flex items-center gap-2">
            <ShieldCheck className="size-4 text-olive" />
            <span>Antrean Verifikasi Karya</span>
          </h4>
          <span className="text-[11px] text-warmmuted">Audit 7 hari · Pagu Rp300rb/klip</span>
        </div>
        {submissions.length === 0 ? (
          <div className="p-6 text-center text-xs text-warmmuted">
            Belum ada URL karya diajukan. Klik <strong>Ajukan URL Karya</strong> untuk memulai.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-sandstone/50 text-[11px] text-warmmuted uppercase">
                <tr>
                  <th className="py-2.5 px-4">Kreator / Kode</th>
                  <th className="py-2.5 px-3">Jenis &amp; URL</th>
                  <th className="py-2.5 px-3">Metrik</th>
                  <th className="py-2.5 px-3">Hak Kantong A</th>
                  <th className="py-2.5 px-3">Status</th>
                  {isVerifier && <th className="py-2.5 px-4 text-right">Aksi Audit</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-warmborder">
                {submissions.map((s) => (
                  <tr key={s.id} className="hover:bg-sandstone/30">
                    <td className="py-2.5 px-4 font-mono">
                      <span className="font-bold text-espresso block">{s.creatorCode}</span>
                      <span className="text-[11px] text-warmmuted">{s.contentCode}</span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="font-semibold text-espresso block">
                        {s.contentType} · {s.platform}
                      </span>
                      <a
                        href={s.contentUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] text-terracotta hover:underline truncate max-w-[200px]"
                      >
                        <ExternalLink className="size-3 shrink-0" />
                        <span className="truncate">{s.contentUrl}</span>
                      </a>
                    </td>
                    <td className="py-2.5 px-3 tabular-nums">
                      {s.contentType === 'KLIP' && `${(s.verifiedViews || s.rawViews).toLocaleString('id-ID')} view`}
                      {s.contentType === 'LIVE' && `${s.sessionMinutes} menit`}
                      {s.contentType === 'KOL' && formatIdr(s.flatFeeIdr)}
                    </td>
                    <td className="py-2.5 px-3 font-semibold tabular-nums">
                      {s.cappedAmountIdr > 0 ? formatIdr(s.cappedAmountIdr) : '-'}
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          s.auditStatus === 'VERIFIED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : s.auditStatus === 'REJECTED'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {s.auditStatus}
                      </span>
                    </td>
                    {isVerifier && (
                      <td className="py-2.5 px-4 text-right">
                        {s.auditStatus === 'UNDER_REVIEW' || s.auditStatus === 'SUBMITTED' ? (
                          <div className="inline-flex gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleVerifySubmission(s, 'VERIFY')}
                              className="px-2.5 py-1 rounded-lg bg-olive text-white text-[11px] font-semibold inline-flex items-center gap-1 cursor-pointer"
                            >
                              <CheckCircle2 className="size-3" /> Sah
                            </button>
                            <button
                              type="button"
                              onClick={() => handleVerifySubmission(s, 'REJECT')}
                              className="px-2.5 py-1 rounded-lg bg-rose-100 text-rose-800 text-[11px] font-semibold inline-flex items-center gap-1 cursor-pointer"
                            >
                              <XCircle className="size-3" /> Tolak
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-warmmuted">{s.auditNotes || 'Selesai'}</span>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Ledger Dua Kantong (7 Status RSP) */}
      <div className="bg-white border border-warmborder rounded-2xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-warmborder flex items-center justify-between">
          <h4 className="text-sm font-bold text-espresso flex items-center gap-2">
            <Wallet className="size-4 text-terracotta" />
            <span>Ledger Kreator</span>
          </h4>
          <span className="text-[11px] text-warmmuted">Estimasi PPh 21 (2,5% bruto)</span>
        </div>
        {ledger.length === 0 ? (
          <div className="p-6 text-center text-xs text-warmmuted">
            Belum ada entri ledger. Verifikasi karya di atas untuk menerbitkan entri Kantong A.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-sandstone/50 text-[11px] text-warmmuted uppercase">
                <tr>
                  <th className="py-2.5 px-4">Kreator</th>
                  <th className="py-2.5 px-3">Kantong / Jenis</th>
                  <th className="py-2.5 px-3">Bruto</th>
                  <th className="py-2.5 px-3">PPh</th>
                  <th className="py-2.5 px-3">Netto</th>
                  <th className="py-2.5 px-3">Status</th>
                  {isVerifier && <th className="py-2.5 px-4 text-right">Ubah Status</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-warmborder">
                {ledger.map((l) => (
                  <tr key={l.id} className="hover:bg-sandstone/30">
                    <td className="py-2.5 px-4 font-mono font-bold text-espresso">{l.creatorCode}</td>
                    <td className="py-2.5 px-3">
                      <span className="font-semibold">Kantong {l.pocket}</span> · {l.entryType}
                      <span className="block text-[11px] text-warmmuted">{l.description}</span>
                    </td>
                    <td className="py-2.5 px-3 tabular-nums">{formatIdr(l.grossAmountIdr)}</td>
                    <td className="py-2.5 px-3 tabular-nums text-warmmuted">{formatIdr(l.taxPphIdr)}</td>
                    <td className="py-2.5 px-3 tabular-nums font-bold text-espresso">{formatIdr(l.netAmountIdr)}</td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded-full bg-sandstone text-espresso text-[10px] font-bold">
                        {l.status}
                      </span>
                    </td>
                    {isVerifier && (
                      <td className="py-2.5 px-4 text-right">
                        <select
                          value={l.status}
                          onChange={(e) => handleUpdateLedgerStatus(l.id, e.target.value as LedgerStatus)}
                          className="h-7 px-2 rounded-lg border border-warmborder text-[11px] bg-white"
                        >
                          <option value="ESTIMATE">ESTIMATE</option>
                          <option value="PENDING">PENDING</option>
                          <option value="ACCRUED">ACCRUED</option>
                          <option value="ON_HOLD">ON_HOLD</option>
                          <option value="APPROVED">APPROVED</option>
                          <option value="PAID">PAID</option>
                          <option value="REVERSED">REVERSED</option>
                        </select>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
