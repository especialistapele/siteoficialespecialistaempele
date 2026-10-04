import { readFileSync, readdirSync, statSync, mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { join, extname } from "node:path";
import { tmpdir } from "node:os";
import { execFileSync } from "node:child_process";

const roots = ["painel", "admin", "blog", "resultados", "tratamentos"];
const htmls = [];
function walk(dir) {
  let entries;
  try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return; }
  for (const entry of entries) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) walk(path);
    else if (entry.isFile() && extname(entry.name).toLowerCase() === ".html") htmls.push(path);
  }
}
for (const root of roots) walk(root);

const temp = mkdtempSync(join(tmpdir(), "inline-js-check-"));
const failures = [];
let checked = 0;

try {
  for (const file of htmls) {
    const html = readFileSync(file, "utf8");
    const re = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
    let match;
    let index = 0;
    while ((match = re.exec(html))) {
      if (/\bsrc\s*=/i.test(match[1])) continue;
      const type = /\btype\s*=\s*["']module["']/i.test(match[1]) ? "mjs" : "js";
      const tempFile = join(temp, `${file.replace(/[^a-z0-9]+/gi, "_")}_${index++}.${type}`);
      writeFileSync(tempFile, match[2], "utf8");
      checked++;
      try {
        execFileSync(process.execPath, ["--check", tempFile], { stdio: "pipe" });
      } catch (error) {
        failures.push(`${file}: script inline #${index}\n${String(error.stderr || error.stdout || error.message).trim()}`);
      }
    }
  }
} finally {
  rmSync(temp, { recursive: true, force: true });
}

console.log(`Validação de JavaScript inline: ${checked} bloco(s) verificado(s).`);
if (failures.length) {
  console.error("\nERROS DE SINTAXE:");
  failures.forEach((item) => console.error(item + "\n"));
  process.exit(1);
}
