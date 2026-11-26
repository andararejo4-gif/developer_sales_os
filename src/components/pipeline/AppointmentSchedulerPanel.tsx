import React, { useEffect, useState } from 'react';
import { Calendar, Clock, FileText, AlertTriangle, CheckCircle2, Plus } from 'lucide-react';
import { loadAuthSession } from '../../lib/auth/dummy-accounts';

interface AppointmentItem {
  id: string;
  se_email: string;
  customer_name: string;
  customer_phone: string;
  scheduled_start: string;
  scheduled_end: string;
  status: string;
  notes: string;
}

export const AppointmentSchedulerPanel: React.FC<{ projectId: string; projectName: string }> = ({
  projectId,
  projectName,
}) => {
  const [appointments, setAppointments] = useState<AppointmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [startIso, setStartIso] = useState('');
  const [endIso, setEndIso] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [buyerPackPreview, setBuyerPackPreview] = useState<string | null>(null);

  const authHeaders = () => {
    const s = loadAuthSession();
    return {
      'Content-Type': 'application/json',
      ...(s?.token ? { Authorization: `Bearer ${s.token}` } : {}),
    };
  };

  const fetchAppointments = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/appointments', { headers: authHeaders(), credentials: 'include' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal memuat jadwal survei.');
      setAppointments(Array.isArray(data.appointments) ? data.appointments : []);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Tidak dapat terhubung ke server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchAppointments();
  }, [projectId]);

  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !startIso || !endIso) {
      setErrorMsg('Nama pembeli, waktu mulai, dan waktu selesai wajib diisi.');
      return;
    }
    setSubmitting(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: authHeaders(),
        credentials: 'include',
        body: JSON.stringify({
          projectId,
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim(),
          scheduledStartIso: new Date(startIso).toISOString(),
          scheduledEndIso: new Date(endIso).toISOString(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(
          data.error === 'DOUBLE_BOOKING_CONFLICT'
            ? 'Jadwal bentrok dengan survei lain pada jam tersebut.'
            : data.error || 'Gagal membuat jadwal survei.'
        );
        return;
      }
      setCustomerName('');
      setCustomerPhone('');
      await fetchAppointments();
    } catch {
      setErrorMsg('Gagal terhubung ke server saat menyimpan jadwal.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGenerateBuyerPack = async (buyerName: string) => {
    try {
      const res = await fetch('/api/exports/comparison-pack', {
        method: 'POST',
        headers: authHeaders(),
        credentials: 'include',
        body: JSON.stringify({
          projectId,
          projectName,
          buyerName,
          unitOptions: [
            { unitCode: 'A-01', priceIdr: 750000000, scheme: 'KPR', monthlyEstimateIdr: 5200000 },
            { unitCode: 'B-03', priceIdr: 820000000, scheme: 'CT24', monthlyEstimateIdr: 27333333 },
          ],
        }),
      });
      const data = await res.json();
      if (res.ok && data.markdownPack) {
        setBuyerPackPreview(data.markdownPack);
      }
    } catch {
      setErrorMsg('Gagal menyusun Buyer Pack.');
    }
  };

  return (
    <div className="bg-white border border-warmborder rounded-2xl p-4 sm:p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Calendar className="size-4 text-terracotta" />
          <h3 className="text-sm font-bold text-espresso">Jadwal Survei &amp; Buyer Pack</h3>
        </div>
        <span className="text-[11px] text-warmmuted">Anti bentrok per shift</span>
      </div>

      {errorMsg && (
        <div className="flex items-center gap-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
          <AlertTriangle className="size-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleCreateAppointment} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
        <input
          type="text"
          placeholder="Nama calon pembeli"
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
          className="h-9 px-3 text-xs border border-warmborder rounded-lg bg-sandstone/30"
        />
        <input
          type="text"
          placeholder="No. WhatsApp"
          value={customerPhone}
          onChange={(e) => setCustomerPhone(e.target.value)}
          className="h-9 px-3 text-xs border border-warmborder rounded-lg bg-sandstone/30"
        />
        <input
          type="datetime-local"
          value={startIso}
          onChange={(e) => setStartIso(e.target.value)}
          className="h-9 px-3 text-xs border border-warmborder rounded-lg bg-sandstone/30"
        />
        <input
          type="datetime-local"
          value={endIso}
          onChange={(e) => setEndIso(e.target.value)}
          className="h-9 px-3 text-xs border border-warmborder rounded-lg bg-sandstone/30"
        />
        <button
          type="submit"
          disabled={submitting}
          className="h-9 px-3.5 rounded-lg bg-terracotta text-white text-xs font-semibold flex items-center justify-center gap-1.5 disabled:opacity-60"
        >
          <Plus className="size-3.5" />
          <span>{submitting ? 'Menyimpan...' : 'Buat Jadwal'}</span>
        </button>
      </form>

      {loading ? (
        <p className="text-xs text-warmmuted">Memuat jadwal survei...</p>
      ) : appointments.length === 0 ? (
        <p className="text-xs text-warmmuted">Belum ada jadwal survei terdaftar.</p>
      ) : (
        <div className="space-y-2">
          {appointments.map((apt) => (
            <div
              key={apt.id}
              className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl border border-warmborder/70 bg-sandstone/20"
            >
              <div>
                <p className="text-xs font-bold text-espresso flex items-center gap-1.5">
                  <CheckCircle2 className="size-3.5 text-olive" />
                  {apt.customer_name}
                </p>
                <p className="text-[11px] text-warmmuted flex items-center gap-1 mt-0.5">
                  <Clock className="size-3" />
                  {new Date(apt.scheduled_start).toLocaleString('id-ID')} –{' '}
                  {new Date(apt.scheduled_end).toLocaleTimeString('id-ID')}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleGenerateBuyerPack(apt.customer_name)}
                className="h-8 px-3 rounded-lg border border-warmborder bg-white text-xs font-semibold text-espresso flex items-center gap-1.5 hover:bg-sandstone/40"
              >
                <FileText className="size-3.5 text-terracotta" />
                <span>Buyer Pack</span>
              </button>
            </div>
          ))}
        </div>
      )}

      {buyerPackPreview && (
        <pre className="text-[11px] bg-sandstone/40 border border-warmborder rounded-xl p-3 overflow-x-auto whitespace-pre-wrap text-espresso">
          {buyerPackPreview}
        </pre>
      )}
    </div>
  );
};
