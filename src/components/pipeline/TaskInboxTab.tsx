import React, { useState } from 'react';
import {
  CheckCircle2,
  Clock,
  Copy,
  MessageSquare,
  Check,
  User,
} from 'lucide-react';
import type { PipelineLeadRecord } from '../PipelinePage';
import { loadPersistedState, savePersistedState } from '../../lib/navigation/router';

interface TaskItem {
  id: string;
  leadId: string;
  leadName: string;
  phoneWa: string;
  unitInterest: string;
  stage: string;
  taskTitle: string;
  reason: string;
  priority: 'URGENT' | 'HIGH' | 'NORMAL';
  dueTime: string;
  scriptSnippet: string;
}

interface TaskInboxTabProps {
  leads: PipelineLeadRecord[];
}

export const TaskInboxTab: React.FC<TaskInboxTabProps> = ({
  leads,
}) => {
  const [completedTaskIds, setCompletedTaskIds] = useState<Record<string, boolean>>(() =>
    loadPersistedState<Record<string, boolean>>('devos_completed_tasks', {})
  );
  const [filterPriority, setFilterPriority] = useState<'ALL' | 'URGENT' | 'PENDING' | 'DONE'>('ALL');
  const [copiedTaskId, setCopiedTaskId] = useState<string | null>(null);

  // Generate deterministic tasks based on lead state & stages
  const tasks: TaskItem[] = leads.flatMap((lead) => {
    const list: TaskItem[] = [];
    const isUnreplied = !lead.last_sales_message || !lead.last_sales_message.trim();

    if (lead.stage === 'NEW' || isUnreplied) {
      list.push({
        id: `task_sla_${lead.id}`,
        leadId: lead.id,
        leadName: lead.full_name,
        phoneWa: lead.phone_wa,
        unitInterest: lead.unit_interest || 'The Park Townhouse',
        stage: lead.stage,
        taskTitle: 'Respon Cepat Lead Baru (SLA ≤ 5 Menit)',
        reason: 'Lead baru masuk dari kanal promosi, wajib direspons sebelum berpaling ke kompetitor.',
        priority: 'URGENT',
        dueTime: 'Segera (< 5 Menit)',
        scriptSnippet: `Halo Bapak/Ibu ${lead.full_name}, salam kenal dari The Park Townhouse Sukoharjo. Untuk unit 2 lantai Japandi Modern mulai Rp650 Jt, rencana untuk hunian atau investasi?`,
      });
    }

    if (lead.grade === 'A' || lead.grade === 'B' || lead.bant_total >= 7) {
      list.push({
        id: `task_survey_${lead.id}`,
        leadId: lead.id,
        leadName: lead.full_name,
        phoneWa: lead.phone_wa,
        unitInterest: lead.unit_interest || 'The Park Townhouse',
        stage: lead.stage,
        taskTitle: 'Kirim Undangan Survei Lokasi Akhir Pekan',
        reason: 'Skor BANT ≥ 7 (Terkualifikasi Hot/Warm). Waktu optimal mengunci komitmen survei show unit.',
        priority: 'HIGH',
        dueTime: 'Hari Ini',
        scriptSnippet: `Selamat siang Bapak/Ibu ${lead.full_name}, Sabtu/Minggu ini kami ada sesi private preview show unit di The Park Jombor. Lebih nyaman mampir pagi jam 10.00 atau sore jam 15.00?`,
      });
    }

    if (lead.stage === 'VISITED' || lead.stage === 'HOT_NEGOTIATION') {
      list.push({
        id: `task_closing_${lead.id}`,
        leadId: lead.id,
        leadName: lead.full_name,
        phoneWa: lead.phone_wa,
        unitInterest: lead.unit_interest || 'The Park Townhouse',
        stage: lead.stage,
        taskTitle: 'Follow-Up Pasca Survei & Simulasi Cicilan KPR',
        reason: 'Konsumen sudah berkunjung ke lokasi (VISITED). Berikan rincian simulasi angsuran dan pengunci booking Rp5 Juta.',
        priority: 'HIGH',
        dueTime: '1x24 Jam',
        scriptSnippet: `Terima kasih sudah meluangkan waktu melihat unit The Park kemarin, Bapak/Ibu ${lead.full_name}. Saya lampirkan rincian simulasi cicilan KPR dan Cash Bertahap sesuai unit yang paling cocok tadi.`,
      });
    }

    if (lead.stage === 'BOOKING' || lead.stage === 'DP_KPR_PROCESS') {
      list.push({
        id: `task_kpr_${lead.id}`,
        leadId: lead.id,
        leadName: lead.full_name,
        phoneWa: lead.phone_wa,
        unitInterest: lead.unit_interest || 'The Park Townhouse',
        stage: lead.stage,
        taskTitle: 'Checklist Berkas KPR (KTP, NPWP, Slip Gaji)',
        reason: 'Unit sudah di-booking. Lengkapi berkas debitur agar approval bank BSI/BTN selesai tepat waktu.',
        priority: 'NORMAL',
        dueTime: '3 Hari Kerja',
        scriptSnippet: `Selamat pagi Bapak/Ibu ${lead.full_name}, izin mengingatkan kelengkapan berkas KPR (KTP pasangan, NPWP, dan rekening koran 3 bulan terakhir) untuk kami teruskan ke analis bank rekanan.`,
      });
    }

    return list;
  });

  const toggleTaskDone = (taskId: string) => {
    setCompletedTaskIds((prev) => {
      const next = { ...prev, [taskId]: !prev[taskId] };
      savePersistedState('devos_completed_tasks', next);
      return next;
    });
  };

  const handleCopyScript = (taskId: string, snippet: string) => {
    navigator.clipboard.writeText(snippet);
    setCopiedTaskId(taskId);
    setTimeout(() => setCopiedTaskId(null), 2000);
  };

  const filteredTasks = tasks.filter((t) => {
    const isDone = Boolean(completedTaskIds[t.id]);
    if (filterPriority === 'DONE') return isDone;
    if (filterPriority === 'PENDING') return !isDone;
    if (filterPriority === 'URGENT') return !isDone && t.priority === 'URGENT';
    return true; // ALL
  });

  const pendingCount = tasks.filter((t) => !completedTaskIds[t.id]).length;
  const urgentCount = tasks.filter((t) => !completedTaskIds[t.id] && t.priority === 'URGENT').length;
  const doneCount = tasks.filter((t) => completedTaskIds[t.id]).length;

  return (
    <div className="space-y-4">
      {/* Header Banner & Stat Filter */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white border border-warmborder shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-terracotta/10 text-terracotta">
              <CheckCircle2 className="size-4" />
            </span>
            <h3 className="text-base font-extrabold text-espresso">
              Next-Best-Action &amp; Task Inbox (F47)
            </h3>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-terracotta border border-amber-200">
              {pendingCount} Tindakan Pending
            </span>
          </div>
          <p className="text-xs text-warmmuted">
            Antrean tindakan operasional sales berurutan prioritas. Disusun dari tahap lead, kualifikasi BANT, dan batas SLA.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-sandstone rounded-xl border border-warmborder shrink-0">
          <button
            type="button"
            onClick={() => setFilterPriority('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              filterPriority === 'ALL'
                ? 'bg-white text-espresso shadow-2xs'
                : 'text-warmmuted hover:text-espresso'
            }`}
          >
            Semua ({tasks.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterPriority('URGENT')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
              filterPriority === 'URGENT'
                ? 'bg-rose-600 text-white shadow-2xs'
                : 'text-rose-700 hover:bg-rose-50'
            }`}
          >
            <span>Urgent</span>
            {urgentCount > 0 && (
              <span className="px-1.5 py-0.2 bg-white/20 rounded-full text-[10px] font-black">
                {urgentCount}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setFilterPriority('PENDING')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              filterPriority === 'PENDING'
                ? 'bg-white text-espresso shadow-2xs'
                : 'text-warmmuted hover:text-espresso'
            }`}
          >
            Pending ({pendingCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterPriority('DONE')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              filterPriority === 'DONE'
                ? 'bg-white text-espresso shadow-2xs'
                : 'text-warmmuted hover:text-espresso'
            }`}
          >
            Selesai ({doneCount})
          </button>
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-white border border-dashed border-warmborder space-y-2">
            <CheckCircle2 className="size-8 text-olive mx-auto" />
            <p className="text-sm font-bold text-espresso">Semua tugas beres!</p>
            <p className="text-xs text-warmmuted">
              Tidak ada antrean tugas pada kategori ini. Tetap pantau pesan masuk baru.
            </p>
          </div>
        ) : (
          filteredTasks.map((t) => {
            const isDone = Boolean(completedTaskIds[t.id]);
            return (
              <div
                key={t.id}
                className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                  isDone
                    ? 'bg-sandstone/30 border-warmborder/60 opacity-60'
                    : t.priority === 'URGENT'
                    ? 'bg-rose-50/40 border-rose-300 ring-1 ring-rose-200'
                    : 'bg-white border-warmborder shadow-2xs'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <button
                      type="button"
                      onClick={() => toggleTaskDone(t.id)}
                      className={`size-6 rounded-lg border grid place-items-center mt-0.5 shrink-0 transition-colors cursor-pointer ${
                        isDone
                          ? 'bg-olive text-white border-olive'
                          : 'bg-white border-warmborder hover:border-terracotta text-transparent'
                      }`}
                      title={isDone ? 'Tandai belum selesai' : 'Tandai selesai'}
                    >
                      <Check className="size-3.5 stroke-[3]" />
                    </button>

                    <div className="min-w-0 flex-1 space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                            t.priority === 'URGENT'
                              ? 'bg-rose-600 text-white animate-pulse'
                              : t.priority === 'HIGH'
                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                              : 'bg-sandstone text-warmmuted border border-warmborder'
                          }`}
                        >
                          {t.priority}
                        </span>

                        <span className="text-xs font-extrabold text-espresso flex items-center gap-1.5">
                          <User className="size-3 text-terracotta" />
                          <span>{t.leadName}</span>
                          <span className="text-warmmuted font-normal">({t.phoneWa})</span>
                        </span>

                        <span className="px-2 py-0.5 rounded-full bg-sandstone border border-warmborder text-[11px] font-semibold text-espresso">
                          {t.unitInterest}
                        </span>

                        <span className="text-[11px] font-bold text-terracotta flex items-center gap-1">
                          <Clock className="size-3" />
                          <span>Batas: {t.dueTime}</span>
                        </span>
                      </div>

                      <h4
                        className={`text-sm font-extrabold ${
                          isDone ? 'line-through text-warmmuted' : 'text-espresso'
                        }`}
                      >
                        {t.taskTitle}
                      </h4>

                      <p className="text-xs text-warmmuted leading-relaxed">
                        <strong>Alasan:</strong> {t.reason}
                      </p>

                      {/* Snippet Skrip Rekomendasi */}
                      <div className="mt-2 p-2.5 rounded-xl bg-sandstone/50 border border-warmborder/80 text-xs text-espresso/90 flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1 italic">
                          &ldquo;{t.scriptSnippet}&rdquo;
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopyScript(t.id, t.scriptSnippet)}
                          className="px-2 py-1 rounded-lg bg-white border border-warmborder hover:bg-sandstone text-[11px] font-bold text-espresso shrink-0 flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <Copy className="size-3 text-terracotta" />
                          <span>{copiedTaskId === t.id ? 'Tersalin!' : 'Salin'}</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Tombol Aksi */}
                  <div className="flex items-center gap-2 shrink-0 self-end lg:self-start">
                    <button
                      type="button"
                      onClick={() => toggleTaskDone(t.id)}
                      className={`min-h-[36px] px-3 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                        isDone
                          ? 'bg-sandstone text-warmmuted hover:bg-warmborder'
                          : 'bg-espresso text-white hover:bg-espresso/90'
                      }`}
                    >
                      {isDone ? 'Buka Kembali' : 'Selesai'}
                    </button>

                    <a
                      href={`https://wa.me/${t.phoneWa.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                        t.scriptSnippet
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="min-h-[36px] px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <MessageSquare className="size-3.5" />
                      <span>Kirim WA</span>
                    </a>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
