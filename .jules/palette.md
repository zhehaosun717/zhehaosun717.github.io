## 2024-05-24 - Screen Reader Labels for Forms
**Learning:** In this Jekyll application, contact forms currently rely solely on placeholder text for visual context without explicit `<label>` elements, causing accessibility gaps for screen readers. Netlify honeypot fields also use unique structural wrapping (`<p class="sr-only"><label>...`) compared to standard fields.
**Action:** Always pair visible form inputs with explicit `<label>` elements that are linked via `for` and `id` attributes. If visual design prevents visible labels, apply the `.sr-only` class directly to the `<label>` element.
