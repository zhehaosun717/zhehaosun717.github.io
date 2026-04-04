## 2024-04-04 - [Optimize Constants and Math.sqrt in Animation Loops]
**Learning:** High-frequency GSAP/Three.js animation loops like in `js/fluid-distortion.js` can suffer performance hits from redundant `Math.sqrt` calculations, especially when processing distance across many elements (e.g. `cards.forEach`).
**Action:** Use squared threshold checks (e.g., `distSq < thresholdSq`) instead of calculating distance eagerly, and employ lazy-loading closures or conditionally calculate `Math.sqrt` only when elements meet the proximity checks.
