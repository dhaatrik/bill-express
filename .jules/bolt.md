## 2024-03-24 - SQLite Performance in Dashboard Queries
**Learning:** Adding indexes on `(date, status)` for `invoices`, `(invoice_id)` for `invoice_items`, and `(customer_id)` for `invoices` significantly speeds up dashboard queries (`api/dashboard/analytics`) by 2x to 4x.
**Action:** When adding foreign keys, always consider adding an index for them. Also, index columns used in WHERE clauses and aggregation groups like `date` and `status`.
