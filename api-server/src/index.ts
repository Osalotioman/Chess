import { env } from "./config/env.js";
import { createServer } from "./http/server.js";

async function main() {
  const app = createServer();

  await app.listen({ host: env.HOST, port: env.PORT });

  app.log.info(`API listening on http://${env.HOST}:${env.PORT}`);
}

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(error);
  process.exit(1);
});
