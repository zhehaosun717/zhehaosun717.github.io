## 2024-05-24 - [Layout Thrashing in Animation Loop]
**Learning:** Calling `getBoundingClientRect()` inside a `requestAnimationFrame` loop causes severe layout thrashing, even if DOM mutations (like `style.transform`) happen on different elements. This is because the browser is forced to synchronously recalculate layout on every frame.
**Action:** Cache bounding boxes using `resize` and `scroll` listeners (with a `requestAnimationFrame` throttle for scroll) to decouple layout reads from the high-frequency animation loop.
