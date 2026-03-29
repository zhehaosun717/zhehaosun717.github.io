/**
 * ZHEHAO SUN Portfolio — Three.js Interactive 3D Background
 * Refined: subtle atmospheric light pools, responsive mouse, flowing aurora.
 * Blob shapes act as soft additive luminance — NOT harsh contrast masks.
 */

class ShaderBackground {
  constructor() {
    this.canvas = document.getElementById('three-canvas');
    this.mouse = { x: 0.5, y: 0.5, targetX: 0.5, targetY: 0.5 };
    this.mouseVelocity = { x: 0, y: 0 };
    this.prevMouse = { x: 0.5, y: 0.5 };
    this.scrollProgress = 0;
    this.clock = new THREE.Clock();
    this.init();
  }

  init() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: false,
      alpha: false,
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));

    this.createShaderMesh();
    this.createParticles();
    this.bindEvents();
    this.animate();
  }

  /* ========== MAIN SHADER QUAD ========== */
  createShaderMesh() {
    const vertexShader = `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = vec4(position, 1.0);
      }
    `;

    const fragmentShader = `
      precision highp float;

      uniform float uTime;
      uniform vec2 uMouse;
      uniform vec2 uMouseVelocity;
      uniform vec2 uResolution;
      uniform float uScrollProgress;

      varying vec2 vUv;

      // --- Noise ---
      vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
      vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

      float snoise(vec3 v) {
        const vec2 C = vec2(1.0/6.0, 1.0/3.0);
        const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
        vec3 i = floor(v + dot(v, C.yyy));
        vec3 x0 = v - i + dot(i, C.xxx);
        vec3 g = step(x0.yzx, x0.xyz);
        vec3 l = 1.0 - g;
        vec3 i1 = min(g.xyz, l.zxy);
        vec3 i2 = max(g.xyz, l.zxy);
        vec3 x1 = x0 - i1 + C.xxx;
        vec3 x2 = x0 - i2 + C.yyy;
        vec3 x3 = x0 - D.yyy;
        i = mod289(i);
        vec4 p = permute(permute(permute(
          i.z + vec4(0.0, i1.z, i2.z, 1.0))
          + i.y + vec4(0.0, i1.y, i2.y, 1.0))
          + i.x + vec4(0.0, i1.x, i2.x, 1.0));
        float n_ = 0.142857142857;
        vec3 ns = n_ * D.wyz - D.xzx;
        vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
        vec4 x_ = floor(j * ns.z);
        vec4 y_ = floor(j - 7.0 * x_);
        vec4 x = x_ * ns.x + ns.yyyy;
        vec4 y = y_ * ns.x + ns.yyyy;
        vec4 h = 1.0 - abs(x) - abs(y);
        vec4 b0 = vec4(x.xy, y.xy);
        vec4 b1 = vec4(x.zw, y.zw);
        vec4 s0 = floor(b0)*2.0 + 1.0;
        vec4 s1 = floor(b1)*2.0 + 1.0;
        vec4 sh = -step(h, vec4(0.0));
        vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
        vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
        vec3 p0 = vec3(a0.xy, h.x);
        vec3 p1 = vec3(a0.zw, h.y);
        vec3 p2 = vec3(a1.xy, h.z);
        vec3 p3 = vec3(a1.zw, h.w);
        vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
        p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
        vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
        m = m * m;
        return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
      }

      float fbm(vec3 p) {
        float v = 0.0, a = 0.5;
        for (int i = 0; i < 5; i++) {
          v += a * snoise(p);
          p *= 2.0;
          a *= 0.5;
        }
        return v;
      }

      // Domain warping — creates visible organic swirls
      float warpedNoise(vec3 p) {
        vec3 q = vec3(
          fbm(p + vec3(0.0, 0.0, 0.0)),
          fbm(p + vec3(5.2, 1.3, 2.8)),
          0.0
        );
        vec3 r = vec3(
          fbm(p + 4.0 * q + vec3(1.7, 9.2, 0.0)),
          fbm(p + 4.0 * q + vec3(8.3, 2.8, 0.0)),
          0.0
        );
        return fbm(p + 3.5 * r);
      }

      void main() {
        vec2 uv = vUv;
        float aspect = uResolution.x / uResolution.y;
        vec2 p = (uv - 0.5) * vec2(aspect, 1.0);
        float t = uTime * 0.1;

        // --- Mouse reactive distortion ---
        vec2 mousePos = (uMouse - 0.5) * vec2(aspect, 1.0);
        float mouseDist = length(p - mousePos);
        float velocity = length(uMouseVelocity) * 3.0;

        // Ripple from mouse movement
        float ripple = sin(mouseDist * 10.0 - uTime * 4.0) * exp(-mouseDist * 2.5) * min(velocity, 1.0) * 0.15;

        // Magnetic pull around cursor (subtle)
        vec2 mouseDir = normalize(p - mousePos + 0.001);
        float pull = smoothstep(0.8, 0.0, mouseDist) * 0.12;
        p += mouseDir * pull;
        p += mouseDir * ripple;

        // --- MAIN FLOW: domain-warped turbulence ---
        float warp = warpedNoise(vec3(p * 0.8, t * 0.25));
        float flow1 = fbm(vec3(p * 1.8 + warp * 0.6, t * 0.3));
        float flow2 = fbm(vec3(p * 2.5 - t * 0.2, t * 0.15 + 10.0));
        float detail = snoise(vec3(p * 3.0 + flow1 * 0.3, t * 0.12));

        // --- Color palette (scroll-driven) ---
        vec3 deepNavy    = vec3(0.03, 0.05, 0.12);
        vec3 indigoShift = vec3(0.06, 0.03, 0.14);
        vec3 darkTeal    = vec3(0.02, 0.06, 0.10);
        vec3 midnightBlue= vec3(0.02, 0.03, 0.08);
        vec3 warmEmber   = vec3(0.10, 0.05, 0.02);

        float sp = uScrollProgress;
        vec3 baseColor;
        if (sp < 0.2) {
          baseColor = mix(deepNavy, indigoShift, sp * 5.0);
        } else if (sp < 0.4) {
          baseColor = mix(indigoShift, darkTeal, (sp - 0.2) * 5.0);
        } else if (sp < 0.6) {
          baseColor = mix(darkTeal, midnightBlue, (sp - 0.4) * 5.0);
        } else if (sp < 0.8) {
          baseColor = mix(midnightBlue, deepNavy, (sp - 0.6) * 5.0);
        } else {
          baseColor = mix(deepNavy, warmEmber, (sp - 0.8) * 5.0);
        }

        // --- VISIBLE flow colors layered onto base ---
        vec3 color = baseColor;

        // Warm/cool flow streaks (subtler)
        float flowIntensity = warp * 0.5 + 0.5;
        vec3 warmFlow = vec3(0.12, 0.07, 0.03) * flowIntensity * 0.25;
        vec3 coolFlow = vec3(0.03, 0.07, 0.16) * (1.0 - flowIntensity) * 0.2;
        color += warmFlow + coolFlow;

        // Turbulence highlights
        float highlight = smoothstep(0.2, 0.8, flow1) * 0.15;
        color += vec3(0.10, 0.08, 0.04) * highlight;

        // Detail shimmer
        float shimmer = max(detail, 0.0) * 0.1;
        color += vec3(0.04, 0.06, 0.12) * shimmer;

        // Secondary flow with cool tint
        color += vec3(0.02, 0.04, 0.08) * max(flow2, 0.0) * 0.3;

        // --- AURORA near cursor — subtle glow ---
        float auroraMask = smoothstep(0.7, 0.0, mouseDist);
        float auroraWave = snoise(vec3(p * 4.0 + uTime * 0.8, uTime * 0.4)) * 0.5 + 0.5;
        vec3 auroraColor1 = vec3(0.14, 0.10, 0.03); // gold
        vec3 auroraColor2 = vec3(0.03, 0.10, 0.18); // teal
        vec3 aurora = mix(auroraColor1, auroraColor2, auroraWave);
        color += aurora * auroraMask * (0.10 + velocity * 0.15);

        // --- Soft light caustics ---
        float caustic = abs(snoise(vec3(p * 5.0 + t * 0.5, t * 0.3)));
        caustic = pow(caustic, 3.0) * 0.08;
        color += vec3(0.08, 0.07, 0.04) * caustic;

        // --- Faint grid for tech feel (only mid-scroll) ---
        float gridX = smoothstep(0.97, 1.0, abs(sin(p.x * 30.0)));
        float gridY = smoothstep(0.97, 1.0, abs(sin(p.y * 30.0)));
        float gridAlpha = (gridX + gridY) * 0.015 * smoothstep(0.25, 0.5, sp) * smoothstep(0.75, 0.5, sp);
        color += vec3(0.2, 0.18, 0.10) * gridAlpha;

        // --- Edge glow (soft light around borders) ---
        float edgeGlow = smoothstep(0.0, 0.08, uv.x) * smoothstep(1.0, 0.92, uv.x);
        edgeGlow *= smoothstep(0.0, 0.08, uv.y) * smoothstep(1.0, 0.92, uv.y);
        vec3 borderLight = vec3(0.04, 0.05, 0.12) * (1.0 - edgeGlow) * 0.3;
        color += borderLight;

        // --- Vignette ---
        float vignette = 1.0 - smoothstep(0.3, 1.6, length(p));
        color *= 0.65 + vignette * 0.35;

        // --- Film grain ---
        float grain = fract(sin(dot(uv * uTime, vec2(12.9898, 78.233))) * 43758.5453);
        color += (grain - 0.5) * 0.012;

        color = pow(max(color, 0.0), vec3(0.92));

        // === SOFT LIGHT POOLS (replaces aggressive blob mask) ===
        // Instead of dimming everything outside & hyper-brightening inside,
        // we add a gentle luminous glow ADDITIVELY so the base always shows.

        // Light pool 1 — large primary, drifts diagonally with scroll
        vec2 lp1Center = vec2(
          0.35 + sin(t * 0.35 + sp * 2.5) * 0.18,
          0.3 + cos(t * 0.25) * 0.12 + sp * 0.35
        );
        float lp1Noise = snoise(vec3((uv - lp1Center) * 2.5, t * 0.18)) * 0.08;
        float lp1 = length((uv - lp1Center) * vec2(1.0, 1.2)) + lp1Noise;
        float lp1Glow = exp(-lp1 * lp1 * 8.0) * 0.2;

        // Light pool 2 — follows mouse with responsive tracking
        vec2 lp2Center = mix(
          vec2(0.6, 0.5),
          uMouse,
          0.45
        );
        lp2Center += vec2(sin(t * 0.4), cos(t * 0.3)) * 0.05;
        float lp2Noise = snoise(vec3((uv - lp2Center) * 3.0, t * 0.22 + 5.0)) * 0.06;
        float lp2 = length((uv - lp2Center) * vec2(1.1, 0.95)) + lp2Noise;
        float lp2Glow = exp(-lp2 * lp2 * 12.0) * 0.18;

        // Light pool 3 — small accent, appears more at mid-scroll
        vec2 lp3Center = vec2(
          0.7 + cos(t * 0.4 + 2.0) * 0.12,
          0.25 + sin(t * 0.5) * 0.08 - sp * 0.25
        );
        float lp3Noise = snoise(vec3((uv - lp3Center) * 4.0, t * 0.28 + 10.0)) * 0.05;
        float lp3 = length((uv - lp3Center) * vec2(0.9, 1.0)) + lp3Noise;
        float midScrollBoost = smoothstep(0.15, 0.4, sp) * smoothstep(0.85, 0.6, sp);
        float lp3Glow = exp(-lp3 * lp3 * 18.0) * 0.12 * (0.5 + midScrollBoost * 0.5);

        // Combine light pools — additive blend onto base color
        float totalGlow = lp1Glow + lp2Glow + lp3Glow;

        // Warm/cool tint for light pools based on scroll
        vec3 glowWarm = vec3(0.15, 0.10, 0.04);
        vec3 glowCool = vec3(0.04, 0.08, 0.18);
        vec3 glowTint = mix(glowWarm, glowCool, sp);

        color += glowTint * totalGlow * 2.0;

        // Subtle chromatic fringe on light pool edges
        float edgeFringe = smoothstep(0.0, 0.06, totalGlow) * smoothstep(0.15, 0.06, totalGlow);
        color.r += edgeFringe * 0.02;
        color.b += edgeFringe * 0.03;

        gl_FragColor = vec4(color, 1.0);
      }
    `;

    const geometry = new THREE.PlaneGeometry(2, 2);
    this.material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uMouse: { value: new THREE.Vector2(0.5, 0.5) },
        uMouseVelocity: { value: new THREE.Vector2(0, 0) },
        uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
        uScrollProgress: { value: 0 },
      },
      depthTest: false,
      depthWrite: false,
    });

    const mesh = new THREE.Mesh(geometry, this.material);
    this.scene.add(mesh);
  }

  /* ========== FLOATING PARTICLES ========== */
  createParticles() {
    const count = 120;
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const speeds = new Float32Array(count);
    const phases = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      positions[i * 3]     = (Math.random() - 0.5) * 4;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 4;
      positions[i * 3 + 2] = Math.random() * 2 - 1;
      sizes[i] = Math.random() * 1.8 + 0.5;
      speeds[i] = Math.random() * 0.4 + 0.1;
      phases[i] = Math.random() * 6.28;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute('aSpeed', new THREE.BufferAttribute(speeds, 1));
    geometry.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));

    const particleVert = `
      attribute float aSize;
      attribute float aSpeed;
      attribute float aPhase;
      uniform float uTime;
      uniform vec2 uMouse;
      varying float vAlpha;
      varying float vDepth;

      void main() {
        vec3 pos = position;

        // Floating motion with phase offset
        pos.x += sin(uTime * aSpeed + aPhase + pos.y * 2.0) * 0.2;
        pos.y += cos(uTime * aSpeed * 0.8 + aPhase + pos.x * 1.5) * 0.15;
        pos.y += uTime * aSpeed * 0.03;

        // Wrap
        pos.x = mod(pos.x + 2.0, 4.0) - 2.0;
        pos.y = mod(pos.y + 2.0, 4.0) - 2.0;

        // Mouse interaction — particles flee cursor
        vec2 mousePos = (uMouse - 0.5) * 2.0;
        vec2 diff = pos.xy - mousePos;
        float dist = length(diff);
        if (dist < 1.0) {
          pos.xy += normalize(diff) * (1.0 - dist) * 0.5;
        }

        vDepth = pos.z;
        // Pulsing alpha
        vAlpha = (0.5 + 0.5 * sin(uTime * 1.5 + aPhase)) * smoothstep(-1.0, 0.5, pos.z);

        vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
        gl_PointSize = aSize * (350.0 / -mvPos.z);
        gl_Position = projectionMatrix * mvPos;
      }
    `;

    const particleFrag = `
      precision highp float;
      varying float vAlpha;
      varying float vDepth;

      void main() {
        vec2 center = gl_PointCoord - 0.5;
        float d = length(center);
        if (d > 0.5) discard;

        // Soft glow falloff
        float glow = exp(-d * 6.0) * 0.8 + smoothstep(0.5, 0.0, d) * 0.2;
        float alpha = glow * vAlpha * 0.25;

        // Warm/cool mix based on depth
        vec3 warm = vec3(0.9, 0.7, 0.4);
        vec3 cool = vec3(0.4, 0.6, 0.9);
        vec3 color = mix(cool, warm, vDepth * 0.5 + 0.5);

        gl_FragColor = vec4(color, alpha);
      }
    `;

    this.particleMaterial = new THREE.ShaderMaterial({
      vertexShader: particleVert,
      fragmentShader: particleFrag,
      uniforms: {
        uTime: { value: 0 },
        uMouse: { value: new THREE.Vector2(0.5, 0.5) },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    // Particle camera
    this.particleCamera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 10);
    this.particleCamera.position.z = 2;

    this.particleScene = new THREE.Scene();
    const points = new THREE.Points(geometry, this.particleMaterial);
    this.particleScene.add(points);
  }

  /* ========== EVENTS ========== */
  bindEvents() {
    window.addEventListener('mousemove', (e) => {
      this.mouse.targetX = e.clientX / window.innerWidth;
      this.mouse.targetY = 1.0 - e.clientY / window.innerHeight;
    });

    window.addEventListener('touchmove', (e) => {
      if (e.touches.length > 0) {
        this.mouse.targetX = e.touches[0].clientX / window.innerWidth;
        this.mouse.targetY = 1.0 - e.touches[0].clientY / window.innerHeight;
      }
    }, { passive: true });

    window.addEventListener('scroll', () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      this.scrollProgress = scrollHeight > 0 ? window.scrollY / scrollHeight : 0;
    }, { passive: true });

    window.addEventListener('resize', () => {
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.material.uniforms.uResolution.value.set(window.innerWidth, window.innerHeight);
      this.particleCamera.aspect = window.innerWidth / window.innerHeight;
      this.particleCamera.updateProjectionMatrix();
    });
  }

  /* ========== RENDER LOOP ========== */
  animate() {
    requestAnimationFrame(() => this.animate());

    // MUCH MORE RESPONSIVE mouse tracking (0.12 instead of 0.06)
    this.mouse.x += (this.mouse.targetX - this.mouse.x) * 0.12;
    this.mouse.y += (this.mouse.targetY - this.mouse.y) * 0.12;

    // Track velocity
    this.mouseVelocity.x = this.mouse.x - this.prevMouse.x;
    this.mouseVelocity.y = this.mouse.y - this.prevMouse.y;
    this.prevMouse.x = this.mouse.x;
    this.prevMouse.y = this.mouse.y;

    const elapsed = this.clock.getElapsedTime();

    // Update shader uniforms
    this.material.uniforms.uTime.value = elapsed;
    this.material.uniforms.uMouse.value.set(this.mouse.x, this.mouse.y);
    this.material.uniforms.uMouseVelocity.value.set(this.mouseVelocity.x, this.mouseVelocity.y);
    // Faster scroll response too (0.08 instead of 0.05)
    this.material.uniforms.uScrollProgress.value +=
      (this.scrollProgress - this.material.uniforms.uScrollProgress.value) * 0.08;

    // Update particle uniforms
    this.particleMaterial.uniforms.uTime.value = elapsed;
    this.particleMaterial.uniforms.uMouse.value.set(this.mouse.x, this.mouse.y);

    // Render background then particles
    this.renderer.autoClear = true;
    this.renderer.render(this.scene, this.camera);
    this.renderer.autoClear = false;
    this.renderer.render(this.particleScene, this.particleCamera);
  }
}

window.ShaderBackground = ShaderBackground;

function initShaderBackground() {
  if (document.getElementById('three-canvas') && typeof THREE !== 'undefined') {
    window.shaderBg = new ShaderBackground();
  }
}
window.initShaderBackground = initShaderBackground;
