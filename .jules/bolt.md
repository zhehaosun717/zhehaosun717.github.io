## 2024-05-14 - Optimize Math.sqrt in Animation Loops
**Learning:** In high-frequency animation loops like requestAnimationFrame, redundant `Math.sqrt` calls for distance calculation on off-screen or out-of-influence elements can cause performance bottlenecks.
**Action:** Use squared distance comparisons (`distSq < thresholdSq`) to gate expensive operations. Only compute the actual square root when the element is within the influence radius and continuous math gradients (like lerp or falloff) are necessary.
