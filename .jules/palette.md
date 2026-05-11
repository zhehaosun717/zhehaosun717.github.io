## 2024-05-11 - Form Accessibility with Placeholders
**Learning:** Contact forms relying solely on placeholders lack explicit accessible names for screen readers, which can make it difficult for visually impaired users to identify the required input fields.
**Action:** Always pair form inputs with explicit `<label>` tags using the `for` attribute mapped to the input's `id`. If visual design relies solely on placeholders, use the `.sr-only` class to hide the explicit labels for screen readers without compromising the visual layout.
