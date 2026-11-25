#!/usr/bin/env python3
"""
Document Extractor untuk Developer Sales OS (F01, F02):
- Excel/CSV -> openpyxl / csv -> Markdown tabel
- PDF Digital -> PyMuPDF + pymupdf4llm -> Markdown per halaman
- Gambar / PDF Scan -> RapidOCR (ONNX Runtime) -> Markdown + skor confidence
Output selalu JSON ke stdout: { ok, method, pages: [{ page, method, confidence, markdown }] }
"""
import csv
import json
import os
import sys
from typing import Any, Dict, List


def extract_excel(file_path: str) -> Dict[str, Any]:
    import openpyxl

    wb = openpyxl.load_workbook(file_path, data_only=True)
    pages: List[Dict[str, Any]] = []
    for idx, sheet_name in enumerate(wb.sheetnames, start=1):
        ws = wb[sheet_name]
        rows = list(ws.iter_rows(values_only=True))
        if not rows:
            continue
        md_lines = [f"### Sheet: {sheet_name}"]
        for r_i, row in enumerate(rows):
            cells = [str(c).replace("\n", " ").strip() if c is not None else "" for c in row]
            if not any(cells):
                continue
            md_lines.append("| " + " | ".join(cells) + " |")
            if r_i == 0:
                md_lines.append("| " + " | ".join(["---"] * len(cells)) + " |")
        pages.append({
            "page": idx,
            "method": "sheet",
            "confidence": 1.0,
            "markdown": "\n".join(md_lines),
        })
    return {"ok": True, "method": "openpyxl", "pages": pages}


def extract_csv(file_path: str) -> Dict[str, Any]:
    md_lines: List[str] = []
    with open(file_path, "r", encoding="utf-8-sig", errors="replace") as f:
        reader = csv.reader(f)
        for r_i, row in enumerate(reader):
            cells = [c.replace("\n", " ").strip() for c in row]
            if not any(cells):
                continue
            md_lines.append("| " + " | ".join(cells) + " |")
            if r_i == 0:
                md_lines.append("| " + " | ".join(["---"] * len(cells)) + " |")
    return {
        "ok": True,
        "method": "csv",
        "pages": [{"page": 1, "method": "sheet", "confidence": 1.0, "markdown": "\n".join(md_lines)}],
    }


def run_rapidocr_on_bytes(img_bytes: bytes, ocr_engine: Any) -> Dict[str, Any]:
    result, _ = ocr_engine(img_bytes)
    if not result:
        return {"text": "", "confidence": 0.0}
    lines = []
    scores = []
    for item in result:
        # RapidOCR format: [box, text, score]
        if len(item) >= 3:
            lines.append(str(item[1]))
            try:
                scores.append(float(item[2]))
            except (TypeError, ValueError):
                pass
    avg_conf = round(sum(scores) / len(scores), 3) if scores else 0.75
    return {"text": "\n".join(lines), "confidence": avg_conf}


def extract_pdf(file_path: str) -> Dict[str, Any]:
    import pymupdf

    try:
        import pymupdf4llm
    except ImportError:
        pymupdf4llm = None

    doc = pymupdf.open(file_path)
    pages: List[Dict[str, Any]] = []
    ocr_engine = None

    for page_idx in range(len(doc)):
        page_num = page_idx + 1
        page = doc[page_idx]
        raw_text = page.get_text("text").strip()

        if len(raw_text) >= 40:
            if pymupdf4llm is not None:
                md = pymupdf4llm.to_markdown(doc, pages=[page_idx])
            else:
                md = raw_text
            pages.append({
                "page": page_num,
                "method": "text",
                "confidence": 0.99,
                "markdown": md.strip(),
            })
        else:
            # Halaman scan / gambar: render ke PNG lalu RapidOCR
            if ocr_engine is None:
                from rapidocr_onnxruntime import RapidOCR
                ocr_engine = RapidOCR()
            pix = page.get_pixmap(dpi=180)
            ocr_res = run_rapidocr_on_bytes(pix.tobytes("png"), ocr_engine)
            pages.append({
                "page": page_num,
                "method": "ocr",
                "confidence": ocr_res["confidence"],
                "markdown": ocr_res["text"],
            })

    return {"ok": True, "method": "pymupdf+rapidocr", "pages": pages}


def extract_image(file_path: str) -> Dict[str, Any]:
    from rapidocr_onnxruntime import RapidOCR

    ocr_engine = RapidOCR()
    with open(file_path, "rb") as f:
        ocr_res = run_rapidocr_on_bytes(f.read(), ocr_engine)
    return {
        "ok": True,
        "method": "rapidocr",
        "pages": [{
            "page": 1,
            "method": "ocr",
            "confidence": ocr_res["confidence"],
            "markdown": ocr_res["text"],
        }],
    }


def main() -> None:
    if len(sys.argv) < 2:
        print(json.dumps({"ok": False, "error": "Path file wajib diberikan."}))
        sys.exit(1)

    file_path = sys.argv[1]
    if not os.path.exists(file_path):
        print(json.dumps({"ok": False, "error": f"File tidak ditemukan: {file_path}"}))
        sys.exit(1)

    ext = os.path.splitext(file_path)[1].lower()
    try:
        if ext in (".xlsx", ".xlsm"):
            res = extract_excel(file_path)
        elif ext == ".csv":
            res = extract_csv(file_path)
        elif ext == ".pdf":
            res = extract_pdf(file_path)
        elif ext in (".png", ".jpg", ".jpeg", ".webp", ".bmp"):
            res = extract_image(file_path)
        else:
            print(json.dumps({"ok": False, "error": f"Format file belum didukung: {ext}"}))
            sys.exit(1)
        print(json.dumps(res, ensure_ascii=False))
    except Exception as exc:
        print(json.dumps({"ok": False, "error": str(exc)}))
        sys.exit(1)


if __name__ == "__main__":
    main()
