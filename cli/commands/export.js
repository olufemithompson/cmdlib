import fs from "fs";
import chalk from "chalk";
import { loadAliases } from "../lib/io.js";

export function exportCommands(filename) {
  const aliases = loadAliases();
  fs.writeFileSync(filename, JSON.stringify(aliases, null, 2));
  console.log(
    chalk.magenta("→"),
    chalk.green(`Exported ${aliases.length} commands to ${filename}\n`)
  );
}
