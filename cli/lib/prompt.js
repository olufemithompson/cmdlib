import readline from "readline";
import { bold, cyan, yellow, dim } from "colorette";

export class CmdPrompt {
  constructor(options = {}) {
    this.pageSize = options.pageSize || 10;
    this.steps = [];
    this.currentStepIndex = 0;
    this.selectionIndex = 0;
  }

  addStep(step) {
    // step = { message: '', choices: [], toolbar: '' }
    this.steps.push(step);
  }

  async start() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    readline.emitKeypressEvents(process.stdin, this.rl);
    if (process.stdin.isTTY) process.stdin.setRawMode(true);

    process.stdin.on("keypress", (str, key) => this.handleKeypress(str, key));

    this.render();
  }

  handleKeypress(str, key) {
    const step = this.steps[this.currentStepIndex];
    const choices = step.choices;

    if (key.name === "up") {
      if (this.selectionIndex > 0) {
        this.selectionIndex--;
        this.render();
      } else if (this.selectionIndex === 0) {
        // Wrap to bottom
        this.selectionIndex = choices.length - 1;
        this.render();
      }
    } else if (key.name === "down") {
      if (this.selectionIndex < choices.length - 1) {
        this.selectionIndex++;
        this.render();
      } else {
        // Wrap to top
        this.selectionIndex = 0;
        this.render();
      }
    } else if (key.name === "return") {
      const selected = choices[this.selectionIndex];
      if (selected && selected.onSelect) {
        selected.onSelect(this);
      }
    } else if (key.name === "escape") {
      if (this.currentStepIndex > 0) {
        this.currentStepIndex--;
        this.selectionIndex = 0;
        this.render();
      }
    } else if (key.ctrl && key.name === "c") {
      this.exit();
    }
  }

  nextStep(step) {
    this.steps.push(step);
    this.currentStepIndex = this.steps.length - 1;
    this.selectionIndex = 0;
    this.render();
  }

  render() {
    const step = this.steps[this.currentStepIndex];
    const choices = step.choices;
    const toolbar = step.toolbar || "ESC: Back | ENTER: Select";

    console.clear();
    console.log(bold(step.message));
    console.log("=".repeat(process.stdout.columns));

    // Paging logic
    const start =
      Math.floor(this.selectionIndex / this.pageSize) * this.pageSize;
    const end = Math.min(start + this.pageSize, choices.length);

    for (let i = start; i < end; i++) {
      const prefix =
        i === this.selectionIndex ? cyan(`> ${i + 1}.`) : dim(`  ${i + 1}.`);
      console.log(`${prefix} ${choices[i].name}`);
    }

    console.log("-".repeat(process.stdout.columns));
    console.log(yellow(toolbar));
  }

  exit() {
    this.rl.close();
    process.exit(0);
  }
}
