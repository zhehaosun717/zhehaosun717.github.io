## 2024-06-24 - Add explicit sr-only labels to contact form inputs
**Learning:** Placeholder attributes are insufficient for robust screen-reader accessibility on contact form inputs.
**Action:** Always pair visible inputs with explicitly linked `<label>` elements, hiding them with `.sr-only` if visual design mandates placeholders only.
