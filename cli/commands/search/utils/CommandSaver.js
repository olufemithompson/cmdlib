import { insertCommand as dbAdd } from "../../../lib/db.js";
import { SOURCE, TYPE } from "../../../lib/constant.js";

export class CommandSaver {
  save(commandString, description) {
    dbAdd({
      id: crypto.randomUUID(),
      description: description.trim(),
      command: commandString,
      type: TYPE.COMMAND,
      source: SOURCE.PRIVATE,
    });
  }
}
