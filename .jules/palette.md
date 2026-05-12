## 2026-10-24 - Interactive Elements and Form Accessibility
**Learning:** Custom interactive elements (like div-based cards) completely block keyboard users if they lack `role="button"`, `tabindex="0"`, and `keydown` handlers for Enter/Space. Additionally, relying on placeholders for forms provides a poor screen reader experience compared to explicit `<label>` elements hidden with `.sr-only`.
**Action:** Always pair `id` and `for` on form inputs with explicit labels, and ensure all custom interactive elements include proper ARIA roles, tabindex, and keyboard event listeners.
