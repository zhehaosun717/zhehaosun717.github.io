# Bolt's Performance Journal

## 2024-05-24 - Layout Thrashing in Animation Loop
**Learning:** Calling `getBoundingClientRect()` inside a `requestAnimationFrame` loop causes severe layout thrashing, especially when styles are also being updated in the same loop or by other scripts.
**Action:** Cache bounding box measurements during `resize` and `scroll` events, and read from the cached values during the animation loop. This reduced the animation loop execution time by ~73%.
