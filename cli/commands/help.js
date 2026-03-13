export function printHelp() {
  console.log(`
  cmdlib — your personal command library

  Usage:
    cmdlib              Launch interactive search (default)
    cmdlib --setup      Print the shell wrapper function (required on first install)
    cmdlib --help       Show this help message

  ─────────────────────────────────────────────────────

  SEARCH MODE  (launched on startup)

    Type anything       Filter your saved commands
    ↑ / ↓               Navigate results
    Enter               Run the selected command
                        (adds a new line if nothing is selected)
    Ctrl+A              Save the typed command — opens description prompt
    Ctrl+D              Delete the selected command (asks for confirmation)
    Ctrl+R              Open shell history browser
    ← / →               Move cursor within typed text
    Esc                 Exit

  ─────────────────────────────────────────────────────

  HISTORY MODE  (Ctrl+R from empty search)

    Type anything       Filter your shell history live
    ↑ / ↓               Navigate filtered results
    ← / →               Move cursor within search box
    Backspace           Edit search query
    Enter               Run the selected history command
    Ctrl+A              Save selected command with a description
    Esc                 Go back to search

  ─────────────────────────────────────────────────────

  ADD DESCRIPTION  (Ctrl+A)

    Type                Enter a description for the command
    Enter               Save the command to your library
    Esc                 Cancel and go back

  ─────────────────────────────────────────────────────

  DELETE CONFIRMATION  (Ctrl+D on a selected command)

    Enter               Confirm delete
    Esc                 Cancel and go back

  `);
}
