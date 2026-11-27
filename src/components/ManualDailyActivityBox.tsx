import React, { useState } from 'react';
import { ClipboardList, Plus, Trash2 } from 'lucide-react';
import { loadAuthSession } from '../lib/auth/dummy-accounts';

export interface ManualDailyActivityItem {
  id: string;
  activityDate: string;
  category: string;
  note: string;
  createdAt: string;
}

interface ManualDailyActivityBoxProps {
  title?: string;
  defaultDate: string;
  items: ManualDailyActivityItem[];
  onSaved: () => void;
}

const CATEGORIES = [
  'Kantor / Administrasi',
  'Dokumentasi',
  'Pembuatan Laporan',
  'Koordinasi / Meeting',
  'Lainnya',
];

export const ManualDailyActivityBox: React.FC<ManualDailyActivityBoxProps> = ({
  title = 'Catatan Aktivitas Harian (Kantor / Non-Lead)',
  defaultDate,
  items,
  onSaved,
}) => {
  const [activityDate, setActivityDate] = useState(defaultDate);
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [customCategory, setCustomCategory] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const isOtherCategory = category === 'Lainnya';
  const effectiveCategory = isOtherCategory && customCategory.trim()
    ? `Lainnya: ${customCategory.trim()}`
    : category;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalNote = note.trim() || (isOtherCategory ? customCategory.trim() : '');
    if (!finalNote) return;
    if (isOtherCategory && !customCategory.trim()) {
      setErr('Mohon jelaskan jenis kegiatan pada kolom "Lainnya".');
      return;
    }
    setSaving(true);
    setErr(null);
    try {
      const s = loadAuthSession();
      const res = await fetch('/api/daily-report/manual-activity', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(s?.token ? { Authorization: `Bearer ${s.token}` } : {}),
        },
        body: JSON.stringify({ activityDate, category: effectiveCategory, note: finalNote }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.ok) {
        setErr(json.error || 'Gagal menyimpan catatan aktivitas.');
        return;
      }
      setNote('');
      setCustomCategory('');
      onSaved();
    } catch {
      setErr('Gagal menghubungi server.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const s = loadAuthSession();
    await fetch(`/api/daily-report/manual-activity?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
      credentials: 'include',
      headers: {
        ...(s?.token ? { Authorization: `Bearer ${s.token}` } : {}),
      },
    });
    onSaved();
  };

  return (
    <div className="bg-sandstone/30 border border-warmborder rounded-xl p-3.5 space-y-3">
      <div className="flex items-center gap-2">
        <ClipboardList className="size-4 text-terracotta shrink-0" />
        <div>
          <h3 className="text-xs font-bold text-espresso">{title}</h3>
          <p className="text-[11px] text-warmmuted">
            Catat kegiatan di kantor (dokumentasi, pembuatan laporan, koordinasi, administrasi) di luar lead atau canvassing.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-12 gap-2">
        <input
          type="date"
          value={activityDate}
          onChange={(e) => setActivityDate(e.target.value)}
          className="sm:col-span-3 h-9 px-2.5 rounded-lg border border-warmborder bg-white text-xs text-espresso"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="sm:col-span-3 h-9 px-2.5 rounded-lg border border-warmborder bg-white text-xs text-espresso"
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        {isOtherCategory && (
          <input
            type="text"
            value={customCategory}
            onChange={(e) => setCustomCategory(e.target.value)}
            placeholder="Jelaskan kegiatan lainnya (mis. Antar berkas notaris)..."
            className="sm:col-span-12 h-9 px-3 rounded-lg border border-terracotta/60 bg-white text-xs text-espresso"
          />
        )}
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Contoh: Menyusun dokumen KPR & rekap laporan harian di kantor..."
          className="sm:col-span-4 h-9 px-3 rounded-lg border border-warmborder bg-white text-xs text-espresso"
        />
        <button
          type="submit"
          disabled={saving || (!note.trim() && !(isOtherCategory && customCategory.trim()))}
          className="sm:col-span-2 h-9 px-3 rounded-lg bg-espresso hover:bg-espresso/90 text-white text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
        >
          <Plus className="size-3.5" />
          <span>{saving ? 'Menyimpan...' : 'Simpan'}</span>
        </button>
      </form>

      {err && <div className="text-[11px] text-rose-700 font-semibold">{err}</div>}

      {items.length > 0 && (
        <ul className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
          {items.map((item) => (
            <li
              key={item.id}
              className="bg-white rounded-lg border border-warmborder/70 px-3 py-2 flex items-start justify-between gap-2 text-xs"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="font-bold text-espresso">{item.activityDate}</span>
                  <span className="px-2 py-0.5 rounded-md bg-amber-50 text-terracotta text-[10px] font-bold">
                    {item.category}
                  </span>
                </div>
                <p className="text-espresso mt-0.5 text-[11px]">{item.note}</p>
              </div>
              <button
                type="button"
                onClick={() => void handleDelete(item.id)}
                title="Hapus catatan"
                className="p-1 rounded-md text-warmmuted hover:text-rose-600 hover:bg-rose-50 cursor-pointer shrink-0"
              >
                <Trash2 className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
