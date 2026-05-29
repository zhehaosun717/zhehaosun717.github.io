## 2024-10-24 - Layout Thrashing in Animation Loops
**Learning:** Calling `getBoundingClientRect()` inside a `requestAnimationFrame` loop that also writes inline styles (like `transform` on SVG filters) causes severe layout thrashing. The browser is forced to synchronously recalculate layout on every frame for every card, creating a performance bottleneck.
**Action:** Always cache bounding boxes outside of the hot loop (e.g., update them via `resize` and `scroll` event listeners) to separate DOM reads from DOM writes and ensure a smooth animation loop execution time.
