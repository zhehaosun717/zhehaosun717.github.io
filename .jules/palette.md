## 2025-06-14 - Visual Minimalism vs Accessibility
**Learning:** In this app's contact form, visible labels are omitted in favor of placeholders to achieve visual minimalism, which breaks screen reader accessibility since placeholders are not reliable labels.
**Action:** Always pair placeholder-only inputs with explicit `<label>` elements visually hidden using the `.sr-only` class, properly linked to the input via `id` and `for` attributes to ensure screen reader accessibility without compromising the minimalist design.
