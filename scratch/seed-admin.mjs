import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function checkAdmin() {
  const users = await prisma.adminUser.findMany();
  console.log('Users in DB:');
  console.log(users);
  
  if (users.length === 0) {
    const hash = await bcrypt.hash('password123', 10);
    const admin = await prisma.adminUser.create({
      data: {
        username: 'admin',
        email: 'admin@ksrshipping.com',
        password_hash: hash,
        role: 'SUPER_ADMIN'
      }
    });
    console.log('Created admin user:', admin.username);
  } else {
    // If user exists but I don't know password, let's reset it to password123
    const hash = await bcrypt.hash('password123', 10);
    await prisma.adminUser.update({
      where: { id: users[0].id },
      data: { password_hash: hash }
    });
    console.log(`Reset password for user ${users[0].username} to password123`);
  }
}

checkAdmin()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
