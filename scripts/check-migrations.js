
const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, '../prisma/schema.prisma');
const migrationsPath = path.join(__dirname, '../prisma/migrations');

const schemaContent = fs.readFileSync(schemaPath, 'utf8');
const migrationFiles = fs.readdirSync(migrationsPath, { recursive: true })
    .filter(f => f.endsWith('.sql'))
    .map(f => fs.readFileSync(path.join(migrationsPath, f), 'utf8'))
    .join('\n');

const models = {};
let currentModel = null;

schemaContent.split('\n').forEach(line => {
    const modelMatch = line.match(/^model (\w+) \{/);
    if (modelMatch) {
        currentModel = modelMatch[1];
        models[currentModel] = [];
    } else if (line.match(/^\s+\}/)) {
        currentModel = null;
    } else if (currentModel) {
        const fieldMatch = line.match(/^\s+(\w+)\s+/);
        if (fieldMatch) {
            models[currentModel].push(fieldMatch[1]);
        }
    }
});

console.log('Fields missing from migrations:');
Object.entries(models).forEach(([model, fields]) => {
    fields.forEach(field => {
        if (!migrationFiles.includes(field) && !['id', 'createdAt', 'updatedAt'].includes(field)) {
            // This is a naive check as the field name might be common, but it's a start
            // Better check: look for "ADD COLUMN" or "CREATE TABLE" with the field name
            const fieldRegex = new RegExp(`ADD COLUMN\\s+"${field}"|\\("${field}"\\s+`, 'i');
            if (!fieldRegex.test(migrationFiles)) {
                console.log(`- ${model}.${field}`);
            }
        }
    });
});
