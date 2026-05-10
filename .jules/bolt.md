## 2024-05-24 - Layout thrashing in animation loops
**Learning:** Calling `getBoundingClientRect()` on multiple DOM elements directly inside a `requestAnimationFrame` loop alongside CSS updates causes severe layout thrashing (synchronous layout recalculations).
**Action:** Cache the bounding rects and only update them via `scroll` and `resize` event listeners using a boolean flag, separating DOM reads from DOM writes to ensure smooth frame rates.
