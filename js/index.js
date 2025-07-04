// 首页JavaScript文件
// 用于管理Yang Lab首页的交互功能

import { initAuth } from './auth.js';

// 初始化页面标题变化效果
function initPageTitleEffect() {
    let normal_title = document.title;

    document.addEventListener('visibilitychange', function () {
        if (document.visibilityState == 'hidden') {
            document.title = '怎么走了呀～ ┭┮﹏┭┮';
        } else {
            document.title = normal_title;
        }
    });
}

// 初始化鼠标光标特效
function initLaserCursorEffect() {
    document.addEventListener('mousemove', function (e) {
        const cursor = document.getElementById('laser-cursor');
        if (!cursor) return;

        cursor.style.left = e.clientX + 'px';
        cursor.style.top = e.clientY + 'px';

        // 创建拖尾效果
        const trail = document.createElement('div');
        trail.className = 'trail-dot';
        document.body.appendChild(trail);

        trail.style.left = e.clientX + 'px';
        trail.style.top = e.clientY + 'px';

        // 动画效果：逐渐缩小和消失
        let size = 11; // 初始大小与主光标一致，增大10%
        let opacity = 1; // 初始不透明度
        const interval = setInterval(() => {
            size *= 0.9; // 逐渐缩小
            opacity *= 0.9; // 逐渐消失
            trail.style.width = size + 'px';
            trail.style.height = size + 'px';
            trail.style.opacity = opacity;
            if (size < 1 || opacity < 0.1) {
                clearInterval(interval);
                trail.remove(); // 移除元素
            }
        }, 20); // 每20毫秒更新一次，提高帧率
    });
}

// 初始化链接行为
function initLinkBehavior() {
    const allLinks = document.querySelectorAll('a');
    allLinks.forEach(link => {
        link.addEventListener('click', function (event) {
            // 检查链接是否已经有 target="_blank"，如果已经有，则不干预
            // 并且排除ID为'loginBtn'的链接，使其不会在新标签页打开
            if (this.target !== '_blank' && this.id !== 'loginBtn' &&
                this.id !== 'logoutBtn' && this.id !== 'switchUserBtn') {
                event.preventDefault(); // 阻止默认跳转
                window.open(this.href, '_blank'); // 在新标签页打开
            }
        });
    });
}

// 初始化页面
function initPage() {
    // 初始化页面标题变化效果
    initPageTitleEffect();

    // 初始化鼠标光标特效
    initLaserCursorEffect();

    // 初始化链接行为
    initLinkBehavior();

    // 初始化用户认证功能
    initAuth();
}

// 当DOM加载完成时初始化页面
document.addEventListener('DOMContentLoaded', initPage); 