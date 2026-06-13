## 2025-05-14 - Optimized Firestore Data Fetching Patterns
**Learning:** Sequential Firestore queries (N+1 problem) in React `useEffect` hooks significantly degrade performance as the number of items (e.g., lessons) grows. Each `getDoc` call adds network latency. Additionally, processing multiple independent collection queries sequentially (e.g., for different courses) creates a bottleneck.

**Action:**
1. Use `getDocs` on a subcollection to fetch all related items in a single query instead of looping with `getDoc`.
2. Use `Promise.all` to parallelize independent Firestore requests.
3. Memoize computed values derived from props or state to avoid redundant operations on every render.

## 2025-05-15 - VK Bridge Request Caching
**Learning:** VK Bridge calls (like `VKWebAppGetUserInfo`) are asynchronous IPC operations between the webview and the mobile client. Making multiple identical requests from different components (e.g., Navbar and Profile) adds unnecessary overhead and can cause race conditions or UI flickers.

**Action:** Cache the result of singleton-like VK Bridge requests using a shared promise within the manager. This ensures that concurrent or sequential calls resolve instantly with the same data without re-triggering the bridge.

## 2026-06-08 - User-scoped In-memory Caching for Progress
**Learning:** Global in-memory caches in client-side apps can leak data between user sessions if not properly scoped. For example, a cache keyed only by `courseId` would persist across logout/login events in a SPA, potentially showing one user's progress to another.

**Action:** Always scope session-based caches by the authenticated user's ID (e.g., `{ userId: { resourceId: data } }`). This ensures data isolation and correctness when the app handles multiple identities within the same browser lifetime.

## 2026-06-09 - Stable Identity for Dynamic External Assets
**Learning:** Using unstable identifiers (like array indices) as seeds for dynamic external assets (e.g., `pravatar.cc`) causes a significant performance and UX anti-pattern. When the list is filtered or re-ordered, the same logical item gets a different seed, forcing the browser to perform redundant network requests and causing visible UI flickering.

**Action:** Generate deterministic hashes from stable resource identifiers (like `courseId`) to use as seeds. This ensures asset stability across re-renders, improves caching efficiency, and eliminates flickering. Additionally, extracting list items into `React.memo` components further optimizes the reconciliation process when parent state changes.

## 2026-06-10 - Firestore Request Deduplication and Optimistic UI
**Learning:** Concurrent React component mounts can trigger redundant Firestore requests for the same data (e.g., course progress). Caching only the *result* is insufficient for overlapping requests. Additionally, waiting for network confirmation before updating the UI creates a sluggish user experience.

**Action:**
1. Implement an in-flight promise registry to deduplicate concurrent requests for the same resource.
2. Distinguish between partial and complete cache states to avoid serving incomplete data from early lesson checks.
3. Use optimistic updates with rollbacks to ensure the UI feels instant while maintaining eventual consistency with the database.
4. When typing registries in TypeScript, use `Promise<T> | undefined` to avoid "condition will always return true" build errors.

## 2026-06-11 - Pre-computed Data Maps for O(1) Lookups
**Learning:** Performing linear searches (.find()) on static data arrays within render loops or mapping functions (e.g., displaying notes on a Profile Page) creates an O(N*M) bottleneck as the dataset grows.

**Action:** Pre-compute lookup maps (Record types) at the module level for static data. Use composite keys for nested resources (e.g., `courseId_lessonId`) to allow O(1) access throughout the application, significantly reducing reconciliation time and improving UI snappiness.

## 2026-06-12 - State Isolation for High-Frequency Interactions
**Learning:** In interactive pages with large amounts of static or expensive content (like lesson pages with prose and quizzes), keeping "draft" states (like textarea values) in the root component causes a full-page re-render on every keystroke. This degrades typing performance and wastes CPU cycles, especially when animations or complex layouts are involved.

**Action:** Extract high-frequency interaction areas into isolated sub-components that manage their own local state. Use `memo` for the surrounding static components. If the parent needs to "push" data into these isolated components (e.g., "Copy to notes"), use `forwardRef` and `useImperativeHandle` to expose specific methods without lifting the entire state back up.
