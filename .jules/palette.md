## 2024-10-24 - Add explicit sr-only labels to contact form inputs
**Learning:** Forms relying solely on `placeholder` attributes are inaccessible to screen readers, and the context disappears once a user starts typing.
**Action:** Always pair form inputs with explicit `<label>` elements linked by `id`. When a visual label disrupts the design, use a `.sr-only` class to maintain accessibility.
