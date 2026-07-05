## 2024-05-24 - Scroll Progress Layout Thrashing
**Learning:** Animating layout-triggering properties like `width` during frequent events (such as scroll listeners) causes severe layout thrashing because the browser has to recalculate the layout on every frame.
**Action:** Always animate composite-only properties like `transform: scaleX()` along with `transform-origin` instead of `width` to offload the work to the GPU and prevent layout recalculations.
