-- 0003 · Lead, kualifikasi BANT, pipeline, appointment, penawaran, tugas
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

