## 2024-05-31 - Mitigating Layout Thrashing in Animation Loops
**Learning:** Calling `getBoundingClientRect()` inside a `requestAnimationFrame` loop caused severe layout thrashing in `js/fluid-distortion.js` because DOM reads were interleaved with DOM writes (`style.transform` updates) across multiple cards on every frame.
**Action:** Always cache element bounding boxes during `resize` and `scroll` listeners, and read the cached values in the high-frequency render loop to separate DOM reads from writes.
