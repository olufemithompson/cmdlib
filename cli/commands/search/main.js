// main.js
import readline from "readline";
import chalk from "chalk";
import { SearchInterface } from "./components/SearchInterface.js";
import { DescriptionInterface } from "./components/DescriptionInterface.js";
import { DeleteInterface } from "./components/DeleteInterface.js";
import { HistoryInterface } from "./components/HistoryInterface.js";
import { ResultsManager } from "./components/ResultsManager.js";
import { InputHandler } from "./components/InputHandler.js";
import { TabCompletion } from "./utils/TabCompletion.js";
import { FileUtils } from "./utils/FileUtils.js";
import { INTERFACE_MODES } from "./constants/modes.js";

export async function runSearchCLI() {

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  // Enable keypress events
  readline.emitKeypressEvents(process.stdin, rl);
  if (process.stdin.isTTY) {
    process.stdin.setRawMode(true);
  }

  // Prevent readline from treating Ctrl+D as EOF and closing the process
  const origTtyWrite = rl._ttyWrite.bind(rl);
  rl._ttyWrite = function (s, key) {
    if (key && key.ctrl && key.name === "d") return;
    return origTtyWrite(s, key);
  };

  // Initialize components
  const searchInterface = new SearchInterface();
  const descriptionInterface = new DescriptionInterface();
  const deleteInterface = new DeleteInterface();
  const historyInterface = new HistoryInterface();
  const resultsManager = new ResultsManager();
  const tabCompletion = new TabCompletion();

  // Application state
  let currentMode = INTERFACE_MODES.SEARCH;
  let currentInterface = searchInterface;

  // Update current interface based on mode
  function setMode(mode) {
    currentMode = mode;
    switch (mode) {
      case INTERFACE_MODES.SEARCH:
        currentInterface = searchInterface;
        break;
      case INTERFACE_MODES.ADD_DESCRIPTION:
        currentInterface = descriptionInterface;
        break;
      case INTERFACE_MODES.DELETE_CONFIRM:
        currentInterface = deleteInterface;
        break;
      case INTERFACE_MODES.HISTORY:
        currentInterface = historyInterface;
        break;
      case INTERFACE_MODES.HISTORY_ADD_DESCRIPTION:
        currentInterface = descriptionInterface;
        break;
      default:
        currentInterface = searchInterface;
    }
  }

  // Initialize input handler with all dependencies
  const inputHandler = new InputHandler({
    searchInterface,
    descriptionInterface,
    deleteInterface,
    historyInterface,
    resultsManager,
    tabCompletion,
    setMode,
    getCurrentMode: () => currentMode,
    getCurrentInterface: () => currentInterface,
    rl,
    renderInterface,
  });

  function updateResults() {
    if (currentMode === INTERFACE_MODES.ADD_DESCRIPTION) return;

    const query = searchInterface.getSearchQuery();
    resultsManager.updateResults(query);
  }

  function renderInterface() {
    // Move to top-left and clear entire screen
    process.stdout.write("\x1B[2J\x1B[1;1H");

    // Render header on every frame
    process.stdout.write(chalk.cyan.bold("⚡ CMDLIB - CTRL+R On Steroids ⚡") + "\n");
    process.stdout.write(chalk.gray("─".repeat(32)) + "\n\n");

    // Render current interface
    currentInterface.render();

    // Render results if in search mode
    if (currentMode === INTERFACE_MODES.SEARCH) {
      resultsManager.render(searchInterface.getSearchQuery());
    }

    // Render footer
    renderFooter();
  }

  function renderFooter() {
    console.log("");

    let footerText;
    if (currentMode === INTERFACE_MODES.SEARCH) {
      const hasText = searchInterface.getSearchQuery().length > 0;
      const hasResults = resultsManager.hasResults();
      const hasSelection = resultsManager.hasSelection();
      footerText = searchInterface.getFooterText({ hasText, hasResults, hasSelection });
    } else {
      footerText = currentInterface.getFooterText();
    }
    console.log(chalk.hex("#8ab4cc")(footerText));
  }

  // Handle keypress events
  process.stdin.on("keypress", (str, key) => {
    if (!key) return;

    const { handled, shouldUpdateResults } = inputHandler.handleKeypress(
      str,
      key
    );

    if (handled) {
      if (shouldUpdateResults && currentMode === INTERFACE_MODES.SEARCH) {
        updateResults();
      }
      renderInterface();
    }
  });

  // Initial render
  updateResults();
  renderInterface();

  // Keep process alive
  await new Promise(() => {});
}
