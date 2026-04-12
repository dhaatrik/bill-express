## 2025-02-28 - Micro-UX Loading States for Login Form
**Learning:** During login, it's a common micro-UX pattern to provide loading states (e.g. "Signing In..." + Spinner icon) and to explicitly disable the inputs and the submit button to prevent double submissions.
**Action:** Always check form submissions for missing loading states and explicitly disable the forms during async tasks.
