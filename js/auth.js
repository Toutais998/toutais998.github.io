/* 
=====================================================================
* 文件名: auth.js
* 版本: V1.0
* 创建日期: 未知
* 最后修改: 2025-07-05
* 
* 功能简介:
* - 处理网站的用户认证功能。
* - 使用前端硬编码的用户列表进行登录验证。
* - 通过 localStorage 在浏览器会话中持久化用户登录状态。
* - 管理登录/注销、用户资料显示和切换用户的UI逻辑。
* - 为其他模块提供检查用户登录状态和获取当前用户信息的接口。
* 
* 注意:
* - 这是一个简单的前端认证实现，不涉及后端或数据库验证，安全性较低。
=====================================================================
*/

// 用户认证模块
// 用于管理用户登录、注销和会话管理功能

// 用户数据
const users = {
    "yangxusan": { password: "@yangxusan", avatar: "images/Basic/小兔头.png" },
    "huzirui": { password: "@huzirui", avatar: "images/Basic/cat-head.png" },
    "pengchunlei": { password: "@pengchunlei", avatar: "" },
    "liukai": { password: "@liukai", avatar: "" },
    "guanweinan": { password: "@guanweinan", avatar: "" },
    "liuchi": { password: "@liuchi", avatar: "" },
    "caijiangshan": { password: "@caijiangshan", avatar: "" },
    "qinhuaiyuan": { password: "@qinhuaiyuan", avatar: "" },
    "xuning": { password: "@xuning", avatar: "" },
    "chaifumei": { password: "@chaifumei", avatar: "" },
    "liuhaoru": { password: "@liuhaoru", avatar: "" },
    "lidongrun": { password: "@lidongrun", avatar: "" },
    "lixiaofan": { password: "@lixiaofan", avatar: "" },
    "huangzengyuan": { password: "@huangzengyuan", avatar: "" },
    "wanghao": { password: "@wanghao", avatar: "" },
    "yubohao": { password: "@yubohao", avatar: "" },
    "zenghao": { password: "@zenghao", avatar: "" },
    "qiuhongbiao": { password: "@qiuhongbiao", avatar: "" },
    "libo": { password: "@libo", avatar: "" },
    "dongna": { password: "@dongna", avatar: "" },
    "wangzeyu": { password: "@wangzeyu", avatar: "" },
    "zhangxiaoge": { password: "@zhangxiaoge", avatar: "" }
};

// 生成默认头像HTML
function getDefaultAvatarHtml(username) {
    const initial = username.charAt(0).toUpperCase();
    return `<div class="default-avatar">${initial}</div>`;
}

// 显示用户资料
function displayUserProfile(username, avatarUrl) {
    const userProfileDiv = document.getElementById('userProfile');
    if (!userProfileDiv) return;

    userProfileDiv.innerHTML = ''; // 清除之前的内容

    const avatarHtml = avatarUrl ?
        `<img src="${avatarUrl}" alt="${username}" class="user-avatar">` :
        getDefaultAvatarHtml(username);

    userProfileDiv.innerHTML = `${avatarHtml}<span>${username}</span><div class="dropdown-content"><a href="#" id="logoutBtn">注销</a><a href="#" id="switchUserBtn">切换用户</a></div>`;

    userProfileDiv.style.display = 'flex'; // 显示用户资料

    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) {
        loginBtn.style.display = 'none'; // 隐藏登录按钮
    }

    // 保存登录状态到localStorage
    localStorage.setItem('loggedInUser', username);
    if (avatarUrl) {
        localStorage.setItem('loggedInUserAvatar', avatarUrl);
    } else {
        localStorage.removeItem('loggedInUserAvatar');
    }

    // 重新绑定注销/切换用户按钮的事件监听器
    document.getElementById('logoutBtn').addEventListener('click', logoutUser);
    document.getElementById('switchUserBtn').addEventListener('click', switchUser);
}

// 隐藏用户资料
function hideUserProfile() {
    const userProfileDiv = document.getElementById('userProfile');
    const loginBtn = document.getElementById('loginBtn');

    if (userProfileDiv) {
        userProfileDiv.style.display = 'none';
        userProfileDiv.innerHTML = ''; // 清除内容
    }

    if (loginBtn) {
        loginBtn.style.display = 'block'; // 显示登录按钮
    }

    // 清除localStorage中的登录状态
    localStorage.removeItem('loggedInUser');
    localStorage.removeItem('loggedInUserAvatar');
}

// 注销用户
function logoutUser() {
    if (confirm('您确定要注销吗？')) {
        hideUserProfile();
        alert('已注销。');
    }
}

// 切换用户
function switchUser() {
    hideUserProfile();
    const loginModal = document.getElementById('loginModal');
    if (loginModal) {
        loginModal.style.display = "block"; // 显示登录模态框
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.reset();
        }
    }
}

// 初始化登录功能
export function initAuth() {
    // 检查登录状态
    const storedUsername = localStorage.getItem('loggedInUser');
    const storedAvatar = localStorage.getItem('loggedInUserAvatar');

    if (storedUsername) {
        displayUserProfile(storedUsername, storedAvatar);
    } else {
        hideUserProfile(); // 确保未登录时的正确初始状态
    }

    // 获取登录相关元素
    const loginBtn = document.getElementById('loginBtn');
    const loginModal = document.getElementById('loginModal');
    const userProfileDiv = document.getElementById('userProfile');

    if (!loginBtn || !loginModal || !userProfileDiv) {
        console.warn('登录功能所需的DOM元素不存在');
        return;
    }

    const loginCloseSpan = loginModal.querySelector(".close-button");
    const loginForm = document.getElementById('loginForm');

    // 点击登录按钮显示模态框
    loginBtn.onclick = function () {
        loginModal.style.display = "block";
    };

    // 点击关闭按钮隐藏模态框
    if (loginCloseSpan) {
        loginCloseSpan.onclick = function () {
            loginModal.style.display = "none";
            if (loginForm) loginForm.reset();
        };
    }

    // 点击模态框外部关闭模态框
    window.onclick = function (event) {
        if (event.target == loginModal) {
            loginModal.style.display = "none";
            if (loginForm) loginForm.reset();
        }
    };

    // 用户资料点击事件（显示/隐藏下拉菜单）
    userProfileDiv.addEventListener('click', function (event) {
        // 切换下拉菜单可见性
        const dropdown = userProfileDiv.querySelector('.dropdown-content');
        if (dropdown) {
            dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
        }
        event.stopPropagation(); // 防止文档点击事件立即关闭下拉菜单
    });

    // 点击页面其他地方关闭下拉菜单
    document.addEventListener('click', function (event) {
        const dropdown = userProfileDiv.querySelector('.dropdown-content');
        if (dropdown && dropdown.style.display === 'block' && !userProfileDiv.contains(event.target)) {
            dropdown.style.display = 'none';
        }
    });

    // 处理登录表单提交
    if (loginForm) {
        loginForm.addEventListener('submit', function (event) {
            event.preventDefault();

            const usernameInput = document.getElementById('username');
            const passwordInput = document.getElementById('password');

            if (!usernameInput || !passwordInput) return;

            const username = usernameInput.value.trim();
            const password = passwordInput.value.trim();

            const user = users[username];

            if (user && user.password === password) {
                alert('登录成功！');
                displayUserProfile(username, user.avatar);
                loginModal.style.display = 'none';
                loginForm.reset();
            } else {
                alert('用户名或密码错误，请重试！');
            }
        });
    }
}

// 检查用户是否已登录
export function isUserLoggedIn() {
    return localStorage.getItem('loggedInUser') !== null;
}

// 获取当前登录用户信息
export function getCurrentUser() {
    const username = localStorage.getItem('loggedInUser');
    if (!username) return null;

    return {
        username,
        avatar: localStorage.getItem('loggedInUserAvatar') || null
    };
} 