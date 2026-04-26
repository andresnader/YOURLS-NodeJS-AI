$BUN = "C:\Users\ACER\.bun\bin\bun.exe"
$ROOT = "$PSScriptRoot\.mind"
if ($args.Count -gt 0 -and $args[0] -eq "--complete") {
    $remainingArgs = $args[1..($args.Count - 1)]
    & $BUN run "$ROOT\src\complete.ts" $remainingArgs
} else {
    & $BUN run "$ROOT\src\mind.ts" $args
}
