## 2023-10-27 - Keyboard Accessibility for Div-Based Cards
**Learning:** In this vanilla JS project, non-native interactive elements (like `.project-card-header` `div`s) require manual management of ARIA attributes (`role="button"`, `aria-expanded`), `tabindex`, and keyboard event listeners ('Enter'/'Space') to be accessible to keyboard and screen reader users.
**Action:** When implementing custom interactive components, always ensure they are fully navigable and operable via keyboard, mirroring native button functionality.
