## 2024-05-20 - Add screen reader explicit labels to form
**Learning:** Screen readers cannot always reliably use `placeholder` attributes as accessible labels. Forms need explicit `<label>` elements linked via `for` and `id` attributes. If visual design requires hiding labels, `.sr-only` utility classes allow accessibility without compromising the aesthetic.
**Action:** Always include explicit, programmatically associated labels for input fields, using `.sr-only` when visually hidden labels are necessary.
