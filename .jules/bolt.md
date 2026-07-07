## 2024-07-07 - Prevent Layout Thrashing in Scroll Progress
**Learning:** Animating layout-triggering properties like `width` or `height` during frequent events (like scroll progress bars) causes severe layout thrashing.
**Action:** Optimize these by switching to GPU-composited properties like `transform: scaleX(...)` paired with `transform-origin` to prevent main-thread blocking.