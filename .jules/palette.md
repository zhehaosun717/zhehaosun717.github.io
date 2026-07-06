## 2024-07-06 - Form Accessibility Labels
**Learning:** Placeholders are not a substitute for explicit labels because they disappear on input and are not reliably announced by screen readers. Adding visually hidden (`.sr-only`) labels ensures accessibility without breaking the minimalist design intent.
**Action:** Always pair inputs with explicit `<label>` tags linked via `for` and `id` attributes. If visual design requires hiding the label, use `.sr-only` utility classes instead of omitting the label entirely.
