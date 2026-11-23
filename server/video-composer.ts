// ============================================================================
// BRANDED REELS VIDEO COMPOSER (FFMPEG) - DEVELOPER SALES OS
// Merges multi-part Hermes Omni clips + Indonesian Subtitles + 2-Logo Outro
// ============================================================================

import fs from 'node:fs/promises';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

const FFMPEG_BIN =
  process.env.FFMPEG_PATH ||
  'C:\\Users\\user\\AppData\\Local\\Microsoft\\WinGet\\Packages\\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\\ffmpeg-8.1.2-full_build\\bin\\ffmpeg.exe';

const LOGO_PARK_PATH = path.resolve(process.cwd(), 'public', 'brand', 'logo-the-park.png');
const LOGO_ANDARA_PATH = path.resolve(process.cwd(), 'public', 'brand', 'logo-andara-rejo-makmur.png');
const FONT_FILE =
  process.platform === 'win32'
    ? "fontfile='C\\:/Windows/Fonts/arialbd.ttf':"
    : '';

export interface SubtitleSegment {
  startSec: number;
  endSec: number;
  text: string;
}

function toSrtTime(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  const ms = Math.round((sec - Math.floor(sec)) * 1000);
  const pad = (n: number, w = 2) => String(n).padStart(w, '0');
  return `${pad(h)}:${pad(m)}:${pad(s)},${pad(ms, 3)}`;
}

/**
 * Normalizes a single clip to 720x1280, 30fps, H.264 + AAC 44.1kHz stereo
 * (injects silent audio if source lacks audio stream so concat never fails).
 */
async function normalizeClip(inputPath: string, outputPath: string, maxSec: number): Promise<void> {
  const argsWithAudio = [
    '-y',
    '-i', inputPath,
    '-f', 'lavfi', '-i', 'anullsrc=channel_layout=stereo:sample_rate=44100',
    '-t', String(maxSec),
    '-filter_complex',
    '[0:v]scale=720:1280:force_original_aspect_ratio=increase,crop=720:1280,fps=30,setsar=1[v];[0:a]aformat=sample_fmts=fltp:sample_rates=44100:channel_layouts=stereo[a]',
    '-map', '[v]',
    '-map', '[a]',
    '-c:v', 'libx264', '-preset', 'fast', '-crf', '22', '-pix_fmt', 'yuv420p',
    '-c:a', 'aac', '-b:a', '128k',
    '-shortest',
    outputPath,
  ];

  try {
    await execFileAsync(FFMPEG_BIN, argsWithAudio, { timeout: 60000 });
  } catch {
    // Fallback if input clip has no audio stream at all
    const argsSilent = [
      '-y',
      '-i', inputPath,
      '-f', 'lavfi', '-i', 'anullsrc=channel_layout=stereo:sample_rate=44100',
      '-t', String(maxSec),
      '-filter_complex',
      '[0:v]scale=720:1280:force_original_aspect_ratio=increase,crop=720:1280,fps=30,setsar=1[v]',
      '-map', '[v]',
      '-map', '1:a',
      '-c:v', 'libx264', '-preset', 'fast', '-crf', '22', '-pix_fmt', 'yuv420p',
      '-c:a', 'aac', '-b:a', '128k',
      '-shortest',
      outputPath,
    ];
    await execFileAsync(FFMPEG_BIN, argsSilent, { timeout: 60000 });
  }
}

/**
 * Generates an elegant 2.5-second 720x1280 outro video featuring BOTH official logos
 * (The Park Townhouse Sukoharjo + PT. Andara Rejo Makmur) on deep forest green #0B3D2E.
 */
async function buildTwoLogoOutroClip(outputPath: string, durationSec = 2.5): Promise<void> {
  const filter = [
    // Satu background hijau hutan #0B3D2E yang seragam & transparan untuk kedua logo
    `color=c=#0B3D2E:s=720x1280:d=${durationSec}[bg]`,
    `[0:v]format=rgba,scale=480:-1[l1]`,
    `[1:v]format=rgba,scale=380:-1[l2]`,
    `[bg][l1]overlay=(W-w)/2:310[step1]`,
    // Garis pemisah emas tipis + Tagline + CTA
    `[step1]drawbox=x=180:y=565:w=360:h=2:color=#E5C267@0.75:t=fill[step2]`,
    `[step2]drawtext=${FONT_FILE}text='MORE THAN A HOME':fontcolor=#E5C267:fontsize=28:x=(w-text_w)/2:y=615,drawtext=${FONT_FILE}text='Jadwalkan Survei Privat Anda Hari Ini':fontcolor=white:fontsize=22:x=(w-text_w)/2:y=670[step3]`,
    // Logo 2 (PT. Andara Rejo Makmur) transparan di atas background #0B3D2E yang sama
    `[step3][l2]overlay=(W-w)/2:810,fade=t=in:st=0:d=0.45[vout]`,
  ].join(';');

  await execFileAsync(
    FFMPEG_BIN,
    [
      '-y',
      '-loop', '1', '-t', String(durationSec), '-i', LOGO_PARK_PATH,
      '-loop', '1', '-t', String(durationSec), '-i', LOGO_ANDARA_PATH,
      '-f', 'lavfi', '-t', String(durationSec), '-i', 'anullsrc=channel_layout=stereo:sample_rate=44100',
      '-filter_complex', filter,
      '-map', '[vout]',
      '-map', '2:a',
      '-c:v', 'libx264', '-preset', 'fast', '-crf', '20', '-pix_fmt', 'yuv420p', '-r', '30',
      '-c:a', 'aac', '-b:a', '128k',
      '-shortest',
      outputPath,
    ],
    { timeout: 30000 }
  );
}

/**
 * Combines 2-3 Hermes Omni clips + 2-Logo Outro into a ~25-second branded Reels MP4
 * with clean Indonesian bottom subtitles.
 */
export async function composeBrandedReelsVideo(params: {
  clipPaths: string[];
  subtitles: SubtitleSegment[];
  outputMp4Path: string;
  targetTotalSec?: number;
}): Promise<string> {
  const workDir = path.dirname(params.outputMp4Path);
  const baseName = path.basename(params.outputMp4Path, '.mp4');
  const tmpDir = path.join(workDir, `tmp_${baseName}`);
  await fs.mkdir(tmpDir, { recursive: true });

  const targetSec = params.targetTotalSec || 25;
  const outroSec = 2.5;
  const perClipSec = Number(((targetSec - outroSec) / Math.max(1, params.clipPaths.length)).toFixed(2));

  try {
    const normalizedPaths: string[] = [];
    for (let i = 0; i < params.clipPaths.length; i++) {
      const normPath = path.join(tmpDir, `clip_${i + 1}.mp4`);
      await normalizeClip(params.clipPaths[i], normPath, perClipSec);
      normalizedPaths.push(normPath);
    }

    const outroPath = path.join(tmpDir, 'outro.mp4');
    await buildTwoLogoOutroClip(outroPath, outroSec);
    normalizedPaths.push(outroPath);

    // Concat list
    const concatListPath = path.join(tmpDir, 'concat.txt');
    const concatBody = normalizedPaths.map((p) => `file '${path.basename(p)}'`).join('\n');
    await fs.writeFile(concatListPath, concatBody, 'utf-8');

    const mergedPath = path.join(tmpDir, 'merged.mp4');
    await execFileAsync(
      FFMPEG_BIN,
      [
        '-y',
        '-f', 'concat', '-safe', '0', '-i', concatListPath,
        '-c:v', 'libx264', '-preset', 'fast', '-crf', '21', '-pix_fmt', 'yuv420p',
        '-c:a', 'aac', '-b:a', '128k',
        mergedPath,
      ],
      { timeout: 60000 }
    );

    // Burn simple clean bottom subtitles via drawtext (fontconfig-free on Windows)
    const drawFilters: string[] = [];
    for (const sub of params.subtitles) {
      const lines = sub.text.split('\n').map((l) => l.trim()).filter(Boolean);
      lines.forEach((line, idx) => {
        const safe = line.replace(/'/g, '').replace(/:/g, ' ').replace(/,/g, '\\,');
        const yPos = lines.length > 1 ? (idx === 0 ? 'h-245' : 'h-205') : 'h-220';
        drawFilters.push(
          `drawtext=${FONT_FILE}text='${safe}':fontcolor=white:fontsize=24:box=1:boxcolor=#0B3D2E@0.82:boxborderw=10:x=(w-text_w)/2:y=${yPos}:enable='between(t,${sub.startSec},${sub.endSec})'`
        );
      });
    }

    await execFileAsync(
      FFMPEG_BIN,
      [
        '-y',
        '-i', mergedPath,
        '-t', String(targetSec),
        '-vf', drawFilters.join(','),
        '-c:v', 'libx264', '-preset', 'fast', '-crf', '21', '-pix_fmt', 'yuv420p',
        '-c:a', 'copy',
        params.outputMp4Path,
      ],
      { timeout: 60000 }
    );

    return params.outputMp4Path;
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
  }
}
