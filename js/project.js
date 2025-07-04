/* 
=====================================================================
* 文件名: project.js
* 版本: V1.0
* 创建日期: 2025-07-04
* 最后修改: 2025-07-05
* 
* 功能简介:
* - Yang Lab 项目管理页面的核心交互逻辑脚本。
* - 负责从 Firebase (通过 project-data-manager.js) 加载、显示和保存项目数据。
* - 动态渲染侧边导航栏和主内容区的项目卡片。
* - 处理用户交互，包括侧边栏筛选、添加新项目、管理项目结构等。
* - 管理"添加/管理项目"模态框的显示、隐藏和表单提交逻辑。
=====================================================================
*/

import { checkAndSeedInitialProjects, getProjects, saveProjects } from './project-data-manager.js';
import { setupModal, setupSidebarToggle, setupSortable } from './ui-controller.js';

// 全局变量
let projectData = [];
let currentFilter = 'all'; // 新增：用于跟踪当前筛选器

// --- DOMContentLoaded 事件监听 ---
// 确保在整个DOM加载完毕后执行初始化代码
document.addEventListener('DOMContentLoaded', () => {

    // --- 1. 获取核心DOM元素 ---
    const sidebarNav = document.getElementById('sidebar-nav');
    const mainContent = document.getElementById('main-content');
    const loader = document.getElementById('loader');

    // "添加项目"相关元素
    const addItemModal = document.getElementById('add-item-modal');
    const addItemFab = document.getElementById('add-item-fab');
    const addItemForm = document.getElementById('add-item-form');
    const itemModalTitle = addItemModal.querySelector('h2'); // 新增：获取模态框标题元素
    let currentEditInfo = null; // 新增：用于跟踪正在编辑的项目信息

    // "管理项目"相关元素
    const manageProjectsBtn = document.getElementById('manage-projects-btn');
    const manageProjectsModal = document.getElementById('manage-projects-modal');
    const saveProjectsBtn = document.getElementById('save-projects-btn');
    const addParentProjectBtn = document.getElementById('add-parent-project-btn');


    // --- 2. UI辅助函数 ---

    /**
     * 显示加载动画
     * @param {string} text - 加载动画下方显示的文本
     */
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
     * 更新"添加新项目"模态框中的分类下拉菜单
     * @param {string} [preselectedCategory] - (可选) 需要预先选中的分类名称
     */
    function updateCategoryDropdown(preselectedCategory) {
        const categorySelect = document.getElementById('item-category-select');
        if (!categorySelect) return;
        categorySelect.innerHTML = ''; // Clear existing options
        projectData.forEach(category => {
            const group = document.createElement('optgroup');
            group.label = category.category;
            // 修正：确保 subProjects 存在
            if (category.subProjects) {
                category.subProjects.forEach(subProject => {
                    const option = document.createElement('option');
                    // 修正：值应该是 subProject.id，显示文本是 subProject.name
                    option.value = subProject.id;
                    option.textContent = subProject.name;
                    group.appendChild(option);
                });
            }
            categorySelect.appendChild(group);
        });

        // 预选定特定分类（如果提供）
        if (preselectedCategory && Array.from(categorySelect.options).some(opt => opt.value === preselectedCategory)) {
            categorySelect.value = preselectedCategory;
        }
    }


    // --- 3. 核心渲染函数 ---

    /**
     * 根据全局的 projectData 渲染侧边导航栏
     */
    function renderSidebar() {
        sidebarNav.innerHTML = '';
        const navList = document.createElement('ul');
        navList.className = 'nav-list';

        const showAllLi = document.createElement('li');
        showAllLi.innerHTML = `<a href="#" data-target="all" class="active"><i class="fas fa-border-all"></i> <span>显示全部</span></a>`;
        navList.appendChild(showAllLi);

        projectData.forEach(categoryData => {
            const categoryItem = document.createElement('li');
            categoryItem.innerHTML = `
                <div class="category-header">
                    <span>${categoryData.category}</span>
                </div>
            `;
            const subcategoryList = document.createElement('ul');
            subcategoryList.className = 'nav-subcategory-list';

            if (categoryData.subProjects) {
                categoryData.subProjects.forEach(subProject => {
                    const subcategoryItem = document.createElement('li');
                    const link = document.createElement('a');
                    link.href = `#`;
                    link.textContent = subProject.name;
                    link.dataset.target = subProject.id;
                    subcategoryItem.appendChild(link);
                    subcategoryList.appendChild(subcategoryItem);
                });
            }

            categoryItem.appendChild(subcategoryList);
            navList.appendChild(categoryItem);
        });

        sidebarNav.appendChild(navList);
    }

    /**
     * 根据筛选条件渲染主内容区域的项目卡片
     * @param {string} [filter='all'] - 筛选条件, 'all' 或某个子项目的ID
     */
    function renderMainContent(filter = 'all') {
        mainContent.innerHTML = '';
        const grid = document.createElement('div');
        grid.className = 'item-card-grid';

        let projectsToRender = [];
        if (filter === 'all') {
            projectData.forEach(cat => {
                if (cat.subProjects) {
                    // 修改：在"显示全部"时不再需要展示父分类标题
                    cat.subProjects.forEach(sub => projectsToRender.push({ ...sub, parentCategory: cat.category, parentId: cat.id, showTitle: false }))
                }
            });
        } else {
            for (const category of projectData) {
                if (category.subProjects) {
                    const foundSub = category.subProjects.find(sub => sub.id === filter);
                    if (foundSub) {
                        // showTitle: false 用于在筛选时不显示父分类标题
                        projectsToRender.push({ ...foundSub, parentCategory: category.category, parentId: category.id, showTitle: false });
                        break; // 找到后即可退出循环
                    }
                }
            }
        }

        if (projectsToRender.length === 0) {
            mainContent.innerHTML = `<p class="empty-message">该分类下暂无项目。</p>`;
            return;
        }

        // 按子项目名称排序
        projectsToRender.sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'));

        // 只有在需要显示分组标题时才按父分类对项目进行分组
        const projectsByParent = projectsToRender.reduce((acc, proj) => {
            // 如果不显示标题，所有项目都归为一个组
            const parentKey = proj.showTitle ? proj.parentCategory : 'single_group';
            if (!acc[parentKey]) {
                acc[parentKey] = [];
            }
            acc[parentKey].push(proj);
            return acc;
        }, {});


        Object.keys(projectsByParent).forEach(parentCatKey => {
            // 只有在"显示全部"模式下，且分组不是'single_group'时，才显示标题
            if (parentCatKey !== 'single_group') {
                const title = document.createElement('h2');
                title.className = 'category-title';
                title.textContent = parentCatKey;
                grid.appendChild(title);
            }

            projectsByParent[parentCatKey].forEach(subProject => {
                if (subProject.items && subProject.items.length > 0) {
                    subProject.items.forEach(item => {
                        const card = document.createElement('div'); // 不再是 <a> 标签
                        card.className = 'item-card';
                        // 将所有需要的信息存储在 dataset 中
                        card.dataset.itemName = item;
                        card.dataset.subprojectId = subProject.id;
                        card.dataset.parentId = subProject.parentId;

                        card.innerHTML = `
                            <div class="item-image-container">
                                <img src="images/Basic/001.jpg" alt="${item}" class="item-image">
                                <div class="item-actions">
                                    <button class="btn-edit" title="编辑"><i class="fas fa-pencil-alt"></i></button>
                                    <button class="btn-delete" title="删除"><i class="fas fa-trash"></i></button>
                                </div>
                            </div>
                            <div class="item-info">
                                <h3 class="item-name">${item}</h3>
                                <p class="item-category">${subProject.name}</p>
                            </div>
                        `;
                        // 修正：为编辑和删除按钮分别绑定事件
                        card.querySelector('.btn-edit').addEventListener('click', (e) => {
                            e.stopPropagation();
                            handleEditItem(item, subProject.id, subProject.parentId);
                        });
                        card.querySelector('.btn-delete').addEventListener('click', (e) => {
                            e.stopPropagation();
                            handleDeleteItem(item, subProject.id, subProject.parentId);
                        });
                        grid.appendChild(card);
                    });
                } else {
                    // 如果是筛选模式下，且该子项目没有具体条目，则显示提示
                    if (!subProject.showTitle) {
                        const emptyCard = document.createElement('div');
                        emptyCard.className = 'item-card-empty';
                        emptyCard.innerHTML = `<p class="empty-message">暂无具体项目</p>`;
                        grid.appendChild(emptyCard);
                    }
                }
            });
        });

        mainContent.appendChild(grid);
    }

    /**
     * 刷新整个UI界面
     */
    function refreshUI() {
        renderSidebar();
        renderMainContent(currentFilter);
        // 确保侧边栏的点击事件在重新渲染后仍然有效
        addSidebarEventListeners();
        setActiveCategory(currentFilter);
        updateCategoryDropdown();
    }

    function setActiveCategory(filterId) {
        document.querySelectorAll('.sidebar-nav a').forEach(a => a.classList.remove('active'));
        const activeLink = document.querySelector(`.sidebar-nav a[data-target="${filterId}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }
    }


    // --- 4. 事件处理函数 ---

    /**
     * 处理侧边栏导航链接的点击事件
     * @param {Event} e - 点击事件对象
     */
    function handleNavClick(e) {
        let targetLink = e.target.closest('a');
        if (targetLink && targetLink.dataset.target) {
            e.preventDefault();
            currentFilter = targetLink.dataset.target; // 更新当前筛选器
            renderMainContent(currentFilter);
            setActiveCategory(currentFilter);
            // 关闭移动端侧边栏 (如果处于打开状态)
            const sidebar = document.getElementById('sidebar');
            const overlay = document.getElementById('sidebar-overlay');
            if (sidebar.classList.contains('active')) {
                sidebar.classList.remove('active');
                overlay.classList.remove('active');
            }
        }
    }

    /**
     * "添加新项目"或"编辑项目"表单的提交处理逻辑
     * @param {Event} e - 提交事件对象
     */
    async function handleAddItemSubmit(e) {
        e.preventDefault();

        const itemName = document.getElementById('item-name').value;
        const subcategoryId = document.getElementById('item-category-select').value;

        if (!itemName || !subcategoryId) {
            alert("请填写所有必填项！");
            return;
        }

        showLoader(currentEditInfo ? '正在更新...' : '正在添加...');

        try {
            let parentCategory = null;
            let subProject = null;

            // 找到对应的父分类和子项目
            for (const pCat of projectData) {
                const sProj = pCat.subProjects.find(sp => sp.id === subcategoryId);
                if (sProj) {
                    parentCategory = pCat;
                    subProject = sProj;
                    break;
                }
            }

            if (!parentCategory || !subProject) {
                throw new Error("找不到对应的项目分类。");
            }

            if (currentEditInfo) {
                // --- 更新逻辑 ---
                // 1. 从旧位置删除
                const oldParentCat = projectData.find(p => p.id === currentEditInfo.parentId);
                const oldSubProj = oldParentCat.subProjects.find(s => s.id === currentEditInfo.subprojectId);
                oldSubProj.items = oldSubProj.items.filter(i => i !== currentEditInfo.itemName);

                // 2. 在新位置添加
                if (!subProject.items) subProject.items = [];
                subProject.items.push(itemName);

            } else {
                // --- 添加逻辑 ---
                if (!subProject.items) subProject.items = [];
                subProject.items.push(itemName);
            }

            await saveProjects(projectData);
            refreshUI();
            addItemModal.style.display = 'none';

        } catch (error) {
            console.error("操作失败:", error);
            alert("操作失败: " + error.message);
        } finally {
            hideLoader();
        }
    }

    /**
     * @description 处理删除项目的逻辑
     * @param {string} itemName - 要删除的具体项目名称
     * @param {string} subprojectId - 该项目所属的子项目ID
     * @param {string} parentId - 该项目所属的父分类ID
     */
    async function handleDeleteItem(itemName, subprojectId, parentId) {
        if (!confirm(`确定要删除项目 "${itemName}" 吗？此操作无法撤销。`)) return;

        showLoader('正在删除...');
        try {
            const parentCategory = projectData.find(p => p.id === parentId);
            if (parentCategory) {
                const subProject = parentCategory.subProjects.find(s => s.id === subprojectId);
                if (subProject && subProject.items) {
                    // 从本地数据中过滤掉要删除的项
                    subProject.items = subProject.items.filter(item => item !== itemName);
                    // 保存整个更新后的项目数据
                    await saveProjects(projectData);
                    // 刷新UI
                    refreshUI();
                }
            }
        } catch (error) {
            console.error("删除失败:", error);
            alert("删除失败: " + error.message);
        } finally {
            hideLoader();
        }
    }

    /**
     * @description 处理编辑项目的逻辑
     * @param {string} itemName - 要编辑的项目名称
     * @param {string} subprojectId - 该项目所属的子项目ID
     * @param {string} parentId - 该项目所属的父分类ID
     */
    function handleEditItem(itemName, subprojectId, parentId) {
        // 保存当前编辑项的原始信息
        currentEditInfo = { itemName, subprojectId, parentId };

        itemModalTitle.textContent = '编辑项目';

        // 填充表单
        document.getElementById('item-name').value = itemName;
        updateCategoryDropdown(subprojectId);

        // 显示模态框
        addItemModal.style.display = 'flex';
    }

    /**
     * @description 当点击"添加新项目"按钮时，准备模态框
     */
    function setupAddItemModal() {
        // 清除编辑状态
        currentEditInfo = null;
        itemModalTitle.textContent = '添加新项目';
        addItemForm.reset();

        // 默认选中当前导航栏位置的分类
        if (currentFilter && currentFilter !== 'all') {
            updateCategoryDropdown(currentFilter);
        } else if (projectData.length > 0 && projectData[0].subProjects.length > 0) {
            updateCategoryDropdown(projectData[0].subProjects[0].id);
        } else {
            updateCategoryDropdown();
        }
    }

    /**
     * @description 打开并准备"添加项目"模态框
     */
    function openAddItemModal() {
        setupAddItemModal(); // 准备内容
        if (addItemModal) addItemModal.style.display = 'flex'; // 显示模态框
    }


    /**
     * @description 显示"管理项目"模态框，并渲染编辑器内容
     */
    function renderProjectEditor() {
        const editor = document.getElementById('project-editor');
        if (!editor) return;

        editor.innerHTML = ''; // 清空现有内容

        projectData.forEach((category, parentIndex) => {
            const categoryGroup = createCategoryEditorGroup(category, parentIndex);
            editor.appendChild(categoryGroup);
        });

        // 启用主分类列表的拖拽排序
        setupSortable(editor, '.parent-drag-handle', {
            animation: 150,
            ghostClass: 'sortable-ghost'
        });

        // 为所有子项目列表启用拖拽排序，并允许跨列表拖放
        const allSubcategoryLists = document.querySelectorAll('.subcategory-editor-list');
        allSubcategoryLists.forEach(list => {
            setupSortable(list, '.sub-drag-handle', {
                animation: 150,
                ghostClass: 'sortable-ghost',
                group: 'subprojects', // 关键：同组内的项目可以互相拖放
                onEnd: function (evt) {
                    // 可以在这里添加拖拽结束后的回调逻辑
                }
            });
        });
    }

    /**
     * @description 打开并准备"管理项目"模态框
     */
    function openManageModal() {
        renderProjectEditor();
        if (manageProjectsModal) manageProjectsModal.style.display = 'flex';
    }

    /**
     * @description 创建一个主分类的完整编辑组 (包含头部和子项目列表)
     */
    function createCategoryEditorGroup(category, parentIndex) {
        const groupElement = document.createElement('div');
        groupElement.className = 'category-editor-group';
        groupElement.dataset.parentIndex = parentIndex;

        // 1. 创建主分类头部
        const headerElement = document.createElement('div');
        headerElement.className = 'category-editor-header';
        headerElement.innerHTML = `
            <span class="drag-handle parent-drag-handle"><i class="fas fa-grip-vertical"></i></span>
            <input type="text" value="${category.category}" class="category-name-input parent-name-input" placeholder="主项目名称">
            <button class="btn btn-add-sub" title="添加子项目"><i class="fas fa-plus"></i></button>
            <button class="btn btn-delete" title="删除主项目"><i class="fas fa-trash"></i></button>
        `;

        // 2. 创建子项目列表容器
        const sublistContainer = document.createElement('div');
        sublistContainer.className = 'subcategory-editor-list';

        // 如果没有子项目，添加提示文本
        if (!category.subProjects || category.subProjects.length === 0) {
            const emptyText = document.createElement('div');
            emptyText.className = 'subcategory-empty-text';
            emptyText.textContent = '拖动子项目到此处...';
            emptyText.style.color = '#aaa';
            emptyText.style.textAlign = 'center';
            emptyText.style.padding = '10px';
            emptyText.style.fontStyle = 'italic';
            sublistContainer.appendChild(emptyText);
        } else {
            // 3. 填充子项目
            category.subProjects.forEach((sub, subIndex) => {
                const subCategoryElement = createSubCategoryElement(sub);
                sublistContainer.appendChild(subCategoryElement);
            });
        }

        // 4. 为子项目列表启用拖拽排序
        setupSortable(sublistContainer, '.sub-drag-handle', {
            group: 'subprojects', // 允许跨列表拖拽
            animation: 150
        });

        // 5. 组装并返回
        groupElement.appendChild(headerElement);
        groupElement.appendChild(sublistContainer);

        // 6. 绑定头部按钮事件
        headerElement.querySelector('.btn-add-sub').addEventListener('click', () => {
            // 移除空提示文本（如果有的话）
            const emptyText = sublistContainer.querySelector('.subcategory-empty-text');
            if (emptyText) {
                emptyText.remove();
            }

            const subName = prompt("请输入子项目名称：") || "新子项目";
            const newSubElement = createSubCategoryElement({ name: subName, items: [] });

            // 添加动画效果
            newSubElement.style.opacity = '0';
            newSubElement.style.transform = 'translateY(10px)';
            sublistContainer.appendChild(newSubElement);

            // 触发重绘并应用动画
            setTimeout(() => {
                newSubElement.style.transition = 'all 0.3s ease';
                newSubElement.style.opacity = '1';
                newSubElement.style.transform = 'translateY(0)';
                newSubElement.querySelector('input').focus();
            }, 10);
        });

        headerElement.querySelector('.btn-delete').addEventListener('click', () => {
            if (confirm(`确定要删除主项目 "${category.category}" 及其所有子项目吗？`)) {
                // 添加删除动画效果
                groupElement.style.overflow = 'hidden';
                groupElement.style.transition = 'all 0.5s ease';
                groupElement.style.opacity = '0';
                groupElement.style.transform = 'translateX(30px)';
                groupElement.style.maxHeight = groupElement.offsetHeight + 'px';

                setTimeout(() => {
                    groupElement.style.maxHeight = '0px';
                    groupElement.style.marginBottom = '0px';
                    groupElement.style.padding = '0px';
                    setTimeout(() => {
                        groupElement.remove();
                    }, 300);
                }, 200);
            }
        });

        return groupElement;
    }

    /**
     * @description 创建一个可编辑的子项目元素
     */
    function createSubCategoryElement(subcategory) {
        const subCategoryElement = document.createElement('div');
        subCategoryElement.className = 'subcategory-editor-item';
        subCategoryElement.dataset.id = subcategory.id || ''; // 保存原始ID

        subCategoryElement.innerHTML = `
            <span class="drag-handle sub-drag-handle"><i class="fas fa-grip-vertical"></i></span>
            <input type="text" value="${subcategory.name}" class="category-name-input" placeholder="子项目名称">
            <button class="btn-delete-sub" title="删除子项目"><i class="fas fa-trash"></i></button>
        `;

        // 使删除按钮更加明显
        const deleteBtn = subCategoryElement.querySelector('.btn-delete-sub');
        deleteBtn.style.padding = '5px';
        deleteBtn.style.borderRadius = '4px';

        deleteBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            // 添加确认删除的交互
            if (confirm(`确定要删除"${subcategory.name}"子项目吗？`)) {
                subCategoryElement.style.opacity = '0';
                subCategoryElement.style.transform = 'translateX(20px)';
                subCategoryElement.style.transition = 'all 0.3s ease';
                setTimeout(() => {
                    subCategoryElement.remove();
                }, 300);
            }
        });

        // 允许直接编辑子项目名称
        const input = subCategoryElement.querySelector('input');
        input.addEventListener('blur', () => {
            // 保存编辑后的名称（可以在这里添加验证逻辑）
            if (input.value.trim() === '') {
                input.value = subcategory.name || '未命名子项目';
            }
        });

        // 添加一些微交互效果
        input.addEventListener('focus', () => {
            subCategoryElement.style.boxShadow = '0 0 0 2px rgba(52, 152, 219, 0.3)';
        });

        input.addEventListener('blur', () => {
            subCategoryElement.style.boxShadow = '';
        });

        return subCategoryElement;
    }

    /**
     * @description 当点击"保存更改"时，从UI解析数据并保存
     */
    async function handleSaveProjects() {
        showLoader('正在保存项目...');
        const editor = document.getElementById('project-editor');
        const newProjectData = [];

        editor.querySelectorAll('.category-editor-group').forEach((groupElement, parentIndex) => {
            const parentName = groupElement.querySelector('.parent-name-input').value;
            // 查找原始父分类以保留ID和其他信息
            const originalParent = projectData[groupElement.dataset.parentIndex] || { id: `cat_${Date.now()}` };

            const newSubProjects = [];
            groupElement.querySelectorAll('.subcategory-editor-item').forEach((subElement) => {
                const subName = subElement.querySelector('input').value;
                const originalId = subElement.dataset.id;
                // 查找原始子项目以保留 items 数组
                let originalSub = null;
                for (const p of projectData) {
                    if (p.subProjects) {
                        originalSub = p.subProjects.find(s => s.id === originalId);
                        if (originalSub) break;
                    }
                }

                newSubProjects.push({
                    id: originalId || `sub_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                    name: subName,
                    items: originalSub ? originalSub.items : [] // 保留现有的具体项目条目
                });
            });

            newProjectData.push({
                id: originalParent.id,
                category: parentName,
                order: parentIndex + 1,
                subProjects: newSubProjects
            });
        });

        try {
            await saveProjects(newProjectData);
            projectData = newProjectData; // 更新本地缓存
            refreshUI();
            manageProjectsModal.style.display = 'none';
        } catch (error) {
            console.error("保存项目失败:", error);
            alert("保存失败: " + error.message);
        } finally {
            hideLoader();
        }
    }

    /**
     * @description 在编辑器中添加一个新的主分类
     */
    function addParentCategory() {
        const editor = document.getElementById('project-editor');
        const newName = prompt("请输入新的主目录名称：") || "新建主项目";

        if (newName) {
            const newGroup = createCategoryEditorGroup({
                category: newName,
                subProjects: [],
                id: `cat-${Date.now()}`
            }, projectData.length);

            // 添加新元素时的动画效果
            newGroup.style.opacity = '0';
            newGroup.style.transform = 'translateY(20px)';
            editor.appendChild(newGroup);

            // 触发重绘并应用动画
            setTimeout(() => {
                newGroup.style.transition = 'all 0.3s ease';
                newGroup.style.opacity = '1';
                newGroup.style.transform = 'translateY(0)';
                newGroup.querySelector('input').focus();
            }, 10);
        }
    }

    /**
     * @description 为侧边栏导航链接添加事件监听
     */
    function addSidebarEventListeners() {
        sidebarNav.removeEventListener('click', handleNavClick); // 防止重复绑定
        sidebarNav.addEventListener('click', handleNavClick);
        // 绑定核心事件监听器
        addItemForm.addEventListener('submit', handleAddItemSubmit);
        saveProjectsBtn.addEventListener('click', handleSaveProjects);
        addParentProjectBtn.addEventListener('click', addParentCategory);
    }


    // --- 6. 初始化函数 ---

    /**
     * 页面加载后的主初始化函数
     */
    async function init() {
        showLoader('正在初始化...');
        setupSidebarToggle();

        // --- 1. 获取核心DOM元素 ---
        const fab = document.getElementById('add-item-fab');
        const manageBtn = document.getElementById('manage-projects-btn');

        // 正确设置模态框：
        // 参数3是触发打开的按钮元素
        // 参数4是在打开前执行的回调，用于准备内容
        setupModal(addItemModal, '.close-button', fab, setupAddItemModal);
        setupModal(manageProjectsModal, '.close-button', manageBtn, renderProjectEditor);

        try {
            // 首先检查并按需填充初始数据
            await checkAndSeedInitialProjects();
            // 然后获取所有项目数据
            projectData = await getProjects();

            // 使用获取到的数据渲染UI
            refreshUI();

            // --- 设置所有事件监听器 ---
            addItemForm.addEventListener('submit', handleAddItemSubmit);
            // 移除重复的事件绑定，因为已经在setupModal中绑定了
            // manageProjectsBtn.addEventListener('click', renderProjectEditor);

            // "管理项目"模态框的按钮事件
            saveProjectsBtn.addEventListener('click', handleSaveProjects);

            addParentProjectBtn.addEventListener('click', addParentCategory);

            // 设置通用UI交互
            setupAddItemModal();

            // 绑定核心事件监听器 (表单提交事件在上面已经绑定)
            // 注意：manageProjectsBtn、addItemFab 事件已在setupModal中绑定
            // 注意：saveProjectsBtn、addParentProjectBtn 事件已在上面绑定
            addSidebarEventListeners();

        } catch (error) {
            console.error("Initialization failed:", error);
            mainContent.innerHTML = `<p class="empty-message">初始化失败: ${error.message}</p>`;
        } finally {
            hideLoader();
        }
    }

    // --- 执行初始化 ---
    init();
}); 