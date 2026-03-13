import chalk from "chalk";
import { INTERFACE_MODES } from "../constants/modes.js";
import { CommandSaver } from "../utils/CommandSaver.js";
import { FileUtils } from "../utils/FileUtils.js";
import { deleteCommand as dbDeleteCommand } from "../../../lib/db.js";

export class InputHandler {
  constructor({
    searchInterface,
    descriptionInterface,
    deleteInterface,
    historyInterface,
    resultsManager,
    tabCompletion,
    setMode,
    getCurrentMode,
    getCurrentInterface,
    rl,
    renderInterface,
  }) {
    this.searchInterface = searchInterface;
    this.descriptionInterface = descriptionInterface;
    this.deleteInterface = deleteInterface;
    this.historyInterface = historyInterface;
    this.resultsManager = resultsManager;
    this.tabCompletion = tabCompletion;
    this.setMode = setMode;
    this.getCurrentMode = getCurrentMode;
    this.getCurrentInterface = getCurrentInterface;
    this.rl = rl;
    this.renderInterface = renderInterface;
    this.commandSaver = new CommandSaver();
  }

  handleKeypress(str, key) {
    const currentMode = this.getCurrentMode();

    // Global shortcuts
    if (key.ctrl && key.name === "c") {
      this.rl.close();
      process.exit(0);
    }

    if (
      key.ctrl &&
      key.name === "a" &&
      currentMode === INTERFACE_MODES.SEARCH
    ) {
      this.startDescriptionInput();
      return { handled: true, shouldUpdateResults: false };
    }

    if (
      key.ctrl &&
      key.name === "d" &&
      currentMode === INTERFACE_MODES.SEARCH &&
      this.resultsManager.hasSelection()
    ) {
      this.startDeleteMode();
      return { handled: true, shouldUpdateResults: false };
    }

    if (
      key.ctrl &&
      key.name === "r" &&
      currentMode === INTERFACE_MODES.SEARCH &&
      this.searchInterface.getSearchQuery().length === 0
    ) {
      this.startHistoryMode();
      return { handled: true, shouldUpdateResults: false };
    }

    if (
      key.ctrl &&
      key.name === "a" &&
      currentMode === INTERFACE_MODES.HISTORY &&
      this.historyInterface.hasSelection()
    ) {
      this.startHistoryDescriptionInput();
      return { handled: true, shouldUpdateResults: false };
    }

    // Mode-specific handling
    switch (currentMode) {
      case INTERFACE_MODES.SEARCH:
        return this.handleSearchMode(str, key);
      case INTERFACE_MODES.ADD_DESCRIPTION:
        return this.handleDescriptionMode(str, key);
      case INTERFACE_MODES.DELETE_CONFIRM:
        return this.handleDeleteMode(str, key);
      case INTERFACE_MODES.HISTORY:
        return this.handleHistoryMode(str, key);
      case INTERFACE_MODES.HISTORY_ADD_DESCRIPTION:
        return this.handleHistoryDescriptionMode(str, key);
      default:
        return { handled: false, shouldUpdateResults: false };
    }
  }

  handleSearchMode(str, key) {
    switch (key.name) {
      case "escape":
        this.rl.close();
        process.exit(0);
        break;

      case "return":
        return this.handleEnterInSearch();

      case "up":
        this.resultsManager.selectPrevious();
        return { handled: true, shouldUpdateResults: false };

      case "down":
        this.resultsManager.selectNext();
        return { handled: true, shouldUpdateResults: false };

      case "left":
        this.searchInterface.moveCursorLeft();
        return { handled: true, shouldUpdateResults: false };

      case "right":
        this.searchInterface.moveCursorRight();
        return { handled: true, shouldUpdateResults: false };

      case "backspace":
        this.searchInterface.handleBackspace();
        return { handled: true, shouldUpdateResults: true };

      case "tab":
        const tabResult = this.handleTabCompletion();
        return { handled: tabResult, shouldUpdateResults: tabResult };

      default:
        if (str && str.length === 1 && !key.ctrl && !key.meta) {
          this.searchInterface.addCharacter(str);
          return { handled: true, shouldUpdateResults: true };
        }
        break;
    }
    return { handled: false, shouldUpdateResults: false };
  }

  handleDescriptionMode(str, key) {
    switch (key.name) {
      case "escape":
        this.cancelDescriptionInput();
        return { handled: true, shouldUpdateResults: false };

      case "return":
        this.saveCommand();
        return { handled: true, shouldUpdateResults: false };

      case "left":
        this.descriptionInterface.moveCursorLeft();
        return { handled: true, shouldUpdateResults: false };

      case "right":
        this.descriptionInterface.moveCursorRight();
        return { handled: true, shouldUpdateResults: false };

      case "backspace":
        this.descriptionInterface.handleBackspace();
        return { handled: true, shouldUpdateResults: false };

      default:
        if (str && str.length === 1 && !key.ctrl && !key.meta) {
          this.descriptionInterface.addCharacter(str);
          return { handled: true, shouldUpdateResults: false };
        }
        break;
    }
    return { handled: false, shouldUpdateResults: false };
  }

  handleEnterInSearch() {
    if (
      !this.resultsManager.hasResults() ||
      !this.resultsManager.hasSelection()
    ) {
      this.searchInterface.addNewLine();
      return { handled: true, shouldUpdateResults: true };
    }

    const selected = this.resultsManager.getSelectedCommand();
    this.rl.close();

    FileUtils.writeCommandToTempFile(selected.command);

    console.clear();
    console.log(
      chalk.magenta("→"),
      chalk.green("Running:"),
      chalk.yellow(String(selected.command))
    );
    process.exit(0);
  }

  handleTabCompletion() {
    const pathInfo = this.searchInterface.findPathToComplete();
    if (!pathInfo) return false;

    const completions = this.tabCompletion.getCompletions(
      pathInfo.pathFragment
    );
    if (completions.length === 0) return false;

    if (completions.length === 1) {
      const completion = completions[0];
      let newPath =
        pathInfo.pathFragment.substring(
          0,
          pathInfo.pathFragment.lastIndexOf("/") + 1
        ) + completion.name;

      if (completion.isDirectory) {
        newPath += "/";
      }

      this.searchInterface.applyTabCompletion(pathInfo, newPath);
      return true;
    } else {
      this.handleMultipleCompletions(pathInfo, completions);
      return true;
    }
  }

  handleMultipleCompletions(pathInfo, completions) {
    // Find common prefix
    let commonPrefix = completions[0].name;
    for (let i = 1; i < completions.length; i++) {
      let j = 0;
      while (
        j < commonPrefix.length &&
        j < completions[i].name.length &&
        commonPrefix[j] === completions[i].name[j]
      ) {
        j++;
      }
      commonPrefix = commonPrefix.slice(0, j);
    }

    // Complete to common prefix if longer than current
    const currentPartial = pathInfo.pathFragment.split("/").pop();
    if (commonPrefix.length > currentPartial.length) {
      let newPath =
        pathInfo.pathFragment.substring(
          0,
          pathInfo.pathFragment.lastIndexOf("/") + 1
        ) + commonPrefix;

      this.searchInterface.applyTabCompletion(pathInfo, newPath);
    }

    // Show completions temporarily
    this.showCompletions(completions);
  }

  showCompletions(completions) {
    setTimeout(() => {
      process.stdout.write(`\x1B[4;1H\x1B[0J`);

      // Show search interface
      this.searchInterface.render();

      // Show completions
      const maxShow = 8;
      const showCompletions = completions.slice(0, completions.length);

      showCompletions.forEach((comp) => {
        if (comp.isDirectory && !comp.name.startsWith(".")) {
          console.log(`${chalk.blue(comp.name + "/")}`);
        }
      });
      console.log(chalk.gray("\nPress any key to continue..."));
    }, 50);
  }

  handleDeleteMode(str, key) {
    switch (key.name) {
      case "escape":
        this.cancelDeleteMode();
        return { handled: true, shouldUpdateResults: false };
      case "return":
        this.confirmDelete();
        return { handled: true, shouldUpdateResults: true };
      default:
        return { handled: false, shouldUpdateResults: false };
    }
  }

  startDeleteMode() {
    const selected = this.resultsManager.getSelectedCommand();
    this.deleteInterface.setCommandToDelete(selected);
    this.setMode(INTERFACE_MODES.DELETE_CONFIRM);
  }

  cancelDeleteMode() {
    this.deleteInterface.reset();
    this.setMode(INTERFACE_MODES.SEARCH);
  }

  confirmDelete() {
    const command = this.deleteInterface.commandToDelete;
    if (!command) return;

    dbDeleteCommand(command.id);
    this.deleteInterface.reset();
    this.setMode(INTERFACE_MODES.SEARCH);
    this.resultsManager.selectedIndex = -1;
  }

  startHistoryMode() {
    this.historyInterface.load();
    this.setMode(INTERFACE_MODES.HISTORY);
  }

  handleHistoryMode(str, key) {
    switch (key.name) {
      case "escape":
        this.historyInterface.reset();
        this.setMode(INTERFACE_MODES.SEARCH);
        return { handled: true, shouldUpdateResults: false };

      case "up":
        this.historyInterface.selectPrevious();
        return { handled: true, shouldUpdateResults: false };

      case "down":
        this.historyInterface.selectNext();
        return { handled: true, shouldUpdateResults: false };

      case "left":
        this.historyInterface.moveCursorLeft();
        return { handled: true, shouldUpdateResults: false };

      case "right":
        this.historyInterface.moveCursorRight();
        return { handled: true, shouldUpdateResults: false };

      case "backspace":
        this.historyInterface.handleBackspace();
        return { handled: true, shouldUpdateResults: false };

      case "return":
        return this.handleEnterInHistory();

      default:
        if (str && str.length === 1 && !key.ctrl && !key.meta) {
          this.historyInterface.addCharacter(str);
          return { handled: true, shouldUpdateResults: false };
        }
        break;
    }
    return { handled: false, shouldUpdateResults: false };
  }

  handleEnterInHistory() {
    const selected = this.historyInterface.getSelectedCommand();
    if (!selected) return { handled: false, shouldUpdateResults: false };

    this.rl.close();
    FileUtils.writeCommandToTempFile(selected);
    console.clear();
    console.log(chalk.magenta("→"), chalk.green("Running:"), chalk.yellow(selected));
    process.exit(0);
  }

  startHistoryDescriptionInput() {
    this.setMode(INTERFACE_MODES.HISTORY_ADD_DESCRIPTION);
    this.descriptionInterface.reset();
  }

  handleHistoryDescriptionMode(str, key) {
    switch (key.name) {
      case "escape":
        this.descriptionInterface.reset();
        this.setMode(INTERFACE_MODES.HISTORY);
        return { handled: true, shouldUpdateResults: false };

      case "return":
        this.saveHistoryCommand();
        return { handled: true, shouldUpdateResults: false };

      case "left":
        this.descriptionInterface.moveCursorLeft();
        return { handled: true, shouldUpdateResults: false };

      case "right":
        this.descriptionInterface.moveCursorRight();
        return { handled: true, shouldUpdateResults: false };

      case "backspace":
        this.descriptionInterface.handleBackspace();
        return { handled: true, shouldUpdateResults: false };

      default:
        if (str && str.length === 1 && !key.ctrl && !key.meta) {
          this.descriptionInterface.addCharacter(str);
          return { handled: true, shouldUpdateResults: false };
        }
        break;
    }
    return { handled: false, shouldUpdateResults: false };
  }

  saveHistoryCommand() {
    if (this.descriptionInterface.isEmpty()) return;

    const commandString = this.historyInterface.getSelectedCommand();
    const description = this.descriptionInterface.getText();

    this.commandSaver.save(commandString, description);
    this.descriptionInterface.reset();
    this.setMode(INTERFACE_MODES.HISTORY);
    this.renderInterface();
  }

  startDescriptionInput() {
    this.setMode(INTERFACE_MODES.ADD_DESCRIPTION);
    this.descriptionInterface.reset();
  }

  cancelDescriptionInput() {
    this.setMode(INTERFACE_MODES.SEARCH);
    this.descriptionInterface.reset();
  }

  saveCommand() {
    if (this.descriptionInterface.isEmpty()) return;

    const commandString = this.searchInterface.getEnteredCommands();
    const description = this.descriptionInterface.getText();

    this.commandSaver.save(commandString, description);

    this.searchInterface.reset();
    this.cancelDescriptionInput();
    this.resultsManager.updateResults(this.searchInterface.getSearchQuery());
    this.renderInterface();
  }
}
