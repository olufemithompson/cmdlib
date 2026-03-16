// db.js
import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import os from "os";

// Ensure .cmdlib folder exists
const DB_FOLDER = path.join(os.homedir(), ".cmdlib");
const DB_PATH = path.join(DB_FOLDER, "cmdlib.sqlite");

// const DB_FILE = path.resolve(
//   process.env.HOME || process.env.USERPROFILE,
//   ".cmdlib",
//   "cmdlib.sqlite"
// );

if (!fs.existsSync(DB_FOLDER)) {
  fs.mkdirSync(DB_FOLDER, { recursive: true });
}

const db = new Database(DB_PATH);

// Create table if not exists
db.exec(`
  CREATE TABLE IF NOT EXISTS commands (
    id TEXT PRIMARY KEY,
    description TEXT,
    command TEXT,
    steps_json TEXT,
    type TEXT NOT NULL,
    os TEXT,
    source TEXT NOT NULL,
    cmd_group TEXT,
    cmd_group_id TEXT,
    created_at INTEGER,
    updated_at INTEGER
  );

  CREATE INDEX IF NOT EXISTS idx_command_type ON commands(command);
  CREATE INDEX IF NOT EXISTS idx_command_type ON commands(cmd_group);
  CREATE INDEX IF NOT EXISTS idx_command_source ON commands(steps_json);
  CREATE INDEX IF NOT EXISTS idx_command_os ON commands(os);
  CREATE INDEX IF NOT EXISTS idx_command_desc ON commands(description);
`);

// Helper to insert a command
export function insertCommand(command) {
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO commands (
      id, description, command, steps_json, type, os,
      source, cmd_group, cmd_group_id, created_at, updated_at
    ) VALUES (
      @id, @description, @command, @steps_json, @type, @os,
      @source, @cmd_group, @cmd_group_id, @created_at, @updated_at
    )
  `);

  stmt.run({
    id: command.id,
    description: command.description || "",
    command: command.command || null,
    steps_json: command.steps ? JSON.stringify(command.steps) : null,
    type: command.type,
    os: command.os?.join(",") || "",
    source: command.source,
    cmd_group: command.cmd_group || null,
    cmd_group_id: command.cmd_group_id || null,
    created_at: Date.now(),
    updated_at: Date.now(),
  });
}

function toRow(row) {
  return { ...row, steps: row.steps_json ? JSON.parse(row.steps_json) : null };
}

// Search by keyword — splits into words, scores by how many match
export function searchCommands(keyword = "") {
  if (!keyword.trim()) {
    return db.prepare(`SELECT * FROM commands LIMIT 50`).all().map(toRow);
  }

  const words = keyword.trim().toLowerCase().split(/\s+/);
  const likeArgs = words.map((w) => `%${w}%`);

  // Each word that matches description scores 2, command scores 1
  const scoreTerms = words.map(
    () =>
      `(CASE WHEN LOWER(description) LIKE ? THEN 2 ELSE 0 END) +` +
      `(CASE WHEN LOWER(command) LIKE ? THEN 1 ELSE 0 END)`
  );
  const whereTerms = words.map(
    () => `LOWER(description) LIKE ? OR LOWER(command) LIKE ?`
  );

  const scoreArgs = likeArgs.flatMap((p) => [p, p]);
  const whereArgs = likeArgs.flatMap((p) => [p, p]);

  const stmt = db.prepare(`
    SELECT *, (${scoreTerms.join(" + ")}) as score
    FROM commands
    WHERE ${whereTerms.join(" OR ")}
    ORDER BY score DESC
    LIMIT 50
  `);

  return stmt.all(...scoreArgs, ...whereArgs).map(toRow);
}

export function getAllGroups() {
  const stmt = db.prepare(`
      SELECT DISTINCT cmd_group_id, cmd_group
      FROM commands
      WHERE cmd_group IS NOT NULL AND cmd_group_id IS NOT NULL
    `);

  return stmt.all().map((row) => ({
    id: row.cmd_group_id,
    name: row.cmd_group,
  }));
}

export function deleteCommand(id) {
  const stmt = db.prepare(`DELETE FROM commands WHERE id = ?`);
  stmt.run(id);
}

// Get all PRIVATE and ORG for full export
export function getExportableCommands() {
  const stmt = db.prepare(`
    SELECT * FROM commands
    WHERE source IN ('PRIVATE', 'ORG')
  `);
  return stmt.all();
}
