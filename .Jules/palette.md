## 2025-04-06 - Tooltip Added to "View Invoice"

**Learning:** Missing `aria-label` and `title` on icon-only links degrades accessibility and usability for screen readers and sighted users who rely on hover tooltips.
**Action:** Always verify that every icon-only interactive element (`<button>`, `<Link>`, `<a>`) has an explicitly descriptive `aria-label` and a visual `title` attribute across all dashboard tables. Use dynamic data (e.g., invoice number) in ARIA labels when possible to provide unique context for screen readers.