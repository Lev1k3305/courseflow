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
