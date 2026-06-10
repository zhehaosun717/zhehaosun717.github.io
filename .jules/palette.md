## 2024-06-10 - Adding Screen-Reader Only Labels to Contact Form
**Learning:** In placeholder-driven forms, visual users rely on placeholders for context, but screen readers require explicit `<label>` elements linked to inputs via `for` and `id` bindings to correctly interpret the required information.
**Action:** Always provide `<label class="sr-only">` elements bound to inputs via `for` and `id` attributes when creating forms that rely visually only on placeholders, ensuring comprehensive screen reader accessibility.
