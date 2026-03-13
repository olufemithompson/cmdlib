// components/DeleteInterface.js
import chalk from "chalk";

export class DeleteInterface {
  constructor() {
    this.commandToDelete = null;
  }

  setCommandToDelete(command) {
    this.commandToDelete = command;
  }

  render() {
    if (!this.commandToDelete) return;

    console.log(chalk.red.bold("DELETE CONFIRMATION"));
    console.log();
  }

  getFooterText() {
    return "[Enter] Delete | [Esc] cancel";
  }

  reset() {
    this.commandToDelete = null;
  }
}
