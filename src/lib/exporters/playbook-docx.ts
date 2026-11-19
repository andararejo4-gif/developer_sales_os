// ============================================================================
// PLAYBOOK DOCX EXPORTER - DEVELOPER SALES OS
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
import type { PlaybookPlan } from '../playbook/types';
import { assertNoTokenLeakage } from './clean-export-guard';

export async function generatePlaybookDocx(plan: PlaybookPlan): Promise<Blob> {
  const children: (Paragraph | Table)[] = [];

  // Header Title
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 200, after: 100 },
      children: [
        new TextRun({
          text: `PLAYBOOK OPERASIONAL PENJUALAN (${plan.role})`,
          bold: true,
          size: 32,
          color: 'C86D51',
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
          color: '3A2E2B',
          font: 'Plus Jakarta Sans',
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
      children: [
        new TextRun({
          text: `Edisi Versi ${plan.version} · Target ${plan.monthlyUnitTarget} Unit/Bulan · Sistem BANT Score ≥ 7`,
          italics: true,
          size: 20,
          color: '8C7E72',
          font: 'Plus Jakarta Sans',
        }),
      ],
    })
  );

  // Section 1: Target Funnel Math
  children.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 300, after: 150 },
      children: [
        new TextRun({
          text: '1. Target Reverse-Funnel Aktivitas Bulanan',
          bold: true,
          size: 24,
          color: '3A2E2B',
        }),
      ],
    }),
    new Paragraph({
      spacing: { after: 200 },
      children: [
        new TextRun({ text: `Target Closing: ${plan.reverseFunnelTargets.closing} Unit  ·  ` }),
        new TextRun({ text: `Booking: ${plan.reverseFunnelTargets.booking} Unit  ·  ` }),
        new TextRun({ text: `Survei: ${plan.reverseFunnelTargets.survei} Lokasi  ·  ` }),
        new TextRun({ text: `Hot Prospek: ${plan.reverseFunnelTargets.hot_prospek} Orang  ·  ` }),
        new TextRun({ text: `Total Leads: ${plan.reverseFunnelTargets.leads} Kontak` }),
      ],
    })
  );

  // Section 2: BANT
  children.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 300, after: 150 },
      children: [
        new TextRun({
          text: '2. Kriteria Kualifikasi Prospek BANT (Nilai Lolos ≥ 7)',
          bold: true,
          size: 24,
          color: '3A2E2B',
        }),
      ],
    })
  );

  plan.bantCriteria.forEach((b) => {
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 150, after: 60 },
        children: [
          new TextRun({ text: `${b.dimension} (Bobot ${b.weightPercent}%)`, bold: true, color: 'C86D51' }),
        ],
      }),
      new Paragraph({
        spacing: { after: 60 },
        children: [
          new TextRun({ text: 'Indikator Lolos: ', bold: true }),
          new TextRun({ text: b.indicatorPassing }),
        ],
      }),
      new Paragraph({
        spacing: { after: 120 },
        children: [
          new TextRun({ text: 'Pertanyaan Kunci: ', bold: true }),
          new TextRun({ text: b.qualificationQuestions.join('; ') }),
        ],
      })
    );
  });

  // Section 3: Daily SOP Table
  children.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 300, after: 150 },
      children: [
        new TextRun({
          text: '3. Standar Operasional Prosedur (SOP) Harian',
          bold: true,
          size: 24,
          color: '3A2E2B',
        }),
      ],
    })
  );

  const sopRows: TableRow[] = [
    new TableRow({
      children: [
        new TableCell({ width: { size: 20, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: 'Waktu / Jam', bold: true })] })] }),
        new TableCell({ width: { size: 20, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: 'Saluran', bold: true })] })] }),
        new TableCell({ width: { size: 60, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: 'Instruksi & Target Output', bold: true })] })] }),
      ],
    }),
  ];

  plan.dailySop.forEach((s) => {
    sopRows.push(
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: s.timeOrFrequency, bold: true })] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: s.channel })] })] }),
          new TableCell({
            children: [
              new Paragraph({ children: [new TextRun({ text: s.activityName, bold: true })] }),
              new Paragraph({ children: [new TextRun({ text: s.instruction })] }),
              new Paragraph({ spacing: { before: 40 }, children: [new TextRun({ text: `Output: ${s.targetOutput}`, italics: true })] }),
            ],
          }),
        ],
      })
    );
  });

  children.push(new Table({ rows: sopRows, width: { size: 100, type: WidthType.PERCENTAGE } }));

  const doc = new Document({
    sections: [{ properties: {}, children }],
  });

  const rawText = JSON.stringify(plan.dailySop) + JSON.stringify(plan.bantCriteria);
  assertNoTokenLeakage(rawText, 'DOCX Playbook');

  return await Packer.toBlob(doc);
}
