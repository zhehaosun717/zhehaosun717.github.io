// DOM元素加载完毕后执行
document.addEventListener('DOMContentLoaded', function() {
    // 初始化所有功能
    initHeaderScroll();
    initMobileMenu();
    initScrollAnimation();
    initImageLazyLoad();
    initPortfolioFilter();
    initSmoothScroll();
    initContactForm();

    // 更新页脚版权年份
    updateCopyrightYear();
});

// 头部滚动效果
function initHeaderScroll() {
    const header = document.querySelector('header');
    let lastScrollTop = 0;

    window.addEventListener('scroll', function() {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        // 导航栏背景变化
        if (scrollTop > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }

        // 导航栏隐藏/显示效果
        if (scrollTop > lastScrollTop && scrollTop > 200) {
            header.classList.add('hidden');
        } else {
            header.classList.remove('hidden');
        }
        
        lastScrollTop = scrollTop;
    });
}

// 移动端菜单
function initMobileMenu() {
    const menuToggle = document.querySelector('.mobile-menu-toggle');
    const mobileMenu = document.querySelector('.mobile-menu');
    
    if (menuToggle && mobileMenu) {
        // 点击汉堡菜单切换
        menuToggle.addEventListener('click', function() {
            mobileMenu.classList.toggle('active');
            toggleMenuIcon(mobileMenu.classList.contains('active'));
        });
        
        // 移动菜单中的链接点击事件
        const mobileLinks = document.querySelectorAll('.mobile-menu a');
        mobileLinks.forEach(link => {
            link.addEventListener('click', function() {
                mobileMenu.classList.remove('active');
                toggleMenuIcon(false);
            });
        });
    }
    
    // 切换汉堡菜单图标
    function toggleMenuIcon(isOpen) {
        const spans = menuToggle.querySelectorAll('span');
        if (isOpen) {
            spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
            spans[1].style.opacity = '0';
            spans[2].style.transform = 'rotate(-45deg) translate(5px, -5px)';
        } else {
            spans[0].style.transform = 'none';
            spans[1].style.opacity = '1';
            spans[2].style.transform = 'none';
        }
    }
}

// 滚动动画 - 元素进入视口时显示
function initScrollAnimation() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });
    
    const animatedElements = document.querySelectorAll('.fade-in-up');
    animatedElements.forEach(el => {
        observer.observe(el);
    });
}

// 图片懒加载
function initImageLazyLoad() {
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    const src = img.getAttribute('data-src');
                    
                    if (src) {
                        img.src = src;
                        img.removeAttribute('data-src');
                        imageObserver.unobserve(img);
                    }
                }
            });
        });
        
        const lazyImages = document.querySelectorAll('img[data-src]');
        lazyImages.forEach(img => {
            imageObserver.observe(img);
        });
    } else {
        // 对于不支持IntersectionObserver的浏览器的回退
        const lazyImages = document.querySelectorAll('img[data-src]');
        lazyImages.forEach(img => {
            img.src = img.getAttribute('data-src');
            img.removeAttribute('data-src');
        });
    }
}

// 作品集过滤功能
function initPortfolioFilter() {
    const filterBtns = document.querySelectorAll('.portfolio-filter');
    const portfolioItems = document.querySelectorAll('.portfolio-item');
    
    filterBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            // 更新活动过滤器
            filterBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            const filterValue = this.getAttribute('data-filter');
            
            // 显示/隐藏项目
            portfolioItems.forEach(item => {
                if (filterValue === 'all' || item.classList.contains(filterValue)) {
                    item.style.display = 'block';
                } else {
                    item.style.display = 'none';
                }
            });
        });
    });
}

// 平滑滚动
function initSmoothScroll() {
    const links = document.querySelectorAll('a[href^="#"]:not([href="#"])');
    
    links.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop - 80,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// 联系表单
function initContactForm() {
    const contactForm = document.getElementById('contact-form');
    
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // 获取表单字段
            const name = document.getElementById('name').value.trim();
            const email = document.getElementById('email').value.trim();
            const message = document.getElementById('message').value.trim();
            
            // 创建或获取消息元素
            let formMessage = document.querySelector('.form-message');
            if (!formMessage) {
                formMessage = document.createElement('div');
                formMessage.className = 'form-message';
                contactForm.appendChild(formMessage);
            }
            
            // 简单验证
            if (name === '' || email === '' || message === '') {
                formMessage.textContent = '请填写所有必填字段';
                formMessage.className = 'form-message error';
                return;
            }
            
            if (!isValidEmail(email)) {
                formMessage.textContent = '请输入有效的电子邮件地址';
                formMessage.className = 'form-message error';
                return;
            }
            
            // 这里应该有AJAX请求来提交表单
            // 为了演示，我们只显示成功消息
            formMessage.textContent = '消息已成功发送！我们会尽快回复您。';
            formMessage.className = 'form-message success';
            contactForm.reset();
            
            // 3秒后隐藏消息
            setTimeout(() => {
                formMessage.textContent = '';
                formMessage.className = 'form-message';
            }, 3000);
        });
    }
}

// 验证邮箱
function isValidEmail(email) {
    const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
}

// 更新页脚版权年份
function updateCopyrightYear() {
    const yearSpan = document.querySelector('.copyright-year');
    if (yearSpan) {
        yearSpan.textContent = new Date().getFullYear();
    }
} 