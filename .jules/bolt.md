## 2025-05-14 - Optimized Firestore Data Fetching Patterns
**Learning:** Sequential Firestore queries (N+1 problem) in React `useEffect` hooks significantly degrade performance as the number of items (e.g., lessons) grows. Each `getDoc` call adds network latency. Additionally, processing multiple independent collection queries sequentially (e.g., for different courses) creates a bottleneck.

**Action:**
1. Use `getDocs` on a subcollection to fetch all related items in a single query instead of looping with `getDoc`.
2. Use `Promise.all` to parallelize independent Firestore requests.
3. Memoize computed values derived from props or state to avoid redundant operations on every render.
