## 2024-10-24 - Add explicit sr-only labels to contact form inputs
**Learning:** The contact form relies on placeholders for visual labeling, which screen readers often misinterpret or ignore, breaking form accessibility.
**Action:** Always link explicit `<label>` elements to their inputs via `for` and `id` attributes, applying the `.sr-only` class to maintain visual design while ensuring screen reader support.
