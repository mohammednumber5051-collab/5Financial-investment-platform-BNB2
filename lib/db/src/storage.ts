import fs from "fs";
import path from "path";
import { getInitialSeedData } from "./seedData";

// Resolve storage file path in project root `data/dev_database.json`
function getStoragePath(): string {
  const customPath = process.env.DATABASE_STORAGE_PATH;
  if (customPath) return customPath;

  const cwd = process.cwd();
  const dir = path.resolve(cwd, "data");
  if (!fs.existsSync(dir)) {
    try {
      fs.mkdirSync(dir, { recursive: true });
    } catch {
      // Fallback if permission error
    }
  }
  return path.resolve(dir, "dev_database.json");
}

let inMemoryStore: Record<string, any[]> | null = null;
let saveTimer: NodeJS.Timeout | null = null;

function convertDates(obj: any): any {
  if (!obj || typeof obj !== "object") return obj;
  if (Array.isArray(obj)) return obj.map(convertDates);

  const copy = { ...obj };
  const dateKeys = [
    "createdAt",
    "updatedAt",
    "withdrawalFeePaidAt",
    "liberationFeePaidAt",
    "transactionFeePaidAt",
    "paidAt",
  ];

  for (const key of dateKeys) {
    if (copy[key] && typeof copy[key] === "string") {
      const parsed = new Date(copy[key]);
      if (!isNaN(parsed.getTime())) {
        copy[key] = parsed;
      }
    }
  }
  return copy;
}

export function loadDatabase(): Record<string, any[]> {
  if (inMemoryStore) {
    return inMemoryStore;
  }

  const filePath = getStoragePath();
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, "utf-8");
      const parsed = JSON.parse(content);
      if (parsed && typeof parsed === "object" && parsed.beneficiaries && parsed.admins) {
        // Ensure all required collections exist
        const initial = getInitialSeedData();
        for (const [key, defaultList] of Object.entries(initial)) {
          if (!Array.isArray(parsed[key])) {
            parsed[key] = defaultList;
          }
        }
        inMemoryStore = convertDates(parsed);
        console.info(`[AI Studio Database] Loaded existing database from ${filePath}`);
        return inMemoryStore!;
      }
    }
  } catch (err) {
    console.warn("[AI Studio Database] Warning loading database file, re-initializing:", err);
  }

  // Initialize fresh comprehensive seed data
  const initialData = getInitialSeedData();
  inMemoryStore = convertDates(initialData);

  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(inMemoryStore, null, 2), "utf-8");
    console.info(`[AI Studio Database] Initialized comprehensive development database at ${filePath}`);
  } catch (err) {
    console.warn("[AI Studio Database] Warning writing initial database file:", err);
  }

  return inMemoryStore!;
}

export function saveDatabase(immediate = false): void {
  if (!inMemoryStore) return;

  const persist = () => {
    try {
      const filePath = getStoragePath();
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(filePath, JSON.stringify(inMemoryStore, null, 2), "utf-8");
    } catch (err) {
      console.error("[AI Studio Database] Failed to write database to disk:", err);
    }
  };

  if (immediate) {
    if (saveTimer) {
      clearTimeout(saveTimer);
      saveTimer = null;
    }
    persist();
  } else {
    if (!saveTimer) {
      saveTimer = setTimeout(() => {
        saveTimer = null;
        persist();
      }, 100);
    }
  }
}

export function resetDatabase(): Record<string, any[]> {
  const initialData = getInitialSeedData();
  inMemoryStore = convertDates(initialData);
  saveDatabase(true);
  console.info("[AI Studio Database] Database successfully reset to pristine seed state");
  return inMemoryStore!;
}
