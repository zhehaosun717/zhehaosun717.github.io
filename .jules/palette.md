## 2024-05-05 - Accessible Labels for Placeholder Designs
**Learning:** Relying solely on placeholders for form fields degrades the experience for screen reader users, as placeholders are not reliably announced and disappear on input.
**Action:** Always pair form inputs with explicit `<label>` tags linked via `for` and `id`. Hide them with `.sr-only` if visual design mandates a placeholder-only aesthetic.
