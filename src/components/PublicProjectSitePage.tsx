import { useEffect, useState } from 'react';
import { Building2, Calculator, CheckCircle2, MapPin, ShieldCheck, Send, Radio } from 'lucide-react';
import { calculateMortgageInstallment } from '../lib/website-generator/the-park-landing-data';
import { formatRupiah } from '../lib/sales-target/calculator';

interface PublicUnit {
  id: string;
  unitCode: string;
  cluster: string;
  unitType: string;
  ltSqm: number;
  lbSqm: number;
  priceCash: number;
  priceKpr: number;
  status: string;
}

interface PublicSiteInfo {
  slug: string;
  projectId: string;
  projectName: string;
  developer: string;
  location: string;
  updatedAt: string;
  feedHealthy: boolean;
}

export function PublicProjectSitePage({ slug }: { slug: string }) {
  const [site, setSite] = useState<PublicSiteInfo | null>(null);
  const [units, setUnits] = useState<PublicUnit[]>([]);
  const [feedError, setFeedError] = useState(false);
  const [loading, setLoading] = useState(true);

  const [selectedUnitCode, setSelectedUnitCode] = useState('');
  const [dpPercent, setDpPercent] = useState(10);
  const [tenorYears, setTenorYears] = useState(15);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [websiteHp, setWebsiteHp] = useState(''); // anti-bot honeypot
  const [consentAccepted, setConsentAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [liveSessions, setLiveSessions] = useState<Array<{ id: string; title: string; starts_at: string; location_label: string }>>([]);

  const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const seRef = searchParams?.get('se') || '';

  // Paket 1: tangkap parameter k (kode mitra/kreator), c (kode konten), dan p (persona) + simpan di sessionStorage
  const creatorAttr = (() => {
    const kUrl = (searchParams?.get('k') || '').trim().toUpperCase();
    const cUrl = (searchParams?.get('c') || '').trim();
    const pUrl = (searchParams?.get('p') || '').trim();
    const storageKey = `devos_creator_attr_${slug}`;
    if (typeof window === 'undefined') return { k: kUrl, c: cUrl, p: pUrl };
    try {
      if (kUrl || cUrl || pUrl) {
        const next = { k: kUrl, c: cUrl, p: pUrl };
        window.sessionStorage.setItem(storageKey, JSON.stringify(next));
        return next;
      }
      const raw = window.sessionStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          k: String(parsed?.k || ''),
          c: String(parsed?.c || ''),
          p: String(parsed?.p || ''),
        };
      }
    } catch {
      /* abaikan storage error */
    }
    return { k: kUrl, c: cUrl, p: pUrl };
  })();

  const utmSource =
    searchParams?.get('utm_source') ||
    (creatorAttr.k ? `Kreator ${creatorAttr.k}` : `Website Publik (${slug})`);

  useEffect(() => {
    let active = true;
    fetch(`/api/public/site/${encodeURIComponent(slug)}`)
      .then((r) => r.json())
      .then((json) => {
        if (!active) return;
        if (json.ok && json.site) {
          setSite(json.site);
          setUnits(Array.isArray(json.units) ? json.units : []);
          if (json.units?.[0]?.unitCode) {
            setSelectedUnitCode(json.units[0].unitCode);
          }
        } else {
          setFeedError(true);
        }
      })
      .catch(() => {
        if (active) setFeedError(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    fetch(`/api/public/live/${encodeURIComponent(slug)}`)
      .then((r) => r.json())
      .then((json) => {
        if (active && json.ok && Array.isArray(json.sessions)) {
          setLiveSessions(json.sessions);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [slug]);

  const activeUnit = units.find((u) => u.unitCode === selectedUnitCode) || units[0];
  const sim = calculateMortgageInstallment({
    propertyPriceIdr: activeUnit?.priceKpr || 683_000_000,
    dpPercent,
    interestRateAnnualPercent: 6.5,
    tenorYears,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitMessage(null);
    try {
      const res = await fetch('/api/public/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug,
          name,
          phone,
          unitCode: selectedUnitCode || activeUnit?.unitCode || 'Unit The Park',
          utmSource,
          seRef,
          creatorCode: creatorAttr.k,
          contentCode: creatorAttr.c,
          personaCode: creatorAttr.p,
          consentAccepted,
          consentVersion: 'v1.0',
          website_hp: websiteHp,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setSubmitMessage({ ok: false, text: data.error || 'Gagal mengirim permintaan.' });
      } else {
        setSubmitMessage({ ok: true, text: data.message });
        setName('');
        setPhone('');
        setConsentAccepted(false);
      }
    } catch {
      setSubmitMessage({ ok: false, text: 'Koneksi terputus. Silakan coba lagi.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F4] text-[#2C241E]">
      <header className="border-b border-[#E5DED4] bg-white px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div className="flex items-center gap-3">
            <Building2 className="h-6 w-6 text-[#1E4D3B]" />
            <div>
              <h1 className="text-lg font-bold text-[#1E4D3B]">
                {site?.projectName || 'The Park Townhouse Sukoharjo'}
              </h1>
              <p className="text-xs text-[#6B5E53]">{site?.developer || 'PT Andara Rejo Makmur'}</p>
            </div>
          </div>
          <a
            href="#form-minat"
            className="rounded-lg bg-[#1E4D3B] px-4 py-2 text-sm font-semibold text-white hover:bg-[#163B2D]"
          >
            Jadwalkan Survei
          </a>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-10 px-6 py-10">
        <section className="rounded-2xl bg-gradient-to-br from-[#1E4D3B] to-[#123024] p-8 text-white">
          <span className="inline-block rounded-full bg-white/15 px-3 py-1 text-xs font-medium">
            Hunian Eksklusif 2 Lantai
          </span>
          <h2 className="mt-3 text-3xl font-bold leading-tight">
            {site?.projectName || 'The Park Townhouse Sukoharjo'}
          </h2>
          <p className="mt-2 flex items-center gap-2 text-sm text-white/85">
            <MapPin className="h-4 w-4" />
            {site?.location || 'Jl. Bhayangkara, Sukoharjo (Belakang Alun-alun)'}
          </p>
          <p className="mt-4 max-w-2xl text-sm text-white/80">
            Mulai Rp650 jutaan (Cash) / Rp683 jutaan (KPR). Data ketersediaan unit & harga diperbarui langsung dari sistem resmi developer.
          </p>
        </section>

        <section>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-xl font-bold">Ketersediaan Unit & Harga Aktif</h3>
            {site?.updatedAt && (
              <span className="text-xs text-[#6B5E53]">
                Diperbarui: {new Date(site.updatedAt).toLocaleString('id-ID')}
              </span>
            )}
          </div>

          {loading ? (
            <div className="rounded-xl border border-[#E5DED4] bg-white p-6 text-sm">Memuat daftar unit resmi...</div>
          ) : feedError ? (
            <div className="rounded-xl border border-amber-300 bg-amber-50 p-6 text-sm text-amber-900">
              Feed ketersediaan unit sedang sinkronisasi. Silakan isi form di bawah agar konsultan resmi kami mengonfirmasi unit terbaru.
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {units.slice(0, 12).map((u) => (
                <div
                  key={u.id}
                  onClick={() => setSelectedUnitCode(u.unitCode)}
                  className={`cursor-pointer rounded-xl border p-4 transition ${
                    selectedUnitCode === u.unitCode
                      ? 'border-[#1E4D3B] bg-[#F2F7F4]'
                      : 'border-[#E5DED4] bg-white hover:border-[#1E4D3B]/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#1E4D3B]">Kavling {u.unitCode}</span>
                    <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 uppercase">
                      {u.status === 'available' ? 'Tersedia' : u.status}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-[#6B5E53]">
                    {u.cluster} · LT {u.ltSqm}m² / LB {u.lbSqm}m²
                  </p>
                  <div className="mt-3 space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-[#6B5E53]">Cash:</span>
                      <span className="font-semibold">{formatRupiah(u.priceCash)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#6B5E53]">KPR:</span>
                      <span className="font-semibold">{formatRupiah(u.priceKpr)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-[#E5DED4] bg-white p-6">
            <h3 className="flex items-center gap-2 text-lg font-bold">
              <Calculator className="h-5 w-5 text-[#1E4D3B]" />
              Simulasi Cicilan KPR (Estimasi)
            </h3>
            <div className="mt-4 space-y-3 text-sm">
              <div>
                <label className="block font-medium text-[#6B5E53]">Unit Pilihan</label>
                <select
                  value={selectedUnitCode}
                  onChange={(e) => setSelectedUnitCode(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-[#D8CFC3] px-3 py-2"
                >
                  {units.map((u) => (
                    <option key={u.id} value={u.unitCode}>
                      Kavling {u.unitCode} — {formatRupiah(u.priceKpr)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-[#6B5E53]">DP ({dpPercent}%)</label>
                  <input
                    type="number"
                    min={5}
                    max={50}
                    value={dpPercent}
                    onChange={(e) => setDpPercent(Number(e.target.value) || 10)}
                    className="mt-1 w-full rounded-lg border border-[#D8CFC3] px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block font-medium text-[#6B5E53]">Tenor ({tenorYears} Thn)</label>
                  <input
                    type="number"
                    min={5}
                    max={25}
                    value={tenorYears}
                    onChange={(e) => setTenorYears(Number(e.target.value) || 15)}
                    className="mt-1 w-full rounded-lg border border-[#D8CFC3] px-3 py-2"
                  />
                </div>
              </div>
              <div className="rounded-xl bg-[#FAF8F4] p-4">
                <div className="flex justify-between text-xs text-[#6B5E53]">
                  <span>Estimasi Uang Muka (DP):</span>
                  <span className="font-semibold text-[#2C241E]">{formatRupiah(sim.dpAmountIdr)}</span>
                </div>
                <div className="mt-2 flex justify-between text-base font-bold text-[#1E4D3B]">
                  <span>Estimasi Cicilan / Bulan:</span>
                  <span>{formatRupiah(sim.monthlyInstallmentIdr)}</span>
                </div>
                <p className="mt-2 text-[11px] text-[#6B5E53]">
                  *Simulasi estimasi bunga 6,5%/tahun. Keputusan persetujuan kredit & bunga final ditetapkan oleh bank.
                </p>
              </div>
            </div>
          </div>

          <form
            id="form-minat"
            onSubmit={handleSubmit}
            className="rounded-2xl border border-[#E5DED4] bg-white p-6"
          >
            <h3 className="flex items-center gap-2 text-lg font-bold">
              <ShieldCheck className="h-5 w-5 text-[#1E4D3B]" />
              Minta Brosur, Pricelist & Jadwal Survei
            </h3>
            {creatorAttr.k && (
              <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200 px-3 py-1 text-[11px] font-semibold text-amber-900">
                <span>Sumber Mitra Resmi: {creatorAttr.k}</span>
                {creatorAttr.c && <span className="text-amber-700">· Konten: {creatorAttr.c}</span>}
              </div>
            )}
            <div className="mt-4 space-y-3 text-sm">
              {/* Honeypot anti-bot */}
              <input
                type="text"
                tabIndex={-1}
                autoComplete="off"
                value={websiteHp}
                onChange={(e) => setWebsiteHp(e.target.value)}
                className="hidden"
                aria-hidden="true"
              />
              <div>
                <label className="block font-medium">Nama Lengkap</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Budi Santoso"
                  className="mt-1 w-full rounded-lg border border-[#D8CFC3] px-3 py-2"
                />
              </div>
              <div>
                <label className="block font-medium">Nomor WhatsApp Aktif</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0812xxxxxxxx"
                  className="mt-1 w-full rounded-lg border border-[#D8CFC3] px-3 py-2"
                />
              </div>
              <label className="flex items-start gap-2 pt-1 text-xs text-[#6B5E53]">
                <input
                  type="checkbox"
                  checked={consentAccepted}
                  onChange={(e) => setConsentAccepted(e.target.checked)}
                  required
                  className="mt-0.5"
                />
                <span>
                  Saya menyetujui konsultan resmi PT Andara Rejo Makmur menghubungi saya via WhatsApp terkait informasi unit & jadwal survei (Anda dapat berhenti kapan saja).
                </span>
              </label>

              {submitMessage && (
                <div
                  className={`flex items-center gap-2 rounded-lg p-3 text-xs ${
                    submitMessage.ok ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800'
                  }`}
                >
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>{submitMessage.text}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#1E4D3B] px-4 py-2.5 font-semibold text-white hover:bg-[#163B2D] disabled:opacity-60"
              >
                <Send className="h-4 w-4" />
                {submitting ? 'Mengirim...' : 'Kirim Permintaan Resmi'}
              </button>
            </div>
          </form>
        </section>

        {/* Ruang /live: Jadwal Siaran Live & RSVP Pengingat (F83 + Brief Kreator) */}
        <section id="live" className="rounded-2xl border border-[#E5DED4] bg-white p-6">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <div className="flex items-center gap-2">
              <Radio className="h-5 w-5 text-[#1E4D3B]" />
              <h3 className="text-lg font-bold">Jadwal Siaran Live &amp; Tur Virtual (/live)</h3>
            </div>
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-[#1E4D3B]">
              {liveSessions.length > 0 ? `${liveSessions.length} Sesi Terjadwal` : 'Sesi Harian 19.30 WIB'}
            </span>
          </div>
          {liveSessions.length === 0 ? (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#E5DED4] bg-[#FAF8F4] p-4 text-sm">
              <div>
                <div className="font-semibold">Live Tur Rumah Contoh &amp; Tanya-Jawab KPR</div>
                <div className="text-xs text-[#6B5E53]">Setiap hari pukul 19.30 WIB bersama Tim Resmi &amp; Kreator</div>
              </div>
              <a
                href="#form-minat"
                className="rounded-lg bg-[#1E4D3B] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#163B2D]"
              >
                Daftar Pengingat Live
              </a>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {liveSessions.map((s) => (
                <div key={s.id} className="rounded-xl border border-[#E5DED4] bg-[#FAF8F4] p-4 text-sm">
                  <div className="font-semibold">{s.title}</div>
                  <div className="text-xs text-[#6B5E53] mt-1">
                    {new Date(s.starts_at).toLocaleString('id-ID')} · {s.location_label || 'Live Online'}
                  </div>
                  <a
                    href="#form-minat"
                    className="mt-3 inline-block rounded-lg bg-[#1E4D3B] px-3 py-1.5 text-xs font-semibold text-white"
                  >
                    RSVP Pengingat
                  </a>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
