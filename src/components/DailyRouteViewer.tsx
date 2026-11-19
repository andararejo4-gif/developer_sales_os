// ============================================================================
// DAILY ROUTE VIEWER - DEVELOPER SALES OS
// GPS-Guided Canvassing Route for Sales Executive (Printable & Mobile-First)
// ============================================================================

import { useState } from 'react';
import {
  MapPin,
  Clock,
  Printer,
  X,
  Navigation,
} from 'lucide-react';
import { generateDailyRoutePlan } from '../lib/playbook/route-generator';
import type { DailyRoutePlan } from '../lib/playbook/types';

interface DailyRouteViewerProps {
  projectId?: string;
  projectName?: string;
  onClose?: () => void;
}

export function DailyRouteViewer({
  projectName = 'The Park Townhouse Sukoharjo',
  onClose,
}: DailyRouteViewerProps) {
  const [selectedDay, setSelectedDay] = useState<string>('Senin');
  const route: DailyRoutePlan = generateDailyRoutePlan(selectedDay);

  const days = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-espresso/70 backdrop-blur-sm flex justify-center p-3 md:p-6 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-warmborder w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 bg-sandstone/60 border-b border-warmborder flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="size-11 rounded-2xl bg-terracotta text-white flex items-center justify-center shadow-sm">
              <Navigation className="size-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg md:text-xl font-extrabold text-espresso tracking-tight">
                  Rute Harian &amp; Kanvasing Sales Executive
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-terracotta/10 text-terracotta border border-terracotta/20">
                  {selectedDay}
                </span>
              </div>
              <p className="text-xs text-warmmuted">
                {projectName} · Titik Awal: {route.startPoint.name}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-terracotta text-white hover:bg-terracotta/90 flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
            >
              <Printer className="size-3.5" />
              <span>Cetak Lembar Rute</span>
            </button>

            {onClose && (
              <button
                onClick={onClose}
                className="size-9 rounded-xl hover:bg-sandstone text-warmmuted hover:text-espresso flex items-center justify-center transition-colors cursor-pointer ml-1"
              >
                <X className="size-5" />
              </button>
            )}
          </div>
        </div>

        {/* Day Selector Bar */}
        <div className="px-6 py-3 bg-white border-b border-warmborder flex items-center justify-between gap-3 shrink-0">
          <span className="text-xs font-bold text-warmmuted">Pilih Hari Kanvasing:</span>
          <div className="flex gap-1 overflow-x-auto">
            {days.map((day) => (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedDay === day
                    ? 'bg-espresso text-white shadow-sm'
                    : 'bg-sandstone text-warmmuted hover:text-espresso'
                }`}
              >
                {day}
              </button>
            ))}
          </div>
        </div>

        {/* Route Summary Metrics Banner */}
        <div className="px-6 py-3 bg-sandstone/30 border-b border-warmborder grid grid-cols-3 gap-4 text-center shrink-0">
          <div>
            <span className="text-[10px] font-bold text-warmmuted uppercase">Total Jarak Tempuh</span>
            <p className="text-sm font-extrabold text-espresso">{route.totalDistanceKm} km</p>
          </div>
          <div>
            <span className="text-[10px] font-bold text-warmmuted uppercase">Estimasi Waktu Lapangan</span>
            <p className="text-sm font-extrabold text-espresso">{route.estimatedHours} Jam</p>
          </div>
          <div>
            <span className="text-[10px] font-bold text-warmmuted uppercase">Target Lead Baru</span>
            <p className="text-sm font-extrabold text-terracotta">{route.totalLeadTarget} Kontak Prospek</p>
          </div>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto flex-1 bg-[#FBF9F5] space-y-6">
          {/* Waypoints Flow */}
          <div className="space-y-3">
            <h3 className="text-sm font-extrabold text-espresso flex items-center gap-2">
              <MapPin className="size-4 text-terracotta" />
              Titik Kunjungan Lapangan Terurut ({route.waypoints.length} Titik)
            </h3>

            <div className="space-y-3">
              {route.waypoints.map((wp) => (
                <div
                  key={wp.order}
                  className="p-4 rounded-2xl bg-white border border-warmborder shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3.5">
                    <div className="size-9 rounded-xl bg-terracotta text-white flex items-center justify-center font-black text-xs shrink-0 shadow-sm">
                      {wp.order}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-sandstone text-warmmuted">
                          {wp.category}
                        </span>
                        <span className="text-xs font-bold text-olive">
                          Waktu tempuh ± {wp.estimatedDriveMinutes} mnt
                        </span>
                      </div>
                      <h4 className="text-sm font-extrabold text-espresso mt-0.5">
                        {wp.name}
                      </h4>
                      <p className="text-xs text-warmmuted mt-0.5">
                        {wp.canvassingObjective}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-xs bg-amber-50/50 p-2.5 rounded-xl border border-amber-100 shrink-0">
                    <div>
                      <span className="text-[10px] text-warmmuted block">Durasi Kanvasing:</span>
                      <strong className="text-espresso">{wp.canvassingDurationMinutes} menit</strong>
                    </div>
                    <div className="border-l border-amber-200 pl-3">
                      <span className="text-[10px] text-warmmuted block">Target Flyer:</span>
                      <strong className="text-espresso">{wp.flyersTarget} Lembar</strong>
                    </div>
                    <div className="border-l border-amber-200 pl-3">
                      <span className="text-[10px] text-warmmuted block">Target Kontak:</span>
                      <strong className="text-terracotta">{wp.leadTarget} Lead</strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Hourly Timeline */}
          <div className="bg-white p-5 rounded-3xl border border-warmborder shadow-sm space-y-4">
            <h3 className="text-sm font-extrabold text-espresso flex items-center gap-2">
              <Clock className="size-4 text-terracotta" />
              Jadwal Rundown Aktivitas Per Jam (08:00 - 17:30 WIB)
            </h3>

            <div className="space-y-2.5">
              {route.hourlySchedule.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 p-3 rounded-xl bg-sandstone/30 border border-warmborder/60 text-xs"
                >
                  <span className="font-mono font-bold text-terracotta shrink-0 w-28">
                    {item.timeRange}
                  </span>
                  <div className="flex-1">
                    <p className="font-extrabold text-espresso">{item.activity}</p>
                    <p className="text-warmmuted text-[11px] mt-0.5">
                      Lokasi: {item.location} &middot; <span className="italic">{item.notes}</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
