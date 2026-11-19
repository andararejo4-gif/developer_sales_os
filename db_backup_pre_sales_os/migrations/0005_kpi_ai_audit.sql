-- 0005 · KPI, aktivitas harian, laporan, scorecard, iklan, approval, AI, audit
begin;

-- Parameter sistem: semua angka target/bobot dapat diubah (catatan akhir playbook)
create table devos.parameter_sistem (
  kunci      text primary key,
  nilai      jsonb not null,
  keterangan text,
  diubah_oleh uuid,
  updated_at timestamptz not null default now()
);

-- Target per SE per bulan (M1)
create table devos.target_se (
  id               uuid primary key default gen_random_uuid(),
  se_id            uuid not null references devos.pengguna(id) on delete cascade,
  periode          date not null check (periode = date_trunc('month', periode)::date),
  target_lead      integer not null default 0 check (target_lead >= 0),
  target_prospek   integer not null default 0 check (target_prospek >= 0),
  target_kunjungan integer not null default 0 check (target_kunjungan >= 0),
  target_booking   integer not null default 0 check (target_booking >= 0),
  target_net_sales integer not null default 0 check (target_net_sales >= 0),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (se_id, periode)
);

-- Log aktivitas harian (modul J)
create table devos.aktivitas_harian (
  id          uuid primary key default gen_random_uuid(),
  se_id       uuid not null references devos.pengguna(id) on delete cascade,
  tanggal     date not null default current_date,
  jenis       devos.jenis_aktivitas not null,
  jumlah      integer not null default 1 check (jumlah > 0),
  durasi_menit integer check (durasi_menit >= 0),
  lead_id     uuid references devos.lead(id) on delete set null,
  bukti_url   text,
  lat         numeric(9,6) check (lat between -90 and 90),
  lng         numeric(9,6) check (lng between -180 and 180),
  catatan     text,
  created_at  timestamptz not null default now()
);
create index aktivitas_se_tgl_idx on devos.aktivitas_harian (se_id, tanggal, jenis);

-- Laporan harian SE (N1); terkunci setelah 18.00
create table devos.laporan_harian (
  id          uuid primary key default gen_random_uuid(),
  se_id       uuid not null references devos.pengguna(id) on delete cascade,
  tanggal     date not null,
  isi         jsonb not null default '[]'::jsonb,
  hambatan    text,
  dikirim_pada timestamptz,
  terkunci    boolean not null default false,
  umpan_balik_ai text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (se_id, tanggal)
);

-- Scorecard bulanan berbobot (M5/M6)
create table devos.scorecard_bulanan (
  id          uuid primary key default gen_random_uuid(),
  se_id       uuid not null references devos.pengguna(id) on delete cascade,
  periode     date not null check (periode = date_trunc('month', periode)::date),
  komponen    jsonb not null default '[]'::jsonb,
  total_poin  numeric(6,2) not null default 0,
  kategori    devos.kategori_scorecard,
  narasi_ai   text,
  dihitung_pada timestamptz not null default now(),
  unique (se_id, periode)
);

-- Kampanye & biaya iklan (modul O)
create table devos.kampanye_iklan (
  id         uuid primary key default gen_random_uuid(),
  proyek_id  uuid not null references devos.proyek(id) on delete cascade,
  kode       text not null,
  kanal      text not null,
  nama       text,
  aktif      boolean not null default true,
  unique (proyek_id, kode)
);
create table devos.biaya_iklan (
  id          uuid primary key default gen_random_uuid(),
  kampanye_id uuid not null references devos.kampanye_iklan(id) on delete cascade,
  tanggal     date not null,
  biaya       numeric(16,2) not null check (biaya >= 0),
  unique (kampanye_id, tanggal)
);

-- Program resmi & matriks kewenangan AI (Q2, S21)
create table devos.program_resmi (
  id          uuid primary key default gen_random_uuid(),
  proyek_id   uuid references devos.proyek(id) on delete cascade,
  nama        text not null,
  jenis       text not null,
  nilai_maks  numeric(16,2),
  berlaku_dari date not null,
  berlaku_sampai date,
  aktif       boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  check (berlaku_sampai is null or berlaku_sampai >= berlaku_dari)
);
create table devos.matriks_kewenangan (
  jenis_permintaan text primary key,
  batas_otomatis   numeric(16,2) not null default 0,   -- di bawah/sama = AI boleh setujui
  wajib_eskalasi   boolean not null default false,
  sla_jam          integer not null default 24,
  keterangan       text
);

-- Approval permintaan khusus / diskon (Q1, S9)
create table devos.persetujuan (
  id            uuid primary key default gen_random_uuid(),
  lead_id       uuid references devos.lead(id) on delete set null,
  booking_id    uuid references devos.booking(id) on delete set null,
  diajukan_oleh uuid not null references devos.pengguna(id) on delete restrict,
  jenis_permintaan text not null references devos.matriks_kewenangan(jenis_permintaan),
  program_id    uuid references devos.program_resmi(id),
  nilai_diminta numeric(16,2),
  alasan_pengajuan text,
  status        devos.status_persetujuan not null default 'menunggu',
  diputuskan_ai boolean not null default false,
  diputuskan_oleh uuid references devos.pengguna(id),
  alasan_keputusan text,
  rekomendasi_ai text,
  sla_sampai    timestamptz,
  diputuskan_pada timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index persetujuan_status_idx on devos.persetujuan (status, created_at);

-- Log keputusan AI & banding SE (S22)
create table devos.ai_keputusan (
  id          uuid primary key default gen_random_uuid(),
  agen        text not null,          -- briefing_pagi, evening_check, audit_crm, distribusi_lead, ...
  target_id   uuid references devos.pengguna(id) on delete set null,
  jenis       text not null,
  ringkasan   text not null,
  alasan      text,
  data        jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);
create index ai_keputusan_target_idx on devos.ai_keputusan (target_id, created_at desc);

create table devos.ai_banding (
  id              uuid primary key default gen_random_uuid(),
  keputusan_id    uuid not null references devos.ai_keputusan(id) on delete cascade,
  diajukan_oleh   uuid not null references devos.pengguna(id) on delete cascade,
  alasan          text not null,
  status          text not null default 'menunggu' check (status in ('menunggu', 'diterima', 'ditolak')),
  putusan_oleh    uuid references devos.pengguna(id),
  putusan_catatan text,
  created_at      timestamptz not null default now(),
  diputuskan_pada timestamptz
);

-- Notifikasi
create table devos.notifikasi (
  id          uuid primary key default gen_random_uuid(),
  pengguna_id uuid not null references devos.pengguna(id) on delete cascade,
  judul       text not null,
  isi         text,
  tautan      text,
  dibaca_pada timestamptz,
  created_at  timestamptz not null default now()
);
create index notifikasi_pengguna_idx on devos.notifikasi (pengguna_id, created_at desc) where dibaca_pada is null;

-- ===== Audit log (Q5): tambah-saja, diisi trigger =====
create table devos.audit_log (
  id         bigint generated always as identity primary key,
  tabel      text not null,
  record_id  text,
  aksi       text not null,
  data_lama  jsonb,
  data_baru  jsonb,
  oleh       uuid,
  waktu      timestamptz not null default now()
);
create index audit_log_tabel_idx on devos.audit_log (tabel, record_id, waktu desc);

create function devos.audit() returns trigger
language plpgsql security definer set search_path = devos, pg_temp as $$
declare v_old jsonb; v_new jsonb;
begin
  if tg_op in ('UPDATE', 'DELETE') then v_old := to_jsonb(old); end if;
  if tg_op in ('INSERT', 'UPDATE') then v_new := to_jsonb(new); end if;
  if tg_table_name = 'pengguna' then          -- jangan simpan hash password
    v_old := v_old - 'password_hash';
    v_new := v_new - 'password_hash';
  end if;
  if tg_op = 'UPDATE' and v_old = v_new then return new; end if;
  insert into devos.audit_log (tabel, record_id, aksi, data_lama, data_baru, oleh)
  values (tg_table_name, coalesce(v_new->>'id', v_old->>'id'), tg_op, v_old, v_new,
          nullif(current_setting('devos.user_id', true), '')::uuid);
  return coalesce(new, old);
end $$;

do $$
declare t text;
begin
  foreach t in array array['pengguna', 'proyek', 'unit', 'target_proyek', 'portofolio_direksi',
                           'lead', 'booking', 'persetujuan', 'program_resmi', 'matriks_kewenangan']
  loop
    execute format('create trigger %I after insert or update or delete on devos.%I
                    for each row execute function devos.audit()', t || '_audit', t);
  end loop;
end $$;

create trigger target_se_updated  before update on devos.target_se      for each row execute function devos.set_updated_at();
create trigger laporan_updated    before update on devos.laporan_harian for each row execute function devos.set_updated_at();
create trigger program_updated    before update on devos.program_resmi  for each row execute function devos.set_updated_at();
create trigger persetujuan_updated before update on devos.persetujuan   for each row execute function devos.set_updated_at();

insert into devos.schema_migrations (versi) values ('0005_kpi_ai_audit');
commit;

