## 2024-05-18 - Caching Bounding Boxes in High-Frequency Events
**Learning:** Calculating `getBoundingClientRect()` inside high-frequency event listeners like `mousemove` forces synchronous layout recalculations, causing severe layout thrashing (especially on transformed elements).
**Action:** Always cache bounding boxes on lower-frequency events (like `mouseenter`) and use scroll deltas (`window.scrollY`/`scrollX`) to dynamically adjust the cached coordinates during the high-frequency event, avoiding expensive DOM reads.
