## 2024-05-23 - Eliminating Layout Thrashing in Animation Loops
**Learning:** Calling `getBoundingClientRect()` inside a `requestAnimationFrame` hot loop causes severe layout thrashing, significantly degrading performance, especially for visual effects like fluid distortions.
**Action:** Always cache element bounding boxes during `resize` and `scroll` events and reference the cached values within the animation loop to maintain high frame rates.
