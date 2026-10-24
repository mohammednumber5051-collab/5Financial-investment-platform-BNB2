import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const distServer = resolve(process.cwd(), "dist/server.js");
const implServerJs = resolve(process.cwd(), "server.impl.js");

if (process.env.NODE_ENV === "production" && existsSync(distServer)) {
  await import(pathToFileURL(distServer).href);
} else if (existsSync(resolve(process.cwd(), "server.impl.ts"))) {
  await import(pathToFileURL(resolve(process.cwd(), "server.impl.ts")).href);
} else if (existsSync(distServer)) {
  await import(pathToFileURL(distServer).href);
} else if (existsSync(implServerJs)) {
  await import(pathToFileURL(implServerJs).href);
}
