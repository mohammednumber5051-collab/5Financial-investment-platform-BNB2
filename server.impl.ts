import express from "express";
import cors from "cors";
import path from "path";
import apiRouter from "./artifacts/api-server/src/routes/index";
import { logger } from "./artifacts/api-server/src/lib/logger";
import pinoHttp from "pino-http";

if (typeof process.loadEnvFile === "function") {
  try {
    process.loadEnvFile();
  } catch {
    // .env is optional
  }
}

const app = express();
const portArg = process.argv.indexOf("--port") !== -1 ? Number(process.argv[process.argv.indexOf("--port") + 1]) : 3000;
const port = (portArg && !isNaN(portArg)) ? portArg : (Number(process.env.PORT) || 3000);
const isProduction = process.env.NODE_ENV === "production";
const basePath = process.env.BASE_PATH || "/financial-platform/";
const normalizedBase = basePath.endsWith("/") ? basePath.slice(0, -1) : basePath;

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Healthcheck endpoints for Cloud Run and ingress probes
app.get("/healthz", (_req, res) => res.json({ status: "ok" }));
app.get("/api/healthz", (_req, res) => res.json({ status: "ok" }));
if (normalizedBase && normalizedBase !== "") {
  app.get(`${normalizedBase}/healthz`, (_req, res) => res.json({ status: "ok" }));
  app.get(`${normalizedBase}/api/healthz`, (_req, res) => res.json({ status: "ok" }));
}

// Mount API routes under /api and ${basePath}/api
app.use("/api", apiRouter);
if (normalizedBase && normalizedBase !== "") {
  app.use(`${normalizedBase}/api`, apiRouter);
}

// Redirect root "/" and exact base without slash to "/financial-platform/"
if (normalizedBase && normalizedBase !== "") {
  app.get(/^\/$/, (_req, res) => {
    res.redirect(`${normalizedBase}/`);
  });
  app.get(new RegExp(`^${normalizedBase}$`), (_req, res) => {
    res.redirect(`${normalizedBase}/`);
  });
  app.get(/^\/client\/([^/]+)\/?$/, (req, res) => {
    res.redirect(`${normalizedBase}/client/${req.params[0]}`);
  });
}

async function startServer() {
  if (!isProduction) {
    const { createServer } = await import("vite");
    const vite = await createServer({
      configFile: path.resolve(process.cwd(), "artifacts/financial-platform/vite.config.ts"),
      base: basePath,
      server: {
        middlewareMode: true,
        host: "0.0.0.0",
        hmr: {
          overlay: false,
        },
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const staticDir = path.resolve(process.cwd(), "artifacts/financial-platform/dist/public");
    if (normalizedBase && normalizedBase !== "") {
      app.use(normalizedBase, express.static(staticDir));
      // In Express 5, splat parameters must have a name, e.g. {*splat}
      app.get(`${normalizedBase}/{*splat}`, (_req, res) => {
        res.sendFile(path.resolve(staticDir, "index.html"));
      });
    }
    app.use(express.static(staticDir));
    app.get("{*splat}", (_req, res) => {
      res.sendFile(path.resolve(staticDir, "index.html"));
    });
  }

  app.listen(port, "0.0.0.0", () => {
    logger.info({ port, basePath, isProduction, logLevel: process.env.LOG_LEVEL || "info" }, `Server listening on 0.0.0.0:${port} with base ${basePath}`);
  });
}

startServer().catch((err) => {
  logger.error({ err }, "Failed to start server");
  process.exit(1);
});
