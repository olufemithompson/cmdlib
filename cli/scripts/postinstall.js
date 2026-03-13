#!/usr/bin/env node
import fs from "fs";
import os from "os";
import path from "path";
import { execSync } from "child_process";

const MARKER = "# cmdlib shell wrapper";

const WRAPPER = `
${MARKER}
cmdlib() {
  command cmdlib "$@"
  local cmd_file="/tmp/cmdlib_cmd_$$"
  if [ -f "$cmd_file" ]; then
    local cmd=$(cat "$cmd_file")
    rm -f "$cmd_file"
    [ -n "$cmd" ] && eval "$cmd"
  fi
}
`;

function getRealUser() {
  // When running via sudo, SUDO_USER contains the original user
  const sudoUser = process.env.SUDO_USER;
  if (sudoUser && sudoUser !== "root") {
    return sudoUser;
  }
  return null;
}

function getRealHome(realUser) {
  if (!realUser) return os.homedir();
  // Try to get home dir from /etc/passwd
  try {
    const result = execSync(`getent passwd ${realUser}`, { encoding: "utf-8" }).trim();
    const parts = result.split(":");
    if (parts.length >= 6) return parts[5];
  } catch {
    // fallback
  }
  // Common fallback
  return path.join("/home", realUser);
}

function getRealShell(realUser) {
  const shell = process.env.SHELL || "";
  if (shell && !shell.includes("sh\n")) return shell;

  if (realUser) {
    // Try to get shell from /etc/passwd
    try {
      const result = execSync(`getent passwd ${realUser}`, { encoding: "utf-8" }).trim();
      const parts = result.split(":");
      if (parts.length >= 7) return parts[6];
    } catch {
      // fallback
    }
  }

  return shell;
}

function getConfigFile() {
  const realUser = getRealUser();
  const home = getRealHome(realUser);
  const shell = getRealShell(realUser);
  const platform = process.platform;

  if (shell.includes("zsh")) {
    return path.join(home, ".zshrc");
  }

  if (shell.includes("bash")) {
    // macOS bash uses .bash_profile for login shells
    return platform === "darwin"
      ? path.join(home, ".bash_profile")
      : path.join(home, ".bashrc");
  }

  // Last resort: try common config files
  for (const rc of [".bashrc", ".zshrc", ".bash_profile"]) {
    const candidate = path.join(home, rc);
    if (fs.existsSync(candidate)) return candidate;
  }

  return null;
}

function install() {
  const configFile = getConfigFile();

  if (!configFile) {
    console.log(
      "\ncmdlib: Could not detect shell config. Run `cmdlib --setup` for manual setup instructions.\n"
    );
    return;
  }

  // Don't install twice
  if (fs.existsSync(configFile)) {
    const existing = fs.readFileSync(configFile, "utf-8");
    if (existing.includes(MARKER)) {
      console.log(`\ncmdlib: Shell wrapper already installed in ${configFile}\n`);
      return;
    }
  }

  try {
    fs.appendFileSync(configFile, WRAPPER);
    console.log(`\ncmdlib: Shell wrapper installed to ${configFile}`);
    console.log(`        Restart your terminal or run: source ${configFile}\n`);
  } catch (err) {
    console.log(
      `\ncmdlib: Could not write to ${configFile} (${err.message}). Run \`cmdlib --setup\` for manual setup.\n`
    );
  }
}

install();
