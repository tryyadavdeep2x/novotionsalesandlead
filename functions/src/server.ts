import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import os from "os";

dotenv.config();

function getDatabaseUrl(): string {
  const isCloud = Boolean(
    process.env.K_SERVICE || 
    process.env.FUNCTION_NAME
  );

  if (isCloud) {
    const tmpDir = os.tmpdir();
    const tmpDbPath = path.join(tmpDir, "dev.db");
    if (!fs.existsSync(tmpDbPath)) {
      const candidates = [
        path.join(__dirname, "..", "prisma", "dev.db"),
        path.join(__dirname, "..", "dev.db"),
        path.join(process.cwd(), "prisma", "dev.db"),
        path.join(process.cwd(), "dev.db"),
      ];
      const source = candidates.find((p) => fs.existsSync(p));
      if (source) {
        try {
          fs.mkdirSync(tmpDir, { recursive: true });
          fs.copyFileSync(source, tmpDbPath);
          console.log(`[Database] Copied SQLite database to ${tmpDbPath}`);
        } catch (err) {
          console.error("[Database] Failed to copy database to tmp:", err);
        }
      }
    }
    return `file:${tmpDbPath.replace(/\\/g, "/")}`;
  }

  const defaultDb = path.join(__dirname, "..", "prisma", "dev.db");
  return `file:${defaultDb.replace(/\\/g, "/")}`;
}

export const prisma = new PrismaClient({
  datasources: {
    db: {
      url: getDatabaseUrl(),
    },
  },
});
