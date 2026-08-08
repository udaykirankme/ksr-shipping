const fs = require('fs');

const adminTsPath = './src/server/routes/admin.ts';
let content = fs.readFileSync(adminTsPath, 'utf8');

// 1. Unused err
content = content.replace(/catch \(err\)/g, 'catch');

// 2. Unused _updatedQuote
content = content.replace('const [createdShipment, _updatedQuote] = await prisma.$transaction([createShipmentOp, updateQuoteOp]);', 'const [createdShipment] = await prisma.$transaction([createShipmentOp, updateQuoteOp]);');

// 3. Unused error at 1575, 1591, 1728, 1760, 1782
// Actually, let's just replace all 'catch (error)' with 'catch (error)' and then check if 'error' is used.
// If it's just 'catch (error) { res.status(500)... }'
content = content.replace(/catch \(error\) \{\s*res\.status/g, 'catch {\n    res.status');

// 4. Require import bcrypt
content = content.replace("const bcrypt = require('bcryptjs');\n    ", "");
if (!content.includes("import bcrypt from 'bcryptjs'")) {
  content = `import bcrypt from 'bcryptjs';\n` + content;
}

fs.writeFileSync(adminTsPath, content, 'utf8');
console.log('Fixed admin.ts');

const publicTsPath = './src/server/routes/public.ts';
let publicContent = fs.readFileSync(publicTsPath, 'utf8');
publicContent = publicContent.replace('const { official_tracking_id, shipment_type, ...data } = req.body;', 'const { official_tracking_id, shipment_type: _shipment_type, ...data } = req.body;');
fs.writeFileSync(publicTsPath, publicContent, 'utf8');
console.log('Fixed public.ts');
