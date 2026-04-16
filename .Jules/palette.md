## 2025-02-28 - Micro-UX Loading States for Login Form
**Learning:** During login, it's a common micro-UX pattern to provide loading states (e.g. "Signing In..." + Spinner icon) and to explicitly disable the inputs and the submit button to prevent double submissions.
**Action:** Always check form submissions for missing loading states and explicitly disable the forms during async tasks.
## 2026-04-15 - Add micro-UX loading states for Products modal
**Learning:** Destructive operations like deleting and long operations like saving need clear, instantaneous feedback so users don't accidentally double-submit or assume the app froze.
**Action:** When adding or managing network requests in forms, always pair a loading spinner with disabled form inputs to ensure feedback is clear and accessibility standards (disabled state) are followed.
