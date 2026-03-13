#!/usr/bin/env node
import { runSearchCLI } from "./commands/search/main.js";
import { printHelp } from "./commands/help.js";

const args = process.argv.slice(2);

// Check if we should output a command for the shell to execute
function outputCommand(command) {
  // Commands that need to affect the parent shell
  if (
    command.match(/^(export|cd|source)\s/) ||
    (command.includes("&&") && command.includes("export"))
  ) {
    console.log(command);
    process.exit(0);
  }

  // Regular commands - execute normally
  const [cmd, ...cmdArgs] = command.split(" ");
  const child = spawn(cmd, cmdArgs, {
    stdio: "inherit",
    shell: true,
  });

  child.on("exit", (code) => process.exit(code || 0));
}

// Handle CLI arguments
if (args.includes("--help") || args.includes("-h")) {
  printHelp();
} else if (args.includes("--setup")) {
  console.log(`
# Add this function to your ~/.bashrc or ~/.zshrc, then restart your shell:

cmdlib() {
  command cmdlib "$@"
  local cmd_file="/tmp/cmdlib_cmd_$$"
  if [ -f "$cmd_file" ]; then
    local cmd=$(cat "$cmd_file")
    rm -f "$cmd_file"
    [ -n "$cmd" ] && eval "$cmd"
  fi
}

# Quick install (bash):
#   cmdlib --setup >> ~/.bashrc && source ~/.bashrc
#
# Quick install (zsh):
#   cmdlib --setup >> ~/.zshrc && source ~/.zshrc
`);
} else {
  // Interactive search mode (default)
  await runSearchCLI();
}
