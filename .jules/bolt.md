## 2026-04-19 - Missing Pagination on Large Dataset endpoint
**Learning:** The /api/invoices endpoint queries all records without pagination, causing massive memory overhead and slow response times for large datasets.
**Action:** Apply pagination (LIMIT and OFFSET) to large data endpoints like /api/invoices.
## 2026-04-19 - React State Pagination Traps
**Learning:** When transitioning from client-side filtering to server-side pagination with dynamic filters, failing to reset the current `page` state to `1` when filters change will trap users on empty pages (e.g., being on page 3 when a new search yields only 5 total results).
**Action:** Always include a `useEffect` to reset the pagination state (`setPage(1)`) dependent on the filter state values when implementing server-side filtering.
