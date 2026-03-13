import chalk from "chalk";

export class DescriptionInterface {
  constructor() {
    this.text = "";
    this.cursorPosition = 0;
  }

  addCharacter(char) {
    this.text =
      this.text.slice(0, this.cursorPosition) +
      char +
      this.text.slice(this.cursorPosition);
    this.cursorPosition++;
  }

  handleBackspace() {
    if (this.cursorPosition > 0) {
      this.text =
        this.text.slice(0, this.cursorPosition - 1) +
        this.text.slice(this.cursorPosition);
      this.cursorPosition--;
    }
  }

  moveCursorLeft() {
    if (this.cursorPosition > 0) {
      this.cursorPosition--;
    }
  }

  moveCursorRight() {
    if (this.cursorPosition < this.text.length) {
      this.cursorPosition++;
    }
  }

  getText() {
    return this.text;
  }

  isEmpty() {
    return !this.text.trim();
  }

  render() {
    let descDisplay = chalk.cyan("Add Description: ");
    let displayDesc = this.text;

    displayDesc =
      this.text.slice(0, this.cursorPosition) +
      chalk.yellow("_") +
      this.text.slice(this.cursorPosition);

    descDisplay += chalk.white.bold(displayDesc);
    process.stdout.write(descDisplay + "\n\n");
  }

  getFooterText() {
    return "[Enter] save | [Esc] cancel";
  }

  reset() {
    this.text = "";
    this.cursorPosition = 0;
  }
}
