## 2026-04-22 - Context-Aware ARIA Labels in Lists
**Learning:** Generic aria-labels like "Remove item" on icon-only buttons repeated in table rows or lists are unhelpful for screen reader users, as they lack context about which specific item is being targeted.
**Action:** Always inject contextual row data (e.g., `item.product_name`) into `aria-label` and `title` attributes for repeated actions, yielding specific labels like "Remove Single Super Phosphate 16% from bill".
