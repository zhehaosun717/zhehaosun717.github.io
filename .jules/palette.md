## 2024-06-01 - Form Accessibility Screen-Reader Labels

**Learning:** In highly stylized components like custom contact forms relying on placeholders, visually hidden `<label>` elements are crucial for screen readers. The `.sr-only` class combined with explicit `for`/`id` bindings ensures inputs are accessible without breaking the visual aesthetic.

**Action:** Always ensure input fields have an associated label explicitly linked via `for`/`id`, using `.sr-only` if visual labels contradict the design system.