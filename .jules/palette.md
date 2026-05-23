## 2024-05-15 - Form Field Accessibility
**Learning:** The contact form relied solely on visual `placeholder` attributes without semantic `<label>` elements. This violates WCAG accessibility guidelines as screen readers may not consistently announce placeholders, causing barriers for visually impaired users.
**Action:** Always pair form inputs with explicit `<label>` elements using `for` and `id` attributes. If visual design constraints prevent visible labels, utilize `.sr-only` classes to maintain accessibility without altering the UI.
