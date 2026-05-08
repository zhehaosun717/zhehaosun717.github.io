## 2024-05-08 - Layout Thrashing in Fluid Distortion
**Learning:** Layout thrashing in `js/fluid-distortion.js` was mitigated by caching element bounding boxes (`getBoundingClientRect`) during `resize` and `scroll` listeners, resulting in a measured ~73% improvement in animation loop execution time (from ~0.307ms to ~0.084ms).
**Action:** Always cache `getBoundingClientRect` outside of hot animation loops, using `resize` and `scroll` event listeners to update the cached dimensions instead of querying the DOM directly in every frame.
