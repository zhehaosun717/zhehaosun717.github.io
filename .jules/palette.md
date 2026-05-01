## 2026-05-01 - Explicit Labels with Visually Hidden Classes
**Learning:** For forms that rely on placeholders for their visual design, standard explicit `<label>` tags will disrupt the layout.
**Action:** Use explicit `<label>` tags with `for` attributes linked to the input's `id` to ensure screen readers can read the fields, and combine this with the `.sr-only` class to hide the labels visually without compromising accessibility.
