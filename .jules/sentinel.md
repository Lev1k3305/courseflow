# Sentinel Journal

This journal tracks critical security learnings.

## 2025-05-15 - Information Leakage in Firestore Error Handling
**Vulnerability:** The `handleFirestoreError` function was serializing the entire `auth.currentUser` object (including email and tenantId) and the full Firestore document path into an Error message thrown to the client.
**Learning:** Error handlers often inadvertently expose internal system details or PII when trying to be helpful for debugging.
**Prevention:** Always sanitize error messages before they reach the client. Log detailed information only to secure server-side logging or in development environments.
