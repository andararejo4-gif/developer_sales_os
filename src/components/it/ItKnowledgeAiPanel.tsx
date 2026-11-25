import React, { useCallback, useEffect, useState } from 'react';
import {
  Brain,
  Upload,
  FileText,
  Save,
  RefreshCw,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  ScanText,
} from 'lucide-react';
import { loadAuthSession } from '../../lib/auth/dummy-accounts';

interface SourceDocRow {
  id: string;
  doc_type: string;
  filename: string;
  version: number;
  status: string;
  extracted_markdown?: string;
  uploaded_by: string;
  created_at: string;
}

interface TruthConflictRow {
  id: string;
  unit_code: string | null;
  fact_key: string;
  old_value: string | null;
  new_value: string;
  question_for_pic: string;
  status: string;
}

interface ItKnowledgeAiPanelProps {
  projectId: string;
  projectName: string;
}

function getAuthHeaders(): HeadersInit {
  const session = loadAuthSession();
  return {
    'Content-Type': 'application/json',
    ...(session?.token ? { Authorization: `Bearer ${session.token}` } : {}),
  };
}

export const ItKnowledgeAiPanel: React.FC<ItKnowledgeAiPanelProps> = ({
  projectId,
  projectName,
}) => {
  const [title, setTitle] = useState('Master Knowledge AI Terpusat');
  const [masterMarkdown, setMasterMarkdown] = useState('');
  const [version, setVersion] = useState(1);
  const [updatedBy, setUpdatedBy] = useState<string | null>(null);
  const [documents, setDocuments] = useState<SourceDocRow[]>([]);
  const [conflicts, setConflicts] = useState<TruthConflictRow[]>([]);

  const [docType, setDocType] = useState('brosur_pdf');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const showToastMsg = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const loadKnowledge = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/it/knowledge-ai?projectId=${encodeURIComponent(projectId)}`, {
        credentials: 'include',
        headers: getAuthHeaders(),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setError(json.error || 'Gagal memuat Knowledge AI.');
        return;
      }
      if (json.central) {
        setTitle(json.central.title || 'Master Knowledge AI Terpusat');
        setMasterMarkdown(json.central.masterMarkdown || '');
        setVersion(Number(json.central.version || 1));
        setUpdatedBy(json.central.updatedBy || null);
      }
      setDocuments(Array.isArray(json.documents) ? json.documents : []);
      setConflicts(Array.isArray(json.conflicts) ? json.conflicts : []);
    } catch {
      setError('Gagal terhubung ke server.');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadKnowledge();
  }, [loadKnowledge]);

  const handleUploadOcr = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setError('Pilih file brosur PDF, gambar (JPG/PNG), atau Excel/CSV terlebih dahulu.');
      return;
    }
    setUploading(true);
    setError(null);
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ''));
        reader.onerror = () => reject(new Error('Gagal membaca file'));
        reader.readAsDataURL(selectedFile);
      });

      const res = await fetch('/api/it/knowledge-ai/upload', {
        method: 'POST',
        credentials: 'include',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          projectId,
          docType,
          filename: selectedFile.name,
          contentBase64: base64,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setError(json.error || 'Gagal mengekstrak file dengan OCR lokal.');
        return;
      }
      setSelectedFile(null);
      await loadKnowledge();
      showToastMsg(
        `Berhasil ekstrak ${json.pagesExtracted || 1} halaman via OCR lokal & digabung ke Master Knowledge AI!`
      );
    } catch {
      setError('Gagal mengunggah atau menjalankan OCR lokal.');
    } finally {
      setUploading(false);
    }
  };

  const handleSaveMaster = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/it/knowledge-ai', {
        method: 'PUT',
        credentials: 'include',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          projectId,
          title,
          masterMarkdown,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setError(json.error || 'Gagal menyimpan Master Knowledge AI.');
        return;
      }
      setVersion(Number(json.central?.version || version + 1));
      showToastMsg('Master Knowledge AI Terpusat berhasil disimpan & aktif untuk AI!');
    } catch {
      setError('Gagal terhubung ke server.');
    } finally {
      setSaving(false);
    }
  };

  const handleRebuild = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/it/knowledge-ai/rebuild', {
        method: 'POST',
        credentials: 'include',
        headers: getAuthHeaders(),
        body: JSON.stringify({ projectId }),
      });
      if (res.ok) {
        await loadKnowledge();
        showToastMsg('Master Knowledge AI di-rebuild ulang dari seluruh dokumen aktif.');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteDoc = async (docId: string) => {
    const res = await fetch(
      `/api/it/knowledge-ai/document?id=${encodeURIComponent(docId)}&projectId=${encodeURIComponent(projectId)}`,
      {
        method: 'DELETE',
        credentials: 'include',
        headers: getAuthHeaders(),
      }
    );
    if (res.ok) {
      await loadKnowledge();
      showToastMsg('Dokumen sumber dihapus & Master Knowledge AI diperbarui.');
    }
  };

  return (
    <section id="knowledge-ai" className="bg-white border border-warmborder rounded-2xl p-6 shadow-sm space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-warmborder">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-espresso text-amber-400">
            <Brain className="size-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-extrabold text-espresso">
                Knowledge AI Terpusat (Divisi IT)
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-olive/10 text-olive text-[11px] font-bold border border-olive/20">
                1 Sumber Data · v{version}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-amber-50 text-terracotta text-[11px] font-bold border border-amber-200 inline-flex items-center gap-1">
                <ScanText className="size-3" /> RapidOCR + PyMuPDF Lokal
              </span>
            </div>
            <p className="text-xs text-warmmuted mt-0.5">
              {projectName} · Kelola 1 data knowledge terpusat yang wajib dipahami AI. Unggah brosur PDF/gambar atau edit langsung.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleRebuild}
            disabled={saving}
            className="px-3 py-2 rounded-xl bg-sandstone hover:bg-warmborder text-espresso text-xs font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="size-3.5" /> Gabung Ulang dari Dokumen
          </button>
          <button
            type="button"
            onClick={handleSaveMaster}
            disabled={saving}
            className="px-4 py-2 rounded-xl bg-terracotta hover:bg-terracotta/90 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Save className="size-3.5" /> {saving ? 'Menyimpan...' : 'Simpan Master Knowledge'}
          </button>
        </div>
      </div>

      {toast && (
        <div className="p-3 rounded-xl bg-olive/10 border border-olive/30 text-olive text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="size-4" /> {toast}
        </div>
      )}
      {error && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
          {error}
        </div>
      )}

      {/* Upload Brosur PDF / Gambar / Excel -> OCR Lokal */}
      <form
        onSubmit={handleUploadOcr}
        className="bg-sandstone/50 border border-warmborder rounded-2xl p-4 space-y-3"
      >
        <div className="text-xs font-extrabold text-espresso flex items-center gap-2">
          <Upload className="size-4 text-terracotta" /> Unggah Brosur PDF / Gambar / Pricelist (Ekstrak Otomatis via OCR Lokal)
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end text-xs">
          <div className="sm:col-span-3">
            <label className="font-bold text-espresso block mb-1">Kategori Dokumen</label>
            <select
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-warmborder bg-white text-espresso font-bold"
            >
              <option value="brosur_pdf">Brosur Proyek (PDF / Gambar)</option>
              <option value="pricelist">Pricelist &amp; Spesifikasi Unit</option>
              <option value="faq_produk">FAQ &amp; Keunggulan Produk</option>
              <option value="legalitas_kpr">Legalitas &amp; Syarat KPR</option>
              <option value="promo">Promo &amp; Skema Bayar</option>
            </select>
          </div>
          <div className="sm:col-span-6">
            <label className="font-bold text-espresso block mb-1">
              File Sumber (PDF, PNG/JPG, XLSX/CSV · Maks 20 MB)
            </label>
            <input
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.webp,.xlsx,.xls,.csv"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              className="w-full text-xs text-warmmuted file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:bg-espresso file:text-white file:font-bold"
            />
          </div>
          <div className="sm:col-span-3 flex justify-end">
            <button
              type="submit"
              disabled={uploading}
              className="w-full h-10 px-4 rounded-xl bg-espresso hover:bg-espresso/90 text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <ScanText className="size-4 text-amber-400" />
              {uploading ? 'Memproses OCR...' : 'Ekstrak OCR & Gabung'}
            </button>
          </div>
        </div>
      </form>

      {/* Editor 1 Data Terpusat */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <label className="font-extrabold text-espresso">
            1 Data Master Knowledge AI (Sumber Tunggal Training AI)
          </label>
          <span className="text-[11px] text-warmmuted">
            {masterMarkdown.length.toLocaleString('id-ID')} karakter ·{' '}
            {updatedBy ? `Terakhir diubah oleh ${updatedBy}` : 'Belum ada edit manual'}
          </span>
        </div>
        {loading ? (
          <div className="p-6 text-center text-xs text-warmmuted border border-warmborder rounded-2xl">
            Memuat Master Knowledge AI...
          </div>
        ) : (
          <textarea
            value={masterMarkdown}
            onChange={(e) => setMasterMarkdown(e.target.value)}
            rows={12}
            placeholder="Tempelkan atau ekstrak brosur PDF/Excel di atas agar tergabung menjadi 1 data terpusat yang wajib dipahami AI..."
            className="w-full p-4 rounded-2xl border border-warmborder bg-sandstone/30 text-xs font-mono text-espresso leading-relaxed focus:outline-none focus:ring-1 focus:ring-terracotta"
          />
        )}
      </div>

      {/* Konflik Fakta (jika ada perbedaan harga dengan DB unit) */}
      {conflicts.filter((c) => c.status === 'open').length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-2">
          <div className="text-xs font-extrabold text-terracotta flex items-center gap-1.5">
            <AlertTriangle className="size-4" /> Terdeteksi Perbedaan Fakta dari Dokumen ({conflicts.filter((c) => c.status === 'open').length})
          </div>
          {conflicts
            .filter((c) => c.status === 'open')
            .map((c) => (
              <div key={c.id} className="text-xs text-espresso bg-white p-2.5 rounded-xl border border-amber-200">
                {c.question_for_pic}
              </div>
            ))}
        </div>
      )}

      {/* Daftar Dokumen Sumber Hasil OCR */}
      <div className="border border-warmborder rounded-2xl overflow-hidden">
        <div className="px-4 py-3 bg-sandstone/60 border-b border-warmborder text-xs font-bold text-espresso">
          Riwayat Dokumen Sumber Terintegrasi ({documents.length} File)
        </div>
        {documents.length === 0 ? (
          <div className="p-5 text-center text-xs text-warmmuted">
            Belum ada file brosur/PDF yang diekstrak. Unggah file di atas untuk memulai.
          </div>
        ) : (
          <div className="divide-y divide-warmborder">
            {documents.map((d) => (
              <div key={d.id} className="px-4 py-3 flex items-center justify-between gap-3 text-xs">
                <div className="min-w-0">
                  <div className="font-bold text-espresso flex items-center gap-2">
                    <FileText className="size-3.5 text-terracotta shrink-0" />
                    <span className="truncate">{d.filename}</span>
                    <span className="px-2 py-0.5 rounded bg-sandstone text-[10px] font-bold">
                      {d.doc_type} · v{d.version}
                    </span>
                  </div>
                  <div className="text-[11px] text-warmmuted mt-0.5">
                    Diunggah oleh {d.uploaded_by} ·{' '}
                    {new Date(d.created_at).toLocaleString('id-ID')}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleDeleteDoc(d.id)}
                  className="p-2 rounded-lg text-warmmuted hover:text-rose-700 hover:bg-rose-50 cursor-pointer"
                  title="Hapus dokumen sumber"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
