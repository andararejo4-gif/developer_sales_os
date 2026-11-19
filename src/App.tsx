import { useEffect, useMemo, useState } from 'react'
import { Award, Building2, ClipboardCheck, Copy, LayoutDashboard, Map, Plus, Send, Share2 } from 'lucide-react'
import { DEFAULT_ITEMS, PERIODS, SCORECARD_DATA, evalStatus, type Category, type PeriodKey, type ReportItem, type Status } from './data'

const STORAGE_KEY = 'andara_se_report_terracotta_v1'
const USER = 'Raka Pratama'

const today = new Intl.DateTimeFormat('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date())
const todayShort = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date())

function loadItems(): ReportItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as ReportItem[]
  } catch {
    /* data rusak: pakai default */
  }
  return structuredClone(DEFAULT_ITEMS)
}

const BADGES: Record<Status, { cls: string; text: string }> = {
  hit: { cls: 'bg-lime-100 text-olive', text: 'HIT' },
  near: { cls: 'bg-amber-50 text-terracotta', text: 'PROSES' },
  note: { cls: 'bg-sandstone text-espresso', text: 'TERISI' },
  low: { cls: 'bg-rose-50 text-rose-700', text: 'KURANG' },
  empty: { cls: 'bg-rose-50 text-rose-700', text: 'KURANG' },
}

function Badge({ status }: { status: Status }) {
  const b = BADGES[status]
  return <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${b.cls}`}>{b.text}</span>
}

const NAV = [
  { href: '#', label: 'Beranda', icon: LayoutDashboard },
  { href: '#scorecard-bulanan', label: 'Scorecard', icon: Award },
  { href: '#laporan-harian', label: 'Laporan Harian', icon: ClipboardCheck },
  { href: '#', label: 'Pipeline', icon: Building2, toast: 'Pipeline' },
  { href: '#', label: 'Siteplan', icon: Map, toast: 'Siteplan' },
]

export default function App() {
  const [items, setItems] = useState<ReportItem[]>(loadItems)
  const [filter, setFilter] = useState<'all' | Category>('all')
  const [period, setPeriod] = useState<PeriodKey>('harian')
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  }, [items])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 2400)
    return () => clearTimeout(t)
  }, [toast])

  const list = useMemo(() => (filter === 'all' ? items : items.filter((r) => r.cat === filter)), [items, filter])
  const hits = items.filter((r) => r.targetNum !== null && evalStatus(r) === 'hit').length
  const p = PERIODS[period]

  const update = (id: number, field: 'realisasi' | 'catatan', value: string) =>
    setItems((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)))

  const reset = () => {
    setItems(structuredClone(DEFAULT_ITEMS))
    setToast('Laporan direset')
  }

  const copyWa = async () => {
    const lines = [`*LAPORAN HARIAN SE — ANDARA LIVING*`, `${todayShort} | ${USER} | Scorecard: 112.5 Poin`, '']
    items.forEach((r, i) => lines.push(`${i + 1}. *${r.item}*: ${r.realisasi} (Target: ${r.target})${r.catatan ? ' — ' + r.catatan : ''}`))
    try {
      await navigator.clipboard.writeText(lines.join('\n'))
      setToast('Laporan WA disalin!')
    } catch {
      setToast('Gagal menyalin')
    }
  }

  const filters: { key: 'all' | Category; label: string }[] = [
    { key: 'all', label: `Semua (${items.length})` },
    { key: 'prospek', label: 'Prospek' },
    { key: 'outreach', label: 'Outreach' },
    { key: 'closing', label: 'Closing & KPR' },
  ]

  return (
    <div className="min-h-screen md:flex">
      {/* Sidebar desktop */}
      <aside className="hidden md:flex md:w-64 md:shrink-0 md:flex-col md:sticky md:top-0 md:h-screen bg-white border-r border-warmborder px-5 py-6 justify-between">
        <div>
          <div className="flex items-center gap-3 pb-5 border-b border-warmborder">
            <div className="size-10 rounded-xl bg-terracotta text-white grid place-items-center font-extrabold text-base">A</div>
            <div>
              <p className="font-bold text-sm">Andara Living</p>
              <p className="text-xs text-warmmuted">Boutique Property OS</p>
            </div>
          </div>
          <button onClick={() => setToast('Form Leads Baru')} className="mt-5 w-full h-11 rounded-xl bg-espresso text-white text-sm font-semibold flex items-center justify-center gap-2 hover:bg-espresso/90 cursor-pointer">
            <Plus className="size-4 text-amber-400" /> Leads Baru
          </button>
          <nav className="mt-6 space-y-1">
            {NAV.map((n, i) => (
              <a
                key={n.label}
                href={n.href}
                onClick={n.toast ? () => setToast(n.toast!) : undefined}
                className={`flex items-center gap-3 h-10 px-3.5 rounded-xl text-sm ${i === 0 ? 'bg-amber-50 text-terracotta font-bold' : 'font-medium text-warmmuted hover:bg-sandstone hover:text-espresso'}`}
              >
                <n.icon className="size-4" /> <span>{n.label}</span>
              </a>
            ))}
          </nav>
        </div>
        <div className="rounded-xl bg-sandstone p-3.5">
          <p className="text-xs font-bold">{USER}</p>
          <p className="text-[11px] text-warmmuted">SE · Villa &amp; Cluster</p>
        </div>
      </aside>

      <main className="flex-1 min-w-0 pb-28 md:pb-12">
        <header className="hidden md:flex items-center justify-between px-8 py-5 bg-white border-b border-warmborder sticky top-0 z-20">
          <div>
            <h1 className="text-xl font-bold">Beranda Saya</h1>
            <p className="text-xs text-warmmuted mt-0.5">{today} · Performa &amp; Scorecard SE</p>
          </div>
          <button onClick={copyWa} className="h-10 px-4 rounded-xl bg-terracotta text-white text-xs font-semibold flex items-center gap-2 hover:bg-terracotta/90 cursor-pointer">
            <Share2 className="size-3.5" /> Salin Laporan WA
          </button>
        </header>

        <div className="max-w-6xl mx-auto px-4 pt-5 md:px-8 md:pt-8 space-y-6">
          {/* Intro mobile */}
          <div className="md:hidden flex items-center justify-between gap-3 pb-3 border-b border-warmborder">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-terracotta">Andara Living</p>
              <h1 className="text-xl font-extrabold">Beranda SE</h1>
              <p className="text-xs text-warmmuted">{USER} · {todayShort}</p>
            </div>
            <button onClick={copyWa} className="min-h-[44px] px-3.5 rounded-xl bg-terracotta text-white text-xs font-semibold flex items-center gap-1.5 shrink-0">
              <Copy className="size-3.5" /> Salin WA
            </button>
          </div>

          {/* Ringkasan */}
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <div className="lg:col-span-4 bg-espresso text-white rounded-2xl p-6 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">Skor Harian</span>
                <div className="inline-flex rounded-lg bg-white/10 p-0.5">
                  {(Object.keys(PERIODS) as PeriodKey[]).map((k) => (
                    <button key={k} onClick={() => setPeriod(k)} className={`px-2.5 py-1 text-xs rounded-md cursor-pointer ${period === k ? 'font-semibold bg-terracotta text-white' : 'font-medium text-white/70'}`}>
                      {PERIODS[k].label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="my-5 flex items-center gap-5">
                <div className="relative size-28 shrink-0 grid place-items-center">
                  <svg viewBox="0 0 120 120" className="size-28 -rotate-90">
                    <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="10" />
                    <circle cx="60" cy="60" r="50" fill="none" stroke="#D97706" strokeWidth="10" strokeLinecap="round" strokeDasharray="314.16" strokeDashoffset={p.dash} className="transition-all duration-500" />
                  </svg>
                  <div className="absolute text-center">
                    <p className="text-2xl font-extrabold tabular-nums leading-none">{p.score}</p>
                    <p className="text-[11px] text-white/60 mt-1">/ 115</p>
                  </div>
                </div>
                <div>
                  <p className="text-base font-bold">{p.tier}</p>
                  <p className="text-xs text-white/70 mt-1 tabular-nums">{p.meta}</p>
                </div>
              </div>
              <p className="text-xs text-white/60 pt-3 border-t border-white/10">Scorecard Bulanan saat ini: 112.5 Poin.</p>
            </div>

            <div className="lg:col-span-8 flex flex-col gap-5">
              <div className="grid grid-cols-3 gap-3">
                <Stat label="Lead Hari Ini" value="6" suffix="/ 8" />
                <Stat label="Hot Prospek" value="4" accent />
                <Stat label="Posting" value="4" suffix="/ 9" />
              </div>
              <div className="bg-white border border-warmborder rounded-2xl p-5 flex-1 flex flex-col justify-between">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-warmmuted">Omzet Bulan Ini (Closing Valid)</p>
                    <p className="text-2xl font-extrabold tabular-nums mt-1">Rp 1.850.000.000</p>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-lime-100 text-olive">74% Target</span>
                </div>
                <div className="mt-4 h-2.5 rounded-full bg-sandstone overflow-hidden">
                  <div className="h-full bg-terracotta rounded-full" style={{ width: '74%' }} />
                </div>
                <p className="mt-4 pt-3 border-t border-warmborder text-xs text-warmmuted">3 unit terjual · Target Rp 2,5 M · 24 pintu canvassing</p>
              </div>
            </div>
          </section>

          {/* Scorecard */}
          <section id="scorecard-bulanan" className="bg-white border border-warmborder rounded-2xl overflow-hidden scroll-mt-20">
            <div className="p-5 border-b border-warmborder flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2.5">
                  <h2 className="text-base font-bold">Scorecard Bulanan (Bobot Penilaian)</h2>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-lg bg-amber-50 text-terracotta tabular-nums">112.5 Poin</span>
                </div>
                <p className="text-xs text-warmmuted mt-0.5">7 komponen bobot penilaian resmi SE.</p>
              </div>
              <span className="text-xs font-bold text-olive bg-lime-100 px-3 py-1 rounded-lg">Grade A</span>
            </div>
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-sandstone/70 border-b border-warmborder text-[11px] font-bold uppercase tracking-wider text-warmmuted">
                    <th className="py-3 px-5">Komponen</th><th className="py-3 px-4">Bobot</th><th className="py-3 px-4">Target</th><th className="py-3 px-4">Capaian</th><th className="py-3 px-5 text-right">Poin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-warmborder text-sm">
                  {SCORECARD_DATA.map((s) => (
                    <tr key={s.komponen} className="hover:bg-sandstone/50">
                      <td className="py-3 px-5 font-semibold">{s.komponen}<span className="block text-[11px] font-normal text-warmmuted">{s.note}</span></td>
                      <td className="py-3 px-4 font-bold text-terracotta tabular-nums">{s.bobot}</td>
                      <td className="py-3 px-4 text-xs text-warmmuted">{s.target}</td>
                      <td className="py-3 px-4 text-xs font-medium">{s.capaian}</td>
                      <td className="py-3 px-5 text-right font-extrabold tabular-nums">{s.poin}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="md:hidden divide-y divide-warmborder">
              {SCORECARD_DATA.map((s) => (
                <div key={s.komponen} className="p-4 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold">{s.komponen}</p>
                    <p className="text-xs text-warmmuted mt-0.5">Bobot {s.bobot} · Target: {s.target}</p>
                    <p className="text-xs font-medium mt-1">{s.capaian}</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg bg-amber-50 text-terracotta text-xs font-extrabold tabular-nums shrink-0">{s.poin}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Laporan harian */}
          <section id="laporan-harian" className="bg-white border border-warmborder rounded-2xl overflow-hidden scroll-mt-20">
            <div className="p-5 border-b border-warmborder flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <div className="flex items-center gap-2.5">
                  <h2 className="text-base font-bold">Laporan Harian SE (13 Item)</h2>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-lg bg-amber-50 text-terracotta">{hits}/10 Hit</span>
                </div>
                <p className="text-xs text-warmmuted mt-0.5">Edit realisasi &amp; catatan langsung. Tersimpan otomatis di perangkat.</p>
              </div>
              <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
                {filters.map((f) => (
                  <button key={f.key} onClick={() => setFilter(f.key)} className={`min-h-[36px] px-3 rounded-lg text-xs shrink-0 cursor-pointer ${filter === f.key ? 'font-semibold bg-espresso text-white' : 'font-medium bg-sandstone text-warmmuted'}`}>
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-sandstone/70 border-b border-warmborder text-[11px] font-bold uppercase tracking-wider text-warmmuted">
                    <th className="py-3 px-5 w-[34%]">Item</th><th className="py-3 px-4 w-[13%]">Target</th><th className="py-3 px-4 w-[21%]">Realisasi</th><th className="py-3 px-4 w-[24%]">Catatan</th><th className="py-3 px-4 w-[8%] text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-warmborder text-sm">
                  {list.map((r) => (
                    <tr key={r.id} className="hover:bg-sandstone/40">
                      <td className="py-3 px-5 font-medium">{r.item}</td>
                      <td className="py-3 px-4 text-xs font-semibold text-warmmuted tabular-nums">{r.target}</td>
                      <td className="py-3 px-4"><input aria-label={`Realisasi ${r.item}`} value={r.realisasi} onChange={(e) => update(r.id, 'realisasi', e.target.value)} className="w-full h-9 px-2.5 rounded-lg border border-warmborder bg-sandstone/40 focus:bg-white focus:border-terracotta focus:outline-none text-sm font-semibold tabular-nums" /></td>
                      <td className="py-3 px-4"><input aria-label={`Catatan ${r.item}`} value={r.catatan} onChange={(e) => update(r.id, 'catatan', e.target.value)} className="w-full h-9 px-2.5 rounded-lg border border-warmborder bg-white focus:border-terracotta focus:outline-none text-xs" /></td>
                      <td className="py-3 px-4 text-right"><Badge status={evalStatus(r)} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="md:hidden divide-y divide-warmborder">
              {list.map((r) => (
                <div key={r.id} className="p-4 space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-bold">{r.item}</p>
                    <Badge status={evalStatus(r)} />
                  </div>
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <span className="block text-[11px] text-warmmuted mb-1">Target</span>
                      <div className="h-11 px-3 rounded-xl bg-sandstone flex items-center text-xs font-semibold text-warmmuted">{r.target}</div>
                    </div>
                    <div>
                      <span className="block text-[11px] text-warmmuted mb-1">Realisasi</span>
                      <input value={r.realisasi} onChange={(e) => update(r.id, 'realisasi', e.target.value)} className="w-full h-11 px-3 rounded-xl border border-warmborder bg-white focus:border-terracotta focus:outline-none text-sm font-bold tabular-nums" />
                    </div>
                  </div>
                  <input value={r.catatan} onChange={(e) => update(r.id, 'catatan', e.target.value)} placeholder="Catatan..." className="w-full h-11 px-3 rounded-xl border border-warmborder bg-sandstone/40 focus:bg-white focus:border-terracotta focus:outline-none text-xs" />
                </div>
              ))}
            </div>

            <div className="p-4 bg-sandstone/60 border-t border-warmborder flex flex-wrap items-center justify-between gap-3">
              <button onClick={reset} className="min-h-[44px] px-3 text-xs font-medium text-warmmuted hover:text-espresso cursor-pointer">Reset Default</button>
              <button onClick={copyWa} className="min-h-[44px] px-5 rounded-xl bg-terracotta text-white text-xs font-semibold flex items-center gap-2 cursor-pointer">
                <Send className="size-3.5" /> Salin Laporan WA
              </button>
            </div>
          </section>
        </div>
      </main>

      {/* Bottom nav mobile */}
      <nav className="md:hidden fixed inset-x-0 bottom-0 z-30 bg-white border-t border-warmborder pb-safe">
        <div className="grid grid-cols-5 h-16 items-center">
          <MobileLink href="#" label="Beranda" icon={LayoutDashboard} active />
          <MobileLink href="#scorecard-bulanan" label="Scorecard" icon={Award} />
          <button onClick={() => setToast('Tambah Lead')} aria-label="Tambah Lead" className="flex items-center justify-center">
            <span className="size-10 rounded-xl bg-terracotta text-white grid place-items-center"><Plus className="size-5" /></span>
          </button>
          <MobileLink href="#laporan-harian" label="Laporan" icon={ClipboardCheck} />
          <MobileLink href="#" label="Siteplan" icon={Map} onClick={() => setToast('Siteplan')} />
        </div>
      </nav>

      {toast && (
        <div role="status" className="fixed bottom-20 md:bottom-6 right-4 z-50 bg-espresso text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-lg">
          {toast}
        </div>
      )}
    </div>
  )
}

function Stat({ label, value, suffix, accent }: { label: string; value: string; suffix?: string; accent?: boolean }) {
  return (
    <div className="bg-white border border-warmborder rounded-2xl p-4">
      <p className="text-xs text-warmmuted">{label}</p>
      <p className={`text-2xl font-extrabold tabular-nums mt-1 ${accent ? 'text-terracotta' : ''}`}>
        {value} {suffix && <span className="text-xs font-normal text-warmmuted">{suffix}</span>}
      </p>
    </div>
  )
}

function MobileLink({ href, label, icon: Icon, active, onClick }: { href: string; label: string; icon: typeof Map; active?: boolean; onClick?: () => void }) {
  return (
    <a href={href} onClick={onClick} className={`flex flex-col items-center justify-center gap-1 text-[11px] ${active ? 'font-bold text-terracotta' : 'font-medium text-warmmuted'}`}>
      <Icon className="size-5" />
      <span>{label}</span>
    </a>
  )
}
