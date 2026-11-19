import { describe, expect, it } from 'bun:test';
import { THE_PARK_KB_FACTS } from '../src/lib/kb/the-park-facts';
import { askProductKnowledge, KB_20_ACCEPTANCE_TESTS } from '../src/lib/kb/qa-engine';
import { gradeQuiz, PRODUCT_QUIZ_QUESTIONS } from '../src/lib/kb/quiz-engine';

describe('Fase 1A: Product Knowledge Base & Tanya Produk Engine', () => {
  it('KB The Park harus memiliki fakta terverifikasi lengkap', () => {
    expect(THE_PARK_KB_FACTS.length).toBeGreaterThanOrEqual(20);
    expect(THE_PARK_KB_FACTS.every(f => f.fact_id && f.source_citation)).toBe(true);
  });

  it('Lolos 20 Pertanyaan Uji Penerimaan Fase 1A (15 Terjawab Bersumber & 5 Di Luar Data)', () => {
    expect(KB_20_ACCEPTANCE_TESTS.length).toBe(20);

    KB_20_ACCEPTANCE_TESTS.forEach(testCase => {
      const result = askProductKnowledge(testCase.q, false);
      expect(result.answer).toContain(testCase.expectedIncludes);
      expect(result.foundInKb).toBe(testCase.expectFound);

      if (testCase.expectFound) {
        expect(result.source_citation).toBeDefined();
        expect(result.isOutOfScope).toBe(false);
      } else {
        expect(result.isOutOfScope).toBe(true);
      }
    });
  });

  it('Versi publik di website hanya memakai fakta yang memiliki flag boleh_publik = true', () => {
    const publicResult = askProductKnowledge("Berapa harga tipe Diamond?", true);
    expect(publicResult.foundInKb).toBe(true);
    expect(publicResult.answer).toContain("830.000.000");
  });

  it('Kuis Produk SE Baru: memiliki 10 soal dan menghitung kelulusan minimal 80%', () => {
    expect(PRODUCT_QUIZ_QUESTIONS.length).toBe(10);

    // Simulasi 10 jawaban benar (skor 100)
    const allCorrectAnswers: { [qId: number]: number } = {};
    PRODUCT_QUIZ_QUESTIONS.forEach(q => {
      allCorrectAnswers[q.id] = q.correctOptionIndex;
    });

    const perfectScore = gradeQuiz(allCorrectAnswers);
    expect(perfectScore.score).toBe(100);
    expect(perfectScore.passed).toBe(true);

    // Simulasi hanya 6 jawaban benar (skor 60) -> Gagal / Remedial
    const failingAnswers: { [qId: number]: number } = {};
    PRODUCT_QUIZ_QUESTIONS.forEach((q, idx) => {
      failingAnswers[q.id] = idx < 6 ? q.correctOptionIndex : (q.correctOptionIndex + 1) % 4;
    });

    const failingScore = gradeQuiz(failingAnswers);
    expect(failingScore.score).toBe(60);
    expect(failingScore.passed).toBe(false);
  });
});
