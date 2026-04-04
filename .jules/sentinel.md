## 2025-04-04 - Missing numeric input validation

**Vulnerability:** Several endpoints like `POST /api/products`, `PUT /api/products/:id`, and `PUT /api/invoices/:id/payment` were using `typeof x === 'number'` to validate financial and quantity inputs. `PUT /api/invoices/:id/payment` was missing validation entirely for `amount_paid`.
**Learning:** Using `typeof x === 'number'` is insufficient for security as it permits negative values, `NaN`, and `Infinity`, which can corrupt databases and subvert business logic (DoS risk and data integrity corruption).
**Prevention:** Always use a helper like `isValidAmount` (e.g. `typeof n === 'number' && Number.isFinite(n) && n >= 0`) when validating user-supplied monetary or stock quantity values in Express routes.
