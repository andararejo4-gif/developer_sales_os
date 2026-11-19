// Generator Ekspor DOCX Resmi untuk Surat Cinta 99 Keunggulan
// Menggunakan library docx dengan layout editorial berkelas

import { Document, Paragraph, TextRun, HeadingLevel, AlignmentType, Packer, UnderlineType } from 'docx';
import { LoveLetterPoint } from './points-data';

export async function generateLoveLetterDocx(
  projectName: string,
  developerName: string,
  city: string,
  points: LoveLetterPoint[]
): Promise<Blob> {
  const children: Paragraph[] = [];

  // Judul Utama (Cover / Header)
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 200, after: 100 },
      children: [
        new TextRun({
          text: "SURAT CINTA 99 KEUNGGULAN",
          bold: true,
          size: 36, // 18pt
          color: "B45309", // terracotta
          font: "Plus Jakarta Sans"
        })
      ]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [
        new TextRun({
          text: projectName.toUpperCase(),
          bold: true,
          size: 28, // 14pt
          color: "1C1917", // espresso
          font: "Plus Jakarta Sans"
        })
      ]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
      children: [
        new TextRun({
          text: `Dokumen Editorial Faktual & Kurasi Nilai Kehidupan · ${developerName} · ${city}`,
          italics: true,
          size: 20, // 10pt
          color: "78716C", // warmmuted
          font: "Plus Jakarta Sans"
        })
      ]
    })
  );

  // Kata Pengantar Narator
  children.push(
    new Paragraph({
      spacing: { after: 300 },
      children: [
        new TextRun({
          text: "PENGANTAR DARI PENGEMBANG",
          bold: true,
          size: 24,
          color: "1C1917",
          font: "Plus Jakarta Sans"
        })
      ]
    }),
    new Paragraph({
      spacing: { after: 400 },
      children: [
        new TextRun({
          text: `Setiap hunian yang kami bangun bukan sekadar kompilasi dinding, atap, dan tanah kavling. Ini adalah kanvas tempat memori keluarga Anda dirajut. Di balik setiap sudut ${projectName}, terdapat dedikasi rancang bangun, presisi material, dan kenyamanan lingkungan yang kami kurasi secara menyeluruh. Dokumen ini merangkum 99 keunggulan nyata—faktual, terukur, dan bebas dari janji berlebihan—sebagai panduan bagi Anda dalam memilih ruang hidup terbaik untuk masa depan keluarga tercinta.`,
          size: 22,
          color: "1C1917",
          font: "Plus Jakarta Sans"
        })
      ]
    })
  );

  // Group by chapter
  let currentChapter = "";

  points.forEach((p) => {
    if (p.chapter !== currentChapter) {
      currentChapter = p.chapter;
      children.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 400, after: 150 },
          children: [
            new TextRun({
              text: currentChapter,
              bold: true,
              size: 24,
              color: "B45309",
              font: "Plus Jakarta Sans",
              underline: { type: UnderlineType.SINGLE, color: "B45309" }
            })
          ]
        })
      );
    }

    children.push(
      new Paragraph({
        spacing: { before: 120, after: 60 },
        children: [
          new TextRun({
            text: `${p.number}. `,
            bold: true,
            size: 22,
            color: "B45309",
            font: "Plus Jakarta Sans"
          }),
          new TextRun({
            text: p.title,
            bold: true,
            size: 22,
            color: "1C1917",
            font: "Plus Jakarta Sans"
          }),
          new TextRun({
            text: `  [${p.category}]`,
            italics: true,
            size: 18,
            color: "78716C",
            font: "Plus Jakarta Sans"
          })
        ]
      }),
      new Paragraph({
        spacing: { after: 140 },
        indent: { left: 360 },
        children: [
          new TextRun({
            text: p.narrative,
            size: 20,
            color: "44403C",
            font: "Plus Jakarta Sans"
          })
        ]
      })
    );
  });

  // Footer Dokumen
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 600, after: 200 },
      children: [
        new TextRun({
          text: `Hak Cipta © 2026 ${developerName}. Didukung oleh Developer Sales OS (giivepro.com).`,
          size: 18,
          italics: true,
          color: "78716C",
          font: "Plus Jakarta Sans"
        })
      ]
    })
  );

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: children
      }
    ]
  });

  return await Packer.toBlob(doc);
}
