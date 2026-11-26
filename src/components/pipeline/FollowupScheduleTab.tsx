import { useEffect, useState } from 'react';
import {
  CalendarClock,
  CheckCheck,
  Edit3,
  MessageSquare,
  Pause,
  Play,
  RefreshCw,
  Send,
  Settings2,
  Sparkles,
} from 'lucide-react';

export interface FollowupLeadSummary {
  id: string;
  full_name: string;
  phone_wa: string;
  unit_interest: string;
  stage: string;
  lead_quality?: string;
  last_activity_at?: string;
  created_at?: string;
}

interface NurtureJob {
  id: string;
  step_code: string;
  step_label?: string;
  scheduled_at: string;
  draft_message: string;
  is_edited_by_se: boolean;
  status: string;
  sent_at?: string | null;
}

interface RecentChatTurn {
  direction: string;
  body: string;
  createdAt?: string | null;
}

type NurtureTone = 'santai' | 'value' | 'finansial' | 'singkat';

const TONE_OPTIONS: Array<{ id: NurtureTone; label: string }> = [
  { id: 'santai', label: 'Santai & Akrab' },
  { id: 'value', label: 'Story & Value Lokasi' },
  { id: 'finansial', label: 'Bantu Hitungan' },
  { id: 'singkat', label: 'Check-in Singkat' },
];

interface CadenceTemplate {
  step_code: string;
  step_label: string;
  delay_hours: number;
  step_goal: string;
  auto_send: boolean;
  is_active: boolean;
}

function toLocalInput(iso?: string): string {
  const d = iso ? new Date(iso) : new Date();
  if (Number.isNaN(d.getTime())) return '';
  const offset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - offset).toISOString().slice(0, 16);
}

export function FollowupScheduleTab({
  leads,
  initialLeadId,
  waConnected,
  waPhoneNumber,
}: {
  leads: FollowupLeadSummary[];
  initialLeadId?: string | null;
  waConnected: boolean;
  waPhoneNumber?: string | null;
}) {
  const activeLeads = leads.filter((l) => l.lead_quality !== 'JUNK');
  const [selectedLeadId, setSelectedLeadId] = useState<string>(() => {
    if (initialLeadId && activeLeads.some((l) => l.id === initialLeadId)) return initialLeadId;
    return activeLeads[0]?.id || '';
  });

  useEffect(() => {
    if (initialLeadId && activeLeads.some((l) => l.id === initialLeadId)) {
      setSelectedLeadId(initialLeadId);
    } else if (!selectedLeadId && activeLeads[0]?.id) {
      setSelectedLeadId(activeLeads[0].id);
    }
  }, [initialLeadId, leads]);

  const selectedLead = activeLeads.find((l) => l.id === selectedLeadId) || activeLeads[0] || null;

  const [jobs, setJobs] = useState<NurtureJob[]>([]);
  const [recentTurns, setRecentTurns] = useState<RecentChatTurn[]>([]);
  const [selectedTone, setSelectedTone] = useState<NurtureTone>('santai');
  const [selectedJobId, setSelectedJobId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const [anchorInput, setAnchorInput] = useState<string>('');
  const [editingDrafts, setEditingDrafts] = useState<Record<string, string>>({});
  const [editingTimes, setEditingTimes] = useState<Record<string, string>>({});

  const [showPatternModal, setShowPatternModal] = useState(false);
  const [templates, setTemplates] = useState<CadenceTemplate[]>([]);

  const loadJobsForLead = async (lead: FollowupLeadSummary) => {
    setLoading(true);
    setNotice(null);
    setAnchorInput(toLocalInput(lead.last_activity_at || lead.created_at));
    try {
      const res = await fetch(`/api/nurture/jobs?leadId=${encodeURIComponent(lead.id)}`);
      const json = await res.json();
      if (json.ok && Array.isArray(json.data)) {
        const list = json.data as NurtureJob[];
        setJobs(list);
        setRecentTurns(Array.isArray(json.recentTurns) ? json.recentTurns : []);
        const drafts: Record<string, string> = {};
        const times: Record<string, string> = {};
        for (const j of list) {
          drafts[j.id] = j.draft_message || '';
          times[j.id] = toLocalInput(j.scheduled_at);
        }
        setEditingDrafts(drafts);
        setEditingTimes(times);
        if (list[0]?.scheduled_at) {
          setAnchorInput(toLocalInput(list[0].scheduled_at));
        }
        setSelectedJobId((prev) => (list.some((x) => x.id === prev) ? prev : list[0]?.id || ''));
      }
    } catch {
      setNotice('Gagal memuat jadwal follow-up AI.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedLead) {
      loadJobsForLead(selectedLead);
    }
  }, [selectedLeadId]);

  const loadTemplates = async () => {
    const res = await fetch('/api/nurture/templates');
    const json = await res.json();
    if (json.ok && Array.isArray(json.data)) setTemplates(json.data);
  };

  const handleApplyAnchor = async () => {
    if (!selectedLead || !anchorInput) return;
    setBusy(true);
    setNotice(null);
    try {
      const res = await fetch('/api/nurture/jobs/reschedule-anchor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId: selectedLead.id,
          anchorAt: new Date(anchorInput).toISOString(),
        }),
      });
      const json = await res.json();
      if (json.ok && Array.isArray(json.data)) {
        setJobs(json.data);
        const times: Record<string, string> = {};
        for (const j of json.data as NurtureJob[]) {
          times[j.id] = toLocalInput(j.scheduled_at);
        }
        setEditingTimes(times);
        setNotice('Tanggal follow-up pertama & seluruh jadwal berikutnya berhasil diperbarui.');
      } else {
        setNotice(json.error || 'Gagal memperbarui jadwal awal.');
      }
    } finally {
      setBusy(false);
    }
  };

  const handleSaveJob = async (jobId: string, nextStatus?: 'SCHEDULED' | 'PAUSED') => {
    setBusy(true);
    setNotice(null);
    try {
      const localVal = editingTimes[jobId];
      const scheduledAt = localVal ? new Date(localVal).toISOString() : undefined;
      const res = await fetch('/api/nurture/jobs/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId,
          draftMessage: editingDrafts[jobId],
          scheduledAt,
          status: nextStatus,
        }),
      });
      const json = await res.json();
      if (json.ok && selectedLead) {
        await loadJobsForLead(selectedLead);
        setNotice('Pesan & jadwal follow-up disimpan.');
      } else {
        setNotice(json.error || 'Gagal menyimpan perubahan.');
      }
    } finally {
      setBusy(false);
    }
  };

  const handleRegenerate = async (jobId: string) => {
    setBusy(true);
    setNotice(null);
    try {
      const res = await fetch('/api/nurture/jobs/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId, force: true, tone: selectedTone }),
      });
      const json = await res.json();
      if (json.ok && json.job) {
        setEditingDrafts((prev) => ({ ...prev, [jobId]: json.job.draft_message }));
        setJobs((prev) => prev.map((j) => (j.id === jobId ? { ...j, ...json.job } : j)));
        setNotice('Rekomendasi pesan soft-selling baru berhasil disusun AI.');
      } else {
        setNotice(json.error || 'Gagal menyusun ulang pesan AI.');
      }
    } finally {
      setBusy(false);
    }
  };

  const handleRegenerateAll = async () => {
    if (!selectedLead) return;
    setBusy(true);
    setNotice(null);
    try {
      const res = await fetch('/api/nurture/jobs/regenerate-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId: selectedLead.id, tone: selectedTone }),
      });
      const json = await res.json();
      if (json.ok && Array.isArray(json.data)) {
        const list = json.data as NurtureJob[];
        setJobs(list);
        const drafts: Record<string, string> = {};
        for (const j of list) drafts[j.id] = j.draft_message || '';
        setEditingDrafts(drafts);
        setNotice('Seluruh rangkaian follow-up (H0–H14) berhasil disusun ulang berurutan & anti-pengulangan.');
      } else {
        setNotice(json.error || 'Gagal menyusun ulang semua tahap.');
      }
    } finally {
      setBusy(false);
    }
  };

  const handleSendNow = async (jobId: string) => {
    if (!selectedLead) return;
    setBusy(true);
    setNotice(null);
    try {
      await fetch('/api/nurture/jobs/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId, draftMessage: editingDrafts[jobId] }),
      });
      const res = await fetch('/api/nurture/jobs/send-now', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId }),
      });
      const json = await res.json();
      if (json.ok) {
        await loadJobsForLead(selectedLead);
        setNotice(`Pesan terkirim otomatis ke ${selectedLead.full_name} via WhatsApp Baileys.`);
      } else {
        setNotice(json.error || 'Gagal mengirim pesan WhatsApp.');
      }
    } finally {
      setBusy(false);
    }
  };

  const handleSaveTemplate = async (tpl: CadenceTemplate) => {
    const res = await fetch('/api/nurture/templates', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        stepCode: tpl.step_code,
        delayHours: Number(tpl.delay_hours),
        isActive: tpl.is_active,
        stepGoal: tpl.step_goal,
      }),
    });
    if (res.ok) {
      setNotice(`Pola jam default ${tpl.step_code} diperbarui.`);
      loadTemplates();
    }
  };

  const activeJob = jobs.find((j) => j.id === selectedJobId) || jobs[0] || null;
  const activeDraftText = activeJob ? editingDrafts[activeJob.id] ?? activeJob.draft_message : '';
  const activeTimeLabel = activeJob
    ? new Date(editingTimes[activeJob.id] || activeJob.scheduled_at).toLocaleString('id-ID', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  if (activeLeads.length === 0) {
    return (
      <div className="rounded-2xl border border-warmborder bg-white p-8 text-center text-sm text-warmmuted">
        Belum ada prospek aktif untuk dijadwalkan follow-up. Silakan input lead terlebih dahulu.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Bar Kontrol Prospek & Tanggal Follow-Up Pertama */}
      <div className="rounded-2xl border border-warmborder bg-white p-4 shadow-xs space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-[240px] flex-1">
            <label className="block text-[11px] font-bold uppercase tracking-wide text-warmmuted">
              Pilih Prospek
            </label>
            <select
              value={selectedLeadId}
              onChange={(e) => setSelectedLeadId(e.target.value)}
              className="mt-1 w-full rounded-xl border border-warmborder bg-sandstone/40 px-3 py-2 text-sm font-bold text-espresso"
            >
              {activeLeads.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.full_name} ({l.phone_wa}) — {l.unit_interest}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wide text-warmmuted">
              Tanggal &amp; Jam Follow-Up Pertama (Default dari tanpa balasan)
            </label>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <input
                type="datetime-local"
                value={anchorInput}
                onChange={(e) => setAnchorInput(e.target.value)}
                className="rounded-xl border border-warmborder px-3 py-2 text-xs font-semibold text-espresso"
              />
              <button
                type="button"
                disabled={busy}
                onClick={handleApplyAnchor}
                className="rounded-xl bg-espresso px-3.5 py-2 text-xs font-bold text-white hover:bg-espresso/90 disabled:opacity-50"
              >
                Terapkan ke Jadwal
              </button>
              <button
                type="button"
                onClick={() => {
                  const next = !showPatternModal;
                  setShowPatternModal(next);
                  if (next) loadTemplates();
                }}
                className="inline-flex items-center gap-1.5 rounded-xl border border-warmborder bg-sandstone px-3 py-2 text-xs font-bold text-espresso hover:bg-sandstone/80"
              >
                <Settings2 className="h-3.5 w-3.5" />
                Pola Jam
              </button>
              <button
                type="button"
                disabled={busy || loading}
                onClick={handleRegenerateAll}
                className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-700/30 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-900 hover:bg-emerald-100 disabled:opacity-50"
                title="Susun ulang seluruh rangkaian H0–H14 secara berurutan agar tidak saling mengulang"
              >
                <Sparkles className={`h-3.5 w-3.5 ${busy ? 'animate-spin' : ''}`} />
                Regenerate Semua (H0–H14)
              </button>
            </div>
          </div>
        </div>

        {notice && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-xs font-semibold text-emerald-900">
            {notice}
          </div>
        )}

        {showPatternModal && (
          <div className="rounded-xl border border-warmborder bg-sandstone/30 p-3 space-y-2">
            <p className="text-xs font-bold text-espresso">Atur Jeda Jam Default Antar Tahap</p>
            {templates.map((tpl) => (
              <div key={tpl.step_code} className="flex flex-wrap items-center gap-2 text-xs">
                <span className="w-12 font-bold text-espresso">{tpl.step_code}</span>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  value={tpl.delay_hours}
                  onChange={(e) =>
                    setTemplates((prev) =>
                      prev.map((x) =>
                        x.step_code === tpl.step_code ? { ...x, delay_hours: Number(e.target.value) } : x
                      )
                    )
                  }
                  className="w-20 rounded-lg border border-warmborder bg-white px-2 py-1"
                />
                <span className="text-warmmuted">jam</span>
                <label className="flex items-center gap-1">
                  <input
                    type="checkbox"
                    checked={tpl.is_active}
                    onChange={(e) =>
                      setTemplates((prev) =>
                        prev.map((x) =>
                          x.step_code === tpl.step_code ? { ...x, is_active: e.target.checked } : x
                        )
                      )
                    }
                  />
                  Aktif
                </label>
                <button
                  type="button"
                  onClick={() => handleSaveTemplate(tpl)}
                  className="ml-auto rounded-lg bg-emerald-800 px-2.5 py-1 text-[11px] font-bold text-white"
                >
                  Simpan
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Layout 2 Kolom: Kiri Daftar Jadwal | Kanan Visualisasi WhatsApp */}
      <div className="grid gap-4 lg:grid-cols-12">
        {/* KOLOM KIRI: Daftar Jadwal */}
        <div className="space-y-2.5 lg:col-span-5">
          {loading ? (
            <div className="rounded-2xl border border-warmborder bg-white p-6 text-center text-xs text-warmmuted">
              AI sedang menyiapkan jadwal &amp; draf pesan follow-up...
            </div>
          ) : (
            jobs.map((job) => {
              const isSelected = activeJob?.id === job.id;
              const isSent = job.status === 'SENT';
              return (
                <div
                  key={job.id}
                  onClick={() => setSelectedJobId(job.id)}
                  className={`cursor-pointer rounded-2xl border p-3.5 transition ${
                    isSelected
                      ? 'border-emerald-700 bg-emerald-50/60 shadow-xs'
                      : 'border-warmborder bg-white hover:border-espresso/40'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <CalendarClock className="h-4 w-4 text-emerald-800" />
                      <span className="text-xs font-extrabold text-espresso">
                        {job.step_label || job.step_code}
                      </span>
                    </div>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        isSent
                          ? 'bg-emerald-100 text-emerald-800'
                          : job.status === 'PAUSED'
                          ? 'bg-amber-100 text-amber-800'
                          : job.status === 'SCHEDULED'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-neutral-100 text-neutral-700'
                      }`}
                    >
                      {job.status}
                    </span>
                  </div>

                  <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2">
                    <input
                      type="datetime-local"
                      disabled={isSent}
                      value={editingTimes[job.id] || ''}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) =>
                        setEditingTimes((prev) => ({ ...prev, [job.id]: e.target.value }))
                      }
                      className="rounded-lg border border-warmborder bg-white px-2 py-1 text-[11px] font-semibold text-espresso disabled:bg-neutral-100"
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedJobId(job.id);
                      }}
                      className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-bold ${
                        isSelected
                          ? 'bg-emerald-800 text-white'
                          : 'border border-emerald-800/30 bg-white text-emerald-900 hover:bg-emerald-50'
                      }`}
                    >
                      <MessageSquare className="h-3 w-3" />
                      {isSelected ? 'Ditampilkan' : 'Lihat Pesan →'}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* KOLOM KANAN: Visualisasi WhatsApp + Edit Pesan */}
        <div className="lg:col-span-7">
          {activeJob && selectedLead ? (
            <div className="overflow-hidden rounded-2xl border border-black/15 shadow-sm">
              {/* Header WhatsApp */}
              <div className="flex items-center justify-between bg-[#075E54] px-4 py-3 text-white">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-sm font-black">
                    {selectedLead.full_name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-sm font-bold">{selectedLead.full_name}</div>
                    <div className="text-[11px] text-white/80">
                      {selectedLead.phone_wa} · {activeJob.step_label || activeJob.step_code}
                    </div>
                  </div>
                </div>
                {activeJob.is_edited_by_se && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-bold">
                    <Edit3 className="h-3 w-3" /> Diedit SE
                  </span>
                )}
              </div>

              {/* Area Chat WhatsApp Preview */}
              <div className="min-h-[210px] bg-[#EFEAE2] p-4 space-y-3">
                {recentTurns.length > 0 && (
                  <div className="space-y-2 pb-2 border-b border-black/10">
                    <div className="text-center">
                      <span className="rounded-lg bg-white/75 px-2 py-0.5 text-[10px] font-semibold text-neutral-500">
                        Konteks Chat Terakhir
                      </span>
                    </div>
                    {recentTurns.slice(-2).map((turn, idx) => {
                      const isInbound = turn.direction === 'IN';
                      return (
                        <div
                          key={idx}
                          className={`max-w-[85%] rounded-2xl px-3 py-2 text-[11px] leading-relaxed shadow-2xs ${
                            isInbound
                              ? 'mr-auto rounded-tl-xs bg-white text-[#111B21]'
                              : 'ml-auto rounded-tr-xs bg-[#E7F8E2] text-[#111B21]/85'
                          }`}
                        >
                          <span className="block text-[9px] font-bold uppercase text-neutral-400 mb-0.5">
                            {isInbound ? selectedLead.full_name : 'SE (Terkirim)'}
                          </span>
                          <p className="whitespace-pre-wrap">{turn.body}</p>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="text-center">
                  <span className="rounded-lg bg-white/85 px-2.5 py-1 text-[10px] font-semibold text-neutral-600 shadow-2xs">
                    Jadwal Kirim: {activeTimeLabel} WIB
                  </span>
                </div>

                <div className="ml-auto max-w-[90%] rounded-2xl rounded-tr-xs bg-[#D9FDD3] px-3.5 py-2.5 text-xs leading-relaxed text-[#111B21] shadow-xs">
                  <p className="whitespace-pre-wrap">
                    {activeDraftText || 'Klik "Regenerate AI" untuk menyusun pesan follow-up.'}
                  </p>
                  <div className="mt-1.5 flex items-center justify-end gap-1 text-[10px] text-neutral-500">
                    <span>{activeTimeLabel}</span>
                    <CheckCheck
                      className={`h-3.5 w-3.5 ${
                        activeJob.status === 'SENT' ? 'text-[#53BDEB]' : 'text-neutral-400'
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Composer & Edit Pesan */}
              <div className="space-y-2.5 border-t border-black/10 bg-[#F0F2F5] p-3.5">
                <textarea
                  rows={4}
                  disabled={activeJob.status === 'SENT'}
                  value={activeDraftText}
                  onChange={(e) =>
                    setEditingDrafts((prev) => ({ ...prev, [activeJob.id]: e.target.value }))
                  }
                  placeholder="Edit pesan follow-up di sini..."
                  className="w-full rounded-xl border border-black/15 bg-white p-3 text-xs leading-relaxed text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#128C7E]/40 disabled:bg-neutral-100"
                />

                {activeJob.status !== 'SENT' && (
                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      value={selectedTone}
                      onChange={(e) => setSelectedTone(e.target.value as NurtureTone)}
                      disabled={busy}
                      className="rounded-xl border border-[#128C7E]/30 bg-white px-2.5 py-2 text-xs font-bold text-[#075E54] cursor-pointer"
                      title="Pilih gaya soft-selling AI"
                    >
                      {TONE_OPTIONS.map((t) => (
                        <option key={t.id} value={t.id}>
                          Gaya: {t.label}
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => handleRegenerate(activeJob.id)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-[#128C7E]/30 bg-white px-3 py-2 text-xs font-bold text-[#075E54] hover:bg-emerald-50 disabled:opacity-50"
                    >
                      {busy ? <Sparkles className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                      Regenerate AI
                    </button>

                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => handleSaveJob(activeJob.id)}
                      className="rounded-xl border border-black/15 bg-white px-3 py-2 text-xs font-bold text-espresso hover:bg-neutral-50 disabled:opacity-50"
                    >
                      Simpan Edit &amp; Jadwal
                    </button>

                    <button
                      type="button"
                      disabled={busy}
                      onClick={() =>
                        handleSaveJob(
                          activeJob.id,
                          activeJob.status === 'PAUSED' ? 'SCHEDULED' : 'PAUSED'
                        )
                      }
                      className="inline-flex items-center gap-1 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-900 disabled:opacity-50"
                    >
                      {activeJob.status === 'PAUSED' ? (
                        <Play className="h-3.5 w-3.5" />
                      ) : (
                        <Pause className="h-3.5 w-3.5" />
                      )}
                      {activeJob.status === 'PAUSED' ? 'Lanjutkan' : 'Jeda'}
                    </button>

                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => handleSendNow(activeJob.id)}
                      className={`ml-auto inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-extrabold text-white shadow-xs disabled:opacity-50 ${
                        waConnected ? 'bg-[#128C7E] hover:bg-[#075E54]' : 'bg-terracotta hover:bg-terracotta/90'
                      }`}
                    >
                      <Send className="h-3.5 w-3.5" />
                      {waConnected
                        ? `Kirim Sekarang via WA (${waPhoneNumber || 'Baileys'})`
                        : 'Hubungkan WA Dulu untuk Kirim'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-warmborder bg-white p-8 text-center text-xs text-warmmuted">
              Pilih salah satu jadwal di sebelah kiri untuk melihat &amp; mengedit visualisasi pesan WhatsApp.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
