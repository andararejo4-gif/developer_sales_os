import React, { useState } from 'react';
import { UserPlus, X, Mail, Phone, Lock, MapPin, Target, ShieldCheck } from 'lucide-react';
import { addNewSeInhouse } from '../lib/auth/se-management';

interface AddSeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (nama: string) => void;
  projectId?: string;
}

export const AddSeModal: React.FC<AddSeModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  projectId = 'the-park-sukoharjo',
}) => {
  const [nama, setNama] = useState('');
  const [email, setEmail] = useState('');
  const [noWa, setNoWa] = useState('');
  const [password, setPassword] = useState('AndaraSE#2026');
  const [zonaHariIni, setZonaHariIni] = useState('Zona A (Perkantoran)');
  const [targetNetSales, setTargetNetSales] = useState(2);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const result = addNewSeInhouse({
      nama,
      email,
      noWa,
      password,
      zonaHariIni,
      targetNetSales,
      projectId,
    });

    if (!result.ok) {
      setErrorMsg(result.error || 'Gagal menambahkan Sales Executive.');
      return;
    }

    onSuccess(nama);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-espresso/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-white border border-warmborder rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        <div className="p-5 border-b border-warmborder bg-sandstone/40 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="size-9 rounded-xl bg-sandstone flex items-center justify-center border border-warmborder">
              <UserPlus className="size-4.5 text-terracotta" />
            </div>
            <div>
              <h2 className="text-base font-bold text-espresso">Tambah Sales Executive (SE) Baru</h2>
              <p className="text-[11px] text-warmmuted">Otoritas Sales Manager &amp; Admin: Terbitkan akun login SE in-house</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="size-8 rounded-xl hover:bg-sandstone text-warmmuted hover:text-espresso flex items-center justify-center cursor-pointer"
          >
            <X className="size-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto text-xs">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-semibold">
              {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="font-bold text-espresso block mb-1">Nama Lengkap SE *</label>
              <input
                type="text"
                required
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                placeholder="Contoh: Fajar Pratama"
                className="w-full h-9 px-3 rounded-xl border border-warmborder bg-sandstone/30 text-espresso font-medium focus:border-terracotta focus:outline-none"
              />
            </div>

            <div>
              <label className="font-bold text-espresso block mb-1">Nomor WhatsApp *</label>
              <div className="relative">
                <Phone className="size-3.5 text-warmmuted absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  required
                  value={noWa}
                  onChange={(e) => setNoWa(e.target.value)}
                  placeholder="08123456789"
                  className="w-full h-9 pl-8 pr-3 rounded-xl border border-warmborder bg-sandstone/30 text-espresso font-medium focus:border-terracotta focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="font-bold text-espresso block mb-1">Email Login SE *</label>
              <div className="relative">
                <Mail className="size-3.5 text-warmmuted absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="fajar@andararejomakmur.co.id"
                  className="w-full h-9 pl-8 pr-3 rounded-xl border border-warmborder bg-sandstone/30 text-espresso font-medium focus:border-terracotta focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-espresso block mb-1">Kata Sandi Awal *</label>
              <div className="relative">
                <Lock className="size-3.5 text-warmmuted absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="AndaraSE#2026"
                  className="w-full h-9 pl-8 pr-3 rounded-xl border border-warmborder bg-sandstone/30 text-espresso font-medium focus:border-terracotta focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="font-bold text-espresso block mb-1">Zona Canvassing Awal</label>
              <div className="relative">
                <MapPin className="size-3.5 text-warmmuted absolute left-3 top-1/2 -translate-y-1/2" />
                <select
                  value={zonaHariIni}
                  onChange={(e) => setZonaHariIni(e.target.value)}
                  className="w-full h-9 pl-8 pr-3 rounded-xl border border-warmborder bg-sandstone/30 text-espresso font-medium focus:border-terracotta focus:outline-none"
                >
                  <option value="Zona A (Perkantoran)">Zona A (Perkantoran)</option>
                  <option value="Zona B (Komersial & Ruko)">Zona B (Komersial &amp; Ruko)</option>
                  <option value="Zona C (Ruko Sentra Bisnis)">Zona C (Ruko Sentra Bisnis)</option>
                  <option value="Zona D (Pendidikan/Bank)">Zona D (Pendidikan/Bank)</option>
                  <option value="Zona E (Residensial Lama)">Zona E (Residensial Lama)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="font-bold text-espresso block mb-1">Target Net Sales Bulanan</label>
              <div className="relative">
                <Target className="size-3.5 text-warmmuted absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={targetNetSales}
                  onChange={(e) => setTargetNetSales(Number(e.target.value) || 2)}
                  className="w-full h-9 pl-8 pr-3 rounded-xl border border-warmborder bg-sandstone/30 text-espresso font-bold focus:border-terracotta focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200 text-[11px] text-amber-900 flex items-start gap-2">
            <ShieldCheck className="size-4 text-terracotta shrink-0 mt-0.5" />
            <p>
              Akun SE in-house yang dibuat otomatis dapat digunakan untuk login ke portal sales via email &amp; kata sandi yang ditentukan, serta terdaftar dalam pantauan ritme kerja Playbook 18.00.
            </p>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2 border-t border-warmborder">
            <button
              type="button"
              onClick={onClose}
              className="h-9 px-4 rounded-xl border border-warmborder text-xs font-semibold text-espresso hover:bg-sandstone cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="h-9 px-4 rounded-xl bg-terracotta hover:bg-terracotta/90 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <UserPlus className="size-3.5" />
              <span>Simpan &amp; Terbitkan Akun</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
