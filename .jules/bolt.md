## 2026-04-13 - [Pre-calculating distance loops in background.js]
**Learning:** Inside the `background.js` animation loops, pre-calculating squared constants (`mouseDistanceSq`, `connectionDistanceSq`) for distances instead of repetitive multiplication improves performance and removes hundreds of thousands of redundant operations per second. Window size resize events that update dimensions fail if dimensions are defined as `const`.
**Action:** Always pre-calculate invariant constant mathematical operations outside loops, and always use `let` for variables subject to change by window resizing.
