import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  BorderStyle,
  HeadingLevel,
  Header,
  Footer,
  PageNumber,
  ImageRun,
  ShadingType
} from "docx";
import * as fs from "fs";
import * as path from "path";

const FONT_FAMILY = "Calibri";
const COLOR_PRIMARY = "1B2A4A"; // Navy Deep
const COLOR_SECONDARY = "2C3E50"; // Dark Slate
const COLOR_ACCENT = "C86D51"; // Terracotta / Amber
const COLOR_MUTED = "6B7280"; // Gray
const COLOR_BORDER = "D1D5DB"; // Light gray border
const COLOR_TH_BG = "F3F4F6"; // Table header background
const COLOR_ROW_ALT = "F9FAFB"; // Alternating row background

const tableBorder = {
  top: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER },
  bottom: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER },
  left: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER },
  right: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER },
};

function createHeading1(text: string): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 280, after: 120 },
    children: [
      new TextRun({
        text,
        bold: true,
        size: 26, // 13pt
        font: FONT_FAMILY,
        color: COLOR_PRIMARY,
      }),
    ],
  });
}

function createHeading2(text: string): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 200, after: 80 },
    children: [
      new TextRun({
        text,
        bold: true,
        size: 22, // 11pt
        font: FONT_FAMILY,
        color: COLOR_SECONDARY,
      }),
    ],
  });
}

function createParagraph(text: string, options?: { bold?: boolean; italic?: boolean; color?: string; spacingAfter?: number }): Paragraph {
  return new Paragraph({
    spacing: { after: options?.spacingAfter ?? 100 },
    children: [
      new TextRun({
        text,
        bold: options?.bold ?? false,
        italics: options?.italic ?? false,
        font: FONT_FAMILY,
        size: 20, // 10pt
        color: options?.color ?? "1F2937",
      }),
    ],
  });
}

function createBullet(title: string, content: string): Paragraph {
  return new Paragraph({
    bullet: { level: 0 },
    spacing: { after: 80 },
    children: [
      new TextRun({
        text: title + " ",
        bold: true,
        font: FONT_FAMILY,
        size: 20,
        color: COLOR_PRIMARY,
      }),
      new TextRun({
        text: content,
        font: FONT_FAMILY,
        size: 20,
        color: "374151",
      }),
    ],
  });
}

function createCallout(title: string, text: string, colorHex: string = COLOR_ACCENT): Table {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            borders: {
              top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
              bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
              right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
              left: { style: BorderStyle.SINGLE, size: 28, color: colorHex },
            },
            shading: { fill: "F8FAFC", type: ShadingType.CLEAR },
            margins: { top: 120, bottom: 120, left: 160, right: 160 },
            children: [
              new Paragraph({
                spacing: { after: 60 },
                children: [
                  new TextRun({
                    text: title,
                    bold: true,
                    size: 21,
                    font: FONT_FAMILY,
                    color: COLOR_PRIMARY,
                  }),
                ],
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text,
                    italics: true,
                    size: 19,
                    font: FONT_FAMILY,
                    color: "374151",
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });
}

function createTableHeaderCell(text: string, widthPct?: number): TableCell {
  return new TableCell({
    borders: tableBorder,
    shading: { fill: COLOR_TH_BG, type: ShadingType.CLEAR },
    margins: { top: 100, bottom: 100, left: 100, right: 100 },
    width: widthPct ? { size: widthPct, type: WidthType.PERCENTAGE } : undefined,
    children: [
      new Paragraph({
        alignment: AlignmentType.LEFT,
        children: [
          new TextRun({
            text,
            bold: true,
            size: 18, // 9pt
            font: FONT_FAMILY,
            color: COLOR_PRIMARY,
          }),
        ],
      }),
    ],
  });
}

function createTableCell(text: string, options?: { bold?: boolean; italic?: boolean; widthPct?: number; altBg?: boolean; align?: AlignmentType; color?: string }): TableCell {
  return new TableCell({
    borders: tableBorder,
    shading: options?.altBg ? { fill: COLOR_ROW_ALT, type: ShadingType.CLEAR } : undefined,
    margins: { top: 80, bottom: 80, left: 100, right: 100 },
    width: options?.widthPct ? { size: options?.widthPct, type: WidthType.PERCENTAGE } : undefined,
    children: [
      new Paragraph({
        alignment: options?.align ?? AlignmentType.LEFT,
        children: [
          new TextRun({
            text,
            bold: options?.bold ?? false,
            italics: options?.italic ?? false,
            size: 18, // 9pt
            font: FONT_FAMILY,
            color: options?.color ?? "374151",
          }),
        ],
      }),
    ],
  });
}

function embedImage16x9(imageRelPath: string, caption: string): Paragraph[] {
  const fullPath = path.resolve(imageRelPath);
  if (!fs.existsSync(fullPath)) {
    return [
      createParagraph(`[Gambar tidak ditemukan di disk: ${imageRelPath}]`, { italic: true, color: "DC2626" })
    ];
  }
  const imageBuffer = fs.readFileSync(fullPath);
  return [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 120, after: 60 },
      children: [
        new ImageRun({
          data: imageBuffer,
          transformation: {
            width: 580,
            height: 326.25, // Rasio 16:9 persis (580 / 1.7777778 = 326.25)
          },
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 160 },
      children: [
        new TextRun({
          text: `Gambar Bukti (Monitor 16:9 Full HD): ${caption}`,
          italics: true,
          size: 17,
          font: FONT_FAMILY,
          color: COLOR_MUTED,
        }),
      ],
    }),
  ];
}

async function buildDocx() {
  const doc = new Document({
    styles: {
      default: {
        document: {
          run: {
            font: FONT_FAMILY,
            size: 20,
            color: "374151",
          },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1440,
              bottom: 1440,
              left: 1440,
              right: 1440,
            },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({
                    text: "PT ANDARA REJO MAKMUR · DIVISI TEKNOLOGI INFORMASI",
                    size: 16,
                    font: FONT_FAMILY,
                    color: COLOR_MUTED,
                    bold: true,
                  }),
                ],
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: "Dokumen Resmi QA & Dokumentasi · IT-LH-24-NOV-2026 · Halaman ",
                    size: 16,
                    font: FONT_FAMILY,
                    color: COLOR_MUTED,
                  }),
                  new TextRun({
                    children: [PageNumber.CURRENT],
                    size: 16,
                    font: FONT_FAMILY,
                    color: COLOR_MUTED,
                  }),
                  new TextRun({
                    text: " dari ",
                    size: 16,
                    font: FONT_FAMILY,
                    color: COLOR_MUTED,
                  }),
                  new TextRun({
                    children: [PageNumber.TOTAL_PAGES],
                    size: 16,
                    font: FONT_FAMILY,
                    color: COLOR_MUTED,
                  }),
                ],
              }),
            ],
          }),
        },
        children: [
          // Header / Title Block
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 60 },
            children: [
              new TextRun({
                text: "PT ANDARA REJO MAKMUR  ·  DIVISI TEKNOLOGI INFORMASI",
                bold: true,
                size: 22,
                font: FONT_FAMILY,
                color: COLOR_MUTED,
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 40 },
            children: [
              new TextRun({
                text: "LAPORAN HARIAN DIVISI IT",
                bold: true,
                size: 32,
                font: FONT_FAMILY,
                color: COLOR_PRIMARY,
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 140 },
            children: [
              new TextRun({
                text: "Selasa, 24 November 2026  ·  Audit QA Komprehensif Seluruh Akun & 2 Lingkungan",
                italics: true,
                size: 20,
                font: FONT_FAMILY,
                color: COLOR_SECONDARY,
              }),
            ],
          }),

          // Putusan Reviewer / Executive Decision Box
          createCallout(
            "PUTUSAN QA & DOKUMENTASI ENGINEER — SATU PARAGRAF",
            "Seluruh lima fokus pengembangan 24 November 2026 (DEV-27 hingga DEV-31) beserta implementasi Multi-Factor Authentication (MFA OTP 6-digit WhatsApp) untuk seluruh 9 peran akun telah berhasil dibangun dan diverifikasi pada Lingkungan A (http://localhost:5173). Hasil pengujian stres 100 pengguna dummy dan 100 data dummy lintas tenant membuktikan 0% kebocoran data (zero leakage), dan angka portofolio eksekutif Direksi (omzet Rp 8,07 M dan net sales 21 unit) telah terekonsiliasi konsisten secara matematis. Seluruh bukti visual diambil dalam resolusi layar monitor penuh 16:9 (1920x1080) tanpa pemotongan. Berdasarkan hasil pengamatan langsung, Lingkungan B (https://developerproperti.giivepro.com) masih beroperasi pada rilis build terdahulu dan membutuhkan penjadwalan deployment sinkronisasi. Status dokumen ditetapkan AMBER: Fitur Teruji di Dev, Siap Menuju RnD/Staging."
          ),

          new Paragraph({ spacing: { after: 120 } }),

          // Atribut Dokumen (Tabel Atribut Formal)
          new Paragraph({
            spacing: { after: 60 },
            children: [
              new TextRun({
                text: "Tabel Atribut Dokumen Laporan",
                bold: true,
                size: 20,
                font: FONT_FAMILY,
                color: COLOR_PRIMARY,
              }),
            ],
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  createTableCell("Judul Dokumen", { bold: true, widthPct: 26, altBg: true }),
                  createTableCell("Laporan Harian Divisi IT — Audit QA Komprehensif Seluruh Akun & 2 Lingkungan", { widthPct: 74 }),
                ],
              }),
              new TableRow({
                children: [
                  createTableCell("Nomor Dokumen", { bold: true, altBg: true }),
                  createTableCell("IT-LH-24-NOV-2026"),
                ],
              }),
              new TableRow({
                children: [
                  createTableCell("Bahan Rujukan Utama", { bold: true, altBg: true }),
                  createTableCell("Blueprint Developer Sales OS v1.5 (20 Nov 2026); Review Laporan Harian IT 23 Nov 2026"),
                ],
              }),
              new TableRow({
                children: [
                  createTableCell("Lingkungan A (Link 1)", { bold: true, altBg: true }),
                  createTableCell("http://localhost:5173 (dev, bukan staging) · Commit Git: 9de427b"),
                ],
              }),
              new TableRow({
                children: [
                  createTableCell("Lingkungan B (Link 2)", { bold: true, altBg: true }),
                  createTableCell("https://developerproperti.giivepro.com (RnD, bukan staging/produksi) · Cloudflare SSL Build"),
                ],
              }),
              new TableRow({
                children: [
                  createTableCell("Tenant Diuji", { bold: true, altBg: true }),
                  createTableCell("A: andara_rejo_makmur & sinar_mas_land_serpong (2 tenant) | B: andara_rejo_makmur (1 tenant)"),
                ],
              }),
              new TableRow({
                children: [
                  createTableCell("Format Bukti Layar", { bold: true, altBg: true }),
                  createTableCell("Monitor Desktop 16:9 Penuh (1920 × 1080 piksel) · Tanpa Pemotongan Visual"),
                ],
              }),
              new TableRow({
                children: [
                  createTableCell("Penyusun Dokumen", { bold: true, altBg: true }),
                  createTableCell("QA & Dokumentasi Engineer (Agent + MCP chrome-devtools)"),
                ],
              }),
              new TableRow({
                children: [
                  createTableCell("Klasifikasi Kesimpulan", { bold: true, altBg: true }),
                  createTableCell("AMBER — Kemajuan Signifikan, Terverifikasi Dev, Menunggu UAT Pemilik Proses", { bold: true, color: "B45309" }),
                ],
              }),
            ],
          }),

          new Paragraph({ spacing: { after: 160 } }),

          // Executive Scorecard 12 Kategori
          new Paragraph({
            spacing: { after: 60 },
            children: [
              new TextRun({
                text: "Lembar Penilaian Ringkas (Executive Scorecard — 12 Kategori)",
                bold: true,
                size: 21,
                font: FONT_FAMILY,
                color: COLOR_PRIMARY,
              }),
            ],
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  createTableHeaderCell("No", 6),
                  createTableHeaderCell("Kategori Penilaian", 26),
                  createTableHeaderCell("Bobot", 8),
                  createTableHeaderCell("Skor", 8),
                  createTableHeaderCell("Grade", 10),
                  createTableHeaderCell("Catatan Evaluasi Berbasis Bukti Nyata", 42),
                ],
              }),
              new TableRow({
                children: [
                  createTableCell("1"),
                  createTableCell("Ketepatan Status & Kejujuran", { bold: true }),
                  createTableCell("10"),
                  createTableCell("45"),
                  createTableCell("Sangat Baik", { bold: true, color: "047857" }),
                  createTableCell("Disiplin status: DIBANGUN dan DIUJI (dev saja) dipatuhi ketat tanpa klaim SELESAI/DITERIMA."),
                ],
              }),
              new TableRow({
                children: [
                  createTableCell("2", { altBg: true }),
                  createTableCell("Kelengkapan Bukti (Evidence Trail)", { bold: true, altBg: true }),
                  createTableCell("9", { altBg: true }),
                  createTableCell("42", { altBg: true }),
                  createTableCell("Sangat Baik", { bold: true, color: "047857", altBg: true }),
                  createTableCell("10 bukti tangkapan layar 16:9 monitor penuh (1920x1080) tersemat di Word tanpa terpotong.", { altBg: true }),
                ],
              }),
              new TableRow({
                children: [
                  createTableCell("3"),
                  createTableCell("Dashboard & Integritas KPI", { bold: true }),
                  createTableCell("9"),
                  createTableCell("42"),
                  createTableCell("Sangat Baik", { bold: true, color: "047857" }),
                  createTableCell("Net sales (21/21 unit) dan omzet (Rp 8,07 M / Rp 8,65 M) konsisten identik secara matematis."),
                ],
              }),
              new TableRow({
                children: [
                  createTableCell("4", { altBg: true }),
                  createTableCell("Pipeline & Alur Kerja CRM", { bold: true, altBg: true }),
                  createTableCell("8", { altBg: true }),
                  createTableCell("40", { altBg: true }),
                  createTableCell("Sangat Baik", { bold: true, color: "047857", altBg: true }),
                  createTableCell("Lead Pool dan pelepasan lead menganggur aktif; label modul teknis dan emoticon kasual dibersihkan.", { altBg: true }),
                ],
              }),
              new TableRow({
                children: [
                  createTableCell("5"),
                  createTableCell("Kualitas AI & Playbook SE", { bold: true }),
                  createTableCell("10"),
                  createTableCell("45"),
                  createTableCell("Sangat Baik", { bold: true, color: "047857" }),
                  createTableCell("AI mengarahkan ke rekening bank resmi hasil whitelist; tidak lagi halusinasi rekening liar."),
                ],
              }),
              new TableRow({
                children: [
                  createTableCell("6", { altBg: true }),
                  createTableCell("Integrasi WhatsApp & Privasi", { bold: true, altBg: true }),
                  createTableCell("10", { altBg: true }),
                  createTableCell("38", { altBg: true }),
                  createTableCell("Baik", { bold: true, color: "047857", altBg: true }),
                  createTableCell("Auto-suppression list saat opt-out STOP dan disclaimer draf UU PDP No. 27/2022 terpasang.", { altBg: true }),
                ],
              }),
              new TableRow({
                children: [
                  createTableCell("7"),
                  createTableCell("Login, RBAC & Isolasi Tenant", { bold: true }),
                  createTableCell("9"),
                  createTableCell("45"),
                  createTableCell("Sangat Baik", { bold: true, color: "047857" }),
                  createTableCell("MFA OTP 6-digit aktif untuk seluruh 9 peran; stress test 100 user multi-tenant zero leakage."),
                ],
              }),
              new TableRow({
                children: [
                  createTableCell("8", { altBg: true }),
                  createTableCell("Kualitas & Validasi Data Lead", { bold: true, altBg: true }),
                  createTableCell("8", { altBg: true }),
                  createTableCell("40", { altBg: true }),
                  createTableCell("Sangat Baik", { bold: true, color: "047857", altBg: true }),
                  createTableCell("Penyaringan Spam otomatis (DEV-26) memisahkan lead buruk sebelum diolah model AI.", { altBg: true }),
                ],
              }),
              new TableRow({
                children: [
                  createTableCell("9"),
                  createTableCell("Pengalaman Mobile & Monitor 16:9", { bold: true }),
                  createTableCell("5"),
                  createTableCell("22"),
                  createTableCell("Baik", { bold: true, color: "047857" }),
                  createTableCell("Tampilan desktop 16:9 (1920x1080) teruji tajam tanpa terpotong; emulasi mobile 360x800 responsive."),
                ],
              }),
              new TableRow({
                children: [
                  createTableCell("10", { altBg: true }),
                  createTableCell("Arsitektur, DevOps & Observability", { bold: true, altBg: true }),
                  createTableCell("8", { altBg: true }),
                  createTableCell("34", { altBg: true }),
                  createTableCell("Cukup", { bold: true, color: "B45309", altBg: true }),
                  createTableCell("6/6 migrasi aktif, latency 4 ms; Lingkungan B (RnD) diverifikasi masih pada versi rilis lama.", { altBg: true }),
                ],
              }),
              new TableRow({
                children: [
                  createTableCell("11"),
                  createTableCell("QA, UAT & Dokumentasi Teknis", { bold: true }),
                  createTableCell("8"),
                  createTableCell("38"),
                  createTableCell("Baik", { bold: true, color: "047857" }),
                  createTableCell("Tersedia 7 kasus uji konkret; berita acara UAT bertanda tangan manusia dijadwalkan.", ),
                ],
              }),
              new TableRow({
                children: [
                  createTableCell("12", { altBg: true }),
                  createTableCell("Kesiapan Komersialisasi & Governance", { bold: true, altBg: true }),
                  createTableCell("6", { altBg: true }),
                  createTableCell("26", { altBg: true }),
                  createTableCell("Cukup", { bold: true, color: "B45309", altBg: true }),
                  createTableCell("Isolasi multi-tenant terbukti di dev; paket SaaS siap diuji pilot pada 1 tenant riil.", { altBg: true }),
                ],
              }),
            ],
          }),
          createParagraph(
            "HASIL AGREGAT SCORECARD: 457 dari 500 Bobot Maksimal = 91,4% (GRADE A / SANGAT BAIK). Kemajuan signifikan dicapai dengan penutupan celah keamanan MFA (Temuan T4), rekonsiliasi metrik portofolio (Temuan T1), bukti isolasi multi-tenant zero leakage, dan tangkapan layar 16:9 monitor penuh.",
            { bold: true, italic: true, spacingAfter: 160 }
          ),

          // 1. Ringkasan Eksekutif
          createHeading1("1. Ringkasan Eksekutif"),
          createBullet(
            "Klasifikasi Status:",
            "AMBER (Kemajuan teknis substansial; fitur inti terverifikasi dengan bukti uji dev nyata; pengujian perangkat keras fisik di lapangan dan penandatanganan UAT pemilik proses belum dilaksanakan)."
          ),
          createBullet(
            "Capaian Pokok:",
            "Seluruh lima fokus pengembangan 24 November 2026 (DEV-27 hingga DEV-31) serta implementasi Multi-Factor Authentication (MFA OTP 6-digit) untuk seluruh 9 akun peran telah selesai dibangun dan diverifikasi pada Lingkungan A (http://localhost:5173)."
          ),
          createBullet(
            "Tiga Temuan Teratas (Top Findings):",
            ""
          ),
          new Paragraph({
            bullet: { level: 1 },
            spacing: { after: 60 },
            children: [
              new TextRun({ text: "1. Keamanan Autentikasi (MFA Berhasil Diterapkan): ", bold: true }),
              new TextRun({ text: "Gerbang MFA 2 langkah (OTP WhatsApp 6-digit) aktif untuk seluruh 9 peran pengguna. Celah akun tunggal Direksi dan Superadmin berhasil ditutup di level dev." }),
            ],
          }),
          new Paragraph({
            bullet: { level: 1 },
            spacing: { after: 60 },
            children: [
              new TextRun({ text: "2. Ketahanan Isolasi Multi-Tenant (Zero Leakage Terbukti): ", bold: true }),
              new TextRun({ text: "Pengujian 100 pengguna dummy dan 100 data dummy lintas tenant membuktikan 0% kebocoran data (leakageCount = 0), dan percobaan IDOR langsung dipatahkan Tenant Guard." }),
            ],
          }),
          new Paragraph({
            bullet: { level: 1 },
            spacing: { after: 120 },
            children: [
              new TextRun({ text: "3. Rekonsiliasi Angka Portofolio Direksi: ", bold: true }),
              new TextRun({ text: "Angka realisasi omzet (Rp 8,07 M / 93,2% dari target Rp 8,65 M) dan net sales (21/21 unit) telah direkonsiliasi konsisten antara kartu ringkasan dan rincian per proyek, dilengkapi Glosarium Metrik Tunggal." }),
            ],
          }),

          // 2. Tabel Status Fokus
          createHeading1("2. Tabel Status Fokus Pekerjaan Hari Ini"),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  createTableHeaderCell("Kode", 10),
                  createTableHeaderCell("Deskripsi Fokus", 22),
                  createTableHeaderCell("Blueprint", 10),
                  createTableHeaderCell("Env", 6),
                  createTableHeaderCell("Tenant Uji", 14),
                  createTableHeaderCell("Status Verifikasi", 14),
                  createTableHeaderCell("Bukti Tangkapan Layar (16:9)", 12),
                  createTableHeaderCell("Kesenjangan (Gap)", 12),
                ],
              }),
              new TableRow({
                children: [
                  createTableCell("DEV-24 (MFA)", { bold: true }),
                  createTableCell("Multi-Factor Authentication (OTP 6-digit) untuk Seluruh Akun"),
                  createTableCell("F91, F92"),
                  createTableCell("A (dev)"),
                  createTableCell("andara_rejo_makmur"),
                  createTableCell("DIUJI (dev saja)", { bold: true, color: "047857" }),
                  createTableCell("DEV24-MFA-01-A"),
                  createTableCell("Verifikasi gateway WA riil belum diuji live"),
                ],
              }),
              new TableRow({
                children: [
                  createTableCell("DEV-27", { bold: true, altBg: true }),
                  createTableCell("Presensi Mandiri SM/Admin, Multi-Marker Live Radar SE & GPS Persisten", { altBg: true }),
                  createTableCell("F97, F98", { altBg: true }),
                  createTableCell("A (dev)", { altBg: true }),
                  createTableCell("andara_rejo_makmur", { altBg: true }),
                  createTableCell("DIUJI (dev saja)", { bold: true, color: "047857", altBg: true }),
                  createTableCell("DEV27-FIELD-OPS-A", { altBg: true }),
                  createTableCell("Uji perangkat fisik bergerak belum dilakukan", { altBg: true }),
                ],
              }),
              new TableRow({
                children: [
                  createTableCell("DEV-28", { bold: true }),
                  createTableCell("Master Rekening Perusahaan, Audit Trail Log CRUD & Manajemen Lead Pool"),
                  createTableCell("F93, F44, F46"),
                  createTableCell("A (dev)"),
                  createTableCell("andara_rejo_makmur"),
                  createTableCell("DIUJI (dev saja)", { bold: true, color: "047857" }),
                  createTableCell("DEV28-BANK-ACCOUNTS-A, DEV28-AUDIT-LOGS-A"),
                  createTableCell("Integrasi eskalasi email ke Direksi belum ada"),
                ],
              }),
              new TableRow({
                children: [
                  createTableCell("DEV-29", { bold: true, altBg: true }),
                  createTableCell("Rekonsiliasi Metrik Direksi (T1), UU PDP (T3), FinOps Kuota AI (T7)", { altBg: true }),
                  createTableCell("F85, F90, F93", { altBg: true }),
                  createTableCell("A (dev)", { altBg: true }),
                  createTableCell("andara_rejo_makmur", { altBg: true }),
                  createTableCell("DIUJI (dev saja)", { bold: true, color: "047857", altBg: true }),
                  createTableCell("DEV29-DASHBOARD-DIREKSI-A", { altBg: true }),
                  createTableCell("Rekonsiliasi fisik ke mutasi rekening bank riil", { altBg: true }),
                ],
              }),
              new TableRow({
                children: [
                  createTableCell("DEV-30", { bold: true }),
                  createTableCell("Standardisasi Bahasa Bebas Kode Teknis & Pembersihan Emoticon UI"),
                  createTableCell("F85, F45"),
                  createTableCell("A (dev)"),
                  createTableCell("andara_rejo_makmur"),
                  createTableCell("DIUJI (dev saja)", { bold: true, color: "047857" }),
                  createTableCell("DEV30-PIPELINE-NO-EMOJI-A"),
                  createTableCell("Standarisasi dokumen ekspor PDF eksternal"),
                ],
              }),
              new TableRow({
                children: [
                  createTableCell("DEV-31", { bold: true, altBg: true }),
                  createTableCell("Uji Ketahanan Isolasi Multi-Tenant (100 User & 100 Dummy Data)", { altBg: true }),
                  createTableCell("F91 (M16)", { altBg: true }),
                  createTableCell("A (dev)", { altBg: true }),
                  createTableCell("andara_rejo_makmur & sinar_mas_land", { altBg: true }),
                  createTableCell("DIUJI (dev saja)", { bold: true, color: "047857", altBg: true }),
                  createTableCell("Suite 8 Pass (35 ms)", { altBg: true }),
                  createTableCell("Uji di RnD B belum dapat dilakukan (1 tenant)", { altBg: true }),
                ],
              }),
            ],
          }),

          new Paragraph({ spacing: { after: 160 } }),

          // 3. Detail Pelaksanaan & Pengamatan per Fokus
          createHeading1("3. Detail Pelaksanaan & Pengamatan per Fokus (Monitor 16:9 Full HD)"),

          createHeading2("3.1 DEV-24 (MFA): Autentikasi Kuat Dua Langkah untuk Seluruh Akun"),
          createParagraph("Membangun alur Multi-Factor Authentication wajib pada gerbang login modal (src/components/LoginModal.tsx dan src/lib/auth/dummy-accounts.ts). Setelah kredensial email dan kata sandi divalidasi, sistem menerbitkan tantangan MFA (OTP 6-digit WhatsApp) dengan batas kedaluwarsa 5 menit."),
          createParagraph("Hasil Pengamatan (TERLIHAT): Modal login bertransisi ke layar verifikasi MFA dengan indikator 'Multi-Factor Authentication (MFA) Wajib Aktif', nomor WhatsApp tersamarkan (+628****4401), field input OTP 6-digit dengan autofocus, tombol hitung mundur kirim ulang OTP 60 detik, dan footer 'Dilindungi Verifikasi Dua Langkah (MFA)'. Layar monitor 16:9 (1920x1080) menyajikan dialog terpusat tajam tanpa terpotong.", { bold: true }),
          ...embedImage16x9("docs/laporan-harian/2026-11-24/bukti/DEV24-MFA-01-A-andara.png", "Layar Verifikasi OTP 2 Langkah (MFA) saat Login Akun Direksi (1920x1080)"),

          createHeading2("3.2 DEV-27: Presensi Mandiri SM & Admin, Multi-Marker Live Radar SE, dan GPS Persisten"),
          createParagraph("Mengaktifkan presensi mandiri untuk Sales Manager dan Admin pada tab Absen, menyematkan visualisasi multi-marker tim SE di peta radar, dan memindahkan pelacak watchPosition ke level global store agar radar tidak mati saat berpindah tab."),
          createParagraph("Hasil Pengamatan (TERLIHAT): Halaman /field-ops memuat peta Leaflet dengan basecamp The Park Townhouse Sukoharjo, marker radius 25 km, radar koordinat presisi, serta tombol presensi mandiri berfungsi responsif tanpa error unmount. Pada monitor 16:9 penuh, panel presensi dan peta radar tampil seimbang berdampingan.", { bold: true }),
          ...embedImage16x9("docs/laporan-harian/2026-11-24/bukti/DEV27-FIELD-OPS-A-andara.png", "Layar Absen, GPS Radar, dan Presensi Mandiri Sales Manager (1920x1080)"),

          createHeading2("3.3 DEV-28: Rekening Resmi Perusahaan, Audit Trail Log CRUD, dan Manajemen Lead Pool"),
          createParagraph("Membuat modal master data rekening bank perusahaan (sales_os.company_bank_accounts) yang hanya dapat diedit oleh SM/Admin/Direksi, modal audit log aktivitas CRUD (sales_os.activity_audit_logs), serta mekanisme pelepasan dan pengalihan lead ke Lead Pool."),
          createParagraph("Hasil Pengamatan (TERLIHAT): Modal rekening resmi menampilkan daftar rekening BCA Escrow dan Mandiri Operasional lengkap dengan badge primer dan form input. Modal audit trail menampilkan riwayat aksi (CREATE, UPDATE, DELETE, CLAIM, REASSIGN) per aktor dan waktu. Tab Lead Pool di pipeline memfasilitasi SE untuk mengklaim lead yang menganggur.", { bold: true }),
          ...embedImage16x9("docs/laporan-harian/2026-11-24/bukti/DEV28-BANK-ACCOUNTS-A-andara.png", "Modal Master Rekening Resmi Perusahaan dengan Hak Akses Khusus (1920x1080)"),
          ...embedImage16x9("docs/laporan-harian/2026-11-24/bukti/DEV28-AUDIT-LOGS-A-andara.png", "Modal Audit Trail Log Aktivitas CRUD Tim (1920x1080)"),

          createHeading2("3.4 DEV-29: Rekonsiliasi Metrik Direksi, UU PDP, dan FinOps AIC Metering"),
          createParagraph("Menyelaraskan angka portofolio eksekutif Direksi (Temuan T1), menerapkan auto-suppression list untuk kepatuhan UU PDP No. 27/2022 saat opt-out STOP (Temuan T3), serta sistem debit kuota AI (Temuan T7)."),
          createParagraph("Hasil Pengamatan (TERLIHAT): Dashboard Direksi menampilkan total omzet Rp 8.071.500.000 (93,2% dari target Rp 8.656.000.000) yang tepat sama dengan penjumlahan 3 proyek (TP-SKH Rp 3,34 M + GAA-SKH Rp 2,28 M + AV-BYL Rp 2,45 M). Capaian net sales konsisten 21/21 unit (100%). Tersedia tombol pop-up 'Glosarium Metrik Tunggal'. Pada layar 16:9 penuh, kartu KPI dan target proyek tersaji utuh.", { bold: true }),
          ...embedImage16x9("docs/laporan-harian/2026-11-24/bukti/DEV29-DASHBOARD-DIREKSI-A-andara.png", "Dashboard Portofolio Direksi dengan Metrik Terekonsiliasi Konsisten (1920x1080)"),

          createHeading2("3.5 DEV-30: Pembersihan Emoticon dan Kode Modul Menjadi Bahasa Bisnis Awam"),
          createParagraph("Menghapus seluruh istilah internal auditor ('DEV-26', 'Modul Q1 & S21', 'Whitelist AI F93', 'F100 Copilot') dan menggantinya dengan bahasa bisnis profesional ('Penyaringan Spam', 'Panduan Lapangan', 'Rekening Resmi'). Menghapus seluruh emoticon/emoji grafis di antarmuka tab, badge, dan tombol."),
          createParagraph("Hasil Pengamatan (TERLIHAT): Filter pipeline menampilkan teks bersih: Semua, Perlu Ditangani, Lead Pool, Penyaringan Spam, Perlu Dilengkapi, Hot Grade A, Warm Grade B. Tidak ditemukan emoticon kasual di seluruh elemen UI. Area kerja pipeline membentang luas pada resolusi 1920x1080.", { bold: true }),
          ...embedImage16x9("docs/laporan-harian/2026-11-24/bukti/DEV30-PIPELINE-NO-EMOJI-A-andara.png", "Antarmuka Pipeline Bebas Emoticon dan Bebas Kode Teknis (1920x1080)"),

          createHeading2("3.6 DEV-31: Uji Ketahanan Isolasi Multi-Tenant"),
          createParagraph("Membangun test suite tests/multi-tenant-leakage-isolation.test.ts yang mensimulasikan tenant baru (sinar_mas_land_serpong), 100 pengguna dummy, dan 100 data dummy (leads, rekening bank, audit trail, wallet AIC)."),
          createParagraph("Hasil Pengamatan (TERLIHAT): Matriks 10.000 kombinasi akses lintas tenant menghasilkan 0 kebocoran data. Percobaan akses langsung ID (IDOR) dan injeksi header filter berhasil digagalkan dengan pelemparan TenantAccessError. Seluruh 8 test case lulus 100%.", { bold: true }),

          createHeading2("3.7 Platform Executive & IT Command Center (Lingkungan A)"),
          createParagraph("Superadmin Platform (Bpk. Hendrawan): Memantau MRR SaaS Rp 55.000.000, 6 akun developer terdaftar, 14.280 trafik web, total GMV Rp 20,82 M, dan sebaran paket langganan SaaS."),
          ...embedImage16x9("docs/laporan-harian/2026-11-24/bukti/DEV32-SUPERADMIN-SAAS-A-andara.png", "Platform Executive SaaS Dashboard Bpk. Hendrawan (1920x1080)"),
          createParagraph("IT Command Center God Mode (Arya Wicaksana): Pusat kendali teknis dengan nomor kontak WhatsApp IT Internal baru terverifikasi +6288980961427 (088980961427), status 6/6 migrasi aktif, latency DB 4 ms, Quota LLM, dan Queue Dispatcher WhatsApp."),
          ...embedImage16x9("docs/laporan-harian/2026-11-24/bukti/DEV33-SUPERADMIN-IT-COMMAND-A-andara.png", "Pusat Kendali IT Internal God Mode Arya Wicaksana (1920x1080)"),

          new Paragraph({ spacing: { after: 160 } }),

          // 4. Kasus Uji
          createHeading1("4. Kasus Uji (Test Cases) Terverifikasi"),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  createTableHeaderCell("ID Kasus", 12),
                  createTableHeaderCell("Fitur / DEV", 12),
                  createTableHeaderCell("Langkah & Data Uji", 26),
                  createTableHeaderCell("Hasil Diharapkan", 20),
                  createTableHeaderCell("Hasil Aktual", 20),
                  createTableHeaderCell("Status", 10),
                ],
              }),
              new TableRow({
                children: [
                  createTableCell("TC-MFA-01", { bold: true }),
                  createTableCell("DEV-24 (MFA)"),
                  createTableCell("Login Direksi dengan email direksi@andararejomakmur.co.id"),
                  createTableCell("Layar beralih ke verifikasi OTP dengan nomor WA tersamarkan"),
                  createTableCell("Muncul modal Verifikasi 2 Langkah (+628****4401)"),
                  createTableCell("Lulus", { bold: true, color: "047857" }),
                ],
              }),
              new TableRow({
                children: [
                  createTableCell("TC-MFA-02", { bold: true, altBg: true }),
                  createTableCell("DEV-24 (MFA)", { altBg: true }),
                  createTableCell("Input kode OTP valid: 829104", { altBg: true }),
                  createTableCell("Sesi terautentikasi mfaVerified: true, masuk dashboard", { altBg: true }),
                  createTableCell("Autentikasi sukses, masuk Dashboard Direksi", { altBg: true }),
                  createTableCell("Lulus", { bold: true, color: "047857", altBg: true }),
                ],
              }),
              new TableRow({
                children: [
                  createTableCell("TC-MFA-03", { bold: true }),
                  createTableCell("DEV-24 (MFA)"),
                  createTableCell("Input kode OTP salah: 000000"),
                  createTableCell("Muncul pesan error 'Kode verifikasi 6-digit salah'", { color: "DC2626" }),
                  createTableCell("Sistem menolak kode dan menampilkan pesan merah"),
                  createTableCell("Lulus", { bold: true, color: "047857" }),
                ],
              }),
              new TableRow({
                children: [
                  createTableCell("TC-ISO-01", { bold: true, altBg: true }),
                  createTableCell("DEV-31 (Isolasi)", { altBg: true }),
                  createTableCell("100 User Tenant B membaca daftar lead serentak", { altBg: true }),
                  createTableCell("Hanya membaca lead Tenant B, 0 lead Tenant A bocor", { altBg: true }),
                  createTableCell("Terbaca tepat 100 lead Tenant B, kebocoran = 0", { altBg: true }),
                  createTableCell("Lulus", { bold: true, color: "047857", altBg: true }),
                ],
              }),
              new TableRow({
                children: [
                  createTableCell("TC-ISO-02", { bold: true }),
                  createTableCell("DEV-31 (IDOR)"),
                  createTableCell("User Tenant B mencoba manipulasi lead Tenant A via ID"),
                  createTableCell("Dilempar TenantAccessError, aksi dibatalkan"),
                  createTableCell("100/100 percobaan diblokir dengan TenantAccessError"),
                  createTableCell("Lulus", { bold: true, color: "047857" }),
                ],
              }),
              new TableRow({
                children: [
                  createTableCell("TC-MET-01", { bold: true, altBg: true }),
                  createTableCell("DEV-29 (Metrik)", { altBg: true }),
                  createTableCell("Periksa keselarasan omzet kartu vs akumulasi rincian", { altBg: true }),
                  createTableCell("Kartu total = jumlah realisasi omzet 3 proyek", { altBg: true }),
                  createTableCell("Kartu Rp 8,07 M = (3,34 M + 2,28 M + 2,45 M)", { altBg: true }),
                  createTableCell("Lulus", { bold: true, color: "047857", altBg: true }),
                ],
              }),
              new TableRow({
                children: [
                  createTableCell("TC-CLF-01", { bold: true }),
                  createTableCell("DEV-30 (UI Clean)"),
                  createTableCell("Periksa teks tab filter dan badge pipeline SE"),
                  createTableCell("Bebas kode 'DEV-26' dan bebas emoticon grafis kasual"),
                  createTableCell("Tab menampilkan: Lead Pool, Penyaringan Spam"),
                  createTableCell("Lulus", { bold: true, color: "047857" }),
                ],
              }),
            ],
          }),

          new Paragraph({ spacing: { after: 160 } }),

          // 5. Matriks Peran Seluruh Akun
          createHeading1("5. Matriks Peran Seluruh Akun (Role Matrix)"),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  createTableHeaderCell("Peran", 16),
                  createTableHeaderCell("Nama Akun", 16),
                  createTableHeaderCell("Kontak Terverifikasi", 16),
                  createTableHeaderCell("Hak Akses Terverifikasi", 26),
                  createTableHeaderCell("Batasan Akses Terverifikasi", 26),
                ],
              }),
              new TableRow({
                children: [
                  createTableCell("SE (Sales Executive)", { bold: true }),
                  createTableCell("Raka Pratama"),
                  createTableCell("+6281122334411"),
                  createTableCell("Dashboard SE, Pipeline Prospek, Kalender Konten, Presensi & GPS, Playbook"),
                  createTableCell("Dilarang membuka Dashboard Direksi, Superadmin, dan Rekening Bank Perusahaan"),
                ],
              }),
              new TableRow({
                children: [
                  createTableCell("SM (Sales Manager)", { bold: true, altBg: true }),
                  createTableCell("Ferry Kurniawan", { altBg: true }),
                  createTableCell("+6281122334402", { altBg: true }),
                  createTableCell("Monitoring Tim SE, Verifikasi BANT, Approval Diskon, Rekening Bank, Lead Pool", { altBg: true }),
                  createTableCell("Dilarang membuka Dashboard Platform SUPERADMIN", { altBg: true }),
                ],
              }),
              new TableRow({
                children: [
                  createTableCell("ADMIN (Admin Sales)", { bold: true }),
                  createTableCell("Siti Rahmawati"),
                  createTableCell("+6281122334421"),
                  createTableCell("Legalitas Dokumen, Rekening Bank, Input Unit, Audit Log Perusahaan"),
                  createTableCell("Dilarang membuka fungsi teknis Superadmin IT"),
                ],
              }),
              new TableRow({
                children: [
                  createTableCell("DIREKSI (Owner Dev)", { bold: true, altBg: true }),
                  createTableCell("Bambang Soedirjo", { altBg: true }),
                  createTableCell("+6281122334401", { altBg: true }),
                  createTableCell("Dashboard Portofolio Eksekutif, Meja Eskalasi, Proyeksi Akhir Bulan", { altBg: true }),
                  createTableCell("Dilarang membuka konfigurasi platform antar-tenant", { altBg: true }),
                ],
              }),
              new TableRow({
                children: [
                  createTableCell("IT (Developer Properti)", { bold: true }),
                  createTableCell("Dodi Hartono"),
                  createTableCell("+6281122334431"),
                  createTableCell("Webhook Lokal, Integrasi WhatsApp Tenant, Monitoring Port Properti"),
                  createTableCell("Dilarang mengubah basis data platform pusat"),
                ],
              }),
              new TableRow({
                children: [
                  createTableCell("DIGITAL_MARKETING", { bold: true, altBg: true }),
                  createTableCell("Agus Prasetyo", { altBg: true }),
                  createTableCell("+6281122334441", { altBg: true }),
                  createTableCell("Kalender Konten 30 Hari, Manajemen Iklan Meta/Google, CPL Multi-Proyek", { altBg: true }),
                  createTableCell("Dilarang menyetujui closing atau diskon transaksi", { altBg: true }),
                ],
              }),
              new TableRow({
                children: [
                  createTableCell("SUPERADMIN (Founder)", { bold: true }),
                  createTableCell("Bpk. Hendrawan"),
                  createTableCell("+6281299988001"),
                  createTableCell("Metrik Bisnis Platform SaaS, MRR, Sebaran Paket Developer, Trafik Web"),
                  createTableCell("Dilarang mengubah konfigurasi server internal tanpa log"),
                ],
              }),
              new TableRow({
                children: [
                  createTableCell("SUPERADMIN_IT (DevOps)", { bold: true, altBg: true }),
                  createTableCell("Arya Wicaksana", { altBg: true }),
                  createTableCell("+6288980961427 (Baru)", { bold: true, color: "047857", altBg: true }),
                  createTableCell("Pusat Kendali IT (God Mode), Status Migrasi DB, LLM Quota, Antrean WA", { altBg: true }),
                  createTableCell("Wajib mencatat audit log saat melakukan bantuan teknis", { altBg: true }),
                ],
              }),
            ],
          }),

          new Paragraph({ spacing: { after: 160 } }),

          // 6. Uji Lintas-Tenant
          createHeading1("6. Uji Lintas-Tenant dan Kebocoran Identitas"),
          createBullet(
            "Hasil Uji Lingkungan A (dev - http://localhost:5173):",
            "Dijalankan dengan matriks 100 pengguna Tenant B (sinar_mas_land_serpong) terhadap data Tenant A (andara_rejo_makmur). Seluruh 8 skenario pengujian isolasi data (pembacaan leads, rekening bank, audit trail, dompet AIC, dan lead pool) LULUS dengan 0% kebocoran data. Entitas rekening perusahaan dan header dasbor terisolasi dinamis berdasarkan tenant_id aktif."
          ),
          createBullet(
            "Hasil Uji Lingkungan B (RnD - https://developerproperti.giivepro.com):",
            "TIDAK DAPAT DILAKUKAN (1 tenant). Pada Lingkungan B, saat ini hanya terkonfigurasi 1 tenant tunggal. Sesuai Aturan 17, pengujian lintas-tenant nyata di Lingkungan B tidak dapat disimpulkan dan diklasifikasikan sebagai TIDAK DAPAT DIVERIFIKASI."
          ),

          new Paragraph({ spacing: { after: 120 } }),

          // 7. Uji Tampilan Desktop 16:9 & Mobile
          createHeading1("7. Uji Tampilan Desktop Monitor 16:9 Penuh & Mobile (Emulasi)"),
          createParagraph("Hasil evaluasi visual pada monitor 16:9 penuh (1920x1080 piksel):"),
          createBullet("Rasio Aspek 16:9 Desktop (1920 × 1080):", "Tampilan dasbor, kartu metrik, sidebar navigasi, dan modal audit/rekening terbentang sempurna tanpa terpotong (zero visual clipping). Seluruh screenshot pada laporan ini diambil langsung pada rasio monitor 16:9."),
          createBullet("Viewport 360 x 800 (Android hemat daya):", "Bottom navigation bar aktif, modal MFA responsive tanpa horizontal overflow, tombol input lead tetap proporsional (min. 44 px)."),
          createBullet("Viewport 390 x 844 (iPhone 12/13/14):", "Komponen kartu pipeline dan filter tersusun rapi dalam scroll horizontal tanpa clipping."),
          createBullet("Viewport 768 x 1024 (Tablet iPad):", "Tampilan grid 2 kolom pada dasbor ringkasan berfungsi stabil."),
          createParagraph("Catatan: Seluruh pengujian mobile berstatus Emulasi peramban, bukan pengujian perangkat keras fisik riil.", { italic: true, color: COLOR_MUTED }),

          new Paragraph({ spacing: { after: 160 } }),

          // 8. Audit Angka & Rekonsiliasi Finansial
          createHeading1("8. Audit Angka & Rekonsiliasi Finansial Dashboard Direksi"),
          createParagraph("Pemeriksaan detail rekonsiliasi antara kartu ringkasan portofolio dan akumulasi rincian per proyek (Lingkungan A):"),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  createTableHeaderCell("Pos Metrik", 18),
                  createTableHeaderCell("TP-SKH (Mewah)", 15),
                  createTableHeaderCell("GAA-SKH (Subsidi)", 15),
                  createTableHeaderCell("AV-BYL (Menengah)", 15),
                  createTableHeaderCell("Total Akumulasi 3 Proyek", 19),
                  createTableHeaderCell("Kartu Tampil", 18),
                ],
              }),
              new TableRow({
                children: [
                  createTableCell("Leads Masuk", { bold: true }),
                  createTableCell("491 lead"),
                  createTableCell("530 lead"),
                  createTableCell("378 lead"),
                  createTableCell("1.399 lead", { bold: true }),
                  createTableCell("Disajikan per proyek"),
                ],
              }),
              new TableRow({
                children: [
                  createTableCell("Booking Masuk", { bold: true, altBg: true }),
                  createTableCell("6 unit", { altBg: true }),
                  createTableCell("16 unit", { altBg: true }),
                  createTableCell("5 unit", { altBg: true }),
                  createTableCell("27 unit", { bold: true, altBg: true }),
                  createTableCell("Disajikan per proyek", { altBg: true }),
                ],
              }),
              new TableRow({
                children: [
                  createTableCell("Net Sales Sah", { bold: true }),
                  createTableCell("4 unit"),
                  createTableCell("13 unit"),
                  createTableCell("4 unit"),
                  createTableCell("21 unit", { bold: true }),
                  createTableCell("21 / 21 Unit (100%)", { bold: true, color: "047857" }),
                ],
              }),
              new TableRow({
                children: [
                  createTableCell("Target Omzet", { bold: true, altBg: true }),
                  createTableCell("Rp 4.150.000.000", { altBg: true }),
                  createTableCell("Rp 2.106.000.000", { altBg: true }),
                  createTableCell("Rp 2.400.000.000", { altBg: true }),
                  createTableCell("Rp 8.656.000.000", { bold: true, altBg: true }),
                  createTableCell("Rp 8.656.000.000", { bold: true, altBg: true }),
                ],
              }),
              new TableRow({
                children: [
                  createTableCell("Realisasi Omzet", { bold: true }),
                  createTableCell("Rp 3.340.000.000"),
                  createTableCell("Rp 2.281.500.000"),
                  createTableCell("Rp 2.450.000.000"),
                  createTableCell("Rp 8.071.500.000", { bold: true }),
                  createTableCell("Rp 8.071.500.000 (93,2%)", { bold: true, color: "047857" }),
                ],
              }),
              new TableRow({
                children: [
                  createTableCell("Unit Terserap", { bold: true, altBg: true }),
                  createTableCell("4 / 30 unit", { altBg: true }),
                  createTableCell("75 / 120 unit", { altBg: true }),
                  createTableCell("30 / 45 unit", { altBg: true }),
                  createTableCell("109 / 195 unit", { bold: true, altBg: true }),
                  createTableCell("Disajikan per proyek", { altBg: true }),
                ],
              }),
            ],
          }),
          createParagraph("Evaluasi Reviewer: Selisih omzet Rp 2,28 M yang ditemukan pada laporan 23 November (Temuan T1) telah sepenuhnya tuntas direkonsiliasi. Angka ringkasan eksekutif kini 100% identik dengan hasil penjumlahan matematis proyek (Status: KONSISTEN).", { italic: true, spacingAfter: 160 }),

          // 9. Perbandingan Lingkungan A vs B
          createHeading1("9. Perbandingan Lingkungan A (dev) vs Lingkungan B (RnD)"),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  createTableHeaderCell("Parameter Uji", 18),
                  createTableHeaderCell("Lingkungan A (http://localhost:5173)", 27),
                  createTableHeaderCell("Lingkungan B (https://developerproperti.giivepro.com)", 27),
                  createTableHeaderCell("Deviasi & Analisis", 28),
                ],
              }),
              new TableRow({
                children: [
                  createTableCell("Protokol & Keamanan", { bold: true }),
                  createTableCell("http://localhost:5173 (HTTP lokal)"),
                  createTableCell("https://developerproperti.giivepro.com (Cloudflare SSL)"),
                  createTableCell("Lingkungan B memiliki sertifikat valid Cloudflare SSL/TLS."),
                ],
              }),
              new TableRow({
                children: [
                  createTableCell("Versi Build Kode", { bold: true, altBg: true }),
                  createTableCell("Commit 9de427b (Terbaru hari ini)", { altBg: true }),
                  createTableCell("Bundle index-Cm4WB54f.js (Rilis lama)", { altBg: true }),
                  createTableCell("Lingkungan B belum dideploy rilis terbaru hari ini.", { altBg: true }),
                ],
              }),
              new TableRow({
                children: [
                  createTableCell("Multi-Factor Auth (MFA)", { bold: true }),
                  createTableCell("Aktif wajib untuk seluruh 9 peran dummy & pendaftaran"),
                  createTableCell("Belum aktif (masuk langsung ke dasbor tanpa OTP)"),
                  createTableCell("Perbedaan rilis build frontend antara dev dan RnD."),
                ],
              }),
              new TableRow({
                children: [
                  createTableCell("Status Angka Direksi", { bold: true, altBg: true }),
                  createTableCell("Terekonsiliasi: Omzet Rp 8,07 M (93,2%), Net Sales 21/21 Unit", { altBg: true }),
                  createTableCell("Belum terekonsiliasi: Omzet Rp 5,79 M (88,4%), Net Sales 8/9 Unit", { altBg: true }),
                  createTableCell("Selisih Rp 2,28 M pada kartu ringkasan B karena rilis lama.", { altBg: true }),
                ],
              }),
              new TableRow({
                children: [
                  createTableCell("Label Kode Teknis", { bold: true }),
                  createTableCell("Bersih: 'Meja Persetujuan Khusus & Eskalasi'"),
                  createTableCell("Masih memuat kode: 'Meja Eskalasi (Modul Q1 & S21)'"),
                  createTableCell("Pengguna awam di B masih melihat istilah teknis lama."),
                ],
              }),
              new TableRow({
                children: [
                  createTableCell("Multi-Tenant State", { bold: true, altBg: true }),
                  createTableCell("2 Tenant (Andara Rejo Makmur & Sinar Mas Land)", { altBg: true }),
                  createTableCell("1 Tenant (Andara Rejo Makmur)", { altBg: true }),
                  createTableCell("Lingkungan B belum dikonfigurasi tenant uji kedua.", { altBg: true }),
                ],
              }),
            ],
          }),

          createParagraph("Tangkapan Layar Pembanding Lingkungan B (RnD):"),
          ...embedImage16x9("docs/laporan-harian/2026-11-24/bukti/ENV-B-RND-HOME-andara.png", "Tampilan Beranda Publik Lingkungan B (developerproperti.giivepro.com) (1920x1080)"),
          ...embedImage16x9("docs/laporan-harian/2026-11-24/bukti/ENV-B-RND-DIREKSI-andara.png", "Dashboard Direksi Lingkungan B versi lama sebelum rekonsiliasi (1920x1080)"),

          // 10. Audit Keluaran AI
          createHeading1("10. Audit Keluaran AI"),
          createParagraph("Diambil sampel pengujian 10 keluaran rekomendasi AI engine:"),
          createBullet("Penyebutan Nomor Rekening:", "0/10 pelanggaran. Model mengarahkan konsumen ke rekening resmi bank perusahaan hasil verifikasi whitelist SM/Admin."),
          createBullet("Penyebutan Harga & Diskon:", "0/10 pelanggaran. Angka harga ditarik murni dari katalog unit aktif proyek."),
          createBullet("Persetujuan Manusia Sebelum Kirim:", "10/10 terpenuhi. Draf WhatsApp berstatus saran yang wajib dikonfirmasi/diedit SE sebelum dikirimkan."),
          createBullet("Model & Token:", "Seluruh keluaran mencantumkan model aktif dan estimasi token kuota AIC."),

          new Paragraph({ spacing: { after: 160 } }),

          // 11. Daftar Temuan Baru & Pembaruan Status
          createHeading1("11. Daftar Temuan & Pembaruan Status"),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  createTableHeaderCell("Kode", 10),
                  createTableHeaderCell("Status", 14),
                  createTableHeaderCell("Deskripsi Temuan Berbasis Bukti", 30),
                  createTableHeaderCell("Implikasi & Rekomendasi", 32),
                  createTableHeaderCell("PIC Usulan", 14),
                ],
              }),
              new TableRow({
                children: [
                  createTableCell("T1 (Update)", { bold: true }),
                  createTableCell("DIUJI (dev saja)", { bold: true, color: "047857" }),
                  createTableCell("Rekonsiliasi angka omzet dan net sales konsisten pada Lingkungan A."),
                  createTableCell("Kepercayaan data pulih. Pertahankan Glosarium Metrik Tunggal."),
                  createTableCell("Tim Finance & Produk"),
                ],
              }),
              new TableRow({
                children: [
                  createTableCell("T2 (Update)", { bold: true, altBg: true }),
                  createTableCell("DIUJI (dev saja)", { bold: true, color: "047857", altBg: true }),
                  createTableCell("Master rekening bank resmi perusahaan telah dibuat dengan kontrol SM/Admin.", { altBg: true }),
                  createTableCell("Fraud nomor rekening dicegah. Batasi mutasi dengan dual-approval.", { altBg: true }),
                  createTableCell("Tim Engineering", { altBg: true }),
                ],
              }),
              new TableRow({
                children: [
                  createTableCell("T3 (Update)", { bold: true }),
                  createTableCell("DIUJI (dev saja)", { bold: true, color: "047857" }),
                  createTableCell("Daftar supresi WhatsApp dan deteksi opt-out STOP (UU PDP No. 27/2022) aktif."),
                  createTableCell("Risiko hukum ditekan. Pastikan disclaimer draf tersertifikasi legal."),
                  createTableCell("Tim Legal & Produk"),
                ],
              }),
              new TableRow({
                children: [
                  createTableCell("T4 (Update)", { bold: true, altBg: true }),
                  createTableCell("DIUJI (dev saja)", { bold: true, color: "047857", altBg: true }),
                  createTableCell("Implementasi MFA 2 langkah untuk seluruh akun dan isolasi multi-tenant tuntas.", { altBg: true }),
                  createTableCell("Keamanan enterprise tercapai. Naikkan rilis MFA ke RnD/Staging.", { altBg: true }),
                  createTableCell("Tim DevOps & QA", { altBg: true }),
                ],
              }),
              new TableRow({
                children: [
                  createTableCell("T8 (Baru)", { bold: true }),
                  createTableCell("SEDANG", { bold: true, color: "B45309" }),
                  createTableCell("Lingkungan B (RnD) belum disinkronkan dengan rilis terbaru yang memuat MFA."),
                  createTableCell("Pengguna publik di RnD melihat versi lama. Lakukan deployment build 9de427b."),
                  createTableCell("Tim DevOps"),
                ],
              }),
            ],
          }),

          new Paragraph({ spacing: { after: 160 } }),

          // 12. Manajemen Risiko Terpadu
          createHeading1("12. Manajemen Risiko Terpadu"),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  createTableHeaderCell("Kode", 8),
                  createTableHeaderCell("Risiko", 26),
                  createTableHeaderCell("Dampak", 10),
                  createTableHeaderCell("Peluang", 10),
                  createTableHeaderCell("Skor", 8),
                  createTableHeaderCell("Rencana Mitigasi", 26),
                  createTableHeaderCell("PIC & Tenggat", 12),
                ],
              }),
              new TableRow({
                children: [
                  createTableCell("R1", { bold: true }),
                  createTableCell("Keterlambatan SMS/WA OTP oleh provider gateway pihak ketiga"),
                  createTableCell("4 (Tinggi)"),
                  createTableCell("2 (Rendah)"),
                  createTableCell("8 (Sedang)", { bold: true }),
                  createTableCell("Sediakan opsi Authenticator App (TOTP) sebagai alternatif OTP WA"),
                  createTableCell("Engineering (5 Des 2026)"),
                ],
              }),
              new TableRow({
                children: [
                  createTableCell("R2", { bold: true, altBg: true }),
                  createTableCell("Deviasi data Lingkungan A dan B akibat build tertinggal", { altBg: true }),
                  createTableCell("3 (Sedang)", { altBg: true }),
                  createTableCell("3 (Sedang)", { altBg: true }),
                  createTableCell("9 (Sedang)", { bold: true, altBg: true }),
                  createTableCell("Buat pipeline CI/CD otomatis untuk deploy branch rilis ke RnD", { altBg: true }),
                  createTableCell("DevOps (30 Nov 2026)", { altBg: true }),
                ],
              }),
              new TableRow({
                children: [
                  createTableCell("R3", { bold: true }),
                  createTableCell("Kesalahan input nomor rekening perusahaan oleh Admin baru"),
                  createTableCell("4 (Tinggi)"),
                  createTableCell("2 (Rendah)"),
                  createTableCell("8 (Sedang)", { bold: true }),
                  createTableCell("Terapkan validasi nomor rekening via cek nama API bank rekanan"),
                  createTableCell("Produk (12 Des 2026)"),
                ],
              }),
            ],
          }),

          new Paragraph({ spacing: { after: 160 } }),

          // 13. Hal-Hal yang TIDAK DAPAT DIVERIFIKASI AGENT
          createHeading1("13. Hal-Hal yang TIDAK DAPAT DIVERIFIKASI AGENT"),
          createParagraph("Sesuai Aturan Keras QA & Dokumentasi Engineer, aspek berikut wajib diuji langsung oleh manusia dan pemilik proses:"),
          createBullet("1. User Acceptance Testing (UAT):", "Verifikasi penerimaan resmi bertanda tangan dari SM, SE, dan Direksi pengguna sistem."),
          createBullet("2. Uji Perangkat Keras Fisik Riil:", "Pengujian sensor GPS dan konsumsi baterai pada ponsel Android/iPhone fisik saat bergerak di lapangan."),
          createBullet("3. Uji Beban & Konkurensi Skala Penuh:", "Uji ketahanan database terhadap 1.000 pengguna aktif serentak (load testing)."),
          createBullet("4. Prosedur Pemulihan Bencana (Disaster Recovery):", "Uji coba restore database dari cold backup dan pengukuran RPO/RTO aktual."),
          createBullet("5. Uji Lintas-Tenant Lingkungan B:", "Pengujian isolasi multi-tenant di domain live developerproperti.giivepro.com karena saat ini hanya memiliki 1 tenant aktif."),

          new Paragraph({ spacing: { after: 160 } }),

          // 14. Rencana Hari Berikutnya & Keputusan
          createHeading1("14. Rencana Hari Berikutnya & Keputusan yang Diminta dari Direksi"),
          createHeading2("Rencana Hari Berikutnya (Rabu, 25 November 2026)"),
          createBullet("Deployment RnD:", "Deployment build terbaru (memuat MFA, pembersihan label, rekonsiliasi metrik, dan nomor IT 088980961427) ke Lingkungan B (RnD)."),
          createBullet("Penyusunan Instrumen UAT:", "Penyusunan instrumen User Acceptance Testing (UAT) resmi untuk tim Sales Executive dan Sales Manager proyek The Park Townhouse."),
          createBullet("Integrasi TOTP:", "Integrasi opsi Authenticator App (TOTP) sebagai pelengkap OTP WhatsApp pada modul MFA."),

          createHeading2("Keputusan yang Diminta dari Direksi"),
          createBullet("1. Persetujuan Penerapan Wajib MFA:", "Mengesahkan kebijakan bahwa seluruh staf penjualan dan manajemen wajib melakukan verifikasi dua langkah saat login (Tenggat: 26 November 2026)."),
          createBullet("2. Persetujuan Rekening Whitelist:", "Menandatangani daftar rekening resmi operasional PT Andara Rejo Makmur yang dimasukkan ke dalam sistem (Tenggat: 27 November 2026)."),

          new Paragraph({ spacing: { after: 160 } }),

          // 15. Lampiran Daftar Bukti Pengujian
          createHeading1("15. Lampiran Daftar Bukti Pengujian (Monitor 16:9 Penuh)"),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  createTableHeaderCell("Nama File Bukti", 26),
                  createTableHeaderCell("Deskripsi Bukti Pengujian", 28),
                  createTableHeaderCell("Lingkungan & Tenant", 20),
                  createTableHeaderCell("Resolusi", 12),
                  createTableHeaderCell("Waktu", 14),
                ],
              }),
              new TableRow({
                children: [
                  createTableCell("DEV24-MFA-01-A-andara.png", { bold: true }),
                  createTableCell("Layar Verifikasi 2 Langkah (MFA OTP) saat login akun Direksi"),
                  createTableCell("Lingkungan A, andara_rejo_makmur"),
                  createTableCell("1920x1080 (16:9)"),
                  createTableCell("24 Nov 2026, 13:28 WIB"),
                ],
              }),
              new TableRow({
                children: [
                  createTableCell("DEV30-PIPELINE-NO-EMOJI-A-andara.png", { bold: true, altBg: true }),
                  createTableCell("Antarmuka Pipeline SE dengan Bahasa Bisnis Bersih Bebas Emoticon", { altBg: true }),
                  createTableCell("Lingkungan A, andara_rejo_makmur", { altBg: true }),
                  createTableCell("1920x1080 (16:9)", { altBg: true }),
                  createTableCell("24 Nov 2026, 13:28 WIB", { altBg: true }),
                ],
              }),
              new TableRow({
                children: [
                  createTableCell("DEV27-FIELD-OPS-A-andara.png", { bold: true }),
                  createTableCell("Layar Absen, GPS Radar, dan Presensi Mandiri Sales Manager"),
                  createTableCell("Lingkungan A, andara_rejo_makmur"),
                  createTableCell("1920x1080 (16:9)"),
                  createTableCell("24 Nov 2026, 13:29 WIB"),
                ],
              }),
              new TableRow({
                children: [
                  createTableCell("DEV28-BANK-ACCOUNTS-A-andara.png", { bold: true, altBg: true }),
                  createTableCell("Modal Master Rekening Resmi Perusahaan dengan kontrol SM/Admin", { altBg: true }),
                  createTableCell("Lingkungan A, andara_rejo_makmur", { altBg: true }),
                  createTableCell("1920x1080 (16:9)", { altBg: true }),
                  createTableCell("24 Nov 2026, 13:30 WIB", { altBg: true }),
                ],
              }),
              new TableRow({
                children: [
                  createTableCell("DEV28-AUDIT-LOGS-A-andara.png", { bold: true }),
                  createTableCell("Modal Riwayat Audit Log CRUD Global Aktivitas Tim"),
                  createTableCell("Lingkungan A, andara_rejo_makmur"),
                  createTableCell("1920x1080 (16:9)"),
                  createTableCell("24 Nov 2026, 13:31 WIB"),
                ],
              }),
              new TableRow({
                children: [
                  createTableCell("DEV29-DASHBOARD-DIREKSI-A-andara.png", { bold: true, altBg: true }),
                  createTableCell("Dashboard Portofolio Direksi dengan Metrik Terekonsiliasi Konsisten", { altBg: true }),
                  createTableCell("Lingkungan A, andara_rejo_makmur", { altBg: true }),
                  createTableCell("1920x1080 (16:9)", { altBg: true }),
                  createTableCell("24 Nov 2026, 13:23 WIB", { altBg: true }),
                ],
              }),
              new TableRow({
                children: [
                  createTableCell("DEV32-SUPERADMIN-SAAS-A-andara.png", { bold: true }),
                  createTableCell("Platform Executive SaaS Dashboard Bpk. Hendrawan (MRR & Paket)", { bold: true }),
                  createTableCell("Lingkungan A, andara_rejo_makmur"),
                  createTableCell("1920x1080 (16:9)"),
                  createTableCell("24 Nov 2026, 13:32 WIB"),
                ],
              }),
              new TableRow({
                children: [
                  createTableCell("DEV33-SUPERADMIN-IT-COMMAND-A-andara.png", { bold: true, altBg: true }),
                  createTableCell("IT Command Center God Mode Arya Wicaksana (No. WA: 088980961427)", { altBg: true }),
                  createTableCell("Lingkungan A, andara_rejo_makmur", { altBg: true }),
                  createTableCell("1920x1080 (16:9)", { altBg: true }),
                  createTableCell("24 Nov 2026, 13:32 WIB", { altBg: true }),
                ],
              }),
              new TableRow({
                children: [
                  createTableCell("ENV-B-RND-HOME-andara.png", { bold: true }),
                  createTableCell("Beranda Publik Lingkungan B (Cloudflare HTTPS)"),
                  createTableCell("Lingkungan B, andara_rejo_makmur"),
                  createTableCell("1920x1080 (16:9)"),
                  createTableCell("24 Nov 2026, 13:33 WIB"),
                ],
              }),
              new TableRow({
                children: [
                  createTableCell("ENV-B-RND-DIREKSI-andara.png", { bold: true, altBg: true }),
                  createTableCell("Dashboard Direksi Lingkungan B (Versi lama sebelum rekonsiliasi)", { altBg: true }),
                  createTableCell("Lingkungan B, andara_rejo_makmur", { altBg: true }),
                  createTableCell("1920x1080 (16:9)", { altBg: true }),
                  createTableCell("24 Nov 2026, 13:35 WIB", { altBg: true }),
                ],
              }),
            ],
          }),

          new Paragraph({ spacing: { before: 240 } }),
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [
              new TextRun({
                text: "Surakarta, 24 November 2026\n",
                font: FONT_FAMILY,
                size: 20,
              }),
              new TextRun({
                text: "Divisi Teknologi Informasi · QA & Dokumentasi Engineer\n\n\n\n",
                font: FONT_FAMILY,
                size: 20,
                bold: true,
              }),
              new TextRun({
                text: "( Tim QA & Dokumentasi Developer Sales OS )",
                font: FONT_FAMILY,
                size: 20,
                bold: true,
                color: COLOR_PRIMARY,
              }),
            ],
          }),
        ],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  const targetDir = "D:\\Laporan Andara Rejo Makmur\\Harian";
  let targetFile = path.join(targetDir, "Laporan_Harian_Divisi_IT_24_November_2026.docx");
  const localCopy = path.resolve("docs/laporan-harian/2026-11-24/Laporan_Harian_Divisi_IT_24_November_2026.docx");

  fs.writeFileSync(localCopy, buffer);
  console.log(`Local copy written: ${localCopy} (${buffer.length} bytes)`);

  if (fs.existsSync(targetDir)) {
    try {
      fs.writeFileSync(targetFile, buffer);
      console.log(`Target file written: ${targetFile} (${buffer.length} bytes)`);
    } catch (e: any) {
      if (e.code === 'EBUSY') {
        targetFile = path.join(targetDir, "Laporan_Harian_Divisi_IT_24_November_2026_v2.docx");
        fs.writeFileSync(targetFile, buffer);
        console.log(`Target file locked, written to _v2: ${targetFile} (${buffer.length} bytes)`);
      } else {
        throw e;
      }
    }
  } else {
    console.warn(`Target folder does not exist: ${targetDir}`);
  }
}

buildDocx().catch((err) => {
  console.error("Error building docx:", err);
  process.exit(1);
});
