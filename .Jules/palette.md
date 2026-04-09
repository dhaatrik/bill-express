## 2025-04-06 - Tooltip Added to "View Invoice"

**Learning:** Missing `aria-label` and `title` on icon-only links degrades accessibility and usability for screen readers and sighted users who rely on hover tooltips.
**Action:** Always verify that every icon-only interactive element (`<button>`, `<Link>`, `<a>`) has an explicitly descriptive `aria-label` and a visual `title` attribute across all dashboard tables. Use dynamic data (e.g., invoice number) in ARIA labels when possible to provide unique context for screen readers.
## 2025-04-08 - Prevent Duplicate Submissions on Financial Forms

**Learning:** Without explicit loading states and disabled buttons during API calls on financial forms (like generating an invoice), users can accidentally double-click the save button. This poor micro-UX directly causes data integrity issues like duplicate invoices and double stock deductions.
**Action:** Always wrap API submission logic in `try/finally` blocks to toggle an `isSaving` state, and ensure the primary submission `<button>` receives `disabled={isSaving}` along with clear visual feedback (e.g., a spinner and disabled styling) to prevent rapid consecutive submissions.
## 2024-04-09 - Accessible Search Inputs
**Learning:** Found multiple search inputs (`placeholder="Search by..."`) across different views (Products, Invoices, Customers, New Bill) that were missing accessible labels, which makes screen reader navigation difficult.
**Action:** Always ensure search inputs and other form fields without visible `<label>` tags have descriptive `aria-label` attributes to support assistive technologies.
