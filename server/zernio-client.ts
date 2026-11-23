// ============================================================================
// ZERNIO SOCIAL MEDIA CLIENT — DEVELOPER SALES OS
// Multi-key pool (2 keys = up to 4 connected accounts per SE)
// Supports Instagram, TikTok, Facebook, YouTube via Zernio REST API v1
// ============================================================================

export type ZernioPlatform =
  | 'instagram'
  | 'tiktok'
  | 'facebook'
  | 'youtube'
  | 'twitter'
  | 'threads'
  | 'linkedin'
  | 'pinterest';

export const ZERNIO_PLATFORMS: Array<{
  id: ZernioPlatform;
  label: string;
  calendarPlatform: 'Instagram' | 'TikTok' | 'Facebook' | 'YouTube Shorts' | 'X';
  note: string;
}> = [
  {
    id: 'instagram',
    label: 'Instagram',
    calendarPlatform: 'Instagram',
    note: 'Carousel, Single Poster & Reels (Akun Business/Creator)',
  },
  {
    id: 'tiktok',
    label: 'TikTok',
    calendarPlatform: 'TikTok',
    note: 'Video pendek vertikal 9:16 & TikTok Post',
  },
  {
    id: 'facebook',
    label: 'Facebook',
    calendarPlatform: 'Facebook',
    note: 'Facebook Page (Poster, Carousel & Video)',
  },
  {
    id: 'youtube',
    label: 'YouTube Shorts',
    calendarPlatform: 'YouTube Shorts',
    note: 'Video vertikal Shorts & YouTube Channel',
  },
  {
    id: 'twitter',
    label: 'X (Twitter)',
    calendarPlatform: 'X',
    note: 'Postingan gambar, video & thread properti',
  },
  {
    id: 'threads',
    label: 'Threads',
    calendarPlatform: 'Instagram',
    note: 'Update singkat, foto & carousel Threads',
  },
  {
    id: 'linkedin',
    label: 'LinkedIn',
    calendarPlatform: 'Facebook',
    note: 'Jaringan profesional, investor & eksekutif',
  },
  {
    id: 'pinterest',
    label: 'Pinterest',
    calendarPlatform: 'Instagram',
    note: 'Pin inspirasi desain rumah Japandi & properti',
  },
];

export const ACCOUNTS_PER_KEY_LIMIT = 2;

export function mapCalendarPlatformToZernio(platform?: string): ZernioPlatform {
  const p = (platform || '').toLowerCase();
  if (p.includes('tiktok')) return 'tiktok';
  if (p.includes('facebook') || p === 'fb') return 'facebook';
  if (p.includes('youtube') || p === 'yt') return 'youtube';
  if (p.includes('threads')) return 'threads';
  if (p.includes('linkedin')) return 'linkedin';
  if (p.includes('pinterest')) return 'pinterest';
  if (p === 'x' || p.includes('twitter')) return 'twitter';
  return 'instagram';
}

export function getZernioBaseUrl(): string {
  return (process.env.ZERNIO_BASE_URL || 'https://zernio.com/api/v1').replace(/\/+$/, '');
}

export function getZernioKeys(): string[] {
  const keys: string[] = [];
  if (process.env.ZERNIO_API_KEY?.trim()) keys.push(process.env.ZERNIO_API_KEY.trim());
  if (process.env.ZERNIO_API_KEY_2?.trim()) keys.push(process.env.ZERNIO_API_KEY_2.trim());
  if (process.env.ZERNIO_API_KEYS?.trim()) {
    for (const k of process.env.ZERNIO_API_KEYS.split(',')) {
      const clean = k.trim();
      if (clean && !keys.includes(clean)) keys.push(clean);
    }
  }
  return keys;
}

async function zernioFetch<T = any>(
  keyIndex: number,
  endpoint: string,
  init: RequestInit = {}
): Promise<T> {
  const keys = getZernioKeys();
  const apiKey = keys[keyIndex] || keys[0];
  if (!apiKey) {
    throw new Error('ZERNIO_API_KEY belum dikonfigurasi di .env');
  }
  const url = `${getZernioBaseUrl()}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
    signal: AbortSignal.timeout(25000),
  });
  const text = await res.text();
  let json: any = {};
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    json = { raw: text };
  }
  if (!res.ok) {
    throw new Error(json?.error || json?.message || `Zernio HTTP ${res.status}`);
  }
  return json as T;
}

export async function getOrCreateZernioProfile(
  keyIndex: number,
  seEmail: string,
  seName: string
): Promise<string> {
  const listRes = await zernioFetch<{ profiles?: any[] }>(keyIndex, '/profiles', {
    method: 'GET',
  });
  const profiles = Array.isArray(listRes?.profiles) ? listRes.profiles : [];
  const matched = profiles.find(
    (p) => p.externalId === seEmail || p.name === seEmail
  );
  if (matched?._id) return String(matched._id);

  try {
    const created = await zernioFetch<{ profile?: any; _id?: string }>(keyIndex, '/profiles', {
      method: 'POST',
      body: JSON.stringify({
        name: seName ? `${seName} (${seEmail})` : seEmail,
        externalId: seEmail,
      }),
    });
    const newId = created?.profile?._id || created?._id;
    if (newId) return String(newId);
  } catch {
    /* fallback to default profile if profile creation is restricted on plan */
  }

  const def = profiles.find((p) => p.isDefault) || profiles[0];
  if (!def?._id) {
    throw new Error('Tidak ada Zernio profile yang tersedia untuk API key ini.');
  }
  return String(def._id);
}

export async function getZernioConnectUrl(params: {
  keyIndex: number;
  profileId: string;
  platform: ZernioPlatform;
  redirectUrl: string;
}): Promise<string> {
  const qs = new URLSearchParams({
    profileId: params.profileId,
    redirect_url: params.redirectUrl,
  });
  const data = await zernioFetch<{ authUrl?: string; url?: string }>(
    params.keyIndex,
    `/connect/${params.platform}?${qs.toString()}`,
    { method: 'GET' }
  );
  const authUrl = data.authUrl || data.url;
  if (!authUrl) {
    throw new Error(`Zernio tidak mengembalikan authUrl untuk ${params.platform}`);
  }
  return authUrl;
}

export async function fetchZernioAccountsForProfile(
  keyIndex: number,
  profileId: string
): Promise<Array<{ _id: string; platform: string; username?: string; displayName?: string }>> {
  try {
    const data = await zernioFetch<{ accounts?: any[] }>(
      keyIndex,
      `/accounts?profileId=${encodeURIComponent(profileId)}`,
      { method: 'GET' }
    );
    return Array.isArray(data?.accounts) ? data.accounts : [];
  } catch {
    return [];
  }
}

export function resolvePublicMediaUrl(localOrRemoteUrl: string, requestOrigin?: string): string {
  if (/^https?:\/\//i.test(localOrRemoteUrl)) {
    return localOrRemoteUrl;
  }
  const publicBase = (
    process.env.PUBLIC_APP_URL ||
    requestOrigin ||
    'https://developerproperti.giivepro.com'
  ).replace(/\/+$/, '');
  return `${publicBase}${localOrRemoteUrl.startsWith('/') ? '' : '/'}${localOrRemoteUrl}`;
}

export async function publishSlotViaZernio(params: {
  keyIndex: number;
  accountId: string;
  platform: ZernioPlatform;
  content: string;
  mediaUrls: string[];
  isVideo: boolean;
  requestOrigin?: string;
}): Promise<{ postId: string; postUrl: string; status: string }> {
  const mediaItems = params.mediaUrls
    .filter(Boolean)
    .slice(0, params.isVideo ? 1 : 10)
    .map((u) => ({
      type: params.isVideo ? 'video' : 'image',
      url: resolvePublicMediaUrl(u, params.requestOrigin),
    }));

  const created = await zernioFetch<any>(params.keyIndex, '/posts', {
    method: 'POST',
    body: JSON.stringify({
      content: params.content,
      mediaItems,
      platforms: [
        {
          platform: params.platform,
          accountId: params.accountId,
        },
      ],
      publishNow: true,
    }),
  });

  const postObj = created?.post || created?.data || created;
  const postId = String(postObj?._id || postObj?.id || '');
  let postUrl = extractPlatformPostUrl(postObj, params.platform);
  let status = String(postObj?.status || 'published');

  // Brief poll up to 3x if Zernio is still finalizing the published URL
  if (postId && !postUrl) {
    for (let i = 0; i < 3; i++) {
      await new Promise((r) => setTimeout(r, 1500));
      try {
        const fetched = await zernioFetch<any>(params.keyIndex, `/posts/${postId}`, {
          method: 'GET',
        });
        const p = fetched?.post || fetched?.data || fetched;
        status = String(p?.status || status);
        postUrl = extractPlatformPostUrl(p, params.platform);
        if (postUrl) break;
      } catch {
        break;
      }
    }
  }

  return { postId, postUrl, status };
}

function extractPlatformPostUrl(postObj: any, platform: ZernioPlatform): string {
  if (!postObj) return '';
  if (typeof postObj.platformPostUrl === 'string' && postObj.platformPostUrl) {
    return postObj.platformPostUrl;
  }
  if (typeof postObj.url === 'string' && postObj.url) {
    return postObj.url;
  }
  const plats = Array.isArray(postObj.platforms) ? postObj.platforms : [];
  const hit = plats.find((p: any) => p.platform === platform) || plats[0];
  return String(hit?.platformPostUrl || hit?.postUrl || hit?.url || '');
}
