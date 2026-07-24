const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'server/api/src/routes/admin.ts');
let content = fs.readFileSync(filePath, 'utf8');

// Fix TS7006 implicit any for reduce callbacks
content = content.replace(
  'const monthlyRevenue = financialsThisMonth.reduce((acc, curr) =>',
  'const monthlyRevenue = financialsThisMonth.reduce((acc: number, curr: { received_amount: number | null; profit: number | null; }) =>'
);
content = content.replace(
  'const monthlyProfit = financialsThisMonth.reduce((acc, curr) =>',
  'const monthlyProfit = financialsThisMonth.reduce((acc: number, curr: { received_amount: number | null; profit: number | null; }) =>'
);
content = content.replace(
  'const statusCounts = statusGroups.reduce((acc, curr) =>',
  'const statusCounts = statusGroups.reduce((acc: Record<string, number>, curr: { current_status: string; _count: { _all: number; }; }) =>'
);

// Fix TS7006 and TS2339 for settings reduce and is_secret
content = content.replace(
  'const maskedSettings = settings.reduce((acc, setting) => {',
  'const maskedSettings = (settings as { key: string; value: string; is_secret: boolean; }[]).reduce((acc: Record<string, string>, setting) => {'
);
content = content.replace(
  'const existingSettings = await prisma.systemSetting.findMany({\n      where: { key: { in: keys } }\n    });',
  'const existingSettings = await prisma.systemSetting.findMany({\n      where: { key: { in: keys } }\n    }) as { key: string; value: string; is_secret: boolean; }[];'
);

// Fix explicit `: any` replacements
content = content.replace(
  /const totalRevenue = shipmentsWithProfit\.reduce\(\(acc: number, s: any\) =>/g,
  'const totalRevenue = shipmentsWithProfit.reduce((acc: number, s: { received_amount: number | null; profit: number | null; }) =>'
);
content = content.replace(
  /const totalProfit = shipmentsWithProfit\.reduce\(\(acc: number, s: any\) =>/g,
  'const totalProfit = shipmentsWithProfit.reduce((acc: number, s: { received_amount: number | null; profit: number | null; }) =>'
);

content = content.replace(
  /shipmentsWithProfit\.forEach\(\(s: any\) =>/g,
  'shipmentsWithProfit.forEach((s: { booked_date?: Date | null; received_amount?: number | null; profit?: number | null; }) =>'
);

content = content.replace(
  /contactsByStatus\.find\(\(c: any\) => c\.responded\)/g,
  'contactsByStatus.find((c: { responded: boolean; _count: { _all: number; } }) => c.responded)'
);
content = content.replace(
  /contactsByStatus\.find\(\(c: any\) => !c\.responded\)/g,
  'contactsByStatus.find((c: { responded: boolean; _count: { _all: number; } }) => !c.responded)'
);

content = content.replace(
  /contactsTimeSeriesRaw\.forEach\(\(c: any\) =>/g,
  'contactsTimeSeriesRaw.forEach((c: { created_at: Date; }) =>'
);

content = content.replace(
  /shipmentStatusGroup\.map\(\(g: any\) =>/g,
  'shipmentStatusGroup.map((g: { current_status: string; _count: { _all: number; } }) =>'
);
content = content.replace(
  /shipmentCourierGroup\.map\(\(g: any\) =>/g,
  'shipmentCourierGroup.map((g: { courier: string | null; _count: { _all: number; } }) =>'
);
content = content.replace(
  /shipmentServiceGroup\.map\(\(g: any\) =>/g,
  'shipmentServiceGroup.map((g: { service: string | null; _count: { _all: number; } }) =>'
);
content = content.replace(
  /shipmentTypeGroup\.map\(\(g: any\) =>/g,
  'shipmentTypeGroup.map((g: { tracking_type: string; _count: { _all: number; } }) =>'
);
content = content.replace(
  /notificationsByType\.map\(\(g: any\) =>/g,
  'notificationsByType.map((g: { type: string; _count: { _all: number; } }) =>'
);

// Let's replace `let where: any = {};` with `let where: Record<string, unknown> = {};`
content = content.replace(/let where: any = {};/g, 'let where: Record<string, unknown> = {};');
content = content.replace(/const updateData: any = {};/g, 'const updateData: Record<string, unknown> = {};');
content = content.replace(/const updateData: any = {/g, 'const updateData: Record<string, unknown> = {');
content = content.replace(/const dataToUpdate: any = {/g, 'const dataToUpdate: Record<string, unknown> = {');

content = content.replace(
  /const transaction = items\.map\(\(item: any\) =>/g,
  'const transaction = items.map((item: { id: string; display_order: number; }) =>'
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed TypeScript errors in admin.ts');
