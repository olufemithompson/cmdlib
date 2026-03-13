// lib/history.js
import fs from "fs";
import os from "os";
import path from "path";

function getShellHistoryPath() {
  const shell = process.env.SHELL || "";

  if (shell.includes("bash")) {
    return path.join(os.homedir(), ".bash_history");
  } else if (shell.includes("zsh")) {
    return path.join(os.homedir(), ".zsh_history");
  } else if (shell.includes("fish")) {
    return path.join(os.homedir(), ".local/share/fish/fish_history");
  }

  // Default fallback
  return path.join(os.homedir(), ".bash_history");
}

export function getShellHistory(limit = 200) {
  const historyPath = getShellHistoryPath();

  if (!fs.existsSync(historyPath)) {
    console.warn("No shell history file found.");
    return [];
  }

  try {
    const content = fs.readFileSync(historyPath, "utf-8");

    let lines = content.split("\n");

    // Clean ZSH timestamps like ': 1689337567:0;'
    lines = lines.map((line) => line.replace(/^: \d+:0;/, "").trim());

    // Filter out noise
    const clean = lines.filter(
      (line) => line && !line.startsWith("#") && line.indexOf("cmdlib") == -1
    );

    // Keep last occurrence of each unique command, ordered from most recent
    const seen = new Set();
    const recentUnique = [];

    for (let i = clean.length - 1; i >= 0 && recentUnique.length < limit; i--) {
      const cmd = clean[i];
      if (!seen.has(cmd)) {
        seen.add(cmd);
        recentUnique.push(cmd);
      }
    }
    return recentUnique; // most recent first
  } catch (err) {
    console.error("Error reading shell history:", err.message);
    return [];
  }
}
