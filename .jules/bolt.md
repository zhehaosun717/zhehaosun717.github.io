## 2026-06-13 - Layout Thrashing in Magnetic Links
**Learning:** Calculating `getBoundingClientRect()` inside high-frequency event handlers like `mousemove` causes severe layout thrashing, especially when the element is actively transformed (e.g., by GSAP). The transformations themselves displace the bounding box, leading to inaccurate coordinates and jitter.
**Action:** Always cache the bounding box on lower-frequency events like `mouseenter` and compute dynamic adjustments using current scroll differences (`window.scrollY - initialScrollY`) rather than recalculating the layout.
