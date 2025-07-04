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

let allItems = []; // 在模块级别缓存所有物品
let currentFilter = 'all'; // 当前的筛选条件
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
export function displayItems(items, filter, onEditItem, onDeleteItem) {
    if (items !== null) {
        allItems = items;
    }
    if (filter !== null) {
        currentFilter = filter;
        console.log("Filter changed to:", currentFilter);
    }

    mainContent.innerHTML = '';

    let itemsToDisplay = currentFilter === 'all'
        ? allItems
        : allItems.filter(item => item.category === currentFilter);

    // 按物品名称排序
    itemsToDisplay.sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'));

    if (itemsToDisplay.length === 0) {
        const message = currentFilter === 'all'
            ? '还没有物品，点击右下角的"+"按钮添加一个吧！'
            : '该分类下还没有物品，点击右下角的"+"按钮添加一个吧！';
        mainContent.innerHTML = `<p class="empty-message">${message}</p>`;
        return;
    }

    const grid = document.createElement('div');
    grid.className = 'item-card-grid';

    itemsToDisplay.forEach(item => {
        const itemCard = createItemCard(item, onEditItem, onDeleteItem);
        grid.appendChild(itemCard);
    });
    mainContent.appendChild(grid);
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
    // 更新缓存
    const itemInCache = allItems.find(item => item.id === itemId);
    if (itemInCache) {
        Object.assign(itemInCache, newData);
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
                displayItems(null, null, () => { }, () => { }); // 重新渲染以显示空消息
            }
        }, 300);
    }
    // 从缓存中也删除
    allItems = allItems.filter(item => item.id !== itemId);
}

/**
 * 在列表中添加一个新的物品卡片
 * @param {object} item - 新添加的物品对象
 */
export function appendNewItem(item) {
    allItems.unshift(item);
    if (currentFilter === 'all' || item.category === currentFilter) {
        displayItems(null, null, () => { }, () => { });
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
 * 初始化UI相关的事件监听器
 * @param {function} onAddItem - 当用户提交添加物品表单时要调用的回调函数
 */
export function initializeUI(onAddItem) {
    addItemFab.addEventListener('click', () => {
        document.querySelector('.modal-content h2').textContent = '添加新物品';
        document.querySelector('#add-item-form button[type="submit"]').textContent = '确认添加';

        // 移除旧的事件监听器
        if (formSubmitHandler) {
            addItemForm.removeEventListener('submit', formSubmitHandler);
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

            if (!name || !location) {
                alert('请填写物品名称和位置！');
                return;
            }
            const category = currentFilter === 'all' ? '其他' : currentFilter;
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
        const topLevelItems = Array.from(categoryEditorContainer.children[0].children);

        topLevelItems.forEach(wrapper => {
            const parentId = wrapper.querySelector('.category-editor-item').dataset.id;
            const parentData = localDirectories.find(d => d.id === parentId);

            const newParent = { ...parentData, children: [] };

            const subItems = Array.from(wrapper.querySelector('.subcategory-editor-list').children);
            subItems.forEach(subItem => {
                const subId = subItem.dataset.id;
                // 在所有旧的children中找到这个subData
                let subData = null;
                for (const dir of localDirectories) {
                    const found = dir.children.find(s => s.id === subId);
                    if (found) {
                        subData = found;
                        break;
                    }
                }
                if (subData) {
                    newParent.children.push(subData);
                }
            });
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