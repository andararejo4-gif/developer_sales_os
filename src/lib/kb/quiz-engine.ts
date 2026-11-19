// Kuis Pengetahuan Produk untuk SE Baru (10 Soal Pilihan Ganda dari Knowledge Base)

export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctOptionIndex: number;
  explanation: string;
  source_citation: string;
}

export const PRODUCT_QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 1,
    question: "Apa konsep arsitektur utama yang diusung oleh The Park Townhouse Sukoharjo?",
    options: [
      "Modern Klasik Eropa Mediterania",
      "Modern Kontemporer Jepang Zen Tropis",
      "Minimalis Industri Bata Ekspos",
      "Rumah Joglo Tradisional Jawa"
    ],
    correctOptionIndex: 1,
    explanation: "Sesuai Brosur Hal. 2, perumahan mengadopsi konsep Modern Kontemporer Jepang Bernuansa Zen Tropis.",
    source_citation: "Brosur Resmi Hal. 2"
  },
  {
    id: 2,
    question: "Berapa tipe unit dan jumlah lantai pada Cluster Nagoya?",
    options: [
      "Tipe Gold 60/72 (1 Lantai)",
      "Tipe Emerald 50/60 (1 Lantai)",
      "Tipe Diamond 75/90 (2 Lantai, 3 Kamar Tidur)",
      "Tipe Villa 120/150 (3 Lantai)"
    ],
    correctOptionIndex: 2,
    explanation: "Cluster Nagoya mengusung Tipe Diamond 75/90 dengan 2 lantai dan 3 kamar tidur.",
    source_citation: "Pricelist Hal. 1 & Denah Arsitektur"
  },
  {
    id: 3,
    question: "Berapa harga tunai (cash keras) untuk Tipe Emerald di Cluster Tokyo?",
    options: [
      "Rp 450.000.000",
      "Rp 580.000.000",
      "Rp 670.000.000",
      "Rp 830.000.000"
    ],
    correctOptionIndex: 1,
    explanation: "Harga cash keras Tipe Emerald 50/60 tercatat Rp 580.000.000.",
    source_citation: "Pricelist Resmi Hal. 1"
  },
  {
    id: 4,
    question: "Berapa estimasi jarak dan waktu tempuh menuju RSUD Ir. Soekarno Sukoharjo?",
    options: [
      "sekitar 12 km (25 menit)",
      "sekitar 7.5 km (15 menit)",
      "sekitar 2.1 km (sekitar 6 menit berkendara)",
      "sekitar 500 meter (jalan kaki 2 menit)"
    ],
    correctOptionIndex: 2,
    explanation: "RSUD Ir. Soekarno berada di radius sekitar 2.1 km atau 6 menit berkendara dari gerbang perumahan.",
    source_citation: "Brosur Hal. 4 & OpenStreetMap"
  },
  {
    id: 5,
    question: "Berapa lama pilihan cash bertahap (cash tempo) yang difasilitasi langsung oleh developer tanpa bank?",
    options: [
      "Hanya 3 bulan",
      "6, 12, hingga 24 bulan",
      "Maksimal 5 tahun",
      "Tidak ada opsi cash tempo"
    ],
    correctOptionIndex: 1,
    explanation: "Developer memfasilitasi cicilan cash tempo 6, 12, hingga 24 bulan langsung tanpa pihak bank.",
    source_citation: "Pricelist Resmi Ketentuan Pembayaran"
  },
  {
    id: 6,
    question: "Bagaimana kepastian status legalitas sertifikat per unit di The Park Townhouse Sukoharjo?",
    options: [
      "Masih sertifikat induk belum terbagi",
      "Sertifikat Hak Milik (SHM) sudah pecah per unit",
      "Hanya Hak Guna Bangunan (HGB) kawasan",
      "Surat Girik Letter C"
    ],
    correctOptionIndex: 1,
    explanation: "Setiap kavling sudah memiliki Sertifikat Hak Milik (SHM) yang sudah pecah per unit.",
    source_citation: "Dokumen Legalitas Pengembang"
  },
  {
    id: 7,
    question: "Berapa ketinggian plafon (high ceiling) di ruang utama?",
    options: [
      "2,8 meter",
      "3,0 meter",
      "3,8 meter",
      "4,5 meter"
    ],
    correctOptionIndex: 2,
    explanation: "Ketinggian plafon ruang utama mencapai 3,8 meter untuk sirkulasi udara dingin optimal.",
    source_citation: "Brosur Arsitektur Hal. 3"
  },
  {
    id: 8,
    question: "Bagaimana penataan instalasi utilitas kelistrikan dan drainase di perumahan?",
    options: [
      "Tiang listrik kabel udara di sepanjang jalan",
      "Underground utilities (kabel listrik & drainase tertutup)",
      "Drainase terbuka di pinggir jalan paving",
      "Generator komunal diesel"
    ],
    correctOptionIndex: 1,
    explanation: "Kawasan menggunakan sistem underground utilities sehingga rapi bebas kabel menggantung.",
    source_citation: "Brosur Kawasan Hal. 6"
  },
  {
    id: 9,
    question: "Berapa kapasitas daya listrik PLN standar per unit?",
    options: [
      "900 VA",
      "1.300 VA",
      "2.200 VA",
      "3.500 VA"
    ],
    correctOptionIndex: 2,
    explanation: "Setiap unit disuplai daya listrik PLN 2.200 VA saluran bawah tanah.",
    source_citation: "Brosur Spesifikasi Teknis Hal. 5"
  },
  {
    id: 10,
    question: "Berapa jarak tempuh menuju pusat gaya hidup Solo Baru (The Park Mall & Pakuwon Mall)?",
    options: [
      "sekitar 8.5 km (sekitar 12-13 menit berkendara)",
      "sekitar 25 km (45 menit)",
      "sekitar 1.5 km (3 menit)",
      "sekitar 18 km (30 menit)"
    ],
    correctOptionIndex: 0,
    explanation: "The Park Mall dan Pakuwon Mall Solo Baru dapat dicapai dalam waktu sekitar 12 menit (8.5 km).",
    source_citation: "Brosur Hal. 4 & OpenStreetMap"
  }
];

export function gradeQuiz(answers: { [questionId: number]: number }): {
  score: number;
  total: number;
  correctCount: number;
  passed: boolean;
  results: { questionId: number; correct: boolean; explanation: string }[];
} {
  let correctCount = 0;
  const results = PRODUCT_QUIZ_QUESTIONS.map(q => {
    const selected = answers[q.id];
    const isCorrect = selected === q.correctOptionIndex;
    if (isCorrect) correctCount++;
    return {
      questionId: q.id,
      correct: isCorrect,
      explanation: q.explanation
    };
  });

  const score = Math.round((correctCount / PRODUCT_QUIZ_QUESTIONS.length) * 100);
  return {
    score,
    total: PRODUCT_QUIZ_QUESTIONS.length,
    correctCount,
    passed: score >= 80, // Lulus minimal 80
    results
  };
}
