import fs from "fs";
import chalk from "chalk";
import { loadAliases, saveAliases } from "../lib/io.js";

export function importCommands(filename) {
  if (!fs.existsSync(filename)) {
    console.log(chalk.magenta("→"), chalk.red("File not found: " + filename));
    process.exit(1);
  }
  const data = fs.readFileSync(filename, "utf8");
  const imported = JSON.parse(data);
  const current = loadAliases();
  saveAliases([...current, ...imported]);
  console.log(
    chalk.magenta("→"),
    chalk.green(`Imported ${imported.length} commands from ${filename}\n`)
  );
}
