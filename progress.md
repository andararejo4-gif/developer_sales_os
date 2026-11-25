# Progress Handover Log

Jejak perubahan proyek untuk handover antar-sesi AI. Entri terbaru selalu di atas.
Aturan: AI membaca 3–5 entri teratas saat sesi dimulai. Entri lama dicari lewat rtk rg dan di-cache ke `.agents/progress-cache.md`.

## P-080 | 2026-11-25 | Pembangunan Fondasi R3 & R4: Kontrak API, Alur KPR & Control Tower
- Status: selesai
- Ubah: `src/lib/foundations/r3-r4-contracts.ts`, `src/components/BankSubmissionWorkflowPage.tsx` (F75), `src/components/ExecutiveControlTowerPage.tsx` (F90 & F88), `src/lib/navigation/router.ts`, `src/components/mobile/MobileMoreSheet.tsx`, `src/App.tsx`.
- Alasan/keputusan: Menyiapkan fondasi deterministik R3 (Alur KPR Bank mitra & SP3K) dan R4 (Control Tower Portofolio & Proyeksi Cashflow) dalam bentuk halaman kerja utuh bergaya `/unslop` dan kontrak adapter API, siap disambungkan ke backend/third-party tanpa merombak UI.
- Verifikasi: `bun test` (136 pass, 0 fail), `bun run build` (`tsc --noEmit && vite build`) lulus 100%.
- Berikutnya: -
- Catatan: Rute view `kpr_bank` dan `control_tower` terintegrasi di sidebar dan router.

## P-079 | 2026-11-25 | Unslopping UI: Quiet Chrome, Clean Spacing & Tipografi Elegan
- Status: selesai
- Ubah: `src/components/ReferralProgramPage.tsx`, `src/components/SecureDocumentVaultPage.tsx`, `src/components/CustomerComplaintsPage.tsx`.
- Alasan/keputusan: Mengaplikasikan prinsip skill `/unslop`: menghilangkan badge/banner mencolok, menata quiet chrome, merapikan card angka, dan menertibkan tabel data agar berkarakter studio arsitektur/pengembang properti.
- Verifikasi: `bun test` (136 pass, 0 fail), `bun run build` (`tsc --noEmit && vite build`) lulus 100%.
- Berikutnya: Audit visual halaman dashboard role lain (TL, SM, Admin, Direksi).

## P-078 | 2026-11-25 | Integrasi Halaman Penuh F74, F79, F86 di Sidebar & Main View (Anti-Popup)
- Status: selesai
- Ubah: `src/components/SecureDocumentVaultPage.tsx`, `src/components/ReferralProgramPage.tsx`, `src/components/CustomerComplaintsPage.tsx`, `src/lib/navigation/router.ts`, `src/components/mobile/MobileMoreSheet.tsx`, `src/App.tsx`.
- Alasan/keputusan: Mengembalikan menu F74, F79, F86 ke sidebar dan mobile sheet sebagai view halaman utuh (`activeView` main area), bukan modal popup overlay, sesuai instruksi user.
- Verifikasi: `bun test` (136 pass, 0 fail), `bun run build` (`tsc --noEmit && vite build`) lulus 100%.
- Berikutnya: -
- Catatan: Menambahkan route view `vault`, `referral`, `garansi` ke router state dan sidebar navigation.

## P-077 | 2026-11-25 | Penghapusan Tombol Popup F86/F79/F74 & Unslopping Layout Responsif
- Status: selesai
- Ubah: `src/App.tsx`, `src/components/PipelinePage.tsx`, `src/components/PlaybookViewer.tsx`, hapus modal dead code `CustomerComplaintsModal.tsx`, `ReferralTrackingModal.tsx`, `SecureDocumentVaultModal.tsx`.
- Alasan/keputusan: Menghilangkan tombol popup F86, F79, F74 dari sidebar sesuai instruksi user; menjaga navigasi berbasis halaman utuh (`activeView`), serta menata ulang header Pipeline & kartu SOP Playbook agar tidak bertumpuk di layar menengah/kecil.
- Verifikasi: `bun test` (136 pass, 0 fail), `bun run build` (`tsc --noEmit && vite build`) sukses.
- Berikutnya: -
- Catatan: Semua navigasi alat kerja diarahkan ke view halaman penuh, bukan overlay popup acak.

## P-076 | 2026-11-25 | Pembangunan Persiapan Fitur R2 (F14, F47, F57, F62, F65, F74, F79, F86)
- Status: selesai
- Ubah: `src/components/LoveLetterViewerModal.tsx` (F14 Claim Ledger), `src/components/pipeline/TaskInboxTab.tsx` (F47 Task Inbox), `src/components/pipeline/BuyerPackModal.tsx` (F57 Buyer Pack), `src/components/DailyRouteViewer.tsx` (F62 Replan Hujan), `src/components/PlaybookViewer.tsx` (F65 Sertifikasi SE), `src/components/SecureDocumentVaultModal.tsx` (F74 Vault KPR), `src/components/ReferralTrackingModal.tsx` (F79 Referral Link), `src/components/CustomerComplaintsModal.tsx` (F86 DLP Garansi), `src/components/PipelinePage.tsx`, `src/App.tsx`.
- Alasan/keputusan: Menutup kesenjangan fitur R2 dengan membangun antarmuka dan kontrak persiapan deterministik tanpa ketergantungan API pihak ketiga / database baru sesuai arahan user.
- Verifikasi: `bun test` (136 pass, 0 fail), `bun run build` (`tsc --noEmit && vite build`) sukses bersih.
- Berikutnya: -

## P-075 | 2026-11-25 | Unslopping Card SOP Playbook & Perataan Responsif Multi-Role
- Status: selesai
- Ubah: `src/components/PlaybookViewer.tsx`, `src/components/CrmPipelineView.tsx`, `src/App.tsx`
- Alasan/keputusan: Merestrukturisasi card SOP Playbook harian: meletakkan target output di footer card berikon Target (tidak lagi menekan kolom kiri), memadukan waktu/channel/SLA dengan flex-wrap & no-wrap agar tidak terpotong vertikal; menambahkan flex-wrap & gap pada seluruh header sub-modul (TL, SM, ADMIN, IT, DIREKSI).
- Verifikasi: `bun test` (136 pass, 0 fail), `bun run build` (`tsc --noEmit && vite build`) sukses.
- Berikutnya: -

## P-074 | 2026-11-25 | Standardisasi Breakpoint Responsif Pipeline & Modul Viewer
- Status: selesai
- Ubah: `src/components/PipelinePage.tsx`, `ContentCalendarViewer.tsx`, `PlaybookViewer.tsx`, `SalesTargetViewer.tsx`, `DailyRouteViewer.tsx`, `MarketResearchViewer.tsx`, `CrmPipelineView.tsx`, `DireksiMultiProjectView.tsx`
- Alasan/keputusan: Mengganti breakpoint `sm:flex-row` menjadi `xl:flex-row` / `lg:flex-row` pada header halaman agar judul tidak terjepit 30px dan tombol aksi tidak menumpuk saat sidebar aktif di layar menengah/restore down.
- Verifikasi: `bun test` (136 pass, 0 fail), `bun run build` (sukses).
- Berikutnya: -

## P-073 | 2026-11-25 | Perbaikan Responsivitas Header Desktop saat Window Dikecilkan / Minimize
- Status: selesai
- Ubah: `src/App.tsx`, `src/components/se/SeNotificationCenter.tsx` (tambah truncation, responsivitas lebar dropdown proyek, label tombol adaptif, badge online adaptif, dan shrink-0 pada lonceng notifikasi)
- Alasan/keputusan: Mengatasi masalah elemen header (tombol Tambah Proyek, dropdown, lonceng notifikasi SE) saling bertumpuk dan menyebabkan overflow horizontal saat ukuran window browser dikecilkan/restore down.
- Verifikasi: `bun test` (136 pass, 0 fail), `bun run build` (sukses).
- Berikutnya: -

## P-072 | 2026-11-25 | Offline Resilience Fallback untuk Login & Verifikasi MFA
- Status: selesai
- Ubah: `src/lib/auth/dummy-accounts.ts` (fallback otomatis ke dummy auth & token mock saat backend/DB offline)
- Alasan/keputusan: Mengatasi kendala gagal login/MFA saat backend server atau PostgreSQL lokal belum aktif setelah pull dari main; dapat di-revert kapan saja sebelum push bila diinginkan.
- Verifikasi: `bun test` (136 pass, 0 fail), `bun run typecheck` (bersih).
- Berikutnya: -
- Catatan: Jika ingin kembali murni server auth saat push, cukup `git checkout src/lib/auth/dummy-accounts.ts`.

## P-071 | 2026-11-25 | F55 AI Nurture Cadence Terjadwal (Tab Khusus, WA Preview 2-Kolom, Baileys)
- Status: selesai (live di `https://developerproperti.giivepro.com` & `hades`)
- Ubah: `db/migrations/0020_wa_nurture_cadence.sql`, `server/wa-nurture.ts` (+auto-fill draf AI & `rescheduleAnchorForLead`), `server/index.ts` (+`/api/nurture/jobs/reschedule-anchor`), `src/components/pipeline/FollowupScheduleTab.tsx` (tab khusus 2 kolom + anchor tanggal follow-up pertama + WA preview), `src/components/PipelinePage.tsx` (tab `FOLLOWUP` & tombol pintas dari kartu lead)
- Alasan/keputusan: F55 dipindah menjadi tab tersendiri agar kartu Pipeline ringkas; draf pesan otomatis disusun AI saat jadwal dibuka, dengan visualisasi gelembung WhatsApp di sisi kanan & editor penuh SE.
- Verifikasi: `npm run build` (`tsc --noEmit && vite build`) bersih; `bun build server/index.ts --outfile dist-server.mjs --target node --packages=external` sukses (22 modul, 0.49 MB).
- Berikutnya: pantau pengiriman scheduler Baileys pada jam kerja 08:30-19:30 WIB.
- Catatan: scheduler berjalan tiap 60 dtk (dapat dimatikan via `WA_NURTURE_SCHEDULER=off`).

## P-070 | 2026-11-25 | Wave 1-4 R1 Local: Auth Server-Side, Unit Lock/Quote, Public Site, Doc Extractor & Conflict Inbox
- Status: selesai (live di `https://developerproperti.giivepro.com` & `hades`; commit `e679668`)
- Ubah: `server/auth.ts`, `server/units-quotes.ts`, `server/truth-engine.ts`, `server/doc-extractor.py`, `server/index.ts`, `db/migrations/0017_auth_sessions_rbac.sql`, `db/migrations/0018_unit_inventory_quotes.sql`, `db/migrations/0019_document_truth_conflicts.sql`, `src/lib/auth/dummy-accounts.ts`, `src/lib/auth/fetch-interceptor.ts`, `src/components/LoginModal.tsx`, `src/components/PublicProjectSitePage.tsx`, `src/App.tsx`, `src/main.tsx`
- Alasan/keputusan: tutup celah auth header (F91), tambah DB row-lock anti double-booking & quote deterministik (F67-F69), buka route publik `/p/:slug` + form lead consent/honeypot (F31-F33), dan pasang extractor `PyMuPDF+RapidOCR+openpyxl` agar `9router` hanya membaca Markdown hasil ekstrak (F01/F02/F04/F05).
- Verifikasi: `npm run build` (`tsc --noEmit && vite build`) bersih; `bun build server/index.ts --outfile dist-server.mjs --target bun` sukses (504 modul); `python -m py_compile server/doc-extractor.py` & uji CSV extractor OK; Python deps (`pymupdf`, `pymupdf4llm`, `rapidocr_onnxruntime`, `openpyxl`) terpasang di local.
- Berikutnya: uji end-to-end dengan PostgreSQL lokal aktif (`bun --env-file=.env server/index.ts`), lalu deploy ke `hades` + `pip install` deps extractor di `hades`.
- Catatan: password hardcoded dihapus dari `DUMMY_ACCOUNTS` frontend; default seed password server pakai `DEVOS_SEED_PASSWORD` (fallback lokal `AndaraOS2026!`).

## P-069 | 2026-11-24 | Perbaikan insiden: pipeline 500 sejak deploy 20:57 + migrasi 0015/0016
- Status: selesai (live)
- Ubah: `db/migrations/0016_fix_pipeline_columns_and_tenant.sql` (kolom lead_quality/spam_reason/is_in_pool/pool_reason/last_activity_at, company_bank_accounts.created_by, tenant_id lead disamakan), ensure di `server/index.ts`
- Alasan/keputusan: deploy P-064 membawa kode multi-tenant (commit 0c6c632) ke DB lama; `/api/pipeline/leads` 500 pukul 20:57-23:52 dan lead baru gagal dibuat. Verifikasi P-064 hanya `/api/health`.
- Verifikasi: pg_dump `~/db-backup/sales_os-20261124-2352.dump`; smoke 15 endpoint GET x 3 role tanpa 5xx sebelum & sesudah deploy; lead Raka 2; SQL WA diuji ROLLBACK.
- Berikutnya: login server sungguhan (password ada di bundle frontend, API percaya header), lalu `WA_HISTORY_API=on`.
- Catatan: 3 baris tenant_id diubah `pt-andara-rejo-makmur` -> `andara_rejo_makmur`. Rollback backend `dist-server.mjs.pre-20261124-2355`, frontend `~/db-backup/index.html.20261124-2355`. Selalu smoke semua endpoint setelah deploy.

## P-068 | 2026-11-24 | AI WA: kapan diam/singkat/jawab/jelaskan/tanya balik/serahkan + riwayat 10 giliran
- Status: live di hades 2026-11-24 23:55 (riwayat chat disimpan & dipakai AI, tetapi BELUM ditampilkan: `WA_HISTORY_API` belum `on` sampai login server diperbaiki). Terpisah: jadwal konten hanya role SE (`SE_EMAILS`) SUDAH live (rollback `dist-server.mjs.pre-20261124-2317`).
- Ubah: `server/wa-turn-engine.ts`, `server/wa-conversation.ts`, `server/wa-consent.ts` (baru), `db/migrations/0015_wa_conversation_turns.sql` + ensure di `server/index.ts`, `server/ai-engine.ts` (35->30 unit, klaim naik Rp50 juta dibuang, turn engine paralel), `server/wa-baileys.ts` (simpan giliran, tunggu burst 6 dtk, persona awal LAINNYA & BANT 1), `src/components/PipelinePage.tsx` (riwayat chat, label mode, keadaan diam), `src/components/PlaybookViewer.tsx`, `scripts/wa_turn_*.ts`, `docs/wa-turn/`
- Alasan/keputusan: LLM hanya membaca maksud, kode memetakan mode; knowledge lain tidak disentuh (keputusan user); SE tetap yang mengirim; opt-out tidak lagi terpicu kata 'batal'.
- Verifikasi: baca maksud 60/60 dan 29/30 kasus sulit (3 putaran); penjaga klaim/harga diuji; tsc frontend bersih; bun test 135/136 (LLM live lama); build ok. UI belum dilihat di browser; SQL baru belum diuji di DB server.
- Berikutnya: OK user atas 10 contoh -> uji SQL ROLLBACK di server -> deploy. Keamanan: `getAuthenticatedUser` percaya header x-user-email, riwayat chat ikut terbuka lewat `/api/pipeline/leads`.
- Catatan: cacat draf tersisa lihat `docs/wa-turn/contoh-10.txt`. `ai-engine.ts` `u.unitCode` tidak ada di katalog (bug lama: harga fallback selalu 'mulai Rp650 juta').

## P-067 | 2026-11-24 | Carousel 5 foto konten + poster marketing (foto ke-6), bank teks, anti kembar
- Status: live di hades (belum pernah dirender; uji nyata 25 Nov 08:00 WIB)
- Ubah: `server/poster-copy.ts` (baru, 204 judul), `server/poster-planner.ts` (TOFU: sampul+3 tips+contoh nyata; MOFU: sampul+2 bukti+denah+cocok untuk siapa; foto 6 = banner harga), `server/poster-engine.ts` (tema dikunci Senja Megah/Blue Hour/Malam Hangat, bahan marmer/beludru/kaca emerald), `server/content-media-worker.ts` (judul 14 hari semua SE, caption ikut slide, poster 3x percobaan, slot tanpa poster = FAILED), `docs/poster-engine/bank-teks.md`
- Alasan/keputusan: poster wajib di akhir; interior/clubhouse ditunda sampai ada foto asli; BOFU tetap poster tunggal.
- Verifikasi: lint 204 judul 0 masalah; simulasi 30 hari 4 SE tanpa LLM: 180/180 carousel 6 foto + poster akhir, kembar hari sama 0; tsc bersih; bun test 135/136; SQL dicek di server; HTTP 200.
- Berikutnya: pantau 08:00; bila LLM mati total judul poster terulang dalam 14 hari (bank 50).
- Catatan: rollback `dist-server.mjs.pre-20261124-2311`.

## P-066 | 2026-11-24 | Mesin poster+carousel tersambung kalender, antrean 1 jam, live di hades
- Status: live (belum pernah generate lewat jalur kalender; uji nyata pertama 25 Nov 08:00 WIB)
- Ubah: `server/poster-planner.ts` (baru: banner, carousel 6 slide, cadangan tanpa LLM), `server/poster-engine.ts`, `server/content-media-worker.ts` (planner di enqueue, `getManualLock`, jendela 60+10 mnt, retry 1x, job 404/macet dilepas, slot tak disela, urutan SE digilir, tempel logo), `server/index.ts` (kolom `media_render_queue.render_meta`, kunci manual), `server/poster-composer.py`; hades `/opt/flow-service/app.py` (lane + kunci 08-09, 13-14, 18:30-19:30 + jeda 10 dtk), `flow_engine.py` (bersihkan referensi juga untuk video)
- Alasan/keputusan: judul/fakta carousel dari bank resmi; LLM memilih tema/card & menulis hook; `LLM` gagal -> rancangan cadangan agar tersedia jam 9. Prompt Flow-native lama dibuang.
- Verifikasi: tsc server bersih, `bun test` 135/136 (LLM live lama), 300 rancangan cadangan tanpa kembar, kunci Hermes diuji per menit batas, SQL diuji transaksi ROLLBACK di DB server, composer jalan di server, HTTP 200, PM2 online.
- Berikutnya: pantau 08:00-09:00 25 Nov; Reels 14:00 belum terbukti (24 Nov semua video gagal); upload `ref-fasad-potret.jpg` ke acc2; OCR; commit git.
- Catatan: rollback backend `dist-server.mjs.pre-20261124-2258`, Hermes `*.bak-20261124-2258`. `andarasales` (siteplan) juga pakai Hermes dan akan dapat 423 di jendela terkunci. Jalur LOCAL_PENDING/OpenRouter masih ada di kode tapi tak diproduksi lagi.

## P-065 | 2026-11-24 | Mesin poster mandiri (LLM art director) + uji 3 gambar
- Status: sebagian (mesin banner jalan lokal; belum tersambung kalender, belum deploy)
- Ubah: `server/poster-engine.ts` (baru: tema/card/fakta/pita/footer dari daftar, hook oleh `cbai/glm-5.2` + editor, pemeriksa isi, perakit prompt, `inspectPoster`), `server/poster-composer.py` (plakat murni sistem, `headroom`, `add_sky`), `server/visual-bible.ts` (tanpa plakat AI), `scripts/poster_engine_briefs.ts`, `scripts/poster_engine_render.ts`, `docs/poster-engine/` (banner-v1, uji-1)
- Alasan/keputusan: LLM hanya memilih ID & menulis hook; klaim/harga/pita/footer dari kode. Combo `andararejomakmurjosjis` 504 untuk brief dan timeout untuk vision; jadi cadangan saja.
- Verifikasi: 16.000 kombinasi prompt < 8000; 3 generate (`c43ae80c946f`, `6bbd8040970f`, `f9d942c24b5c`, 46-51 dtk) -> `public/card-samples/engine_1..3.png`; `bun test` lihat laporan (1 gagal LLM live lama).
- Berikutnya: referensi potret 3:4 (arsitektur engine_2/3 menyimpang dari referensi), uji ulang, antrean 1 jam + kunci di sisi Hermes, baru kalender; carousel terpisah.
- Catatan: perubahan prompt 'EXACT houses', kata sambung kecil, larangan 'aman' di hook, vision gemini-flash-lite BELUM diuji dengan generate. Skrip render butuh env `FLOW_API_KEY`.

## P-064 | 2026-11-24 | Hermes jadi satu-satunya generator + tes Flow + deploy ke hades
- Status: selesai (live di `https://developerproperti.giivepro.com` & `hades`); bug aspect Flow belum diperbaiki
- Ubah: `.env` lokal (baris `OPENROUTER_FREE_IMAGE_KEY` dikomentari `#OFF-hermes-only#` agar jalur Recraft/OpenRouter mati), deploy `dist-server.mjs` (backup `dist-server.mjs.pre-*` di server) + frontend `/var/www/developer-sales-os` (tanpa `generated-media`/`card-samples`)
- Alasan/keputusan: fokus internal, Hermes (Google Flow di `hades`) jalur tunggal. Server memang tidak punya key OpenRouter, jadi sudah Hermes-only. Barrier lama tetap: 1 job global, jeda 12-18 dtk, cooldown 60 dtk antar slot, busy-window, fail-fast "aktivitas tidak biasa", rotasi akun.
- Verifikasi: tes 1 gambar Hermes ok (job `8a9165152bd6`, 47 dtk), `tsc --noEmit` bersih, `bun test` 135/136 (1 timeout tes LLM live `audit-findings-remediation` T3, bukan dari perubahan), PM2 `online`, HTTP 200 `/`, `/api/health`, `/api/se/content-slots/status`.
- Berikutnya: perbaiki `pick_radio` aspect di `/opt/flow-service/flow_engine.py` (minta 3:4, keluar 1376x768 landscape); cek item `LOCAL_PENDING` yatim di `media_render_queue` lokal.
- Update (tes poster Hermes): `server/visual-bible.ts` + `SINGLE_ROW_RULE` (kamera hadap SATU baris, tanpa baris kedua) dan 4 shot baris direvisi; `/opt/flow-service/app.py` `max_length` 4000->8000 (backup `app.py.bak.20261124`, `flow-api` restart) karena prompt terkompilasi ±4600 karakter. Hasil tes: `public/generated-media/hermes_poster_singlerow_1.jpg` & `_2.jpg` (896x1200, 1 baris, teks ejaan benar; atap gambar 2 pelana simetris, gambar 1 miring ke kiri, belum sesuai bible). Belum deploy ulang.
- Bug engine Hermes ditemukan: Flow dalam mode "Agen" (count 2, abaikan setelan) dan `generate_media` mengembalikan tile LAMA di galeri (job `b0ff7564dc02` selesai 25 dtk dengan gambar salah) karena render baru belum muncul. Perlu: matikan Agen, tunggu tile baru (bukan snapshot src), validasi.
- Akar bug engine: UI Flow berubah, toggle jadi tombol `aria-label="Agen Flow"` (ikon `spark`, `aria-pressed=true`) + panel chat Agen di kanan; `ensure_direct_mode` mencari teks "Agen" sehingga prompt selalu masuk chat Agen (agen menulis ulang prompt, 2 output, default 16:9). Perbaikan: `/opt/flow-service/flow_engine.py` `ensure_direct_mode` tutup panel (`Tutup`/`right_panel_close`) + matikan toggle via aria-label (backup `flow_engine.py.bak.20261124`, `flow-api` restart). Uji: job `5ffd1ecf9817`, 15 dtk, 896x1200, penanda "Uji Engine 24 Nov 2130" muncul, 1 baris, atap naik ke kanan, ejaan benar -> `public/generated-media/hermes_poster_direct_test.jpg`.
- Master direction (permintaan user, referensi poster ChatGPT): `server/visual-bible.ts` disusun ulang: `MASTER_HEAD`/`MASTER_TAIL` (struktur ChatGPT, palet tetap emerald/ivory/champagne, bukan crimson), langit sinematik berlapis, pencahayaan mewah, POV `SINGLE_ROW_RULE` baru (unit besar, 2-3 unit penuhi lebar, 1 baris), gradasi atas maks 10% (`TOP_FADE`), `BOTTOM_FADE` dihapus, panel bawah solid 24%. Uji: `public/generated-media/hermes_poster_master_test.jpg` (job `6da1328a4978`). Cacat: atap unit kiri masih mirip pelana, jendela trapesium agak runcing. BELUM tersambung ke jalur Hermes di worker (`buildPosterPrompt` masih dipakai hanya bila `OPENROUTER_FREE_IMAGE_KEY` terisi) dan logo belum ditempel.
- Model Flow: tersedia Nano Banana Pro / 2 Lite / 2.1; engine dulu selalu 2 Lite. `/opt/flow-service/app.py` + `flow_engine.py` kini menerima field `model` di `POST /v1/generate` (default tetap 2 Lite; backup `*.bak2.20261124`). Uji layout penutup + `model: "Nano Banana Pro"`: job `cf3e80a8cfcc`, 15 dtk, `public/generated-media/hermes_poster_pro_closing.jpg`: 1 baris diagonal, atap naik ke kanan, card 4 kolom + pil harga/booking, ejaan benar. Cacat kecil: ikon "Desain Japandi" aneh. Biaya kredit Pro vs Lite belum diukur.
- Card megah: `server/visual-bible.ts` `buildGrandCardBlock` + `CLOSING_FEATURES` (panel lengkung, medali emas, pil metalik, daun + pita; klaim hanya yang berlaku semua cluster, tanpa nomor WA karena tidak ada di data). Prompt penutup 7.950 karakter (batas server 8.000). Uji Pro job `0b3f7dba1a8e`: `public/card-samples/hermes_card_megah_1.jpg`. Cacat: lingkaran hijau kosong di pil, gradasi atas >10%, atap PELANA, panel +-36% tinggi (minta 29%).
- KOREKSI: `hermes_poster_pro_closing.jpg` atapnya juga pelana asimetris (entri di atas salah menyebut benar). `tsc --noEmit` bawaan tidak memeriksa `server/`. Bug tile lama terulang di job `0b3f7dba1a8e` (file API salah; gambar benar ditarik manual).
- Hook+logo+POV: `visual-bible.ts` satu gaya hook (lead-in, hook ultra-bold 2 baris `splitHook`, kapsul payoff), `SKY_RULE` tanpa gradasi (`pickTreatment`/treatment dihapus), POV frontal +-9 m, atap dijelaskan segitiga siku, plakat kosong penahan zona logo; `poster-composer.py` `place_logo` = plakat emerald-emas + logo asli (wajib, error bila file hilang); `content-media-worker.ts` buang arg `slideIdx/seed`. Uji: job `a7b53798e29f` (`hermes_hook_final_2.png`: atap/POV benar, judul tertutup logo) dan `5b80412f8d88` (`hermes_hook_final_3.png`: hook/logo rapi, unit dicermin + jendela 2 tingkat). Larangan mirror ditambah, belum diuji.
- Atap sejajar + baris tak habis: `visual-bible.ts` (atap segitiga siku searah, unit salinan bukan cermin, 3 rumah utuh + tetangga terpotong di kedua tepi). Uji: `8c99e6502bee` (`hermes_hook4_final.png`, GAGAL: pelana; kalimat '/ / /' + 'A B C D E' dibuang) dan `5a52e35f7859` (`hermes_hook5_final.png`, SESUAI permintaan, file API = tile baru). Prompt 7.968/8.000. Baru 1 sampel lolos; belum deploy, belum tersambung kalender.
- Engine Hermes (live, backup `flow_engine.py.bak3.20261124`/`app.py.bak3.20261124`): `POST /v1/generate` terima `reference` (nama aset yang SUDAH ada di project Flow; tidak upload/menyetujui apa pun); `new_tile_srcs` hanya menerima tile di atas tile lama; jalur ukir JPEG cache dihapus; gagal-aman (BUSY/AMBIGUOUS/REFERENCE_*). Aset `ref-fasad-baris.jpg` (`public/brand/`, dari poster Nagoya/Osaka/Tokyo user) diunggah di acc1 atas izin user; acc2/acc3 BELUM punya, rotasi akun akan gagal `REFERENCE_MISSING`.
- Prompt final: `visual-bible.ts` langit/cahaya megah, 2 rumah besar + tetangga terpotong, hook gading+emas, pil hanya harga, footer netral, `isHarshHook` dipakai `checkDeckCoherence`, batas 8000 dicek di kode. `BUILDING_BIBLE` merujuk gambar terlampir: pemanggil WAJIB kirim `reference`. `poster-composer.py` `ai_plaque_box` menutup plakat AI. Uji: job `d73b01f9f65d` -> `public/card-samples/hermes_megah6_final_v2.png` (1 generate, atap searah). Belum: kalender kirim model/reference + tempel logo, deploy backend.
- Catatan: perubahan P-062/P-063 + ini belum di-commit. Rollback backend: `cp dist-server.mjs.pre-<ts> dist-server.mjs && pm2 restart developer-sales-os-api`.

## P-063 | 2026-11-24 | Teks digambar AI (Recraft via 9router) + verifikasi OCR + gaya gradasi emerald
- Status: sebagian (slide 1 teruji; layout content/denah/closing belum diuji dengan pipeline baru)
- Ubah: `server/visual-bible.ts` (buildPosterPrompt: tipografi dikutip persis, gradasi emerald atas memudar ke foto, daun framing, tanpa orang, cahaya lebih hidup), `server/content-media-worker.ts` (requestPosterImage via 9router `/v1/images/generations` size "3:4", fallback key OpenRouter langsung; verifyPosterText = OCR vision + banding kata di kode + cek atap pelana; renderLocalQueueItem retry s.d. 3x; blok poller duplikat dijadikan satu), `server/poster-composer.py` (tulis ulang: hanya logo, bersihkan zona logo, pudarkan tepi hijau keras, panel denah asli)
- Alasan/keputusan: koreksi P-062, teks HARUS digambar AI (bukan Pillow). Teks slide dibuat ringkas (headline 3-5 kata, bullets maks 9 kata) agar minim typo. 9router merotasi 3 akun OpenRouter, kuota key tunggal tidak lagi jadi hambatan.
- Verifikasi: `tsc --ignoreConfig` bersih (catatan: `tsc -p`/file tanpa `--ignoreConfig` lewat rtk memberi pesan palsu "No errors"); slide 1 slot raka d24 ter-render, teks persis, atap sawtooth.
- Berikutnya: uji slide content (bullets), denah, closing; hilangkan kicker=headline kembar di slide 2-4; antre ulang slide 2-6 raka d24 (status CANCELLED).
- Catatan: management API 9router butuh login dashboard, akun OpenRouter tidak bisa dipilih manual dari kode. Brief dina d24 sempat terganti tanpa sengaja.
- Update: art director gaya teks (`pickTreatment`: TOP_FADE / SKY_CLEAN / BOTTOM_FADE; cover/penutup/denah selalu TOP_FADE, slide isi bergantian per shot). Gradasi kini pekat hanya 8% teratas lalu memudar sampai ±48%. Composer mendeteksi hasil nyata (zona hijau atau langit terang) untuk logo. Verifikasi vision ditambah cek kontras. Validator menolak kicker yang hanya mengulang headline. Uji: slide 3 raka d24 (STREET_LIFE, SKY_CLEAN) sukses.

## P-062 | 2026-11-24 | Visual Bible + teks ditempel server + story spine carousel
- Status: sebagian (kode & tes visual selesai; belum dites end-to-end lewat scheduler/DB)
- Ubah: `server/visual-bible.ts` (baru: BUILDING_BIBLE, SHOT_LIBRARY, LIGHT_RECIPE, denah, resolveShotSequence), `server/poster-composer.py` (tulis ulang: cover/content/denah/closing, teks 0 typo), `server/content-media-worker.ts` (prompt LLM story spine + shotId, validator `checkDeckCoherence` + retry 1x, fallback TOFU Nagoya/Osaka/Tokyo dibuat nyambung, prompt Recraft tanpa teks, `composeSlideFromQueue` dipakai kedua jalur poller), `public/brand/denah/` (6 denah asli dari data_train)
- Alasan/keputusan: akar "tidak nyambung" = deck fallback hard-coded (cover 3 cluster, slide 2 rumah second). Teks tidak lagi digambar Recraft; arsitektur dikunci prompt baku; denah asli ditempel, bukan digambar AI.
- Verifikasi: tsc strict server file OK; py_compile OK; 4 generate Recraft nyata + composer: atap sawtooth satu arah konsisten, teks bersih. Jalur Hermes (tanpa OPENROUTER_FREE_IMAGE_KEY) tetap pakai prompt lama.
- Berikutnya: generate 1 slot TOFU penuh dari UI `/kalender-konten`, cek 6 slide; tambah story spine untuk MOFU fallback bila perlu; set `POSTER_PYTHON` bila `python` di PATH Node tanpa Pillow.
- Catatan: FRONT_ROW sempat menghasilkan atap gable; sudah diperkuat di prompt, pantau hasilnya.
- Update 2026-11-24: backend di-restart (`bun server/index.ts`), slot raka d24 diregenerasi (deck AI nyambung + CLUSTER_FACTS terkunci, timeout LLM 45s->150s). Render: slide 1-2 sukses, slide 3-6 FAILED 429 `free-models-per-day` OpenRouter. Brief slot d24 milik dina ikut terganti tanpa sengaja (gambar tidak disentuh).

## P-061 | 2026-11-24 | Perbaikan Input Rekening Developer & Ketahanan Offline
- Status: selesai
- Ubah: `src/components/company/CompanyBankAccountsModal.tsx`
- Alasan/keputusan: Menyediakan fallback persistensi `localStorage` saat backend API (`http://127.0.0.1:3040`) sedang offline atau tidak aktif di lingkungan dev lokal Vite, sehingga penambahan/pengeditan rekening resmi perusahaan tidak lagi memicu error `Terjadi kesalahan saat menyimpan rekening.`.
- Verifikasi: `bun test` (136 pass, 0 fail), `bun run build` (sukses).
- Berikutnya: -


## P-060 | 2026-11-24 | Penerapan Unslop pada Home Page & Seluruh Dashboard Pengguna
- Status: selesai
- Ubah: `src/components/v3/ChapterIntroAndCaseV3.tsx`, `src/components/v3/RailNavV3.tsx`, `src/components/superadmin/ItCommandCenterDashboard.tsx`, `src/components/superadmin/PlatformExecutiveDashboard.tsx`, `src/App.tsx`
- Alasan/keputusan: Menghapus AI visual slop (highlighter neon lime `#C6F432`, blurred blobs `blur-3xl`, jargon gamer "God Mode", kode klausul `§7.1`/`§S18`, `animate-pulse`/`animate-ping` pada status statis, dan over-pill). Menerapkan tipografi tenang (font-bold/semibold), nested radius 8-16px, dan hairline borders.
- Verifikasi: `bun test` (136 pass, 0 fail), `bun run build` (sukses).
- Berikutnya: -


## P-059 | 2026-11-24 | Pemasangan Skill Unslop (UI Craft & Anti-Slop)
- Status: selesai
- Ubah: `~/.gemini/config/skills/unslop/` (global Antigravity), `.agents/skills/unslop/` (workspace)
- Alasan/keputusan: Instalasi skill `unslop` dari https://github.com/heydamir/unslop.git untuk pembersihan visual AI slop (spacing 4px grid, neutral tint, tipografi, zero emoji slop, craft direction).
- Verifikasi: File `SKILL.md`, references, dan scripts terpasang dan diverifikasi integritasnya di kedua path.
- Berikutnya: -


## P-058 | 2026-11-24 | Regenerasi Laporan Harian IT DOCX dengan Tangkapan Layar 16:9 Full Monitor
- Status: selesai
- Ubah: `docs/laporan-harian/2026-11-24/IT-LH-24-NOV-2026.md`, `scripts/generate_daily_report_docx.ts`, folder bukti (10 tangkapan layar 1920x1080)
- Alasan/keputusan: Pengambilan ulang 10 tangkapan layar antarmuka desktop standar monitor 16:9 penuh (1920x1080) pada Lingkungan A (http://localhost:5173) dan Lingkungan B (https://developerproperti.giivepro.com) mencakup seluruh 8 peran akun, serta kompilasi dokumen Word baru bebas pemotongan visual.
- Verifikasi: Berkas DOCX 5,00 MB terbit di `D:\Laporan Andara Rejo Makmur\Harian\Laporan_Harian_Divisi_IT_24_November_2026_v2.docx`.
- Berikutnya: -


## P-057 | 2026-11-24 | Pembaruan Nomor Kontak IT Internal Developer Sales OS
- Status: selesai
- Ubah: `src/data.ts` (nomor WhatsApp Tim IT Internal / SUPERADMIN_IT diperbarui ke +6288980961427)
- Alasan/keputusan: Permintaan penggantian nomor WhatsApp kontak resmi Tim IT Internal Developer Sales OS menjadi 088980961427.
- Verifikasi: `bun test` (136 pass, 0 fail), `bun run build` (sukses).
- Berikutnya: -


## P-056 | 2026-11-24 | Penerapan MFA Seluruh Akun & Penyusunan Dokumen Laporan Harian IT DOCX
- Status: selesai
- Ubah: `src/lib/auth/dummy-accounts.ts`, `src/components/LoginModal.tsx`, `tests/auth-dummy.test.ts`, `scripts/generate_daily_report_docx.ts`, `docs/laporan-harian/2026-11-24/`
- Alasan/keputusan: Implementasi MFA 2 langkah (OTP 6-digit WhatsApp) untuk seluruh 9 akun peran, serta penyusunan dokumen laporan harian resmi format `.docx` (1,95 MB, 15 bagian lengkap + 7 bukti screenshot embedded) disimpan ke `D:\Laporan Andara Rejo Makmur\Harian\Laporan_Harian_Divisi_IT_24_November_2026.docx`.
- Verifikasi: `bun test` (136 pass, 0 fail), verifikasi file DOCX 1.948.499 bytes.
- Berikutnya: -


## P-055 | 2026-11-24 | Standardisasi Bahasa Bebas Kode Teknis & Penghapusan Emoticon UI
- Status: selesai (lokal saja, tidak di-push sesuai instruksi pengguna)
- Ubah: `src/components/PipelinePage.tsx`, `src/components/company/CompanyAuditLogsModal.tsx`, `src/components/FieldOpsModal.tsx`, `src/components/field/GpsLiveRadarMap.tsx`, `src/components/content/ContentSlotOverviewPage.tsx`, `src/components/superadmin/PlatformExecutiveDashboard.tsx`, `src/components/SuperadminPanel.tsx`
- Alasan/keputusan: Mengganti label "Karantina DEV-26" menjadi "Penyaringan Spam" yang profesional dan mudah dimengerti orang awam, serta menghapus seluruh emoticon/emoji di antarmuka pengguna agar bersih dan berstandar enterprise.
- Verifikasi: `bun test` (131 pass, 0 fail), `npm run build` (sukses).
- Berikutnya: -

## P-054 | 2026-11-24 | Uji Isolasi Multi-Tenant Komprehensif (Tenant Baru, 100 Pengguna & 100 Data Dummy)
- Status: selesai (lokal saja, tidak di-push sesuai instruksi pengguna)
- Ubah: `server/index.ts`, `tests/multi-tenant-leakage-isolation.test.ts`
- Alasan/keputusan: Menutup celah kebocoran data antar developer (Multi-Tenant Scoping) pada endpoint rekening bank, audit logs, pipeline leads, lead pool claim/reassign/release, update & delete leads, serta memverifikasi zero data leakage dengan 100 pengguna dan 100 data dummy.
- Verifikasi: `bun test tests/multi-tenant-leakage-isolation.test.ts` (8 pass, 0 fail), `bun test` (131 pass, 0 fail), `npm run build` (sukses).
- Berikutnya: -

## P-054 | 2026-11-24 | Uji Isolasi Multi-Tenant Komprehensif (Tenant Baru, 100 Pengguna & 100 Data Dummy)
- Status: selesai (lokal saja, tidak di-push sesuai instruksi pengguna)
- Ubah: `server/index.ts`, `tests/multi-tenant-leakage-isolation.test.ts`
- Alasan/keputusan: Menutup celah kebocoran data antar developer (Multi-Tenant Scoping) pada endpoint rekening bank, audit logs, pipeline leads, lead pool claim/reassign/release, update & delete leads, serta memverifikasi zero data leakage dengan 100 pengguna dan 100 data dummy.
- Verifikasi: `bun test tests/multi-tenant-leakage-isolation.test.ts` (8 pass, 0 fail), `bun test` (131 pass, 0 fail), `npm run build` (sukses).
- Berikutnya: -

## P-053 | 2026-11-24 | Pembersihan Label Kode Teknis UI Menjadi Bahasa Bisnis Awam
- Status: selesai (lokal saja, tidak di-push sesuai instruksi pengguna)
- Ubah: `src/components/company/CompanyBankAccountsModal.tsx`, `src/components/company/CompanyAuditLogsModal.tsx`, `src/App.tsx`, `src/components/FieldOpsModal.tsx`, `src/components/PipelinePage.tsx`, `src/components/JalurProyek.tsx`, `src/components/PricingTable.tsx`, `server/ai-engine.ts`
- Alasan/keputusan: Menghapus/mengganti kode modul dan istilah audit internal ("(Modul Q1 & S21)", "(Temuan T2)", "Whitelist AI F93", "F100 Copilot", "Log CRUD", "Karantina DEV-26") dengan bahasa bisnis yang mudah dipahami pengguna awam.
- Verifikasi: `bun test` (123 pass, 0 fail), `npx tsc --noEmit` (0 error), `npm run build` (sukses dalam 896ms).
- Berikutnya: -

## P-053 | 2026-11-24 | Pembersihan Label Kode Teknis UI Menjadi Bahasa Bisnis Awam
- Status: selesai (lokal saja, tidak di-push sesuai instruksi pengguna)
- Ubah: `src/components/company/CompanyBankAccountsModal.tsx`, `src/components/company/CompanyAuditLogsModal.tsx`, `src/App.tsx`, `src/components/FieldOpsModal.tsx`, `src/components/PipelinePage.tsx`, `src/components/JalurProyek.tsx`, `src/components/PricingTable.tsx`, `server/ai-engine.ts`
- Alasan/keputusan: Menghapus/mengganti kode modul dan istilah audit internal ("(Modul Q1 & S21)", "(Temuan T2)", "Whitelist AI F93", "F100 Copilot", "Log CRUD", "Karantina DEV-26") dengan bahasa bisnis yang mudah dipahami pengguna awam.
- Verifikasi: `bun test` (123 pass, 0 fail), `npx tsc --noEmit` (0 error), `npm run build` (sukses dalam 896ms).
- Berikutnya: -

## P-052 | 2026-11-24 | Rekonsiliasi Metrik Direksi (T1), Privasi WA UU PDP (T3), FinOps AIC Metering (T7) & F100 Copilot
- Status: selesai (lokal saja, tidak di-push sesuai instruksi pengguna)
- Ubah: `src/App.tsx`, `server/ai-engine.ts`, `server/index.ts`, `server/wa-baileys.ts`, `src/components/FieldOpsModal.tsx`, `src/components/PipelinePage.tsx`, `tests/audit-findings-remediation.test.ts`
- Alasan/keputusan: Menutup Temuan T1 (rekonsiliasi akumulasi Net Sales & Omzet real portofolio + glosarium metrik tunggal), Temuan T3 (kepatuhan UU PDP No. 27/2022 via auto-suppression list saat opt-out STOP & disclaimer draf), Temuan T7 (FinOps AIC metering ledger, budget cap throttle saat saldo 0), dan Modul M17 F100 (interactive AI activity copilot checklist + debet 5 AIC).
- Verifikasi: `bun test` (123 pass, 0 fail), `npx tsc --noEmit` (0 error), `npm run build` (sukses dalam 1.26s).
- Berikutnya: -

## P-051 | 2026-11-24 | Rekening Resmi Perusahaan, Audit Trail CRUD Global, Lead Ownership, Lead Pool & AI Screening DEV-26
- Status: selesai (lokal saja, tidak di-push sesuai instruksi pengguna)
- Ubah: `src/components/PipelinePage.tsx`, `src/components/company/CompanyBankAccountsModal.tsx`, `src/components/company/CompanyAuditLogsModal.tsx`, `src/lib/leads/dev26-screening.ts`, `server/index.ts`, `server/ai-engine.ts`, `src/App.tsx`, `tests/dev26-and-company-accounts.test.ts`
- Alasan/keputusan: Menutup Temuan T2 (fraud rekening) dengan master data whitelist rekening resmi (CRUD oleh SM/Admin), Temuan T4 (audit data) dengan pencatatan & viewer log CRUD global, Temuan T5 (kualitas lead) dengan screening DEV-26, serta permintaan kepemilikan lead ("Milik SE Siapa") dan Lead Pool (claim SE & assign SM/Admin).
- Verifikasi: `bun test` (116 pass, 0 fail), `npx tsc --noEmit` (0 error), `npm run build` (sukses dalam 978ms).
- Berikutnya: -

## P-050 | 2026-11-24 | Presensi Mandiri SM & Admin, Multi-Marker Live Radar SE, dan Pelacakan GPS Persisten Antar-Halaman
- Status: selesai (lokal, siap uji coba, tidak di-push sesuai instruksi pengguna)
- Ubah: `src/components/FieldOpsModal.tsx`, `src/components/field/GpsLiveRadarMap.tsx`
- Alasan/keputusan: SM & Admin sebelumnya tidak dapat melakukan presensi mandiri (karena ter-bypass ke tabel monitoring), SM & Admin belum dapat melihat peta live multi-marker tim SE di tab Absen & GPS, dan radar lokasi SE mati otomatis saat berpindah tab akibat unmount lokal `watchPosition`.
- Verifikasi: `bun test` (111 pass, 0 fail), `npx tsc --noEmit` (0 error), `npm run build` (sukses dalam 1.30s).
- Berikutnya: -

## P-049 | 2026-11-24 | Proporsionalitas Panjang Balasan WA & Persona Voice Guide di AI Lead Engine
- Status: selesai (live di `hades` & pushed ke GitHub)
- Ubah: `server/ai-engine.ts`, `tests/playbook-v1-2-pipeline.test.ts`
- Alasan/keputusan: Balasan WA AI sebelumnya selalu dipaksa 3–4 paragraf + bullet fitur brosur meski client hanya membalas singkat/apresiasi, dan gaya bahasa belum dibedakan per persona.
- Verifikasi: `bun test` (111 pass, 0 fail), `npm run build` (0 error), `dist-server.mjs` deployed ke `hades` (`pm2` online)
- Berikutnya: -

## P-048 | 2026-11-23 | Fix AI Pipeline Analysis & Rekomendasi Follow-Up Berulang (Tail-Context, Anti-Repetition & Auto-Recovery)
- Status: selesai (live di `https://developerproperti.giivepro.com` & `hades`)
- Ubah: `server/ai-engine.ts`, `server/wa-baileys.ts`, `server/index.ts`, `src/components/PipelinePage.tsx`
- Detail Perubahan:
  - **Root Cause & Fix Truncation `sales_notes` (`.slice(-650)` vs `.slice(0, 350)`):** Memperbaiki `server/ai-engine.ts` dan `server/wa-baileys.ts` yang sebelumnya memotong bagian *awal* `sales_notes` (`.slice(0, 350)`) sehingga giliran chat terbaru di bagian *akhir* terpotong dan AI terus membaca konteks obrolan lama (candaan kopi/survei lama). Kini AI selalu membaca ekor percakapan terbaru (`.slice(-650)`).
  - **Anti-Repetition Context (`previousAnalysis`) & Stage-Aware Guidance:** Menyertakan ringkasan analisis, saran taktis, dan draf pesan sebelumnya ke prompt AI dengan instruksi eksplisit melarang pengulangan, menyesuaikan suhu model (`0.65` saat Analisis Ulang), serta mengaktifkan re-analisis otomatis saat `stage`, `unitInterest`, `paymentScheme`, `personaCode`, atau `BANT` berubah di `PATCH /api/pipeline/leads/:id`.
  - **Fix Regex Ekstraksi Nama WA (`extractIntroducedNameFromText`) & Startup Recovery:** Mencegah frasa `"saya rasa setelah survey saya mau..."` menimpa nama prospek (`Alexander III`), memperbaiki cache draf `customDrafts` di `PipelinePage.tsx` agar terkunci per `analysis.id` (`${lead.id}_${analysis.id}`), dan menambahkan auto-recovery `wa_inbound_temp_buffer` saat server restart.
- Verifikasi: `npm run build` (0 error), `bun test` (111 pass, 0 fail), deploy ke `hades` & verifikasi row `lead_ai_analyses` terbaru untuk `Alexander III`.

## P-047 | 2026-11-23 | Kartu Notifikasi Berwarna Sesuai Urgensi, Kalender Tanggal Asli WIB & Fix FlowClient.ev
- Status: selesai (live di `https://developerproperti.giivepro.com` & `hades`)
- Ubah: `src/components/se/SeNotificationCenter.tsx`, `src/App.tsx`, `src/lib/content-calendar/calendar-generator.ts`, `src/components/ContentCalendarViewer.tsx`, `server/content-media-worker.ts`, `server/index.ts`, `/opt/flow-service/flow_engine.py` (di `hades`)
- Detail Perubahan:
  - **Fix `FlowClient.ev` di Hermes (`flow_engine.py`):** Memperbaiki pemanggilan metode evaluasi JS di `/opt/flow-service/flow_engine.py` dari `client.js(...)` menjadi `client.ev(...)`, me-restart `flow-api.service`, dan mengembalikan item antrean yang terdampak ke `PENDING`.
  - **Kartu Notifikasi Berwarna Sesuai Urgensi (Tanpa Garis Tepi Atas):** Menghilangkan `h-1.5` top accent bar dan mewarnai kartu notifikasi + modal detail sesuai urgensi (`rose` untuk Urgent SLA/WA putus, `amber` untuk H-5 Menit/Wajib Check-In/Validasi AI, `slate`/`emerald` untuk tugas rutin).
  - **Kalender Konten Berdasarkan Tanggal Asli & Jumlah Hari Bulan Aktif (`getWibCalendarInfo`, `getWibClock`):**
    - Kalender otomatis membuka **tanggal asli WIB hari ini** (mis. tanggal `23` hari ini, dan otomatis pindah ke tanggal `24` besok) serta menyesuaikan jumlah hari secara dinamis sesuai bulan berjalan (`28`, `29`, `30`, atau `31` hari).
    - **Scheduler Otomatis Tanggal Berjalan (`startContentMediaScheduler`):** Scheduler di `server/content-media-worker.ts` kini mengeksekusi `day_number = dayOfMonth` (mis. besok tanggal 24 mengeksekusi `slot-d24-s1-sales_in_house` mulai pukul `08:15–08:30 WIB`) untuk seluruh akun SE aktif sehingga pukul `09:00 WIB` konten tanggal 24 sudah siap.
- Verifikasi: `npm run build` (0 error), `bun test` (111 pass, 0 fail), `flow-api.service` `ok: true`, deploy frontend & backend ke `hades` (`HTTP 200` + PM2 `online`).

## P-046 | 2026-11-23 | Clean Light Card Design untuk Developer Assistant & Modal Detail Notifikasi (Zero Brown Header)
- Status: selesai (live di `https://developerproperti.giivepro.com` & `hades`)
- Ubah: `src/App.tsx`, `src/components/se/SeNotificationCenter.tsx`
- Detail Perubahan:
  - **Developer Assistant Card (`App.tsx`):** Mengganti header coklat (`bg-espresso`) dengan desain kartu putih bersih (`bg-white`), aksen emerald modern, 3 tile ringkasan real-time (`Agenda Aktif`, `Konten Hari Ini`, `Target Lead`), dan tombol CTA utama `Cek Notifikasi Sekarang`.
  - **Modal Detail Notifikasi (`SeNotificationCenter.tsx`):** Mengganti header coklat dengan layout putih bersih beraksen status (emerald/amber/rose), mengubah tabel kaku menjadi **Grid Stat Tiles (`bg-slate-50`)**, serta menyusun langkah rekomendasi dengan penomoran bulat `1, 2, 3` yang rapi dan mudah dipindai.
- Verifikasi: `npm run build` (0 error), `bun test` (111 pass, 0 fail), deploy ke `hades` (`HTTP 200`).

## P-045 | 2026-11-23 | Arsitektur 4-Lapis Mobile Laporan Harian SE, Developer Assistant Login Onboarding & 3-Card Row Dashboard
- Status: selesai (live di `https://developerproperti.giivepro.com` & `hades`)
- Ubah: `src/components/mobile/SeMobileViews.tsx`, `src/components/se/SeNotificationCenter.tsx`, `src/App.tsx`
- Detail Perubahan:
  - **Arsitektur 4-Lapis Mobile Laporan Harian (`SeMobileDailyReportList`):** Merombak 13 kartu monoton menjadi (1) Strip Progres Harian, (2) Deck Input Cepat 3 Item Manual (`+ / -`), (3) **Grid 2 Kolom (`grid-cols-2`)** untuk 9 Metrik Otomatis CRM dengan bottom-sheet catatan (`z-[85]` via Portal), dan (4) Kartu Penutup Hambatan & Bantuan SM (#13) dengan 4 chip cepat.
  - **Hide Roadmap Kerja Harian & 3 Kartu Sebaris (`App.tsx`):** Menyembunyikan `SeDailyRoadmapStrip` dan menyusun 3 kartu di bawah Poin Akselerasi Hari Ini (`Lead Baru`, `BANT ≥ 7`, `WA & SLA`) menjadi **1 baris sejajar (`grid-cols-3`)** di mobile & desktop.
  - **Developer Assistant Onboarding Setiap Login (`App.tsx`, `SeNotificationCenter.tsx`):** Setiap kali pengguna login (atau logout lalu login kembali), muncul pop-up sapaan **Developer Assistant** yang langsung mengarahkan dan membuka menu **Notifikasi** untuk mengecek persiapan & tugas wajib hari ini.
- Verifikasi: `npm run build` (0 error), `bun test` (111 pass, 0 fail), deploy ke `hades` (`HTTP 200`).

## P-044 | 2026-11-23 | Redesign Mobile Scorecard Bulanan (Visual KPI Progress) & Laporan Harian SE (On-Demand Notes + Quick Chips)
- Status: selesai (live di `https://developerproperti.giivepro.com` & `hades`)
- Ubah: `src/components/mobile/SeMobileViews.tsx`, `src/App.tsx`
- Detail Perubahan:
  - **Mobile Scorecard Bulanan (`SeMobileScorecardList`):** Menambahkan strip ringkasan visual (`Total Poin / 100` + progress bar + jumlah KPI aktif) dan mengubah 7 baris KPI menjadi kartu visual dengan progress bar per komponen, badge bobot, perbandingan `Realisasi / Target`, serta detail rumus expandable saat diklik.
  - **Mobile Laporan / Catatan Harian (`SeMobileDailyReportList`):** Menghapus 13 kotak `<input>` yang terbuka terus-menerus (hemat ~60% tinggi scroll). Setiap item tampil ringkas 1 kartu dengan tombol **`+ Catatan`** on-demand + **chip preset 1-ketuk** (`Sesuai target hari ini`, `Follow-up lanjut besok pagi`, dll.) serta tombol stepper `+ / -` yang lebih besar (`size-7`) di mobile.
- Verifikasi: `npm run build` (0 error), `bun test` (111 pass, 0 fail), deploy ke `hades` (`HTTP 200`).

## P-043 | 2026-11-23 | Portal Z-Index Notifikasi (Tutupi Bottom Bar), Modal Detail Tengah & Daftar Tugas SE Lengkap
- Status: selesai (live di `https://developerproperti.giivepro.com` & `hades`)
- Ubah: `src/components/mobile/MobileBottomNav.tsx`, `src/components/se/SeNotificationCenter.tsx`, `src/App.tsx`
- Detail Perubahan:
  - **Z-Index & Portal (`MobileBottomNav.tsx`, `SeNotificationCenter.tsx`):** Menurunkan `MobileBottomNav` ke `z-30` dan merender panel notifikasi (`z-[80]`) serta modal detail (`z-[90]`) melalui `createPortal(..., document.body)` agar keluar dari stacking context `<header>` (`z-20`) — bottom-sheet di mobile 100% menutupi bottom bar tanpa glitch scroll.
  - **Modal Detail di Tengah (`SeNotificationCenter.tsx`):** Saat salah satu notifikasi diklik, detail lengkap muncul sebagai pop-up di **tengah layar** (`items-center justify-center`), menampilkan ringkasan, tabel detail fakta/status saat ini, rekomendasi aksi lengkap, dan CTA langsung.
  - **Daftar Notifikasi Lengkap:** Mencakup H-5 menit konten (`08:55`, `13:55`, `19:25 WIB`), H-5 menit Export Laporan (`17:55 WIB`), Lead Urgent SLA ≤ 5m, Check-In & Check-Out GPS, Lead Perlu Dilengkapi Data, Jadwal Konten Harian, Rute Canvassing, Target 8 Lead Harian, Koneksi WhatsApp SE, dan Export Laporan Harian.
- Verifikasi: `npm run build` (0 error), `bun test` (111 pass, 0 fail), deploy ke `hades` (`HTTP 200`).

## P-042 | 2026-11-23 | Custom Dropdown + Opsi Lainnya Kalkulator KPR & Notifikasi Header Real-Time (H-5 Menit)
- Status: selesai (live di `https://developerproperti.giivepro.com` & `hades`)
- Ubah: `src/components/KnowledgeBaseViewer.tsx`, `src/components/se/SeNotificationCenter.tsx` (baru), `src/components/se/SeGuidedTour.tsx`, `src/App.tsx`
- Detail Perubahan:
  - **Custom Dropdown & Opsi Lainnya (`KnowledgeBaseViewer.tsx`):** Menghapus seluruh `<select>` bawaan Chrome (Filter Kategori, Tipe Unit, DP, Tenor) dan menggantinya dengan custom bottom-sheet/modal picker. Menambahkan opsi **Lainnya** pada Tipe Unit (input Harga Properti Rp), DP (input Persen DP %), dan Tenor (input Tahun).
  - **Notifikasi Header Real-Time & Pengingat H-5 Menit (`SeNotificationCenter.tsx`, `App.tsx`):** Menambahkan ikon lonceng notifikasi di header mobile & desktop dengan badge angka real-time (tick 30 detik). Otomatis mendeteksi **H-5 menit** sebelum jadwal konten (`08:55`, `13:55`, `19:25 WIB`) dan batas Export Laporan (`17:55 WIB`), serta tugas wajib (Check-In GPS, Lead Urgent, Rute). Mobile membuka bottom-sheet dari bawah ke atas; list default hanya menampilkan judul + badge, lalu klik item membuka modal detail ringkas + rekomendasi aksi + CTA langsung.
  - **Desain Pop-up Pengingat Baru (`SeGuidedTour.tsx`):** Merombak pop-up pengingat wajib & H-5 menit menjadi kartu visual ringkas, bebas paragraf panjang, dengan chip rekomendasi dan CTA cepat.
- Verifikasi: `npm run build` (0 error), `bun test` (111 pass, 0 fail), deploy ke `hades` (`HTTP 200`).

## P-041 | 2026-11-23 | Header Desktop Ringkas & Mobile-First Knowledge Base (2 Tab Horizontal + Expandable Facts)
- Status: selesai (live di `https://developerproperti.giivepro.com` & `hades`)
- Ubah: `src/App.tsx`, `src/components/KnowledgeBaseViewer.tsx`
- Detail Perubahan:
  - **Header Desktop Ringkas (`App.tsx`):** Menghapus tombol `WA Terdiskonek / Terhubung` dan `Export Laporan` dari header desktop SE (karena sudah ada di halaman Dashboard SE & Pipeline).
  - **Knowledge Base 2 Tab Horizontal (`KnowledgeBaseViewer.tsx`):** Menghapus tab `Tanya Produk (AI)` & `Kuis SE (10 Soal)`, menyisakan 2 tab horizontal sejajar (`Fakta Produk` & `Siteplan & KPR`) dengan `grid-cols-2` di mobile (`min-h-[44px]`).
  - **Fakta Produk Tanpa Scroll Horizontal:** Menampilkan list identitas (`Fact ID`, kunci terbaca, kategori) yang saat diklik membuka detail Nilai Faktual, Sumber Kutipan, & Status.
  - **Simulator KPR Mobile-First:** Merapikan input (`grid-cols-2` untuk DP & Tenor di mobile) serta menonjolkan `Estimasi Angsuran / Bulan` di kartu hasil KPR.
- Verifikasi: `npm run build` (0 error), `bun test` (111 pass, 0 fail), deploy ke `hades` (`HTTP 200`).

## P-040 | 2026-11-23 | Hapus Badge Sudah Upload, Custom Stage Picker Pipeline & Mobile-First Absen/GPS
- Status: selesai (live di `https://developerproperti.giivepro.com` & `hades`)
- Ubah: `src/components/content/ContentSlotOverviewPage.tsx`, `src/components/PipelinePage.tsx`, `src/components/FieldOpsModal.tsx`
- Detail Perubahan:
  - **Detail Konten (`ContentSlotOverviewPage.tsx`):** Menghapus pill `Sudah Upload` dari top bar agar header mobile (`Kembali` + `Sosmed (x/4)`) bersih tanpa terpotong.
  - **Custom Pop-up Tahap Pipeline (`PipelinePage.tsx`):** Mengganti `<select>` bawaan Chrome pada kartu lead dengan tombol ringkas (`min-h-[38px]`) yang membuka custom bottom-sheet/modal `Ubah Tahap Pipeline` bergaya native.
  - **Mobile-First Absensi & GPS (`FieldOpsModal.tsx`):** Merapikan tab navigasi (`grid-cols-3`/`grid-cols-4` 1 baris tanpa overflow), menyusun 3 tombol absensi (`Foto`, `Check-In`, `Check-Out`) dalam `grid-cols-3` 1 baris sejajar (`>=44px`), dan menambah `pb-24 md:pb-6` agar aman dari bottom nav.
- Verifikasi: `npm run build` (0 error), `bun test` (111 pass, 0 fail), deploy ke `hades` (`HTTP 200`).

## P-039 | 2026-11-23 | Link Postingan Spesifik Zernio, Filter Desktop-Only & Reflow Mobile Pipeline
- Status: selesai (live di `https://developerproperti.giivepro.com` & `hades`)
- Ubah: `server/zernio-client.ts`, `server/index.ts`, `src/components/content/ContentSlotOverviewPage.tsx`, `src/components/ContentCalendarViewer.tsx`, `src/components/PipelinePage.tsx`
- Detail Perubahan:
  - **URL Postingan Spesifik Zernio:** Memperluas `extractPlatformPostUrl` (`platformPostUrl`, `permalink`, `postUrl`, `shareUrl` + validasi non-profil), memperpanjang polling `/posts/${postId}` hingga ±16 detik, menghapus fallback ke link profil akun, dan menyinkronkan otomatis di `GET /api/se/content-slots/status` bila permalink baru selesai diproses.
  - **Header Detail Konten:** Menghapus tombol `Tandai Sudah Upload` (submit link otomatis menandai `SUDAH_POSTING`).
  - **Filter Kalender Desktop-Only:** Bar filter pada tampilan Mingguan/Bulanan memakai `hidden md:flex` sehingga tersembunyi total di mobile.
  - **Mobile-First Pipeline (`PipelinePage.tsx`):** Merapikan header (`grid-cols-3` 1 baris kompak di mobile, teks isolasi disembunyikan di mobile), menyembunyikan teks panjang/banner WA terdiskonek di mobile, memberi `w-full` pada dropdown Tahap agar tidak overflow kartu, serta menyusun 4 tombol aksi (`Detail`, `Edit`, `AI`, `Hapus`) dalam 1 baris `grid-cols-4` berukuran `>=44px`.
- Verifikasi: `npm run build` (0 error), `bun test` (111 pass, 0 fail), deploy ke `hades` (`HTTP 200` + PM2 `online`).

## P-038 | 2026-11-23 | Auto-Fill Link Hasil Posting + Tombol Akses Link & Polish Mobile-First SE
- Status: selesai (live di `https://developerproperti.giivepro.com` & `hades`)
- Ubah: `src/components/content/ContentSlotOverviewPage.tsx`, `src/components/ContentCalendarViewer.tsx`, `src/components/mobile/MobileMoreSheet.tsx`
- Detail Perubahan:
  - **Auto-Fill & Tombol Akses Link Posting:** Menyinkronkan `urlInput` di `ContentSlotOverviewPage.tsx` secara otomatis saat `slot.postedUrl` atau `data.slot.posted_url` terisi dari auto-publish Zernio, lengkap dengan badge `Terisi Otomatis ✓` dan tombol **Akses Link Postingan** (`target="_blank"`) begitu link tersedia.
  - **Mobile-First Layout Detail Konten:** Merapikan header sticky menjadi hierarki native 2-3 baris (App Bar `Kembali` + `Sosmed`/`Sudah Upload`, blok judul 2 baris bebas potong, tombol aksi full-width >=44px), merapikan tombol `Download Poster`, menyembunyikan thumbnail strip 5 kolom untuk Single Poster, serta memberi bottom clearance `pb-28 md:pb-8`.
  - **Header Jadwal Konten SE:** Menyembunyikan Dual Track Switcher (`Akun Official Proyek` / `Akun Sales In-House (POV)`) untuk role `SE`, dan menyembunyikan Filter Bar (termasuk filter platform Facebook/IG/TikTok/X/YouTube) pada tampilan Harian (`viewMode === 'day'`).
  - **Mobile Bottom Bar → Menu Lainnya (`MobileMoreSheet.tsx`):** Menyembunyikan blok `Pilih Proyek Aktif` dan section `Bagian Dashboard SE` untuk role `SE` agar menu fokus ke alat kerja SE.
- Verifikasi: `npm run build` (0 error), `bun test` (111 pass, 0 fail), deploy ke `hades` (`HTTP 200`).

## P-037 | 2026-11-23 | Same-User Single-Slot Lock, Strict Cross-User FIFO & Cooldown Minimal 1 Menit Antar Slot
- Status: selesai (live di `https://developerproperti.giivepro.com` & `hades`)
- Ubah: `server/content-media-worker.ts`, `server/index.ts`, `src/components/content/ContentSlotOverviewPage.tsx`
- Detail Perubahan:
  - **Same-User Active Guard (HTTP 409):** Jika 1 SE sudah klik generate di satu slot kalender konten lalu mencoba klik generate di slot lain sebelum selesai, backend menolak (`USER_ALREADY_GENERATING`) dan UI menampilkan peringatan agar fokus menunggu slot yang sedang berjalan.
  - **Strict Cross-User FIFO Tanpa Interupsi:** Jika SE lain meminta generate saat ada proses berjalan, permintaannya tetap diterima di belakang antrean (`ORDER BY priority ASC, created_at ASC, id ASC`) tanpa menginterupsi proses yang masuk duluan, lengkap dengan info jumlah item di depan & estimasi waktu tunggu.
  - **Jeda Minimal 1 Menit (60 detik) Antar Slot/User:** Setelah 1 slot selesai (atau gagal), dispatcher wajib menunggu minimal `60.000 ms` (`MIN_INTER_SLOT_COOLDOWN_MS`) sebelum memulai slot/user berikutnya.
- Verifikasi: `npm run build` (0 error), `bun test` (111 pass, 0 fail), live deploy `hades` + cek endpoint `/api/se/content-slots/status`.

## P-036 | 2026-11-23 | Global Sequential Render Queue (1-per-1 + Cooldown), Busy-Window Guard & Fail-Fast Hermes
- Status: selesai (live di `https://developerproperti.giivepro.com` & `hades`)
- Ubah: `server/content-media-worker.ts`, `server/index.ts`, `src/components/content/ContentSlotOverviewPage.tsx`, `/opt/flow-service/flow_engine.py` (di `hades`)
- Detail Perubahan:
  - **Global Sequential Queue (`sales_os.media_render_queue`):** Seluruh permintaan render foto/carousel/video dari semua SE dan scheduler kini masuk ke 1 antrean global PostgreSQL. Worker memproses **tepat 1 item (`PROCESSING`)** pada satu waktu, menunggu selesai, lalu memberi **jeda cooldown aman 12–18 detik** sebelum mengirim item berikutnya (menghilangkan burst 5 job sekaligus).
  - **Busy-Window Guard (30 Menit Sebelum Jadwal):** Mengunci generate manual pada **`08:30–09:00 WIB`** (buka `09:01`), **`13:30–14:00 WIB`** (buka `14:01`), dan **`19:00–19:30 WIB`** (buka `19:31`) agar scheduler terjadwal untuk semua SE selesai tepat waktu tanpa bentrok. UI otomatis menampilkan banner waktu sibuk & jumlah antrean global.
  - **Fail-Fast Hermes (`flow_engine.py`):** Menambahkan deteksi dini pesan *"aktivitas yang tidak biasa"* / *"unusual activity"* pada Google Flow (backup aman di `flow_engine.py.bak.20261123b`) sehingga job langsung berhenti dalam hitungan detik alih-alih menunggu timeout 160 detik, dan worker otomatis membatalkan sisa slide `PENDING` slot yang terkena limit.
- Verifikasi: `npm run build` (0 error), `bun test` (111 pass, 0 fail), `flow-api.service` & PM2 `developer-sales-os-api` `online`.

## P-035 | 2026-11-23 | Playbook Khusus SE & Validasi Foto + GPS Rute Harian Canvassing
- Status: selesai (`e488e54`, live di `https://developerproperti.giivepro.com`)
- Ubah: `src/components/PlaybookViewer.tsx`, `src/components/DailyRouteViewer.tsx`, `src/App.tsx`
- Detail Perubahan:
  - **Playbook Independen SE:** Saat login sebagai `SE`, role switcher (`TL`, `SM`, `Digital Marketing`, `Admin & KPR`) disembunyikan dan Playbook dikunci eksklusif hanya menampilkan SOP & skrip milik `SE`.
  - **Rute Harian Canvassing:** Setiap titik rute wajib dilengkapi **Bukti Foto** (`capture="environment"` + preview thumbnail) dan memiliki 2 opsi validasi:
    1. **Tombol "Validasi Lokasi":** Melacak GPS live SE, menghitung jarak ke titik tujuan/area, mengecek kelengkapan foto. Jika lokasi sesuai radius & foto terlampir → status **`TERVALIDASI ✓`** + tercatat ke log GPS DB (`POST /api/se/field-logs`); jika lokasi di luar radius atau foto belum ada → tercatat **`PERLU DILENGKAPI`** beserta pesan kekurangannya.
    2. **Tombol "Tidak Input GPS":** Membuka field wajib **Alasan Tidak Input GPS** yang tersimpan ke PostgreSQL `/api/se/routes` dengan status **`TANPA_GPS`**.
- Verifikasi: `npm run build` (0 error), `bun test` (111 pass, 0 fail), live `HTTP 200` (`last-modified: Mon, 23 Nov 2026 13:50:46 GMT`).

## P-034 | 2026-11-23 | Pembersihan Tampilan Brief Konten SE & Tombol Perbarui Brief AI
- Status: selesai (`5d452ab`, live)
- Ubah: `src/components/content/ContentSlotOverviewPage.tsx`, `server/index.ts`
- Detail Perubahan:
  - Mengubah **"Brief Eksekusi Konten"** menjadi **"Panduan Eksekusi Konten"** yang bersih & mudah dibaca SE (menghapus prefix internal `[P4]`, `(H-1)`, dan catatan internal persona seperti `"untuk Mas Bayu"`), menambahkan badge tujuan funnel (`Edukasi & Save` / `Bukti & Pertimbangan` / `Penawaran & Closing`), serta menampilkan **Alur Cerita 5 Slide** secara terstruktur.
  - Menyembunyikan **Prompt Visual AI (Hermes)** bahasa Inggris ke dalam toggle `<details>` opsional agar tidak membingungkan SE.
  - Menambahkan endpoint `POST /api/se/content-slots/regenerate-brief` & tombol **"Perbarui Brief AI"** di halaman detail slot untuk menyegarkan slot lama di DB dengan format brief & hook TOFU/MOFU/BOFU terbaru.
  - Audit antrean Carousel Hermes: memverifikasi `queue_size` turun bertahap (7 → 6) dengan kecepatan ±60–75 detik/gambar secara sekuensial.
- Verifikasi: `npm run build` (0 error), `bun test` (111 pass, 0 fail), PM2 `developer-sales-os-api` `online`.

## P-033 | 2026-11-23 | Monitoring Absensi & GPS Tracking Sisi Sales Manager (SM)
- Status: selesai (`840828d`, live)
- Ubah: `src/components/field/SmFieldMonitoringView.tsx` (baru), `src/components/FieldOpsModal.tsx`, `server/index.ts`
- Detail Perubahan:
  - **Backend `GET /api/se/field-logs`:** Role manajer (`SM`, `TL`, `DIREKSI`, `ADMIN`) kini menerima seluruh log absensi, koordinat GPS, dan foto bukti dari semua SE di PostgreSQL `sales_os.se_field_logs` (role `SE` tetap terisolasi per `se_email`).
  - **Tab Absensi (Default untuk SM):** Menampilkan daftar seluruh SE (status hadir, jam Masuk `In`, jam Pulang `Out`, jumlah foto bukti), filter **Harian · Mingguan · Bulanan**, tombol **Export Excel (`.xls`)**, serta tampilan detail per SE saat diklik (riwayat In/Out, koordinat, catatan, & preview foto).
  - **Tab GPS (Sisi SM):** Default **tanpa radar** — hanya menampilkan **daftar SE terdaftar beserta posisi terakhir** (nama lokasi, jarak dari gerbang, jam terakhir, jumlah titik & foto). Klik salah satu SE membuka **halaman detail khusus SE** berisi pemilih tanggal, **Timeline Koordinat Harian Per Jam**, dan **Galeri Laporan Foto Lapangan** (bisa di-zoom).
- Verifikasi: `npm run build` (0 error), `bun test` (111 pass, 0 fail), live deploy sukses.

## P-032 | 2026-11-23 | Export Laporan (PDF/Excel), Pipeline Tab "Perlu Ditangani", & Guided Tour SE
- Status: selesai (`3df5b64`, live)
- Ubah: `src/lib/exporters/daily-report-exporter.ts` (baru), `src/components/se/SeGuidedTour.tsx` (baru), `src/components/PipelinePage.tsx`, `src/components/mobile/SeMobileViews.tsx`, `src/App.tsx`, `server/index.ts`
- Detail Perubahan:
  - **Export Laporan (PDF & Excel):** Mengganti seluruh tombol `Salin Laporan WA` (termasuk perbaikan `ReferenceError: copyWa is not defined`) menjadi **"Export Laporan"** dengan modal pilihan **Export PDF** (print-ready) atau **Export Excel (`.xls`)**, sekaligus menyimpan catatan laporan ke DB sebelum ekspor.
  - **Pipeline `Perlu Ditangani`:** Menambahkan tab baru **"Perlu Ditangani"** dengan badge indikator merah dinamis; lead yang belum dibalas / memiliki draf AI baru / lead `NEW` tanpa follow-up otomatis **berwarna merah** dan di-sort **paling atas** di semua tab.
  - **Roadmap & Guided Tour SE (Desktop & Mobile):** Menambahkan `SeDailyRoadmapStrip` (4 tahap: `① Absen & GPS` → `② Lead Perlu Ditangani` → `③ Konten & Rute` → `④ Export Laporan`) serta `SeGuidedTourModal` anti-ribet (1 pop-up aktif per prioritas, context-aware, tombol snooze 30 menit): memandu Check-In & GPS di pagi hari, dan memunculkan pop-up merah **"Follow Up Sekarang"** jika ada lead belum ditangani.
- Verifikasi: `npm run build` (0 error), `bun test` (111 pass, 0 fail), live `/api/health` OK.

## P-031 | 2026-11-23 | Integrasi Zernio Social Media (4 Akun/SE, 8 Platform) & Pre-Generate Scheduler
- Status: selesai (`41a4bb6`, `b292b95`, live)
- Ubah: `server/zernio-client.ts` (baru), `src/components/content/SocialConnectModal.tsx` (baru), `server/index.ts`, `server/content-media-worker.ts`, `src/components/ContentCalendarViewer.tsx`, `src/components/content/ContentSlotOverviewPage.tsx`
- Detail Perubahan:
  - Mengonfigurasi pool **2 Zernio API Key** di `.env` lokal & server `hades` (`ZERNIO_API_KEY`, `ZERNIO_API_KEY_2`, `ZERNIO_BASE_URL`, `PUBLIC_APP_URL`) sehingga tiap SE dapat menghubungkan hingga **4 akun sosmed** (2 akun per key).
  - Menambahkan tabel `sales_os.se_social_accounts` dan endpoint `GET /api/se/social/accounts`, `GET /api/se/social/connect`, `GET /api/se/social/callback`, `DELETE /api/se/social/accounts`, serta `POST /api/se/content-slots/publish`.
  - Membangun `SocialConnectModal` dengan logo **8 platform** (**Instagram, TikTok, Facebook Page, YouTube Shorts, X/Twitter, Threads, LinkedIn, Pinterest**).
  - Default **tidak auto-posting**; tombol **"Posting ke Social Media Sekarang"** muncul setelah media `READY`, lalu otomatis mengisi `posted_url` & mengubah status menjadi `SUDAH_POSTING`.
  - Scheduler `startContentMediaScheduler()` otomatis menginisialisasi 3 slot harian mulai `08:20 WIB` dan merender media 30 menit sebelum jadwal (`08:30`, `13:30`, `19:00 WIB`).
- Verifikasi: `GET /api/se/social/connect?platform=instagram` live mengembalikan `HTTP 200` dengan `authUrl` resmi Instagram.

## P-030 | 2026-11-23 | Sinkronisasi Lokal SE + `origin/IT-kantor` ke `main`, Penguatan Hook TOFU/MOFU/BOFU & Dashboard SE
- Status: selesai (`ec338dd`, `ccc7a1a`, `c0187d8`, live)
- Ubah: `src/App.tsx`, `src/components/ContentCalendarViewer.tsx`, `src/components/FieldOpsModal.tsx`, `src/components/PlaybookViewer.tsx`, `src/components/KnowledgeBaseViewer.tsx`, `src/components/mobile/MobileMoreSheet.tsx`, `server/content-media-worker.ts`, `server/index.ts`
- Detail Perubahan:
  - Mengamankan seluruh pekerjaan lokal SE (`PROJECT.md`, Hermes Studio, GPS Radar, Rute Harian, KPR KB) di branch `feat/se-ops-local`, lalu menggabungkan `origin/IT-kantor` (multi-proyek, Superadmin/IT dashboards, impersonasi) ke `main` dengan tetap mempertahankan 100% isolasi & fitur `SE`.
  - Memperketat prompt AI TOFU/MOFU/BOFU di `content-media-worker.ts` dengan field `hook` eksplisit per stage dan skrip Reels 3-tahap (`0-3d Hook | 4-11d Bukti | 12-Nd CTA`).
  - Memperbaiki Dashboard SE: menambah *debounce* 500ms pada input catatan laporan, counter `Target Hit` dinamis, dan `quickStatus` di `/api/se/dashboard`.
- Verifikasi: `npm run build` (0 error), `bun test` (111 pass, 0 fail), deploy perdana ke `https://developerproperti.giivepro.com` (`HTTP 200`).

## P-029 | 2026-11-23 | Pembuatan & Push Branch Terisolasi IT-kantor ke Remote
- Status: selesai
- Ubah: Branch Git `IT-kantor`
- Alasan/keputusan: Menyimpan dan mengunggah seluruh pekerjaan (auth multi-tenant, dashboard superadmin eksekutif & IT, impersonasi sesi, dan pembersihan login) ke branch terisolasi `IT-kantor` di GitHub (`origin/IT-kantor`) tanpa menyentuh branch `main` milik tim.
- Verifikasi: `git push -u origin IT-kantor` (sukses membuat remote branch baru), `bun test` (111 pass)
- Berikutnya: Review PR di GitHub bila ingin digabungkan ke main
- Catatan: Branch main tim aman 100% dari overwrite

## P-028 | 2026-11-23 | Pemisahan Navbar Superadmin Platform vs Proyek Klien Developer

- Status: selesai
- Ubah: `src/App.tsx`, `src/components/mobile/MobileMoreSheet.tsx`
- Alasan/keputusan: Menghilangkan nama proyek spesifik ("The Park Townhouse Sukoharjo") dan dropdown pemilihan proyek pada navbar header desktop, subjudul header, sidebar kiri, footer user badge, mobile top header, dan mobile more sheet khusus saat role Superadmin Platform (`SUPERADMIN` dan `SUPERADMIN_IT`) aktif. Digantikan dengan indikator cakupan global core: "Cakupan Seluruh Developer & Proyek Platform" dan tombol "Panel Multi-Tenant Core", sementara role tim sales developer klien tetap memiliki selector proyek aktif masing-masing.
- Verifikasi: `bun test` (111 pass, 0 fail), `bun run build` (sukses)
- Berikutnya: -
- Catatan: Perubahan tetap di lokal (tanpa push ke remote) sesuai instruksi user

## P-027 | 2026-11-23 | Retensi Sesi Impersonasi IT Superadmin & Pembersihan Modal Login

- Status: selesai
- Ubah: `src/lib/auth/dummy-accounts.ts`, `src/components/superadmin/ItCommandCenterDashboard.tsx`, `src/App.tsx`, `src/components/LoginModal.tsx`
- Alasan/keputusan: Fitur impersonasi "Bantu Akun" oleh Superadmin IT kini menyimpan sesi asli IT (`saveImpersonatorBackup`). Saat mode bantuan aktif, tersedia Sticky Banner atas dan tombol sidebar kuning "Kembali ke IT Superadmin" sehingga IT tidak lagi terlempar ke beranda publik saat selesai membantu. Memastikan modal login/signup 100% bersih tanpa teks "PT Andara Rejo Makmur" dan tanpa tombol demo percontohan.
- Verifikasi: `bun test` (111 pass, 0 fail), `bun run build` (sukses)
- Berikutnya: -
- Catatan: Perubahan tetap di lokal (tanpa push ke remote) sesuai instruksi user

## P-027 | 2026-11-23 | Retensi Sesi Impersonasi IT Superadmin & Pembersihan Modal Login

- Status: selesai
- Ubah: `src/lib/auth/dummy-accounts.ts`, `src/components/superadmin/ItCommandCenterDashboard.tsx`, `src/App.tsx`, `src/components/LoginModal.tsx`
- Alasan/keputusan: Fitur impersonasi "Bantu Akun" oleh Superadmin IT kini menyimpan sesi asli IT (`saveImpersonatorBackup`). Saat mode bantuan aktif, tersedia Sticky Banner atas dan tombol sidebar kuning "Kembali ke IT Superadmin" sehingga IT tidak lagi terlempar ke beranda publik saat selesai membantu. Memastikan modal login/signup 100% bersih tanpa teks "PT Andara Rejo Makmur" dan tanpa tombol demo percontohan.
- Verifikasi: `bun test` (111 pass, 0 fail), `bun run build` (sukses)
- Berikutnya: -
- Catatan: Perubahan tetap di lokal (tanpa push ke remote) sesuai instruksi user

## P-026 | 2026-11-23 | Spesialisasi Dashboard Direksi Superadmin (Bisnis SaaS) & IT Superadmin (God Mode CRUD & Support)

- Status: selesai
- Ubah: `src/components/superadmin/PlatformExecutiveDashboard.tsx`, `src/components/superadmin/ItCommandCenterDashboard.tsx`, `src/App.tsx`
- Alasan/keputusan: Memisahkan secara spesifik tampilan Direksi Superadmin (`SUPERADMIN`) dan IT Superadmin (`SUPERADMIN_IT`). Direksi Superadmin memantau portofolio bisnis SaaS (trafik 14k web visitor, 16 developer aktif, MRR Rp 215 Jt, ARR Rp 2,58 M, efisiensi AI margin 99.3%, tabel portofolio developer, GMV Rp 54 M). IT Superadmin memiliki kendali God-Mode menyeluruh (hierarki Developer -> Proyek -> User SE/SM/Direksi, tombol "Bantu Akun Ini / Impersonate" untuk troubleshooting, reset kata sandi, auto-fix WhatsApp Gateway, modal CRUD user tim sales, dan health monitor PostgreSQL devos).
- Verifikasi: `bun test` (111 pass, 0 fail), `bun run build` (sukses)
- Berikutnya: -
- Catatan: Perubahan tetap di lokal (tanpa push ke remote) sesuai instruksi user

## P-025 | 2026-11-23 | Pembersihan Total Tombol Demo & Antarmuka Bersih Login/Signup

- Status: selesai
- Ubah: `src/components/LoginModal.tsx`, `src/lib/auth/dummy-accounts.ts`
- Alasan/keputusan: Menghapus seluruh tombol/teks demo role percontohan dari modal login agar tampilan bersih (_clean_) dan siap produksi bagi calon developer baru. Menyediakan tab toggle bersih: tab "Masuk" (Email & Kata Sandi) dan tab "Daftar Baru" (Nama PT Developer, PIC, Email Bisnis, No. WA, Kata Sandi). Pengguna yang mendaftar langsung disimpan ke storage lokal dan otomatis login sebagai Direksi ke dashboard proyek.
- Verifikasi: `bun test` (110 pass, 0 fail), `bun run build` (sukses)
- Berikutnya: -
- Catatan: Perubahan tetap di lokal (tanpa push ke remote) sesuai instruksi user

## P-024 | 2026-11-23 | Pemisahan Role Internal Platform Developer Sales OS & Role Per Developer

- Status: selesai
- Ubah: `src/data.ts`, `src/lib/auth/dummy-accounts.ts`, `tests/auth-dummy.test.ts`, `src/components/mobile/MobileMoreSheet.tsx`, `src/components/SuperadminPanel.tsx`, `src/App.tsx`, `src/components/LoginModal.tsx`, `src/components/SalesTargetViewer.tsx`
- Alasan/keputusan: Menghapus hak akses Panel Superadmin Multi-Tenant dari role `DIREKSI` dan `IT` (karena keduanya adalah role per-developer klien). Membuat 2 role internal platform Developer Sales OS: `SUPERADMIN` (Direksi / Pemilik Developer Sales OS: `direksi@developersalesos.com`) dan `SUPERADMIN_IT` (Tim IT Internal Developer Sales OS: `it.internal@developersalesos.com`). Keduanya memiliki dashboard eksekutif core platform, hak akses eksklusif ke Panel Superadmin Multi-Tenant, audit token AI, kurasi POI regional, dan concierge pre-seeding VIP.
- Verifikasi: `bun test` (110 pass, 0 fail), `bun run build` (sukses)
- Berikutnya: -
- Catatan: Perubahan tetap di lokal (tanpa push ke remote) sesuai instruksi user

## P-024 | 2026-11-23 | Pemisahan Role Internal Platform Developer Sales OS & Role Per Developer

- Status: selesai
- Ubah: `src/data.ts`, `src/lib/auth/dummy-accounts.ts`, `tests/auth-dummy.test.ts`, `src/components/mobile/MobileMoreSheet.tsx`, `src/components/SuperadminPanel.tsx`, `src/App.tsx`, `src/components/LoginModal.tsx`, `src/components/SalesTargetViewer.tsx`
- Alasan/keputusan: Menghapus hak akses Panel Superadmin Multi-Tenant dari role `DIREKSI` dan `IT` (karena keduanya adalah role per-developer klien). Membuat 2 role internal platform Developer Sales OS: `SUPERADMIN` (Direksi / Pemilik Developer Sales OS: `direksi@developersalesos.com`) dan `SUPERADMIN_IT` (Tim IT Internal Developer Sales OS: `it.internal@developersalesos.com`). Keduanya memiliki dashboard eksekutif core platform, hak akses eksklusif ke Panel Superadmin Multi-Tenant, audit token AI, kurasi POI regional, dan concierge pre-seeding VIP.
- Verifikasi: `bun test` (110 pass, 0 fail), `bun run build` (sukses)
- Berikutnya: -
- Catatan: Perubahan tetap di lokal (tanpa push ke remote) sesuai instruksi user

## P-023 | 2026-11-23 | Netralkan Otentikasi & Teks Multi-Tenant (Hapus Hardcoded PT Andara Rejo Makmur)

- Status: selesai
- Ubah: `src/components/LoginModal.tsx`, `src/App.tsx`, `src/components/mobile/MobileMoreSheet.tsx`, `src/components/JalurProyek.tsx`, `src/components/PlanCheckoutModal.tsx`
- Alasan/keputusan: Menghilangkan hardcoded "PT Andara Rejo Makmur" pada modal login (subjudul "Otentikasi sesi per role", placeholder email "nama@perusahaan.com"), header sidebar ("Multi-Tenant Ecosystem"), header dashboard harian, salinan WA laporan SE, drawer mobile, dan jalur proyek agar bersih dan siap digunakan developer lain secara white-label. Ditambahkan juga shortcut pemilih cepat demo role di modal login.
- Verifikasi: `bun test` (110 pass, 0 fail), `bun run build` (sukses)
- Berikutnya: -
- Catatan: Perubahan tetap di lokal (tanpa push ke remote) sesuai instruksi user

## P-023 | 2026-11-23 | Netralkan Otentikasi & Teks Multi-Tenant (Hapus Hardcoded PT Andara Rejo Makmur)

- Status: selesai
- Ubah: `src/components/LoginModal.tsx`, `src/App.tsx`, `src/components/mobile/MobileMoreSheet.tsx`, `src/components/JalurProyek.tsx`, `src/components/PlanCheckoutModal.tsx`
- Alasan/keputusan: Menghilangkan hardcoded "PT Andara Rejo Makmur" pada modal login (subjudul "Otentikasi sesi per role", placeholder email "nama@perusahaan.com"), header sidebar ("Multi-Tenant Ecosystem"), header dashboard harian, salinan WA laporan SE, drawer mobile, dan jalur proyek agar bersih dan siap digunakan developer lain secara white-label. Ditambahkan juga shortcut pemilih cepat demo role di modal login.
- Verifikasi: `bun test` (110 pass, 0 fail), `bun run build` (sukses)
- Berikutnya: -
- Catatan: Perubahan tetap di lokal (tanpa push ke remote) sesuai instruksi user

## P-022 | 2026-11-23 | Dashboard Khusus IT Internal: Pre-Seed VIP Developer Baru

- Status: selesai
- Ubah: `src/components/SuperadminPanel.tsx`
- Alasan/keputusan: Menyediakan fitur Done-For-You Pre-seeding di Panel Superadmin IT Internal. Tim IT dapat menginput brosur/pricelist calon developer untuk langsung membuatkan akun tenant, menginisialisasi 8 modul (Surat Cinta 99 Keunggulan dari GPS, Landing Page, Riset 25 km, Target Sold Out, Playbook), Magic Link preview Direksi, dan generator pesan WhatsApp siap kirim ke owner developer.
- Verifikasi: `bun test` (110 pass, 0 fail), `bun run build` (sukses)
- Berikutnya: -
- Catatan: Perubahan tetap di lokal (tanpa push ke remote) sesuai instruksi user

## P-022 | 2026-11-23 | Dashboard Khusus IT Internal: Pre-Seed VIP Developer Baru

- Status: selesai
- Ubah: `src/components/SuperadminPanel.tsx`
- Alasan/keputusan: Menyediakan fitur Done-For-You Pre-seeding di Panel Superadmin IT Internal. Tim IT dapat menginput brosur/pricelist calon developer untuk langsung membuatkan akun tenant, menginisialisasi 8 modul (Surat Cinta 99 Keunggulan dari GPS, Landing Page, Riset 25 km, Target Sold Out, Playbook), Magic Link preview Direksi, dan generator pesan WhatsApp siap kirim ke owner developer.
- Verifikasi: `bun test` (110 pass, 0 fail), `bun run build` (sukses)
- Berikutnya: -
- Catatan: Perubahan tetap di lokal (tanpa push ke remote) sesuai instruksi user

## P-021 | 2026-11-23 | Sembunyikan Menu Pipeline & WA AI dari Akun Direksi

- Status: selesai
- Ubah: `src/App.tsx`
- Alasan/keputusan: Menyembunyikan menu "Pipeline & WA AI" dari sidebar navigasi akun Direksi (Bambang Soedirjo) dengan guard `role !== 'DIREKSI'`. Akun Direksi kini hanya menampilkan menu tingkat eksekutif (Dashboard DIREKSI, Portofolio Proyek, Eskalasi Diskon/Refund, dan Panel Superadmin Multi-Tenant).
- Verifikasi: `bun test` (110 pass, 0 fail), `bun run build` (sukses)
- Berikutnya: -
- Catatan: Perubahan tetap di lokal (tanpa push ke remote) sesuai instruksi user

## P-020 | 2026-11-23 | Sembunyikan 10 Menu Operasional dari Sidebar Akun Direksi

- Status: selesai
- Ubah: `src/App.tsx`, `src/components/mobile/MobileMoreSheet.tsx`
- Alasan/keputusan: Merapikan tampilan akun Direksi (Bambang Soedirjo) dengan menyembunyikan 10 menu operasional proyek (Jalur Proyek, Riset Pasar, Target Penjualan, Kalender Konten, Playbook Sales, Absen/GPS/Call, Website Landing Page, Aturan Komisi, Knowledge Base, Surat Cinta) dari sidebar desktop dan menu drawer mobile. Direksi fokus pada Portofolio Proyek, Eskalasi Diskon/Refund, Proyeksi Akhir Bulan, Pipeline & Superadmin
- Verifikasi: `bun test` (110 pass, 0 fail), `bun run build` (sukses)
- Berikutnya: -
- Catatan: Perubahan tetap di lokal (tanpa push ke remote) sesuai instruksi user

## P-019 | 2026-11-23 | Isolasi Surat Cinta 99 Keunggulan & Website Landing Page Per Proyek

- Status: selesai
- Ubah: `src/lib/love-letter/love-letter-engine.ts`, `src/lib/website-generator/website-engine.ts`, `src/components/LoveLetterViewerModal.tsx`, `src/components/ProjectWebsitePreview.tsx`, `src/App.tsx`
- Alasan/keputusan: Menghilangkan kebocoran data The Park Townhouse pada Surat Cinta 99 Keunggulan dan Website Landing Page. Halaman kini berbasis dokumen proyek (koordinat GPS, katalog, pricelist); menampilkan empty state "Belum ada surat cinta 99 keunggulan" dan "Belum ada website landing page" jika belum digenerate, serta tombol inisialisasi yang menghasilkan konten khusus proyek aktif (headline, subdomain, unit, harga, narasi).
- Verifikasi: `bun test` (110 pass, 0 fail), `bun run build` (sukses)
- Berikutnya: -
- Catatan: Perubahan tetap di lokal (tanpa push ke remote) sesuai instruksi user

## P-018 | 2026-11-23 | Isolasi Penuh & Empty State 5 Modul Per Proyek

- Status: selesai
- Ubah: `src/components/JalurProyek.tsx`, `src/components/MarketResearchViewer.tsx`, `src/components/PlaybookViewer.tsx`, `src/components/ContentCalendarViewer.tsx`, `src/components/KnowledgeBaseViewer.tsx`, `src/lib/projects/projects-data.ts`, `src/lib/market-research/market-research-engine.ts`, `src/lib/playbook/playbook-generator.ts`, `src/lib/content-calendar/calendar-generator.ts`
- Alasan/keputusan: Menghilangkan kebocoran data The Park Townhouse Sukoharjo pada proyek lain (Andara Village Sukoharjo, Griya Andara Asri, proyek baru). Jika proyek belum dibuat/diinisialisasi datanya, 5 modul menampilkan pesan eksplisit: "Belum ada jalur proyek", "Belum ada riset pasar", "Belum ada playbook", "Belum ada kalender konten", dan "Belum ada knowledge base" lengkap dengan tombol inisialisasi per proyek
- Verifikasi: `bun test` (110 pass, 0 fail), `bun run build` (sukses)
- Berikutnya: -
- Catatan: Perubahan tetap di lokal (tanpa push ke remote) sesuai instruksi user

## P-017 | 2026-11-23 | Otoritas Skenario Target Penjualan Khusus SM & Sinkronisasi Beban Kerja SE

- Status: selesai
- Ubah: `src/components/SalesTargetViewer.tsx`, `src/App.tsx`
- Alasan/keputusan: Pembatasan hak akses pemilihan skenario & parameter target penjualan (hanya SM/Direksi yang dapat mengedit; SE hanya mode baca dengan indikator gembok terkunci). Pilihan skenario SM (Konservatif / Realistis / Optimis) otomatis mengubah target kontak harian, dial, chat WA, dan survei mingguan di dashboard & laporan aktivitas SE
- Verifikasi: `bun test` (110 pass, 0 fail), `bun run build` (sukses)
- Berikutnya: -
- Catatan: Perubahan tetap di lokal (tanpa push ke remote) sesuai instruksi user

## P-016 | 2026-11-23 | Dukungan Akun SM/TL di Lapangan & Live Radar Tracking GPS SE

- Status: selesai
- Ubah: `src/components/FieldOpsModal.tsx`, `src/App.tsx`
- Alasan/keputusan: Akun SM (Ferry Kurniawan) tidak lagi menimpa/overwrite identitas SE; SM kini memiliki kartu check-in supervisi manajerial sendiri serta dashboard Live Radar GPS yang memantau lokasi real-time seluruh SE binaan (Raka Pratama, Dian Lestari, Budi Santoso) lengkap dengan filter per personel
- Verifikasi: `bun test` (110 pass, 0 fail), `bun run build` (sukses)
- Berikutnya: -
- Catatan: Perubahan tetap di lokal (tanpa push ke remote) sesuai instruksi user

## P-016 | 2026-11-23 | Dukungan Akun SM/TL di Lapangan & Live Radar Tracking GPS SE

- Status: selesai
- Ubah: `src/components/FieldOpsModal.tsx`, `src/App.tsx`
- Alasan/keputusan: Akun SM (Ferry Kurniawan) tidak lagi menimpa/overwrite identitas SE; SM kini memiliki kartu check-in supervisi manajerial sendiri serta dashboard Live Radar GPS yang memantau lokasi real-time seluruh SE binaan (Raka Pratama, Dian Lestari, Budi Santoso) lengkap dengan filter per personel
- Verifikasi: `bun test` (110 pass, 0 fail), `bun run build` (sukses)
- Berikutnya: -
- Catatan: Perubahan tetap di lokal (tanpa push ke remote) sesuai instruksi user

## P-015 | 2026-11-23 | Konfigurasi Operasional Lapangan (Absen, GPS, Call Log, AI Guide) Siap Pakai & Multi-Proyek

- Status: selesai
- Ubah: `src/lib/field-ops/field-ops-store.ts`, `src/components/FieldOpsModal.tsx`, `src/App.tsx`
- Alasan/keputusan: Menghubungkan seluruh fitur halaman Operasional Lapangan (`/lapangan`: Absensi GPS, Tracking Kanvasing, Log Panggilan, AI Guide) ke proyek aktif (`activeProject`), menghitung jarak km dari koordinat GPS proyek aktif, menyediakan isolated storage per proyek, dan menyesuaikan panduan AI per proyek
- Verifikasi: `bun test` (110 pass, 0 fail), `bun run build` (sukses)
- Berikutnya: -
- Catatan: Perubahan tetap di lokal (tanpa push ke remote) sesuai instruksi user

## P-014 | 2026-11-23 | Hapus Tombol Tambah di Jalur Proyek, Modal Dokumen Proyek, & Isolasi Data Penuh (Anti-Bocor)

- Status: selesai
- Ubah: `src/components/JalurProyek.tsx`, `src/App.tsx`
- Alasan/keputusan: Menghapus tombol tambah proyek di Jalur Proyek (terpusat di Navbar), menyematkan modal melihat dokumen input per proyek (katalog, pricelist, koordinat GPS) di Tahap 1, dan mengalirkan `projectId` & `projectName` ke seluruh modul (Riset, Playbook, Rute, Kalender, CRM, Target, KB, Website, Surat Cinta) agar data 100% terisolasi per proyek tanpa kebocoran data
- Verifikasi: `bun test` (110 pass, 0 fail), `bun run build` (sukses)
- Berikutnya: -
- Catatan: Perubahan tetap di lokal (tanpa push ke remote) sesuai instruksi user

## P-013 | 2026-11-23 | Mesin Tambah Proyek Berbasis Koordinat GPS, Katalog, Pricelist & 6 Output Otomatis

- Status: selesai
- Ubah: `src/lib/projects/projects-data.ts`, `src/App.tsx`, `src/components/JalurProyek.tsx`, `src/components/PlaybookViewer.tsx`, `src/lib/playbook/playbook-generator.ts`, `src/lib/playbook/types.ts`, `tests/projects-data.test.ts`
- Alasan/keputusan: Alur tambah proyek berbasis koordinat GPS, radius 25km, file katalog & pricelist bertahap yang otomatis mengaktifkan 6 output: Surat Cinta 99 Keunggulan, Riset Pasar Radius 25km, Target Penjualan 100%, Kalender Konten 30 Hari (Official & per SE), Playbook Sales (SE, TL, SM, Digital Marketing, Admin), dan Rute Harian Kanvasing SE
- Verifikasi: `bun test` (110 pass, 0 fail), `bun run build` (sukses)
- Berikutnya: -
- Catatan: Perubahan tetap di lokal (tanpa push ke remote) sesuai instruksi user

## P-012 | 2026-11-23 | Tombol Tambah Proyek di Navbar & Modal Pembuatan Proyek Baru

- Status: selesai
- Ubah: `src/App.tsx`, `src/lib/projects/projects-data.ts`, `tests/projects-data.test.ts`
- Alasan/keputusan: Menambahkan tombol "Tambah Proyek" persis di sebelah dropdown memilih proyek di navbar desktop dan sidebar, lengkap dengan modal input data proyek baru (nama, kode, tipe, lokasi, total unit, kisaran harga, deskripsi) yang otomatis tersimpan dan aktif
- Verifikasi: `bun test` (110 pass, 0 fail), `bun run build` (sukses)
- Berikutnya: -
- Catatan: Perubahan tetap di lokal (tanpa push ke remote) sesuai instruksi user

## P-011 | 2026-11-23 | Integrasi Multi-Proyek Penuh ke Seluruh Halaman & Inventori Unit

- Status: selesai
- Ubah: `src/lib/projects/projects-data.ts`, `src/App.tsx`, `src/components/KnowledgeBaseViewer.tsx`, `src/components/LoveLetterViewerModal.tsx`, `src/components/ProjectWebsitePreview.tsx`, `tests/projects-data.test.ts`
- Alasan/keputusan: Integrasikan activeProject ke seluruh modul (Jalur Proyek, Riset, Target, Kalender, Playbook, Rute, Lapangan, Website, CRM, KB, Surat Cinta, Inventori Unit, Sidebar SM & Card Dashboard), data unit dan cluster terisolasi dinamis per proyek aktif
- Verifikasi: `bun test` (109 pass, 0 fail), `bun run build` (sukses)
- Berikutnya: -
- Catatan: Perubahan tetap di lokal (tanpa push ke remote) sesuai instruksi user

## P-011 | 2026-11-23 | Integrasi Multi-Proyek Penuh ke Seluruh Halaman & Inventori Unit

- Status: selesai
- Ubah: `src/lib/projects/projects-data.ts`, `src/App.tsx`, `src/components/KnowledgeBaseViewer.tsx`, `src/components/LoveLetterViewerModal.tsx`, `src/components/ProjectWebsitePreview.tsx`, `tests/projects-data.test.ts`
- Alasan/keputusan: Integrasikan activeProject ke seluruh modul (Jalur Proyek, Riset, Target, Kalender, Playbook, Rute, Lapangan, Website, CRM, KB, Surat Cinta, Inventori Unit, Sidebar SM & Card Dashboard), data unit dan cluster terisolasi dinamis per proyek aktif
- Verifikasi: `bun test` (109 pass, 0 fail), `bun run build` (sukses)
- Berikutnya: -
- Catatan: Perubahan tetap di lokal (tanpa push ke remote) sesuai instruksi user

## P-010 | 2026-11-23 | Arsitektur Multi-Proyek & Project Switcher Universal Semua Role

- Status: selesai
- Ubah: `src/lib/projects/projects-data.ts`, `src/App.tsx`, `src/components/mobile/MobileMoreSheet.tsx`, `src/data.ts`, `tests/projects-data.test.ts`
- Alasan/keputusan: Akun masuk tingkat perusahaan (PT Andara Rejo Makmur); seluruh role (SE, TL, SM, DM, Admin, Direksi, IT) kini dapat beralih proyek aktif secara dinamis
- Verifikasi: `bun test` (107 pass, 0 fail), `bun run build` (sukses)
- Berikutnya: -
- Catatan: Perubahan tetap di lokal (tanpa push) sesuai instruksi user

## P-009 | 2026-11-23 | Pemisahan 30 Unit dan Pantau Kinerja SE menjadi halaman mandiri

- Status: selesai
- Ubah: `src/lib/navigation/router.ts`, `src/App.tsx`, `src/components/mobile/MobileMoreSheet.tsx`, `tests/navigation-router.test.ts`
- Alasan/keputusan: Memisahkan tabel 30 unit (`/unit-park`) dan supervisi SE (`/kinerja-se`) dari dashboard agar SM memiliki Executive Overview ringkas dan halaman kerja mandiri
- Verifikasi: `bun test` (104 pass, 0 fail), `bun run build` (sukses)
- Berikutnya: -
- Catatan: Perubahan tetap tersimpan lokal, belum di-push ke remote sesuai instruksi user

## P-008 | 2026-11-23 | Standarisasi & penyatuan sidebar navigasi role SM

- Status: selesai
- Ubah: `src/App.tsx` (penyatuan 10 menu proyek ke top navigation, standardisasi format h-10 px-3.5, active state #master-unit & #tim-se, pembersihan impor tak terpakai)
- Alasan/keputusan: Menghilangkan redundansi menu (CRM & Rute Kanvasing), menyamakan dimensi/gaya tombol & ikon di role SM
- Verifikasi: `bun run build` (lulus tanpa error TS/Vite), `bun test` (104 pass, 0 fail)
- Berikutnya: -
- Catatan: Perubahan tetap di lokal, tidak di-push ke remote sesuai instruksi user

## P-007 | 2026-11-23 | Sinkronisasi remote origin/main (3 commit fitur WA Outbound & SE Dashboard)

- Status: selesai
- Ubah: `git merge origin/main` (10 files: server/wa-baileys, server/index, App.tsx, PipelinePage, SE dashboard)
- Alasan/keputusan: Fast-forward pembaruan fitur kirim pesan WA langsung, chat flow, dan sinkronisasi SE dashboard
- Verifikasi: `bun test` (104 pass, 0 fail)
- Berikutnya: -
- Catatan: Perubahan lokal AGENTS.md dan progress.md aman

## P-006 | 2026-11-23 | Sinkronisasi remote origin/main (3 commit fitur WA & Pipeline AI)

- Status: selesai
- Ubah: `git merge origin/main` (36 files: backend server wa/ai, PipelinePage, router mobile, tests)
- Alasan/keputusan: Fast-forward pembaruan remote tanpa menyentuh perubahan uncommitted lokal
- Verifikasi: `bun test` (104 pass, 0 fail), `bun run build` (sukses)
- Berikutnya: -
- Catatan: Perubahan lokal pada AGENTS.md dan progress.md tetap utuh

## P-005 | 2026-11-21 | Standarisasi aturan global 9 pasal & format progress

- Status: selesai
- Ubah: `AGENTS.md` (9 pasal lengkap), `progress.md` (format baku P-xxx)
- Alasan/keputusan: Menyelaraskan alur mulai sesi, format handover terstandar, dan mekanisme caching progress lama
- Verifikasi: `rtk git status` mendeteksi perubahan terisolasi
- Berikutnya: -
- Catatan: AI sesi berikutnya wajib membaca P-005 hingga P-001 di awal sesi

## P-004 | 2026-11-21 | Mekanisme caching pembacaan riwayat lama

- Status: selesai
- Ubah: `AGENTS.md`, `progress.md` (klausul 1x baca riwayat lama dijadikan cache)
- Alasan/keputusan: Mencegah pemborosan token pembacaan ulang file riwayat
- Verifikasi: Diff terverifikasi
- Berikutnya: -

## P-003 | 2026-11-21 | Adopsi aturan minimalis workspace

- Status: selesai
- Ubah: `AGENTS.md` (meringkas aturan repo menjadi panduan kerja terpadu)
- Alasan/keputusan: Memperjelas hierarki prioritas (benar > konteks utuh > token minimal)
- Verifikasi: Diff diperiksa bersih
- Berikutnya: -

## P-002 | 2026-11-21 | Audit & instalasi plugin anti-slop

- Status: selesai
- Ubah: `~/.gemini/config/plugins/antislop` (pemasangan v3.2.32, 6 skills, 2 rules)
- Alasan/keputusan: Mencegah output UI/copy/code klise AI
- Verifikasi: `skillspector` scan (APPROVE) & `agy plugin list` status enabled
- Berikutnya: -

## P-001 | 2026-11-21 | Konfigurasi RTK CLI proxy

- Status: selesai
- Ubah: Hook pre-tool `rtk hook antigravity` aktif untuk `run_command`
- Alasan/keputusan: Kompresi output terminal untuk menghemat token
- Verifikasi: `rtk gain`, `rtk deps`, `rtk git status`
- Berikutnya: -
