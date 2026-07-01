## 2024-05-24 - Explicit Form Labels
**Learning:** Placeholders are insufficient for screen readers; forms without explicit `label` elements cause accessibility issues and confusion for visually impaired users.
**Action:** Always pair `id` attributes on form inputs with corresponding `for` attributes on `label` elements, utilizing visually hidden (`.sr-only`) classes if visual design dictates hidden labels.
