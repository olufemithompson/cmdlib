// utils/FileUtils.js
import fs from "fs";

export class FileUtils {
  static writeCommandToTempFile(command) {
    const tempFile = `/tmp/cmdlib_cmd_${process.ppid}`;
    fs.writeFileSync(tempFile, String(command));
  }
}
