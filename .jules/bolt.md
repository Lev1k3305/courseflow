## 2025-05-14 - Optimized Firestore Data Fetching Patterns
**Learning:** Sequential Firestore queries (N+1 problem) in React `useEffect` hooks significantly degrade performance as the number of items (e.g., lessons) grows. Each `getDoc` call adds network latency. Additionally, processing multiple independent collection queries sequentially (e.g., for different courses) creates a bottleneck.

**Action:**
1. Use `getDocs` on a subcollection to fetch all related items in a single query instead of looping with `getDoc`.
2. Use `Promise.all` to parallelize independent Firestore requests.
3. Memoize computed values derived from props or state to avoid redundant operations on every render.

## 2025-05-15 - VK Bridge Request Caching
**Learning:** VK Bridge calls (like `VKWebAppGetUserInfo`) are asynchronous IPC operations between the webview and the mobile client. Making multiple identical requests from different components (e.g., Navbar and Profile) adds unnecessary overhead and can cause race conditions or UI flickers.

**Action:** Cache the result of singleton-like VK Bridge requests using a shared promise within the manager. This ensures that concurrent or sequential calls resolve instantly with the same data without re-triggering the bridge.

## 2025-05-16 - Firestore and React Render Optimizations
**Learning:** Using `getDocs(ref).size` to count documents in Firestore is inefficient as it downloads all document data. React hooks must be called before any conditional early returns to avoid hydration and runtime errors. Images without explicit dimensions cause Cumulative Layout Shift (CLS).

**Action:**
1. Use `getCountFromServer(ref)` for efficient document counting.
2. Ensure all hooks are called at the top level of the component, before any `if (!mounted) return null` checks.
3. Add `width`, `height`, and `loading="lazy"` to all `<img>` tags to improve LCP and prevent CLS.
