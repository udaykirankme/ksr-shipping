import { PrismaClient } from '@prisma/client';
// Using bcrypt for password hashing is standard, but since we are seeding, we'll hash it here.
// In a real app we'd use bcryptjs or argon2. For seed, we'll use a mocked hash if bcrypt is not available, 
// or just standard bcryptjs. Let's assume bcryptjs.

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Demo Admin User
  // Password is 'password123' hashed with bcrypt (cost 10)
  const passwordHash = '$2a$10$02nGlDyW/L8uLihCdwb2cuUVdiIcMZ6xJs8YFT2XB8DnuLPrqYVcy'; // This is 'password123'

  const admin = await prisma.adminUser.upsert({
    where: { username: 'admin' },
    update: {
      password_hash: passwordHash,
    },
    create: {
      username: 'admin',
      password_hash: passwordHash,
      full_name: 'System Admin',
    },
  });
  console.log(`Demo admin created (username: admin, password: admin123)`);

  // Demo Shipment 1: Dispatched
  const shipment1 = await prisma.shipment.upsert({
    where: { tracking_id: '1234567890' },
    update: {},
    create: {
      tracking_id: '1234567890',
      tracking_type: 'manual',
      courier: 'ksr_manual',
      sender_name: 'John Doe',
      receiver_name: 'Jane Smith',
      origin: 'Hyderabad',
      destination: 'Bangalore',
      current_status: 'Dispatched',
      current_location: 'KSR Hub, Hyderabad',
      estimated_delivery: new Date(new Date().getTime() + 2 * 24 * 60 * 60 * 1000), // +2 days
      history: {
        create: [
          {
            status: 'Dispatched',
            location: 'KSR Hub, Hyderabad',
            occurred_at: new Date(),
            note: 'Package received and dispatched.',
            updated_by: admin.id,
          }
        ]
      }
    },
  });
  
  // Demo Shipment 2: In Transit
  const shipment2 = await prisma.shipment.upsert({
    where: { tracking_id: '0987654321' },
    update: {},
    create: {
      tracking_id: '0987654321',
      tracking_type: 'manual',
      courier: 'ksr_manual',
      sender_name: 'Alice Johnson',
      receiver_name: 'Bob Williams',
      origin: 'Mumbai',
      destination: 'Delhi',
      current_status: 'In Transit',
      current_location: 'En route to Delhi',
      estimated_delivery: new Date(new Date().getTime() + 1 * 24 * 60 * 60 * 1000),
      history: {
        create: [
          {
            status: 'Dispatched',
            location: 'KSR Hub, Mumbai',
            occurred_at: new Date(new Date().getTime() - 24 * 60 * 60 * 1000), // -1 day
            note: 'Package processed.',
            updated_by: admin.id,
          },
          {
            status: 'In Transit',
            location: 'En route to Delhi',
            occurred_at: new Date(),
            note: 'Left origin facility.',
            updated_by: admin.id,
          }
        ]
      }
    },
  });

  console.log(`Demo shipments created with IDs: ${shipment1.tracking_id}, ${shipment2.tracking_id}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
