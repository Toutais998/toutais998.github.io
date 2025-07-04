// UI控制器文件
// 用于集中管理实验室物料管理系统的UI渲染和交互功能

import { getParentId } from './data-manager.js';

// 当前要删除的物品信息
let currentItemToDelete = null;

// 初始化页面状态显示
export function createStatusDisplay() {
    const pageStatus = document.createElement('div');
    pageStatus.id = 'firebaseStatus';
    pageStatus.style.cssText = 'position: fixed; top: 80px; left: 10px; background: rgba(255,255,255,0.9); padding: 10px; border-radius: 5px; z-index: 1000; font-size: 14px; color: #e74c3c; box-shadow: 0 2px 5px rgba(0,0,0,0.2); transition: all 0.3s ease;';
    pageStatus.innerHTML = "Firebase连接中...";
    document.body.appendChild(pageStatus);

    return pageStatus;
}

// 更新状态显示
export function updateStatusDisplay(pageStatus, message, isError = false) {
    if (!pageStatus) return;

    pageStatus.innerHTML = message;
    if (isError) {
        pageStatus.style.color = '#e74c3c'; // 红色表示错误
    } else {
        pageStatus.style.color = '#27ae60'; // 绿色表示成功
    }

    // 5秒后隐藏状态提示
    setTimeout(() => {
        pageStatus.style.opacity = '0';
        setTimeout(() => {
            pageStatus.style.display = 'none';
        }, 500);
    }, 5000);
}

// 渲染内容
export function renderContent(directories, setupDeleteButtonsCallback) {
    console.log("开始渲染内容，目录数据:", directories);

    // 清空现有内容
    document.querySelectorAll('.content-section').forEach(section => {
        section.innerHTML = '';
    });

    // 检查目录数据是否有效
    if (!directories || directories.length === 0) {
        console.error("没有有效的目录数据");
        const mainContentSubDiv = document.querySelector('.main-content-sub');
        mainContentSubDiv.innerHTML += '<div class="error-message">没有找到物料数据。请检查数据库连接或刷新页面。</div>';
        return;
    }

    // 遍历目录结构并创建内容
    directories.forEach(category => {
        console.log("处理类别:", category.name, category);

        const categorySection = document.getElementById(category.id);
        if (categorySection) {
            // 添加类别标题
            const categoryTitleElement = document.createElement('h2');
            categoryTitleElement.className = 'category-title';
            categoryTitleElement.textContent = category.name;
            categorySection.appendChild(categoryTitleElement);

            // 处理子类别
            if (category.children && category.children.length > 0) {
                category.children.forEach(subcategory => {
                    console.log("处理子类别:", subcategory.name, subcategory);

                    // 创建子类别区域
                    const subcategoryDiv = document.createElement('div');
                    subcategoryDiv.id = subcategory.id;
                    subcategoryDiv.className = 'subcategory-section';

                    // 创建并添加子类别标题
                    const subcategoryTitle = document.createElement('h3');
                    subcategoryTitle.className = 'subcategory-title';
                    subcategoryTitle.textContent = subcategory.name;
                    subcategoryDiv.appendChild(subcategoryTitle);

                    // 创建物品网格
                    const boxGrid = document.createElement('div');
                    boxGrid.className = 'box-grid';

                    // 添加物品
                    if (subcategory.items && subcategory.items.length > 0) {
                        subcategory.items.forEach(item => {
                            console.log("添加物品:", item.name, item);

                            // 确保图片路径正确
                            let imageUrl = item.imageUrl || 'images/Basic/story-2.png';

                            const itemBox = document.createElement('div');
                            itemBox.className = 'item-box';
                            itemBox.dataset.id = item.id;

                            // 最终重构：生成扁平、简单的HTML结构，以便于CSS控制
                            itemBox.innerHTML = `
                                <img src="${imageUrl}" class="item-image" onerror="this.onerror=null; this.src='images/Basic/story-2.png';">
                                <p class="item-title">${item.name || '未命名物品'}</p>
                                <div class="item-info">
                                    <p>数量：${item.quantity || 0}</p>
                                    <p>存放位置：${item.location || '未指定'}</p>
                                </div>
                                <button class="delete-btn" title="删除此物品"><i class="fas fa-trash-alt"></i></button>
                            `;

                            boxGrid.appendChild(itemBox);
                        });
                    } else {
                        boxGrid.innerHTML = '<p class="empty-message">该类别下暂无物品</p>';
                    }

                    // 将物品网格添加到子类别区域
                    subcategoryDiv.appendChild(boxGrid);

                    // 将子类别区域添加到类别区域
                    categorySection.appendChild(subcategoryDiv);
                });
            } else {
                categorySection.innerHTML += '<p class="empty-message">该类别下暂无子类别</p>';
            }
        } else {
            console.error(`找不到类别元素: ${category.id}`);
        }
    });

    // 重新绑定删除按钮事件
    if (typeof setupDeleteButtonsCallback === 'function') {
        setupDeleteButtonsCallback();
    }

    console.log("内容渲染完成");
}

// 显示指定类别
export function showCategory(categoryId, getParentIdCallback) {
    console.log("显示类别:", categoryId);

    // 隐藏所有内容区域
    document.querySelectorAll('.content-section').forEach(section => {
        section.style.display = 'none';
    });

    document.querySelectorAll('.subcategory-section').forEach(section => {
        section.classList.remove('active');
    });

    // 显示目标类别
    const categoryElement = document.getElementById(categoryId);
    if (categoryElement) {
        categoryElement.style.display = 'block';
        console.log(`已显示类别: ${categoryId}`);

        // 找到该类别下的第一个子类别并显示
        const firstSubcategory = categoryElement.querySelector('.subcategory-section');
        if (firstSubcategory) {
            firstSubcategory.classList.add('active');
            console.log(`已激活子类别: ${firstSubcategory.id}`);

            // 激活对应的导航链接
            const subcategoryId = firstSubcategory.id;
            const subcategoryLink = document.querySelector(`.nav-menu a[data-target="${subcategoryId}"]`);
            if (subcategoryLink) {
                document.querySelectorAll('.nav-menu a').forEach(a => {
                    a.classList.remove('active');
                });
                subcategoryLink.classList.add('active');
            }
        }
    } else {
        console.warn("找不到ID为 " + categoryId + " 的内容元素");
    }
}

// 显示指定子类别
export function showSubcategory(subcategoryId, getParentIdCallback) {
    console.log("显示子类别:", subcategoryId);

    // 隐藏所有内容区域
    document.querySelectorAll('.content-section').forEach(section => {
        section.style.display = 'none';
    });

    document.querySelectorAll('.subcategory-section').forEach(section => {
        section.classList.remove('active');
    });

    // 找到子类别所属的父类别
    const parentId = getParentIdCallback ? getParentIdCallback(subcategoryId) : null;
    if (parentId) {
        // 显示父类别
        const parentElement = document.getElementById(parentId);
        if (parentElement) {
            parentElement.style.display = 'block';
        } else {
            console.error(`找不到父类别元素: ${parentId}`);
        }
    }

    // 显示目标子类别
    const subcategoryElement = document.getElementById(subcategoryId);
    if (subcategoryElement) {
        subcategoryElement.classList.add('active');
        console.log(`已激活子类别: ${subcategoryId}`);
    } else {
        console.warn("找不到ID为 " + subcategoryId + " 的子类别元素");
    }
}

// 检查DOM结构
export function checkDOMStructure(getParentIdCallback) {
    console.log("检查DOM结构...");
    const contentSections = document.querySelectorAll('.content-section');
    console.log(`找到 ${contentSections.length} 个内容区域`);

    contentSections.forEach((section, index) => {
        console.log(`内容区域 #${index + 1} (${section.id}):`, section);
        console.log(`- 显示状态:`, section.style.display);
        console.log(`- 子元素数量:`, section.children.length);

        const subcategories = section.querySelectorAll('.subcategory-section');
        console.log(`- 子类别数量:`, subcategories.length);

        subcategories.forEach((sub, subIndex) => {
            console.log(`  - 子类别 #${subIndex + 1} (${sub.id}):`, sub);
            console.log(`    - 激活状态:`, sub.classList.contains('active'));

            const items = sub.querySelectorAll('.item-box');
            console.log(`    - 物品数量:`, items.length);
        });
    });

    // 检查激活的子类别
    const activeSubcategories = document.querySelectorAll('.subcategory-section.active');
    console.log(`找到 ${activeSubcategories.length} 个激活的子类别`);

    if (activeSubcategories.length === 0) {
        console.warn("没有激活的子类别，尝试激活第一个子类别");
        const firstSubcategory = document.querySelector('.subcategory-section');
        if (firstSubcategory) {
            firstSubcategory.classList.add('active');
            const parentId = getParentIdCallback ? getParentIdCallback(firstSubcategory.id) : null;
            if (parentId) {
                const parentElement = document.getElementById(parentId);
                if (parentElement) {
                    parentElement.style.display = 'block';
                    console.log(`已激活子类别 ${firstSubcategory.id} 和父类别 ${parentId}`);
                }
            }
        }
    }

    // 检查CSS样式是否正确应用
    console.log("检查CSS样式:");
    const styles = {
        '.content-section': document.querySelector('.content-section') ?
            getComputedStyle(document.querySelector('.content-section')) : null,
        '.subcategory-section': document.querySelector('.subcategory-section') ?
            getComputedStyle(document.querySelector('.subcategory-section')) : null,
        '.subcategory-section.active': document.querySelector('.subcategory-section.active') ?
            getComputedStyle(document.querySelector('.subcategory-section.active')) : null
    };

    if (styles['.content-section']) {
        console.log("- .content-section display:", styles['.content-section'].display);
    } else {
        console.warn("- 没有找到 .content-section 元素");
    }

    if (styles['.subcategory-section']) {
        console.log("- .subcategory-section display:", styles['.subcategory-section'].display);
    } else {
        console.warn("- 没有找到 .subcategory-section 元素");
    }

    if (styles['.subcategory-section.active']) {
        console.log("- .subcategory-section.active display:", styles['.subcategory-section.active'].display);
    } else {
        console.warn("- 没有找到 .subcategory-section.active 元素");
    }
}

// 为所有删除按钮添加点击事件
export function setupDeleteButtons(handleDeleteClickCallback) {
    console.log("执行setupDeleteButtons函数...");
    // 获取所有删除按钮
    document.querySelectorAll('.delete-btn').forEach(button => {
        // 移除现有事件监听器，防止重复绑定
        button.removeEventListener('click', handleDeleteClickCallback);

        // 添加新的事件监听器
        button.addEventListener('click', handleDeleteClickCallback);
    });
}

// 删除按钮点击处理函数
export function handleDeleteClick(e) {
    console.log("执行handleDeleteClick函数...");
    e.stopPropagation(); // 防止事件冒泡

    // 获取要删除的物品元素及其ID
    const itemBox = this.closest('.item-box');
    const itemTitle = itemBox.querySelector('.item-title').textContent;
    const itemId = itemBox.dataset.id;

    // 保存当前要删除的物品信息
    currentItemToDelete = {
        element: itemBox,
        id: itemId,
        name: itemTitle
    };

    // 显示确认对话框
    const dialog = document.getElementById('deleteConfirmDialog');
    const confirmMessage = dialog.querySelector('p');
    confirmMessage.textContent = `您确定要删除 "${itemTitle}" 吗？此操作无法撤销。`;

    dialog.style.display = 'flex';
    setTimeout(() => {
        dialog.classList.add('active');
    }, 10);
}

// 关闭确认对话框
export function closeConfirmDialog() {
    const confirmDialog = document.getElementById('deleteConfirmDialog');
    confirmDialog.classList.remove('active');
    setTimeout(() => {
        confirmDialog.style.display = 'none';
    }, 300);
}

// 确认删除物品
export function confirmDelete(onDeleteSuccess) {
    if (!currentItemToDelete) {
        closeConfirmDialog();
        return;
    }

    // 调用回调函数执行删除操作
    if (typeof onDeleteSuccess === 'function') {
        onDeleteSuccess(currentItemToDelete.id, currentItemToDelete.element, currentItemToDelete.name);
    }

    // 重置当前要删除的物品信息并关闭对话框
    currentItemToDelete = null;
    closeConfirmDialog();
}

// 取消删除物品
export function cancelDelete() {
    currentItemToDelete = null;
    closeConfirmDialog();
}

// 初始化移动端导航
export function initMobileNavigation() {
    const navToggle = document.querySelector('.nav-toggle');
    const sidebar = document.querySelector('.sidebar');

    // 默认在移动设备上折叠菜单并显示切换按钮
    if (window.innerWidth <= 767) {
        sidebar.classList.add('collapsed');
        if (navToggle) {
            navToggle.style.display = 'flex';
        }
    } else {
        // 在非移动设备上隐藏切换按钮
        if (navToggle) {
            navToggle.style.display = 'none';
        }
    }

    // 监听窗口大小变化
    window.addEventListener('resize', function () {
        if (window.innerWidth <= 767) {
            if (navToggle) navToggle.style.display = 'flex';
        } else {
            if (navToggle) navToggle.style.display = 'none';
            sidebar.classList.remove('collapsed');
        }
    });

    // 切换导航栏折叠状态
    if (navToggle) {
        navToggle.addEventListener('click', function () {
            sidebar.classList.toggle('collapsed');

            // 更新箭头图标
            const arrow = this.querySelector('.fa-chevron-down, .fa-chevron-up');
            if (arrow) {
                if (sidebar.classList.contains('collapsed')) {
                    arrow.classList.replace('fa-chevron-up', 'fa-chevron-down');
                } else {
                    arrow.classList.replace('fa-chevron-down', 'fa-chevron-up');
                }
            }
        });
    }
}

// 初始化导航菜单事件
export function initNavigation(showCategoryCallback, showSubcategoryCallback, onCategoryChange) {
    // 为所有导航链接添加点击事件
    document.querySelectorAll('.nav-menu a').forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();

            // 获取目标内容ID
            const targetId = this.getAttribute('data-target');

            // 更新活动链接样式
            document.querySelectorAll('.nav-menu a').forEach(a => {
                a.classList.remove('active');
            });
            this.classList.add('active');

            // 在移动设备上点击后折叠菜单
            if (window.innerWidth <= 767) {
                const sidebar = document.querySelector('.sidebar');
                const navToggle = document.querySelector('.nav-toggle');

                sidebar.classList.add('collapsed');
                if (navToggle && navToggle.querySelector('.fa-chevron-up')) {
                    navToggle.querySelector('.fa-chevron-up').classList.replace('fa-chevron-up', 'fa-chevron-down');
                }
            }

            // 显示对应内容
            if (targetId.includes('-')) {
                // 如果是子类别，只显示该子类别
                if (typeof showSubcategoryCallback === 'function') {
                    showSubcategoryCallback(targetId);
                }
            } else {
                // 如果是主类别，显示该类别下的第一个子类别
                if (typeof showCategoryCallback === 'function') {
                    showCategoryCallback(targetId);
                }
            }

            // 更新新建物品表单中的默认类别选择
            updateItemCategoryDefault(targetId);

            // 调用回调函数
            if (typeof onCategoryChange === 'function') {
                onCategoryChange(targetId);
            }
        });
    });

    // 默认激活第一个导航链接
    const firstSubcategoryLink = document.querySelector('.sub-menu a');
    if (firstSubcategoryLink) {
        firstSubcategoryLink.classList.add('active');
    }
}

// 更新新建物品表单中的默认类别选择
export function updateItemCategoryDefault(targetId) {
    const itemCategorySelect = document.getElementById('itemCategory');
    if (itemCategorySelect) {
        // 如果目标ID是子类别，直接选择它
        if (targetId.includes('-')) {
            itemCategorySelect.value = targetId;
        } else {
            // 如果是主类别，选择其第一个子类别
            const directories = window.directories || [];
            for (const category of directories) {
                if (category.id === targetId && category.children && category.children.length > 0) {
                    itemCategorySelect.value = category.children[0].id;
                    break;
                }
            }
        }
    }
}

// 初始化新建物品模态框
export function initNewItemModal(onItemAdd) {
    const newItemModal = document.getElementById('newItemModal');
    const newItemBtn = document.getElementById('newItemBtn');
    const closeButton = newItemModal.querySelector('.close-button');
    const cancelButton = newItemModal.querySelector('.cancel-button');
    const newItemForm = document.getElementById('newItemForm');

    // 打开模态框
    newItemBtn.addEventListener('click', function () {
        // 设置当前选中的类别
        const activeNavLink = document.querySelector('.nav-menu a.active');
        if (activeNavLink) {
            const targetId = activeNavLink.getAttribute('data-target');
            updateItemCategoryDefault(targetId);
        }

        newItemModal.style.display = 'block';
        setTimeout(() => {
            newItemModal.classList.add('active');
        }, 10);
    });

    // 关闭模态框
    function closeNewItemModal() {
        newItemModal.classList.remove('active');
        setTimeout(() => {
            newItemModal.style.display = 'none';
            newItemForm.reset();
        }, 300);
    }

    closeButton.addEventListener('click', closeNewItemModal);
    cancelButton.addEventListener('click', closeNewItemModal);
    window.addEventListener('click', function (event) {
        if (event.target === newItemModal) {
            closeNewItemModal();
        }
    });

    // 处理位置选择器变化
    function handleLocationChange() {
        const locationSelect = document.getElementById('itemLocationSelect');
        const locationInput = document.getElementById('itemLocation');

        if (locationSelect.value === 'custom') {
            // 如果选择自定义，显示输入框
            locationInput.style.display = 'block';
            locationInput.value = '';
            locationInput.focus();
        } else {
            // 如果选择预定义选项，隐藏输入框并设置其值
            locationInput.style.display = 'none';
            locationInput.value = locationSelect.value;
        }
    }

    // 初始化位置选择器
    if (document.getElementById('itemLocationSelect')) {
        document.getElementById('itemLocationSelect').addEventListener('change', handleLocationChange);
        handleLocationChange();
    }

    // 提交新建产品表单
    newItemForm.addEventListener('submit', function (e) {
        e.preventDefault();

        // 获取表单数据
        const imageUrl = document.getElementById('itemImage').value || 'images/Basic/story-2.png';
        const name = document.getElementById('itemName').value;
        const quantity = document.getElementById('itemQuantity').value;
        const location = document.getElementById('itemLocation').value || '未指定';
        const category = document.getElementById('itemCategory').value;

        if (!category) {
            alert('请选择物料类别');
            return;
        }

        // 调用回调函数添加新物品
        if (typeof onItemAdd === 'function') {
            const success = onItemAdd(category, {
                imageUrl,
                name,
                quantity,
                location
            });

            if (success) {
                // 关闭模态框并重置表单
                closeNewItemModal();

                // 显示成功消息
                alert('新物品添加成功！');
            }
        }
    });
} 