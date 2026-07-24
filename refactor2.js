const fs = require('fs');
const path = require('path');

const dir = 'c:/Users/udayk/Downloads/AntiGravity/ksr-shipping/apps/admin/src/lib';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.ts') && !['api-client.ts', 'utils.ts', 'format.ts', 'validations'].includes(f));

files.forEach(f => {
  const p = path.join(dir, f);
  let content = fs.readFileSync(p, 'utf8');

  // We want to replace `const res = await apiFetch(...)` with `return await apiFetch(...)`
  // And remove everything else in the function body that references `res`.
  
  // Actually, some functions might catch the error and return something else (e.g. notifications returning empty array).
  // The user says: "Do not replace meaningful backend business validation messages with generic frontend messages."
  // Which I did in api-client.ts.
  
  // It is probably best to manually review the files or write a more precise script.
  // Let me just restore the original files from git and do it cleanly.
