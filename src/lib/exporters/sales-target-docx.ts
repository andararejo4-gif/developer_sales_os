// ============================================================================
// SALES TARGET DOCX EXPORTER - DEVELOPER SALES OS
// ============================================================================

import {
  Document,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  Packer,
  Table,
  TableRow,
  TableCell,
  WidthType,
} from 'docx';
import type { SalesTargetPlan } from '../sales-target/types';
import { formatRupiah } from '../sales-target/calculator';
import { assertNoTokenLeakage } from './clean-export-guard';

export async function generateSalesTargetDocx(plan: SalesTargetPlan): Promise<Blob> {
  const children: (Paragraph | Table)[] = [];

  // Header Title
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 200, after: 100 },
      children: [
        new TextRun({
          text: 'RENCANA STRATEGIS TARGET PENJUALAN',
          bold: true,
          size: 32,
          color: 'C86D51', // Terracotta
          font: 'Plus Jakarta Sans',
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [
        new TextRun({
          text: plan.projectName.toUpperCase(),
          bold: true,
          size: 26,
          color: '3A2E2B', // Espresso
          font: 'Plus Jakarta Sans',
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
      children: [
        new TextRun({
          text: `Target Sold Out 100% · Skenario: ${plan.scenarios[plan.activeScenario].label} · Total Omset ${formatRupiah(plan.totalProjectRevenueIdr)}`,
          italics: true,
          size: 20,
          color: '8C7E72',
          font: 'Plus Jakarta Sans',
        }),
      ],
    })
  );

  // Section 1: Ringkasan Parameter Proyek & 3 Skenario
  children.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 300, after: 150 },
      children: [
        new TextRun({
          text: '1. Parameter Proyek & Perbandingan Skenario Penjualan',
          bold: true,
          size: 24,
          color: '3A2E2B',
        }),
      ],
    }),
    new Paragraph({
      spacing: { after: 80 },
      children: [
        new TextRun({ text: 'Total Unit Tersedia: ', bold: true }),
        new TextRun({ text: `${plan.totalUnits} Unit` }),
        new TextRun({ text: '  |  Harga Rata-rata per Unit: ', bold: true }),
        new TextRun({ text: formatRupiah(plan.avgPriceIdr) }),
      ],
    }),
    new Paragraph({
      spacing: { after: 200 },
      children: [
        new TextRun({ text: 'Jumlah Sales Executive (SE): ', bold: true }),
        new TextRun({ text: `${plan.seHeadcount} Orang` }),
        new TextRun({ text: '  |  Total Nilai Penjualan Proyek: ', bold: true }),
        new TextRun({ text: formatRupiah(plan.totalProjectRevenueIdr), bold: true, color: 'C86D51' }),
      ],
    })
  );

  // Scenario Table
  const scenarioRows: TableRow[] = [
    new TableRow({
      children: [
        new TableCell({ width: { size: 30, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: 'Skenario', bold: true })] })] }),
        new TableCell({ width: { size: 25, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: 'Laju (Unit/Bulan)', bold: true })] })] }),
        new TableCell({ width: { size: 25, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: 'Waktu Sold Out 100%', bold: true })] })] }),
        new TableCell({ width: { size: 20, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: 'Status', bold: true })] })] }),
      ],
    }),
  ];

  Object.values(plan.scenarios).forEach((sc) => {
    scenarioRows.push(
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: sc.label })] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `${sc.velocityUnitsPerMonth} unit/bln` })] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `${sc.monthsToSoldOut} Bulan` })] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: sc.type === plan.activeScenario ? 'TERPILIH' : 'Alternatif', bold: sc.type === plan.activeScenario })] })] }),
        ],
      })
    );
  });

  children.push(new Table({ rows: scenarioRows, width: { size: 100, type: WidthType.PERCENTAGE } }));

  // Section 2: Jadwal Target Per Bulan & Reverse Funnel
  children.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 400, after: 150 },
      children: [
        new TextRun({
          text: '2. Jadwal Progres Penjualan Bulanan & Kebutuhan Aktivitas Funnel',
          bold: true,
          size: 24,
          color: '3A2E2B',
        }),
      ],
    })
  );

  const monthlyRows: TableRow[] = [
    new TableRow({
      children: [
        new TableCell({ width: { size: 15, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: 'Periode', bold: true })] })] }),
        new TableCell({ width: { size: 12, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: 'Target Unit', bold: true })] })] }),
        new TableCell({ width: { size: 13, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: 'Kumulatif', bold: true })] })] }),
        new TableCell({ width: { size: 15, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: 'Sisa Unit', bold: true })] })] }),
        new TableCell({ width: { size: 25, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: 'Omset Bulan Ini', bold: true })] })] }),
        new TableCell({ width: { size: 20, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: 'Target Aktivitas', bold: true })] })] }),
      ],
    }),
  ];

  plan.monthlySchedules.forEach((row) => {
    monthlyRows.push(
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: row.monthLabel })] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `${row.targetUnits} Unit` })] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `${row.cumulativeSoldUnits} Unit (${row.percentSoldOut}%)` })] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `${row.remainingUnits} Unit` })] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: formatRupiah(row.monthlyRevenueIdr) })] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `${row.reverseFunnel.requiredSiteVisits} Survey, ${row.reverseFunnel.requiredBookings} Booking` })] })] }),
        ],
      })
    );
  });

  children.push(new Table({ rows: monthlyRows, width: { size: 100, type: WidthType.PERCENTAGE } }));

  // Section 3: Pembagian Target Kuota per Sales Executive
  children.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 400, after: 150 },
      children: [
        new TextRun({
          text: '3. Distribusi Target per Sales Executive (SE)',
          bold: true,
          size: 24,
          color: '3A2E2B',
        }),
      ],
    })
  );

  plan.seAllocations.forEach((alloc) => {
    children.push(
      new Paragraph({
        spacing: { after: 60 },
        children: [
          new TextRun({ text: `${alloc.seName}: `, bold: true, color: 'C86D51' }),
          new TextRun({ text: `Target ${alloc.monthlyUnitTarget} Unit/Bulan (${formatRupiah(alloc.monthlyRevenueTargetIdr)})  ·  KPI Mingguan: ${alloc.weeklySiteVisitTarget} Survey Lokasi  ·  KPI Harian: ${alloc.dailyContactTarget} Kontak Prospek` }),
        ],
      })
    );
  });

  const doc = new Document({
    sections: [
      {
        properties: {},
        children,
      },
    ],
  });

  const rawText = JSON.stringify(plan.monthlySchedules) + JSON.stringify(plan.seAllocations);
  assertNoTokenLeakage(rawText, 'DOCX Target Penjualan');

  return await Packer.toBlob(doc);
}
