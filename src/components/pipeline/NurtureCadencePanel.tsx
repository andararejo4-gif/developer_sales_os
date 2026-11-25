import { useState } from 'react';
import { CalendarClock, Edit3, Pause, Play, RefreshCw, Send, Settings2, Sparkles } from 'lucide-react';

interface NurtureJob {
  id: string;
  step_code: string;
  step_label?: string;
  scheduled_at: string;
  draft_message: string;
  is_edited_by_se: boolean;
  status: string;
  sent_at?: string | null;
  error_message?: string | null;
}

interface CadenceTemplate {
  step_code: string;
  step_label: string;
  delay_hours: number;
  step_goal: string;
  auto_send: boolean;
  is_active: boolean;
}

export function NurtureCadencePanel({ leadId, buyerName }: { leadId: string; buyerName: string }) {
  const [open, setOpen] = useState(false);
  const [jobs, setJobs] = useState<NurtureJob[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingDrafts, setEditingDrafts] = useState<Record<string, string>>({});
  const [editingTimes, setEditingTimes] = useState<Record<string, string>>({});
  const [busyJobId, setBusyJobId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [showSettings, setShowSettings] = useState(false);
  const [templates, setTemplates] = useState<CadenceTemplate[]>([]);

  const toLocalInput = (iso: string) => {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    const offset = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - offset).toISOString().slice(0, 16);
  };

  const loadJobs = async () => {
    setLoading(true);
    setNotice(null);
    try {
      const res = await fetch(`/api/nurture/jobs?leadId=${encodeURIComponent(leadId)}`);
      const json = await res.json();
      if (json.ok && Array.isArray(json.data)) {
        setJobs(json.data);
        const drafts: Record<string, string> = {};
        const times: Record<string, string> = {};
        for (const j of json.data as NurtureJob[]) {
          drafts[j.id] = j.draft_message || '';
          times[j.id] = toLocalInput(j.scheduled_at);
        }
        setEditingDrafts(drafts);
        setEditingTimes(times);
      }
    } catch {
      setNotice('Gagal memuat jadwal follow-up.');
    } finally {
      setLoading(false);
    }
  };

  const loadTemplates = async () => {
    try {
      const res = await fetch('/api/nurture/templates');
      const json = await res.json();
      if (json.ok && Array.isArray(json.data)) {
        setTemplates(json.data);
      }
    } catch {
      /* abaikan */
    }
  };

  const handleToggle = () => {
    const next = !open;
    setOpen(next);
    if (next && jobs.length === 0) {
      loadJobs();
    }
  };

  const handleRegenerate = async (jobId: string) => {
    setBusyJobId(jobId);
    setNotice(null);
    try {
      const res = await fetch('/api/nurture/jobs/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId, force: true }),
      });
      const json = await res.json();
      if (json.ok && json.job) {
        setEditingDrafts((prev) => ({ ...prev, [jobId]: json.job.draft_message }));
        await loadJobs();
        setNotice('Draf baru berhasil disusun AI.');
      } else {
        setNotice(json.error || 'Gagal menyusun draf AI.');
      }
    } finally {
      setBusyJobId(null);
    }
  };

  const handleSaveJob = async (jobId: string, nextStatus?: 'SCHEDULED' | 'PAUSED') => {
    setBusyJobId(jobId);
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
      if (json.ok) {
        await loadJobs();
        setNotice('Perubahan jadwal & pesan disimpan.');
      } else {
        setNotice(json.error || 'Gagal menyimpan perubahan.');
      }
    } finally {
      setBusyJobId(null);
    }
  };

  const handleSendNow = async (jobId: string) => {
    setBusyJobId(jobId);
    setNotice(null);
    try {
      // Simpan editan terakhir SE sebelum kirim
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
        await loadJobs();
        setNotice(`Pesan follow-up ke ${buyerName} terkirim via Baileys.`);
      } else {
        setNotice(json.error || 'Gagal mengirim pesan via Baileys.');
      }
    } finally {
      setBusyJobId(null);
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
      setNotice(`Pola jadwal ${tpl.step_code} diperbarui.`);
      loadTemplates();
    }
  };

  return (
    <div className="mt-3 rounded-xl border border-emerald-900/15 bg-emerald-50/40 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          onClick={handleToggle}
          className="flex items-center gap-2 text-xs font-semibold text-emerald-950 hover:underline"
        >
          <CalendarClock className="h-4 w-4 text-emerald-700" />
          <span>Jadwal Follow-Up AI Terjadwal (Baileys)</span>
        </button>
        {open && (
          <button
            type="button"
            onClick={() => {
              const next = !showSettings;
              setShowSettings(next);
              if (next) loadTemplates();
            }}
            className="flex items-center gap-1 rounded-md border border-emerald-800/20 bg-white px-2 py-1 text-[11px] font-medium text-emerald-900 hover:bg-emerald-50"
          >
            <Settings2 className="h-3 w-3" />
            Atur Pola Jam
          </button>
        )}
      </div>

      {open && (
        <div className="mt-3 space-y-3">
          {notice && (
            <div className="rounded-lg bg-white px-3 py-2 text-xs font-medium text-emerald-900 shadow-xs">
              {notice}
            </div>
          )}

          {showSettings && (
            <div className="rounded-lg border border-emerald-900/15 bg-white p-3 space-y-2">
              <p className="text-xs font-bold text-emerald-950">Atur Jeda Jam Default (Berlaku untuk Lead Berikutnya)</p>
              {templates.map((tpl) => (
                <div key={tpl.step_code} className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="w-12 font-bold">{tpl.step_code}</span>
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
                    className="w-20 rounded border px-2 py-1"
                  />
                  <span className="text-neutral-500">jam</span>
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
                    className="ml-auto rounded bg-emerald-800 px-2 py-1 text-[11px] font-semibold text-white"
                  >
                    Simpan
                  </button>
                </div>
              ))}
            </div>
          )}

          {loading ? (
            <p className="text-xs text-neutral-600">Memuat jadwal follow-up AI...</p>
          ) : (
            jobs.map((job) => {
              const isSent = job.status === 'SENT';
              const isBusy = busyJobId === job.id;
              return (
                <div key={job.id} className="rounded-lg border border-neutral-200 bg-white p-3 text-xs space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-emerald-950">{job.step_label || job.step_code}</span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
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
                      {job.is_edited_by_se && (
                        <span className="inline-flex items-center gap-1 rounded bg-purple-50 px-1.5 py-0.5 text-[10px] text-purple-800">
                          <Edit3 className="h-2.5 w-2.5" /> Diedit SE
                        </span>
                      )}
                    </div>

                    {!isSent && (
                      <input
                        type="datetime-local"
                        value={editingTimes[job.id] || ''}
                        onChange={(e) => setEditingTimes((prev) => ({ ...prev, [job.id]: e.target.value }))}
                        className="rounded border border-neutral-300 px-2 py-1 text-[11px]"
                      />
                    )}
                  </div>

                  <textarea
                    rows={3}
                    disabled={isSent}
                    value={editingDrafts[job.id] ?? ''}
                    placeholder="Belum ada draf. Klik 'Susun AI' untuk membuat pesan follow-up..."
                    onChange={(e) => setEditingDrafts((prev) => ({ ...prev, [job.id]: e.target.value }))}
                    className="w-full rounded-md border border-neutral-300 p-2 text-xs text-neutral-800 disabled:bg-neutral-50"
                  />

                  {!isSent && (
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => handleRegenerate(job.id)}
                        className="inline-flex items-center gap-1 rounded-md border border-emerald-700/30 bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-900 hover:bg-emerald-100 disabled:opacity-50"
                      >
                        {job.draft_message ? <RefreshCw className="h-3 w-3" /> : <Sparkles className="h-3 w-3" />}
                        {job.draft_message ? 'Regenerate AI' : 'Susun AI'}
                      </button>

                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => handleSaveJob(job.id)}
                        className="rounded-md border border-neutral-300 bg-white px-2.5 py-1 text-[11px] font-medium text-neutral-800 hover:bg-neutral-50 disabled:opacity-50"
                      >
                        Simpan Edit & Jadwal
                      </button>

                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => handleSaveJob(job.id, job.status === 'PAUSED' ? 'SCHEDULED' : 'PAUSED')}
                        className="inline-flex items-center gap-1 rounded-md border border-amber-300 bg-amber-50 px-2.5 py-1 text-[11px] font-medium text-amber-900 disabled:opacity-50"
                      >
                        {job.status === 'PAUSED' ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
                        {job.status === 'PAUSED' ? 'Lanjutkan' : 'Jeda'}
                      </button>

                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => handleSendNow(job.id)}
                        className="ml-auto inline-flex items-center gap-1 rounded-md bg-emerald-800 px-3 py-1 text-[11px] font-semibold text-white hover:bg-emerald-900 disabled:opacity-50"
                      >
                        <Send className="h-3 w-3" />
                        Kirim Sekarang
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
