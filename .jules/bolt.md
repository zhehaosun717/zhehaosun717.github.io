## 2024-06-21 - Layout Thrashing in Animation Loops
**Learning:** Calling `getBoundingClientRect()` inside a `requestAnimationFrame` loop causes severe layout thrashing, especially when many elements exist on the page. The `scroll` event is a high-frequency event and must not be used to update layout caches, as it also causes thrashing.
**Action:** Mitigate layout thrashing by caching bounding rectangles during low-frequency events (e.g., `resize`, `mouseenter`) and dynamically calculating current positions using scroll differences (`window.scrollY - initialScrollY`).
