/* =====================================================================
 * 文件名: main.js
 * 版本: V2.2 (Firebase集成版)
 * 创建日期: 2025-07-06
 * 功能简介: 实验室物料管理系统，与Firebase实时同步数据
 * ===================================================================== */

import { defaultDirectories, addNewItem, generateUniqueId, deleteItem } from './data-manager.js';
import { renderSidebar, renderMainContent, setActiveCategory, initAddItemModal } from './ui-controller.js';
import { loadDirectoriesFromFirebase, saveDirectoriesToFirebase } from './firebase-config.js';

// --- 全局状态 ---
let directories = [];
let currentSubcategoryId = null;

// --- 初始化 ---
document.addEventListener('DOMContentLoaded', async () => {
    console.log("应用开始初始化 (V2.2 - Firebase)...");

    try {
        const cloudData = await loadDirectoriesFromFirebase();
        if (cloudData && cloudData.length > 0) {
            directories = cloudData;
            console.log("已从Firebase加载数据。");
        } else {
            console.log("Firebase无数据，将上传本地默认数据。");
            directories = defaultDirectories;
            await saveDirectoriesToFirebase(directories);
        }
    } catch (error) {
        console.error("Firebase通信失败，使用本地数据作为备用:", error);
        alert("无法连接到数据库，将使用本地数据且无法保存更改。");
        directories = defaultDirectories;
    }

    // 初始化添加物品弹窗
    const { showModal: showAddItemModal } = initAddItemModal(handleAddItem);

    // 绑定悬浮按钮事件
    const fab = document.getElementById('add-item-fab');
    if (fab) {
        fab.onclick = showAddItemModal;
    }

    // 渲染侧边栏
    renderSidebar(directories, handleCategoryClick);

    // 渲染默认视图 (第一个子分类)
    if (directories.length > 0 && directories[0].children.length > 0) {
        const firstSubcategoryId = directories[0].children[0].id;
        handleCategoryClick(firstSubcategoryId);
    }

    console.log("应用初始化完成。");
});

// --- 事件处理 ---

/**
 * 处理侧边栏子分类的点击事件
 * @param {string} subcategoryId - 被点击的子分类ID
 */
function handleCategoryClick(subcategoryId) {
    currentSubcategoryId = subcategoryId;

    let subcategoryToShow = null;
    for (const category of directories) {
        const found = category.children.find(child => child.id === subcategoryId);
        if (found) {
            subcategoryToShow = found;
            break;
        }
    }

    if (subcategoryToShow) {
        renderMainContent(subcategoryToShow, handleAddItem, handleDeleteItem);
        setActiveCategory(subcategoryId);
    } else {
        console.error(`无法找到ID为 "${subcategoryId}" 的子分类。`);
    }
}

/**
 * 处理添加物品的逻辑
 * @param {object} itemData - 新物品的数据
 */
async function handleAddItem(itemData) {
    if (!currentSubcategoryId) {
        alert("请先选择一个要添加物品的分类！");
        return;
    }

    const newItem = { ...itemData, id: generateUniqueId(currentSubcategoryId) };
    delete newItem.imageFile;

    const result = addNewItem(directories, currentSubcategoryId, newItem);

    if (result.success) {
        directories = result.directories;
        handleCategoryClick(currentSubcategoryId);
        try {
            await saveDirectoriesToFirebase(directories);
            console.log("新物品已保存到Firebase。");
        } catch (error) {
            alert("保存到云端失败，请检查网络连接。");
        }
    } else {
        alert("添加到分类失败，请检查。");
    }
}

/**
 * 处理删除物品的逻辑
 * @param {string} itemId - 要删除的物品ID
 * @param {string} itemName - 要删除的物品名称
 */
async function handleDeleteItem(itemId, itemName) {
    if (confirm(`您确定要删除 "${itemName}" 吗？此操作无法撤销。`)) {
        const result = deleteItem(directories, itemId);
        if (result.success) {
            directories = result.directories;
            handleCategoryClick(currentSubcategoryId);
            try {
                await saveDirectoriesToFirebase(directories);
                console.log(`物品 "${itemName}" 已从Firebase删除。`);
            } catch (error) {
                alert("从云端删除失败，请检查网络连接。");
            }
        } else {
            alert("删除失败，未在数据中找到该物品。");
        }
    }
} 