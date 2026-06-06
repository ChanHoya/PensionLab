import { prisma } from "../config/db";

async function main() {
  console.log("Starting DB connection test...");
  
  // 1. Create a test user
  console.log("Creating test user...");
  const testUser = await prisma.user.create({
    data: {
      email: "test-user@pensionlab.com",
      name: "Test User",
      onboardingCompleted: false,
    },
  });
  console.log("Created User:", testUser);

  // 2. Fetch the created user
  console.log("Fetching user...");
  const fetchedUser = await prisma.user.findUnique({
    where: { id: testUser.id },
  });
  console.log("Fetched User:", fetchedUser);

  // 3. Clean up (delete user)
  console.log("Cleaning up test user...");
  await prisma.user.delete({
    where: { id: testUser.id },
  });
  console.log("Cleanup complete!");
  
  console.log("Database connection test PASSED!");
}

main()
  .catch((e) => {
    console.error("Database connection test FAILED:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
