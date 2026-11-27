# Baseline Governance & Kesiapan Bangun (`GATE-00` Evidence)

**Tanggal:** 26 November 2026  
**Cakupan:** Menyatukan artefak tata kelola (`GOV-01`, `GOV-02`, `GOV-04`, `GOV-05`, `GOV-06`, `GOV-08`) sebagai prasyarat `GATE-00` pada `09_Gate_Rilis`.

---

## 1. `GOV-01` — Pembekuan Baseline Blueprint v1.5
- Baseline arsitektur, modul R0–R3, dan daftar 100 fitur mengacu pada `docs/CHECKLIST_PEMBANGUNAN_TIM_IT_V2.xlsx` (`01_Ringkasan`, `02_Backlog`, `04_Fitur_100`) serta `docs/AUDIT_BLUEPRINT.md`.
- Perubahan lingkup di luar baseline wajib dicatat melalui `progress.md` dan `docs/REGISTRI_DEV_DAN_PELAPORAN_TUNGGAL.md`.

## 2. `GOV-02` — Penetapan Tim & Matriks Kewenangan
- Matriks PIC, pembagian Track A/B/C, dan kewenangan persetujuan CTO/Direksi ditetapkan pada `docs/REGISTRI_DEV_DAN_PELAPORAN_TUNGGAL.md` Bagian 3.
- Akun sistem internal (`SUPERADMIN`, `SUPERADMIN_IT`) dipisahkan secara tegas dari role tenant (`IT`, `SM`, `SE`, `TL`, `ADMIN`, `DIREKSI`).

## 3. `GOV-04` — Validasi Hak Data & Kewenangan Tindakan
- Isolasi `tenant_id` di seluruh query API/PostgreSQL, RBAC 6 role, serta guard kepemilikan data SE ditetapkan pada `docs/SECURITY_QA_AND_PERSONA_PLAYBOOK.md` dan diverifikasi oleh `UT-03`, `UT-REG-CRUD-SE`, dan `UT-REG-PERM-6ROLE`.

## 4. `GOV-05` — Acceptance Criteria & Profil NFR
- Kriteria penerimaan per fitur dan skenario UAT 40 kasus ditetapkan pada `08_UAT_40` serta kontrak API pada `docs/ARCHITECTURE_AND_CONTRACTS.md` dan `docs/SPEC_CORE_FEATURES_R0_R1.md`.
- Target NFR minimum: build produksi bersih (`tsc --noEmit && vite build`), zero-leakage lintas tenant, atomik lock pada transaksi sensitif (`createAppointmentAtomic`), dan idempotensi outbox/AIC.

## 5. `GOV-06` — Persetujuan Vendor, Region, Biaya & Akun
- Keputusan stack runtime (Bun, React/Vite, PostgreSQL), strategi deployment, dan pemisahan layanan eksternal (WhatsApp/AI/SMTP) tercatat pada `docs/ADR-001_ARCHITECTURE_AND_DECISIONS.md`.

## 6. `GOV-08` — Prosedur Perubahan Lingkup & Manajemen Risiko
- Setiap bug/regresi yang ditemukan saat UAT dicatat pada Berita Acara UAT (`docs/BERITA_ACARA_UAT_26_NOV_2026.pdf`), diperbaiki pada layer terkait, dan diverifikasi ulang sebelum perubahan status ke `Selesai`.
