## 2023-10-25 - Forms without explicit labels

**Learning:** Relying solely on placeholder text for form fields is a common accessibility anti-pattern in this app's components, which prevents screen readers from effectively announcing the purpose of the inputs.
**Action:** Always ensure that every input element is explicitly paired with a `<label>` element (using `for` and `id` attributes). Use visually hidden labels (`.sr-only`) if the design requires a minimalist look without visible text labels.