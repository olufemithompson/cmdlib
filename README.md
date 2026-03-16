# cmdlib

Your personal command library — search, save and run shell commands.

Never forget a useful command again. cmdlib lets you save commands with descriptions and instantly search and run them from your terminal.

## Install

```bash
npm install -g cmdlib
```

After installing, restart your terminal (or run `source ~/.bashrc` / `source ~/.zshrc`).

## Usage

```bash
cmdlib
```

Launches an interactive search UI.

---

### Search — empty (nothing typed)

| Key | Action |
|-----|--------|
| `↑` / `↓` | Navigate saved commands |
| `Ctrl+R` | Open shell history browser |
| `Esc` | Exit |

---

### Search — typing (text entered, no selection)

| Key | Action |
|-----|--------|
| `Enter` | New line (multi-line command) |
| `Ctrl+A` | Save typed command (opens description prompt) |
| `←` / `→` | Move cursor |
| `Esc` | Exit |

---

### Search — with results and selection

| Key | Action |
|-----|--------|
| `↑` / `↓` | Navigate results |
| `Enter` | Run selected command |
| `Ctrl+D` | Delete selected command |
| `Esc` | Exit |

---

### Add description prompt

Opened via `Ctrl+A` from search or history.

| Key | Action |
|-----|--------|
| Type | Enter description |
| `←` / `→` | Move cursor |
| `Enter` | Save command (does nothing if description is empty) |
| `Esc` | Cancel |

---

### Delete confirmation

Opened via `Ctrl+D` when a command is selected.

| Key | Action |
|-----|--------|
| `Enter` | Confirm delete |
| `Esc` | Cancel |

---

### History mode (`Ctrl+R`)

Browse and search your shell command history.

| Key | Action |
|-----|--------|
| Type | Filter history (matches all words) |
| `↑` / `↓` | Navigate results |
| `←` / `→` | Move cursor in search input |
| `Enter` | Run selected command |
| `Ctrl+A` | Save selected command (opens description prompt) |
| `Esc` | Go back |

---

## Manual setup

If the shell wrapper wasn't installed automatically, run:

```bash
# bash
cmdlib --setup >> ~/.bashrc && source ~/.bashrc

# zsh
cmdlib --setup >> ~/.zshrc && source ~/.zshrc
```

## Other commands

```bash
cmdlib --help     # Show help
cmdlib --setup    # Print shell wrapper for manual install
```

## Requirements

- Node.js 18+
- bash or zsh
