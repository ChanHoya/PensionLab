const { PrismaClient } = require("../src/generated/prisma");
const prisma = new PrismaClient();

async function test() {
  try {
    const contents = await prisma.expertContent.findMany({
      take: 10,
      select: {
        channelName: true,
        videoId: true,
        title: true
      }
    });
    console.log("Database youtube video list:");
    console.log(JSON.stringify(contents, null, 2));
  } catch (error) {
    console.error("Prisma query error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

test();
