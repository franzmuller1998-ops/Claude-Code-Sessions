// Тестовые данные: один репетитор и один ученик со ссылкой-приглашением.
// Запуск: npm run seed
import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { generateLinkToken, inviteLink } from "@/lib/tokens";

async function main() {
  const email = "demo@example.com";
  const password = "password";

  const tutor = await prisma.tutor.upsert({
    where: { email },
    update: {},
    create: {
      name: "Демо Репетитор",
      email,
      passwordHash: await bcrypt.hash(password, 10),
      timezone: "Europe/Moscow",
    },
  });

  let student = await prisma.student.findFirst({
    where: { tutorId: tutor.id, name: "Демо Ученик" },
  });
  if (!student) {
    student = await prisma.student.create({
      data: {
        tutorId: tutor.id,
        name: "Демо Ученик",
        subject: "Математика",
        timezone: "Europe/Moscow",
        linkToken: generateLinkToken(),
      },
    });
  }

  console.log("\n✅ Сид готов.");
  console.log("   Вход в кабинет:");
  console.log(`     email:  ${email}`);
  console.log(`     пароль: ${password}`);
  if (student.linkToken) {
    console.log("\n   Ссылка-приглашение ученика в Telegram:");
    console.log(`     ${inviteLink(student.linkToken)}`);
  }
  console.log("");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
