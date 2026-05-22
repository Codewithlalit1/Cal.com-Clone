import "dotenv/config";
import { prisma } from "./src/lib/prisma.js";

async function run() {
  try {
    const result = await prisma.$queryRawUnsafe("SELECT 1 as result");
    console.log("Success:", result);
  } catch (err) {
    console.error("Failed:", err);
  }
}
run();
