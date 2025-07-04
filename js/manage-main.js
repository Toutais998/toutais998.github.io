/* 
=====================================================================
* 文件名: manage-main.js
* 版本: V3.1
* 创建日期: 2025-07-05
* 最后修改: 2025-07-11
* 
* 功能简介:
* - Yang Lab 设备管理页面的核心交互逻辑 (V3.1 - 嵌套目录修正版)。
* - 正确解析和渲染来自 'materials/data' 的嵌套目录结构。
* - 侧边栏和下拉菜单现在支持两级目录显示。
* - "管理导航"模态框现在支持对嵌套目录的完整增删改查和排序。
=====================================================================
*/

import {
    getDirectoryStructure,
    getAllItems,
    saveDirectoryStructure,
    addItem,
    updateItem,
    deleteItem
} from './manage-data-manager.js';
import { setupModal, setupSidebarToggle, setupSortable } from './ui-controller.js';

// --- 全局变量 ---
let allItems = [];
let directoryStructure = [];
let currentFilter = 'all'; // 当前激活的筛选分类名
let currentEditItemId = null; // 当前正在编辑的物品ID

// --- DOMContentLoaded 事件监听 ---
document.addEventListener('DOMContentLoaded', () => {

    // --- 1. 获取核心DOM元素 ---
    const sidebarNav = document.getElementById('sidebar-nav');
    const mainContent = document.getElementById('main-content');
    const loader = document.getElementById('loader');

    // "添加/编辑物品" 模态框相关元素
    const itemModal = document.getElementById('add-item-modal');
    const itemModalTitle = itemModal.querySelector('h2');
    const addItemFab = document.getElementById('add-item-fab');
    const itemForm = document.getElementById('add-item-form');

    // "管理导航" 模态框相关元素
    const manageNavBtn = document.getElementById('manage-nav-btn');
    const manageCategoriesModal = document.getElementById('manage-categories-modal');
    const saveCategoriesBtn = document.getElementById('save-categories-btn');
    const addParentCategoryBtn = document.getElementById('add-parent-category-btn');

    // --- 2. UI辅助函数 ---
    function showLoader(text = '加载中...') {
        if (loader) {
            loader.querySelector('p').textContent = text;
            loader.style.display = 'flex';
        }
    }

    function hideLoader() {
        if (loader) loader.style.display = 'none';
    }

    /**
     * 更新"添加/编辑物品"模态框中的分类下拉菜单
     * @param {string} [selectedValue] - (可选) 需要预先选中的分类名称
     */
    function updateCategoryDropdown(selectedValue) {
        const categorySelect = document.getElementById('item-category-select');
        if (!categorySelect) return;

        const originalValue = selectedValue || categorySelect.value;
        categorySelect.innerHTML = ''; // 清空

        directoryStructure.forEach(parentCategory => {
            const optgroup = document.createElement('optgroup');
            optgroup.label = parentCategory.name || '未命名主目录';

            if (parentCategory.children && parentCategory.children.length > 0) {
                parentCategory.children.forEach(subCategory => {
                    const option = document.createElement('option');
                    option.value = subCategory.name;
                    option.textContent = subCategory.name;
                    optgroup.appendChild(option);
                });
            }
            categorySelect.appendChild(optgroup);
        });

        if (originalValue) {
            categorySelect.value = originalValue;
        }
    }

    // --- 3. 核心渲染函数 ---

    /**
     * 根据全局的 directoryStructure 渲染侧边导航栏
     */
    function renderSidebar() {
        sidebarNav.innerHTML = '';
        const navList = document.createElement('ul');
        navList.className = 'nav-list';

        // "显示全部"按钮
        const showAllLi = document.createElement('li');
        showAllLi.innerHTML = `<a href="#" data-target="all" class="active"><i class="fas fa-border-all"></i> <span>显示全部</span></a>`;
        navList.appendChild(showAllLi);

        // 根据目录结构创建分类链接
        directoryStructure.forEach(parentCategory => {
            const parentLi = document.createElement('li');
            parentLi.className = 'nav-category';

            parentLi.innerHTML = `
                <div class="category-header">
                    <span>${parentCategory.name || '未命名主目录'}</span>
                </div>
            `;

            const subList = document.createElement('ul');
            subList.className = 'nav-subcategory-list';

            if (parentCategory.children && parentCategory.children.length > 0) {
                parentCategory.children.forEach(subCategory => {
                    const subLi = document.createElement('li');
                    subLi.innerHTML = `<a href="#" data-target="${subCategory.name}">${subCategory.name}</a>`;
                    subList.appendChild(subLi);
                });
            }

            parentLi.appendChild(subList);
            navList.appendChild(parentLi);
        });

        sidebarNav.appendChild(navList);
    }

    /**
     * 根据筛选条件渲染主内容区的物品卡片
     * @param {string} [filter='all'] - 筛选条件，'all' 或某个分类的名称
     */
    function renderMainContent(filter = 'all') {
        mainContent.innerHTML = '';
        const grid = document.createElement('div');
        grid.className = 'item-card-grid';

        // 根据 filter 筛选物品
        const itemsToRender = filter === 'all'
            ? allItems
            : allItems.filter(item => item.category === filter);

        if (itemsToRender.length === 0) {
            mainContent.innerHTML = `<p class="empty-message">该分类下暂无物品。</p>`;
            return;
        }

        // 按物品名称排序
        itemsToRender.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'zh-CN'));

        itemsToRender.forEach(item => {
            const card = createItemCard(item);
            grid.appendChild(card);
        });

        mainContent.appendChild(grid);
    }

    /**
     * 为单个物品数据创建DOM卡片元素
     * @param {object} item - 物品数据对象，必须包含 id
     * @returns {HTMLElement}
     */
    function createItemCard(item) {
        const card = document.createElement('div');
        card.className = 'item-card';
        card.dataset.itemId = item.id;

        const imageUrl = item.imageUrl || 'images/Basic/kitty.jpg';

        card.innerHTML = `
            <div class="item-image-container">
                <img src="${imageUrl}" alt="${item.name || '无名称'}" class="item-image" onerror="this.onerror=null; this.src='images/Basic/kitty.jpg';">
                <div class="item-actions">
                    <button class="btn-edit" title="编辑"><i class="fas fa-pencil-alt"></i></button>
                    <button class="btn-delete" title="删除"><i class="fas fa-trash"></i></button>
                </div>
            </div>
            <div class="item-info">
                <h3 class="item-name">${item.name || '无名称'}</h3>
            </div>
            <div class="item-details">
                <p class="item-location">位置: ${item.location || '未指定'}</p>
                <p class="item-quantity">数量: ${item.quantity || 1}</p>
            </div>
        `;

        // 绑定删除按钮事件
        card.querySelector('.btn-delete').addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            handleDeleteItem(item.id, item.name);
        });

        // 绑定编辑按钮事件
        card.querySelector('.btn-edit').addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            handleEditItem(item);
        });

        return card;
    }

    /**
     * 刷新整个UI界面
     */
    function refreshUI() {
        renderSidebar();
        renderMainContent(currentFilter);
        updateCategoryDropdown();
        // 确保侧边栏的点击事件在重新渲染后仍然有效
        addSidebarEventListeners();
        // 更新激活的分类状态
        setActiveCategory(currentFilter);
    }

    function setActiveCategory(filterName) {
        document.querySelectorAll('.sidebar-nav a').forEach(a => a.classList.remove('active'));
        const activeLink = document.querySelector(`.sidebar-nav a[data-target="${filterName}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }
    }


    // --- 4. 事件处理函数 ---
    function handleNavClick(e) {
        let targetLink = e.target.closest('a');
        if (targetLink && targetLink.dataset.target) {
            e.preventDefault();
            currentFilter = targetLink.dataset.target;
            renderMainContent(currentFilter);
            setActiveCategory(currentFilter);
        }
    }

    function addSidebarEventListeners() {
        // 移除旧的监听器以防重复绑定
        sidebarNav.removeEventListener('click', handleNavClick);
        // 添加新的监听器
        sidebarNav.addEventListener('click', handleNavClick);
    }

    /**
     * 处理添加或编辑物品的表单提交
     * @param {Event} e - 表单提交事件
     */
    async function handleItemFormSubmit(e) {
        e.preventDefault();

        const formData = {
            name: itemForm.querySelector('#item-name').value,
            quantity: parseInt(itemForm.querySelector('#item-quantity').value, 10),
            category: itemForm.querySelector('#item-category-select').value,
            location: itemForm.querySelector('#item-location-select').value === 'other'
                ? itemForm.querySelector('#item-location-other').value
                : itemForm.querySelector('#item-location-select').value,
            // image handling is not implemented in this version
        };

        showLoader(currentEditItemId ? '正在更新...' : '正在添加...');

        try {
            if (currentEditItemId) {
                // --- 更新逻辑 ---
                await updateItem(currentEditItemId, formData);
                // 更新本地数据
                const index = allItems.findIndex(item => item.id === currentEditItemId);
                if (index !== -1) {
                    allItems[index] = { ...allItems[index], ...formData };
                }
            } else {
                // --- 添加逻辑 ---
                const newItemId = await addItem(formData);
                // 将新物品添加到本地数据，以便刷新时能立刻看到
                allItems.push({ id: newItemId, ...formData });
            }

            itemModal.style.display = 'none';
            refreshUI(); // 刷新整个UI

        } catch (error) {
            console.error("保存物品失败:", error);
            alert("操作失败: " + error.message);
        } finally {
            hideLoader();
        }
    }

    /**
     * 处理删除物品的逻辑
     * @param {string} itemId - 要删除的物品ID
     * @param {string} itemName - 要删除的物品名称，用于确认提示
     */
    async function handleDeleteItem(itemId, itemName) {
        if (!confirm(`确定要删除 "${itemName}" 吗? 此操作无法撤销。`)) return;

        showLoader('正在删除...');
        try {
            await deleteItem(itemId);
            // 从本地数据中移除
            allItems = allItems.filter(item => item.id !== itemId);
            refreshUI(); // 刷新UI
        } catch (error) {
            console.error("删除失败:", error);
            alert("删除失败: " + error.message);
        } finally {
            hideLoader();
        }
    }

    /**
     * 处理编辑物品的逻辑
     * @param {object} itemToEdit - 要编辑的完整物品对象
     */
    function handleEditItem(itemToEdit) {
        currentEditItemId = itemToEdit.id;
        itemModalTitle.textContent = '编辑物品';

        // 填充表单
        itemForm.querySelector('#item-name').value = itemToEdit.name || '';
        itemForm.querySelector('#item-quantity').value = itemToEdit.quantity || 1;
        updateCategoryDropdown(itemToEdit.category);

        const locationSelect = itemForm.querySelector('#item-location-select');
        const locationOtherGroup = itemForm.querySelector('#item-location-other-group');
        const locationOtherInput = itemForm.querySelector('#item-location-other');

        const isStandardLocation = Array.from(locationSelect.options).some(opt => opt.value === itemToEdit.location);
        if (isStandardLocation) {
            locationSelect.value = itemToEdit.location;
            locationOtherGroup.style.display = 'none';
        } else {
            locationSelect.value = 'other';
            locationOtherGroup.style.display = 'block';
            locationOtherInput.value = itemToEdit.location || '';
        }

        itemModal.style.display = 'flex';
    }

    /**
     * 当点击"添加新物品"按钮时，准备模态框
     */
    function prepareAddItemModal() {
        currentEditItemId = null; // 清除编辑状态
        itemModalTitle.textContent = '添加新物品';
        itemForm.reset(); // 重置表单
        document.getElementById('item-location-other-group').style.display = 'none';
        if (directoryStructure.length > 0 && directoryStructure[0].children.length > 0) {
            updateCategoryDropdown(directoryStructure[0].children[0].name);
        }
    }

    /**
     * 渲染"管理导航目录"模态框中的编辑器
     */
    function renderCategoryEditor() {
        const editor = document.getElementById('category-editor');
        if (!editor) return;
        editor.innerHTML = '';

        directoryStructure.forEach((parentCategory) => {
            editor.appendChild(createParentCategoryEditorElement(parentCategory));
        });

        // 启用父类别列表的拖拽排序
        setupSortable(editor, '.parent-drag-handle');
    }

    function createParentCategoryEditorElement(parentCategory) {
        const parentElement = document.createElement('div');
        parentElement.className = 'category-item parent-category';
        parentElement.dataset.id = parentCategory.id || '';

        parentElement.innerHTML = `
            <div class="category-item-header">
                <span class="drag-handle parent-drag-handle"><i class="fas fa-grip-vertical"></i></span>
                <input type="text" value="${parentCategory.name || ''}" class="category-name-input parent-name-input" placeholder="主目录名称">
                <button class="btn-add-subcategory" title="添加子目录"><i class="fas fa-plus"></i></button>
                <button class="btn-delete-parent" title="删除主目录"><i class="fas fa-trash"></i></button>
            </div>
        `;
        const subCategoryList = document.createElement('div');
        subCategoryList.className = 'subcategory-list';

        if (parentCategory.children && parentCategory.children.length > 0) {
            parentCategory.children.forEach((subCategory) => {
                subCategoryList.appendChild(createSubCategoryEditorElement(subCategory));
            });
        } else {
            // 如果没有子类别，添加提示文本
            const emptyText = document.createElement('div');
            emptyText.className = 'subcategory-empty';
            emptyText.textContent = '拖动子类别到这里...';
            emptyText.style.color = '#a0aec0';
            emptyText.style.textAlign = 'center';
            emptyText.style.padding = '10px';
            emptyText.style.fontStyle = 'italic';
            subCategoryList.appendChild(emptyText);
        }

        parentElement.appendChild(subCategoryList);
        setupSortable(subCategoryList, '.sub-drag-handle', {
            group: 'subcategories',
            animation: 150
        });

        // 添加子类别按钮事件
        parentElement.querySelector('.btn-add-subcategory').addEventListener('click', () => {
            const emptyText = subCategoryList.querySelector('.subcategory-empty');
            if (emptyText) {
                emptyText.remove();
            }

            const newSubName = prompt("请输入子目录名称：") || "新子目录";
            const newSubCategory = { name: newSubName };
            const newSubElement = createSubCategoryEditorElement(newSubCategory);

            // 添加动画效果
            newSubElement.style.opacity = '0';
            newSubElement.style.transform = 'translateY(10px)';

            subCategoryList.appendChild(newSubElement);

            // 触发重绘并应用动画
            setTimeout(() => {
                newSubElement.style.transition = 'all 0.3s ease';
                newSubElement.style.opacity = '1';
                newSubElement.style.transform = 'translateY(0)';
            }, 10);
        });

        // 删除父类别按钮事件
        parentElement.querySelector('.btn-delete-parent').addEventListener('click', () => {
            if (confirm(`确定要删除主目录 "${parentCategory.name}" 及其所有子目录吗？`)) {
                // 添加删除动画
                parentElement.style.overflow = 'hidden';
                parentElement.style.transition = 'all 0.4s ease';
                parentElement.style.opacity = '0';
                parentElement.style.maxHeight = parentElement.offsetHeight + 'px';

                setTimeout(() => {
                    parentElement.style.maxHeight = '0px';
                    parentElement.style.margin = '0';
                    parentElement.style.padding = '0';

                    setTimeout(() => {
                        parentElement.remove();
                    }, 300);
                }, 50);
            }
        });

        return parentElement;
    }

    function createSubCategoryEditorElement(subCategory) {
        const subElement = document.createElement('div');
        subElement.className = 'category-item sub-category';
        subElement.dataset.id = subCategory.id || '';
        subElement.innerHTML = `
            <span class="drag-handle sub-drag-handle"><i class="fas fa-grip-vertical"></i></span>
            <input type="text" value="${subCategory.name || ''}" class="category-name-input sub-name-input" placeholder="子目录名称">
            <button class="btn-delete-sub" title="删除子目录"><i class="fas fa-trash"></i></button>
        `;

        // 美化输入框
        const input = subElement.querySelector('input');
        input.addEventListener('focus', () => {
            subElement.style.boxShadow = '0 0 0 2px rgba(52, 152, 219, 0.3)';
        });

        input.addEventListener('blur', () => {
            subElement.style.boxShadow = '';
        });

        // 删除子类别按钮事件
        subElement.querySelector('.btn-delete-sub').addEventListener('click', () => {
            if (confirm(`确定要删除子目录 "${subCategory.name || '未命名'}" 吗？`)) {
                // 添加删除动画
                subElement.style.overflow = 'hidden';
                subElement.style.transition = 'all 0.3s ease';
                subElement.style.opacity = '0';
                subElement.style.transform = 'translateX(20px)';

                setTimeout(() => {
                    subElement.remove();
                }, 300);
            }
        });

        return subElement;
    }

    /**
     * 处理保存导航目录的更改
     */
    async function handleSaveCategories() {
        showLoader('正在保存目录...');
        const editor = document.getElementById('category-editor');

        const newDirectoryStructure = Array.from(editor.querySelectorAll('.parent-category')).map(parentElement => {
            const parentId = parentElement.dataset.id || `parent_${Date.now()}${Math.random().toString(36).substr(2, 5)}`;
            const parentName = parentElement.querySelector('.parent-name-input').value.trim() || '未命名主目录';

            const children = Array.from(parentElement.querySelectorAll('.sub-category')).map(subElement => {
                const subId = subElement.dataset.id || `sub_${Date.now()}${Math.random().toString(36).substr(2, 5)}`;
                const subName = subElement.querySelector('.sub-name-input').value.trim() || '未命名子目录';
                return { id: subId, name: subName };
            });

            return { id: parentId, name: parentName, children: children };
        });

        try {
            await saveDirectoryStructure(newDirectoryStructure);
            directoryStructure = newDirectoryStructure;
            manageCategoriesModal.style.display = 'none';
            refreshUI();

            // 显示成功提示
            alert('导航目录已成功保存！');
        } catch (error) {
            console.error("保存目录失败:", error);
            alert("保存目录失败: " + error.message);
        } finally {
            hideLoader();
        }
    }

    /**
     * 在目录编辑器中添加一个新的主目录输入框
     */
    function handleAddParentCategory() {
        const editor = document.getElementById('category-editor');
        const newName = prompt("请输入主目录名称：") || "新主目录";

        const newParent = createParentCategoryEditorElement({
            name: newName,
            children: []
        });

        // 添加动画效果
        newParent.style.opacity = '0';
        newParent.style.transform = 'translateY(20px)';
        editor.appendChild(newParent);

        // 触发重绘并应用动画
        setTimeout(() => {
            newParent.style.transition = 'all 0.4s ease';
            newParent.style.opacity = '1';
            newParent.style.transform = 'translateY(0)';
        }, 10);

        newParent.querySelector('input').focus();
    }


    // --- 5. 初始化流程 ---
    async function init() {
        showLoader('正在初始化...');
        setupSidebarToggle();

        // 设置模态框的打开和关闭逻辑
        setupModal(itemModal, '#add-item-modal .close-button', addItemFab, prepareAddItemModal);
        setupModal(manageCategoriesModal, '#manage-categories-modal .close-button', manageNavBtn, renderCategoryEditor);

        try {
            // 并行加载目录和物品数据
            [directoryStructure, allItems] = await Promise.all([
                getDirectoryStructure(),
                getAllItems()
            ]);

            refreshUI();

        } catch (error) {
            console.error("初始化失败:", error);
            mainContent.innerHTML = `<p class="error-message">加载数据失败: ${error.message}</p>`;
        } finally {
            hideLoader();
        }

        // 绑定核心事件监听
        itemForm.addEventListener('submit', handleItemFormSubmit);
        saveCategoriesBtn.addEventListener('click', handleSaveCategories);
        addParentCategoryBtn.addEventListener('click', handleAddParentCategory);

        // "其它位置"输入的显示/隐藏逻辑
        const locationSelect = document.getElementById('item-location-select');
        const locationOtherGroup = document.getElementById('item-location-other-group');
        if (locationSelect) {
            locationSelect.addEventListener('change', (e) => {
                locationOtherGroup.style.display = e.target.value === 'other' ? 'block' : 'none';
            });
        }
    }

    // --- 6. 执行初始化 ---
    init();
}); 