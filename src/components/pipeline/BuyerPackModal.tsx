import React, { useState } from 'react';
import {
  X,
  Printer,
  Building2,
  CheckCircle2,
  User,
  FileText,
} from 'lucide-react';
import type { PipelineLeadRecord } from '../PipelinePage';
import { PLAYBOOK_UNIT_CATALOG } from '../../lib/kb/playbook-v1-2-knowledge';

interface BuyerPackModalProps {
  lead: PipelineLeadRecord;
  projectName?: string;
  onClose: () => void;
}

export const BuyerPackModal: React.FC<BuyerPackModalProps> = ({
  lead,
  projectName = 'The Park Townhouse Sukoharjo',
  onClose,
}) => {
  const selectedUnit1 =
    PLAYBOOK_UNIT_CATALOG.find((u) => u.label.includes(lead.unit_interest)) || PLAYBOOK_UNIT_CATALOG[0];
  const selectedUnit2 = PLAYBOOK_UNIT_CATALOG[1] || PLAYBOOK_UNIT_CATALOG[0];

  const [surveyDate, setSurveyDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  const [surveyTime, setSurveyTime] = useState('10:00 WIB');

  const handlePrint = () => {
    window.print();
  };

  const rupiah = (n: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);

  return (
    <div className="fixed inset-0 z-50 bg-espresso/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full border border-warmborder shadow-2xl overflow-hidden max-h-[92vh] flex flex-col animate-in zoom-in-95">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-warmborder bg-sandstone/50 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-terracotta text-white">
              <FileText className="size-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-espresso">
                  Paket Kunjungan Calon Pembeli (Buyer Pack · F57)
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300">
                  Grade {lead.grade} · BANT {lead.bant_total}/12
                </span>
              </div>
              <p className="text-xs text-warmmuted">
                {projectName} · Ringkasan komprehensif profil calon pembeli, perbandingan 2 unit, dan estimasi pembiayaan untuk survei show unit.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="size-9 rounded-xl hover:bg-sandstone text-warmmuted hover:text-espresso flex items-center justify-center cursor-pointer"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 bg-[#FBF9F5] flex-1 text-xs text-espresso">
          {/* Box 1: Profil Pembeli & Jadwal Kunjungan */}
          <div className="p-4 rounded-2xl bg-white border border-warmborder shadow-2xs space-y-3">
            <h4 className="font-extrabold text-espresso uppercase tracking-wider text-[11px] flex items-center gap-1.5 border-b border-warmborder pb-2">
              <User className="size-3.5 text-terracotta" />
              <span>Profil Calon Pembeli &amp; Jadwal</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <span className="text-warmmuted block text-[10px]">Nama Lengkap:</span>
                <span className="font-extrabold text-espresso text-sm">{lead.full_name}</span>
              </div>
              <div>
                <span className="text-warmmuted block text-[10px]">WhatsApp:</span>
                <span className="font-extrabold text-espresso text-sm">{lead.phone_wa}</span>
              </div>
              <div>
                <span className="text-warmmuted block text-[10px]">Domisili Saat Ini:</span>
                <span className="font-semibold text-espresso">{lead.domicile || 'Solo Raya / Sekitarnya'}</span>
              </div>
              <div>
                <span className="text-warmmuted block text-[10px]">Persona Pembeli:</span>
                <span className="font-semibold text-terracotta">{lead.persona_code} · {lead.persona_profile?.customLabel || 'Keluarga Mandiri'}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-warmborder/60">
              <div>
                <label className="text-warmmuted block text-[10px] mb-1">Rencana Tanggal Survei:</label>
                <input
                  type="date"
                  value={surveyDate}
                  onChange={(e) => setSurveyDate(e.target.value)}
                  className="w-full h-8 px-2.5 rounded-lg border border-warmborder bg-sandstone/30 font-semibold"
                />
              </div>
              <div>
                <label className="text-warmmuted block text-[10px] mb-1">Waktu Janji Temu:</label>
                <input
                  type="text"
                  value={surveyTime}
                  onChange={(e) => setSurveyTime(e.target.value)}
                  placeholder="Contoh: 10:00 WIB"
                  className="w-full h-8 px-2.5 rounded-lg border border-warmborder bg-sandstone/30 font-semibold"
                />
              </div>
            </div>
          </div>

          {/* Box 2: Perbandingan 2 Unit Rekomendasi */}
          <div className="p-4 rounded-2xl bg-white border border-warmborder shadow-2xs space-y-3">
            <h4 className="font-extrabold text-espresso uppercase tracking-wider text-[11px] flex items-center gap-1.5 border-b border-warmborder pb-2">
              <Building2 className="size-3.5 text-terracotta" />
              <span>Dua Alternatif Unit Rekomendasi (F57)</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Opsi 1 */}
              <div className="p-3.5 rounded-xl border border-terracotta/30 bg-terracotta/5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded bg-terracotta text-white font-extrabold text-[10px]">
                    OPSI UTAMA
                  </span>
                  <span className="font-bold text-terracotta">{selectedUnit1.cluster}</span>
                </div>
                <p className="font-extrabold text-espresso text-sm">{selectedUnit1.label}</p>
                <p className="text-warmmuted text-[11px]">Segmen: {selectedUnit1.group}</p>
                <div className="pt-2 border-t border-warmborder/40 space-y-0.5">
                  <p className="font-semibold text-espresso">
                    Cash Keras: <span className="text-terracotta font-extrabold">{rupiah(selectedUnit1.priceCashIdr)}</span>
                  </p>
                  <p className="text-warmmuted text-[10px]">
                    Est. KPR (DP 10% · 20 Th): ~Rp4.2 Jt/bln
                  </p>
                </div>
              </div>

              {/* Opsi 2 */}
              <div className="p-3.5 rounded-xl border border-warmborder bg-sandstone/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded bg-espresso text-white font-extrabold text-[10px]">
                    OPSI ALTERNATIF
                  </span>
                  <span className="font-bold text-espresso">{selectedUnit2.cluster}</span>
                </div>
                <p className="font-extrabold text-espresso text-sm">{selectedUnit2.label}</p>
                <p className="text-warmmuted text-[11px]">Segmen: {selectedUnit2.group}</p>
                <div className="pt-2 border-t border-warmborder/40 space-y-0.5">
                  <p className="font-semibold text-espresso">
                    Cash Keras: <span className="text-espresso font-extrabold">{rupiah(selectedUnit2.priceCashIdr)}</span>
                  </p>
                  <p className="text-warmmuted text-[10px]">
                    Est. KPR (DP 10% · 20 Th): ~Rp4.8 Jt/bln
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Box 3: Checklist Persiapan Kunjungan SE */}
          <div className="p-4 rounded-2xl bg-white border border-warmborder shadow-2xs space-y-2.5">
            <h4 className="font-extrabold text-espresso uppercase tracking-wider text-[11px] flex items-center gap-1.5 border-b border-warmborder pb-2">
              <CheckCircle2 className="size-3.5 text-olive" />
              <span>Checklist Kelengkapan SE Saat Menyambut</span>
            </h4>
            <div className="space-y-1.5 text-warmmuted">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" defaultChecked className="accent-terracotta size-3.5" />
                <span>Show unit cluster telah dipastikan bersih, wangi, dan kunci tersedia di pos security.</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" defaultChecked className="accent-terracotta size-3.5" />
                <span>Brosur fisik mewah &amp; lembar simulasi cicilan KPR resmi PT Andara Rejo Makmur telah dicetak.</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" defaultChecked className="accent-terracotta size-3.5" />
                <span>Form Tanda Jadi / Booking Fee Rp5 Juta siap dengan nomor rekening resmi pengembang.</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" defaultChecked className="accent-terracotta size-3.5" />
                <span>Minuman sambutan dan payung cadangan siap di Marketing Gallery.</span>
              </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-warmborder bg-sandstone/60 flex items-center justify-between gap-3 shrink-0">
          <span className="text-[11px] text-warmmuted">
            *Dokumen ini bersifat rahasia operasional internal PT Andara Rejo Makmur.
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl bg-white border border-warmborder hover:bg-sandstone text-xs font-semibold text-espresso cursor-pointer"
            >
              Tutup
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-terracotta hover:bg-terracotta/90 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Printer className="size-4" />
              <span>Cetak / Simpan PDF</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
