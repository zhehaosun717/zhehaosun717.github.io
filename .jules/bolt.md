## 2024-05-20 - Magnetic Link Layout Thrashing Optimization
**Learning:** Calculating `getBoundingClientRect()` inside a `mousemove` handler for actively transformed elements causes layout thrashing and returns inaccurate displaced coordinates because the element itself is being moved by GSAP.
**Action:** Cache the bounding box and initial scroll positions (`window.scrollY`/`window.scrollX`) on `mouseenter`. During `mousemove`, dynamically adjust the cached coordinates using scroll differences (`window.scrollY - initialScrollY`) rather than recalculating layout.
