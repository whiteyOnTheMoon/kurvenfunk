import { createPrismaClient } from "../src/client.js";

const prisma = createPrismaClient();

async function main() {
  console.log("Kurvenfunk database seed: no seed data defined yet.");
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
