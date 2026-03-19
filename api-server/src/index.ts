import { env } from "./config/env";
import { prisma } from "./db/prisma";
import { createServer } from "./http/server";

async function main() {
  const app = createServer();

  await prisma.$connect();

  await app.listen({ host: env.HOST, port: env.PORT });

  app.log.info(`API listening on http://${env.HOST}:${env.PORT}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
