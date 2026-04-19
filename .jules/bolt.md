## 2026-04-19 - Missing Pagination on Large Dataset endpoint
**Learning:** The /api/invoices endpoint queries all records without pagination, causing massive memory overhead and slow response times for large datasets.
**Action:** Apply pagination (LIMIT and OFFSET) to large data endpoints like /api/invoices.
