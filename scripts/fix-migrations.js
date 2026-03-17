
const fs = require('fs');
const path = require('path');

const migrationsDir = path.join(__dirname, '../prisma/migrations');
const folders = fs.readdirSync(migrationsDir).filter(f => f.startsWith('202501'));

folders.sort().forEach((folder, index) => {
    const newName = folder.replace(/^202501/, '20251222') + '_corrected';
    const oldPath = path.join(migrationsDir, folder);
    const newPath = path.join(migrationsDir, newName);
    console.log(`Renaming ${folder} to ${newName}`);
    fs.renameSync(oldPath, newPath);
});
