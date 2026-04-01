/**
 * ZHEHAO SUN Portfolio — Three.js Interactive 3D Background
 * Enhanced with Homunculus-style Domain Warping, FBO mouse trail, and organic flow.
 *
 * Architecture:
 *   Pass 1: Render mouse brush trail into FBO (ping-pong RTs)
 *   Pass 2: Main display shader — cos-wave domain warping + mouse trail distortion
 *   Pass 3: Floating particles overlay
 */

class ShaderBackground {
  constructor() {
    this.canvas = document.getElementById('three-canvas');
    this.isMobile = window.innerWidth < 769;
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
      powerPreference: this.isMobile ? 'low-power' : 'high-performance',
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    // Mobile: cap pixel ratio at 1.0 for GPU savings
    this.renderer.setPixelRatio(this.isMobile ? 1.0 : Math.min(window.devicePixelRatio, 1.5));

    this.createMouseFBO();
    this.createShaderMesh();
    this.bindEvents();
    this.updateScrollLimit();
    this.animate();
  }

  updateScrollLimit() {
    this.scrollLimit = document.documentElement.scrollHeight - window.innerHeight;
  }

  /* ========== FBO MOUSE TRAIL (Homunculus-style brush buffer) ========== */
  createMouseFBO() {
    const rtSize = this.isMobile ? 256 : 512;
    const rtOpts = {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBAFormat,
      type: THREE.UnsignedByteType,
    };
    this.mouseRT  = new THREE.WebGLRenderTarget(rtSize, rtSize, rtOpts);
    this.mouseRT2 = new THREE.WebGLRenderTarget(rtSize, rtSize, rtOpts);

    this.mouseScene  = new THREE.Scene();
    this.mouseCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    // Fade quad — blends previous frame with slight decay for trail persistence
    this.fadeMat = new THREE.ShaderMaterial({
      vertexShader: `
        varying vec2 vUv;
        void main() { vUv = uv; gl_Position = vec4(position, 1.0); }
      `,
      fragmentShader: `
        precision highp float;
        uniform sampler2D uPrevFrame;
        uniform float uFade;
        varying vec2 vUv;
        void main() {
          vec4 prev = texture2D(uPrevFrame, vUv);
          gl_FragColor = vec4(prev.rgb * uFade, prev.a * uFade);
        }
      `,
      uniforms: {
        uPrevFrame: { value: null },
        uFade: { value: 0.965 },
      },
      transparent: true,
      depthTest: false,
      depthWrite: false,
    });
    this.mouseScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.fadeMat));

    // Brush stamp — soft radial gradient rendered at cursor position
    this.brushMat = new THREE.ShaderMaterial({
      vertexShader: `
        varying vec2 vUv;
        void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
      `,
      fragmentShader: `
        precision highp float;
        varying vec2 vUv;
        uniform float uStrength;
        void main() {
          float d = length(vUv - 0.5) * 2.0;
          float falloff = exp(-d * d * 3.0);
          float val = falloff * uStrength;
          gl_FragColor = vec4(vec3(val), val);
        }
      `,
      uniforms: { uStrength: { value: 1.0 } },
      transparent: true,
      depthTest: false,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    this.brushMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 0.12), this.brushMat);
    this.brushMesh.visible = false;
    this.mouseScene.add(this.brushMesh);

    this._mouseSwap = false;
  }

  renderMouseFBO() {
    const vel = Math.sqrt(
      this.mouseVelocity.x * this.mouseVelocity.x +
      this.mouseVelocity.y * this.mouseVelocity.y
    );

    // Position brush at cursor in [-1,1] NDC space
    this.brushMesh.position.set(
      (this.mouse.x - 0.5) * 2.0,
      (this.mouse.y - 0.5) * 2.0,
      0
    );
    this.brushMesh.visible = vel > 0.0005;

    // Scale brush with velocity for thicker strokes on fast movement
    const scale = 0.8 + Math.min(vel * 40, 2.0);
    this.brushMesh.scale.set(scale, scale, 1);
    this.brushMat.uniforms.uStrength.value = Math.min(vel * 20, 1.0);

    // Ping-pong: read from one RT, write to the other
    const readRT  = this._mouseSwap ? this.mouseRT2 : this.mouseRT;
    const writeRT = this._mouseSwap ? this.mouseRT : this.mouseRT2;

    this.fadeMat.uniforms.uPrevFrame.value = readRT.texture;

    this.renderer.setRenderTarget(writeRT);
    this.renderer.render(this.mouseScene, this.mouseCamera);
    this.renderer.setRenderTarget(null);

    this._mouseSwap = !this._mouseSwap;
    return writeRT;
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

    const fbmIter = this.isMobile ? 3 : 5;

    const fragmentShader = `
      precision highp float;

      uniform float uTime;
      uniform vec2  uMouse;
      uniform vec2  uMouseVelocity;
      uniform vec2  uResolution;
      uniform float uScrollProgress;
      uniform sampler2D uMouseTrail;

      varying vec2 vUv;

      // ── Simplex Noise ──
      vec3 mod289(vec3 x) { return x - floor(x * (1.0/289.0)) * 289.0; }
      vec4 mod289(vec4 x) { return x - floor(x * (1.0/289.0)) * 289.0; }
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
        for (int i = 0; i < ${fbmIter}; i++) { v += a * snoise(p); p *= 2.0; a *= 0.5; }
        return v;
      }

      // ── Domain warping — multi-pass FBM for organic swirls ──
      float warpedNoise(vec3 p) {
        vec3 q = vec3(fbm(p), fbm(p + vec3(5.2,1.3,2.8)), 0.0);
        vec3 r = vec3(
          fbm(p + 4.0*q + vec3(1.7,9.2,0.0)),
          fbm(p + 4.0*q + vec3(8.3,2.8,0.0)), 0.0);
        return fbm(p + 3.5 * r);
      }

      // ══════════════════════════════════════════════════════════
      // HOMUNCULUS-STYLE COS-WAVE DOMAIN WARPING
      // 5 layers of cos(yx) distortion → organic fluid streaks
      // ══════════════════════════════════════════════════════════
      vec2 cosWarp(vec2 uv, float time) {
        vec2 q = -1.0 + 2.0 * uv;       // map to [-1, 1]
        float w = 1.6;                    // wave scale
        q += 0.10 * cos((1.5*w) * q.yx + 1.1*time + vec2(0.1, 1.1));
        q += 0.08 * cos((2.3*w) * q.yx + 1.3*time + vec2(3.2, 3.4));
        q += 0.10 * cos((2.2*w) * q.yx + 1.7*time + vec2(1.8, 5.2));
        q += 0.12 * cos((1.8*w) * q.yx + 1.4*time + vec2(6.3, 3.9));
        q += 0.06 * cos((3.1*w) * q.yx + 0.9*time + vec2(2.1, 4.7));
        return q;
      }

      // ── HSV helpers for trail hue shift ──
      vec3 rgb2hsv(vec3 c) {
        vec4 K = vec4(0.0,-1.0/3.0,2.0/3.0,-1.0);
        vec4 px = mix(vec4(c.bg,K.wz), vec4(c.gb,K.xy), step(c.b,c.g));
        vec4 qx = mix(vec4(px.xyw,c.r), vec4(c.r,px.yzx), step(px.x,c.r));
        float d = qx.x - min(qx.w,qx.y);
        float e = 1.0e-10;
        return vec3(abs(qx.z+(qx.w-qx.y)/(6.0*d+e)), d/(qx.x+e), qx.x);
      }
      vec3 hsv2rgb(vec3 c) {
        vec4 K = vec4(1.0,2.0/3.0,1.0/3.0,3.0);
        vec3 px = abs(fract(c.xxx+K.xyz)*6.0-K.www);
        return c.z * mix(K.xxx, clamp(px-K.xxx,0.0,1.0), c.y);
      }

      void main() {
        vec2 uv = vUv;
        float aspect = uResolution.x / uResolution.y;
        vec2 p = (uv - 0.5) * vec2(aspect, 1.0);
        float t = uTime * 0.1;

        // ── Mouse trail from FBO ──
        float trail = texture2D(uMouseTrail, uv).r;

        // ── Homunculus cos-wave warp ──
        float warpTime = uTime * 0.06;
        vec2 cw = cosWarp(uv, warpTime);            // warped [-1,1] coords
        float cwLen = length(cw);                     // distance field from warp

        // Mouse trail adds extra fluid distortion (like homunculus mouseEffect)
        float trailSin = sin(trail * 3.14159);
        cw += 0.08 * trailSin * vec2(
          sin(uTime*2.0 + cw.x*5.0),
          cos(uTime*1.7 + cw.y*5.0)
        );

        // ── Mouse reactive distortion ──
        vec2 mousePos = (uMouse - 0.5) * vec2(aspect, 1.0);
        float mouseDist = length(p - mousePos);
        float velocity = length(uMouseVelocity) * 3.0;

        // Enhanced ripple from mouse movement
        float ripple = sin(mouseDist*12.0 - uTime*5.0)
                     * exp(-mouseDist*2.0) * min(velocity,1.0) * 0.2;

        vec2 mouseDir = normalize(p - mousePos + 0.001);
        float pull = smoothstep(0.8, 0.0, mouseDist) * 0.15;
        p += mouseDir * (pull + ripple);

        // ── Main flow: blend warped coords into noise input ──
        vec2 flowP = mix(p, (cw * 0.5) * vec2(aspect, 1.0), 0.45);

        float warp  = warpedNoise(vec3(flowP * 0.8, t * 0.25));
        float flow1 = fbm(vec3(flowP * 1.8 + warp * 0.6, t * 0.3));
        float flow2 = fbm(vec3(flowP * 2.5 - t * 0.2, t * 0.15 + 10.0));
        float detail = snoise(vec3(flowP * 3.0 + flow1 * 0.3, t * 0.12));

        // ── Visible stream lines (homunculus-style organic ribbons) ──
        float sl1 = abs(sin(cwLen * 6.0 + warp * 5.0 + uTime * 0.18));
        float sl2 = abs(sin(cw.y * 5.0 + flow1 * 4.0 - uTime * 0.14));
        float sl3 = abs(cos(cw.x * 4.5 + warp * 3.0 + uTime * 0.1));
        float streams = pow(sl1 * sl2, 1.5) * 0.35 + pow(sl3, 2.0) * 0.15;

        // ── Color palette (scroll-driven, preserved from original) ──
        vec3 deepNavy     = vec3(0.03, 0.05, 0.12);
        vec3 indigoShift  = vec3(0.06, 0.03, 0.14);
        vec3 darkTeal     = vec3(0.02, 0.06, 0.10);
        vec3 midnightBlue = vec3(0.02, 0.03, 0.08);
        vec3 warmEmber    = vec3(0.10, 0.05, 0.02);

        float sp = uScrollProgress;
        vec3 baseColor;
        if      (sp < 0.2) baseColor = mix(deepNavy,     indigoShift,  sp * 5.0);
        else if (sp < 0.4) baseColor = mix(indigoShift,  darkTeal,     (sp-0.2)*5.0);
        else if (sp < 0.6) baseColor = mix(darkTeal,     midnightBlue, (sp-0.4)*5.0);
        else if (sp < 0.8) baseColor = mix(midnightBlue, deepNavy,     (sp-0.6)*5.0);
        else               baseColor = mix(deepNavy,     warmEmber,    (sp-0.8)*5.0);

        vec3 color = baseColor;

        // ── Flow colors — BOOSTED for higher visibility ──
        float flowInt = warp * 0.5 + 0.5;
        color += vec3(0.18, 0.10, 0.04) * flowInt       * 0.45;  // warm — stronger
        color += vec3(0.04, 0.12, 0.24) * (1.0-flowInt)  * 0.40;  // cool — stronger

        // Turbulence highlights — increased
        color += vec3(0.16, 0.12, 0.05) * smoothstep(0.10, 0.80, flow1) * 0.30;

        // Detail shimmer — increased
        color += vec3(0.06, 0.10, 0.18) * max(detail, 0.0) * 0.18;

        // Secondary flow — increased
        color += vec3(0.03, 0.07, 0.14) * max(flow2, 0.0) * 0.45;

        // ── Stream lines (organic ribbons) — BOOSTED contrast ──
        vec3 streamWarm = vec3(0.22, 0.14, 0.05);
        vec3 streamCool = vec3(0.06, 0.12, 0.25);
        vec3 streamCol = mix(streamCool, streamWarm, flowInt);
        color += streamCol * streams * (0.5 + trail * 0.6);

        // ── Aurora near cursor ──
        float auroraMask = smoothstep(0.7, 0.0, mouseDist);
        float auroraW = snoise(vec3(p*4.0 + uTime*0.8, uTime*0.4)) * 0.5 + 0.5;
        vec3 aurora = mix(vec3(0.16,0.12,0.03), vec3(0.03,0.12,0.20), auroraW);
        color += aurora * auroraMask * (0.12 + velocity * 0.2);

        // ── Mouse trail glow (FBO reveal effect, like homunculus brush) ──
        vec3 trailGlow = mix(
          vec3(0.06, 0.10, 0.20),
          vec3(0.20, 0.14, 0.05),
          sin(uTime*0.5)*0.5+0.5
        );
        color += trailGlow * trail * 0.5;

        // HSV hue/saturation shift where trail passes
        vec3 hsv = rgb2hsv(color);
        hsv.x += trail * 0.08;
        hsv.y *= 1.0 + trail * 0.3;
        color = hsv2rgb(hsv);

        // ── Soft light caustics ──
        float caustic = pow(abs(snoise(vec3(p*5.0+t*0.5, t*0.3))), 3.0) * 0.10;
        color += vec3(0.09, 0.08, 0.04) * caustic;

        // ── Faint grid (mid-scroll only) ──
        float gridX = smoothstep(0.97, 1.0, abs(sin(p.x*30.0)));
        float gridY = smoothstep(0.97, 1.0, abs(sin(p.y*30.0)));
        color += vec3(0.2,0.18,0.10)
               * (gridX+gridY) * 0.015
               * smoothstep(0.25,0.5,sp) * smoothstep(0.75,0.5,sp);

        // ── Edge glow ──
        float eg = smoothstep(0.0,0.08,uv.x) * smoothstep(1.0,0.92,uv.x)
                 * smoothstep(0.0,0.08,uv.y) * smoothstep(1.0,0.92,uv.y);
        color += vec3(0.04,0.05,0.12) * (1.0 - eg) * 0.3;

        // ── Vignette ──
        color *= 0.65 + (1.0 - smoothstep(0.3, 1.6, length(p))) * 0.35;

        // ── Film grain ──
        color += (fract(sin(dot(uv*uTime, vec2(12.9898,78.233)))*43758.5453) - 0.5) * 0.012;

        // Gamma
        color = pow(max(color, 0.0), vec3(0.92));

        // ══ SOFT LIGHT POOLS — organic cloud-like shapes, NOT hard circles ══
        // Pool 1 — large primary, very soft Gaussian + heavy noise distortion
        vec2 lp1C = vec2(0.35+sin(t*0.35+sp*2.5)*0.18, 0.3+cos(t*0.25)*0.12+sp*0.35);
        float lp1Noise = snoise(vec3((uv-lp1C)*2.0, t*0.15))*0.15
                       + snoise(vec3((uv-lp1C)*4.5, t*0.22))*0.06;
        float lp1 = length((uv-lp1C)*vec2(0.85,1.0)) + lp1Noise;
        float g1  = exp(-lp1*lp1*2.5) * 0.15;

        // Pool 2 — mouse-tracking, softer fall-off
        vec2 lp2C = mix(vec2(0.6,0.5), uMouse, 0.45) + vec2(sin(t*0.4), cos(t*0.3))*0.05;
        float lp2Noise = snoise(vec3((uv-lp2C)*2.5, t*0.20+5.0))*0.12
                       + snoise(vec3((uv-lp2C)*5.0, t*0.28+8.0))*0.05;
        float lp2 = length((uv-lp2C)*vec2(0.9,0.85)) + lp2Noise;
        float g2  = exp(-lp2*lp2*5.0) * 0.14;

        // Pool 3 — accent, cloud-like edges
        vec2 lp3C = vec2(0.7+cos(t*0.4+2.0)*0.12, 0.25+sin(t*0.5)*0.08-sp*0.25);
        float lp3Noise = snoise(vec3((uv-lp3C)*3.0, t*0.25+10.0))*0.10
                       + snoise(vec3((uv-lp3C)*6.0, t*0.32+12.0))*0.04;
        float lp3 = length((uv-lp3C)*vec2(0.9,1.0)) + lp3Noise;
        float msb = smoothstep(0.15,0.4,sp) * smoothstep(0.85,0.6,sp);
        float g3  = exp(-lp3*lp3*7.0) * 0.10 * (0.5 + msb*0.5);

        float totalG = g1 + g2 + g3;
        color += mix(vec3(0.15,0.10,0.04), vec3(0.04,0.08,0.18), sp) * totalG * 2.0;

        // Chromatic fringe
        float ef = smoothstep(0.0,0.06,totalG) * smoothstep(0.15,0.06,totalG);
        color.r += ef * 0.02;
        color.b += ef * 0.03;

        gl_FragColor = vec4(color, 1.0);
      }
    `;

    const geometry = new THREE.PlaneGeometry(2, 2);
    this.material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTime:           { value: 0 },
        uMouse:          { value: new THREE.Vector2(0.5, 0.5) },
        uMouseVelocity:  { value: new THREE.Vector2(0, 0) },
        uResolution:     { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
        uScrollProgress: { value: 0 },
        uMouseTrail:     { value: null },
      },
      depthTest: false,
      depthWrite: false,
    });

    this.scene.add(new THREE.Mesh(geometry, this.material));
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

    // Debounce resize for performance
    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.material.uniforms.uResolution.value.set(window.innerWidth, window.innerHeight);
        this.updateScrollLimit();
      }, 150);
    });

    // Pause rendering when canvas is not visible (huge perf win when scrolled past hero)
    this._isVisible = true;
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        this._isVisible = entries[0].isIntersecting;
      }, { threshold: 0.01 });
      observer.observe(this.canvas);
    }
  }

  /* ========== RENDER LOOP ========== */
  animate() {
    requestAnimationFrame(() => this.animate());

    // Skip rendering entirely when canvas is not visible (scrolled past hero)
    if (!this._isVisible) return;

    // Mobile: throttle to ~30fps for battery savings
    if (this.isMobile) {
      if (!this._lastFrame) this._lastFrame = 0;
      const now = performance.now();
      if (now - this._lastFrame < 33) return;
      this._lastFrame = now;
    }

    // MUCH MORE RESPONSIVE mouse tracking (0.12 instead of 0.06)
    this.mouse.x += (this.mouse.targetX - this.mouse.x) * 0.12;
    this.mouse.y += (this.mouse.targetY - this.mouse.y) * 0.12;

    // Track velocity
    this.mouseVelocity.x = this.mouse.x - this.prevMouse.x;
    this.mouseVelocity.y = this.mouse.y - this.prevMouse.y;
    this.prevMouse.x = this.mouse.x;
    this.prevMouse.y = this.mouse.y;

    // Read scroll progress efficiently within the RAF loop instead of a separate scroll event listener
    this.scrollProgress = this.scrollLimit > 0 ? window.scrollY / this.scrollLimit : 0;

    const elapsed = this.clock.getElapsedTime();

    // ── PASS 1: Mouse trail FBO ──
    const activeRT = this.renderMouseFBO();

    // ── PASS 2: Main background ──
    this.material.uniforms.uTime.value = elapsed;
    this.material.uniforms.uMouse.value.set(this.mouse.x, this.mouse.y);
    this.material.uniforms.uMouseVelocity.value.set(this.mouseVelocity.x, this.mouseVelocity.y);
    // Faster scroll response too (0.08 instead of 0.05)
    this.material.uniforms.uScrollProgress.value +=
      (this.scrollProgress - this.material.uniforms.uScrollProgress.value) * 0.08;
    this.material.uniforms.uMouseTrail.value = activeRT.texture;

    // ── PASS 2: Render background ──
    this.renderer.render(this.scene, this.camera);
  }
}

window.ShaderBackground = ShaderBackground;

function initShaderBackground() {
  if (document.getElementById('three-canvas') && typeof THREE !== 'undefined') {
    window.shaderBg = new ShaderBackground();
  }
}
window.initShaderBackground = initShaderBackground;
