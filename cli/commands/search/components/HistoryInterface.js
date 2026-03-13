import chalk from "chalk";
import { getShellHistory } from "../../../lib/history.js";
import { TextUtils } from "../utils/TextUtils.js";

export class HistoryInterface {
  constructor() {
    this.allItems = [];
    this.filteredItems = [];
    this.searchQuery = "";
    this.cursorPosition = 0;
    this.selectedIndex = -1;
    this.scrollOffset = 0;
    this.VISIBLE_COUNT = 8;
  }

  load() {
    this.allItems = getShellHistory(200);
    this.filteredItems = [...this.allItems];
    this.searchQuery = "";
    this.cursorPosition = 0;
    this.selectedIndex = -1;
    this.scrollOffset = 0;
  }

  addCharacter(char) {
    this.searchQuery =
      this.searchQuery.slice(0, this.cursorPosition) +
      char +
      this.searchQuery.slice(this.cursorPosition);
    this.cursorPosition++;
    this._applyFilter();
  }

  handleBackspace() {
    if (this.cursorPosition > 0) {
      this.searchQuery =
        this.searchQuery.slice(0, this.cursorPosition - 1) +
        this.searchQuery.slice(this.cursorPosition);
      this.cursorPosition--;
      this._applyFilter();
    }
  }

  moveCursorLeft() {
    if (this.cursorPosition > 0) this.cursorPosition--;
  }

  moveCursorRight() {
    if (this.cursorPosition < this.searchQuery.length) this.cursorPosition++;
  }

  _applyFilter() {
    const q = this.searchQuery.toLowerCase();
    this.filteredItems = q
      ? this.allItems.filter((cmd) => cmd.toLowerCase().includes(q))
      : [...this.allItems];
    this.selectedIndex = -1;
    this.scrollOffset = 0;
  }

  selectPrevious() {
    if (this.filteredItems.length > 0) {
      if (this.selectedIndex === -1) {
        this.selectedIndex = 0;
      } else {
        this.selectedIndex = Math.max(0, this.selectedIndex - 1);
      }
      this.adjustScroll();
    }
  }

  selectNext() {
    if (this.filteredItems.length > 0) {
      if (this.selectedIndex === -1) {
        this.selectedIndex = 0;
      } else {
        this.selectedIndex = Math.min(
          this.filteredItems.length - 1,
          this.selectedIndex + 1
        );
      }
      this.adjustScroll();
    }
  }

  getSelectedCommand() {
    if (this.selectedIndex >= 0 && this.selectedIndex < this.filteredItems.length) {
      return this.filteredItems[this.selectedIndex];
    }
    return null;
  }

  hasSelection() {
    return this.selectedIndex !== -1;
  }

  adjustScroll() {
    if (this.selectedIndex < this.scrollOffset) {
      this.scrollOffset = this.selectedIndex;
    } else if (this.selectedIndex >= this.scrollOffset + this.VISIBLE_COUNT) {
      this.scrollOffset = this.selectedIndex - this.VISIBLE_COUNT + 1;
    }
    this.scrollOffset = Math.max(
      0,
      Math.min(
        this.scrollOffset,
        Math.max(0, this.filteredItems.length - this.VISIBLE_COUNT)
      )
    );
  }

  render() {
    // Render search input line
    const displayQuery =
      this.searchQuery.slice(0, this.cursorPosition) +
      chalk.yellow("_") +
      this.searchQuery.slice(this.cursorPosition);
    process.stdout.write(chalk.cyan("History: ") + chalk.white.bold(displayQuery) + "\n\n");

    if (this.filteredItems.length === 0) {
      console.log(chalk.yellow("No matching history found."));
      console.log();
      return;
    }

    const visibleItems = this.filteredItems.slice(
      this.scrollOffset,
      this.scrollOffset + this.VISIBLE_COUNT
    );

    visibleItems.forEach((cmd, i) => {
      const absoluteIndex = this.scrollOffset + i;
      const isSelected = absoluteIndex === this.selectedIndex;
      const mark = isSelected ? chalk.yellow("▶ ") : "  ";
      const highlighted = TextUtils.highlightMatch(cmd, this.searchQuery);

      if (isSelected) {
        console.log(mark + chalk.white.bold(highlighted));
      } else {
        console.log(mark + highlighted);
      }
    });

    if (this.filteredItems.length > this.VISIBLE_COUNT) {
      console.log();
      console.log(
        chalk.gray(
          `Showing ${this.scrollOffset + 1}-${Math.min(
            this.scrollOffset + this.VISIBLE_COUNT,
            this.filteredItems.length
          )} of ${this.filteredItems.length}`
        )
      );
    }

    console.log();
  }

  getFooterText() {
    if (this.hasSelection()) {
      return "[↑↓] select | [Enter] run | [Ctrl+A] Add | [Esc] exit";
    }
    return "[↑↓] select | [←→] cursor | [Esc] exit";
  }

  reset() {
    this.searchQuery = "";
    this.cursorPosition = 0;
    this.selectedIndex = -1;
    this.scrollOffset = 0;
    this.filteredItems = [...this.allItems];
  }
}
