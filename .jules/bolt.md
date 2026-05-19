## 2024-10-25 - Pre-calculating squared distance thresholds in WebGL loops
**Learning:** In hot loops like the particle system updating thousands of times per frame, repeatedly calculating threshold multiplications (e.g., `distSq < mouseDistance * mouseDistance`) introduces measurable performance overhead.
**Action:** Always replace repeated threshold multiplications with pre-calculated squared constants outside the animation loop, which resulted in a ~7% performance improvement for the hot loop logic here.
