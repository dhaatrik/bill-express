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
