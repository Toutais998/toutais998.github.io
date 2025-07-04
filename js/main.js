/* =====================================================================
 * 文件名: main.js
 * 版本: V2.3 (支持导航管理)
 * 创建日期: 2025-07-07
 * 功能简介: 实验室物料管理系统，与Firebase实时同步数据
 * ===================================================================== */

import { fetchItems, addItem, fetchDirectoryStructure, seedDatabaseIfEmpty, deleteItem, updateItem, saveDirectoryStructure } from './data-manager.js';
import {
    displayItems,
    initializeUI,
    appendNewItem,
    renderSidebar,
    setActiveCategory,
    removeItemCard,
    showEditModal,
    updateItemCard,
    showManageCategoriesModal
} from './ui-controller.js';

/**
 * 处理添加新物品的逻辑
 * @param {object} itemData - 从表单收集的物品数据
 */
async function handleAddItem(itemData) {
    // 显示一个简单的加载指示，例如禁用按钮
    const submitButton = document.querySelector('#add-item-form button[type="submit"]');
    submitButton.disabled = true;
    submitButton.textContent = '添加中...';

    // itemData 现在已经包含了 category
    const newItem = await addItem(itemData);

    if (newItem) {
        appendNewItem(newItem); // 在UI上添加新的物品卡片
        alert('物品添加成功！');
    }

    // 恢复按钮状态
    submitButton.disabled = false;
    submitButton.textContent = '确认添加';
}

/**
 * 处理更新物品的逻辑
 * @param {string} itemId - 要更新的物品ID
 * @param {object} updatedData - 包含新数据的对象
 */
async function handleUpdateItem(itemId, updatedData) {
    const success = await updateItem(itemId, updatedData);
    if (success) {
        updateItemCard(itemId, updatedData);
        alert('物品更新成功！');
    }
}

/**
 * 处理编辑物品按钮点击事件
 * @param {object} item - 要编辑的物品对象
 */
function handleEditItem(item) {
    showEditModal(item, handleUpdateItem);
}

/**
 * 处理删除物品的逻辑
 * @param {string} itemId - 要删除的物品ID
 */
async function handleDeleteItem(itemId) {
    const success = await deleteItem(itemId);
    if (success) {
        removeItemCard(itemId);
    }
}

/**
 * 处理侧边栏分类点击事件
 * @param {string} filter - 筛选关键字 ('all' 或 分类名称)
 */
function handleCategoryClick(filter) {
    setActiveCategory(filter);
    displayItems(null, filter, handleEditItem, handleDeleteItem); // 使用缓存的items进行筛选和显示
}

/**
 * 应用主函数
 */
async function main() {
    // 0. (一次性) 如果数据库为空，则填充默认数据
    const seeded = await seedDatabaseIfEmpty();
    if (seeded) {
        // 如果执行了填充，短暂延时后重新加载页面，以确保获取到最新数据
        alert("首次加载，正在为您填充初始数据，页面将自动刷新。");
        setTimeout(() => location.reload(), 1500);
        return; // 终止当前执行，等待刷新
    }

    // 1. 初始化UI，并传入处理添加物品的函数
    initializeUI(handleAddItem);

    // 2. 并行获取物品数据和目录结构
    const [items, directories] = await Promise.all([
        fetchItems(),
        fetchDirectoryStructure()
    ]);

    // 3. 渲染侧边栏
    renderSidebar(directories, handleCategoryClick);

    // 4. 在页面上显示所有物品 (初始状态)
    displayItems(items, 'all', handleEditItem, handleDeleteItem);

    // 5. 绑定"管理导航"按钮事件
    const manageNavBtn = document.getElementById('manage-nav-btn');
    manageNavBtn.addEventListener('click', () => {
        showManageCategoriesModal(directories, async (updatedStructure) => {
            try {
                await saveDirectoryStructure(updatedStructure);
                // 更新成功后，用新的结构重新渲染侧边栏
                renderSidebar(updatedStructure, handleCategoryClick);
                // 更新全局的 directories 变量，以便下次打开时显示最新版本
                directories.length = 0;
                Array.prototype.push.apply(directories, updatedStructure);
                alert('导航目录已成功更新！');
            } catch (error) {
                console.error("保存目录结构失败:", error);
                alert('保存失败，请查看控制台获取更多信息。');
            }
        });
    });
}

// 当DOM加载完毕后执行主函数
document.addEventListener('DOMContentLoaded', main);