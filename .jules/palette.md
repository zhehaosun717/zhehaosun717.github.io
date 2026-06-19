## 2024-05-24 - Explicit Labels for Screen Readers
**Learning:** Relying solely on placeholders for input fields fails accessibility standards as screen readers often skip them or they disappear on input.
**Action:** Always pair form inputs with explicit `<label>` elements linked via `for` and `id` attributes. Use visually hidden classes (like `.sr-only`) when the design requires hidden labels.
