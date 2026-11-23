// ============================================================================
// CONTENT CALENDAR GENERATOR - DEVELOPER SALES OS
// Full 30 Days x 3 Slots/Day (TOFU, MOFU, BOFU) with Dual Tracks
// ============================================================================

import type {
  ContentSlot,
  ContentCalendarPlan,
  ContentPlatform,
  ContentFormat,
  ContentTrack,
} from './types';

interface SlotBlueprint {
  title: string;
  brief: string;
  caption: string;
  format: ContentFormat;
  platform: ContentPlatform;
  sourceFactId: string;
  sourceLoveLetterPoint: number;
  hashtags: string[];
  cta: string;
}

// 10 Pattern TOFU Blueprints (Edukasi, Arsitektur, Masalah Pencahayaan/Suhu Solo, Tips Legalitas Properti)
const TOFU_BLUEPRINTS: SlotBlueprint[] = [
  {
    title: 'Kenapa Rumah Plafon 3.8m Jauh Lebih Sejuk di Iklim Solo?',
    brief: 'Video pendek edukasi menjelaskan fisika sirkulasi termal: udara panas naik ke atas, menyisakan hawa sejuk di lantai bawah tanpa AC menyala seharian.',
    caption: 'Tinggal di Solo Raya sering kali terasa gerah di siang hari. Di The Park Townhouse, langit-langit setinggi 3.8 meter dirancang agar udara panas naik menjauhi ruang gerak keluarga Anda. Hasilnya? Hawa rumah senantiasa sejuk, tagihan listrik hemat, dan pencahayaan alami berlimpah sepanjang hari.',
    format: 'Reels / Video Pendek',
    platform: 'Instagram',
    sourceFactId: 'FACT_SPEC_CEILING',
    sourceLoveLetterPoint: 21,
    hashtags: ['#TheParkTownhouse', '#DesainTropis', '#RumahSejukSolo', '#ArsitekturSehat'],
    cta: 'Simpan video ini dan bagikan ke pasangan Anda yang sedang merencanakan rumah idaman.',
  },
  {
    title: '3 Jebakan Sertifikat Properti: Induk vs Pecah Per Kavling',
    brief: 'Carousel 4 slide infografis mengedukasi pembeli pemula mengenai risiko sertifikat induk yang belum dipecah developer vs keuntungan SHM pecah siap balik nama.',
    caption: 'Banyak calon pembeli tergiur harga murah tanpa mengecek status sertifikat. Jika sertifikat masih "induk", proses AJB dan KPR bank bisa tertunda bertahun-tahun. Di The Park Townhouse Sukoharjo, seluruh Sertifikat Hak Milik (SHM) sudah 100% pecah per unit kavling. Keamanan investasi Anda terjamin sejak tanda tangan pertama.',
    format: 'Carousel Edukasi',
    platform: 'Instagram',
    sourceFactId: 'FACT_LEGAL_SHM',
    sourceLoveLetterPoint: 5,
    hashtags: ['#TipsBeliRumah', '#LegalitasProperti', '#SHMPecah', '#InvestasiAmanSolo'],
    cta: 'Geser slide sampai akhir untuk checklist dokumen legalitas sebelum membayar booking fee.',
  },
  {
    title: 'Mengapa Koridor Solo Baru Selatan Menjadi Incaran Tenaga Medis?',
    brief: 'Video POV suasana jalan raya penghubung Sukoharjo - Solo Baru dengan timer waktu tempuh menuju RS Indriati dan pusat gaya hidup.',
    caption: 'Bagi dokter dan profesional dengan mobilitas tinggi, waktu adalah segalanya. Menempuh waktu hanya 7 menit ke RS Indriati dan 10 menit ke The Park Mall menjadikan kawasan Sukoharjo Utara lokasi emas: bebas macet perkotaan namun tetap memiliki akses fasilitas terlengkap.',
    format: 'Reels / Video Pendek',
    platform: 'TikTok',
    sourceFactId: 'FACT_LOC_INDRIATI',
    sourceLoveLetterPoint: 1,
    hashtags: ['#SoloBaru', '#RumahDekatRSIndriati', '#DokterSolo', '#KawasanEmas'],
    cta: 'Ketik "LOKASI" di kolom komentar untuk mendapatkan peta radius 15 menit The Park Townhouse.',
  },
  {
    title: 'Bata Ringan vs Bata Merah Plester Aci: Mana Lebih Tahan Gempa & Redam Suara?',
    brief: 'Thread edukatif membedakan kekuatan struktural material bangunan dinding rumah 2 lantai.',
    caption: 'Bata merah lokal berkualitas tinggi dengan plester aci tebal memberikan insulasi suara terbaik antar ruang dan daya tahan struktural puluhan tahun. The Park Townhouse mempertahankan komitmen konstruksi kokoh tanpa mengurangi standar spesifikasi material.',
    format: 'Thread / Teks Analisis',
    platform: 'X',
    sourceFactId: 'FACT_SPEC_BATA_MERAH',
    sourceLoveLetterPoint: 12,
    hashtags: ['#SpesifikasiRumah', '#BataMerah', '#KonstruksiBerkelas', '#PropertiSolo'],
    cta: 'Bagikan pendapat Anda: apakah Anda lebih memilih dinding bata merah atau hebel ringan?',
  },
  {
    title: 'Kelebihan Row Jalan Komplek 7 Meter untuk Lingkungan Anak Ramah Bermain',
    brief: 'Foto estetik jalan lingkungan komplek paving blok rapi dengan tanaman hijau di kanan kiri.',
    caption: 'Bukan sekadar tempat lewat kendaraan, jalan komplek selebar 7 meter memberikan rasa aman ketika anak-anak bersepeda sore hari di depan rumah. Dilengkapi saluran drainase tertutup, komplek tetap bersih dan bebas bau selokan.',
    format: 'Single Image + Visual Quote',
    platform: 'Facebook',
    sourceFactId: 'FACT_FAC_ROAD',
    sourceLoveLetterPoint: 52,
    hashtags: ['#LingkunganKeluarga', '#RumahPavingSolo', '#PerumahanMewah', '#SukoharjoMakmur'],
    cta: 'Bagikan postingan ini ke grup keluarga Anda yang sedang mencari lingkungan aman.',
  },
];

// 10 Pattern MOFU Blueprints (Solusi, Room Tour, Komparasi Spesifikasi, Fasilitas Unggulan)
const MOFU_BLUEPRINTS: SlotBlueprint[] = [
  {
    title: 'Room Tour Klaster Nagoya: Fasad Modern Kontemporer 2 Lantai',
    brief: 'Video walkthrough sinematik menyusuri ruang tamu open-space, void tangga estetik, dan kamar tidur utama dengan bukaan balkon.',
    caption: 'Menyusuri setiap sudut Klaster Nagoya The Park Townhouse. Tata ruang open-plan menyatukan living room dan dining area dengan sirkulasi cahaya spektakuler. Kamar utama dirancang sebagai oasis relaksasi pribadi setelah seharian beraktivitas di Solo Baru.',
    format: 'Video Walkthrough / Room Tour',
    platform: 'TikTok',
    sourceFactId: 'FACT_UNIT_LUAS',
    sourceLoveLetterPoint: 19,
    hashtags: ['#RoomTourSolo', '#Rumah2LantaiSolo', '#KlasterNagoya', '#HouseTourIndonesia'],
    cta: 'Jadwalkan kunjungan privat langsung bersama Sales Manager kami via WhatsApp di bio.',
  },
  {
    title: 'Bukti Legalitas: Sertifikat SHM & PBG Lengkap Sudah Terbit',
    brief: 'Carousel foto dokumen resmi legalitas (disamarkan data pribadi) yang membuktikan kesiapan transaksi legal aman.',
    caption: 'Beli rumah bukan hanya soal gambar brosur indah, tapi kepastian hukum. Di The Park Townhouse, Persetujuan Bangunan Gedung (PBG) dan Sertifikat Hak Milik (SHM) sudah terbit per kavling. Anda bisa langsung proses akad notaris atau pengajuan KPR di bank rekanan pilihan.',
    format: 'Carousel Edukasi',
    platform: 'Instagram',
    sourceFactId: 'FACT_LEGAL_PBG',
    sourceLoveLetterPoint: 6,
    hashtags: ['#LegalitasClear', '#PBGReady', '#SHMSukoharjo', '#PropertiTerpercaya'],
    cta: 'Hubungi tim legal developer kami untuk konsultasi simulasi KPR bank syariah/konvensional.',
  },
  {
    title: 'Keamanan Berlapis: One Gate System & CCTV Online Terpadu',
    brief: 'Video pendek menunjukkan pos gerbang sekuriti 24 jam dengan palang otomatis dan kamera pengawas terintegrasi.',
    caption: 'Ketenangan hati adalah kemewahan tertinggi. Dengan akses gerbang satu pintu (One Gate System) dan pos satpam 24 jam, hanya penghuni dan tamu terverifikasi yang dapat memasuki kawasan hunian. Anak-anak dapat bermain leluasa di lingkungan tertutup.',
    format: 'Reels / Video Pendek',
    platform: 'YouTube Shorts',
    sourceFactId: 'FACT_FAC_ONEGATE',
    sourceLoveLetterPoint: 51,
    hashtags: ['#OneGateSystem', '#Keamanan24Jam', '#TownhouseAman', '#TheParkTownhouse'],
    cta: 'Kunjungi lokasi kami akhir pekan ini untuk merasakan langsung kenyamanan lingkungannya.',
  },
  {
    title: 'Komparasi Spesifikasi The Park vs Rata-rata Perumahan Sekitar',
    brief: 'Infografis tabel komparasi detail material pondasi, dinding bata merah, sanitari TOTO, dan lebar jalan komplek.',
    caption: 'Bandingkan sebelum memutuskan. The Park Townhouse Sukoharjo menghadirkan spesifikasi premium yang umumnya hanya ditemukan di perumahan kelas Rp 1.5 Miliar ke atas di Solo Baru murni, kini hadir dengan harga perdana mulai Rp 800 Jutaan.',
    format: 'Carousel Edukasi',
    platform: 'Facebook',
    sourceFactId: 'FACT_PRICE_CASH_KERAS',
    sourceLoveLetterPoint: 88,
    hashtags: ['#KomparasiProperti', '#TownhouseSoloBaru', '#InvestasiCerdas', '#RumahIdaman'],
    cta: 'Dapatkan e-brochure spesifikasi teknis lengkap dengan mengklik tautan di bio.',
  },
  {
    title: 'Akses 12 Menit ke Pusat Belanja & Hiburan The Park Mall Solo Baru',
    brief: 'Reels dinamis memperlihatkan rute perjalanan lancar dari gerbang komplek menuju The Park Mall Solo Baru.',
    caption: 'Menikmati akhir pekan bersama keluarga tidak perlu terjebak macet. Dari pintu rumah Anda di The Park Townhouse, The Park Mall dan Pakuwon Mall Solo Baru dapat dicapai hanya dalam 12 menit perjalanan santai.',
    format: 'Reels / Video Pendek',
    platform: 'Instagram',
    sourceFactId: 'FACT_LOC_THE_PARK_MALL',
    sourceLoveLetterPoint: 2,
    hashtags: ['#TheParkMallSolo', '#PakuwonMallSoloBaru', '#AksesStrategis', '#SoloRaya'],
    cta: 'Ingin mencoba rute surveinya sendiri? Hubungi kami untuk panduan Google Maps langsung.',
  },
];

// 10 Pattern BOFU Blueprints (Urgensi, Promo Cash Keras, Simulasi Cash Bertahap 24 Bulan, KPR Ringan)
const BOFU_BLUEPRINTS: SlotBlueprint[] = [
  {
    title: 'Peluang Terbatas: Sisa Unit Klaster Tokyo Siap Pilih Kavling Hook',
    brief: 'Grafik denah site plan klaster Tokyo dengan tanda unit-unit yang sudah terjual dan posisi kavling hook terbaik yang tersisa.',
    caption: 'Dari total 30 unit butik di The Park Townhouse, klaster tahap 1 kini tersisa beberapa kavling pilihan. Dapatkan posisi kavling hook berhalaman samping ekstra dengan sirkulasi angin terbaik sebelum kehabisan.',
    format: 'Single Image + Visual Quote',
    platform: 'Instagram',
    sourceFactId: 'FACT_UNIT_LUAS',
    sourceLoveLetterPoint: 92,
    hashtags: ['#UnitTerbatas', '#KavlingHook', '#TheParkTownhouse', '#PromoBulanIni'],
    cta: 'Kirim pesan DM atau WhatsApp sekarang untuk mengunci kavling sebelum survei akhir pekan.',
  },
  {
    title: 'Promo Spesial Pelunasan Cash Keras: Diskon Eksklusif & Bebas Biaya',
    brief: 'Desain visual penawaran tunai dengan rincian bonus kanopi carport dan potongan harga pelunasan langsung.',
    caption: 'Miliki aset properti mewah dengan nilai keuntungan maksimal. Dapatkan potongan harga istimewa untuk skema pelunasan Cash Keras serta gratis kanopi carport modern dan smart digital door lock.',
    format: 'Carousel Edukasi',
    platform: 'Facebook',
    sourceFactId: 'FACT_PRICE_CASH_KERAS',
    sourceLoveLetterPoint: 89,
    hashtags: ['#CashKerasDiskon', '#PromoRumahSolo', '#BebasBiaya', '#InvestasiSoloBaru'],
    cta: 'Konsultasikan penawaran harga cash terbaik Anda bersama tim manajemen kami.',
  },
  {
    title: 'Skema Cash Bertahap hingga 24 Bulan Langsung ke Developer Tanpa BI Checking',
    brief: 'Video animasi menjelaskan kemudahan pembayaran bertahap 6, 12, hingga 24 bulan langsung tanpa proses persetujuan bank.',
    caption: 'Bagi Anda para pengusaha atau profesional yang menghendaki fleksibilitas arus kas tanpa birokrasi perbankan, The Park Townhouse menyediakan opsi cicilan in-house langsung developer hingga 24 bulan. Transaksi jelas, aman, dan menenangkan.',
    format: 'Reels / Video Pendek',
    platform: 'TikTok',
    sourceFactId: 'FACT_PRICE_CASH_BERTAHAP',
    sourceLoveLetterPoint: 90,
    hashtags: ['#CashBertahap', '#CicilanTanpaBank', '#DeveloperInHouse', '#PengusahaSolo'],
    cta: 'Dapatkan tabel simulasi cicilan cash bertahap 12 dan 24 bulan via link WhatsApp di bio.',
  },
  {
    title: 'Undangan Private Preview Akhir Pekan Ini: Kopi Santai & Tour Unit',
    brief: 'Poster digital undangan open house eksklusif di kantor pemasaran The Park Townhouse.',
    caption: 'Akhir pekan adalah waktu terbaik untuk membuktikan sendiri kenyamanan lingkungan The Park Townhouse. Kami mengundang Anda dan keluarga untuk menghadiri Private Preview sambil menikmati sajian kopi hangat dan melihat progres konstruksi di lokasi.',
    format: 'Single Image + Visual Quote',
    platform: 'Instagram',
    sourceFactId: 'FACT_FAC_ROAD',
    sourceLoveLetterPoint: 99,
    hashtags: ['#OpenHouseSolo', '#SurveiLokasi', '#WeekendTour', '#TheParkTownhouse'],
    cta: 'Reservasi kedatangan Anda sekarang via WhatsApp agar kami dapat menyiapkan pendampingan pribadi.',
  },
  {
    title: 'Simulasi KPR Ringan: Rumah 2 Lantai Mewah Mulai Rp 5 Jutaan / Bulan',
    brief: 'Tabel simulasi tenor 15 dan 20 tahun bersama bank rekanan BSI, BTN, Mandiri, dan BCA.',
    caption: 'Wujudkan impian memiliki rumah 2 lantai modern di koridor Solo Baru dengan angsuran terjangkau. Tim marketing kami siap mendampingi proses pemberkasan KPR Anda dari awal hingga serah terima kunci.',
    format: 'Carousel Edukasi',
    platform: 'Facebook',
    sourceFactId: 'FACT_PRICE_CASH_BERTAHAP',
    sourceLoveLetterPoint: 91,
    hashtags: ['#KPRSyariah', '#SimulasiKPR', '#RumahPertama', '#BankBTN #BankBSI'],
    cta: 'Ketik "KPR" untuk konsultasi pra-kualifikasi bank gratis tanpa komitmen.',
  },
];

function hashSeed(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h * 31 + str.charCodeAt(i)) >>> 0;
  }
  return h;
}

const MONTH_NAMES_ID = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

export function getWibCalendarInfo(nowMs = Date.now()): {
  todayDate: number;
  daysInMonth: number;
  monthNumber: number;
  year: number;
  monthNameId: string;
  dateStr: string;
} {
  const wib = new Date(nowMs + 7 * 60 * 60 * 1000);
  const year = wib.getUTCFullYear();
  const monthIdx = wib.getUTCMonth();
  const todayDate = wib.getUTCDate();
  const daysInMonth = new Date(Date.UTC(year, monthIdx + 1, 0)).getUTCDate();
  const dateStr = wib.toISOString().slice(0, 10);
  return {
    todayDate,
    daysInMonth,
    monthNumber: monthIdx + 1,
    year,
    monthNameId: MONTH_NAMES_ID[monthIdx] || 'Bulan Ini',
    dateStr,
  };
}

/**
 * Generates slots for totalDays (default 30 for backward-compatible tests, or daysInMonth = 28..31)
 * Optional seedKey (e.g., userEmail) rotates blueprints deterministically per SE account
 * so each Sales Executive receives a unique content schedule.
 */
export function generateContentCalendarSlots(
  track: ContentTrack = 'OFFICIAL',
  seedKey?: string,
  totalDays: number = 30
): ContentSlot[] {
  const slots: ContentSlot[] = [];
  const seed = seedKey ? hashSeed(seedKey.toLowerCase().trim()) : 0;
  const isCustomSe = Boolean(seedKey && track === 'SALES_IN_HOUSE');

  for (let day = 1; day <= totalDays; day++) {
    // Slot 1: TOFU (Pagi - 09:00 WIB)
    const tofuOffset = isCustomSe ? seed % TOFU_BLUEPRINTS.length : 0;
    const tofuIndex = (((day - 1 + tofuOffset) % TOFU_BLUEPRINTS.length) + TOFU_BLUEPRINTS.length) % TOFU_BLUEPRINTS.length;
    const tofu = TOFU_BLUEPRINTS[tofuIndex];
    const s1Done = !isCustomSe && day <= 3;
    slots.push({
      id: `slot-d${day}-s1-${track.toLowerCase()}`,
      dayNumber: day,
      slotOrder: 1,
      scheduledTime: isCustomSe && seed % 2 === 1 ? '08:30 WIB' : '09:00 WIB',
      funnelStage: 'TOFU',
      track,
      platform: tofu.platform,
      format: tofu.format,
      title: track === 'SALES_IN_HOUSE' ? `[POV Sales] ${tofu.title}` : tofu.title,
      brief: track === 'SALES_IN_HOUSE' ? `Sales agent selfie/POV video: ${tofu.brief}` : tofu.brief,
      caption: track === 'SALES_IN_HOUSE'
        ? `Hai teman-teman, banyak yang tanya ke saya: ${tofu.caption} Kalau mau tanya detail, DM saya ya!`
        : tofu.caption,
      hashtags: tofu.hashtags,
      cta: tofu.cta,
      sourceFactId: tofu.sourceFactId,
      sourceLoveLetterPoint: tofu.sourceLoveLetterPoint,
      status: s1Done ? 'SUDAH_POSTING' : 'SIAP',
      postedUrl: s1Done ? `https://instagram.com/p/thepark_d${day}_s1` : undefined,
      postedAt: s1Done ? new Date(Date.now() - (4 - day) * 86400000).toISOString() : undefined,
    });

    // Slot 2: MOFU (Siang/Sore - 14:00 WIB)
    const mofuOffset = isCustomSe ? (seed >>> 2) % MOFU_BLUEPRINTS.length : 0;
    const mofuIndex = (((day - 1 + mofuOffset) % MOFU_BLUEPRINTS.length) + MOFU_BLUEPRINTS.length) % MOFU_BLUEPRINTS.length;
    const mofu = MOFU_BLUEPRINTS[mofuIndex];
    const s2Done = !isCustomSe && day <= 2;
    slots.push({
      id: `slot-d${day}-s2-${track.toLowerCase()}`,
      dayNumber: day,
      slotOrder: 2,
      scheduledTime: isCustomSe && seed % 2 === 1 ? '13:30 WIB' : '14:00 WIB',
      funnelStage: 'MOFU',
      track,
      platform: mofu.platform,
      format: mofu.format,
      title: track === 'SALES_IN_HOUSE' ? `[Tur Lapangan] ${mofu.title}` : mofu.title,
      brief: track === 'SALES_IN_HOUSE' ? `Sales agent live room tour di kavling: ${mofu.brief}` : mofu.brief,
      caption: track === 'SALES_IN_HOUSE'
        ? `Siang ini saya lagi di show unit The Park. ${mofu.caption} Yuk mampir, kopi saya traktir!`
        : mofu.caption,
      hashtags: mofu.hashtags,
      cta: mofu.cta,
      sourceFactId: mofu.sourceFactId,
      sourceLoveLetterPoint: mofu.sourceLoveLetterPoint,
      status: s2Done ? 'SUDAH_POSTING' : 'SIAP',
      postedUrl: s2Done ? `https://tiktok.com/@theparksukoharjo/video/d${day}_s2` : undefined,
      postedAt: s2Done ? new Date(Date.now() - (4 - day) * 86400000).toISOString() : undefined,
    });

    // Slot 3: BOFU (Malam - 19:30 WIB)
    const bofuOffset = isCustomSe ? (seed >>> 4) % BOFU_BLUEPRINTS.length : 0;
    const bofuIndex = (((day - 1 + bofuOffset) % BOFU_BLUEPRINTS.length) + BOFU_BLUEPRINTS.length) % BOFU_BLUEPRINTS.length;
    const bofu = BOFU_BLUEPRINTS[bofuIndex];
    const s3Done = !isCustomSe && day === 1;
    slots.push({
      id: `slot-d${day}-s3-${track.toLowerCase()}`,
      dayNumber: day,
      slotOrder: 3,
      scheduledTime: isCustomSe && seed % 2 === 1 ? '19:00 WIB' : '19:30 WIB',
      funnelStage: 'BOFU',
      track,
      platform: bofu.platform,
      format: bofu.format,
      title: track === 'SALES_IN_HOUSE' ? `[Pesan Khusus] ${bofu.title}` : bofu.title,
      brief: track === 'SALES_IN_HOUSE' ? `Panggilan langsung dari sales agent untuk amankan kavling: ${bofu.brief}` : bofu.brief,
      caption: track === 'SALES_IN_HOUSE'
        ? `Malam bapak/ibu, kuota promo unit pilihan tinggal sedikit nih. ${bofu.caption} Langsung WA saya ya.`
        : bofu.caption,
      hashtags: bofu.hashtags,
      cta: bofu.cta,
      sourceFactId: bofu.sourceFactId,
      sourceLoveLetterPoint: bofu.sourceLoveLetterPoint,
      status: s3Done ? 'SUDAH_POSTING' : 'SIAP',
      postedUrl: s3Done ? `https://instagram.com/p/thepark_d1_s3` : undefined,
      postedAt: s3Done ? new Date(Date.now() - 3 * 86400000).toISOString() : undefined,
    });
  }

  return slots;
}

export function createDefaultContentCalendar(
  projectId: string = 'proj-the-park-01',
  projectName: string = 'The Park Townhouse Sukoharjo',
  version: number = 1
): ContentCalendarPlan {
  const officialSlots = generateContentCalendarSlots('OFFICIAL');
  const postedCount = officialSlots.filter((s) => s.status === 'SUDAH_POSTING').length;

  return {
    id: `calendar-${projectId}-v${version}`,
    projectId,
    projectName,
    version,
    monthPeriod: 'Bulan ke-1 Peluncuran Klaster',
    activePlatforms: ['Instagram', 'TikTok', 'Facebook', 'X', 'YouTube Shorts'],
    hasSalesTrack: true,
    slots: officialSlots,
    totalSlots: officialSlots.length,
    postedSlotsCount: postedCount,
    generatedAt: new Date().toISOString(),
    tokensUsed: 1680,
  };
}

// In-memory calendar store
const calendarStore = new Map<string, Map<number, ContentCalendarPlan>>();
calendarStore.set('proj-the-park-01', new Map([[1, createDefaultContentCalendar()]]));
calendarStore.set('the-park-sukoharjo', new Map([[1, createDefaultContentCalendar()]]));

export function getContentCalendar(
  projectId: string,
  version?: number,
  isDemoMode: boolean = false
): ContentCalendarPlan | null {
  const projMap = calendarStore.get(projectId);
  if (!projMap || projMap.size === 0) {
    // Proyek belum memiliki kalender konten
    return null;
  }

  let plan: ContentCalendarPlan;
  if (version && projMap.has(version)) {
    plan = structuredClone(projMap.get(version)!);
  } else {
    const maxVer = Math.max(...Array.from(projMap.keys()));
    plan = structuredClone(projMap.get(maxVer)!);
  }

  if (isDemoMode) {
    return applyCalendarTeaser(plan);
  }

  return plan;
}

export function initProjectCalendar(projectId: string): ContentCalendarPlan {
  const newPlan = createDefaultContentCalendar(projectId);
  calendarStore.set(projectId, new Map([[1, newPlan]]));
  return newPlan;
}

/**
 * Truncate to first 7-8 days (25%) in Demo mode.
 */
export function applyCalendarTeaser(plan: ContentCalendarPlan): ContentCalendarPlan {
  const teaserSlots = plan.slots.filter((s) => s.dayNumber <= 8);
  return {
    ...plan,
    slots: teaserSlots,
    totalSlots: teaserSlots.length,
  };
}

/**
 * Updates a slot status and posted URL.
 */
export function updateSlotPosting(
  projectId: string,
  slotId: string,
  postedUrl: string,
  status: 'SUDAH_POSTING' | 'SIAP' = 'SUDAH_POSTING'
): ContentSlot | null {
  const projMap = calendarStore.get(projectId);
  if (!projMap) return null;

  const maxVer = Math.max(...Array.from(projMap.keys()));
  const plan = projMap.get(maxVer);
  if (!plan) return null;

  const slot = plan.slots.find((s) => s.id === slotId);
  if (!slot) return null;

  slot.postedUrl = postedUrl;
  slot.status = status;
  slot.postedAt = new Date().toISOString();
  plan.postedSlotsCount = plan.slots.filter((s) => s.status === 'SUDAH_POSTING').length;

  return slot;
}
