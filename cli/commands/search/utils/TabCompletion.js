import fs from "fs";
import path from "path";

export class TabCompletion {
  getCompletions(pathFragment) {
    try {
      // Expand ~ to home directory
      let expandedPath = pathFragment;
      if (pathFragment.startsWith("~")) {
        expandedPath = pathFragment.replace("~", process.env.HOME || "/");
      }

      // Get directory and partial filename
      const dir = path.dirname(expandedPath);
      const partial = path.basename(expandedPath);

      // If path ends with /, we're completing in that directory
      const targetDir = pathFragment.endsWith("/") ? expandedPath : dir;
      const searchPattern = pathFragment.endsWith("/") ? "" : partial;

      // Read directory contents
      if (!fs.existsSync(targetDir)) {
        return [];
      }

      const files = fs.readdirSync(targetDir);

      // Filter files that start with our search pattern
      const matches = files
        .filter((file) => file.startsWith(searchPattern))
        .map((file) => {
          const fullPath = path.join(targetDir, file);
          const isDir = fs.statSync(fullPath).isDirectory();
          return {
            name: file,
            isDirectory: isDir,
            fullPath: fullPath,
          };
        })
        .sort((a, b) => {
          // Sort directories first, then files
          if (a.isDirectory && !b.isDirectory) return -1;
          if (!a.isDirectory && b.isDirectory) return 1;
          return a.name.localeCompare(b.name);
        });

      return matches;
    } catch (error) {
      return [];
    }
  }
}
