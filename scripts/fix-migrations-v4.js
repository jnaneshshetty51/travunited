
const fs = require('fs');
const path = require('path');

const migrationsDir = path.join(__dirname, '../prisma/migrations');
const folders = fs.readdirSync(migrationsDir)
    .filter(f => fs.statSync(path.join(migrationsDir, f)).isDirectory())
    .sort();

// Applied migrations (do not rename)
const applied = [
    '20251116053233_add_reviews_audit_settings',
    '20251116070738_add_blog_posts',
    '20251116073610_add_payment_relations',
    '20251116191043_cms_models',
    '20251120185544_add_tour_fields',
    '20251121000000_align_visa_with_csv_template',
    '20251121034905_add_notifications'
];

folders.forEach((folder, index) => {
    if (applied.includes(folder)) return;

    // Create a unique 14-digit timestamp
    // Base it on the year/month but append a sequence
    const timestamp = '20251222' + String(index).padStart(6, '0');
    const newName = timestamp + folder.substring(folder.indexOf('_'));
    const oldPath = path.join(migrationsDir, folder);
    const newPath = path.join(migrationsDir, newName);

    console.log(`Renaming ${folder} to ${newName}`);
    fs.renameSync(oldPath, newPath);
});
