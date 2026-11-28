-- 0039_plan_subscription_invoices.sql
-- Menambahkan tipe invoice PLAN_SUBSCRIPTION untuk pembelian/upgrade paket Gold, Platinum, Diamond

ALTER TABLE sales_os.payment_invoices
  DROP CONSTRAINT IF EXISTS payment_invoices_invoice_type_check;

ALTER TABLE sales_os.payment_invoices
  ADD CONSTRAINT payment_invoices_invoice_type_check
  CHECK (invoice_type IN ('AIC_TOPUP', 'BOOKING_FEE', 'PLAN_SUBSCRIPTION'));

UPDATE sales_os.payment_invoices
SET invoice_type = 'PLAN_SUBSCRIPTION'
WHERE invoice_type = 'AIC_TOPUP'
  AND reference_code IN ('PLAN-GOLD', 'PLAN-PLATINUM', 'PLAN-DIAMOND');
