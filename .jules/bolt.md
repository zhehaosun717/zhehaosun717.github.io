## 2024-05-24 - Layout Thrashing in Animation Loops
**Learning:** Calling `getBoundingClientRect()` inside `requestAnimationFrame` causes layout thrashing, significantly dropping frame rates when interleaved with visual updates.
**Action:** Cache bounding rectangles using `ResizeObserver` or during low-frequency events (`resize`). In high-frequency loops (like `animate` or `scroll`), dynamically calculate element positions using scroll differences (`window.scrollY - initialScrollY`) instead of querying the DOM.
