import http from "node:http";

import { applyCors, handleCorsPreflight } from "./cors";

type HealthStats = {
  rooms: number;
  clients: number;
};

export function createHttpServer(getHealthStats: () => HealthStats): http.Server {
  return http.createServer((req, res) => {
    if (handleCorsPreflight(req, res)) {
      return;
    }

    applyCors(req, res);

    if (req.url === "/health") {
      const stats = getHealthStats();
      res.writeHead(200, { "content-type": "application/json" });
      res.end(
        JSON.stringify({
          ok: true,
          uptimeSec: Math.round(process.uptime()),
          rooms: stats.rooms,
          clients: stats.clients,
        })
      );
      return;
    }

    res.writeHead(200, { "content-type": "text/plain" });
    res.end("OK\\n");
  });
}
