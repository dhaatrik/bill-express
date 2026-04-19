## 2026-04-17 - Fix Timing Attack Vulnerability in Authentication
**Vulnerability:** The basic authentication mechanism checked if lengths of expected and provided credentials matched before comparing them, allowing attackers to deduce the expected password length through a timing attack.
**Learning:** Checking string lengths or using early returns during authentication comparisons inherently leaks information about the stored secrets via execution time differences.
**Prevention:** Always hash both strings to a consistent, fixed length (e.g., using SHA-256) before utilizing `crypto.timingSafeEqual()`, completely obfuscating original string lengths.
## 2026-04-17 - Unhandled Exception when Expected Types are Missing
**Vulnerability:** A Denial of Service (DoS) vulnerability existed when parsing `req.headers.authorization`. If the `Authorization` header was missing entirely, `authHeader` would fall back to an empty string `''` properly. However, if the underlying parsing resulted in a different expected type (for instance, an array or missing entirely), the code crashed attempting to create a hash.
**Learning:** Security fixes must always ensure proper typing and safely handle unexpected types rather than assuming input is valid. `crypto.createHash('sha256').update(value)` will throw `TypeError [ERR_INVALID_ARG_TYPE]` if `value` isn't a string, Buffer, TypedArray, or DataView.
**Prevention:** Ensure we strictly coerce headers to a safe string value (e.g. `const safeAuthHeader = typeof authHeader === 'string' ? authHeader : '';`) before feeding them into cryptographic functions.
## 2026-04-19 - Fix DoS vulnerability by enforcing bounds on list endpoints
**Vulnerability:** The `/api/customers` and `/api/invoices` endpoints were missing explicit `LIMIT` parameters in their database queries, creating a Denial of Service (DoS) risk for large datasets when requested without pagination.
**Learning:** Endpoints that return collections of data must always enforce a hard limit on the number of records returned to prevent malicious or accidental unbounded database queries that could exhaust server resources (memory/CPU).
**Prevention:** Always extract and bound a `limit` parameter (e.g., maximum 10000) and include a `LIMIT ?` clause in SQL queries for list APIs, even if the frontend isn't explicitly requesting pagination.
