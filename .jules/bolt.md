## 2024-05-24 - Layout Thrashing in Magnetic Links
**Learning:** Calling `getBoundingClientRect()` inside a `mousemove` event handler for magnetic links causes layout thrashing and inaccurate coordinate calculations when the element is actively transformed by GSAP.
**Action:** Cache the element's bounding box and initial scroll position (`window.scrollY`/`scrollX`) on `mouseenter`, and adjust coordinates dynamically during `mousemove` using scroll differences to avoid recalculation and improve performance.
