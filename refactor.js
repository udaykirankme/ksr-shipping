const fs = require('fs');
const path = require('path');

const dir = 'c:/Users/udayk/Downloads/AntiGravity/ksr-shipping/apps/admin/src/lib';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.ts') && f !== 'api-client.ts' && f !== 'utils.ts' && f !== 'format.ts' && f !== 'validations');

files.forEach(f => {
  const p = path.join(dir, f);
  let content = fs.readFileSync(p, 'utf8');

  // Replace `const res = await apiFetch(...)` followed by `if (!res.ok)...` and `return res.json()`
  
  // Regex to match the boilerplate:
  // 1. `const res = await apiFetch(...);`
  // 2. Optional `if (!res.ok) { ... }` or `if (!res.ok) throw ...`
  // 3. `return res.json();` or similar
  
  // Actually, since apiFetch now throws internally and returns json,
  // we can just replace:
  // `const res = await apiFetch` -> `return apiFetch`
  // And remove everything else until the end of the block. But wait, some have `try/catch` and return null on catch.
  
  // Let's just do manual string replacements for the known patterns.
  
  // Pattern 1:
  // const res = await apiFetch(...);
  // if (!res.ok) throw new Error(...);
  // return res.json();
  // -> return apiFetch(...)
  content = content.replace(/const res = await apiFetch\((.*?)\);\s*if \(!res\.ok\) throw new Error\(.*?\);\s*return res\.json\(\);/gs, "return apiFetch($1);");
  
  // Pattern 2:
  // const res = await apiFetch(...);
  // if (!res.ok) { ... throw new Error(...) }
  // return res.json();
  content = content.replace(/const res = await apiFetch\((.*?)\);\s*if \(!res\.ok\) \{\s*const err = await res\.json\(\);\s*throw new Error\(.*?\);\s*\}\s*return res\.json\(\);/gs, "return apiFetch($1);");
  
  // Pattern 3 (for text):
  // const res = await apiFetch(...);
  // if (!res.ok) throw new Error(await res.text());
  // return res.json();
  content = content.replace(/const res = await apiFetch\((.*?)\);\s*if \(!res\.ok\) throw new Error\(await res\.text\(\)\);\s*return res\.json\(\);/gs, "return apiFetch($1);");

  // Pattern 4 (Try catch returning null in reports-service):
  // try { const res = await apiFetch(...); if (!res.ok) { ... return null; } return res.json(); } catch (err) { ... return null; }
  
  // For auth-service, pass skipAuthRedirect: true
  if (f === 'auth-service.ts') {
    content = content.replace(/await apiFetch\((.*?)\)/g, (match, p1) => {
      if (p1.includes('{')) {
        return `await apiFetch(${p1.replace('{', '{ skipAuthRedirect: true, ')}`;
      } else {
        return `await apiFetch(${p1}, { skipAuthRedirect: true })`;
      }
    });
  }

  fs.writeFileSync(p, content);
});

console.log('Script finished. Need manual review of files.');
