import bcrypt from "bcrypt";
import { PrismaClient, Role, UserStatus } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
    const email = process.env.ADMIN_EMAIL ?? "admin@gdg.local";
    const password = process.env.ADMIN_PASSWORD ?? "Admin@123";
    const hash = await bcrypt.hash(password, 10);
    await prisma.user.upsert({
        where: { email },
        update: {
            password: hash,
            role: Role.ADMIN,
            status: UserStatus.APPROVED,
        },
        create: {
            email,
            password: hash,
            name: "Event Admin",
            college: "GDG Spectrum",
            role: Role.ADMIN,
            status: UserStatus.APPROVED,
        },
    });
    await prisma.eventState.upsert({
        where: { id: "singleton" },
        update: {},
        create: { id: "singleton", currentRound: 0 },
    });
}
main()
    .then(async () => {
    await prisma.$disconnect();
})
    .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
});
