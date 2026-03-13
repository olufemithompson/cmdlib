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

### Search mode

| Key | Action |
|-----|--------|
| Type anything | Filter your saved commands |
| `↑` / `↓` | Navigate results |
| `Enter` | Run the selected command |
| `Ctrl+A` | Save the typed command (opens description prompt) |
| `Ctrl+D` | Delete the selected command |
| `Ctrl+R` | Open shell history browser |
| `Esc` | Exit |

### History mode (`Ctrl+R`)

| Key | Action |
|-----|--------|
| Type anything | Filter shell history live |
| `↑` / `↓` | Navigate results |
| `Enter` | Run the selected command |
| `Ctrl+A` | Save selected command with a description |
| `Esc` | Go back to search |

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
