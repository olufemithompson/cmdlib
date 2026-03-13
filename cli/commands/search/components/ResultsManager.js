// components/ResultsManager.js
import chalk from "chalk";
import { searchCommands as dbSearchCommands } from "../../../lib/db.js";
import { SOURCE } from "../../../lib/constant.js";
import { TextUtils } from "../utils/TextUtils.js";

export class ResultsManager {
  constructor() {
    this.results = [];
    this.selectedIndex = -1;
    this.scrollOffset = 0;
    this.VISIBLE_COUNT = 6;
    this.TAB_STR = "\t";
  }

  updateResults(query) {
    this.results = query
      ? dbSearchCommands(query)
      : dbSearchCommands("").slice(0, 50);
    this.selectedIndex = -1;
    this.adjustScroll();
  }

  selectPrevious() {
    if (this.results.length > 0) {
      if (this.selectedIndex === -1) {
        this.selectedIndex = this.results.length - 1;
      } else {
        this.selectedIndex = Math.max(0, this.selectedIndex - 1);
      }
      this.adjustScroll();
    }
  }

  selectNext() {
    if (this.results.length > 0) {
      if (this.selectedIndex === -1) {
        this.selectedIndex = 0; // Go to first item
      } else {
        this.selectedIndex = Math.min(
          this.results.length - 1,
          this.selectedIndex + 1
        );
      }
      this.adjustScroll();
    }
  }

  getSelectedCommand() {
    if (this.selectedIndex >= 0 && this.selectedIndex < this.results.length) {
      return this.results[this.selectedIndex];
    }
    return null;
  }

  hasResults() {
    return this.results.length > 0;
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
        Math.max(0, this.results.length - this.VISIBLE_COUNT)
      )
    );
  }

  render(query) {
    if (this.results.length === 0) {
      console.log(chalk.yellow("No commands found, Adding new.."));
      return;
    }

    const visibleResults = this.results.slice(
      this.scrollOffset,
      this.scrollOffset + this.VISIBLE_COUNT
    );

    visibleResults.forEach((cmd, i) => {
      const absoluteIndex = this.scrollOffset + i;
      const isSelected = absoluteIndex === this.selectedIndex;
      const mark = isSelected ? chalk.yellow("▶ ") : "  ";

      let badge = "";
      if (cmd.source === SOURCE.GROUP) {
        badge = chalk.green(`[${cmd.cmd_group}] `);
      } else if (cmd.source === SOURCE.PRIVATE) {
        badge = chalk.red("[private] ");
      }

      const highlightedDesc = TextUtils.highlightMatch(
        cmd.description || "",
        query
      );

      if (isSelected) {
        console.log(mark + badge + chalk.white.bold(highlightedDesc));
        const prefix = chalk.yellow("  └─ $ ");
        const formatted = TextUtils.formatWrappedIndented(
          String(cmd.command ?? ""),
          prefix,
          this.TAB_STR,
          (s) => chalk.cyan(s)
        );
        console.log(formatted);
      } else {
        console.log(mark + badge + highlightedDesc);
      }
      console.log();
    });

    if (this.results.length > this.VISIBLE_COUNT) {
      console.log(
        chalk.gray(
          `Showing ${this.scrollOffset + 1}-${Math.min(
            this.scrollOffset + this.VISIBLE_COUNT,
            this.results.length
          )} of ${this.results.length}`
        )
      );
    }
  }

  reset() {
    this.results = [];
    this.selectedIndex = -1;
    this.scrollOffset = 0;
  }
}
