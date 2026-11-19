-- 0006 · SM, Direksi views, jadwal piket, referral, co-broke, sales library, dan fungsi analitik
begin;

-- ===== 1. Tipe Tambahan =====
do $$
begin
  if not exists (select 1 from pg_type t join pg_namespace n on n.oid = t.typnamespace where t.typname = 'jenis_shift' and n.nspname = 'devos') then
    create type devos.jenis_shift as enum ('pagi_siang', 'malam', 'weekend_full', 'libur');
  end if;
  if not exists (select 1 from pg_type t join pg_namespace n on n.oid = t.typnamespace where t.typname = 'kategori_pemberi_referral' and n.nspname = 'devos') then
    create type devos.kategori_pemberi_referral as enum ('pembeli', 'warga', 'karyawan', 'lainnya');
  end if;
  if not exists (select 1 from pg_type t join pg_namespace n on n.oid = t.typnamespace where t.typname = 'kategori_materi_sales' and n.nspname = 'devos') then
    create type devos.kategori_materi_sales as enum (
      'e_brosur', 'pricelist', 'denah', 'video', 'skrip_penjualan', 'objection_handling', 'keunggulan_99', 'lainnya'
    );
  end if;
end $$;

-- ===== 2. Modul B2 & S15: Jadwal Piket & Shift SE =====
create table if not exists devos.jadwal_piket (
  id              uuid primary key default gen_random_uuid(),
  se_id           uuid not null references devos.pengguna(id) on delete cascade,
  tanggal         date not null,
  shift           devos.jenis_shift not null default 'pagi_siang',
  jam_mulai       time not null default '08:00',
  jam_selesai     time not null default '21:00',
  zona_canvassing text check (zona_canvassing in ('A', 'B', 'C', 'D', 'E')),
  pasangan_se_id  uuid references devos.pengguna(id) on delete set null,
  hadir           boolean,
  catatan         text,
  dibuat_ai       boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (se_id, tanggal)
);
create index if not exists jadwal_piket_tgl_idx on devos.jadwal_piket (tanggal, shift);

-- ===== 3. Modul L5: Manajemen Agen Co-broke =====
create table if not exists devos.agen_cobroke (
  id             uuid primary key default gen_random_uuid(),
  nama_kantor    text not null,
  nama_agen      text not null,
  no_wa          text not null check (no_wa ~ '^\+?[0-9]{8,15}$'),
  email          text,
  komisi_persen  numeric(5,2) not null default 2.50 check (komisi_persen >= 0),
  aktif          boolean not null default true,
  catatan        text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index if not exists agen_cobroke_wa_idx on devos.agen_cobroke (no_wa);

-- Hubungkan lead & booking ke agen co-broke jika bersumber dari agen (A6, L5)
alter table devos.lead add column if not exists agen_cobroke_id uuid references devos.agen_cobroke(id) on delete set null;
alter table devos.booking add column if not exists agen_cobroke_id uuid references devos.agen_cobroke(id) on delete set null;

-- ===== 4. Modul L4: Program Referral "Sahabat The Park" =====
create table if not exists devos.referral (
  id               uuid primary key default gen_random_uuid(),
  proyek_id        uuid not null references devos.proyek(id) on delete restrict,
  nama_pemberi     text not null,
  no_wa_pemberi    text not null check (no_wa_pemberi ~ '^\+?[0-9]{8,15}$'),
  kategori_pemberi devos.kategori_pemberi_referral not null default 'pembeli',
  lead_id          uuid references devos.lead(id) on delete set null,
  booking_id       uuid references devos.booking(id) on delete set null,
  se_id            uuid references devos.pengguna(id) on delete set null,
  nominal_imbalan  numeric(16,2) not null default 0 check (nominal_imbalan >= 0),
  status           text not null default 'terdaftar' check (status in ('terdaftar', 'prospek', 'booking', 'net_sales', 'batal')),
  dibayar_pada     timestamptz,
  catatan          text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index if not exists referral_proyek_idx on devos.referral (proyek_id, status);

-- ===== 5. Modul P: Sales Library & Enablement (P1, P3, P4, P5) =====
create table if not exists devos.sales_library (
  id               uuid primary key default gen_random_uuid(),
  proyek_id        uuid references devos.proyek(id) on delete cascade,
  kategori         devos.kategori_materi_sales not null,
  judul            text not null,
  konten_teks      text,
  file_url         text,
  tag_persona      devos.persona[],
  nomor_keunggulan smallint check (nomor_keunggulan between 1 and 99),
  berlaku_sampai   date,
  aktif            boolean not null default true,
  dibuat_oleh      uuid references devos.pengguna(id) on delete set null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index if not exists sales_lib_kategori_idx on devos.sales_library (kategori, aktif);

-- Triggers updated_at
create trigger jadwal_piket_updated  before update on devos.jadwal_piket for each row execute function devos.set_updated_at();
create trigger agen_cobroke_updated  before update on devos.agen_cobroke for each row execute function devos.set_updated_at();
create trigger referral_updated      before update on devos.referral     for each row execute function devos.set_updated_at();
create trigger sales_library_updated before update on devos.sales_library for each row execute function devos.set_updated_at();

-- ===== 6. Helper Security & Session Context (RBAC Q4) =====
create or replace function devos.current_user_id() returns uuid
language sql stable as $$
  select nullif(current_setting('devos.user_id', true), '')::uuid;
$$;

create or replace function devos.current_user_role() returns devos.role_pengguna
language sql stable as $$
  select role from devos.pengguna where id = devos.current_user_id();
$$;

-- ===== 7. VIEWS UNTUK DIREKSI (Portofolio Proyek, Target & Aktual) =====

-- View 7.1: Portofolio Proyek per Direksi
create or replace view devos.v_direksi_portofolio as
select
  d.id as direksi_id,
  d.nama as direksi_nama,
  d.email as direksi_email,
  p.id as proyek_id,
  p.kode as kode_proyek,
  p.nama as nama_proyek,
  p.tipe as tipe_proyek,
  p.lokasi as lokasi_proyek,
  p.aktif as proyek_aktif,
  count(distinct u.id) as total_unit,
  count(distinct u.id) filter (where u.status = 'tersedia') as unit_tersedia,
  count(distinct u.id) filter (where u.status = 'hold') as unit_hold,
  count(distinct u.id) filter (where u.status = 'booking') as unit_booking,
  count(distinct u.id) filter (where u.status = 'terjual') as unit_terjual
from devos.pengguna d
join devos.portofolio_direksi pd on pd.direksi_id = d.id
join devos.proyek p on p.id = pd.proyek_id
left join devos.unit u on u.proyek_id = p.id
where d.role = 'DIREKSI' and d.aktif
group by d.id, d.nama, d.email, p.id, p.kode, p.nama, p.tipe, p.lokasi, p.aktif;

-- View 7.2: Target vs Aktual Kinerja per Proyek dalam Portofolio Direksi
create or replace view devos.v_direksi_target_vs_aktual as
select
  d.id as direksi_id,
  d.nama as direksi_nama,
  p.id as proyek_id,
  p.kode as kode_proyek,
  p.nama as nama_proyek,
  p.tipe as tipe_proyek,
  tp.periode,

  -- Target Manajemen
  coalesce(tp.target_lead, 0) as target_lead,
  coalesce(tp.target_booking, 0) as target_booking,
  coalesce(tp.target_net_sales, 0) as target_net_sales,
  coalesce(tp.target_omzet, 0) as target_omzet,

  -- Hasil Aktual Periode Tersebut
  coalesce(act.aktual_lead, 0) as aktual_lead,
  coalesce(act.aktual_prospek, 0) as aktual_prospek,
  coalesce(act.aktual_kunjungan, 0) as aktual_kunjungan,
  coalesce(act.aktual_booking, 0) as aktual_booking,
  coalesce(act.aktual_net_sales, 0) as aktual_net_sales,
  coalesce(act.aktual_omzet, 0) as aktual_omzet,

  -- Persentase Capaian (%)
  case when coalesce(tp.target_lead, 0) > 0
       then round((coalesce(act.aktual_lead, 0)::numeric / tp.target_lead * 100), 1)
       else 0 end as persen_lead,

  case when coalesce(tp.target_booking, 0) > 0
       then round((coalesce(act.aktual_booking, 0)::numeric / tp.target_booking * 100), 1)
       else 0 end as persen_booking,

  case when coalesce(tp.target_net_sales, 0) > 0
       then round((coalesce(act.aktual_net_sales, 0)::numeric / tp.target_net_sales * 100), 1)
       else 0 end as persen_net_sales,

  case when coalesce(tp.target_omzet, 0) > 0
       then round((coalesce(act.aktual_omzet, 0)::numeric / tp.target_omzet * 100), 1)
       else 0 end as persen_omzet,

  -- Gap ke target
  (coalesce(act.aktual_net_sales, 0) - coalesce(tp.target_net_sales, 0)) as gap_net_sales,
  (coalesce(act.aktual_omzet, 0) - coalesce(tp.target_omzet, 0)) as gap_omzet

from devos.pengguna d
join devos.portofolio_direksi pd on pd.direksi_id = d.id
join devos.proyek p on p.id = pd.proyek_id
join devos.target_proyek tp on tp.proyek_id = p.id
left join lateral (
  select
    count(l.id) as aktual_lead,
    count(l.id) filter (where l.bant_total >= 7 or l.tahap in ('qualified', 'appointment', 'visited', 'hot', 'booking', 'proses_dp_kpr', 'net_sales')) as aktual_prospek,
    (
      select count(a.id)
      from devos.appointment a
      join devos.lead l2 on l2.id = a.lead_id
      where l2.proyek_id = p.id
        and a.status = 'hadir'
        and date_trunc('month', a.waktu)::date = tp.periode
    ) as aktual_kunjungan,
    (
      select count(b.id)
      from devos.booking b
      where b.proyek_id = p.id
        and b.status in ('aktif', 'net_sales')
        and date_trunc('month', b.tanggal_booking)::date = tp.periode
    ) as aktual_booking,
    (
      select count(b.id)
      from devos.booking b
      where b.proyek_id = p.id
        and b.status = 'net_sales'
        and date_trunc('month', coalesce(b.net_sales_pada, b.tanggal_booking))::date = tp.periode
    ) as aktual_net_sales,
    (
      select coalesce(sum(b.harga_final), 0)
      from devos.booking b
      where b.proyek_id = p.id
        and b.status = 'net_sales'
        and date_trunc('month', coalesce(b.net_sales_pada, b.tanggal_booking))::date = tp.periode
    ) as aktual_omzet
  from devos.lead l
  where l.proyek_id = p.id
    and date_trunc('month', l.tanggal_masuk)::date = tp.periode
) act on true
where d.role = 'DIREKSI' and d.aktif;

-- View 7.3: Ringkasan Total Portofolio Seluruh Proyek Direksi
create or replace view devos.v_direksi_ringkasan_akumulasi as
select
  direksi_id,
  direksi_nama,
  periode,
  count(distinct proyek_id) as total_proyek_dikelola,
  sum(target_booking) as total_target_booking,
  sum(aktual_booking) as total_aktual_booking,
  sum(target_net_sales) as total_target_net_sales,
  sum(aktual_net_sales) as total_aktual_net_sales,
  sum(target_omzet) as total_target_omzet,
  sum(aktual_omzet) as total_aktual_omzet,
  case when sum(target_omzet) > 0
       then round((sum(aktual_omzet) / sum(target_omzet) * 100), 1)
       else 0 end as persen_omzet_akumulatif
from devos.v_direksi_target_vs_aktual
group by direksi_id, direksi_nama, periode;

-- ===== 8. VIEWS UNTUK SALES MANAGER (SM) UNTUK MEMANTAU SE DIBAWAHNYA =====

-- View 8.1: Daftar SE di bawah binaan SM beserta status dan beban kerja
create or replace view devos.v_sm_tim_se as
select
  sm.id as sm_id,
  sm.nama as sm_nama,
  sm.jenis_akun as sm_jenis_akun,
  se.id as se_id,
  se.nama as se_nama,
  se.email as se_email,
  se.no_wa as se_no_wa,
  se.aktif as se_aktif,
  se.last_login_at as se_terakhir_aktif,
  string_agg(distinct p.nama, ', ') as proyek_ditugaskan,
  count(distinct l.id) filter (where l.tahap not in ('net_sales', 'closed_lost')) as total_lead_aktif,
  count(distinct l.id) filter (where l.tahap = 'hot') as total_hot_prospek,
  count(distinct t.id) filter (where t.status = 'terbuka' and t.jatuh_tempo < now()) as tugas_lewat_tempo
from devos.pengguna sm
join devos.pengguna se on se.atasan_id = sm.id and se.role = 'SE'
left join devos.penugasan_proyek pp on pp.pengguna_id = se.id
left join devos.proyek p on p.id = pp.proyek_id
left join devos.lead l on l.se_id = se.id
left join devos.tugas t on t.se_id = se.id
where sm.role in ('SM', 'TL') and sm.aktif
group by sm.id, sm.nama, sm.jenis_akun, se.id, se.nama, se.email, se.no_wa, se.aktif, se.last_login_at;

-- View 8.2: SM Pantau Kinerja & KPI Harian/Bulanan SE Dibawahnya
create or replace view devos.v_sm_pantau_se_kinerja as
select
  sm.id as sm_id,
  sm.nama as sm_nama,
  se.id as se_id,
  se.nama as se_nama,
  date_trunc('month', current_date)::date as periode,

  -- Target SE Bulan Ini
  coalesce(tse.target_lead, 0) as target_lead,
  coalesce(tse.target_prospek, 0) as target_prospek,
  coalesce(tse.target_kunjungan, 0) as target_kunjungan,
  coalesce(tse.target_booking, 0) as target_booking,
  coalesce(tse.target_net_sales, 0) as target_net_sales,

  -- Aktual SE Bulan Ini
  coalesce(act.lead_bulan_ini, 0) as aktual_lead,
  coalesce(act.prospek_bulan_ini, 0) as aktual_prospek,
  coalesce(act.kunjungan_bulan_ini, 0) as aktual_kunjungan,
  coalesce(act.booking_bulan_ini, 0) as aktual_booking,
  coalesce(act.net_sales_bulan_ini, 0) as aktual_net_sales,

  -- Metrik Kecepatan & Kepatuhan SOP
  coalesce(act.lead_tanpa_sentuh_72jam, 0) as lead_terancam_72jam,
  coalesce(act.rata_respons_menit, 0) as rata_respons_menit,

  -- Status Laporan Harian Hari Ini (SOP kirim sebelum 18.00)
  lh.terkunci as laporan_hari_ini_terkunci,
  lh.dikirim_pada as laporan_hari_ini_dikirim_pada,
  case
    when lh.id is null then 'belum_kirim'
    when lh.dikirim_pada::time > '18:00:00' then 'terlambat'
    else 'tepat_waktu'
  end as status_laporan_hari_ini,

  -- Scorecard Terakhir
  sc.total_poin as skor_scorecard_terakhir,
  sc.kategori as kategori_scorecard_terakhir

from devos.pengguna sm
join devos.pengguna se on se.atasan_id = sm.id and se.role = 'SE'
left join devos.target_se tse on tse.se_id = se.id and tse.periode = date_trunc('month', current_date)::date
left join devos.laporan_harian lh on lh.se_id = se.id and lh.tanggal = current_date
left join devos.scorecard_bulanan sc on sc.se_id = se.id and sc.periode = date_trunc('month', current_date)::date
left join lateral (
  select
    count(l.id) as lead_bulan_ini,
    count(l.id) filter (where l.bant_total >= 7) as prospek_bulan_ini,
    count(l.id) filter (
      where l.terakhir_dihubungi is null
        and l.tahap in ('new', 'contacted')
        and l.pemilik_sejak < now() - interval '48 hours'
    ) as lead_tanpa_sentuh_72jam,
    round(avg(
      extract(epoch from (l.respons_pertama_pada - l.tanggal_masuk)) / 60
    ) filter (where l.respons_pertama_pada is not null)::numeric, 1) as rata_respons_menit,
    (
      select count(a.id)
      from devos.appointment a
      where a.se_id = se.id
        and a.status = 'hadir'
        and date_trunc('month', a.waktu)::date = date_trunc('month', current_date)::date
    ) as kunjungan_bulan_ini,
    (
      select count(b.id)
      from devos.booking b
      where b.se_id = se.id
        and b.status in ('aktif', 'net_sales')
        and date_trunc('month', b.tanggal_booking)::date = date_trunc('month', current_date)::date
    ) as booking_bulan_ini,
    (
      select count(b.id)
      from devos.booking b
      where b.se_id = se.id
        and b.status = 'net_sales'
        and date_trunc('month', coalesce(b.net_sales_pada, b.tanggal_booking))::date = date_trunc('month', current_date)::date
    ) as net_sales_bulan_ini
  from devos.lead l
  where l.se_id = se.id
    and date_trunc('month', l.tanggal_masuk)::date = date_trunc('month', current_date)::date
) act on true
where sm.role in ('SM', 'TL') and sm.aktif and se.aktif;

-- View 8.3: SM Monitoring Peringatan Lead 72 Jam (B4, S4)
create or replace view devos.v_sm_lead_peringatan_72jam as
select
  sm.id as sm_id,
  sm.nama as sm_nama,
  se.id as se_id,
  se.nama as se_nama,
  l.id as lead_id,
  l.nama as nama_lead,
  l.no_wa,
  l.tahap,
  l.tanggal_masuk,
  l.pemilik_sejak,
  round((extract(epoch from (now() - l.pemilik_sejak)) / 3600)::numeric, 1) as jam_berjalan,
  (72 - round((extract(epoch from (now() - l.pemilik_sejak)) / 3600)::numeric, 1)) as sisa_jam_sebelum_kembali_ke_pool
from devos.pengguna sm
join devos.pengguna se on se.atasan_id = sm.id
join devos.lead l on l.se_id = se.id
where l.terakhir_dihubungi is null
  and l.tahap in ('new', 'contacted')
  and l.pemilik_sejak >= now() - interval '72 hours'
order by l.pemilik_sejak asc;

-- View 8.4: SM Pipeline Review & Hot Prospek Tim (Modul N4, S6)
create or replace view devos.v_sm_pipeline_review as
select
  sm.id as sm_id,
  sm.nama as sm_nama,
  se.id as se_id,
  se.nama as se_nama,
  l.id as lead_id,
  l.nama as nama_prospek,
  l.no_wa,
  l.domisili,
  l.persona,
  l.bant_total,
  l.bant_grade,
  l.skema_bayar,
  l.tahap,
  l.langkah_berikut,
  l.langkah_berikut_tgl,
  p.nama as nama_proyek,
  case
    when l.langkah_berikut_tgl < current_date then 'terlambat'
    when l.langkah_berikut_tgl = current_date then 'hari_ini'
    else 'akan_datang'
  end as status_next_step
from devos.pengguna sm
join devos.pengguna se on se.atasan_id = sm.id
join devos.lead l on l.se_id = se.id
join devos.proyek p on p.id = l.proyek_id
where l.tahap in ('qualified', 'appointment', 'visited', 'hot')
order by
  case l.tahap when 'hot' then 1 when 'visited' then 2 when 'appointment' then 3 else 4 end,
  l.langkah_berikut_tgl asc nulls last;

-- View 8.5: SM Log Aktivitas Harian Tim SE (Modul J)
create or replace view devos.v_sm_aktivitas_harian_tim as
select
  sm.id as sm_id,
  sm.nama as sm_nama,
  se.id as se_id,
  se.nama as se_nama,
  ah.tanggal,
  ah.jenis,
  sum(ah.jumlah) as total_aktivitas,
  sum(coalesce(ah.durasi_menit, 0)) as total_durasi_menit,
  count(distinct ah.lead_id) as total_lead_terinteraksi
from devos.pengguna sm
join devos.pengguna se on se.atasan_id = sm.id
join devos.aktivitas_harian ah on ah.se_id = se.id
group by sm.id, sm.nama, se.id, se.nama, ah.tanggal, ah.jenis
order by ah.tanggal desc, se.nama, ah.jenis;

-- ===== 8.6 VIEW DIGITAL MARKETER: ANALITIK KAMPANYE & BIAYA IKLAN (Modul O) =====
create or replace view devos.v_digital_marketer_kinerja_iklan as
select
  k.id as kampanye_id,
  k.proyek_id,
  p.nama as nama_proyek,
  k.kode as kode_kampanye,
  k.kanal,
  k.nama as nama_kampanye,
  coalesce(sum(bi.biaya), 0) as total_biaya_iklan,
  count(distinct l.id) as total_leads,
  count(distinct l.id) filter (where l.kelas_lead <> 'tidak_valid') as total_leads_valid,
  case when count(distinct l.id) > 0
       then round((count(distinct l.id) filter (where l.kelas_lead <> 'tidak_valid')::numeric / count(distinct l.id) * 100), 1)
       else 0 end as persen_valid,
  case when count(distinct l.id) > 0
       then round((coalesce(sum(bi.biaya), 0) / count(distinct l.id)), 0)
       else 0 end as cpl_rupiah,
  count(distinct l.id) filter (where l.bant_total >= 7) as total_prospek,
  count(distinct a.id) filter (where a.status = 'hadir') as total_kunjungan,
  count(distinct b.id) filter (where b.status in ('aktif', 'net_sales')) as total_booking,
  case when count(distinct b.id) filter (where b.status in ('aktif', 'net_sales')) > 0
       then round((coalesce(sum(bi.biaya), 0) / count(distinct b.id) filter (where b.status in ('aktif', 'net_sales'))), 0)
       else 0 end as biaya_per_booking
from devos.kampanye_iklan k
join devos.proyek p on p.id = k.proyek_id
left join devos.biaya_iklan bi on bi.kampanye_id = k.id
left join devos.lead l on l.proyek_id = k.proyek_id and l.kode_konten = k.kode
left join devos.appointment a on a.lead_id = l.id
left join devos.booking b on b.lead_id = l.id
group by k.id, k.proyek_id, p.nama, k.kode, k.kanal, k.nama;

-- ===== 9. FUNGSI HITUNG SCORECARD BERBOBOT OTOMATIS (Modul M5) =====
-- Booking 35%, Net sales 20%, Kunjungan 15%, Prospek 10%, Kepatuhan 10%, Waktu Respons 5%, Referral 5%
-- Capaian per komponen maks 150%.
create or replace function devos.hitung_scorecard_se(
  p_se_id   uuid,
  p_periode date default date_trunc('month', current_date)::date
) returns jsonb
language plpgsql security definer set search_path = devos, pg_temp as $$
declare
  v_target record;
  v_realisasi record;
  v_hari_kerja integer := 26;
  v_hari_patuh integer := 0;
  v_skor_booking numeric;
  v_skor_net numeric;
  v_skor_kunjungan numeric;
  v_skor_prospek numeric;
  v_skor_kepatuhan numeric;
  v_skor_respons numeric;
  v_skor_referral numeric;
  v_total_poin numeric;
  v_kategori devos.kategori_scorecard;
  v_komponen jsonb;
begin
  select * into v_target from devos.target_se where se_id = p_se_id and periode = p_periode;
  if not found then
    return jsonb_build_object('error', 'Target SE belum diatur untuk periode ini');
  end if;

  select
    count(l.id) filter (where l.bant_total >= 7) as aktual_prospek,
    coalesce(avg(extract(epoch from (l.respons_pertama_pada - l.tanggal_masuk)) / 60) filter (where l.respons_pertama_pada is not null), 10) as avg_respons_menit,
    (
      select count(a.id) from devos.appointment a
       where a.se_id = p_se_id and a.status = 'hadir'
         and date_trunc('month', a.waktu)::date = p_periode
    ) as aktual_kunjungan,
    (
      select count(b.id) from devos.booking b
       where b.se_id = p_se_id and b.status in ('aktif', 'net_sales')
         and date_trunc('month', b.tanggal_booking)::date = p_periode
    ) as aktual_booking,
    (
      select count(b.id) from devos.booking b
       where b.se_id = p_se_id and b.status = 'net_sales'
         and date_trunc('month', coalesce(b.net_sales_pada, b.tanggal_booking))::date = p_periode
    ) as aktual_net_sales,
    (
      select count(r.id) from devos.referral r
       where r.se_id = p_se_id
         and date_trunc('month', r.created_at)::date = p_periode
    ) as aktual_referral
  into v_realisasi
  from devos.lead l
  where l.se_id = p_se_id and date_trunc('month', l.tanggal_masuk)::date = p_periode;

  -- Hari patuh
  select count(distinct tanggal) into v_hari_patuh
  from devos.aktivitas_harian
  where se_id = p_se_id and date_trunc('month', tanggal)::date = p_periode;

  -- Komponen 1: Booking (Bobot 35%)
  v_skor_booking := least(150, case when v_target.target_booking > 0 then (v_realisasi.aktual_booking::numeric / v_target.target_booking * 100) else 100 end) * 0.35;
  -- Komponen 2: Net Sales (Bobot 20%)
  v_skor_net := least(150, case when v_target.target_net_sales > 0 then (v_realisasi.aktual_net_sales::numeric / v_target.target_net_sales * 100) else 100 end) * 0.20;
  -- Komponen 3: Kunjungan (Bobot 15%)
  v_skor_kunjungan := least(150, case when v_target.target_kunjungan > 0 then (v_realisasi.aktual_kunjungan::numeric / v_target.target_kunjungan * 100) else 100 end) * 0.15;
  -- Komponen 4: Prospek (Bobot 10%)
  v_skor_prospek := least(150, case when v_target.target_prospek > 0 then (v_realisasi.aktual_prospek::numeric / v_target.target_prospek * 100) else 100 end) * 0.10;
  -- Komponen 5: Kepatuhan Aktivitas (Bobot 10%)
  v_skor_kepatuhan := least(150, (v_hari_patuh::numeric / nullif(v_hari_kerja, 0) * 100)) * 0.10;
  -- Komponen 6: Respons CRM (Bobot 5%)
  v_skor_respons := case when v_realisasi.avg_respons_menit <= 5 then 100 when v_realisasi.avg_respons_menit <= 15 then 70 else 40 end * 0.05;
  -- Komponen 7: Referral (Bobot 5%)
  v_skor_referral := least(150, (v_realisasi.aktual_referral::numeric / 12 * 100)) * 0.05;

  v_total_poin := round((v_skor_booking + v_skor_net + v_skor_kunjungan + v_skor_prospek + v_skor_kepatuhan + v_skor_respons + v_skor_referral), 2);

  v_kategori := case
    when v_total_poin >= 120 then 'bintang'::devos.kategori_scorecard
    when v_total_poin >= 100 then 'tercapai'::devos.kategori_scorecard
    when v_total_poin >= 80  then 'mendekati'::devos.kategori_scorecard
    when v_total_poin >= 60  then 'di_bawah_target'::devos.kategori_scorecard
    else 'kritis'::devos.kategori_scorecard
  end;

  v_komponen := jsonb_build_array(
    jsonb_build_object('komponen', 'Booking', 'bobot', 35, 'poin', round(v_skor_booking, 2)),
    jsonb_build_object('komponen', 'Net Sales', 'bobot', 20, 'poin', round(v_skor_net, 2)),
    jsonb_build_object('komponen', 'Kunjungan', 'bobot', 15, 'poin', round(v_skor_kunjungan, 2)),
    jsonb_build_object('komponen', 'Prospek Kualifikasi', 'bobot', 10, 'poin', round(v_skor_prospek, 2)),
    jsonb_build_object('komponen', 'Kepatuhan Aktivitas', 'bobot', 10, 'poin', round(v_skor_kepatuhan, 2)),
    jsonb_build_object('komponen', 'Kecepatan Respons', 'bobot', 5, 'poin', round(v_skor_respons, 2)),
    jsonb_build_object('komponen', 'Referral & Kepuasan', 'bobot', 5, 'poin', round(v_skor_referral, 2))
  );

  insert into devos.scorecard_bulanan (se_id, periode, komponen, total_poin, kategori, narasi_ai, dihitung_pada)
  values (p_se_id, p_periode, v_komponen, v_total_poin, v_kategori,
          'Dihitung otomatis oleh sistem AI SM/TL. Poin total: ' || v_total_poin::text || ' (' || v_kategori::text || ')', now())
  on conflict (se_id, periode) do update
  set komponen = excluded.komponen,
      total_poin = excluded.total_poin,
      kategori = excluded.kategori,
      dihitung_pada = now();

  return jsonb_build_object(
    'se_id', p_se_id,
    'periode', p_periode,
    'total_poin', v_total_poin,
    'kategori', v_kategori,
    'komponen', v_komponen
  );
end $$;

-- Register migration
insert into devos.schema_migrations (versi) values ('0006_sm_direksi_views_dan_fitur_lengkap')
on conflict (versi) do nothing;

commit;
