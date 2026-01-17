-- Ensure unique invoice numbers for deliveries (allows multiple NULLs)
CREATE UNIQUE INDEX "deliveries_invoice_no_key" ON "deliveries" ("invoice_no") WHERE ("invoice_no" IS NOT NULL);