## 2024-05-16 - [Layout Thrashing in High-Frequency Events]
**Learning:** Frequent calls to `getBoundingClientRect()` within `mousemove` or `requestAnimationFrame` cause significant synchronous layout recalculations (thrashing). This is a prominent bottleneck in this vanilla JS architecture's magnetic links.
**Action:** Cache bounding box dimensions on `mouseenter` instead of recalculating them on every `mousemove` tick to avoid synchronous reflows and dramatically reduce execution time.
