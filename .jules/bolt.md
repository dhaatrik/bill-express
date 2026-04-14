## 2025-03-05 - Route-Based Code Splitting
**Learning:** In a single-page application built with React Router, statically importing all route components leads to a massive initial JavaScript bundle. When refactoring to use `React.lazy()` for code splitting, tests that rely on synchronous queries (like `getByTestId`) will fail because React Suspense introduces an asynchronous boundary.
**Action:** When migrating route components to `React.lazy`, systematically update unit/integration tests to use asynchronous queries (`await screen.findByTestId`) or wrap suspense resolution in `act(...)`.

## 2025-03-05 - useMemo on List Filtering
**Learning:** Adding `useMemo` to a filtered list where all component states are dependencies of the filter (like `search` or `filters`) provides ZERO performance benefit. The filter will re-run on every state change anyway because the search keystroke updates the dependency.
**Action:** To actually prevent search input lag on large lists, decouple the input state (which updates on every keystroke) from the filtering state using React's `useDeferredValue`. This keeps the input responsive while delaying the heavy O(N) filtering.

## 2025-03-06 - useDeferredValue on List Filtering
**Learning:** Decoupling search input state from expensive `O(N)` list filtering operations using `useDeferredValue` and `useMemo` successfully prevents main thread blocking and lag during typing, significantly improving perceived performance on large datasets.
**Action:** Always combine `useDeferredValue` with `useMemo` for client-side text-based filtering of large arrays where server-side pagination/filtering isn't available or feasible.

## 2025-03-06 - Consolidating Dashboard API Requests
**Learning:** Having a separate, "fast" dedicated endpoint to fetch a single piece of aggregate data (like customer count) creates an unnecessary network roundtrip when the dashboard is already fetching analytics. Consolidating the count into the main analytics `SELECT` query reduces network payload, connection overhead, and client-side processing, speeding up the dashboard load time.
**Action:** Prefer offloading data aggregation and filtering from the frontend to the backend using SQL, and consolidate multiple data-fetching requests into unified analytics endpoints whenever feasible.

## 2025-03-08 - Indexing frequently queried non-key columns
**Learning:** Even simple analytics queries like "Top 5 products with low stock" (`WHERE stock <= 10 ORDER BY stock ASC LIMIT 5`) perform a full table scan (`SCAN products`) by default in SQLite. Creating an index on the filtered/sorted column changes this to an efficient index lookup (`SEARCH products USING INDEX`). We can verify this behavior using `EXPLAIN QUERY PLAN`.
**Action:** When identifying backend performance bottlenecks in dashboard analytics or list views, use `EXPLAIN QUERY PLAN` to detect `SCAN` operations and add targeted indexes to convert them to `SEARCH` operations, significantly improving query speed on large datasets.

## 2025-03-09 - SQLite Ordering Optimizations
**Learning:** SQLite cannot use an index for `ORDER BY` if there isn't an index that exactly matches the query pattern. Specifically, if a query includes `WHERE category = ? ORDER BY name ASC`, an index solely on `name` (`idx_products_name`) will result in a fast scan but a slow `USE TEMP B-TREE FOR ORDER BY`. Conversely, an index solely on `category` (`idx_products_category`) will perform a fast search but STILL use a slow `TEMP B-TREE` for ordering.
**Action:** To completely eliminate `TEMP B-TREE` sorting in SQLite for filtered + ordered queries, always create a **compound index** covering the `WHERE` clause first, followed by the `ORDER BY` columns: e.g., `CREATE INDEX idx_products_category_name ON products(category, name)`.

## 2025-03-10 - Index ordering for Group By
**Learning:** When optimizing SQLite queries that filter by an exact match and a range (e.g., `status = 'active' AND date >= ...`), ordering the compound index as `(exact_match_column, range_column)` (e.g., `(status, date)`) instead of `(range_column, exact_match_column)` is critical. The former allows SQLite to fully utilize the index to satisfy `GROUP BY date` without needing an inefficient `USE TEMP B-TREE FOR GROUP BY`.
**Action:** When creating compound indexes for queries with equality and range conditions, always place the equality columns first in the index definition to maximize index usage and avoid temporary tree sorts.

## 2025-03-11 - Scalar Subquery vs LEFT JOIN for Aggregates in SQLite
**Learning:** For queries that join a main table with an aggregated child table (like calculating customer lifetime value from invoices), a correlated scalar subquery (`SELECT c.*, (SELECT SUM(total) FROM invoices WHERE customer_id = c.id)`) can be ~30% faster in SQLite than a `LEFT JOIN` with `GROUP BY c.id`, especially when paired with an index like `idx_invoices_customer_id_status`. This is counter-intuitive to general SQL advice but true for this SQLite environment because the subquery pattern avoids generating a massive intermediate joined result set and then grouping it in a temporary B-Tree.
**Action:** When calculating single column aggregates (like SUM or COUNT) from related tables in a list view (like customers), favor correlated scalar subqueries over `LEFT JOIN` + `GROUP BY` to bypass the costly `USE TEMP B-TREE FOR ORDER BY` execution step.

## 2025-04-12 - Index ordering for Category Filtering and Stock Sorting
**Learning:** In the `/api/products` endpoint, when users filter by a specific category (e.g., `category = 'Fertilizer'`) and sort by stock quantity (e.g., `ORDER BY stock ASC`), an index solely on `category` (`idx_products_category`) will perform a fast search but STILL use a slow `TEMP B-TREE` for ordering.
**Action:** To completely eliminate `TEMP B-TREE` sorting in SQLite for category filtered + stock ordered queries, always create a **compound index** covering the `WHERE` clause first, followed by the `ORDER BY` columns: e.g., `CREATE INDEX idx_products_category_stock ON products(category, stock)`.

## 2025-04-14 - Expression Indexing for GROUP BY
**Learning:** In SQLite, when grouping by a transformed column (like a date substring) such as `GROUP BY date(date)`, an index on `(status, date)` will still result in an inefficient `USE TEMP B-TREE FOR GROUP BY` sort. Even if you create an expression index like `CREATE INDEX idx ON invoices(status, substr(date, 1, 10))`, SQLite will only use it to eliminate the sort if the `WHERE` clause, `GROUP BY` clause, and `ORDER BY` clause *all* utilize that exact same expression.
**Action:** To completely eliminate slow `TEMP B-TREE` sorts when grouping by a transformed column, create an exact expression index and strictly ensure the `WHERE`, `GROUP BY`, and `ORDER BY` clauses use the exact same string expression (e.g., `substr(date, 1, 10)`).
