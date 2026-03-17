
const fs = require('fs');
const path = require('path');

const migrationsDir = path.join(__dirname, '../prisma/migrations');
const folders = fs.readdirSync(migrationsDir).filter(f => fs.statSync(path.join(migrationsDir, f)).isDirectory());

folders.forEach(folder => {
    const match = folder.match(/^(\d+)_/);
    if (!match) return;
    const timestamp = match[1];
    if (timestamp.length !== 14) {
        let newTimestamp = timestamp;
        if (timestamp.length < 14) {
            newTimestamp = timestamp.padEnd(14, '0');
        } else if (timestamp.length > 14) {
            newTimestamp = timestamp.substring(0, 14);
        }
        const newName = newTimestamp + folder.substring(timestamp.length);
        const oldPath = path.join(migrationsDir, folder);
        const newPath = path.join(migrationsDir, newName);
        console.log(`Renaming invalid timestamp ${folder} to ${newName}`);
        fs.renameSync(oldPath, newPath);
    }
});
