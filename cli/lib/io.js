import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ALIAS_FILE = path.resolve(
  process.env.HOME || process.env.USERPROFILE,
  ".cmdlib",
  "aliases.json"
);

export function loadAliases() {
  if (!fs.existsSync(ALIAS_FILE)) return [];
  const data = fs.readFileSync(ALIAS_FILE, "utf8");
  return JSON.parse(data);
}

export function saveAliases(aliases) {
  fs.mkdirSync(path.dirname(ALIAS_FILE), { recursive: true });
  fs.writeFileSync(ALIAS_FILE, JSON.stringify(aliases, null, 2));
}
