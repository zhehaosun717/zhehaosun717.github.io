## 2024-06-17 - Input fields require explicit labels for screen readers
**Learning:** Implicit placeholder attributes do not serve as accessible labels for screen readers. Relying solely on placeholders for form inputs results in unlabelled inputs that are inaccessible to visually impaired users navigating via assistive technologies.
**Action:** Always add explicit `<label>` elements with the `.sr-only` class, correctly linked to their corresponding inputs using `for` and `id` attributes.
