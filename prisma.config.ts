import { defineConfig } from "@prisma/config";
import path from "path";
import dotenv from "dotenv";

// Ensure environment variables (e.g., DATABASE_URL) are loaded
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

export default defineConfig({
  schema: "./prisma/schema.prisma",
  migrations: {
    // Keep the same seed command previously defined in package.json#prisma
    seed: "ts-node --transpile-only --project tsconfig.prisma-seed.json prisma/seed.ts",
  },
});
