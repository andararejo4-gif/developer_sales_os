import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { sql } from './db';

const execFileAsync = promisify(execFile);

export interface ExtractedPage {
  page: number;
  method: 'text' | 'ocr' | 'sheet';
  confidence: number;
  markdown: string;
}

export interface ParsedUnitRow {
  unitCode: string;
  ltSqm?: number;
  lbSqm?: number;
  priceCash?: number;
  priceKpr?: number;
  monthlyInstallment?: number;
  pageNumber: number;
}

export async function ensureTruthTables(): Promise<void> {
  await sql`
    CREATE TABLE IF NOT EXISTS sales_os.source_documents (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id TEXT NOT NULL DEFAULT 'andara_rejo_makmur',
      project_id TEXT NOT NULL DEFAULT 'the-park-sukoharjo',
      doc_type TEXT NOT NULL DEFAULT 'pricelist',
      filename TEXT NOT NULL,
      file_hash TEXT NOT NULL,
      version INTEGER NOT NULL DEFAULT 1,
      effective_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      expiry_at TIMESTAMPTZ,
      status TEXT NOT NULL DEFAULT 'active',
      extracted_markdown TEXT,
      uploaded_by TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS sales_os.evidence_facts (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      document_id UUID NOT NULL REFERENCES sales_os.source_documents(id) ON DELETE CASCADE,
      tenant_id TEXT NOT NULL,
      project_id TEXT NOT NULL,
      page_number INTEGER NOT NULL DEFAULT 1,
      unit_code TEXT,
      fact_key TEXT NOT NULL,
      fact_value TEXT NOT NULL,
      confidence NUMERIC(4, 3) NOT NULL DEFAULT 1.000,
      extraction_method TEXT NOT NULL DEFAULT 'text',
      status TEXT NOT NULL DEFAULT 'active',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS sales_os.truth_conflicts (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id TEXT NOT NULL,
      project_id TEXT NOT NULL,
      document_id UUID REFERENCES sales_os.source_documents(id) ON DELETE SET NULL,
      unit_code TEXT,
      fact_key TEXT NOT NULL,
      old_value TEXT,
      new_value TEXT NOT NULL,
      question_for_pic TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'open',
      resolved_by TEXT,
      resolution_note TEXT,
      resolved_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS sales_os.ai_central_knowledge (
      tenant_id TEXT NOT NULL,
      project_id TEXT NOT NULL,
      title TEXT NOT NULL DEFAULT 'Master Knowledge AI Terpusat',
      master_markdown TEXT NOT NULL DEFAULT '',
      source_doc_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
      version INTEGER NOT NULL DEFAULT 1,
      updated_by TEXT,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (tenant_id, project_id)
    )
  `;
}

export async function runPythonExtractor(filePath: string): Promise<{
  ok: boolean;
  method?: string;
  pages?: ExtractedPage[];
  error?: string;
}> {
  const pythonBin = process.env.POSTER_PYTHON || process.env.PYTHON_BIN || 'python';
  const scriptPath = path.join(process.cwd(), 'server', 'doc-extractor.py');
  try {
    const { stdout } = await execFileAsync(pythonBin, [scriptPath, filePath], {
      maxBuffer: 15 * 1024 * 1024,
      timeout: 90_000,
    });
    return JSON.parse(stdout);
  } catch (err: unknown) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Gagal menjalankan doc-extractor.py',
    };
  }
}

/**
 * LLM hanya membaca Markdown hasil ekstrak (bukan PDF/gambar mentah)
 * untuk memetakan ke JSON terstruktur, lalu divalidasi kode.
 */
async function structureMarkdownWithLlm(pages: ExtractedPage[]): Promise<ParsedUnitRow[]> {
  const apiKey = process.env.AI_ROUTER_API_KEY;
  const apiUrl = (process.env.AI_ROUTER_URL || 'https://9router.giivepro.com/v1').replace(/\/$/, '');
  const model = process.env.AI_ROUTER_MODEL || 'andararejomakmurjosjis';

  if (!apiKey) return [];

  const combinedMd = pages
    .map((p) => `--- HALAMAN ${p.page} (${p.method}) ---\n${p.markdown}`)
    .join('\n\n')
    .slice(0, 24000);

  const prompt = `Tugas: Ekstrak daftar unit properti & harga dari teks Markdown hasil OCR/tabel berikut.
Aturan keras:
1. Jangan mengarang angka. Jika tidak tertulis, isi null.
2. Bedakan HARGA JUAL (biasanya ratusan juta, misal 650000000) dengan CICILAN BULANAN (biasanya jutaan, misal 4500000).
3. Balas HANYA JSON array valid: [{"unitCode":"A1","ltSqm":72,"lbSqm":60,"priceCash":650000000,"priceKpr":683000000,"monthlyInstallment":null,"pageNumber":1}]

Teks Sumber:
${combinedMd}`;

  try {
    const resp = await fetch(`${apiUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.1,
        messages: [{ role: 'user', content: prompt }],
      }),
    });
    if (!resp.ok) return [];
    const json = (await resp.json()) as any;
    const content = String(json?.choices?.[0]?.message?.content || '').trim();
    const match = content.match(/\[[\s\S]*\]/);
    if (!match) return [];
    const parsed = JSON.parse(match[0]) as ParsedUnitRow[];
    // Validasi deterministik (F02): harga rumah tidak boleh < Rp100 juta (cegah cicilan terbaca harga jual)
    return parsed
      .filter((r) => r && r.unitCode)
      .map((r) => ({
        ...r,
        priceCash: r.priceCash && r.priceCash >= 100_000_000 ? Math.round(r.priceCash) : undefined,
        priceKpr: r.priceKpr && r.priceKpr >= 100_000_000 ? Math.round(r.priceKpr) : undefined,
      }));
  } catch {
    return [];
  }
}

export async function ingestSourceDocument(params: {
  tenantId: string;
  projectId: string;
  docType: string;
  filename: string;
  fileBuffer: Buffer;
  uploadedBy: string;
}) {
  const fileHash = crypto.createHash('sha256').update(params.fileBuffer).digest('hex');
  const tmpDir = path.join(process.cwd(), 'tmp_uploads');
  await fs.mkdir(tmpDir, { recursive: true });
  const safeName = `${Date.now()}_${path.basename(params.filename).replace(/[^a-zA-Z0-9._-]/g, '_')}`;
  const tmpPath = path.join(tmpDir, safeName);

  await fs.writeFile(tmpPath, params.fileBuffer);
  let extractRes;
  try {
    extractRes = await runPythonExtractor(tmpPath);
  } finally {
    await fs.unlink(tmpPath).catch(() => {});
  }

  if (!extractRes.ok || !extractRes.pages) {
    return { ok: false as const, error: extractRes.error || 'Ekstraksi dokumen gagal.' };
  }

  const prevVersions = await sql`
    SELECT COALESCE(MAX(version), 0) AS max_ver
    FROM sales_os.source_documents
    WHERE tenant_id = ${params.tenantId} AND project_id = ${params.projectId} AND doc_type = ${params.docType}
  `;
  const nextVersion = Number(prevVersions[0]?.max_ver || 0) + 1;

  const fullMd = extractRes.pages.map((p) => `## Halaman ${p.page}\n${p.markdown}`).join('\n\n');
  const docRows = await sql`
    INSERT INTO sales_os.source_documents (
      tenant_id, project_id, doc_type, filename, file_hash, version, extracted_markdown, uploaded_by
    ) VALUES (
      ${params.tenantId}, ${params.projectId}, ${params.docType}, ${params.filename},
      ${fileHash}, ${nextVersion}, ${fullMd}, ${params.uploadedBy}
    )
    RETURNING *
  `;
  const doc = docRows[0];

  const structuredUnits = await structureMarkdownWithLlm(extractRes.pages);
  let conflictsCreated = 0;

  for (const item of structuredUnits) {
    const pageMeta = extractRes.pages.find((p) => p.page === item.pageNumber) || extractRes.pages[0];
    if (item.priceCash) {
      await sql`
        INSERT INTO sales_os.evidence_facts (
          document_id, tenant_id, project_id, page_number, unit_code, fact_key, fact_value, confidence, extraction_method
        ) VALUES (
          ${doc.id}::uuid, ${params.tenantId}, ${params.projectId}, ${item.pageNumber || 1},
          ${item.unitCode}, 'price_cash', ${String(item.priceCash)}, ${pageMeta?.confidence || 0.9}, ${pageMeta?.method || 'text'}
        )
      `;

      // Cek konflik terhadap harga aktif di project_units (F05)
      const activeUnits = await sql`
        SELECT id, price_cash FROM sales_os.project_units
        WHERE tenant_id = ${params.tenantId} AND project_id = ${params.projectId} AND unit_code = ${item.unitCode}
        LIMIT 1
      `;
      if (activeUnits.length > 0 && Number(activeUnits[0].price_cash) !== item.priceCash) {
        await sql`
          INSERT INTO sales_os.truth_conflicts (
            tenant_id, project_id, document_id, unit_code, fact_key, old_value, new_value, question_for_pic
          ) VALUES (
            ${params.tenantId}, ${params.projectId}, ${doc.id}::uuid, ${item.unitCode}, 'price_cash',
            ${String(activeUnits[0].price_cash)}, ${String(item.priceCash)},
            ${`Harga Cash unit ${item.unitCode} di ${params.filename} (hal ${item.pageNumber}) adalah Rp${item.priceCash.toLocaleString('id-ID')}, berbeda dari harga aktif Rp${Number(activeUnits[0].price_cash).toLocaleString('id-ID')}. Perbarui harga & tandai materi lama stale?`}
          )
        `;
        conflictsCreated++;
      }
    }
  }

  return {
    ok: true as const,
    document: doc,
    pagesExtracted: extractRes.pages.length,
    unitsParsed: structuredUnits.length,
    conflictsCreated,
    pages: extractRes.pages,
  };
}

export async function getCentralAiKnowledge(tenantId: string, projectId: string) {
  const rows = await sql`
    SELECT tenant_id, project_id, title, master_markdown, source_doc_ids, version, updated_by, updated_at
    FROM sales_os.ai_central_knowledge
    WHERE tenant_id = ${tenantId} AND project_id = ${projectId}
    LIMIT 1
  `;
  if (rows[0]) {
    return {
      title: String(rows[0].title || 'Master Knowledge AI Terpusat'),
      masterMarkdown: String(rows[0].master_markdown || ''),
      sourceDocIds: Array.isArray(rows[0].source_doc_ids) ? rows[0].source_doc_ids : [],
      version: Number(rows[0].version || 1),
      updatedBy: rows[0].updated_by ? String(rows[0].updated_by) : null,
      updatedAt: rows[0].updated_at ? String(rows[0].updated_at) : null,
    };
  }
  const activeDocs = await sql`
    SELECT id, filename, doc_type, extracted_markdown
    FROM sales_os.source_documents
    WHERE tenant_id = ${tenantId} AND project_id = ${projectId} AND status = 'active'
    ORDER BY created_at ASC
  `;
  const combined = activeDocs
    .map((d: any) => `# [${String(d.doc_type).toUpperCase()}] ${d.filename}\n\n${d.extracted_markdown || ''}`)
    .join('\n\n---\n\n');
  return {
    title: 'Master Knowledge AI Terpusat',
    masterMarkdown: combined,
    sourceDocIds: activeDocs.map((d: any) => String(d.id)),
    version: 1,
    updatedBy: null,
    updatedAt: null,
  };
}

export async function rebuildCentralKnowledgeFromDocs(
  tenantId: string,
  projectId: string,
  actorEmail: string
) {
  const activeDocs = await sql`
    SELECT id, filename, doc_type, version, extracted_markdown
    FROM sales_os.source_documents
    WHERE tenant_id = ${tenantId} AND project_id = ${projectId} AND status = 'active'
    ORDER BY created_at ASC
  `;
  const combined = activeDocs
    .map(
      (d: any) =>
        `# [${String(d.doc_type).toUpperCase()} v${d.version}] ${d.filename}\n\n${d.extracted_markdown || ''}`
    )
    .join('\n\n---\n\n');
  const docIds = activeDocs.map((d: any) => String(d.id));

  const saved = await sql`
    INSERT INTO sales_os.ai_central_knowledge (
      tenant_id, project_id, title, master_markdown, source_doc_ids, version, updated_by, updated_at
    ) VALUES (
      ${tenantId}, ${projectId}, 'Master Knowledge AI Terpusat', ${combined}, ${JSON.stringify(docIds)}::jsonb, 1, ${actorEmail}, NOW()
    )
    ON CONFLICT (tenant_id, project_id) DO UPDATE SET
      master_markdown = EXCLUDED.master_markdown,
      source_doc_ids = EXCLUDED.source_doc_ids,
      version = sales_os.ai_central_knowledge.version + 1,
      updated_by = EXCLUDED.updated_by,
      updated_at = NOW()
    RETURNING *
  `;
  return saved[0];
}

export async function saveCentralAiKnowledge(params: {
  tenantId: string;
  projectId: string;
  title?: string;
  masterMarkdown: string;
  updatedBy: string;
}) {
  const title = (params.title || 'Master Knowledge AI Terpusat').trim();
  const saved = await sql`
    INSERT INTO sales_os.ai_central_knowledge (
      tenant_id, project_id, title, master_markdown, version, updated_by, updated_at
    ) VALUES (
      ${params.tenantId}, ${params.projectId}, ${title}, ${params.masterMarkdown}, 1, ${params.updatedBy}, NOW()
    )
    ON CONFLICT (tenant_id, project_id) DO UPDATE SET
      title = EXCLUDED.title,
      master_markdown = EXCLUDED.master_markdown,
      version = sales_os.ai_central_knowledge.version + 1,
      updated_by = EXCLUDED.updated_by,
      updated_at = NOW()
    RETURNING *
  `;
  return saved[0];
}
