## 2024-06-13 - Add explicit sr-only labels to contact form inputs
**Learning:** Placeholders are insufficient for screen readers; explicit `<label>` elements are required for form inputs to provide accessibility context.
**Action:** Always pair form inputs with explicit `<label>` elements, using visually hidden text if the design excludes visible labels, linking them via `for` and `id` attributes.
