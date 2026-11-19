// ============================================================================
// CONTENT CALENDAR DOCX EXPORTER - DEVELOPER SALES OS
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
import type { ContentCalendarPlan } from '../content-calendar/types';
import { assertNoTokenLeakage } from './clean-export-guard';

export async function generateContentCalendarDocx(plan: ContentCalendarPlan): Promise<Blob> {
  const children: (Paragraph | Table)[] = [];

  // Header Title
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 200, after: 100 },
      children: [
        new TextRun({
          text: 'KALENDER KONTEN MEDIA SOSIAL (30 HARI)',
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
          text: `Periode: ${plan.monthPeriod} · 3 Slot per Hari (TOFU, MOFU, BOFU) · Total ${plan.totalSlots} Konten Terkurasi`,
          italics: true,
          size: 20,
          color: '8C7E72',
          font: 'Plus Jakarta Sans',
        }),
      ],
    })
  );

  // Group slots by Day
  const daysMap = new Map<number, typeof plan.slots>();
  plan.slots.forEach((s) => {
    const list = daysMap.get(s.dayNumber) || [];
    list.push(s);
    daysMap.set(s.dayNumber, list);
  });

  daysMap.forEach((daySlots, dayNum) => {
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 300, after: 120 },
        children: [
          new TextRun({
            text: `HARI KE-${dayNum} (3 Slot Terjadwal)`,
            bold: true,
            size: 22,
            color: 'C86D51',
          }),
        ],
      })
    );

    const slotRows: TableRow[] = [
      new TableRow({
        children: [
          new TableCell({ width: { size: 15, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: 'Slot & Waktu', bold: true })] })] }),
          new TableCell({ width: { size: 15, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: 'Platform & Format', bold: true })] })] }),
          new TableCell({ width: { size: 40, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: 'Judul Ide & Brief Eksekusi', bold: true })] })] }),
          new TableCell({ width: { size: 30, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: 'Sumber Fakta KB / Cinta 99', bold: true })] })] }),
        ],
      }),
    ];

    daySlots.forEach((slot) => {
      slotRows.push(
        new TableRow({
          children: [
            new TableCell({
              children: [
                new Paragraph({ children: [new TextRun({ text: `${slot.funnelStage}`, bold: true, color: 'C86D51' })] }),
                new Paragraph({ children: [new TextRun({ text: slot.scheduledTime })] }),
              ],
            }),
            new TableCell({
              children: [
                new Paragraph({ children: [new TextRun({ text: slot.platform, bold: true })] }),
                new Paragraph({ children: [new TextRun({ text: slot.format })] }),
              ],
            }),
            new TableCell({
              children: [
                new Paragraph({ children: [new TextRun({ text: slot.title, bold: true })] }),
                new Paragraph({ children: [new TextRun({ text: slot.brief, italics: true })] }),
                new Paragraph({ spacing: { before: 60 }, children: [new TextRun({ text: 'CTA: ', bold: true }), new TextRun({ text: slot.cta })] }),
              ],
            }),
            new TableCell({
              children: [
                new Paragraph({ children: [new TextRun({ text: `KB Fact: ${slot.sourceFactId}` })] }),
                new Paragraph({ children: [new TextRun({ text: `Surat Cinta Poin #${slot.sourceLoveLetterPoint}` })] }),
              ],
            }),
          ],
        })
      );
    });

    children.push(new Table({ rows: slotRows, width: { size: 100, type: WidthType.PERCENTAGE } }));
  });

  const doc = new Document({
    sections: [
      {
        properties: {},
        children,
      },
    ],
  });

  const rawText = JSON.stringify(plan.slots.map((s) => ({ title: s.title, brief: s.brief, caption: s.caption })));
  assertNoTokenLeakage(rawText, 'DOCX Kalender Konten');

  return await Packer.toBlob(doc);
}
