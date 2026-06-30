## 2024-05-26 - Layout Thrashing with width/height updates
**Learning:** Updating width or height properties on scroll (e.g., `bar.style.width = ...`) forces the browser to recalculate layout and paint on every scroll event, which causes layout thrashing and drops frames. Scroll progress bars should use `transform: scaleX(...)` instead.
**Action:** Always use composite-only properties like `transform` for frequent visual updates like progress bars during scroll events to avoid triggering synchronous layout recalculations.
