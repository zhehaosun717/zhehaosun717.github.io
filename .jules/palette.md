## 2026-07-02 - Add explicit sr-only labels to contact form inputs
**Learning:** Relying solely on placeholder text for form fields creates an accessibility barrier, as screen readers may not read placeholders reliably, and they disappear once the user starts typing.
**Action:** Always pair form inputs with explicit `<label>` elements. If visual design constraints prevent visible labels, use visually hidden labels (e.g., `.sr-only`) linked via `for` and `id` attributes to ensure screen reader accessibility.
