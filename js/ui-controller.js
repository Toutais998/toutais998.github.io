/* =====================================================================
 * 文件名: ui-controller.js
 * 版本: V2.1 (Firebase集成版)
 * 功能简介: 实验室物料管理系统UI控制模块
 * ===================================================================== */

const sidebarNav = document.getElementById('sidebar-nav');
const mainContent = document.getElementById('main-content');
const addItemModal = document.getElementById('add-item-modal');
const addItemFab = document.getElementById('add-item-fab');
const closeModalButton = document.querySelector('.modal .close-button');
const addItemForm = document.getElementById('add-item-form');
const locationSelect = document.getElementById('item-location-select');
const locationOtherGroup = document.getElementById('item-location-other-group');

let formSubmitHandler = null; // 用于存储当前的表单提交处理函数

/**
 * 渲染侧边栏导航
 * @param {Array<object>} directories - 目录结构数据
 * @param {function} onCategoryClick - 分类点击事件的回调
 */
export function renderSidebar(directories, onCategoryClick) {
    sidebarNav.innerHTML = '';
    const navList = document.createElement('ul');
    navList.className = 'nav-list';

    const showAllLi = document.createElement('li');
    showAllLi.innerHTML = `<a href="#" data-id="all" class="active"><i class="fas fa-border-all"></i> <span>显示全部</span></a>`;
    showAllLi.addEventListener('click', (e) => {
        e.preventDefault();
        onCategoryClick('all');
    });
    navList.appendChild(showAllLi);

    directories.forEach(category => {
        const categoryLi = document.createElement('li');
        categoryLi.className = 'nav-category';

        let subCategoryHtml = '';
        if (category.children && category.children.length > 0) {
            subCategoryHtml = '<ul class="nav-subcategory-list">';
            category.children.forEach(sub => {
                subCategoryHtml += `<li><a href="#" data-id="${sub.id}" data-filter-name="${sub.name}">${sub.name}</a></li>`;
            });
            subCategoryHtml += '</ul>';
        }

        categoryLi.innerHTML = `
            <div class="category-header">
                <i class="fas fa-folder"></i>
                <span>${category.name}</span>
            </div>
            ${subCategoryHtml}
        `;
        navList.appendChild(categoryLi);
    });

    sidebarNav.appendChild(navList);

    sidebarNav.querySelectorAll('.nav-subcategory-list a').forEach(el => {
        el.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const filterName = e.target.dataset.filterName;
            onCategoryClick(filterName);
        });
    });
}

/**
 * 设置侧边栏某个分类的激活状态
 * @param {string} filter - 被激活的筛选条件 ('all' 或 分类名称)
 */
export function setActiveCategory(filter) {
    sidebarNav.querySelectorAll('a').forEach(a => a.classList.remove('active'));
    const selector = filter === 'all' ? `a[data-id="all"]` : `a[data-filter-name="${filter}"]`;
    const activeLink = sidebarNav.querySelector(selector);
    if (activeLink) {
        activeLink.classList.add('active');
    }
}

/**
 * 根据物品数据创建并返回一个物品卡片的DOM元素
 * @param {object} item - 物品对象
 * @param {function} onEditItem - 编辑按钮点击事件的回调
 * @param {function} onDeleteItem - 删除按钮点击事件的回调
 * @returns {HTMLElement} - 创建的物品卡片元素
 */
function createItemCard(item, onEditItem, onDeleteItem) {
    const card = document.createElement('div');
    card.className = 'item-card';
    card.dataset.id = item.id;

    const defaultImage = 'images/Basic/kitty.jpg';
    const imageUrl = item.imageUrl || defaultImage;

    card.innerHTML = `
        <div class="item-image-container">
             <img src="${imageUrl}" alt="${item.name}" class="item-image" onerror="this.onerror=null;this.src='${defaultImage}';">
        </div>
            <div class="item-info">
            <h3 class="item-name">${item.name}</h3>
        </div>
        <div class="item-details">
            <p class="item-quantity">数量: ${item.quantity}</p>
            <p class="item-location">位置: ${item.location}</p>
        </div>
        <button class="btn-edit" title="编辑"><i class="fas fa-edit"></i></button>
        <button class="btn-delete" title="删除"><i class="fas fa-trash"></i></button>
    `;

    card.querySelector('.btn-edit').addEventListener('click', (e) => {
        e.stopPropagation();
        onEditItem(item);
    });

    card.querySelector('.btn-delete').addEventListener('click', (e) => {
        e.stopPropagation(); // 防止触发卡片的其他点击事件
        if (confirm(`您确定要删除 "${item.name}" 吗？此操作无法撤销。`)) {
            onDeleteItem(item.id);
        }
    });

    return card;
}

/**
 * 在页面上渲染物品
 * @param {Array<object> | null} items - 物品对象数组. 如果为 null，则使用缓存的数据
 * @param {string | null} filter - 用于筛选物品的地点(location)
 * @param {function} onEditItem - 编辑按钮点击事件的回调
 * @param {function} onDeleteItem - 删除按钮点击事件的回调
 */
export function displayItems(itemsToDisplay, onEditItem, onDeleteItem) {
    mainContent.innerHTML = '';

    if (!itemsToDisplay || itemsToDisplay.length === 0) {
        mainContent.innerHTML = `<p class="empty-message">请从左侧选择一个分类查看物品，<br>或点击右下角的 '+' 按钮添加新物品。</p>`;
        return;
    }

    // 按物品名称排序
    const sortedItems = [...itemsToDisplay].sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'));

    const grid = document.createElement('div');
    grid.className = 'item-card-grid';

    sortedItems.forEach(item => {
        const itemCard = createItemCard(item, onEditItem, onDeleteItem);
        grid.appendChild(itemCard);
    });
    mainContent.appendChild(grid);
}

/**
 * 显示加载动画
 * @param {string} text - 要显示的加载文本
 */
export function showLoadingSpinner(text = '加载中...') {
    const loader = document.getElementById('loader');
    if (loader) {
        loader.querySelector('p').textContent = text;
        loader.style.display = 'flex';
    }
}

/**
 * 隐藏加载动画
 */
export function hideLoadingSpinner() {
    const loader = document.getElementById('loader');
    if (loader) {
        loader.style.display = 'none';
    }
}

/**
 * 更新UI上的一个物品卡片
 * @param {string} itemId - 要更新的物品ID
 * @param {object} newData - 包含新数据的对象
 */
export function updateItemCard(itemId, newData) {
    const card = mainContent.querySelector(`.item-card[data-id="${itemId}"]`);
    if (card) {
        if (newData.name) card.querySelector('.item-name').textContent = newData.name;
        if (newData.quantity) card.querySelector('.item-quantity').textContent = `数量: ${newData.quantity}`;
        if (newData.location) card.querySelector('.item-location').textContent = `位置: ${newData.location}`;
    }
}

/**
 * 从UI上移除一个物品卡片
 * @param {string} itemId - 要移除的物品卡片的ID
 */
export function removeItemCard(itemId) {
    const card = mainContent.querySelector(`.item-card[data-id="${itemId}"]`);
    if (card) {
        card.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        card.style.opacity = '0';
        card.style.transform = 'scale(0.9)';
        setTimeout(() => {
            card.remove();
            // 检查网格是否变空
            const grid = mainContent.querySelector('.item-card-grid');
            if (grid && grid.children.length === 0) {
                mainContent.innerHTML = `<p class="empty-message">该分类下已没有物品。</p>`;
            }
        }, 300);
    }
}

/**
 * 在列表中添加一个新的物品卡片
 * @param {object} item - 新添加的物品对象
 * @param {function} onEditItem - 编辑回调
 * @param {function} onDeleteItem - 删除回调
 */
export function appendNewItem(item, onEditItem, onDeleteItem) {
    // 检查是否有空消息，如果有则移除
    const emptyMessage = mainContent.querySelector('.empty-message');
    if (emptyMessage) {
        mainContent.innerHTML = ''; // 清空
        const grid = document.createElement('div');
        grid.className = 'item-card-grid';
        mainContent.appendChild(grid);
    }

    const grid = mainContent.querySelector('.item-card-grid');
    if (grid) {
        const itemCard = createItemCard(item, onEditItem, onDeleteItem);
        grid.prepend(itemCard); // 将新项目添加到顶部
    }
}

/**
 * 显示编辑物品的模态框
 * @param {object} item - 要编辑的物品对象
 * @param {function} onUpdate - 点击确认更新时的回调函数
 */
export function showEditModal(item, onUpdate) {
    document.querySelector('.modal-content h2').textContent = '编辑物品';
    document.querySelector('#add-item-form button[type="submit"]').textContent = '确认修改';

    document.getElementById('item-name').value = item.name;
    document.getElementById('item-quantity').value = item.quantity;

    const locationSelect = document.getElementById('item-location-select');
    const locationOtherGroup = document.getElementById('item-location-other-group');
    const locationOtherInput = document.getElementById('item-location-other');

    const standardLocations = Array.from(locationSelect.options).map(opt => opt.value);
    if (standardLocations.includes(item.location)) {
        locationSelect.value = item.location;
        locationOtherGroup.style.display = 'none';
    } else {
        locationSelect.value = 'other';
        locationOtherGroup.style.display = 'block';
        locationOtherInput.value = item.location;
    }

    // 移除旧的事件监听器
    if (formSubmitHandler) {
        addItemForm.removeEventListener('submit', formSubmitHandler);
    }

    // 定义新的提交处理函数
    formSubmitHandler = (event) => {
        event.preventDefault();
        const updatedData = {
            name: document.getElementById('item-name').value,
            quantity: parseInt(document.getElementById('item-quantity').value, 10),
            location: locationSelect.value === 'other'
                ? locationOtherInput.value
                : locationSelect.value,
        };
        onUpdate(item.id, updatedData);
        addItemModal.style.display = 'none';
    };

    // 添加新的事件监听器
    addItemForm.addEventListener('submit', formSubmitHandler);

    addItemModal.style.display = 'flex';
}

/**
 * 初始化UI界面，绑定核心事件监听器
 * @param {function} onAddItem - 添加物品的回调函数
 * @param {Array} directories - 目录结构数据
 */
export function initializeUI(onAddItem, directories) {
    addItemFab.addEventListener('click', () => {
        document.querySelector('.modal-content h2').textContent = '添加新物品';
        document.querySelector('#add-item-form button[type="submit"]').textContent = '确认添加';

        // 移除旧的事件监听器
        if (formSubmitHandler) {
            addItemForm.removeEventListener('submit', formSubmitHandler);
        }

        // === 开始填充类别归属下拉框 ===
        const categorySelect = document.getElementById('item-category-select');
        categorySelect.innerHTML = ''; // 清空旧选项

        if (directories && directories.length > 0) {
            directories.forEach(parentCat => {
                const hasChildren = parentCat.children && parentCat.children.length > 0;
                // 如果父分类下有子分类，则创建分组
                if (hasChildren) {
                    const parentOptgroup = document.createElement('optgroup');
                    parentOptgroup.label = parentCat.name;
                    parentCat.children.forEach(subCat => {
                        const option = document.createElement('option');
                        option.value = subCat.name;
                        option.textContent = subCat.name;
                        parentOptgroup.appendChild(option);
                    });
                    categorySelect.appendChild(parentOptgroup);
                }
            });
        }
        // === 结束填充类别归属下拉框 ===

        // 设置下拉框的默认值为当前激活的分类
        const activeCategoryLink = sidebarNav.querySelector('a.active');
        if (activeCategoryLink && activeCategoryLink.dataset.id !== 'all') {
            categorySelect.value = activeCategoryLink.dataset.filterName || '';
        }

        // 定义新的提交处理函数
        formSubmitHandler = (event) => {
            event.preventDefault();
            const name = document.getElementById('item-name').value;
            const quantity = parseInt(document.getElementById('item-quantity').value, 10);
            let location = locationSelect.value;
            if (location === 'other') {
                location = document.getElementById('item-location-other').value;
            }
            const imageFile = document.getElementById('item-image').files[0];
            const category = document.getElementById('item-category-select').value; // 从下拉框读取

            if (!name || !location || !category) {
                alert('请填写物品名称、位置和类别！');
                return;
            }

            onAddItem({ name, quantity, location, imageFile, category });
            addItemModal.style.display = 'none';
        };

        // 添加新的事件监听器
        addItemForm.addEventListener('submit', formSubmitHandler);

        // 重置表单，并设置默认值
        addItemForm.reset();
        locationSelect.value = '大光学实验室';
        locationOtherGroup.style.display = 'none';

        addItemModal.style.display = 'flex';
    });

    closeModalButton.addEventListener('click', () => {
        addItemModal.style.display = 'none';
    });

    window.addEventListener('click', (event) => {
        if (event.target === addItemModal) {
            addItemModal.style.display = 'none';
        }
    });

    locationSelect.addEventListener('change', () => {
        if (locationSelect.value === 'other') {
            locationOtherGroup.style.display = 'block';
            document.getElementById('item-location-other').focus();
        } else {
            locationOtherGroup.style.display = 'none';
        }
    });
}

// =====================================================================
// 类别编辑器模块 (Category Editor Module)
// =====================================================================
const categoryEditorContainer = document.getElementById('category-editor');
let sortableInstances = [];
let localDirectories = [];

const CategoryEditor = {
    init(directories, onSave) {
        localDirectories = JSON.parse(JSON.stringify(directories)); // 深拷贝
        this.render();

        document.getElementById('add-parent-category-btn').onclick = () => this.addParentCategory();
        document.getElementById('save-categories-btn').onclick = () => {
            const updatedStructure = this.getUpdatedStructure();
            onSave(updatedStructure);
        };
    },

    render() {
        categoryEditorContainer.innerHTML = '';
        sortableInstances.forEach(s => s.destroy());
        sortableInstances = [];

        const list = document.createElement('div');
        localDirectories.forEach((cat, index) => {
            list.appendChild(this.createCategoryElement(cat, index));
        });
        categoryEditorContainer.appendChild(list);

        const sortableList = new Sortable(list, {
            handle: '.drag-handle',
            animation: 150,
            ghostClass: 'sortable-ghost',
        });
        sortableInstances.push(sortableList);
    },

    createCategoryElement(category, parentIndex) {
        const item = document.createElement('div');
        item.className = 'category-editor-item';
        item.dataset.id = category.id;

        const subListContainer = document.createElement('div');
        subListContainer.className = 'subcategory-editor-list';

        if (category.children && category.children.length > 0) {
            category.children.forEach((sub, subIndex) => {
                subListContainer.appendChild(this.createSubCategoryElement(sub, parentIndex, subIndex));
            });
        }

        const sortableSubList = new Sortable(subListContainer, {
            group: 'subcategories',
            handle: '.drag-handle',
            animation: 150,
            ghostClass: 'sortable-ghost',
        });
        sortableInstances.push(sortableSubList);

        item.innerHTML = `
            <i class="fas fa-grip-vertical drag-handle"></i>
            <span class="category-name">${category.name}</span>
            <div class="category-actions">
                <button class="btn-add-sub" title="添加子目录"><i class="fas fa-plus-circle"></i></button>
                <button class="btn-rename" title="重命名"><i class="fas fa-pencil-alt"></i></button>
                <button class="btn-delete" title="删除"><i class="fas fa-trash-alt"></i></button>
            </div>
        `;

        const wrapper = document.createElement('div');
        wrapper.appendChild(item);
        wrapper.appendChild(subListContainer);

        item.querySelector('.btn-add-sub').onclick = () => this.addSubCategory(parentIndex);
        item.querySelector('.btn-rename').onclick = () => this.renameCategory(parentIndex);
        item.querySelector('.btn-delete').onclick = () => this.deleteCategory(parentIndex);

        return wrapper;
    },

    createSubCategoryElement(subcategory, parentIndex, subIndex) {
        const item = document.createElement('div');
        item.className = 'subcategory-editor-item';
        item.dataset.id = subcategory.id;
        item.innerHTML = `
            <i class="fas fa-grip-vertical drag-handle"></i>
            <span class="category-name">${subcategory.name}</span>
            <div class="category-actions">
                <button class="btn-rename" title="重命名"><i class="fas fa-pencil-alt"></i></button>
                <button class="btn-delete" title="删除"><i class="fas fa-trash-alt"></i></button>
            </div>
        `;
        item.querySelector('.btn-rename').onclick = () => this.renameSubCategory(parentIndex, subIndex);
        item.querySelector('.btn-delete').onclick = () => this.deleteSubCategory(parentIndex, subIndex);
        return item;
    },

    addParentCategory() {
        const name = prompt("请输入新的主目录名称：");
        if (name) {
            localDirectories.push({ id: `cat-${Date.now()}`, name, children: [] });
            this.render();
        }
    },

    addSubCategory(parentIndex) {
        const name = prompt("请输入新的子目录名称：");
        if (name) {
            if (!localDirectories[parentIndex].children) {
                localDirectories[parentIndex].children = [];
            }
            localDirectories[parentIndex].children.push({ id: `sub-${Date.now()}`, name });
            this.render();
        }
    },

    renameCategory(index) {
        const newName = prompt("请输入新的主目录名称：", localDirectories[index].name);
        if (newName) {
            localDirectories[index].name = newName;
            this.render();
        }
    },

    renameSubCategory(parentIndex, subIndex) {
        const newName = prompt("请输入新的子目录名称：", localDirectories[parentIndex].children[subIndex].name);
        if (newName) {
            localDirectories[parentIndex].children[subIndex].name = newName;
            this.render();
        }
    },

    deleteCategory(index) {
        if (confirm(`确定要删除主目录 "${localDirectories[index].name}" 吗？其下的所有子目录也将被删除。`)) {
            localDirectories.splice(index, 1);
            this.render();
        }
    },

    deleteSubCategory(parentIndex, subIndex) {
        if (confirm(`确定要删除子目录 "${localDirectories[parentIndex].children[subIndex].name}" 吗？`)) {
            localDirectories[parentIndex].children.splice(subIndex, 1);
            this.render();
        }
    },

    getUpdatedStructure() {
        const newStructure = [];
        const list = categoryEditorContainer.children[0];
        if (!list) return [];

        Array.from(list.children).forEach(wrapper => {
            const parentElement = wrapper.querySelector('.category-editor-item');
            if (!parentElement) return;

            const newParent = {
                id: parentElement.dataset.id,
                name: parentElement.querySelector('.category-name').textContent,
                children: []
            };

            const sublistElement = wrapper.querySelector('.subcategory-editor-list');
            if (sublistElement) {
                Array.from(sublistElement.children).forEach(subItem => {
                    if (!subItem.dataset.id) return;
                    newParent.children.push({
                        id: subItem.dataset.id,
                        name: subItem.querySelector('.category-name').textContent
                    });
                });
            }
            newStructure.push(newParent);
        });

        return newStructure;
    }
};

export function showManageCategoriesModal(directories, onSave) {
    const modal = document.getElementById('manage-categories-modal');
    CategoryEditor.init(directories, (updatedStructure) => {
        onSave(updatedStructure);
        modal.style.display = 'none';
    });
    modal.style.display = 'flex';

    modal.querySelector('.close-button').onclick = () => {
        modal.style.display = 'none';
    };
}

/**
 * 更新“添加到...”下拉菜单中的分类
 * @param {Array} directories - 目录结构数据
 */
export function updateCategoryDropdown(directories) {
    const categorySelect = document.getElementById('item-category-select');
    if (!categorySelect) return;

    // 保存当前选中的值（如果有的话）
    // ... existing code ...
} 