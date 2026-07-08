## 2024-10-18 - Layout Thrashing in Scroll Progress
**Learning:** Animating layout-triggering properties like `width` during frequent events (like scroll progress bars) causes severe layout thrashing.
**Action:** Optimize these by switching to GPU-composited properties like `transform: scaleX(...)` paired with `transform-origin`.