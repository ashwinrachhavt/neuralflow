#!/usr/bin/env node
const { ESLint } = await import("eslint");
import { fileURLToPath } from "node:url";
import path from "node:path";
import process from "node:process";

const args = process.argv.slice(2);
const shouldFix = args.includes("--fix");
const targets = args.filter((arg) => arg !== "--fix");

const cwd = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const defaultTargets = ["."];
const patterns = targets.length ? targets : defaultTargets;

const eslint = new ESLint({
  cwd,
  overrideConfigFile: path.join(cwd, "eslint.config.mjs"),
  fix: shouldFix,
});

const results = await eslint.lintFiles(patterns);

if (shouldFix) {
  await ESLint.outputFixes(results);
}

const formatter = await eslint.loadFormatter("stylish");
const output = formatter.format(results);

if (output) {
  console.log(output);
}

const errorCount = results.reduce((sum, result) => sum + result.errorCount, 0);
process.exitCode = errorCount > 0 ? 1 : 0;
