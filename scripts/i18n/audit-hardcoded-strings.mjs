#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const repoRoot = process.cwd();
const allowlistPath = path.join(
  repoRoot,
  "scripts/i18n/hardcoded-string-allowlist.json",
);
const allowlist = JSON.parse(fs.readFileSync(allowlistPath, "utf8"));

const scanRoots = ["apps", "packages"];
const sourceExtensions = new Set([".ts", ".tsx"]);
const ignoreLiteralSet = new Set(allowlist.ignoreLiterals);
const ignoreLiteralPatterns = allowlist.ignoreLiteralPatterns.map(
  (pattern) => new RegExp(pattern),
);

const detectors = [
  {
    kind: "jsx-text",
    pattern: />\s*([^<>{}\n]+)\s*</g,
  },
  {
    kind: "prop",
    pattern:
      /\b(?:aria-label|title|placeholder|label|description)=["']([^"']+)["']/g,
  },
  {
    kind: "toast",
    pattern:
      /\b(?:toast|showToast)\.(?:success|error|warning|info)\(\s*["'`]([^"'`]+)["'`]/g,
  },
];

function shouldIgnoreFile(filePath) {
  const normalized = filePath.split(path.sep).join("/");
  return allowlist.ignoreFiles.some((entry) => normalized.includes(entry));
}

function shouldIgnoreLiteral(literal) {
  const value = literal.trim();
  if (!value) return true;
  if (ignoreLiteralSet.has(value)) return true;
  if (!/[A-Za-z\u0900-\u097F]/.test(value)) return true;
  if (/^[{}()[\].,;:!?'"`|&+\-*/\\\s]+$/.test(value)) return true;
  if (/^\d+([.,:]\d+)*%?$/.test(value)) return true;
  return ignoreLiteralPatterns.some((pattern) => pattern.test(value));
}

function walk(dir, files = []) {
  if (!fs.existsSync(dir)) return files;

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (!shouldIgnoreFile(fullPath)) walk(fullPath, files);
      continue;
    }

    if (
      sourceExtensions.has(path.extname(entry.name)) &&
      !shouldIgnoreFile(fullPath)
    ) {
      files.push(fullPath);
    }
  }

  return files;
}

function lineForOffset(contents, offset) {
  return contents.slice(0, offset).split("\n").length;
}

const findings = [];

for (const root of scanRoots) {
  for (const filePath of walk(path.join(repoRoot, root))) {
    const contents = fs.readFileSync(filePath, "utf8");
    const relativePath = path.relative(repoRoot, filePath);

    for (const detector of detectors) {
      for (const match of contents.matchAll(detector.pattern)) {
        const literal = match[1]?.replace(/\s+/g, " ").trim();
        if (!literal || shouldIgnoreLiteral(literal)) continue;

        findings.push({
          file: relativePath,
          line: lineForOffset(contents, match.index ?? 0),
          kind: detector.kind,
          literal,
        });
      }
    }
  }
}

const byPackage = new Map();
for (const finding of findings) {
  const [scope, name] = finding.file.split("/");
  const bucket =
    scope === "apps" || scope === "packages" ? `${scope}/${name}` : scope;
  byPackage.set(bucket, (byPackage.get(bucket) ?? 0) + 1);
}

console.log("Hardcoded i18n audit baseline");
console.log("=============================");
console.log(`Findings: ${findings.length}`);

for (const [bucket, count] of [...byPackage.entries()].sort(([a], [b]) =>
  a.localeCompare(b),
)) {
  console.log(`${bucket}: ${count}`);
}

const sampleLimit = Number(process.env.I18N_AUDIT_SAMPLE_LIMIT ?? 40);
if (sampleLimit > 0 && findings.length > 0) {
  console.log("\nSample findings:");
  for (const finding of findings.slice(0, sampleLimit)) {
    console.log(
      `${finding.file}:${finding.line} [${finding.kind}] ${finding.literal}`,
    );
  }
}

console.log(
  "\nBaseline mode exits 0. Ratchet mode will be added after the first localization sweeps.",
);
