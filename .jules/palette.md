## 2024-06-07 - Screen Reader Labels for Contact Form
**Learning:** The contact form's visible placeholder attributes are insufficient for screen readers, requiring explicit `<label>` elements linked via `for` and `id` attributes that are visually hidden using the `.sr-only` class to maintain the design while ensuring accessibility.
**Action:** Always ensure that visually clean forms without visible labels include `.sr-only` labels linked to inputs, and specifically account for how these are structured in DOM queries during automated accessibility testing.
