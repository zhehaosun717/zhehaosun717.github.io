## 2024-10-24 - Layout Thrashing in requestAnimationFrame
**Learning:** Calling `getBoundingClientRect()` inside a `requestAnimationFrame` loop causes severe layout thrashing (forced synchronous layout), especially when styles are being modified. This resulted in a ~0.307ms execution time per frame.
**Action:** Always cache bounding boxes outside the animation loop, updating them only on `resize` and `scroll` events. This reduced execution time to ~0.084ms (~73% improvement).
