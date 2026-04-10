## 2024-04-10 - Project Card Keyboard Accessibility
**Learning:** Custom interactive elements (like the `.project-card-header` accordion triggers) that aren't native `<button>` elements need explicit focus styling (`*:focus-visible`), structural roles (`role="button"`, `tabindex="0"`), and keyboard event handlers (Space/Enter) to be fully accessible.
**Action:** When implementing non-native interactive cards/accordions, always ensure keyboard navigation matches mouse interaction parity, and manage ARIA states dynamically.
