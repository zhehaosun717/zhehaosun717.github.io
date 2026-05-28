## 2024-05-24 - Layout Thrashing in Animation Loops
**Learning:** Calling `getBoundingClientRect()` inside a `requestAnimationFrame` loop that also manipulates DOM styles (`transform`) causes severe layout thrashing. This forces the browser to synchronously recalculate layout every frame, severely degrading performance.
**Action:** Always cache bounding boxes outside of the hot loop, preferably in `resize` and `scroll` event listeners to decouple layout reads from style writes.
