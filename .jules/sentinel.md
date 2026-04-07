## 2025-04-04 - Missing numeric input validation

**Vulnerability:** Several endpoints like `POST /api/products`, `PUT /api/products/:id`, and `PUT /api/invoices/:id/payment` were using `typeof x === 'number'` to validate financial and quantity inputs. `PUT /api/invoices/:id/payment` was missing validation entirely for `amount_paid`.
**Learning:** Using `typeof x === 'number'` is insufficient for security as it permits negative values, `NaN`, and `Infinity`, which can corrupt databases and subvert business logic (DoS risk and data integrity corruption).
**Prevention:** Always use a helper like `isValidAmount` (e.g. `typeof n === 'number' && Number.isFinite(n) && n >= 0`) when validating user-supplied monetary or stock quantity values in Express routes.
## 2025-04-06 - XSS Vulnerability in logo_url

**Vulnerability:** The `PUT /api/settings` endpoint accepted unvalidated user input for `logo_url`, potentially allowing malicious `javascript:` or `data:` URLs to be stored and executed when rendered in the UI.
**Learning:** React safely handles standard strings, but attributes that expect URLs (like `href` or `src` in older browsers/contexts) can still be exploited if arbitrary schemes like `javascript:` are permitted. Backend validation must enforce protocol whitelists.
**Prevention:** When validating URLs, always ensure they start with safe schemes (`http://`, `https://`, or `/`) to prevent XSS. Use simple Regex or `startsWith` checks on the backend before storing the URL.
