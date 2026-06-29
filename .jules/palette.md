## 2024-05-24 - Screen Reader Accessible Form Inputs
**Learning:** Placeholder text alone is insufficient for screen readers; forms relying entirely on placeholders for visual layout must include visually hidden `sr-only` labels to ensure semantic accessibility and correct read-out for assistive technologies without breaking the visual design.
**Action:** Always pair inputs with `<label>` elements explicitly linked via `for` and `id` attributes. If visual design precludes visible labels, apply `.sr-only` classes to the labels rather than omitting them entirely.
