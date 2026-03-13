import chalk from "chalk";

export class SearchInterface {
  constructor() {
    this.searchLines = [""];
    this.currentLineIndex = 0;
    this.cursorPosition = 0;
  }

  getSearchQuery() {
    return this.searchLines.join(" ").trim();
  }

  getEnteredCommands() {
    return this.searchLines.join("\n").trim();
  }

  getCurrentLine() {
    return this.searchLines[this.currentLineIndex];
  }

  addNewLine() {
    const currentLine = this.getCurrentLine();
    const beforeCursor = currentLine.slice(0, this.cursorPosition);
    const afterCursor = currentLine.slice(this.cursorPosition);

    this.searchLines[this.currentLineIndex] = beforeCursor;
    this.searchLines.splice(this.currentLineIndex + 1, 0, afterCursor);

    this.currentLineIndex++;
    this.cursorPosition = 0;
  }

  handleBackspace() {
    const currentLine = this.getCurrentLine();

    if (this.cursorPosition > 0) {
      this.searchLines[this.currentLineIndex] =
        currentLine.slice(0, this.cursorPosition - 1) +
        currentLine.slice(this.cursorPosition);
      this.cursorPosition--;
    } else if (this.currentLineIndex > 0) {
      const prevLine = this.searchLines[this.currentLineIndex - 1];
      const currentContent = this.searchLines[this.currentLineIndex];

      this.searchLines.splice(this.currentLineIndex, 1);
      this.searchLines[this.currentLineIndex - 1] = prevLine + currentContent;

      this.currentLineIndex--;
      this.cursorPosition = prevLine.length;
    }
  }

  addCharacter(char) {
    const currentLine = this.getCurrentLine();
    this.searchLines[this.currentLineIndex] =
      currentLine.slice(0, this.cursorPosition) +
      char +
      currentLine.slice(this.cursorPosition);
    this.cursorPosition++;
  }

  moveCursorLeft() {
    if (this.cursorPosition > 0) {
      this.cursorPosition--;
    } else if (this.currentLineIndex > 0) {
      this.currentLineIndex--;
      this.cursorPosition = this.searchLines[this.currentLineIndex].length;
    }
  }

  moveCursorRight() {
    const currentLine = this.getCurrentLine();
    if (this.cursorPosition < currentLine.length) {
      this.cursorPosition++;
    } else if (this.currentLineIndex < this.searchLines.length - 1) {
      this.currentLineIndex++;
      this.cursorPosition = 0;
    }
  }

  findPathToComplete() {
    const currentLine = this.getCurrentLine();
    const beforeCursor = currentLine.slice(0, this.cursorPosition);

    const pathRegex = /([~/][\w\-\.\/]*|\.\.?\/[\w\-\.\/]*)$/;
    const match = beforeCursor.match(pathRegex);

    if (match) {
      return {
        pathFragment: match[1],
        startPos: this.cursorPosition - match[1].length,
        endPos: this.cursorPosition,
      };
    }

    return null;
  }

  applyTabCompletion(pathInfo, completionPath) {
    const currentLine = this.getCurrentLine();
    const newLine =
      currentLine.slice(0, pathInfo.startPos) +
      completionPath +
      currentLine.slice(pathInfo.endPos);

    this.searchLines[this.currentLineIndex] = newLine;
    this.cursorPosition = pathInfo.startPos + completionPath.length;
  }

  render() {
    let searchDisplay = chalk.cyan("Search | Type Command: ");

    this.searchLines.forEach((line, lineIdx) => {
      let displayLine = line;

      if (lineIdx === this.currentLineIndex) {
        displayLine =
          line.slice(0, this.cursorPosition) +
          chalk.yellow("_") +
          line.slice(this.cursorPosition);
      }

      if (lineIdx === 0) {
        searchDisplay += chalk.white.bold(displayLine);
      } else {
        searchDisplay += "\n        " + chalk.white.bold(displayLine);
      }
    });

    process.stdout.write(searchDisplay + "\n\n");
  }

  getFooterText({ hasText = false, hasResults = false, hasSelection = false } = {}) {
    if (hasSelection) {
      return "[↑↓] select | [Enter] run | [Ctrl+D] delete | [Esc] exit";
    }
    if (!hasText) {
      return "[↑↓] select | [Ctrl+R] history | [Esc] exit";
    }
    if (hasResults) {
      return "[↑↓] select | [Enter] new line | [CTRL+A] add description | [←→] cursor | [Esc] exit";
    }
    return "[Enter] new line | [CTRL+A] add description | [←→] cursor | [Esc] exit";
  }

  reset() {
    this.searchLines = [""];
    this.currentLineIndex = 0;
    this.cursorPosition = 0;
  }
}
