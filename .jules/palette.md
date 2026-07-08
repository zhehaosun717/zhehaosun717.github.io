## 2026-10-24 - Form Input Accessibility
**Learning:** Screen readers require explicit `<label>` elements tied via `for`/`id` to read inputs contextually. Placeholders are insufficient as they often disappear on focus and are not reliably announced by all screen readers.
**Action:** Always pair form inputs with explicit `<label>` elements. If the visual design relies solely on placeholders, use visually hidden labels (e.g., with a `.sr-only` class) to ensure accessibility without altering the UI.
