/* =====================================================================
 * 文件名: main.js
 * 版本: V2.4
 * 创建日期: 2025-07-07
 * 最后修改: 2025-07-05
 * 
 * 本次更新:
 * - 版本号更新 (V2.3 -> V2.4)
 * - 将通用的侧边栏开关逻辑移至 `ui-controller.js`
 * 
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
    showManageCategoriesModal,
    setupSidebarToggle
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
        appendNewItem(newItem, handleEditItem, handleDeleteItem);
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
async function handleCategoryClick(filter) {
    setActiveCategory(filter);
    const loader = document.getElementById('loader');
    try {
        loader.style.display = 'flex';
        const items = await fetchItems(filter);
        displayItems(items, filter, handleEditItem, handleDeleteItem);
    } catch (error) {
        console.error(`Failed to load items for category ${filter}:`, error);
        alert('加载物品失败，请稍后重试。');
    } finally {
        loader.style.display = 'none';
    }
}

/**
 * 应用主函数
 */
async function main() {
    const loader = document.getElementById('loader');

    try {
        loader.style.display = 'flex'; // 显示加载动画

        // 0. (一次性) 如果数据库为空，则填充默认数据
        const seeded = await seedDatabaseIfEmpty();
        if (seeded) {
            // 如果执行了填充，短暂延时后重新加载页面，以确保获取到最新数据
            alert("首次加载，正在为您填充初始数据，页面将自动刷新。");
            setTimeout(() => location.reload(), 1500);
            return; // 终止当前执行，等待刷新
        }

        // 1. 获取目录结构
        const directories = await fetchDirectoryStructure();

        // 2. 初始化UI，并传入处理添加物品的函数和目录结构
        initializeUI(handleAddItem, directories);

        // 3. 渲染侧边栏
        if (directories && directories.length > 0) {
            renderSidebar(directories, handleCategoryClick);
        } else {
            console.warn("未获取到目录结构，侧边栏为空。");
        }

        // 4. 显示初始空状态或欢迎信息
        displayItems([], 'all', handleEditItem, handleDeleteItem);

        // 5. 绑定"管理导航"按钮事件
        const manageNavBtn = document.getElementById('manage-nav-btn');
        if (manageNavBtn && directories) {
            manageNavBtn.addEventListener('click', () => {
                showManageCategoriesModal(directories, async (updatedStructure) => {
                    try {
                        await saveDirectoryStructure(updatedStructure);
                        renderSidebar(updatedStructure, handleCategoryClick);
                        // 更新全局 directories 变量
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

        // 6. 移动端侧边栏交互 (使用通用控制器)
        setupSidebarToggle();
    } catch (error) {
        console.error("应用主程序发生严重错误: ", error);
        alert("页面加载失败，请检查网络连接或联系管理员。详情请查看控制台。");
    } finally {
        loader.style.display = 'none'; // 无论成功或失败，都隐藏加载动画
    }
}

// 当DOM加载完毕后执行主函数
document.addEventListener('DOMContentLoaded', main);