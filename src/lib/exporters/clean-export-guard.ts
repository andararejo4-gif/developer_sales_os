// ============================================================================
// CLEAN EXPORT GUARD - DEVELOPER SALES OS
// Strict validation ensuring AI token counts, costs, and internal prompts
// NEVER leak into consumer-facing DOCX, HTML, or PDF documents.
// ============================================================================

export const FORBIDDEN_EXPORT_TERMS = [
  'token_used',
  'tokens_used',
  'tokens used',
  'input_tokens',
  'output_tokens',
  'model_used',
  'gemini-1.5',
  'prompt_used',
  'ai_usage',
  'biaya token',
  'cost per 1k',
];

/**
 * Validates that an exported document string or text buffer contains no token leakage.
 */
export function assertNoTokenLeakage(content: string, documentName: string = 'export'): void {
  const lower = content.toLowerCase();
  for (const term of FORBIDDEN_EXPORT_TERMS) {
    if (lower.includes(term)) {
      throw new Error(
        `Pelanggaran Aturan Fase 2: Dokumen "${documentName}" mengandung metadata internal token/AI ("${term}") yang dilarang untuk konsumen!`
      );
    }
  }
}
