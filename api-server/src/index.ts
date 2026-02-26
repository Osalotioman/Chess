import { env } from "./config/env.js";
import { prisma } from "./db/prisma.js";
import { createServer } from "./http/server.js";

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
