// 平滑滚动功能
document.addEventListener('DOMContentLoaded', function() {
  // 为所有锚点链接添加平滑滚动
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      e.preventDefault();
      const targetId = this.getAttribute('href').substring(1);
      const targetElement = document.getElementById(targetId);

      if (targetElement) {
        targetElement.scrollIntoView({
          behavior: 'smooth'
        });
      }
    });
  });

  // 页面过渡动画 (Intersection Observer)
  const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.1
  };

  const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target); // 动画只触发一次
      }
    });
  }, observerOptions);

  // 观察所有带有 fade-in-section 类的元素
  document.querySelectorAll('.fade-in-section').forEach(el => {
    observer.observe(el);
  });
});