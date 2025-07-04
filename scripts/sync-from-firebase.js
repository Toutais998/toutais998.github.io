// scripts/sync-from-firebase.js

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, orderBy, terminate } from 'firebase/firestore';
import fs from 'fs/promises';
import path from 'path';

// --- Configuration ---
// IMPORTANT: This uses the same configuration as your main application.
const firebaseConfig = {
    apiKey: "AIzaSyAdsyT0NuoqjbWcyiCLdSiQIDdoM7RnGo4",
    authDomain: "yanglab-e8ebe.firebaseapp.com",
    projectId: "yanglab-e8ebe",
    storageBucket: "yanglab-e8ebe.firebasestorage.app",
    messagingSenderId: "746435928321",
    appId: "1:746435928321:web:615c2a9c650c5b38953b00",
    measurementId: "G-SE9HBFS1PW"
};

const TARGET_FILE_PATH = path.join(process.cwd(), 'js', 'project-data-manager.js');
const PROJECTS_COLLECTION = 'projects';
const VARIABLE_TO_REPLACE = 'initialProjectsData';

// --- Main Sync Function ---
async function syncFirebaseToLocal() {
    console.log("🚀 Starting Firebase data sync...");

    // 1. Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    console.log("✅ Firebase initialized.");

    try {
        // 2. Fetch data from Firebase
        console.log(`📡 Fetching data from '${PROJECTS_COLLECTION}' collection...`);
        const projectsQuery = query(collection(db, PROJECTS_COLLECTION), orderBy('order'));
        const projectsSnapshot = await getDocs(projectsQuery);
        const projectsData = projectsSnapshot.docs.map(doc => doc.data());

        if (projectsData.length === 0) {
            console.warn("⚠️ Warning: Fetched 0 projects from Firebase. Aborting file update.");
            return;
        }
        console.log(`👍 Successfully fetched ${projectsData.length} project categories.`);

        // 3. Read the target local file
        console.log(`📄 Reading target file: ${TARGET_FILE_PATH}`);
        let fileContent = await fs.readFile(TARGET_FILE_PATH, 'utf8');

        // 4. Prepare the new data string
        const newProjectsDataString = JSON.stringify(projectsData, null, 2); // Using 2 spaces for consistency

        // 5. Replace the old data in the file content using a robust regex
        const regex = new RegExp(`(const ${VARIABLE_TO_REPLACE}\\s*=\\s*)\\[[\\s\\S]*?\\];`, 'm');

        if (!regex.test(fileContent)) {
            throw new Error(`Could not find the '${VARIABLE_TO_REPLACE}' array in ${TARGET_FILE_PATH}. Please check the file.`);
        }

        const updatedFileContent = fileContent.replace(regex, `$1${newProjectsDataString};`);

        // 6. Write the updated content back to the file
        await fs.writeFile(TARGET_FILE_PATH, updatedFileContent, 'utf8');
        console.log(`🎉 Successfully updated ${TARGET_FILE_PATH} with the latest data from Firebase.`);

    } catch (error) {
        console.error("❌ Error during Firebase sync:", error);
        process.exit(1); // Exit with an error code
    } finally {
        // 7. Terminate the Firestore connection to allow the script to exit cleanly.
        await terminate(db);
        console.log("🚪 Firebase connection closed. Sync process finished.");
    }
}

syncFirebaseToLocal(); 