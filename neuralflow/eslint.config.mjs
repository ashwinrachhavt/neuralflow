import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  // Next.js recommended rules + TypeScript support
  ...compat.extends(
    "next/core-web-vitals",
    "next/typescript",
    // TypeScript rules
    "plugin:@typescript-eslint/recommended",
    // Disable ESLint rules that would conflict with Prettier formatting
    "prettier",
  ),
];

export default eslintConfig;
