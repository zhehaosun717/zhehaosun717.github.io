## 2025-02-18 - Form Accessibility Labels
**Learning:** Forms relying only on placeholders lack accessibility. Using `.sr-only` labels linked via `for`/`id` attributes ensures screen reader support without breaking the visual design.
**Action:** Always provide explicit `<label>` elements for inputs, even if they must be visually hidden.
