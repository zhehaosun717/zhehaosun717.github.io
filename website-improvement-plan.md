# 作品集网站优化改进计划

## 网站现状分析
当前网站包含以下主要问题：
- 重复的 HTML 文件（index.html 和 web.html）
- 项目页面有大量重复代码结构
- 缺少 SEO 元数据
- 样式分散在内联 CSS 和外部文件中
- 缺少加载状态指示、返回顶部等功能

---

## 🎯 优先级任务列表

### 🔴 立即修复（高优先级）

#### 1. 删除重复的 HTML 文件
- **问题**：存在 index.html 和 web.html 两个几乎相同的文件
- **解决方案**：
  - 选择保留 index.html（推荐，GitHub Pages 默认）
  - 删除 web.html
  - 更新所有项目页面的链接指向 index.html
- **影响**：简化维护，避免链接混乱

#### 2. 修复项目页面导航链接
- **文件**：projects/unreal-logic-system.html 等所有项目页面
- **操作**：将所有导航链接从 web.html 改为 index.html
- **示例**：
  ```html
  <!-- 修改前 -->
  <a href="../web.html#home">HOME</a>

  <!-- 修改后 -->
  <a href="../index.html#home">HOME</a>
  ```

#### 3. 添加 SEO 元数据标签
- **文件**：index.html
- **添加内容**：
  ```html
  <!-- 在 <head> 中添加 -->
  <meta name="description" content="Zhehao Sun - Game Designer & Interactive Developer portfolio. Specializing in Unreal Engine, shader-based interactions, and game art.">
  <meta name="keywords" content="game designer, interactive developer, unreal engine, shader, portfolio">
  <meta name="author" content="Zhehao Sun">

  <!-- Open Graph for social sharing -->
  <meta property="og:title" content="Zhehao Sun - Game Designer Portfolio">
  <meta property="og:description" content="Interactive Designer & Game Developer focusing on merging tech with storytelling.">
  <meta property="og:type" content="website">
  <meta property="og:url" content="https://zhehaosun717.github.io">
  <!-- <meta property="og:image" content="https://zhehaosun717.github.io/og-image.jpg"> -->

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="Zhehao Sun - Game Designer">
  <meta name="twitter:description" content="Game development and interactive design portfolio">

  <!-- Favicon -->
  <link rel="icon" type="image/x-icon" href="/favicon.ico">
  ```

#### 4. 分离内联 CSS 到外部文件
- **文件**：index.html
- **操作**：
  1. 将 `<style>` 标签内的所有样式移动到 `css/style.css`
  2. 使用 CSS 变量管理颜色
  3. 保留必要的动画关键帧
- **优势**：提高可维护性，利用浏览器缓存

### 🟡 本周完成（中优先级）

#### 5. 添加页面加载指示器
- **文件**：index.html, js/background.js
- **实现**：
  ```html
  <!-- 添加加载遮罩 -->
  <div id="loader" class="fixed inset-0 flex items-center justify-center bg-[#010a14] z-50 transition-opacity duration-500">
    <div class="text-[#c39e5c]">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-[#c39e5c]"></div>
      <p class="mt-4 text-sm">Loading...</p>
    </div>
  </div>
  ```
  ```javascript
  // 在 background.js 中
  window.addEventListener('load', () => {
    setTimeout(() => {
      const loader = document.getElementById('loader');
      loader.style.opacity = '0';
      setTimeout(() => loader.style.display = 'none', 500);
    }, 1000);
  });
  ```

#### 6. 添加返回顶部按钮
- **文件**：js/common.js
- **实现**：
  ```javascript
  // 添加返回顶部按钮
  const backToTop = document.createElement('button');
  backToTop.innerHTML = '↑';
  backToTop.className = 'fixed bottom-8 right-8 hidden bg-[#c39e5c] text-[#010a14] w-12 h-12 rounded-full transition-all duration-300 hover:scale-110 hover:bg-[#ede7d6] z-40';
  document.body.appendChild(backToTop);

  // 滚动监听
  window.addEventListener('scroll', () => {
    if (window.scrollY > 500) {
      backToTop.classList.remove('hidden');
    } else {
      backToTop.classList.add('hidden');
    }
  });

  // 点击事件
  backToTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
  ```

#### 7. 创建统一的页脚布局
- **文件**：所有 HTML 文件
- **当前问题**：footer 只在 index.html 中存在
- **解决方案**：
  1. 统一页脚样式和内容
  2. 添加社交媒体链接（LinkedIn, GitHub, ArtStation 等）
  3. 添加到项目页面的页脚

### 🟢 本月完成（低优先级）

#### 8. 实现联系表单功能
- **选项**：
  - **免费方案**：使用 Formspree (https://formspree.io) 或 EmailJS
  - **简单方案**：mailto 链接跳转
- **实现**：
  ```javascript
  // 使用 EmailJS 示例
  document.querySelector('form').addEventListener('submit', (e) => {
    e.preventDefault();

    emailjs.sendForm('service_id', 'template_id', e.target)
      .then(() => {
        alert('Message sent successfully!');
        e.target.reset();
      })
      .catch(err => {
        alert('Failed to send message. Please try again.');
      });
  });
  ```

#### 9. 添加移动端响应式汉堡菜单
- **文件**：index.html, css/style.css, js/common.js
- **实现要点**：
  - 768px 以下显示汉堡图标
  - 点击展开/收起
  - 平滑动画效果

#### 10. 优化 Three.js 背景性能
- **文件**：js/background.js
- **优化**：
  ```javascript
  // 检测设备性能
  const isLowEnd = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const hasLowMemory = navigator.deviceMemory && navigator.deviceMemory < 4;

  const particlesCount = isLowEnd || hasLowMemory ? 500 : 2000;
  const connectionDistance = isLowEnd ? 10 : 15;
  const mouseDistance = isLowEnd ? 15 : 25;

  // 降低移动端的渲染质量
  renderer.setPixelRatio(isLowEnd ? Math.min(window.devicePixelRatio, 1) : Math.min(window.devicePixelRatio, 2));
  ```

#### 11. 重构代码为模块化结构
- **目标**：提高可维护性和扩展性
- **结构**：
  ```
  /js
    main.js              # 入口文件
    modules/
      background.js      # Three.js 背景
      scroll.js          # 滚动和动画
      mobile-menu.js     # 移动端菜单
      contact-form.js    # 联系表单
      lazy-loading.js    # 图片懒加载

  /css
    style.css            # 基础样式
    components/
      nav.css            # 导航栏
      project-card.css   # 项目卡片
      contact-form.css   # 联系表单
      loader.css         # 加载器
      back-to-top.css    # 返回顶部按钮
  ```

---

## 🎨 设计改进建议

### 视觉增强
1. **添加微交互**
   - 项目卡片悬停时的细微缩放和阴影效果
   - 导航链接的悬停动画
   - 按钮点击反馈

2. **项目标签系统**
   ```html
   <div class="flex flex-wrap gap-2 mt-3">
     <span class="px-3 py-1 bg-[#c39e5c20] text-[#c39e5c] text-xs rounded-full">
       Unreal Engine 5
     </span>
     <span class="px-3 py-1 bg-[#c39e5c20] text-[#c39e5c] text-xs rounded-full">
       Blueprint
     </span>
   </div>
   ```

3. **滚动进度条**
   ```css
   .scroll-progress {
     position: fixed;
     top: 0;
     left: 0;
     width: 0%;
     height: 3px;
     background: linear-gradient(90deg, #c39e5c, #ede7d6);
     z-index: 1000;
     transition: width 0.1s ease;
   }
   ```

4. **项目详情页面优化**
   - 添加技术栈图标
   - 实现图片画廊（支持左右切换）
   - 添加 GitHub/演示链接按钮
   - Related projects 部分

### 色彩系统（建议）
```css
:root {
  --bg-dark: #010a14;      /* 原背景色 */
  --text-light: #ede7d6;   /* 原文字亮色 */
  --accent-gold: #c39e5c;  /* 原强调色 */

  /* 扩展色板 */
  --bg-card: #1C2233;      /* 卡片背景 */
  --accent-hover: #d4af64; /* 悬停色 */
  --text-muted: #a08a5f;   /* 次要文字 */
}
```

---

## 📱 移动端优化清单

- [x] Three.js 背景粒子数量优化
- [ ] 触摸友好的按钮间距（最小44px）
- [ ] 汉堡菜单实现
- [ ] 移动端图片缩放适配
- [ ] 触摸反馈效果
- [ ] 减少动画持续时间（移动端偏好更短的动画）
- [ ] 测试所有交互元素的触摸响应

---

## 🔧 技术债务

### 需重构的代码
1. **重复的页面模板**
   - 创建基础模板文件
   - 使用 JavaScript 动态加载项目数据
   - 或使用静态站点生成器 (Jekyll, Hugo, Eleventy)

2. **硬编码的样式**
   - 将所有内联样式移到 CSS 文件
   - 使用 Tailwind 的 @apply 指令创建组件类
   - 示例：
     ```css
     .project-card {
       @apply bg-[#1C2233] p-4 rounded-xl shadow-md transition;
     }
     ```

3. **魔法数字**
   - 将过渡延迟、粒子数量等硬编码数值定义为常量
   - 使用 CSS 变量管理间距、颜色等

---

## 📊 SEO 优化清单

### 基础 SEO
- [ ] 添加页面标题（每个页面唯一）
- [ ] 添加 meta description
- [ ] 添加结构化数据（Schema.org）
  ```html
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Person",
    "name": "Zhehao Sun",
    "jobTitle": "Game Designer",
    "url": "https://zhehaosun717.github.io",
    "sameAs": [
      "https://linkedin.com/in/yourprofile",
      "https://github.com/yourprofile"
    ]
  }
  </script>
  ```

### 性能优化
- [ ] 图片压缩和 WebP 格式
- [ ] 添加图片懒加载
- [ ] 最小化 CSS/JS 文件
- [ ] 启用 CDN 缓存
- [ ] 减少 HTTP 请求数

---

## 🎯 下一步行动

### 今天可以完成的任务
1. 删除 web.html（10分钟）
2. 更新项目页面链接（15分钟）
3. 添加基础 SEO 元数据（15分钟）
4. 添加加载指示器（30分钟）

### 本周完成的任务
1. 分离 CSS 到外部文件
2. 添加返回顶部按钮
3. 优化 Three.js 性能
4. 统一页脚布局

### 需要进一步讨论的任务
1. 选择联系表单实现方案
2. 是否使用静态站点生成器重构
3. 添加哪些社交媒体链接
4. 项目详情页的图片和文案准备

---

## 参考资源

- **Three.js 优化**：https://threejs.org/docs/#manual/en/introduction/Optimization
- **SEO 最佳实践**：https://developers.google.com/search/docs/fundamentals
- **移动端优化**：https://web.dev/mobile/
- **Tailwind CSS 文档**：https://tailwindcss.com/docs
- **Formspree**：https://formspree.io (免费联系表单)
- **EmailJS**：https://www.emailjs.com (免费邮件发送服务)

---

## 更新日志

| 日期 | 完成内容 | 状态 |
|------|---------|------|
| 2025-01-24 | 创建改进计划文档 | ✅ |
| | | |
| | | |

---

**文档创建时间**：2025-01-24
**最后更新**：2025-01-24
**版本**：v1.0
