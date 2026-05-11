## 2024-05-23 - Cached Layout Bounds in Animation Loop
**Learning:** Using `getBoundingClientRect()` inside a `requestAnimationFrame` loop causes severe layout thrashing (synchronous layout calculation). In `js/fluid-distortion.js`, caching the bounds and updating them only on `scroll`/`resize` via a ticking lock drastically reduces the loop execution time.
**Action:** Always cache bounding boxes outside of high-frequency animation loops and update them via event listeners (scroll/resize) with a ticking boolean lock to prevent layout thrashing.
