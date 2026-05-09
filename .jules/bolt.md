## 2024-10-24 - Layout thrashing in animation loops
**Learning:** Calling `getBoundingClientRect()` inside a `requestAnimationFrame` loop causes severe layout thrashing because it forces the browser to synchronously recalculate layout every frame.
**Action:** Always cache element bounding boxes during `resize` and `scroll` events, and read from this cached state within the animation loop to maintain high performance.
