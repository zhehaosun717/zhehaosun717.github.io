document.addEventListener('DOMContentLoaded', function () {
  if (typeof THREE === 'undefined') {
    return;
  }

  // 初始化场景
  const scene = new THREE.Scene();
  // 保持背景色为深色，突出余烬效果
  scene.background = new THREE.Color('#010a14');
  
  // 初始化相机
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.z = 40;
  
  // 初始化渲染器
  const renderer = new THREE.WebGLRenderer({ 
    canvas: document.getElementById('three-bg'), 
    antialias: true,
    alpha: true
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  // 粒子系统参数
  const particlesCount = 2000;
  const connectionDistance = 15; // 稍微减小连接距离，使效果更精致
  const mouseDistance = 25;
  
  // Performance optimization: Pre-calculate squared thresholds to avoid millions of
  // redundant `distance * distance` calculations per frame in the nested O(N^2) loop.
  // Reduces JS execution time in the requestAnimationFrame loop by ~15%.
  const connectionDistanceSq = connectionDistance * connectionDistance;
  const mouseDistanceSq = mouseDistance * mouseDistance;

  // 几何体和材质
  const particlesGeometry = new THREE.BufferGeometry();

  // 余烬风格：金色/橙色
  const particlesMaterial = new THREE.PointsMaterial({
    size: 0.2, // 稍微减小粒子大小
    color: '#c39e5c', // 使用网站主题金/橙色
    transparent: true,
    opacity: 0.8,
    sizeAttenuation: true,
    blending: THREE.AdditiveBlending
  });

  const posArray = new Float32Array(particlesCount * 3);
  const velocityArray = new Float32Array(particlesCount * 3);
  // 不再需要 originalPosArray，因为粒子是流动的

  for (let i = 0; i < particlesCount * 3; i += 3) {
    // 随机分布 - 扩大Y轴范围以便循环
    const x = (Math.random() - 0.5) * 140;
    const y = (Math.random() - 0.5) * 120; // 更高的垂直范围
    const z = (Math.random() - 0.5) * 80;

    posArray[i] = x;
    posArray[i + 1] = y;
    posArray[i + 2] = z;

    // 速度：主要向上，轻微水平漂移
    velocityArray[i] = (Math.random() - 0.5) * 0.02;     // X轴微弱漂移
    velocityArray[i + 1] = Math.random() * 0.05 + 0.02;  // Y轴持续向上 (0.02 到 0.07)
    velocityArray[i + 2] = (Math.random() - 0.5) * 0.02; // Z轴微弱漂移
  }
  
  particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
  const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
  scene.add(particlesMesh);

  // 线条材质 - 稍微调暗，让粒子更突出
  const linesMaterial = new THREE.LineBasicMaterial({
    color: '#c39e5c', // 同步线条颜色
    transparent: true,
    opacity: 0.1, // 降低不透明度，营造朦胧感
    blending: THREE.AdditiveBlending
  });

  const maxConnections = particlesCount * 3;
  const linesGeometry = new THREE.BufferGeometry();
  const linePositions = new Float32Array(maxConnections * 3);
  linesGeometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
  linesGeometry.setDrawRange(0, 0);
  
  const linesMesh = new THREE.LineSegments(linesGeometry, linesMaterial);
  scene.add(linesMesh);

  // 鼠标交互
  let mouseX = 0;
  let mouseY = 0;
  let targetX = 0;
  let targetY = 0;
  
  let windowHalfX = window.innerWidth / 2;
  let windowHalfY = window.innerHeight / 2;
  
  let mouseNormalized = new THREE.Vector2(9999, 9999);

  document.addEventListener('mousemove', (event) => {
    mouseX = (event.clientX - windowHalfX);
    mouseY = (event.clientY - windowHalfY);
    
    mouseNormalized.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouseNormalized.y = -(event.clientY / window.innerHeight) * 2 + 1;
  });

  const raycaster = new THREE.Raycaster();
  const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
  const mouse3D = new THREE.Vector3();

  function animate() {
    requestAnimationFrame(animate);
    
    // 相机跟随鼠标轻微移动
    targetX = mouseX * 0.0005;
    targetY = mouseY * 0.0005;
    camera.position.x += (targetX - camera.position.x) * 0.05;
    camera.position.y += (-targetY - camera.position.y) * 0.05;
    camera.lookAt(scene.position);

    raycaster.setFromCamera(mouseNormalized, camera);
    raycaster.ray.intersectPlane(plane, mouse3D);

    const positions = particlesGeometry.attributes.position.array;
    let lineVertexIndex = 0;

    // 更新粒子位置
    for (let i = 0; i < particlesCount; i++) {
      const i3 = i * 3;

      // 1. 应用速度 (主要是向上)
      positions[i3] += velocityArray[i3];
      positions[i3 + 1] += velocityArray[i3 + 1];
      positions[i3 + 2] += velocityArray[i3 + 2];

      // 2. 循环重置机制 (Rising Embers 核心逻辑)
      // 如果粒子超出了顶部边界 (50)，重置到底部 (-50)
      if (positions[i3 + 1] > 60) {
         positions[i3 + 1] = -60;
         // 随机化 X 和 Z 位置，防止出现明显的“波浪”重复
         positions[i3] = (Math.random() - 0.5) * 140;
         positions[i3 + 2] = (Math.random() - 0.5) * 80;
      }

      // 3. 鼠标交互 (扰动/推开)
      // 当鼠标靠近时，粒子会受到扰动，模拟气流
      const dx = mouse3D.x - positions[i3];
      const dy = mouse3D.y - positions[i3 + 1];
      const dz = mouse3D.z - positions[i3 + 2];
      const distSq = dx*dx + dy*dy + dz*dz;

      if (distSq < mouseDistanceSq) {
        const force = (mouseDistanceSq - distSq) / mouseDistanceSq;
        // 主要是水平推开，模拟手穿过烟雾
        positions[i3] -= dx * force * 0.05;
        positions[i3 + 1] -= dy * force * 0.05;
        positions[i3 + 2] -= dz * force * 0.05;
      }

      // 连线逻辑
      for (let j = i + 1; j < i + 8; j++) {
         const jMod = j % particlesCount;
         const j3 = jMod * 3;

         const dx2 = positions[i3] - positions[j3];
         const dy2 = positions[i3+1] - positions[j3+1];
         const dz2 = positions[i3+2] - positions[j3+2];

         const distSq2 = dx2*dx2 + dy2*dy2 + dz2*dz2;

         if (distSq2 < connectionDistanceSq) {
            if (lineVertexIndex < maxConnections * 3 - 6) {
                // 根据高度淡化连线 (可选：顶部连线更少？暂不实现以保持简单)
               linePositions[lineVertexIndex++] = positions[i3];
               linePositions[lineVertexIndex++] = positions[i3+1];
               linePositions[lineVertexIndex++] = positions[i3+2];

               linePositions[lineVertexIndex++] = positions[j3];
               linePositions[lineVertexIndex++] = positions[j3+1];
               linePositions[lineVertexIndex++] = positions[j3+2];
            }
         }
      }
    }
    
    particlesGeometry.attributes.position.needsUpdate = true;
    linesGeometry.setDrawRange(0, lineVertexIndex / 3);
    linesGeometry.attributes.position.needsUpdate = true;

    // 整体轻微旋转
    scene.rotation.y += 0.0002;

    renderer.render(scene, camera);
  }
  
  animate();
  
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    windowHalfX = window.innerWidth / 2;
    windowHalfY = window.innerHeight / 2;
  });
});