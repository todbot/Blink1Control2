# ScriptService Tests

## Basic execution (type: `script`)

| Test | macOS/Linux | Windows |
|---|---|---|
| Shell script / batch file | `echo "pattern:red"` in a `.sh` | `echo pattern:red` in a `.bat` |
| Executable with path spaces | `/path with spaces/script.sh` | `C:\Program Files\test\script.bat` |
| Script with arguments in path | `/usr/local/bin/myscript --flag` | `myscript.bat --flag` |
| Script that fails (exit non-zero) | `exit 1` | `exit 1` |
| Script that writes to stderr | `echo "err" >&2` | `echo err 1>&2` |
| Script that hangs | `sleep 999` | `timeout /t 999` — verify `stop()` kills it |
| Non-existent script | `/no/such/file.sh` | `C:\no\such\file.bat` — verify error logged |

## Output parsing

| Test | Script output | Expected |
|---|---|---|
| Color hex | `echo "#ff0000"` | triggers red |
| Named color | `echo "color: blue"` | triggers blue |
| Pattern name | `echo "pattern:blink"` | plays blink pattern |
| JSON color | `echo '{"color":"green"}'` | triggers green |
| JSON pattern | `echo '{"pattern":"blink"}'` | plays blink |
| Multi-line output | script outputs 10 lines | only parsed once, not once per line |
| Large output | script outputs >200 chars | truncated, no crash |

## `actOnNew` behavior

| Test | Expected |
|---|---|
| Same output twice in a row, `actOnNew: true` | Second run logs "not modified", no pattern play |
| Same output twice, `actOnNew: false` | Pattern plays both times |
| Output changes between runs | Pattern plays on every run |

## `stop()` / reload

| Test | Expected |
|---|---|
| Config reload while script is mid-run | Old process is killed, new interval starts cleanly |
| Rapid reload (reload 5x fast) | No accumulation of orphaned processes (check task manager / `ps`) |

## `file` and `url` types (share `parse()`)

| Test | Expected |
|---|---|
| File with `color: red` | triggers red |
| File that doesn't exist | error logged, no crash |
| URL returning `{"pattern":"blink"}` | plays blink pattern |
| URL returning 404 | error logged, no crash |
