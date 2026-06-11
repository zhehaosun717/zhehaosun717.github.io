## 2026-06-11 - Screen Reader Only Labels Verification
**Learning:** When using Playwright to verify visually hidden accessibility elements (such as labels with the .sr-only class), standard visibility checks (e.g., is_visible()) will fail because the elements are intentionally visually hidden.
**Action:** Verify their presence in the DOM and their class attributes instead of relying on standard visibility checks when testing accessible form components.
