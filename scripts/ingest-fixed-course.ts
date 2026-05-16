import { ingestFixedCourse } from "../src/lib/ingestion/ingest-fixed-course";
import { prisma } from "../src/lib/db/prisma";

async function main() {
  const result = await ingestFixedCourse();
  console.log(JSON.stringify(result, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
