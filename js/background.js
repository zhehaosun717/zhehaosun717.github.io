document.addEventListener('DOMContentLoaded', function () {
  if (typeof THREE === 'undefined') {
    console.error('Three.js failed to load.');
    return;
  }

  // 初始化场景
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#010a14');
  
  // 初始化相机
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.z = 40; // 稍微拉远相机
  
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
  const connectionDistance = 18; // 连接距离
  const mouseDistance = 30; // 鼠标互动距离
  
  // 几何体和材质
  const particlesGeometry = new THREE.BufferGeometry();
  const particlesMaterial = new THREE.PointsMaterial({
    size: 0.25,
    color: '#3949ab',
    transparent: true,
    opacity: 0.8,
    sizeAttenuation: true,
    blending: THREE.AdditiveBlending
  });

  const posArray = new Float32Array(particlesCount * 3);
  const velocityArray = new Float32Array(particlesCount * 3); // 速度
  const originalPosArray = new Float32Array(particlesCount * 3); // 原始位置（用于弹性回归）

  for (let i = 0; i < particlesCount * 3; i += 3) {
    // 随机分布
    const x = (Math.random() - 0.5) * 140;
    const y = (Math.random() - 0.5) * 100;
    const z = (Math.random() - 0.5) * 80;

    posArray[i] = x;
    posArray[i + 1] = y;
    posArray[i + 2] = z;

    originalPosArray[i] = x;
    originalPosArray[i + 1] = y;
    originalPosArray[i + 2] = z;

    // 随机速度
    velocityArray[i] = (Math.random() - 0.5) * 0.05;
    velocityArray[i + 1] = (Math.random() - 0.5) * 0.05;
    velocityArray[i + 2] = (Math.random() - 0.5) * 0.05;
  }
  
  particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
  const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
  scene.add(particlesMesh);

  // 线条材质 (使用LineSegments优化性能)
  const linesMaterial = new THREE.LineBasicMaterial({
    color: '#3f51b5',
    transparent: true,
    opacity: 0.15,
    blending: THREE.AdditiveBlending
  });

  // 预先分配最大可能的线段顶点数 (优化内存)
  // 假设每个粒子最多连接5个邻居
  const maxConnections = particlesCount * 3;
  const linesGeometry = new THREE.BufferGeometry();
  const linePositions = new Float32Array(maxConnections * 3);
  linesGeometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
  linesGeometry.setDrawRange(0, 0); // 初始不绘制
  
  const linesMesh = new THREE.LineSegments(linesGeometry, linesMaterial);
  scene.add(linesMesh);

  // 鼠标交互
  let mouseX = 0;
  let mouseY = 0;
  let targetX = 0;
  let targetY = 0;
  
  const windowHalfX = window.innerWidth / 2;
  const windowHalfY = window.innerHeight / 2;
  
  // 归一化鼠标坐标
  let mouseNormalized = new THREE.Vector2(9999, 9999);

  document.addEventListener('mousemove', (event) => {
    mouseX = (event.clientX - windowHalfX);
    mouseY = (event.clientY - windowHalfY);
    
    // 计算归一化设备坐标 (-1 到 +1) 用于射线检测或距离计算
    mouseNormalized.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouseNormalized.y = -(event.clientY / window.innerHeight) * 2 + 1;
  });

  // 创建一个平面用于将鼠标2D坐标映射到3D空间
  const raycaster = new THREE.Raycaster();
  const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
  const mouse3D = new THREE.Vector3();

  function animate() {
    requestAnimationFrame(animate);
    
    // 更新相机平滑移动
    targetX = mouseX * 0.001;
    targetY = mouseY * 0.001;
    camera.position.x += (targetX - camera.position.x) * 0.05;
    camera.position.y += (-targetY - camera.position.y) * 0.05;
    camera.lookAt(scene.position);

    // 计算鼠标在3D空间的位置 (在z=0平面上)
    raycaster.setFromCamera(mouseNormalized, camera);
    raycaster.ray.intersectPlane(plane, mouse3D);

    const positions = particlesGeometry.attributes.position.array;
    let lineVertexIndex = 0;
    let numConnected = 0;

    // 更新粒子位置
    for (let i = 0; i < particlesCount; i++) {
      const i3 = i * 3;

      // 基础漂浮运动
      positions[i3] += velocityArray[i3];
      positions[i3 + 1] += velocityArray[i3 + 1];
      positions[i3 + 2] += velocityArray[i3 + 2];

      // 边界检查：如果粒子跑太远，重置位置
      if (Math.abs(positions[i3] - originalPosArray[i3]) > 20) velocityArray[i3] *= -1;
      if (Math.abs(positions[i3 + 1] - originalPosArray[i3 + 1]) > 20) velocityArray[i3 + 1] *= -1;

      // 鼠标交互：粒子避开/吸引鼠标
      const dx = mouse3D.x - positions[i3];
      const dy = mouse3D.y - positions[i3 + 1];
      const dz = mouse3D.z - positions[i3 + 2]; // 假设z平面接近
      const distSq = dx*dx + dy*dy + dz*dz; // 距离平方

      if (distSq < mouseDistance * mouseDistance) {
        const force = (mouseDistance * mouseDistance - distSq) / (mouseDistance * mouseDistance);
        // 推开效果
        positions[i3] -= dx * force * 0.03;
        positions[i3 + 1] -= dy * force * 0.03;
        positions[i3 + 2] -= dz * force * 0.03;
      } else {
        // 缓慢回归原始轨迹 (弹性)
        positions[i3] += (originalPosArray[i3] + Math.sin(Date.now() * 0.001 + i) * 5 - positions[i3]) * 0.01;
        positions[i3 + 1] += (originalPosArray[i3 + 1] + Math.cos(Date.now() * 0.002 + i) * 5 - positions[i3 + 1]) * 0.01;
      }

      // 简单的连线逻辑 (仅与附近几个粒子连线，优化性能)
      // 注意：这只是一个近似，为了性能我们不进行O(N^2)检测
      // 我们只检测数组中相邻的粒子作为简化
      for (let j = i + 1; j < i + 8; j++) {
         const jMod = j % particlesCount;
         const j3 = jMod * 3;

         const dx2 = positions[i3] - positions[j3];
         const dy2 = positions[i3+1] - positions[j3+1];
         const dz2 = positions[i3+2] - positions[j3+2];

         const distSq2 = dx2*dx2 + dy2*dy2 + dz2*dz2;

         if (distSq2 < connectionDistance * connectionDistance) {
            // 添加线段顶点
            if (lineVertexIndex < maxConnections * 3 - 6) {
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

    // 缓慢旋转整个粒子群
    particlesMesh.rotation.y += 0.0005;
    linesMesh.rotation.y += 0.0005;

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