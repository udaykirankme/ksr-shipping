const fs = require('fs');

const adminPath = './src/server/routes/admin.ts';
let adminContent = fs.readFileSync(adminPath, 'utf8');
adminContent = adminContent.replace("const bcrypt = require('bcryptjs');\n    ", "");
fs.writeFileSync(adminPath, adminContent, 'utf8');

const tabs = ['notifications-tab.tsx', 'service-through-tab.tsx', 'services-tab.tsx', 'account-tab.tsx'];
for (const tab of tabs) {
  const filePath = `./src/components/settings/tabs/${tab}`;
  if (!fs.existsSync(filePath)) continue;
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Replace catch (error) with catch if error is unused
  content = content.replace(/catch \(error\)/g, 'catch');

  // Fix hoisting issue by making loadData/loadSettings function declarations
  content = content.replace('const loadData = async () => {', 'async function loadData() {');
  content = content.replace('const loadSettings = async () => {', 'async function loadSettings() {');

  fs.writeFileSync(filePath, content, 'utf8');
}
