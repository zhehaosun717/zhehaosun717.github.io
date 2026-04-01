const { performance } = require('perf_hooks');

const particlesCount = 2000;
const connectionDistance = 15;
const mouseDistance = 25;

// Mock position array
const positions = new Float32Array(particlesCount * 3);
for (let i = 0; i < positions.length; i++) {
  positions[i] = (Math.random() - 0.5) * 100;
}

const mouse3D = { x: 0, y: 0, z: 0 };

function runCurrentImplementation() {
  const start = performance.now();
  let dummySum = 0; // to prevent V8 from optimizing the loop completely away

  // Simulate 60 frames
  for (let frame = 0; frame < 60; frame++) {
    for (let i = 0; i < particlesCount; i++) {
      const i3 = i * 3;

      const dx = mouse3D.x - positions[i3];
      const dy = mouse3D.y - positions[i3 + 1];
      const dz = mouse3D.z - positions[i3 + 2];
      const distSq = dx*dx + dy*dy + dz*dz;

      // Current redundant calculation
      if (distSq < mouseDistance * mouseDistance) {
        const force = (mouseDistance * mouseDistance - distSq) / (mouseDistance * mouseDistance);
        dummySum += force;
      }

      for (let j = i + 1; j < i + 8; j++) {
         const jMod = j % particlesCount;
         const j3 = jMod * 3;

         const dx2 = positions[i3] - positions[j3];
         const dy2 = positions[i3+1] - positions[j3+1];
         const dz2 = positions[i3+2] - positions[j3+2];

         const distSq2 = dx2*dx2 + dy2*dy2 + dz2*dz2;

         // Current redundant calculation
         if (distSq2 < connectionDistance * connectionDistance) {
            dummySum += 1;
         }
      }
    }
  }
  const end = performance.now();
  return { time: end - start, dummySum };
}

function runOptimizedImplementation() {
  const start = performance.now();
  let dummySum = 0;

  // Pre-calculate outside the loop
  const mouseDistanceSq = mouseDistance * mouseDistance;
  const connectionDistanceSq = connectionDistance * connectionDistance;

  // Simulate 60 frames
  for (let frame = 0; frame < 60; frame++) {
    for (let i = 0; i < particlesCount; i++) {
      const i3 = i * 3;

      const dx = mouse3D.x - positions[i3];
      const dy = mouse3D.y - positions[i3 + 1];
      const dz = mouse3D.z - positions[i3 + 2];
      const distSq = dx*dx + dy*dy + dz*dz;

      // Optimized
      if (distSq < mouseDistanceSq) {
        const force = (mouseDistanceSq - distSq) / mouseDistanceSq;
        dummySum += force;
      }

      for (let j = i + 1; j < i + 8; j++) {
         const jMod = j % particlesCount;
         const j3 = jMod * 3;

         const dx2 = positions[i3] - positions[j3];
         const dy2 = positions[i3+1] - positions[j3+1];
         const dz2 = positions[i3+2] - positions[j3+2];

         const distSq2 = dx2*dx2 + dy2*dy2 + dz2*dz2;

         // Optimized
         if (distSq2 < connectionDistanceSq) {
            dummySum += 1;
         }
      }
    }
  }
  const end = performance.now();
  return { time: end - start, dummySum };
}

// Warmup V8
for(let i=0; i<5; i++) {
    runCurrentImplementation();
    runOptimizedImplementation();
}

let totalCurrent = 0;
let totalOptimized = 0;
const iterations = 50;

for(let i=0; i<iterations; i++) {
    totalCurrent += runCurrentImplementation().time;
    totalOptimized += runOptimizedImplementation().time;
}

const avgCurrent = totalCurrent / iterations;
const avgOptimized = totalOptimized / iterations;
const improvement = ((avgCurrent - avgOptimized) / avgCurrent) * 100;

console.log(`Baseline (current) average time per 60 frames: ${avgCurrent.toFixed(4)} ms`);
console.log(`Optimized average time per 60 frames: ${avgOptimized.toFixed(4)} ms`);
console.log(`Improvement: ${improvement.toFixed(2)}% faster`);
