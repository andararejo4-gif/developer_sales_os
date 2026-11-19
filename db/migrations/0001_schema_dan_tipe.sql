-- 0001 · Schema devos, tipe enum, fungsi umum
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

