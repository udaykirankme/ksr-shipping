import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function run() {
    try {
        const data = {
            name: "John Doe",
            phone: "1234567890",
            email: "john@example.com",
            message: "Hello",
            contact_id: "KSRC1234567890"
        };
        const res = await prisma.contactSubmission.create({ data });
        console.log(res);
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}
run();
