const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
            results.push(file);
        }
    });
    return results;
}

const dirsToCheck = [
    path.join(__dirname, 'apps/web/src/app/admin'),
    path.join(__dirname, 'apps/web/src/components')
];

let files = [];
dirsToCheck.forEach(dir => {
    if (fs.existsSync(dir)) {
        files = files.concat(walk(dir));
    }
});

let changedCount = 0;
files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    const original = content;
    
    content = content.replace(/"\/dashboard/g, '"/admin/dashboard');
    content = content.replace(/`\/dashboard/g, '`/admin/dashboard');
    content = content.replace(/'\/dashboard/g, "'/admin/dashboard");
    
    if (content !== original) {
        fs.writeFileSync(file, content, 'utf8');
        changedCount++;
        console.log('Fixed broken link in:', file);
    }
});
console.log('Total files fixed:', changedCount);
