## 2024-05-24 - [Avoid Math.sqrt in performance-critical animation loops]
**Learning:** Using `Math.sqrt` in high-frequency animation loops (like `requestAnimationFrame`) can be a performance bottleneck, especially when calculating distances for threshold checks.
**Action:** Replace `Math.sqrt(dx * dx + dy * dy) < threshold` with `(dx * dx + dy * dy) < (threshold * threshold)`. Pre-calculate squared thresholds where possible to save compute cycles.
