-- Riwayat percakapan WA (terenkripsi, maks 10 giliran per kontak, 30 hari) & mode balasan AI.
CREATE TABLE IF NOT EXISTS sales_os.wa_conversation_turns (
  id BIGSERIAL PRIMARY KEY,
  se_email TEXT NOT NULL,
  contact_phone TEXT NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('customer', 'sales')),
  encrypted_text TEXT NOT NULL,
  draft_similarity REAL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '30 days'
);
CREATE INDEX IF NOT EXISTS idx_wa_turns_contact ON sales_os.wa_conversation_turns (se_email, contact_phone, sent_at DESC);

ALTER TABLE sales_os.lead_ai_analyses
  ADD COLUMN IF NOT EXISTS reply_mode TEXT,
  ADD COLUMN IF NOT EXISTS reply_reason TEXT;
