/* =====================================================================
 * 文件名: ui-controller.js
 * 版本: V2.0 (重构版)
 * 创建日期: 2025-07-06
 * 功能简介: 实验室物料管理系统重构版的全新UI控制模块
 * ===================================================================== */

// --- 1. 导航栏渲染 ---
export function renderSidebar(directories, onCategoryClick) {
    const nav = document.getElementById('sidebar-nav');
    if (!nav) return;
    nav.innerHTML = ''; // Clear existing nav

    directories.forEach(category => {
        const categoryUl = document.createElement('ul');
        categoryUl.className = 'nav-category';

        const categoryTitle = document.createElement('span');
        categoryTitle.textContent = category.name;
        categoryUl.appendChild(categoryTitle);

        category.children.forEach(subcategory => {
            const subcategoryLi = document.createElement('li');
            subcategoryLi.className = 'nav-subcategory';
            const link = document.createElement('a');
            link.href = '#';
            link.dataset.id = subcategory.id;
            link.textContent = subcategory.name;
            link.onclick = (e) => {
                e.preventDefault();
                onCategoryClick(subcategory.id);
            };
            subcategoryLi.appendChild(link);
            categoryUl.appendChild(subcategoryLi);
        });
        nav.appendChild(categoryUl);
    });
}

// --- 2. 主内容区渲染 ---
export function renderMainContent(subcategory, onAddItem, onDeleteItem) {
    const mainContent = document.getElementById('main-content');
    if (!mainContent) return;

    mainContent.innerHTML = `
        <h2 class="category-title">${subcategory.name}</h2>
        <div class="box-grid" id="box-grid"></div>
    `;

    const boxGrid = document.getElementById('box-grid');
    if (subcategory.items && subcategory.items.length > 0) {
        subcategory.items.forEach(item => {
            const itemBox = createItemBox(item, onDeleteItem);
            boxGrid.appendChild(itemBox);
        });
    } else {
        boxGrid.innerHTML = '<p class="empty-message">该分类下暂无物品。</p>';
    }
}

function createItemBox(item, onDeleteItem) {
    const itemBox = document.createElement('div');
    itemBox.className = 'item-box';
    itemBox.dataset.id = item.id;

    const defaultImage = 'images/Basic/paris.png';

    itemBox.innerHTML = `
        <div class="item-overlay">
            <div class="item-info">
                <p>数量：${item.quantity || 0}</p>
                <p>位置：${item.location || '未指定'}</p>
            </div>
        </div>
        <img src="${item.imageSrc || defaultImage}" class="item-image" onerror="this.src='${defaultImage}'">
        <p class="item-title">${item.name || '未命名物品'}</p>
        <div class="item-details">
            <p>数量: ${item.quantity || 0}</p>
            <p>位置: ${item.location || '未指定'}</p>
        </div>
    `;

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-btn';
    deleteBtn.title = '删除此物品';
    deleteBtn.innerHTML = '<i class="fas fa-trash-alt"></i>';
    deleteBtn.onclick = (e) => {
        e.stopPropagation();
        onDeleteItem(item.id, item.name);
    };

    itemBox.appendChild(deleteBtn);
    return itemBox;
}


// --- 3. UI状态更新 ---
export function setActiveCategory(categoryId) {
    document.querySelectorAll('.sidebar-nav a').forEach(a => {
        a.classList.remove('active');
        if (a.dataset.id === categoryId) {
            a.classList.add('active');
        }
    });
}

// --- 4. 弹窗管理 ---
export function initAddItemModal(onSave) {
    const modal = document.getElementById('add-item-modal');
    const closeBtn = modal.querySelector('.close-button');
    const form = modal.querySelector('#add-item-form');
    const locationSelect = modal.querySelector('#item-location-select');
    const locationOtherGroup = modal.querySelector('#item-location-other-group');
    const locationOtherInput = modal.querySelector('#item-location-other');

    const showModal = () => modal.style.display = 'flex';
    const hideModal = () => {
        modal.style.display = 'none';
        locationOtherGroup.style.display = 'none'; // Reset on close
        form.reset();
    }

    locationSelect.onchange = () => {
        if (locationSelect.value === 'other') {
            locationOtherGroup.style.display = 'block';
            locationOtherInput.required = true;
        } else {
            locationOtherGroup.style.display = 'none';
            locationOtherInput.required = false;
        }
    };

    closeBtn.onclick = hideModal;
    window.onclick = (event) => {
        if (event.target === modal) {
            hideModal();
        }
    };

    form.onsubmit = (event) => {
        event.preventDefault();
        const formData = new FormData(form);
        const imageFile = formData.get('itemImage');

        let location = formData.get('itemLocationSelect');
        if (location === 'other') {
            location = formData.get('itemLocationOther');
        }

        const newItem = {
            name: formData.get('itemName'),
            quantity: parseInt(formData.get('itemQuantity'), 10),
            location: location,
            imageFile: imageFile && imageFile.size > 0 ? imageFile : null,
            imageSrc: imageFile && imageFile.size > 0 ? URL.createObjectURL(imageFile) : 'images/Basic/爆炸头2.png'
        };

        onSave(newItem);
        hideModal();
    };

    return { showModal, hideModal };
}

// 例如: export function showItemModal(item, onSave) { ... }
// 例如: export function showDeleteConfirmModal(itemName, onConfirm) { ... } 