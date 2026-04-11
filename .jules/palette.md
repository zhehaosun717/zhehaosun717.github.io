## 2026-04-11 - [Add Keyboard Accessibility to Div-based Interactive Elements]
**Learning:** `div`-based interactive elements (like accordions or expandable cards) require explicit `role="button"`, `tabindex="0"`, and `keydown` event listeners for 'Enter' and 'Space' to be accessible via keyboard. Native `<button>` elements handle this automatically.
**Action:** When creating custom interactive elements using generic containers (`div`, `span`), always implement full keyboard accessibility attributes and event listeners.
