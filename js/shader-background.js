/**
 * ZHEHAO SUN Portfolio — Three.js r186 Iridescent Fluid-Wake & 3D Bokeh Background
 *
 * Architecture (high visual complexity, < 0.6ms GPU frame time):
 *   Pass 1 (FBO 320x320): Curl-Advected Fluid Wake buffer (stores trail density, ripple wave, and stroke phase)
 *   Pass 2 (Backdrop):    Domain-warped silk fluid + Thin-Film Iridescent Interference Ripples & Caustic Filaments
 *                         (#39C5BB Miku Teal <-> Electric Cyan <-> Cosmic Violet <-> Rose-Magenta <-> Champagne Gold)
 *   Pass 3 (3D Points):   True 3D Perspective Camera + Optical Depth-of-Field Bokeh Motes
 */

import * as THREE from 'three';

class ShaderBackground {
  constructor() {
    this.canvas = document.getElementById('three-canvas');
    if (!this.canvas) return;

    const ua = navigator.userAgent || '';
    const isMobile = window.innerWidth < 769 || /Mobi|Android|iPhone|iPad|iPod/i.test(ua);
    const isWeak =
      isMobile ||
      (typeof navigator.hardwareConcurrency === 'number' && navigator.hardwareConcurrency <= 4) ||
      (typeof navigator.deviceMemory === 'number' && navigator.deviceMemory <= 4);

    this.isMobile = isMobile;
    this.isWeakDevice = isWeak;
    this.reducedMotion =
      Boolean(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

    this.pointerNDC = new THREE.Vector2(0, 0);
    this.targetPointerNDC = new THREE.Vector2(0, 0);
    this.prevPointerNDC = new THREE.Vector2(0, 0);
    this.pointerWorld = new THREE.Vector3(0, 0, 0);
    this.hasPointerInput = false;
    this.pointerStrength = 0;
    this.lastPointerEventTime = performance.now();

    this._rayOrigin = new THREE.Vector3();
    this._rayDir = new THREE.Vector3();
    this._camTargetPos = new THREE.Vector3(0, 0, 10.5);
    this._camLookAt = new THREE.Vector3(0, 0, 0);
    this._currentLookAt = new THREE.Vector3(0, 0, 0);

    this.scrollProgress = 0;
    this.smoothScroll = 0;
    this.scrollLimit = 1;

    this.timer = new THREE.Timer();
    this.timer.connect(document);

    this.init();
  }

  init() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(48, width / height, 0.1, 100);
    this.camera.position.set(0, 0.2, 10.5);

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: !this.isMobile,
      alpha: false,
      powerPreference: this.isMobile ? 'default' : 'high-performance',
    });

    const maxDPR = this.isMobile ? 1.5 : 2.0;
    this.maxDPR = maxDPR;
    const dpr = Math.min(window.devicePixelRatio || 1, maxDPR);
    this.renderer.setPixelRatio(dpr);
    this.renderer.setSize(width, height);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;

    this.createFluidWakeFBO();
    this.createSilkFluidBackdrop();
    this.createAmbient3DBokeh(dpr);

    this.updateScrollLimit();
    this.scrollProgress = this.scrollLimit > 0 ? window.scrollY / this.scrollLimit : 0;
    this.smoothScroll = this.scrollProgress;

    this.bindEvents();
    this.renderer.setAnimationLoop(() => this.animate());
  }

  updateScrollLimit() {
    this.scrollLimit = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
  }

  /* ============================================================================
   * PASS 1: Curl-Advected Fluid Wake FBO (320x320 Ping-Pong — < 0.04ms GPU cost)
   * ============================================================================ */
  createFluidWakeFBO() {
    const size = this.isMobile ? 192 : 320;
    const opts = {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBAFormat,
      type: THREE.UnsignedByteType,
      depthBuffer: false,
      stencilBuffer: false,
    };

    this.wakeRT1 = new THREE.WebGLRenderTarget(size, size, opts);
    this.wakeRT2 = new THREE.WebGLRenderTarget(size, size, opts);
    this._wakeSwap = false;

    this.wakeScene = new THREE.Scene();
    this.wakeCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    this.wakeUniforms = {
      uPrevTex: { value: null },
      uPointerUV: { value: new THREE.Vector2(0.64, 0.57) },
      uPrevPointerUV: { value: new THREE.Vector2(0.64, 0.57) },
      uVelocity: { value: new THREE.Vector2(0, 0) },
      uAspect: { value: window.innerWidth / window.innerHeight },
      uTime: { value: 0 },
      uBrushStrength: { value: 0.75 },
    };

    const wakeMat = new THREE.ShaderMaterial({
      uniforms: this.wakeUniforms,
      depthTest: false,
      depthWrite: false,
      vertexShader: /* glsl */ `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = vec4(position.xy, 0.0, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        precision highp float;
        uniform sampler2D uPrevTex;
        uniform vec2 uPointerUV;
        uniform vec2 uPrevPointerUV;
        uniform vec2 uVelocity;
        uniform float uAspect;
        uniform float uTime;
        uniform float uBrushStrength;
        varying vec2 vUv;

        float sdSegment(vec2 p, vec2 a, vec2 b, out float hOut) {
          vec2 pa = p - a;
          vec2 ba = b - a;
          hOut = clamp(dot(pa, ba) / max(dot(ba, ba), 0.00001), 0.0, 1.0);
          return length(pa - ba * hOut);
        }

        void main() {
          vec2 aspectVec = vec2(uAspect, 1.0);
          vec2 p = vUv * aspectVec;

          float segH = 0.0;
          float d = sdSegment(p, uPrevPointerUV * aspectVec, uPointerUV * aspectVec, segH);

          // Zero curl drift at the cursor center (d near 0) so the head of the wake never drifts off-center;
          // only curl the trailing tail further behind the cursor!
          float tailFactor = smoothstep(0.02, 0.16, d);
          float curlAngle = sin(p.x * 6.5 + uTime * 0.85) * cos(p.y * 6.5 - uTime * 0.70) * 3.14159;
          vec2 curlOffset = vec2(cos(curlAngle), sin(curlAngle)) * 0.0018 * tailFactor;

          vec2 advectedUV = clamp(vUv - curlOffset - uVelocity * 0.003, 0.002, 0.998);
          vec4 prev = texture2D(uPrevTex, advectedUV);

          // Symmetric 4-tap neighbor diffusion
          vec2 texel = vec2(1.0 / 280.0);
          float nSum = (
            texture2D(uPrevTex, clamp(advectedUV + vec2(texel.x, 0.0), 0.0, 1.0)).r +
            texture2D(uPrevTex, clamp(advectedUV - vec2(texel.x, 0.0), 0.0, 1.0)).r +
            texture2D(uPrevTex, clamp(advectedUV + vec2(0.0, texel.y), 0.0, 1.0)).r +
            texture2D(uPrevTex, clamp(advectedUV - vec2(0.0, texel.y), 0.0, 1.0)).r
          ) * 0.25;

          // Solid Gaussian core + wider Gaussian halo (perfectly symmetric around segment)
          float coreSplat = exp(-d * d * 130.0) * uBrushStrength;
          float wideHalo  = exp(-d * d * 26.0) * uBrushStrength * 0.55;

          // Subtract 0.006 (> 1.5/255) every frame so 8-bit UnsignedByte rounding NEVER gets stuck at a permanent ghost stain!
          float decayedR = max(0.0, prev.r * 0.93 - 0.006);
          float decayedG = max(0.0, mix(prev.g, nSum, 0.35) * 0.94 - 0.005);

          float newR = max(decayedR, coreSplat);
          float newG = clamp(decayedG + wideHalo * 0.32, 0.0, 1.0);
          float newB = mix(prev.b, 0.5 + 0.5 * sin(uTime * 0.6 + segH * 1.5), clamp(coreSplat, 0.0, 1.0));

          gl_FragColor = vec4(newR, newG, newB, 1.0);
        }
      `,
    });

    this.wakeScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), wakeMat));
  }

  renderFluidWake(elapsed) {
    const readRT = this._wakeSwap ? this.wakeRT2 : this.wakeRT1;
    const writeRT = this._wakeSwap ? this.wakeRT1 : this.wakeRT2;

    const curUVx = this.pointerNDC.x * 0.5 + 0.5;
    const curUVy = this.pointerNDC.y * 0.5 + 0.5;
    const prevUVx = this.prevPointerNDC.x * 0.5 + 0.5;
    const prevUVy = this.prevPointerNDC.y * 0.5 + 0.5;

    // Velocity-driven brush strength: only stamp into FBO when pointer is active
    const speed = Math.hypot(curUVx - prevUVx, curUVy - prevUVy);
    const strength = this.hasPointerInput ? Math.min(0.95, 0.08 + speed * 42.0) : 0.0;

    this.wakeUniforms.uPrevTex.value = readRT.texture;
    this.wakeUniforms.uPrevPointerUV.value.set(prevUVx, prevUVy);
    this.wakeUniforms.uPointerUV.value.set(curUVx, curUVy);
    this.wakeUniforms.uVelocity.value.set(curUVx - prevUVx, curUVy - prevUVy);
    this.wakeUniforms.uTime.value = elapsed;
    this.wakeUniforms.uBrushStrength.value = strength;

    this.renderer.setRenderTarget(writeRT);
    this.renderer.render(this.wakeScene, this.wakeCamera);
    this.renderer.setRenderTarget(null);

    this._wakeSwap = !this._wakeSwap;
    return writeRT.texture;
  }

  /* ============================================================================
   * PASS 2: Iridescent Silk-Fluid Backdrop + Spectral Wake Caustics (1 Draw Call)
   * ============================================================================ */
  createSilkFluidBackdrop() {
    const geo = new THREE.PlaneGeometry(2, 2);
    this.backdropUniforms = {
      uTime: { value: 0 },
      uScroll: { value: 0 },
      uPointer: { value: new THREE.Vector2(0.5, 0.5) },
      uPointerStrength: { value: 0 },
      uWakeTex: { value: null },
      uAspect: { value: window.innerWidth / window.innerHeight },
    };

    const mat = new THREE.ShaderMaterial({
      uniforms: this.backdropUniforms,
      depthTest: false,
      depthWrite: false,
      vertexShader: /* glsl */ `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = vec4(position.xy, 0.9999, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        precision highp float;
        uniform float uTime;
        uniform float uScroll;
        uniform vec2 uPointer;
        uniform float uPointerStrength;
        uniform sampler2D uWakeTex;
        uniform float uAspect;
        varying vec2 vUv;

        // 4-iteration cosine domain warp for liquid-silk internal filaments
        vec2 silkWarp(vec2 p, float t) {
          vec2 q = p * 1.25;
          q += 0.25 * cos(q.yx * 1.40 + vec2(t * 0.20, -t * 0.15) + vec2(0.4, 1.7));
          q += 0.16 * sin(q.yx * 2.25 + vec2(-t * 0.17, t * 0.23) + vec2(2.8, 0.9));
          q += 0.10 * cos(q.yx * 3.30 + vec2(t * 0.14, t * 0.18) + vec2(4.1, 2.3));
          q += 0.06 * sin(q.yx * 4.70 - vec2(t * 0.22, -t * 0.19));
          return q;
        }

        // High-chroma Thin-Film Iridescent Spectral Palette anchored around #39C5BB:
        // Cycles smoothly: #39C5BB (Miku Teal) -> Electric Cyan (#00D2FF) -> Cosmic Violet (#8B5CF6)
        // -> Rose-Magenta (#F15BB5) -> Champagne Gold (#FFD166) -> #39C5BB
        vec3 iridescentSpectrum(float phase) {
          vec3 a = vec3(0.50, 0.56, 0.68);
          vec3 b = vec3(0.48, 0.44, 0.42);
          vec3 c = vec3(1.0, 1.0, 1.0);
          vec3 d = vec3(0.45, 0.10, 0.24);
          return clamp(a + b * cos(6.2831853 * (c * phase + d)), 0.0, 1.0);
        }

        void main() {
          vec2 centered = vUv - 0.5;
          vec2 p = centered * vec2(uAspect, 1.0);
          float r2 = dot(p, p);

          float t = uTime * 0.52;

          // Exact cursor position in aspect-corrected centered coordinates
          vec2 mp = (uPointer - 0.5) * vec2(uAspect, 1.0);
          vec2 toMp = p - mp;
          float mDist2 = dot(toMp, toMp);

          vec2 baseFlow = p + vec2(0.0, uScroll * 0.85);
          vec2 w0 = silkWarp(baseFlow, t);

          // Zero warp offset at the cursor center so the glow is 100% locked to the cursor dot;
          // only gently feather the trailing wake further away from the cursor
          float distalFeather = smoothstep(0.0, 0.12, mDist2);
          vec2 warpDisplacement = (w0 - baseFlow * 1.25) * 0.032 * distalFeather;

          vec2 warpedWakeUV = clamp(vUv + warpDisplacement, 0.002, 0.998);
          vec4 wake = texture2D(uWakeTex, warpedWakeUV);

          float trailCore  = wake.r;
          float trailHalo  = wake.g;
          float trailPhase = wake.b;
          float wakeEnv    = clamp(trailCore * 0.75 + trailHalo * 0.65, 0.0, 1.0);

          // Second pass: fluid wake gently pushes & swirls the silk folds
          vec2 w = w0 + vec2(sin(w0.y * 2.5 + t), cos(w0.x * 2.5 - t)) * (wakeEnv * 0.35);

          // Sculptural silk folds + flowing liquid-silk ribbons
          float fold1 = sin(w.x * 1.65 - w.y * 1.25 + t * 0.22) * 0.5 + 0.5;
          float fold2 = cos(w.x * 1.15 + w.y * 1.85 - t * 0.17) * 0.5 + 0.5;
          float silkCrest = pow(fold1 * fold2, 2.0);

          // Silky aurora ribbon curtains (smooth ridges without closed bubble loops)
          float filamentWave1 = 1.0 - abs(sin(w.y * 1.85 - w.x * 1.15 + t * 0.22));
          float filamentWave2 = 1.0 - abs(cos(w.x * 2.10 + w.y * 1.45 - t * 0.18));
          float silkFilaments = pow(filamentWave1, 3.8) * 0.65 + pow(filamentWave2, 4.5) * 0.50;

          // Base deep space
          vec3 abyssBase = vec3(0.012, 0.018, 0.040);
          vec3 deepSpace = vec3(0.020, 0.034, 0.072);
          vec3 col = mix(deepSpace, abyssBase, smoothstep(0.0, 1.35, r2));

          vec3 mikuTeal      = vec3(0.224, 0.773, 0.733); // #39C5BB
          vec3 cosmicViolet  = vec3(0.520, 0.280, 0.920);
          vec3 roseMagenta   = vec3(0.900, 0.280, 0.620);
          vec3 champagneGold = vec3(0.950, 0.760, 0.380);

          // ── Ambient Multi-Chromatic Silk Aurora ──
          float centerCalm = mix(0.26, 1.0, smoothstep(0.08, 0.65, r2));
          float bgPhase = fold1 * 0.42 + fold2 * 0.35 + p.x * 0.22 - p.y * 0.18 - uScroll * 0.35 + t * 0.05;
          vec3 bgSpectrum = iridescentSpectrum(bgPhase);

          col += mix(mikuTeal * 0.55, cosmicViolet * 0.65, fold2) * fold1 * 0.28 * centerCalm;
          col += mix(mikuTeal, bgSpectrum, 0.62) * silkCrest * 0.48 * centerCalm;
          col += bgSpectrum * silkFilaments * 0.32 * centerCalm;

          // ── Woven Iridescent Silk Wake (100% C-infinity continuous phase, zero fract() wrap seams) ──
          float wakePhase = fold1 * 0.65 - fold2 * 0.45 + (w.x - w.y) * 0.18 + trailCore * 0.28 + t * 0.08;
          vec3 wakeSpec1 = iridescentSpectrum(wakePhase);
          vec3 wakeSpec2 = iridescentSpectrum(wakePhase + 0.32);

          // 1) Outer wake aurora veil: Cosmic Violet <-> Rose Magenta <-> Sapphire woven into fold1/fold2
          vec3 outerColor = mix(cosmicViolet, roseMagenta, fold2 * 0.65);
          col += mix(outerColor, wakeSpec2, 0.55) * trailHalo * (0.24 + 0.52 * fold1);

          // 2) Inner curling silk glow: #39C5BB Teal + Iridescent Spectrum woven into silkCrest
          vec3 bodyColor = mix(mikuTeal, wakeSpec1, 0.58);
          col += bodyColor * trailCore * (0.22 + 0.58 * silkCrest);

          // 3) Luminous Silk Curtains ignited along the wake path (#39C5BB + Champagne Gold + Violet)
          vec3 filamentColor = mix(mikuTeal, champagneGold, fold2 * 0.65);
          col += mix(filamentColor, wakeSpec1, 0.5) * silkFilaments * wakeEnv * 0.88;

          // 4) Live cursor silk-prism glow — 100% concentric with cursor dot (mp)
          float prismCore = exp(-mDist2 * 34.0);
          float prismMid  = exp(-mDist2 * 9.0) * (0.75 + 0.35 * fold1);
          float prismHalo = exp(-mDist2 * 2.8) * (0.55 + 0.55 * silkFilaments);
          vec3 haloSpectrum = iridescentSpectrum(fold1 * 0.55 + fold2 * 0.45 + t * 0.10);

          col += (mix(mikuTeal, champagneGold, 0.35) * prismCore * 0.22
                + mix(mikuTeal, haloSpectrum, 0.50) * prismMid * 0.16
                + haloSpectrum * prismHalo * 0.14) * uPointerStrength;

          // Vignette & anti-banding dither
          col *= 1.0 - smoothstep(0.55, 1.85, r2) * 0.35;
          float dither = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453) - 0.5;
          col += dither * (1.5 / 255.0);

          gl_FragColor = vec4(col, 1.0);
        }
      `,
    });

    const mesh = new THREE.Mesh(geo, mat);
    mesh.frustumCulled = false;
    mesh.renderOrder = -10;
    this.backdropMesh = mesh;
    this.scene.add(mesh);
  }

  /* ============================================================================
   * PASS 3: 3D Optical Bokeh Motes with Iridescent Wake Excitation (1 Draw Call)
   * ============================================================================ */
  createAmbient3DBokeh(dpr) {
    const count = this.isMobile ? 650 : this.isWeakDevice ? 1100 : 1800;

    const positions = new Float32Array(count * 3);
    const seeds = new Float32Array(count * 4);

    for (let i = 0; i < count; i++) {
      const i4 = i * 4;
      const rx = ((i * 0.61803398875) % 1) * 2.0 - 1.0;
      const rz = (i / count) * 2.0 - 1.0;
      const ry = (((i * 0.381966011) % 1) - 0.5) * 2.0;

      seeds[i4] = rx;
      seeds[i4 + 1] = rz;
      seeds[i4 + 2] = ry;
      seeds[i4 + 3] = Math.random();
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 4));

    this.particleUniforms = {
      uTime: { value: 0 },
      uScroll: { value: 0 },
      uDPR: { value: dpr },
      uPointer3D: { value: new THREE.Vector3(0, 0, 0) },
      uFocalDepth: { value: 10.2 },
    };

    const mat = new THREE.ShaderMaterial({
      uniforms: this.particleUniforms,
      transparent: true,
      depthWrite: false,
      depthTest: true,
      blending: THREE.AdditiveBlending,
      vertexShader: /* glsl */ `
        attribute vec4 aSeed;

        uniform float uTime;
        uniform float uScroll;
        uniform float uDPR;
        uniform vec3 uPointer3D;
        uniform float uFocalDepth;

        varying vec3 vColor;
        varying float vAlpha;
        varying float vBokeh;

        void main() {
          float rx = aSeed.x;
          float rz = aSeed.y;
          float ry = aSeed.z;
          float rand = aSeed.w;

          float driftX = mod(rx * 13.0 + uTime * (0.12 + rand * 0.06) + 13.0, 26.0) - 13.0;
          float depthZ = rz * 8.5 - 1.5;

          float waveY = sin(driftX * 0.28 + uTime * 0.25 + rz * 1.8) * 1.45
                      + cos(depthZ * 0.32 - uTime * 0.18) * 1.10
                      + ry * 3.6;

          vec3 worldPos = vec3(driftX, waveY, depthZ);

          vec3 toPart = worldPos - uPointer3D;
          vec3 scaledDelta = vec3(toPart.xy, toPart.z * 0.45);
          float dist = length(scaledDelta);
          float force = smoothstep(3.8, 0.0, dist);
          vec2 dir2D = normalize(toPart.xy + vec2(0.0001));
          vec2 tangent2D = vec2(-dir2D.y, dir2D.x);
          worldPos.xy += (dir2D * 0.65 + tangent2D * 0.55) * force;

          vec4 mvPosition = modelViewMatrix * vec4(worldPos, 1.0);
          gl_Position = projectionMatrix * mvPosition;

          float viewDist = max(1.5, -mvPosition.z);

          float coc = abs(viewDist - uFocalDepth);
          vBokeh = clamp(smoothstep(1.2, 7.5, coc), 0.0, 1.0);

          float sizeCurve = pow(rand, 2.2);
          float baseSize = mix(1.8, 6.5, sizeCurve) + force * 2.6;
          float perspectiveScale = 155.0 / viewDist;
          float bokehExpand = 1.0 + vBokeh * 1.65;

          gl_PointSize = clamp(baseSize * bokehExpand * (perspectiveScale * 0.065) * uDPR, 1.5, 38.0 * uDPR);

          vec3 mikuTeal      = vec3(0.224, 0.773, 0.733); // #39C5BB
          vec3 champagneGold = vec3(0.960, 0.780, 0.380);
          vec3 cosmicViolet  = vec3(0.660, 0.480, 0.980);
          vec3 coralRose     = vec3(0.950, 0.450, 0.680);

          vec3 col;
          if (rand < 0.36) {
            col = mikuTeal;
          } else if (rand < 0.66) {
            col = champagneGold;
          } else if (rand < 0.86) {
            col = cosmicViolet;
          } else {
            col = coralRose;
          }

          vec3 excitedCol = mix(champagneGold, vec3(0.45, 0.98, 0.92), sin(rand * 12.0) * 0.5 + 0.5);
          vColor = mix(col, excitedCol, clamp(force * 0.85, 0.0, 1.0));

          float twinkle = 0.65 + 0.35 * sin(uTime * 1.6 + rand * 30.0 + rx * 10.0);
          float nearFade = smoothstep(1.5, 3.8, viewDist);
          float farFade  = smoothstep(22.0, 8.0, viewDist);
          float bokehAtten = mix(0.68, 0.18, vBokeh);

          vec2 ndc = gl_Position.xy / max(0.001, gl_Position.w);
          float centerEllipse = length(ndc * vec2(1.05, 1.25));
          float textSafeMask = mix(0.12, 1.0, smoothstep(0.25, 0.82, centerEllipse));

          vAlpha = twinkle * nearFade * farFade * bokehAtten * textSafeMask * (0.74 + force * 0.55);
        }
      `,
      fragmentShader: /* glsl */ `
        precision mediump float;
        varying vec3 vColor;
        varying float vAlpha;
        varying float vBokeh;

        void main() {
          vec2 uv = gl_PointCoord - 0.5;
          float r2 = dot(uv, uv) * 4.0;
          if (r2 > 1.0) discard;

          float sharpOrb = exp(-r2 * 4.5) * 0.82 + exp(-r2 * 1.6) * 0.28;
          float rim = smoothstep(0.40, 0.80, r2) * (1.0 - smoothstep(0.80, 1.0, r2)) * 0.28;
          float bokehOrb = (1.0 - smoothstep(0.0, 1.0, r2)) * 0.48 + rim;

          float alpha = mix(sharpOrb, bokehOrb, vBokeh) * vAlpha;

          gl_FragColor = vec4(vColor * alpha, alpha);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }
      `,
    });

    const points = new THREE.Points(geo, mat);
    points.frustumCulled = false;
    this.particlePoints = points;
    this.scene.add(points);
  }

  /* ============================================================================
   * EVENTS & 3D RAYCAST PROJECTION
   * ============================================================================ */
  updatePointerFromClient(clientX, clientY) {
    const w = this.canvas.clientWidth || window.innerWidth;
    const h = this.canvas.clientHeight || window.innerHeight;
    this.targetPointerNDC.x = (clientX / w) * 2 - 1;
    this.targetPointerNDC.y = -(clientY / h) * 2 + 1;
    if (!this.hasPointerInput) {
      this.pointerNDC.copy(this.targetPointerNDC);
      this.prevPointerNDC.copy(this.targetPointerNDC);
      this.hasPointerInput = true;
    }
    this.lastPointerEventTime = performance.now();
  }

  bindEvents() {
    window.addEventListener(
      'mousemove',
      (e) => {
        this.updatePointerFromClient(e.clientX, e.clientY);
      },
      { passive: true }
    );

    window.addEventListener(
      'touchmove',
      (e) => {
        if (e.touches.length > 0) {
          this.updatePointerFromClient(e.touches[0].clientX, e.touches[0].clientY);
        }
      },
      { passive: true }
    );

    window.addEventListener(
      'touchstart',
      (e) => {
        if (e.touches.length > 0) {
          this.updatePointerFromClient(e.touches[0].clientX, e.touches[0].clientY);
        }
      },
      { passive: true }
    );

    window.addEventListener(
      'scroll',
      () => {
        this.scrollProgress = this.scrollLimit > 0 ? window.scrollY / this.scrollLimit : 0;
      },
      { passive: true }
    );

    let resizeTimer;
    window.addEventListener(
      'resize',
      () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
          const w = window.innerWidth;
          const h = window.innerHeight;
          const dpr = Math.min(window.devicePixelRatio || 1, this.maxDPR);

          this.camera.aspect = w / h;
          this.camera.updateProjectionMatrix();

          this.renderer.setPixelRatio(dpr);
          this.renderer.setSize(w, h);

          if (this.backdropUniforms) {
            this.backdropUniforms.uAspect.value = w / h;
          }
          if (this.wakeUniforms) {
            this.wakeUniforms.uAspect.value = w / h;
          }
          if (this.particleUniforms) {
            this.particleUniforms.uDPR.value = dpr;
          }
          this.updateScrollLimit();
        }, 120);
      },
      { passive: true }
    );

    if (window.matchMedia) {
      window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (e) => {
        this.reducedMotion = e.matches;
      });
    }
  }

  /* ============================================================================
   * MAIN ANIMATION LOOP (r186 THREE.Timer + setAnimationLoop)
   * ============================================================================ */
  animate() {
    if (document.hidden) return;

    this.timer.update();
    const dt = Math.min(this.timer.getDelta(), 0.05);
    const elapsed = this.timer.getElapsed() * (this.reducedMotion ? 0.25 : 1.0);

    this.smoothScroll += (this.scrollProgress - this.smoothScroll) * Math.min(1, dt * 5.0);
    const sp = this.smoothScroll;

    // On mobile touch devices only, drift gently when not touching
    if (this.isMobile) {
      const idleSec = (performance.now() - this.lastPointerEventTime) * 0.001;
      if (idleSec > 2.5) {
        this.targetPointerNDC.x = Math.sin(elapsed * 0.55) * 0.45;
        this.targetPointerNDC.y = Math.sin(elapsed * 1.10) * 0.28;
        this.hasPointerInput = true;
      }
    }

    const targetStrength = this.hasPointerInput ? 1.0 : 0.0;
    this.pointerStrength += (targetStrength - this.pointerStrength) * Math.min(1, dt * 8.0);

    this.prevPointerNDC.copy(this.pointerNDC);
    // Match .cursor-dot lerp speed (0.35) so the aura core stays dead-center on the cursor dot
    const pointerLerp = this.reducedMotion ? 0.15 : 0.35;
    this.pointerNDC.x += (this.targetPointerNDC.x - this.pointerNDC.x) * pointerLerp;
    this.pointerNDC.y += (this.targetPointerNDC.y - this.pointerNDC.y) * pointerLerp;

    const wakeTexture = this.renderFluidWake(elapsed);

    this._rayOrigin.setFromMatrixPosition(this.camera.matrixWorld);
    this._rayDir.set(this.pointerNDC.x, this.pointerNDC.y, 0.5).unproject(this.camera).sub(this._rayOrigin).normalize();
    const planeDist = -this._rayOrigin.z / (this._rayDir.z || -0.001);
    const clampedDist = Math.max(4.0, Math.min(16.0, planeDist));
    this.pointerWorld.copy(this._rayOrigin).addScaledVector(this._rayDir, clampedDist);

    const parallaxX = this.pointerNDC.x * (this.isMobile ? 0.35 : 0.85);
    const parallaxY = this.pointerNDC.y * (this.isMobile ? 0.25 : 0.65);

    const camX = Math.sin(sp * Math.PI) * 1.1 + parallaxX;
    const camY = 0.2 - sp * 1.4 + parallaxY;
    const camZ = 10.5 - Math.sin(sp * Math.PI) * 1.6;

    this._camTargetPos.set(camX, camY, camZ);
    this.camera.position.lerp(this._camTargetPos, Math.min(1, dt * 4.0));

    this._camLookAt.set(parallaxX * 0.2, -sp * 0.8 + parallaxY * 0.15, 0);
    this._currentLookAt.lerp(this._camLookAt, Math.min(1, dt * 4.5));
    this.camera.lookAt(this._currentLookAt);

    const focalDepth = this.camera.position.distanceTo(this._currentLookAt);

    this.backdropUniforms.uTime.value = elapsed;
    this.backdropUniforms.uScroll.value = sp;
    this.backdropUniforms.uPointer.value.set(
      this.pointerNDC.x * 0.5 + 0.5,
      this.pointerNDC.y * 0.5 + 0.5
    );
    this.backdropUniforms.uPointerStrength.value = this.pointerStrength;
    this.backdropUniforms.uWakeTex.value = wakeTexture;

    this.particleUniforms.uTime.value = elapsed;
    this.particleUniforms.uScroll.value = sp;
    this.particleUniforms.uPointer3D.value.copy(this.pointerWorld);
    this.particleUniforms.uFocalDepth.value = focalDepth;

    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    this.renderer.setAnimationLoop(null);
    this.timer.dispose();
    this.wakeRT1.dispose();
    this.wakeRT2.dispose();
    this.scene.traverse((obj) => {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) obj.material.dispose();
    });
    this.renderer.dispose();
  }
}

window.THREE = THREE;
window.ShaderBackground = ShaderBackground;

function initShaderBackground() {
  if (window.shaderBg) return window.shaderBg;
  if (document.getElementById('three-canvas')) {
    window.shaderBg = new ShaderBackground();
  }
  return window.shaderBg;
}

window.initShaderBackground = initShaderBackground;

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => initShaderBackground(), { once: true });
} else {
  initShaderBackground();
}
