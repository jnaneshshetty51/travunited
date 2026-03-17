
const fs = require('fs');
const path = require('path');

const migrationsDir = path.join(__dirname, '../prisma/migrations');
const folders = fs.readdirSync(migrationsDir).filter(f => f.startsWith('20251222'));

folders.sort().forEach((folder, index) => {
    // Current name is eg 2025122221120000_... (16 digits)
    // We want 20251222000000 + index
    const seq = String(index).padStart(6, '0');
    const newName = `20251222${seq}_` + folder.split('_').slice(1).join('_');
    const oldPath = path.join(migrationsDir, folder);
    const newPath = path.join(migrationsDir, newName);
    console.log(`Renaming ${folder} to ${newName}`);
    fs.renameSync(oldPath, newPath);
});
