## 2026-07-01 - Scroll Progress Layout Thrashing
**Learning:** Animating layout-triggering properties like `width` during frequent events (like scroll progress bars) causes severe layout thrashing.
**Action:** Optimize these by switching to GPU-composited properties like `transform: scaleX(...)` paired with `transform-origin` to eliminate layout re-calculations on every scroll tick.
