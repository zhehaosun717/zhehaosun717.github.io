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
  camera.position.z = 30;
  
  // 初始化渲染器
  const renderer = new THREE.WebGLRenderer({ 
    canvas: document.getElementById('three-bg'), 
    antialias: true 
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  // 创建圆形纹理
  const createCircleTexture = () => {
    const canvas = document.createElement('canvas');
    const size = 128;
    canvas.width = size;
    canvas.height = size;
    
    const context = canvas.getContext('2d');
    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size / 2;
    
    context.beginPath();
    context.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);
    
    // 创建径向渐变 - 更亮的中心点
    const gradient = context.createRadialGradient(
      centerX, centerY, 0,
      centerX, centerY, radius
    );
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.5)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    
    context.fillStyle = gradient;
    context.fill();
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  };
  
  const circleTexture = createCircleTexture();

  // 创建粒子系统 - 增加粒子数量和大小
  const particlesGeometry = new THREE.BufferGeometry();
  const particlesCount = 2500; // 增加粒子数量
  
  const posArray = new Float32Array(particlesCount * 3);
  const scaleArray = new Float32Array(particlesCount);
  
  for (let i = 0; i < particlesCount * 3; i += 3) {
    posArray[i] = (Math.random() - 0.5) * 100;
    posArray[i + 1] = (Math.random() - 0.5) * 100;
    posArray[i + 2] = (Math.random() - 0.5) * 100;
    scaleArray[i / 3] = Math.random() + 0.3; // 增加基础大小
  }
  
  particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
  particlesGeometry.setAttribute('scale', new THREE.BufferAttribute(scaleArray, 1));
  
  const particlesMaterial = new THREE.PointsMaterial({
    size: 0.3, // 增大粒子尺寸
    color: '#3949ab', // 使用更亮的蓝色
    transparent: true,
    opacity: 0.7, // 增加不透明度
    sizeAttenuation: true,
    map: circleTexture,
    blending: THREE.AdditiveBlending
  });
  
  const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
  scene.add(particlesMesh);
  
  // 创建线条 - 增加线条数量和可见度
  const linesMaterial = new THREE.LineBasicMaterial({
    color: '#3f51b5', // 使用更亮的线条颜色
    transparent: true,
    opacity: 0.2 // 增加不透明度但仍保持较低以不影响文字
  });
  
  const linesGeometry = new THREE.BufferGeometry();
  const lineVertices = [];
  
  for (let i = 0; i < 150; i++) { // 增加线条数量
    const x1 = (Math.random() - 0.5) * 100;
    const y1 = (Math.random() - 0.5) * 100;
    const z1 = (Math.random() - 0.5) * 100;
    
    const x2 = x1 + (Math.random() - 0.5) * 20;
    const y2 = y1 + (Math.random() - 0.5) * 20;
    const z2 = z1 + (Math.random() - 0.5) * 20;
    
    lineVertices.push(x1, y1, z1);
    lineVertices.push(x2, y2, z2);
  }
  
  linesGeometry.setAttribute('position', new THREE.Float32BufferAttribute(lineVertices, 3));
  const lines = new THREE.LineSegments(linesGeometry, linesMaterial);
  scene.add(lines);
  
  // 鼠标交互 - 增加交互灵敏度
  let mouseX = 0;
  let mouseY = 0;
  let targetX = 0;
  let targetY = 0;
  
  const windowHalfX = window.innerWidth / 2;
  const windowHalfY = window.innerHeight / 2;
  
  document.addEventListener('mousemove', (event) => {
    mouseX = (event.clientX - windowHalfX);
    mouseY = (event.clientY - windowHalfY);
  });
  
  function updateCamera() {
    targetX = mouseX * 0.0015; // 增加鼠标移动灵敏度
    targetY = mouseY * 0.0015;
    
    camera.position.x += (targetX - camera.position.x) * 0.07; // 更快的相机响应
    camera.position.y += (-targetY - camera.position.y) * 0.07;
    
    camera.lookAt(scene.position);
  }
  
  function animate() {
    requestAnimationFrame(animate);
    
    updateCamera();
    
    particlesMesh.rotation.x += 0.0003; // 增加旋转速度
    particlesMesh.rotation.y += 0.0003;
    
    lines.rotation.x += 0.0002; // 增加线条旋转速度
    lines.rotation.y += 0.0002;
    
    renderer.render(scene, camera);
  }
  
  animate();
  
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  });
}); 