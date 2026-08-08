import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
async function run() {
  const hash = await bcrypt.hash('admin123', 10);
  await prisma.adminUser.upsert({
    where: { username: 'admin' },
    update: { password_hash: hash },
    create: {
      username: 'admin',
      password_hash: hash,
      full_name: 'Test Admin',
      email: 'test@admin.com',
      mobile_number: '1234567890',
      role: 'admin'
    }
  });
  console.log('Created admin test user');
}
run();
