-- 0001 Â· Schema devos, tipe enum, fungsi umum
begin;

create schema if not exists devos;

create table if not exists devos.schema_migrations (
  versi      text primary key,
  diterapkan timestamptz not null default now()
);

-- ===== Enum =====
create type devos.role_pengguna as enum ('SE', 'TL', 'ADMIN', 'SM', 'IT', 'DIREKSI');
create type devos.jenis_akun    as enum ('manusia', 'ai');
create type devos.tipe_proyek   as enum ('mewah', 'menengah', 'subsidi', 'villa_resort', 'komersial');
create type devos.status_unit   as enum ('tersedia', 'hold', 'booking', 'terjual');
create type devos.skema_bayar   as enum ('cash_keras', 'cash_6', 'cash_12', 'cash_24', 'kpr');
create type devos.tahap_pipeline as enum (
  'new', 'contacted', 'qualified', 'appointment', 'visited',
  'hot', 'booking', 'proses_dp_kpr', 'net_sales', 'closed_lost'
);
create type devos.alasan_lost as enum (
  'harga_anggaran', 'kpr_ditolak', 'proyek_lain', 'lokasi',
  'ukuran_denah', 'menunda', 'tidak_bisa_dihubungi', 'cari_info_agen'
);
create type devos.persona      as enum ('P1', 'P2', 'P3', 'P4', 'P5', 'P6');
create type devos.ring_geo     as enum ('ring_1', 'ring_2', 'ring_3', 'investor');
create type devos.kelas_lead   as enum ('premium', 'baik', 'lemah', 'tidak_valid');
create type devos.jenis_appointment as enum ('marketing_gallery', 'lokasi', 'presentasi', 'video_call');
create type devos.status_appointment as enum ('dijadwalkan', 'hadir', 'tidak_hadir', 'dibatalkan');
create type devos.status_tugas as enum ('terbuka', 'selesai', 'dilewati');
create type devos.status_booking as enum ('aktif', 'net_sales', 'batal');
create type devos.status_dokumen as enum ('kurang', 'lengkap');
create type devos.status_bank as enum ('diajukan', 'verifikasi', 'sp3k', 'ditolak');
create type devos.jenis_aktivitas as enum (
  'dial', 'percakapan_telepon', 'chat_baru', 'chat_followup', 'dm',
  'canvassing', 'ott', 'presentasi_korporat', 'posting_reel', 'posting_status',
  'posting_story', 'konten_resmi', 'listing_portal', 'live', 'minta_referral'
);
create type devos.status_persetujuan as enum ('menunggu', 'disetujui_ai', 'eskalasi', 'disetujui', 'ditolak');
create type devos.kategori_scorecard as enum ('bintang', 'tercapai', 'mendekati', 'di_bawah_target', 'kritis');

-- ===== Fungsi umum =====
create function devos.set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

insert into devos.schema_migrations (versi) values ('0001_schema_dan_tipe');
commit;

-- 0002 Â· Pengguna, proyek, unit, target proyek, portofolio direksi
begin;

-- ===== Pengguna =====
-- Akun mandiri untuk devos (tidak bergantung ke auth.users).
-- Role TL dijalankan AI (jenis_akun='ai'), tetapi manusia tetap boleh punya akun TL.
create table devos.pengguna (
  id            uuid primary key default gen_random_uuid(),
  email         text not null,
  nama          text not null,
  no_wa         text,
  password_hash text,
  role          devos.role_pengguna not null,
  jenis_akun    devos.jenis_akun not null default 'manusia',
  atasan_id     uuid references devos.pengguna(id) on delete set null,
  aktif         boolean not null default true,
  last_login_at timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint pengguna_bukan_atasan_sendiri check (atasan_id is distinct from id),
  constraint pengguna_manusia_wajib_password check (jenis_akun = 'ai' or password_hash is not null)
);
create unique index pengguna_email_uk on devos.pengguna (lower(email));
create index pengguna_role_idx on devos.pengguna (role) where aktif;
create index pengguna_atasan_idx on devos.pengguna (atasan_id);

-- SE hanya boleh punya atasan berperan SM (atau TL).
create function devos.cek_atasan() returns trigger
language plpgsql as $$
declare v_role devos.role_pengguna;
begin
  if new.role = 'SE' and new.atasan_id is not null then
    select role into v_role from devos.pengguna where id = new.atasan_id;
    if v_role not in ('SM', 'TL') then
      raise exception 'Atasan SE harus berperan SM atau TL (ditemukan: %)', v_role;
    end if;
  end if;
  return new;
end $$;
create trigger pengguna_cek_atasan before insert or update of atasan_id, role
  on devos.pengguna for each row execute function devos.cek_atasan();

-- ===== Proyek =====
create table devos.proyek (
  id         uuid primary key default gen_random_uuid(),
  kode       text not null,
  nama       text not null,                 -- nama proyek perumahan
  tipe       devos.tipe_proyek not null default 'mewah', -- tipe proyek: mewah, menengah, subsidi, villa_resort, komersial
  lokasi     text,
  keterangan text,
  aktif      boolean not null default true,
  dibuat_oleh uuid references devos.pengguna(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index proyek_kode_uk on devos.proyek (lower(kode));

-- ===== Unit =====
create table devos.unit (
  id                uuid primary key default gen_random_uuid(),
  proyek_id         uuid not null references devos.proyek(id) on delete restrict,
  cluster           text,
  nama_unit         text not null,
  tipe_unit         text not null,
  luas_tanah        numeric(10,2) not null check (luas_tanah > 0),      -- LT (m2)
  luas_bangunan     numeric(10,2) not null check (luas_bangunan > 0),   -- LB (m2)
  harga_cash_keras  numeric(16,2) not null check (harga_cash_keras >= 0),
  harga_cash_6      numeric(16,2) check (harga_cash_6 >= 0),
  harga_cash_12     numeric(16,2) check (harga_cash_12 >= 0),
  harga_cash_24     numeric(16,2) check (harga_cash_24 >= 0),
  keterangan        text,
  status            devos.status_unit not null default 'tersedia',
  dibuat_oleh       uuid references devos.pengguna(id) on delete set null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (proyek_id, nama_unit)
);
create index unit_proyek_status_idx on devos.unit (proyek_id, status);

-- Riwayat harga: tersimpan otomatis setiap harga berubah.
create table devos.unit_harga_riwayat (
  id                bigint generated always as identity primary key,
  unit_id           uuid not null references devos.unit(id) on delete cascade,
  harga_cash_keras  numeric(16,2) not null,
  harga_cash_6      numeric(16,2),
  harga_cash_12     numeric(16,2),
  harga_cash_24     numeric(16,2),
  berlaku_sampai    timestamptz not null default now(),
  diubah_oleh       uuid
);
create index unit_harga_riwayat_unit_idx on devos.unit_harga_riwayat (unit_id, berlaku_sampai desc);

-- ===== Penugasan SE ke proyek & portofolio direksi =====
create table devos.penugasan_proyek (
  pengguna_id uuid not null references devos.pengguna(id) on delete cascade,
  proyek_id   uuid not null references devos.proyek(id) on delete cascade,
  primary key (pengguna_id, proyek_id)
);

create table devos.portofolio_direksi (
  direksi_id uuid not null references devos.pengguna(id) on delete cascade,
  proyek_id  uuid not null references devos.proyek(id) on delete cascade,
  primary key (direksi_id, proyek_id)
);

create function devos.cek_direksi() returns trigger
language plpgsql as $$
declare v_role devos.role_pengguna;
begin
  select role into v_role from devos.pengguna where id = new.direksi_id;
  if v_role is distinct from 'DIREKSI' then
    raise exception 'Portofolio hanya bisa dimiliki pengguna berperan DIREKSI';
  end if;
  return new;
end $$;
create trigger portofolio_cek_direksi before insert or update
  on devos.portofolio_direksi for each row execute function devos.cek_direksi();

-- ===== Target per proyek per bulan =====
create table devos.target_proyek (
  id                uuid primary key default gen_random_uuid(),
  proyek_id         uuid not null references devos.proyek(id) on delete cascade,
  periode           date not null check (periode = date_trunc('month', periode)::date),
  target_lead       integer check (target_lead >= 0),
  target_booking    integer not null default 0 check (target_booking >= 0),
  target_net_sales  integer not null default 0 check (target_net_sales >= 0),
  target_omzet      numeric(18,2) not null default 0 check (target_omzet >= 0),
  catatan           text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (proyek_id, periode)
);

-- ===== Trigger: riwayat harga & updated_at =====
create function devos.simpan_riwayat_harga() returns trigger
language plpgsql security definer set search_path = devos, pg_temp as $$
begin
  if (old.harga_cash_keras, old.harga_cash_6, old.harga_cash_12, old.harga_cash_24)
     is distinct from
     (new.harga_cash_keras, new.harga_cash_6, new.harga_cash_12, new.harga_cash_24) then
    insert into devos.unit_harga_riwayat
      (unit_id, harga_cash_keras, harga_cash_6, harga_cash_12, harga_cash_24, diubah_oleh)
    values
      (old.id, old.harga_cash_keras, old.harga_cash_6, old.harga_cash_12, old.harga_cash_24,
       nullif(current_setting('devos.user_id', true), '')::uuid);
  end if;
  return new;
end $$;
create trigger unit_riwayat_harga after update on devos.unit
  for each row execute function devos.simpan_riwayat_harga();

create trigger pengguna_updated  before update on devos.pengguna      for each row execute function devos.set_updated_at();
create trigger proyek_updated    before update on devos.proyek        for each row execute function devos.set_updated_at();
create trigger unit_updated      before update on devos.unit          for each row execute function devos.set_updated_at();
create trigger target_proyek_upd before update on devos.target_proyek for each row execute function devos.set_updated_at();

insert into devos.schema_migrations (versi) values ('0002_pengguna_proyek_unit');
commit;

-- 0003 Â· Lead, kualifikasi BANT, pipeline, appointment, penawaran, tugas
begin;

-- Master sumber / kode konten (modul A4)
create table devos.sumber_lead (
  id     uuid primary key default gen_random_uuid(),
  kode   text not null,
  nama   text not null,
  kanal  text,
  aktif  boolean not null default true
);
create unique index sumber_lead_kode_uk on devos.sumber_lead (lower(kode));

create table devos.lead (
  id               uuid primary key default gen_random_uuid(),
  proyek_id        uuid not null references devos.proyek(id) on delete restrict,
  tanggal_masuk    timestamptz not null default now(),
  nama             text not null,
  no_wa            text not null check (no_wa ~ '^\+?[0-9]{8,15}$'),
  domisili         text not null,
  ring             devos.ring_geo,
  sumber_id        uuid not null references devos.sumber_lead(id),
  kode_konten      text,
  izin_dihubungi   boolean not null,                  -- opt-in (A2/A7)
  izin_dicatat_pada timestamptz,
  izin_lokasi      text,
  -- pemilik; NULL = kembali ke pool (aturan 72 jam)
  se_id            uuid references devos.pengguna(id) on delete restrict,
  pemilik_sejak    timestamptz not null default now(),
  respons_pertama_pada timestamptz,
  terakhir_dihubungi   timestamptz,
  tahap            devos.tahap_pipeline not null default 'new',
  persona          devos.persona,
  kelas_lead       devos.kelas_lead,
  tandai_agen_pesaing boolean not null default false,
  -- BANT 0-3 per huruf
  bant_b           smallint check (bant_b between 0 and 3),
  bant_a           smallint check (bant_a between 0 and 3),
  bant_n           smallint check (bant_n between 0 and 3),
  bant_t           smallint check (bant_t between 0 and 3),
  bant_total       smallint generated always as (
    case when bant_b is not null and bant_a is not null
           and bant_n is not null and bant_t is not null
         then bant_b + bant_a + bant_n + bant_t end
  ) stored,
  bant_grade       text generated always as (
    case when bant_b is null or bant_a is null or bant_n is null or bant_t is null then null
         when bant_b + bant_a + bant_n + bant_t >= 10 then 'A'
         when bant_b + bant_a + bant_n + bant_t >= 7  then 'B'
         when bant_b + bant_a + bant_n + bant_t >= 4  then 'C'
         else 'D' end
  ) stored,
  anggaran_min     numeric(16,2) check (anggaran_min >= 0),
  anggaran_maks    numeric(16,2) check (anggaran_maks >= 0),
  skema_bayar      devos.skema_bayar,
  kebutuhan_kamar  smallint check (kebutuhan_kamar >= 0),
  jumlah_kendaraan smallint check (jumlah_kendaraan >= 0),
  lt_dicari        numeric(10,2),
  lb_dicari        numeric(10,2),
  langkah_berikut      text,
  langkah_berikut_tgl  date,
  alasan_lost      devos.alasan_lost,
  pesaing          text,
  created_by       uuid references devos.pengguna(id) on delete set null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint lead_wajib_izin_tercatat check (not izin_dihubungi or izin_dicatat_pada is not null),
  constraint lead_anggaran_valid check (anggaran_maks is null or anggaran_min is null or anggaran_maks >= anggaran_min),
  -- D8: naik ke Prospek (qualified) minimal BANT 7; E2: Hot minimal BANT 10
  constraint lead_stage_gate_bant check (
    tahap in ('new', 'contacted', 'closed_lost') or bant_total >= 7
  ),
  constraint lead_stage_gate_hot check (tahap <> 'hot' or bant_total >= 10),
  -- E5: Closed-Lost wajib alasan; memilih proyek lain wajib sebut nama
  constraint lead_lost_wajib_alasan check (tahap <> 'closed_lost' or alasan_lost is not null),
  constraint lead_proyek_lain_wajib_nama check (alasan_lost is distinct from 'proyek_lain' or pesaing is not null)
);
create index lead_no_wa_idx    on devos.lead (no_wa);
create index lead_se_tahap_idx on devos.lead (se_id, tahap);
create index lead_proyek_idx   on devos.lead (proyek_id, tanggal_masuk desc);
create index lead_next_step_idx on devos.lead (langkah_berikut_tgl) where tahap not in ('net_sales', 'closed_lost');

-- Unit yang diminati (multi)
create table devos.lead_unit_minat (
  lead_id uuid not null references devos.lead(id) on delete cascade,
  unit_id uuid not null references devos.unit(id) on delete cascade,
  primary key (lead_id, unit_id)
);

-- Timeline riwayat kontak (E6): perubahan tahap, pemilik, skor, chat, telepon, dll.
create table devos.lead_timeline (
  id        bigint generated always as identity primary key,
  lead_id   uuid not null references devos.lead(id) on delete cascade,
  jenis     text not null,
  ringkasan text,
  data      jsonb not null default '{}'::jsonb,
  oleh      uuid,
  waktu     timestamptz not null default now()
);
create index lead_timeline_lead_idx on devos.lead_timeline (lead_id, waktu desc);

create function devos.catat_perubahan_lead() returns trigger
language plpgsql security definer set search_path = devos, pg_temp as $$
declare v_oleh uuid := nullif(current_setting('devos.user_id', true), '')::uuid;
begin
  if tg_op = 'INSERT' then
    insert into devos.lead_timeline (lead_id, jenis, ringkasan, oleh)
    values (new.id, 'lead_masuk', 'Lead dibuat', v_oleh);
    return new;
  end if;
  if new.tahap is distinct from old.tahap then
    insert into devos.lead_timeline (lead_id, jenis, ringkasan, data, oleh)
    values (new.id, 'tahap', old.tahap || ' -> ' || new.tahap,
            jsonb_build_object('dari', old.tahap, 'ke', new.tahap), v_oleh);
  end if;
  if new.se_id is distinct from old.se_id then
    insert into devos.lead_timeline (lead_id, jenis, ringkasan, data, oleh)
    values (new.id, 'pemilik', 'Pemilik lead berubah',
            jsonb_build_object('dari', old.se_id, 'ke', new.se_id), v_oleh);
  end if;
  if new.bant_total is distinct from old.bant_total then
    insert into devos.lead_timeline (lead_id, jenis, ringkasan, data, oleh)
    values (new.id, 'bant', 'Skor BANT ' || coalesce(old.bant_total::text, '-') || ' -> ' || coalesce(new.bant_total::text, '-'),
            jsonb_build_object('dari', old.bant_total, 'ke', new.bant_total), v_oleh);
  end if;
  return new;
end $$;
create trigger lead_timeline_trg after insert or update on devos.lead
  for each row execute function devos.catat_perubahan_lead();

-- Appointment & kunjungan (modul H)
create table devos.appointment (
  id            uuid primary key default gen_random_uuid(),
  lead_id       uuid not null references devos.lead(id) on delete cascade,
  se_id         uuid not null references devos.pengguna(id) on delete restrict,
  waktu         timestamptz not null,
  jenis         devos.jenis_appointment not null default 'marketing_gallery',
  status        devos.status_appointment not null default 'dijadwalkan',
  konfirmasi_h1_pada timestamptz,
  form_kunjungan jsonb not null default '{}'::jsonb,   -- checklist, pengambil keputusan, trial close
  catatan_hasil text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index appointment_se_waktu_idx on devos.appointment (se_id, waktu);
create index appointment_lead_idx on devos.appointment (lead_id);

-- Penawaran tertulis (modul G); harga di-snapshot saat dibuat
create table devos.penawaran (
  id             uuid primary key default gen_random_uuid(),
  lead_id        uuid not null references devos.lead(id) on delete cascade,
  se_id          uuid not null references devos.pengguna(id) on delete restrict,
  unit_id        uuid not null references devos.unit(id) on delete restrict,
  skema          devos.skema_bayar not null,
  harga          numeric(16,2) not null check (harga >= 0),
  berlaku_hingga date,
  simulasi       jsonb not null default '{}'::jsonb,
  file_url       text,
  dikirim_pada   timestamptz,
  created_at     timestamptz not null default now()
);
create index penawaran_lead_idx on devos.penawaran (lead_id);

-- Tugas follow-up (modul I)
create table devos.tugas (
  id           uuid primary key default gen_random_uuid(),
  lead_id      uuid references devos.lead(id) on delete cascade,
  se_id        uuid not null references devos.pengguna(id) on delete cascade,
  jenis        text not null,
  judul        text not null,
  jatuh_tempo  timestamptz not null,
  status       devos.status_tugas not null default 'terbuka',
  selesai_pada timestamptz,
  dibuat_ai    boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index tugas_se_due_idx on devos.tugas (se_id, jatuh_tempo) where status = 'terbuka';

-- Cek nomor ganda (A3): boleh melihat pemilik walau lead milik SE lain.
create function devos.cek_nomor_ganda(p_no_wa text)
returns table (lead_id uuid, proyek_id uuid, nama_se text, tahap devos.tahap_pipeline, tanggal_masuk timestamptz)
language sql stable security definer set search_path = devos, pg_temp as $$
  select l.id, l.proyek_id, p.nama, l.tahap, l.tanggal_masuk
    from devos.lead l left join devos.pengguna p on p.id = l.se_id
   where l.no_wa = p_no_wa
   order by l.tanggal_masuk desc
$$;

-- Aturan 72 jam (B4): lead belum dihubungi kembali ke pool. Dipanggil terjadwal (cron/AI).
create function devos.kembalikan_lead_72jam() returns integer
language plpgsql security definer set search_path = devos, pg_temp as $$
declare v_jumlah integer;
begin
  with kembali as (
    update devos.lead
       set se_id = null, pemilik_sejak = now()
     where se_id is not null
       and terakhir_dihubungi is null
       and tahap in ('new', 'contacted')
       and pemilik_sejak < now() - interval '72 hours'
    returning id
  )
  select count(*) into v_jumlah from kembali;
  return v_jumlah;
end $$;

create trigger lead_updated        before update on devos.lead        for each row execute function devos.set_updated_at();
create trigger appointment_updated before update on devos.appointment for each row execute function devos.set_updated_at();
create trigger tugas_updated       before update on devos.tugas       for each row execute function devos.set_updated_at();

insert into devos.schema_migrations (versi) values ('0003_lead_pipeline');
commit;

-- 0004 Â· Booking -> DP -> KPR -> PPJB/Akad (modul K)
begin;

create table devos.booking (
  id               uuid primary key default gen_random_uuid(),
  lead_id          uuid not null references devos.lead(id) on delete restrict,
  proyek_id        uuid not null references devos.proyek(id) on delete restrict,
  unit_id          uuid not null references devos.unit(id) on delete restrict,
  se_id            uuid not null references devos.pengguna(id) on delete restrict,
  nama_pembeli     text not null,
  harga_final      numeric(16,2) not null check (harga_final > 0),
  skema            devos.skema_bayar not null,
  tanggal_booking  date not null default current_date,
  nominal_booking  numeric(16,2) not null default 5000000 check (nominal_booking >= 0),
  bukti_transfer_url text,
  rekening_resmi_valid boolean not null default false,   -- Q7: rekening PT Andara Rejo Makmur
  status           devos.status_booking not null default 'aktif',
  konfirmasi_admin_pada timestamptz,                      -- H+1
  dokumen_kpr_deadline  date,                             -- H+7
  pengajuan_bank_deadline date,                           -- H+10
  net_sales_pada   timestamptz,
  batal_pada       timestamptz,
  alasan_batal     text,
  refund_nominal   numeric(16,2) check (refund_nominal >= 0),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint booking_batal_wajib_alasan check (status <> 'batal' or alasan_batal is not null)
);
-- Satu unit hanya boleh punya satu booking yang masih berjalan / terjual
create unique index booking_unit_aktif_uk on devos.booking (unit_id) where status <> 'batal';
create index booking_se_idx     on devos.booking (se_id, tanggal_booking desc);
create index booking_proyek_idx on devos.booking (proyek_id, tanggal_booking desc);

-- Isi tenggat otomatis, stempel waktu status, dan sinkron status unit.
create function devos.booking_sinkron() returns trigger
language plpgsql security definer set search_path = devos, pg_temp as $$
begin
  if tg_op = 'INSERT' then
    new.dokumen_kpr_deadline   := coalesce(new.dokumen_kpr_deadline, new.tanggal_booking + 7);
    new.pengajuan_bank_deadline := coalesce(new.pengajuan_bank_deadline, new.tanggal_booking + 10);
  end if;

  if new.status = 'net_sales' and new.net_sales_pada is null then
    new.net_sales_pada := now();
  elsif new.status = 'batal' and new.batal_pada is null then
    new.batal_pada := now();
  end if;

  if tg_op = 'INSERT' or new.status is distinct from old.status then
    update devos.unit
       set status = case new.status
                      when 'aktif'     then 'booking'::devos.status_unit
                      when 'net_sales' then 'terjual'::devos.status_unit
                      else 'tersedia'::devos.status_unit end
     where id = new.unit_id;
  end if;
  return new;
end $$;
create trigger booking_sinkron_trg before insert or update on devos.booking
  for each row execute function devos.booking_sinkron();

-- Checklist dokumen KPR (K3)
create table devos.booking_dokumen (
  id         uuid primary key default gen_random_uuid(),
  booking_id uuid not null references devos.booking(id) on delete cascade,
  jenis      text not null,              -- ktp, kk, npwp, slip_gaji, rekening_koran, dst
  status     devos.status_dokumen not null default 'kurang',
  file_url   text,
  diperbarui_pada timestamptz not null default now(),
  unique (booking_id, jenis)
);

-- Pengajuan multi-bank paralel (K4)
create table devos.booking_pengajuan_bank (
  id            uuid primary key default gen_random_uuid(),
  booking_id    uuid not null references devos.booking(id) on delete cascade,
  bank          text not null,
  status        devos.status_bank not null default 'diajukan',
  diajukan_pada date not null default current_date,
  keputusan_pada date,
  catatan       text,
  unique (booking_id, bank)
);

-- Jadwal pembayaran cash tempo (K7)
create table devos.booking_pembayaran (
  id           uuid primary key default gen_random_uuid(),
  booking_id   uuid not null references devos.booking(id) on delete cascade,
  urutan       smallint not null check (urutan > 0),
  jatuh_tempo  date not null,
  nominal      numeric(16,2) not null check (nominal > 0),
  dibayar_pada date,
  unique (booking_id, urutan)
);

create trigger booking_updated before update on devos.booking for each row execute function devos.set_updated_at();

insert into devos.schema_migrations (versi) values ('0004_booking_transaksi');
commit;

-- 0005 Â· KPI, aktivitas harian, laporan, scorecard, iklan, approval, AI, audit
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

-- 0006 Â· SM, Direksi views, jadwal piket, referral, co-broke, sales library, dan fungsi analitik
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
