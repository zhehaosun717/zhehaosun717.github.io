## 2026-06-06 - Missing Form Labels
**Learning:** The visible input fields in the contact form relied solely on placeholders, creating an accessibility issue pattern for screen-reader users where input context is lost once typing begins.
**Action:** Always bind explicit `<label>` elements with the `.sr-only` class to input fields via `for` and `id` attributes to preserve visual design while ensuring screen-reader accessibility.
