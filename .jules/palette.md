## 2024-05-28 - Placeholder-only forms
**Learning:** When forms visually rely exclusively on placeholder text, they fail screen reader accessibility because placeholders are not robust replacements for labels.
**Action:** Always bind explicit `<label>` elements using `for` and `id` attributes, applying `.sr-only` classes to hide them visually while maintaining accessibility.
