## 2024-05-24 - Layout Thrashing in Animation Loops
**Learning:** Using `getBoundingClientRect()` inside a `requestAnimationFrame` loop, especially when visual styles are being animated, triggers continuous layout recalculations (reflows). This causes severe layout thrashing and degrades performance, which is an anti-pattern.
**Action:** Always cache bounding rectangles using `ResizeObserver` or during low-frequency events (like `resize`, `load`). Calculate positions dynamically using scroll differences (e.g., `card.docRect.top - window.scrollY`) to keep the critical animation path read-free.
