## 2024-05-24 - Scroll Progress Layout Thrashing
**Learning:** Animating layout-triggering properties like `width` during frequent events (like scroll progress bars) causes severe layout thrashing.
**Action:** Switch to GPU-composited properties like `transform: scaleX(...)` paired with `transform-origin` to avoid layout calculations.
