## 2024-05-24 - Fix layout thrashing in fluid-distortion.js
**Learning:** Calling `getBoundingClientRect()` inside a `requestAnimationFrame` loop (like in `animate()`) forces synchronous layout recalculation on every frame, leading to severe layout thrashing and performance degradation, particularly on scroll or when interacting with multiple elements.
**Action:** Cache the bounding box properties (`rect`, `cx`, `cy`) in the `cards` array objects and update them only during `resize` and throttled `scroll` events. This avoids recalculating layout in the hot animation path.
