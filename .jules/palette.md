## 2024-05-21 - Form Accessibility
**Learning:** Found a pattern where form inputs relied solely on placeholders for labels, which causes screen readers to miss the input purpose.
**Action:** Added explicit `<label class="sr-only">` linked to inputs via `id` for screen readers, preserving the visual placeholder design while ensuring a11y compliance.