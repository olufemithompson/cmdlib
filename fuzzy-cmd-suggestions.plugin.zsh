#!/usr/bin/env zsh
# fuzzy-cmd-suggestions.plugin.zsh
# A zsh plugin for fuzzy command suggestions that appear below the input line

# Command database - replace with your actual commands
typeset -A FUZZY_COMMANDS
FUZZY_COMMANDS=(
    "ls -la" "List all files with detailed information"
    "grep -r 'pattern' ." "Search for pattern recursively in current directory"
    "find . -name '*.py'" "Find all Python files in current directory"
    "docker ps" "List running Docker containers"
    "docker images" "List Docker images"
    "git status" "Show Git repository status"
    "git log --oneline" "Show Git commit history in one line format"
    "git branch -a" "Show all Git branches"
    "ps aux" "Show all running processes"
    "netstat -tulpn" "Show network connections and listening ports"
    "df -h" "Show disk usage in human readable format"
    "top" "Show running processes and system resources"
    "htop" "Interactive process viewer"
    "tail -f /var/log/syslog" "Follow system log file"
    "chmod +x filename" "Make file executable"
    "ssh user@hostname" "Connect to remote host via SSH"
    "scp file user@host:/path" "Copy file to remote host"
    "curl -X GET 'https://api.example.com'" "Make HTTP GET request"
    "python -m http.server 8000" "Start Python HTTP server on port 8000"
    "npm install package" "Install npm package"
)

# Configuration
FUZZY_CMD_MAX_SUGGESTIONS=${FUZZY_CMD_MAX_SUGGESTIONS:-8}
FUZZY_CMD_SELECTED_INDEX=0
FUZZY_CMD_SUGGESTIONS=()
FUZZY_CMD_DISPLAY_LINES=0

# Colors
FUZZY_CMD_HIGHLIGHT_COLOR=${FUZZY_CMD_HIGHLIGHT_COLOR:-"black,bg-white"}
FUZZY_CMD_NORMAL_COLOR=${FUZZY_CMD_NORMAL_COLOR:-"cyan"}
FUZZY_CMD_DESC_COLOR=${FUZZY_CMD_DESC_COLOR:-"blue"}

# Fuzzy matching function
fuzzy_match_score() {
    local query="$1"
    local text="$2"
    local score=0
    
    # Convert to lowercase
    query="${query:l}"
    text="${text:l}"
    
    # Direct substring match gets high score
    if [[ "$text" == *"$query"* ]]; then
        local pos="${text[(i)$query]}"
        score=$((100 - pos))
    else
        # Simple character matching for fuzzy score
        local matched=0
        local total=${#query}
        local i=1
        for (( i=1; i<=total; i++ )); do
            local char="${query[i]}"
            if [[ "$text" == *"$char"* ]]; then
                ((matched++))
            fi
        done
        score=$((matched * 100 / total))
    fi
    
    echo $score
}

# Get fuzzy suggestions
get_fuzzy_suggestions() {
    local query="$1"
    local -a scored_commands
    local cmd desc score
    
    FUZZY_CMD_SUGGESTIONS=()
    
    [[ -z "$query" ]] && return
    
    # Score all commands
    for cmd desc in "${(@kv)FUZZY_COMMANDS}"; do
        local cmd_score=$(fuzzy_match_score "$query" "$cmd")
        local desc_score=$(fuzzy_match_score "$query" "$desc")
        local max_score=$((cmd_score > desc_score ? cmd_score : desc_score))
        
        if (( max_score > 20 )); then
            scored_commands+=("$max_score:$cmd:$desc")
        fi
    done
    
    # Sort by score and take top results
    local -a sorted=(${(On)scored_commands})
    local count=0
    for item in $sorted; do
        (( count >= FUZZY_CMD_MAX_SUGGESTIONS )) && break
        local parts=(${(s/:/)item})
        FUZZY_CMD_SUGGESTIONS+=("${parts[2]}:${parts[3]}")
        ((count++))
    done
}

# Clear suggestion display
clear_suggestions() {
    if (( FUZZY_CMD_DISPLAY_LINES > 0 )); then
        # Move cursor down and clear lines
        local i
        for (( i=0; i<FUZZY_CMD_DISPLAY_LINES; i++ )); do
            echo -n "\n\033[K"
        done
        # Move cursor back up
        echo -n "\033[${FUZZY_CMD_DISPLAY_LINES}A"
        FUZZY_CMD_DISPLAY_LINES=0
    fi
}

# Display suggestions below current line
display_suggestions() {
    clear_suggestions
    
    (( ${#FUZZY_CMD_SUGGESTIONS} == 0 )) && return
    
    local suggestion cmd desc
    local index=0
    
    echo  # Move to next line
    FUZZY_CMD_DISPLAY_LINES=1
    
    for suggestion in "${FUZZY_CMD_SUGGESTIONS[@]}"; do
        cmd="${suggestion%%:*}"
        desc="${suggestion#*:}"
        
        if (( index == FUZZY_CMD_SELECTED_INDEX )); then
            # Highlight selected
            echo -n "\033[7m► $cmd\033[0m"
            echo -n "\n\033[7m  $desc\033[0m"
        else
            echo -n "\033[36m  $cmd\033[0m"
            echo -n "\n\033[34m  $desc\033[0m"
        fi
        echo
        ((FUZZY_CMD_DISPLAY_LINES += 2))
        ((index++))
    done
    
    # Move cursor back to input line
    echo -n "\033[${FUZZY_CMD_DISPLAY_LINES}A"
}

# Widget to handle character input
fuzzy_cmd_self_insert() {
    zle self-insert
    local buffer="$BUFFER"
    
    # Get suggestions for current buffer
    get_fuzzy_suggestions "$buffer"
    FUZZY_CMD_SELECTED_INDEX=0
    display_suggestions
}

# Widget to handle up arrow
fuzzy_cmd_up_line_or_history() {
    if (( ${#FUZZY_CMD_SUGGESTIONS} > 0 && FUZZY_CMD_SELECTED_INDEX > 0 )); then
        ((FUZZY_CMD_SELECTED_INDEX--))
        display_suggestions
    else
        zle up-line-or-history
    fi
}

# Widget to handle down arrow
fuzzy_cmd_down_line_or_history() {
    if (( ${#FUZZY_CMD_SUGGESTIONS} > 0 && FUZZY_CMD_SELECTED_INDEX < ${#FUZZY_CMD_SUGGESTIONS} - 1 )); then
        ((FUZZY_CMD_SELECTED_INDEX++))
        display_suggestions
    else
        zle down-line-or-history
    fi
}

# Widget to handle tab completion
fuzzy_cmd_accept_suggestion() {
    if (( ${#FUZZY_CMD_SUGGESTIONS} > 0 )); then
        local selected="${FUZZY_CMD_SUGGESTIONS[$((FUZZY_CMD_SELECTED_INDEX + 1))]}"
        local cmd="${selected%%:*}"
        BUFFER="$cmd"
        CURSOR=${#BUFFER}
        clear_suggestions
        FUZZY_CMD_SUGGESTIONS=()
    else
        zle expand-or-complete
    fi
}

# Widget to handle backspace
fuzzy_cmd_backward_delete_char() {
    zle backward-delete-char
    local buffer="$BUFFER"
    
    if [[ -n "$buffer" ]]; then
        get_fuzzy_suggestions "$buffer"
        FUZZY_CMD_SELECTED_INDEX=0
        display_suggestions
    else
        clear_suggestions
        FUZZY_CMD_SUGGESTIONS=()
    fi
}

# Widget to handle enter
fuzzy_cmd_accept_line() {
    clear_suggestions
    FUZZY_CMD_SUGGESTIONS=()
    zle accept-line
}

# Widget to handle escape
fuzzy_cmd_clear_screen() {
    clear_suggestions
    FUZZY_CMD_SUGGESTIONS=()
    zle clear-screen
}

# Create ZLE widgets
zle -N fuzzy-cmd-self-insert fuzzy_cmd_self_insert
zle -N fuzzy-cmd-up-line-or-history fuzzy_cmd_up_line_or_history
zle -N fuzzy-cmd-down-line-or-history fuzzy_cmd_down_line_or_history
zle -N fuzzy-cmd-accept-suggestion fuzzy_cmd_accept_suggestion
zle -N fuzzy-cmd-backward-delete-char fuzzy_cmd_backward_delete_char
zle -N fuzzy-cmd-accept-line fuzzy_cmd_accept_line
zle -N fuzzy-cmd-clear-screen fuzzy_cmd_clear_screen

# Function to enable fuzzy suggestions
enable_fuzzy_suggestions() {
    # Bind keys to our widgets
    local key
    
    # Bind all printable characters
    for key in {a..z} {A..Z} {0..9} ' ' '-' '_' '.' '/' '=' '+' '*' '&' '%' '$' '#' '@' '!' '~' '`' '|' '\\' ';' ':' '"' "'" '?' '>' '<' ',' '(' ')' '[' ']' '{' '}'; do
        bindkey "$key" fuzzy-cmd-self-insert
    done
    
    # Bind special keys
    bindkey "^[[A" fuzzy-cmd-up-line-or-history      # Up arrow
    bindkey "^[[B" fuzzy-cmd-down-line-or-history    # Down arrow
    bindkey "^I" fuzzy-cmd-accept-suggestion         # Tab
    bindkey "^?" fuzzy-cmd-backward-delete-char      # Backspace
    bindkey "^M" fuzzy-cmd-accept-line               # Enter
    bindkey "^L" fuzzy-cmd-clear-screen              # Ctrl+L
}

# Function to disable fuzzy suggestions
disable_fuzzy_suggestions() {
    # Reset to default bindings
    bindkey -d  # Reset to default keymap
    bindkey -e  # Use emacs keymap (or -v for vi)
}

# Auto-enable when plugin loads
enable_fuzzy_suggestions

# Export functions for manual control
alias fuzzy-cmd-enable='enable_fuzzy_suggestions'
alias fuzzy-cmd-disable='disable_fuzzy_suggestions'

echo "Fuzzy command suggestions loaded! Use 'fuzzy-cmd-disable' to turn off, 'fuzzy-cmd-enable' to turn back on."
