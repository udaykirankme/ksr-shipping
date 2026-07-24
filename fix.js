const fs = require('fs');
const path = require('path');
const dir = 'c:/Users/udayk/Downloads/AntiGravity/ksr-shipping/apps/admin/src/lib';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.ts') && f !== 'auth-service.ts' && f !== 'api-client.ts' && f !== 'utils.ts' && f !== 'format.ts' && f !== 'validations');
files.forEach(f => {
  const p = path.join(dir, f);
  let content = fs.readFileSync(p, 'utf8');
  if (!content.includes('import { apiFetch }')) {
    content = "import { apiFetch } from './api-client';\n" + content;
  }
  content = content.replace(/await fetch\(/g, 'await apiFetch(');
  content = content.replace(/const res = fetch\(/g, 'const res = apiFetch(');
  
  // Also remove the local 401 handling
  content = content.replace(/if\s*\(\s*res\.status\s*===\s*401\s*\)\s*\{[\s\S]*?return\s*\{[\s\S]*?\};\s*\}/g, '');
  content = content.replace(/if\s*\(\s*res\.status\s*===\s*401\s*\)\s*\{[\s\S]*?window\.location\.href\s*=\s*'\/login';[\s\S]*?\}/g, '');
  
  fs.writeFileSync(p, content);
});
console.log('Done!');
