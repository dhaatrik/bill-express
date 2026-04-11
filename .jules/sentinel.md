## 2025-04-04 - Missing numeric input validation

**Vulnerability:** Several endpoints like `POST /api/products`, `PUT /api/products/:id`, and `PUT /api/invoices/:id/payment` were using `typeof x === 'number'` to validate financial and quantity inputs. `PUT /api/invoices/:id/payment` was missing validation entirely for `amount_paid`.
**Learning:** Using `typeof x === 'number'` is insufficient for security as it permits negative values, `NaN`, and `Infinity`, which can corrupt databases and subvert business logic (DoS risk and data integrity corruption).
**Prevention:** Always use a helper like `isValidAmount` (e.g. `typeof n === 'number' && Number.isFinite(n) && n >= 0`) when validating user-supplied monetary or stock quantity values in Express routes.

## 2025-04-06 - XSS Vulnerability in logo_url

**Vulnerability:** The `PUT /api/settings` endpoint accepted unvalidated user input for `logo_url`, potentially allowing malicious `javascript:` or `data:` URLs to be stored and executed when rendered in the UI.
**Learning:** React safely handles standard strings, but attributes that expect URLs (like `href` or `src` in older browsers/contexts) can still be exploited if arbitrary schemes like `javascript:` are permitted. Backend validation must enforce protocol whitelists.
**Prevention:** When validating URLs, always ensure they start with safe schemes (`http://`, `https://`, or `/`) to prevent XSS. Use simple Regex or `startsWith` checks on the backend before storing the URL.

## 2025-04-07 - Pagination Input DoS Vulnerability

**Vulnerability:** The `GET /api/products` endpoint parsed pagination query parameters `page` and `limit` but did not enforce any upper bound or negative-number checks.
**Learning:** Unrestricted `limit` parameters can lead to a Denial of Service (DoS) attack if a malicious user requests millions of records in a single request, exhausting database connections and server memory. Negative parameters can also cause syntax errors or unexpected behavior.
**Prevention:** Always sanitize and clamp pagination inputs on the backend (e.g., ensure `page >= 1` and `limit` is bounded between 1 and a safe maximum like 1000).
## 2025-04-11 - Error Leakage in Catch Blocks

**Vulnerability:** Several Express endpoints threw error messages to the client, leading to potential sensitive internal detail leaks.
**Learning:** A standard practice in Node.js applications is to securely log detailed error information for the developer but only provide safe generic responses to the client. Using a generic `logger.error(err, 'Operation failed')` is incorrect since `err` wouldn't be properly serialized; Pino expects the error under the `err` key.
**Prevention:** Instead of logging raw string interpolations, securely log internal errors using Pino's object format (e.g., `logger.error({ err }, 'Operation failed')`) and ensure that the response to the client (`res.status(400).json(...)`) is a generic JSON error response.
