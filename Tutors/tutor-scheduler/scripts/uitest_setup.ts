import "dotenv/config";
import { prisma } from "@/lib/prisma";

async function main() {
  const tutor = await prisma.tutor.findUniqueOrThrow({ where: { email: "demo@example.com" } });
  // убираем прежних демо-учеников, чтобы тест был чистым
  await prisma.student.deleteMany({ where: { tutorId: tutor.id } });
  const s = await prisma.student.create({
    data: { tutorId: tutor.id, name: "Тест UI (без TG)", subject: "Физика", timezone: tutor.timezone },
  });
  console.log("OK student:", s.id);
}
main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
