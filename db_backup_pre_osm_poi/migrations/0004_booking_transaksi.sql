-- 0004 · Booking -> DP -> KPR -> PPJB/Akad (modul K)
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

