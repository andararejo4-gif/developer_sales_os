-- 0002 · Pengguna, proyek, unit, target proyek, portofolio direksi
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

