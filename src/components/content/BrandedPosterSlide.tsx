import React from 'react';
import type { FunnelStage } from '../../lib/content-calendar/types';

export interface PosterSlideCopy {
  kicker: string;
  headline: string;
  subheadline: string;
  badgePrice?: string;
}

/**
 * Generates cohesive 5-slide TOFU / MOFU / BOFU poster copy aligned with
 * The Park Townhouse Sukoharjo & PT. Andara Rejo Makmur branding.
 */
export function buildSlideCopy(
  funnelStage: FunnelStage,
  slotTitle: string,
  slideIdx: number,
  totalSlides: number
): PosterSlideCopy {
  const cleanTitle = slotTitle.replace(/^\[[^\]]+\]\s*/, '').trim();

  if (funnelStage === 'TOFU') {
    const deck: PosterSlideCopy[] = [
      {
        kicker: 'Edukasi Hunian Modern',
        headline: cleanTitle.slice(0, 56),
        subheadline: 'RUMAH IMPIAN, SUASANA HANGAT UNTUK KELUARGA TERCINTA',
      },
      {
        kicker: 'Arsitektur Tropis Sehat',
        headline: 'PLAFON 3,8M LEBIH SEJUK ALAMI',
        subheadline: 'SIRKULASI UDARA OPTIMAL & PENCAHAYAAN ALAMI SEPANJANG HARI',
      },
      {
        kicker: 'Legalitas Aman 100%',
        headline: 'SHM SUDAH PECAH PER KAVLING',
        subheadline: 'INVESTASI TENANG, PROSES AJB & KPR BANK CEPAT TANPA HAMBATAN',
      },
      {
        kicker: 'Privasi & Kenyamanan',
        headline: 'ONE-GATE SYSTEM & PRIVASI WALL',
        subheadline: 'LINGKUNGAN EKSKLUSIF, TENANG & AMAN UNTUK TUMBUH KEMBANG ANAK',
      },
      {
        kicker: 'Simpan & Bagikan',
        headline: 'JADWALKAN KUNJUNGAN KELUARGA',
        subheadline: 'LIHAT LANGSUNG SHOW UNIT THE PARK TOWNHOUSE SUKOHARJO',
        badgePrice: '500 JUTAAN',
      },
    ];
    return deck[slideIdx % deck.length];
  }

  if (funnelStage === 'MOFU') {
    const deck: PosterSlideCopy[] = [
      {
        kicker: 'Tur & Spesifikasi Klaster',
        headline: cleanTitle.slice(0, 56),
        subheadline: 'PILIHAN KLASTER NAGOYA, OSAKA & TOKYO DI SUKOHARJO',
      },
      {
        kicker: 'Lokasi Emas Solo Baru',
        headline: '7 MENIT KE RS INDRIATI',
        subheadline: '10 MENIT KE THE PARK MALL & PUSAT BISNIS SOLO BARU',
      },
      {
        kicker: 'Desain Fungsional',
        headline: 'GARASI 2 MOBIL & TATA RUANG LUAS',
        subheadline: 'NYAMAN UNTUK KELUARGA MODERN DENGAN MOBILITAS TINGGI',
      },
      {
        kicker: 'Fasilitas Klaster',
        headline: 'CLUBHOUSE LENGKAP & TAMAN ASRI',
        subheadline: 'FASILITAS EKSKLUSIF PENUNJANG GAYA HIDUP SEHAT KELUARGA',
      },
      {
        kicker: 'Cek Unit Langsung',
        headline: 'SURVEI PRIVAT BERSAMA TIM KAMI',
        subheadline: 'KONSULTASI TIPE UNIT & POSISI KAVLING TERBAIK GRATIS',
        badgePrice: '500 JUTAAN',
      },
    ];
    return deck[slideIdx % deck.length];
  }

  // BOFU
  const deck: PosterSlideCopy[] = [
    {
      kicker: 'Penawaran Spesial',
      headline: cleanTitle.slice(0, 56),
      subheadline: 'AMANKAN UNIT PILIHAN DI THE PARK TOWNHOUSE SUKOHARJO',
      badgePrice: '500 JUTAAN',
    },
    {
      kicker: 'Skema Pembayaran Fleksibel',
      headline: 'CASH KERAS, BERTAHAP & KPR BANK',
      subheadline: 'DIDUKUNG BANK REKANAN BSI, BTN, MANDIRI & BCA',
    },
    {
      kicker: 'Langkah Mudah Miliki Rumah',
      headline: 'BOOKING FEE RINGAN RP 5 JUTA',
      subheadline: 'PENDAMPINGAN PENUH PROSES BERKAS KPR HINGGA SERAH TERIMA',
    },
    {
      kicker: 'Nilai Investasi Naik',
      headline: 'KORIDOR EMAS SOLO BARU SELATAN',
      subheadline: 'POTENSI KENAIKAN NILAI ASET TINGGI & LEGALITAS SHM PECAH',
    },
    {
      kicker: `Slide ${slideIdx + 1}/${totalSlides} · Hubungi Sekarang`,
      headline: 'AMANKAN KAVLING ANDA HARI INI',
      subheadline: 'HUBUNGI SALES EXECUTIVE KAMI UNTUK SIMULASI CICILAN PRIVAT',
      badgePrice: '500 JUTAAN',
    },
  ];
  return deck[slideIdx % deck.length];
}

interface BrandedPosterSlideProps {
  imageUrl: string;
  funnelStage: FunnelStage;
  slotTitle: string;
  slideIdx: number;
  totalSlides: number;
  aiSlideDeck?: PosterSlideCopy[];
}

export const BrandedPosterSlide: React.FC<BrandedPosterSlideProps> = ({
  imageUrl,
  funnelStage,
  slotTitle,
  slideIdx,
  totalSlides,
  aiSlideDeck,
}) => {
  const copy =
    (aiSlideDeck && aiSlideDeck[slideIdx]) ||
    buildSlideCopy(funnelStage, slotTitle, slideIdx, totalSlides);

  return (
    <div className="relative w-full aspect-[4/5] max-w-[440px] mx-auto rounded-2xl overflow-hidden bg-[#F7F5EF] shadow-lg border border-warmborder select-none">
      {/* Base Photorealistic Architectural Photo from Hermes */}
      <img
        src={imageUrl}
        alt={`Poster Slide ${slideIdx + 1}`}
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Top Deep Forest Green Editorial Gradient matching Bottom Footer (#0B3D2E) */}
      <div
        className="absolute inset-x-0 top-0 h-[44%] pointer-events-none"
        style={{
          background:
            'linear-gradient(180deg, rgba(11,61,46,0.97) 0%, rgba(11,61,46,0.88) 56%, rgba(11,61,46,0) 100%)',
        }}
      />

      {/* Top Brand Header: Transparent Logo 1 (The Park Townhouse) + Editorial Headline */}
      <div className="relative z-10 px-4 pt-3 flex flex-col items-center text-center">
        <img
          src="/brand/logo-the-park.png"
          alt="The Park Townhouse Sukoharjo"
          className="h-12 w-auto object-contain drop-shadow-sm"
        />

        <p className="mt-1.5 text-[11px] font-serif italic font-semibold text-[#E5C267]">
          ✦ {copy.kicker} ✦
        </p>
        <h4 className="mt-0.5 text-sm sm:text-base font-black tracking-tight text-white uppercase leading-tight max-w-[92%] drop-shadow-xs">
          {copy.headline}
        </h4>
        <p className="mt-1 text-[9px] font-bold tracking-[0.1em] text-white/85 uppercase max-w-[90%] leading-snug">
          {copy.subheadline}
        </p>
      </div>

      {/* Optional Price Badge (like reference poster) */}
      {copy.badgePrice && (
        <div className="absolute left-3 bottom-4 z-10 bg-[#FBF8EE]/95 border-2 border-[#C8A24A] rounded-full px-3 py-2 text-center shadow-md">
          <p className="text-[7px] font-extrabold tracking-wider text-[#1A563E] uppercase">
            Harga Mulai
          </p>
          <p className="text-base font-black text-[#0B3D2E] leading-none mt-0.5">
            {copy.badgePrice.split(' ')[0]}
          </p>
          <p className="text-[8px] font-extrabold tracking-widest text-[#0B3D2E]">
            {copy.badgePrice.split(' ').slice(1).join(' ')}
          </p>
        </div>
      )}
    </div>
  );
};

/**
 * Composites and downloads a crisp 1080x1350 Branded Poster PNG
 * containing the Hermes photo + BOTH official logos + editorial typography.
 */
export async function downloadBrandedPosterPng(params: {
  imageUrl: string;
  funnelStage: FunnelStage;
  slotTitle: string;
  slideIdx: number;
  totalSlides: number;
  fileName: string;
  aiSlideDeck?: PosterSlideCopy[];
}): Promise<void> {
  const W = 1080;
  const H = 1350;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const loadImg = (src: string) =>
    new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });

  const [photo, logoPark] = await Promise.all([
    loadImg(params.imageUrl),
    loadImg('/brand/logo-the-park.png'),
  ]);

  // 1) Draw cover photo
  const scale = Math.max(W / photo.width, H / photo.height);
  const dw = photo.width * scale;
  const dh = photo.height * scale;
  ctx.drawImage(photo, (W - dw) / 2, (H - dh) / 2, dw, dh);

  // 2) Top deep forest green gradient matching bottom footer (#0B3D2E)
  const topGrad = ctx.createLinearGradient(0, 0, 0, H * 0.44);
  topGrad.addColorStop(0, 'rgba(11,61,46,0.97)');
  topGrad.addColorStop(0.56, 'rgba(11,61,46,0.88)');
  topGrad.addColorStop(1, 'rgba(11,61,46,0)');
  ctx.fillStyle = topGrad;
  ctx.fillRect(0, 0, W, H * 0.44);

  // 3) Transparent Logo 1 (The Park Townhouse Sukoharjo) centered on #0B3D2E
  const lpH = 124;
  const lpW = (logoPark.width / logoPark.height) * lpH;
  ctx.drawImage(logoPark, (W - lpW) / 2, 34, lpW, lpH);

  // 4) Editorial Headline & Subheadline
  const copy =
    (params.aiSlideDeck && params.aiSlideDeck[params.slideIdx]) ||
    buildSlideCopy(
      params.funnelStage,
      params.slotTitle,
      params.slideIdx,
      params.totalSlides
    );
  ctx.textAlign = 'center';
  ctx.fillStyle = '#E5C267';
  ctx.font = 'italic 600 30px Georgia, serif';
  ctx.fillText(`✦ ${copy.kicker} ✦`, W / 2, 208);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = '900 46px Georgia, serif';
  const words = copy.headline.toUpperCase().split(' ');
  const lines: string[] = [];
  let line = '';
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > W - 120 && line) {
      lines.push(line);
      line = w;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  lines.slice(0, 2).forEach((l, i) => ctx.fillText(l, W / 2, 270 + i * 54));

  ctx.fillStyle = 'rgba(255,255,255,0.88)';
  ctx.font = '700 22px sans-serif';
  ctx.fillText(copy.subheadline.slice(0, 62), W / 2, 270 + Math.min(2, lines.length) * 54 + 6);

  // Trigger download
  const link = document.createElement('a');
  link.download = params.fileName;
  link.href = canvas.toDataURL('image/png');
  link.click();
}
