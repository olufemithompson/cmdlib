import chalk from "chalk";

export class TextUtils {
  static highlightMatch(text, query) {
    if (!query) return text;
    try {
      const regex = new RegExp(`(${this.escapeRegex(query)})`, "ig");
      return text.replace(regex, (m) => chalk.bgYellow.black(m));
    } catch {
      return text;
    }
  }

  static escapeRegex(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  static stripAnsi(str) {
    return str.replace(/\x1B\[[0-9;]*m/g, "");
  }

  static visibleLength(str) {
    const noAnsi = this.stripAnsi(str);
    const withSpaces = noAnsi.replace(/\t/g, "    ");
    return withSpaces.length;
  }

  static wordWrap(line, width) {
    if (width <= 0) return [line];
    const out = [];
    const words = line.split(/\s+/);
    let current = "";

    for (let w of words) {
      if (current.length === 0) {
        if (w.length <= width) {
          current = w;
        } else {
          while (w.length > width) {
            out.push(w.slice(0, width));
            w = w.slice(width);
          }
          current = w;
        }
      } else {
        const tentative = current + " " + w;
        if (tentative.length <= width) {
          current = tentative;
        } else {
          out.push(current);
          if (w.length <= width) {
            current = w;
          } else {
            while (w.length > width) {
              out.push(w.slice(0, width));
              w = w.slice(width);
            }
            current = w;
          }
        }
      }
    }
    if (current.length) out.push(current);
    return out;
  }

  static formatWrappedIndented(text, prefix, indent, colorize = (s) => s) {
    const termWidth = process.stdout.columns || 80;
    const prefixWidth = this.visibleLength(prefix);
    const indentWidth = this.visibleLength(indent);
    const available = Math.max(10, termWidth - (prefixWidth + indentWidth));

    const paragraphs = String(text).split("\n");
    const wrappedLines = [];

    for (const p of paragraphs) {
      const lines = this.wordWrap(p, available);
      if (lines.length === 0) {
        wrappedLines.push("");
      } else {
        wrappedLines.push(...lines);
      }
    }

    if (wrappedLines.length === 0) {
      return prefix + indent;
    }

    const continuationPrefix = " ".repeat(prefixWidth) + indent;
    const first = prefix + indent + colorize(wrappedLines[0]);
    const rest = wrappedLines
      .slice(1)
      .map((ln) => continuationPrefix + colorize(ln))
      .join("\n");

    return rest ? first + "\n" + rest : first;
  }
}
