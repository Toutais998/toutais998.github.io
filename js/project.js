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

// 全局变量，用于存储从Firebase加载的项目数据
let projectData = [];

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
            category.subProjects.forEach(subProject => {
                const option = document.createElement('option');
                option.value = subProject.name;
                option.textContent = subProject.name;
                group.appendChild(option);
            });
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
                    link.dataset.target = subProject.name;
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
     * @param {string} [filter='all'] - 筛选条件, 'all' 或某个子项目的名称
     */
    function renderMainContent(filter = 'all') {
        mainContent.innerHTML = '';
        const grid = document.createElement('div');
        grid.className = 'item-card-grid';

        let projectsToRender = [];
        if (filter === 'all') {
            projectData.forEach(cat => {
                if (cat.subProjects) {
                    cat.subProjects.forEach(sub => projectsToRender.push({ ...sub, parentCategory: cat.category, showTitle: true }))
                }
            });
        } else {
            for (const category of projectData) {
                if (category.subProjects) {
                    const foundSub = category.subProjects.find(sub => sub.name === filter);
                    if (foundSub) {
                        projectsToRender.push({ ...foundSub, parentCategory: category.category, showTitle: false });
                    }
                }
            }
        }

        if (projectsToRender.length === 0) {
            mainContent.innerHTML = `<p class="empty-message">该分类下暂无项目。</p>`;
            return;
        }

        const projectsByParent = projectsToRender.reduce((acc, proj) => {
            const parent = proj.showTitle ? proj.parentCategory : 'single';
            if (!acc[parent]) {
                acc[parent] = [];
            }
            acc[parent].push(proj);
            return acc;
        }, {});


        Object.keys(projectsByParent).forEach(parentCat => {
            if (parentCat !== 'single') {
                const title = document.createElement('h2');
                title.className = 'category-title';
                title.textContent = parentCat;
                title.style.gridColumn = '1 / -1';
                grid.appendChild(title);
            }

            projectsByParent[parentCat].forEach(subProject => {
                if (subProject.items && subProject.items.length > 0) {
                    subProject.items.forEach(item => {
                        const card = document.createElement('a');
                        card.className = 'item-card';
                        card.href = '#';
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
                            </div>
                        `;
                        card.querySelector('.item-actions').addEventListener('click', (e) => {
                            e.preventDefault();
                            e.stopPropagation();
                        });
                        grid.appendChild(card);
                    });
                } else {
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


    // --- 4. 事件处理函数 ---

    /**
     * 处理侧边栏导航链接的点击事件
     * @param {Event} e - 点击事件对象
     */
    function handleNavClick(e) {
        let targetLink = e.target.closest('a');
        if (targetLink) {
            e.preventDefault();
            const targetId = targetLink.dataset.target;

            renderMainContent(targetId);

            document.querySelectorAll('.sidebar-nav a').forEach(a => a.classList.remove('active'));
            targetLink.classList.add('active');
        }
    }

    /**
     * "添加新项目"表单的提交处理逻辑
     * @param {Event} e - 提交事件对象
     */
    async function handleAddItemSubmit(e) {
        e.preventDefault();
        showLoader('正在添加项目...');

        const itemName = document.getElementById('item-name').value;
        const categoryName = document.getElementById('item-category-select').value;

        // 在 projectData 中找到对应的子项目并添加新条目
        let parentCategory = null;
        for (const cat of projectData) {
            if (cat.subProjects && cat.subProjects.find(sub => sub.name === categoryName)) {
                parentCategory = cat;
                break;
            }
        }

        if (parentCategory) {
            const subProject = parentCategory.subProjects.find(sub => sub.name === categoryName);
            if (!subProject.items) {
                subProject.items = [];
            }
            subProject.items.push(itemName);

            try {
                // 保存更新后的数据到Firebase
                await saveProjects(projectData);
                alert('项目添加成功！');
                addItemForm.reset();
                if (addItemModal) addItemModal.style.display = 'none';

                // 重新渲染内容以显示新添加的项目
                const currentFilter = document.querySelector('.sidebar-nav a.active')?.dataset.target || 'all';
                renderMainContent(currentFilter);

            } catch (error) {
                console.error("Error adding project:", error);
                alert('添加失败，请查看控制台');
            } finally {
                hideLoader();
            }
        } else {
            alert('未找到所属类别，添加失败');
            hideLoader();
        }
    }


    // --- 5. 模态框管理 ---

    /**
     * 设置"添加项目"浮动按钮和模态框的事件监听
     */
    function setupAddItemModal() {
        if (addItemFab) {
            addItemFab.addEventListener('click', () => {
                const activeLink = sidebarNav.querySelector('a.active');
                const currentCategoryName = activeLink?.dataset.target;

                // 根据当前激活的侧边栏链接，智能预填充下拉菜单
                if (currentCategoryName && currentCategoryName !== 'all') {
                    updateCategoryDropdown(currentCategoryName);
                } else {
                    updateCategoryDropdown(); // 无预选
                }

                if (addItemModal) {
                    addItemModal.style.display = 'block';
                }
            });
        }
        // 使用通用控制器来设置关闭按钮和点击外部关闭
        setupModal(addItemModal, '.close-button');
    }

    /**
     * 打开"管理项目"模态框
     */
    function openManageModal() {
        renderProjectEditor();
        if (manageProjectsModal) manageProjectsModal.style.display = 'block';
    }

    /**
     * 关闭"管理项目"模态框
     */
    function closeManageModal() {
        if (manageProjectsModal) manageProjectsModal.style.display = 'none';
    }

    /**
     * 渲染"管理项目"模态框内的可编辑列表
     */
    function renderProjectEditor() {
        const editor = document.getElementById('project-editor');
        editor.innerHTML = '';
        projectData.forEach((category, catIndex) => {
            const categoryEl = document.createElement('div');
            categoryEl.className = 'category-editor-item';
            categoryEl.dataset.id = catIndex;
            categoryEl.innerHTML = `
                <i class="fas fa-grip-vertical drag-handle"></i>
                <div class="category-name">${category.category}</div>
                <div class="category-actions">
                    <button data-cat-index="${catIndex}" class="btn-add-sub" title="添加子项目"><i class="fas fa-plus"></i></button>
                    <button data-cat-index="${catIndex}" class="btn-edit-cat" title="重命名"><i class="fas fa-pencil-alt"></i></button>
                    <button data-cat-index="${catIndex}" class="btn-delete-cat" title="删除"><i class="fas fa-trash"></i></button>
                </div>
            `;

            const sublistContainer = document.createElement('div');
            sublistContainer.className = 'subcategory-editor-list';
            sublistContainer.dataset.catIndex = catIndex;

            if (category.subProjects && category.subProjects.length > 0) {
                category.subProjects.forEach((sub, subIndex) => {
                    const subEl = document.createElement('div');
                    subEl.className = 'subcategory-editor-item';
                    subEl.dataset.id = subIndex;
                    subEl.innerHTML = `
                        <i class="fas fa-grip-vertical drag-handle"></i>
                        <div class="category-name">${sub.name}</div>
                        <div class="category-actions">
                             <button data-cat-index="${catIndex}" data-sub-index="${subIndex}" class="btn-edit-sub" title="重命名"><i class="fas fa-pencil-alt"></i></button>
                             <button data-cat-index="${catIndex}" data-sub-index="${subIndex}" class="btn-delete-sub" title="删除"><i class="fas fa-trash"></i></button>
                        </div>
                    `;
                    sublistContainer.appendChild(subEl);
                });
            }

            editor.appendChild(categoryEl);
            editor.appendChild(sublistContainer);
        });

        // 启用拖拽排序功能
        setupSortable(editor, '.drag-handle');
        editor.querySelectorAll('.subcategory-editor-list').forEach(list => {
            setupSortable(list, '.drag-handle');
        });
    }

    /**
     * 从"管理项目"模态框的UI结构中解析出最新的项目数据
     * @returns {Array} - 最新的项目数据数组
     */
    function getProjectsFromEditor() {
        const newProjects = [];
        projectData.forEach((category, catIndex) => {
            const newCategory = {
                id: `proj_${Date.now()}`,
                category: category.category,
                order: catIndex + 1,
                subProjects: []
            };
            category.subProjects.forEach((sub, subIndex) => {
                newCategory.subProjects.push({
                    id: `subproj_${Date.now()}`,
                    name: sub.name,
                    items: sub.items || []
                });
            });
            newProjects.push(newCategory);
        });
        return newProjects;
    }


    // --- 6. 初始化函数 ---

    /**
     * 页面加载后的主初始化函数
     */
    async function init() {
        showLoader('正在初始化项目数据...');
        try {
            // 检查并（如果需要）植入初始数据
            await checkAndSeedInitialProjects();
            // 从Firebase获取项目数据
            projectData = await getProjects();

            if (projectData.length > 0) {
                // 渲染侧边栏和主内容
                renderSidebar();
                renderMainContent('all');
                updateCategoryDropdown();
            } else {
                mainContent.innerHTML = `<p class="empty-message">未能加载项目数据，或数据库为空。</p>`;
            }

            // --- 设置所有事件监听器 ---
            sidebarNav.addEventListener('click', handleNavClick);
            addItemForm.addEventListener('submit', handleAddItemSubmit);
            manageProjectsBtn.addEventListener('click', openManageModal);

            // 使用通用控制器设置模态框关闭逻辑
            setupModal(manageProjectsModal, '.close-button');

            // "管理项目"模态框的按钮事件
            saveProjectsBtn.addEventListener('click', async () => {
                showLoader('正在保存更改...');
                const updatedProjects = getProjectsFromEditor();
                try {
                    await saveProjects(updatedProjects);
                    projectData = updatedProjects; // 更新全局数据
                    alert('项目结构已成功保存！');
                    closeManageModal();
                    renderSidebar();
                    renderMainContent('all');
                } catch (error) {
                    console.error('Error saving projects:', error);
                    alert('保存失败，请查看控制台。');
                } finally {
                    hideLoader();
                }
            });

            addParentProjectBtn.addEventListener('click', () => {
                const newCatName = prompt('请输入新的主项目名称:', '新主项目');
                if (newCatName) {
                    const newCategory = {
                        id: `proj_${Date.now()}`,
                        category: newCatName,
                        order: projectData.length + 1,
                        subProjects: []
                    };
                    projectData.push(newCategory);
                    renderProjectEditor(); // Refresh editor view
                }
            });

            // 设置通用UI交互
            setupAddItemModal();
            setupSidebarToggle();

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