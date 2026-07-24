const fs = require('fs');
const path = require('path');

const dir = 'c:/Users/udayk/Downloads/AntiGravity/ksr-shipping/apps/admin/src/lib';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.ts') && !['api-client.ts', 'utils.ts', 'format.ts', 'validations.ts'].includes(f));

files.forEach(f => {
  const p = path.join(dir, f);
  let content = fs.readFileSync(p, 'utf8');

  // Let's replace the broken pieces from my previous regex
  content = content.replace(/if \(!res\.ok\) \{[\s\S]*?throw new Error\([^\)]+\);\s*\}/g, '');
  content = content.replace(/if \(!res\.ok\) \{[\s\S]*?return \{ items: \[\], total: 0, page: 1, totalPages: 1, unreadCount: 0 \};\s*\}/g, '');
  content = content.replace(/if \(!res\.ok\) \{\s*console\.error\([^)]+\);\s*return null;\s*\}/g, '');
  content = content.replace(/if \(!res\.ok\) throw new Error\([^\)]+\);/g, '');
  content = content.replace(/return res\.json\(\);/g, '');
  content = content.replace(/return await res\.json\(\);/g, '');

  content = content.replace(/const res = await apiFetch/g, 'return await apiFetch');
  content = content.replace(/const response = await apiFetch/g, 'return await apiFetch');

  // Clean up empty lines
  content = content.replace(/\n\s*\n\s*\n/g, '\n\n');

  if (f === 'reports-service.ts' || f === 'notification-service.ts') {
    // Some try/catches need to be simplified
    content = content.replace(/try\s*\{\s*(return await apiFetch[\s\S]*?)\s*\}\s*catch\s*\(err\)\s*\{[\s\S]*?\}/g, '$1');
  }

  fs.writeFileSync(p, content);
});

console.log('Fixed services!');
