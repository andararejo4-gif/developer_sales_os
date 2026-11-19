// ============================================================================
// MARKET RESEARCH DOCX EXPORTER - DEVELOPER SALES OS
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
import type { MarketResearchReport } from '../market-research/types';
import { assertNoTokenLeakage } from './clean-export-guard';

export async function generateMarketResearchDocx(report: MarketResearchReport): Promise<Blob> {
  const children: (Paragraph | Table)[] = [];

  // Header Title
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 200, after: 100 },
      children: [
        new TextRun({
          text: 'LAPORAN RISET PASAR & ANALISIS KOMPETISI',
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
          text: report.projectName.toUpperCase(),
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
          text: `Edisi Dokumen Versi ${report.version} · Radius 500m s.d 25km · Sukoharjo & Solo Raya`,
          italics: true,
          size: 20,
          color: '8C7E72',
          font: 'Plus Jakarta Sans',
        }),
      ],
    })
  );

  // Section 1: Executive Summary & Market Share
  children.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 300, after: 150 },
      children: [
        new TextRun({
          text: '1. Ringkasan Eksekutif & Posisi Pangsa Pasar',
          bold: true,
          size: 24,
          color: '3A2E2B',
        }),
      ],
    }),
    new Paragraph({
      spacing: { after: 200 },
      children: [
        new TextRun({
          text: report.marketShare.competitiveEdgeSummary,
          size: 22,
          color: '3A2E2B',
        }),
      ],
    })
  );

  // Section 2: 5 Target Personas
  children.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 400, after: 150 },
      children: [
        new TextRun({
          text: '2. 5 Persona Target Pembeli Properti',
          bold: true,
          size: 24,
          color: '3A2E2B',
        }),
      ],
    })
  );

  report.personas.forEach((persona, idx) => {
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 100 },
        children: [
          new TextRun({
            text: `${idx + 1}. ${persona.name} (${persona.subtitle})`,
            bold: true,
            size: 22,
            color: 'C86D51',
          }),
        ],
      }),
      new Paragraph({
        spacing: { after: 80 },
        children: [
          new TextRun({ text: 'Rentang Usia: ', bold: true, size: 20 }),
          new TextRun({ text: persona.demographics.ageRange, size: 20 }),
          new TextRun({ text: '  |  Penghasilan: ', bold: true, size: 20 }),
          new TextRun({ text: persona.demographics.monthlyIncome, size: 20 }),
        ],
      }),
      new Paragraph({
        spacing: { after: 80 },
        children: [
          new TextRun({ text: 'Profesi Khas: ', bold: true, size: 20 }),
          new TextRun({ text: persona.demographics.profession.join(', '), size: 20 }),
        ],
      }),
      new Paragraph({
        spacing: { after: 80 },
        children: [
          new TextRun({ text: 'Kebutuhan Utama: ', bold: true, size: 20 }),
          new TextRun({ text: persona.needsAndPains.join('; '), size: 20 }),
        ],
      }),
      new Paragraph({
        spacing: { after: 80 },
        children: [
          new TextRun({ text: 'Keberatan Umum: ', bold: true, size: 20 }),
          new TextRun({ text: persona.commonObjections.join('; '), size: 20 }),
        ],
      }),
      new Paragraph({
        spacing: { after: 80 },
        children: [
          new TextRun({ text: 'Kanal Efektif: ', bold: true, size: 20 }),
          new TextRun({ text: persona.preferredChannels.join(', '), size: 20 }),
        ],
      }),
      new Paragraph({
        spacing: { after: 160 },
        children: [
          new TextRun({ text: 'Pemicu Keputusan Beli: ', bold: true, size: 20 }),
          new TextRun({ text: persona.buyingTriggers.join('; '), size: 20 }),
        ],
      })
    );
  });

  // Section 3: Fasilitas Publik per Cincin Radius
  children.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 400, after: 150 },
      children: [
        new TextRun({
          text: '3. Pemetaan Fasilitas Publik (Cincin Radius 500m - 25km)',
          bold: true,
          size: 24,
          color: '3A2E2B',
        }),
      ],
    })
  );

  const facilityRows: TableRow[] = [
    new TableRow({
      children: [
        new TableCell({ width: { size: 30, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: 'Fasilitas', bold: true })] })] }),
        new TableCell({ width: { size: 25, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: 'Kategori', bold: true })] })] }),
        new TableCell({ width: { size: 20, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: 'Jarak Riil', bold: true })] })] }),
        new TableCell({ width: { size: 25, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: 'Waktu Tempuh', bold: true })] })] }),
      ],
    }),
  ];

  report.facilities.forEach((f) => {
    facilityRows.push(
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: f.name })] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: f.category })] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: f.distanceKmFormatted })] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `± ${f.driveTimeMinutes} menit` })] })] }),
        ],
      })
    );
  });

  children.push(new Table({ rows: facilityRows, width: { size: 100, type: WidthType.PERCENTAGE } }));

  // Section 4: Analisis Kompetitor
  children.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 400, after: 150 },
      children: [
        new TextRun({
          text: '4. Matriks Kompetitor & Keunggulan Pembeda Proyek',
          bold: true,
          size: 24,
          color: '3A2E2B',
        }),
      ],
    })
  );

  report.competitors.forEach((comp) => {
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 160, after: 80 },
        children: [
          new TextRun({
            text: `${comp.name} (${comp.distanceKm} km)`,
            bold: true,
            size: 22,
            color: '3A2E2B',
          }),
        ],
      }),
      new Paragraph({
        spacing: { after: 60 },
        children: [
          new TextRun({ text: 'Rentang Harga: ', bold: true, size: 20 }),
          new TextRun({ text: comp.priceRange, size: 20 }),
        ],
      }),
      new Paragraph({
        spacing: { after: 60 },
        children: [
          new TextRun({ text: 'Kekuatan: ', bold: true, size: 20 }),
          new TextRun({ text: comp.strengths.join(', '), size: 20 }),
        ],
      }),
      new Paragraph({
        spacing: { after: 60 },
        children: [
          new TextRun({ text: 'Kelemahan: ', bold: true, size: 20 }),
          new TextRun({ text: comp.weaknesses.join(', '), size: 20 }),
        ],
      }),
      new Paragraph({
        spacing: { after: 140 },
        children: [
          new TextRun({ text: 'Keunggulan Proyek Kita: ', bold: true, color: 'C86D51', size: 20 }),
          new TextRun({ text: comp.theParkAdvantage, bold: true, size: 20 }),
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

  // Verify no token leakage in text representation
  const rawText = JSON.stringify(report.personas) + JSON.stringify(report.facilities) + JSON.stringify(report.competitors);
  assertNoTokenLeakage(rawText, 'DOCX Riset Pasar');

  return await Packer.toBlob(doc);
}
