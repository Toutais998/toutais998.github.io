/* 
=====================================================================
* 文件名: project-data-manager.js
* 版本: V1.0
* 创建日期: 2025-07-04
* 最后修改: 2025-07-05
* 
* 功能简介:
* - 专用于"项目管理"页面的数据处理模块。
* - 负责与 Firebase Firestore 中 'projects' 集合的所有交互。
* - 包含检查和植入初始项目数据（seeding）的功能。
* - 提供获取和保存整个项目数据结构的函数。
* - 使用了我们从云端同步回来的最新数据作为初始数据。
=====================================================================
*/

import { db, doc, getDoc, setDoc, collection, getDocs, writeBatch, runTransaction } from "./firebase-config.js";

const METADATA_COLLECTION = 'metadata';
const PROJECTS_COLLECTION = 'projects';
const PROJECTS_METADATA_DOC = 'projects_metadata';

// This flag is stored in Firestore to ensure it's checked only once.
const SEED_STATUS_DOC_ID = 'system_status';
const SEED_FLAG_ID = 'isProjectsSeeded';

// Define the initial data structure for projects.
// This will be used to seed the database if it's the first time.
const initialProjectsData = [
    {
        "order": 1,
        "category": "光学项目",
        "subProjects": [
            {
                "name": "光谱仪项目",
                "id": "spectrometer",
                "items": [
                    "乐高光谱仪",
                    "红外光谱仪",
                    "可见光光谱仪"
                ]
            },
            {
                "items": [
                    "激光切割机"
                ],
                "name": "激光切割项目",
                "id": "laser_cutting"
            },
            {
                "items": [
                    "可见光共聚焦成像",
                    "近红外共聚焦成像",
                    "转盘共聚焦成像"
                ],
                "name": "共聚焦成像项目",
                "id": "confocal_imaging"
            },
            {
                "id": "multiphoton_imaging",
                "name": "多光子成像项目",
                "items": [
                    "双光子成像（维快930）",
                    "三光子成像（LC OPA）"
                ]
            },
            {
                "name": "荧光寿命项目",
                "items": [
                    "共聚焦荧光寿命（SPAD）",
                    "多光子荧光寿命（PMT）"
                ],
                "id": "fluorescence_lifetime"
            },
            {
                "items": [
                    "光纤切割",
                    "测试"
                ],
                "id": "fiber_cutting",
                "name": "光纤切割项目"
            },
            {
                "name": "光声项目",
                "items": [
                    "光声成像项目"
                ],
                "id": "photoacoustic"
            },
            {
                "id": "ultrafast_characterization",
                "items": [
                    "自相干仪设计（迈克尔逊+商用）",
                    "自相干仪设计（Voice Call）",
                    "FROG设计（迈克尔逊）"
                ],
                "name": "超快光学表征项目"
            },
            {
                "items": [
                    "扫描头设计"
                ],
                "id": "other_optical",
                "name": "其他光学项目"
            }
        ],
        "id": "optical_projects"
    },
    {
        "category": "电学项目",
        "subProjects": [
            {
                "id": "daq_development",
                "name": "采集卡开发项目",
                "items": [
                    "3.7G采集卡开发项目"
                ]
            },
            {
                "items": [
                    "激光测径仪"
                ],
                "name": "其他电学项目",
                "id": "other_electrical"
            }
        ],
        "order": 2,
        "id": "electrical_projects"
    },
    {
        "order": 3,
        "category": "其他项目",
        "id": "other_projects",
        "subProjects": [
            {
                "id": "super_resolution",
                "name": "超分辨项目",
                "items": [
                    "STORM超分辨",
                    "MINIFLUX超分辨"
                ]
            }
        ]
    }
];

/**
 * @description 使用Firestore事务（Transaction）检查项目数据是否已初始化。
 * 如果未初始化，则将 `initialProjectsData` 植入数据库。
 * 使用事务可以防止多个用户同时访问页面时发生竞态条件，确保初始化操作只执行一次。
 * @returns {Promise<void>}
 */
export async function checkAndSeedInitialProjects() {
    const metadataRef = doc(db, METADATA_COLLECTION, PROJECTS_METADATA_DOC);

    try {
        await runTransaction(db, async (transaction) => {
            const metadataSnap = await transaction.get(metadataRef);

            // 如果元数据文档不存在或 isSeeded 标志为 false，则执行写入操作
            if (!metadataSnap.exists() || !metadataSnap.data().isSeeded) {
                console.log("Transactionally seeding initial project data into Firestore...");

                // 1. 将所有初始项目数据添加到事务的写入队列中
                initialProjectsData.forEach(category => {
                    const docRef = doc(db, PROJECTS_COLLECTION, category.id);
                    transaction.set(docRef, category);
                });

                // 2. 将初始化完成的标志位也添加到事务中
                transaction.set(metadataRef, { isSeeded: true });
                console.log("Initial project data prepared in transaction.");
            }
            // 如果标志位已存在，则事务中没有任何写操作，直接成功结束。
        });
        console.log("Transaction successful: Seeding check complete.");
    } catch (e) {
        console.error("Transaction failed, data might not be seeded correctly:", e);
        // 如果事务失败，将错误向上抛出，以便调用者可以处理
        throw e;
    }
}

/**
 * @description 从Firestore获取所有项目，并按 'order' 字段排序。
 * @returns {Promise<Array<object>>} 返回一个包含所有项目分类对象的数组。
 */
export async function getProjects() {
    const projectsCol = collection(db, PROJECTS_COLLECTION);
    const projectSnapshot = await getDocs(projectsCol);
    const projectList = projectSnapshot.docs.map(doc => doc.data());

    // 确保返回的数据是按 order 字段排序的
    projectList.sort((a, b) => a.order - b.order);

    return projectList;
}

/**
 * @description 使用批量写入（WriteBatch）的方式，一次性保存整个项目结构到Firestore。
 * 这比单个写入更高效，且能保证操作的原子性。
 * @param {Array<object>} projectData - 要保存的完整项目数据数组。
 * @returns {Promise<void>}
 */
export async function saveProjects(projectData) {
    const batch = writeBatch(db);

    projectData.forEach((category, index) => {
        // 确保每个分类都有一个基于其在数组中位置的 'order' 属性
        const dataToSave = { ...category, order: index + 1 };
        const docRef = doc(db, PROJECTS_COLLECTION, category.id);
        batch.set(docRef, dataToSave);
    });

    // 提交所有写入操作
    await batch.commit();
} 