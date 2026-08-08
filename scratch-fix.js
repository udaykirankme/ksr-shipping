const fs = require('fs');
const path = require('path');

function walk(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    const dirPath = path.join(dir, f);
    const isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walk(dirPath, callback) : callback(path.join(dir, f));
  });
}

walk('./src', (filePath) => {
  if (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;

    // Fix catches
    const catchRegex1 = /catch\s*\(\s*error\s*:\s*any\s*\)/g;
    if (catchRegex1.test(content)) {
      content = content.replace(catchRegex1, 'catch (error: unknown)');
      changed = true;
    }
    
    const catchRegex2 = /catch\s*\(\s*err\s*:\s*any\s*\)/g;
    if (catchRegex2.test(content)) {
      content = content.replace(catchRegex2, 'catch (err: unknown)');
      changed = true;
    }
    
    const catchRegex3 = /catch\s*\(\s*e\s*:\s*any\s*\)/g;
    if (catchRegex3.test(content)) {
      content = content.replace(catchRegex3, 'catch (e: unknown)');
      changed = true;
    }

    if (changed) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log('Fixed catches in', filePath);
    }
  }
});
