## 2024-04-25 - Keyboard Accessibility on Non-Native Elements
**Learning:** Using `div`s as interactive accordion headers completely locks out keyboard users from core content unless explicitly configured with roles, tab stops, and key handlers.
**Action:** Always ensure `div`-based interactive elements implement `role="button"`, `tabindex="0"`, and `keydown` event listeners for 'Enter' and 'Space' (preventing default scroll).
