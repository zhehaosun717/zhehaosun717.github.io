## 2026-04-11 - Pre-calculate squared distances in animation loops
**Learning:** In highly active animation loops (like Three.js), repeated multiplication for constants or unnecessary Math.sqrt calls can add significant CPU overhead per frame. In this codebase, avoiding these in js/background.js and js/fluid-distortion.js saves tens of thousands of operations per frame.
**Action:** Pre-calculate squared thresholds during initialization. Use distSq < thresholdSq checks to early-out of expensive mathematical gradients (Math.sqrt) unless strictly needed.
