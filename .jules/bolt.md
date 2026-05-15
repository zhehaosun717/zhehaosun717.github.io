## 2024-05-24 - [Cache Bounding Boxes in Animation Loops]
**Learning:** Calling `getBoundingClientRect()` repeatedly within a `requestAnimationFrame` loop creates unnecessary DOM reads that can cause layout thrashing and scale poorly with the number of elements.
**Action:** Always cache bounding boxes when they only change on specific events (like `scroll` or `resize`) and read from the cache inside high-frequency animation loops.
