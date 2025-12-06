# PowerShell script to remove emojis from markdown files

$files = @(
    "README.md",
    "QUICK_RULES.md",
    "COMPLETE_BUSINESS_LOGIC.md",
    "API_FLOW_GUIDE.md",
    "DOCUMENTATION_CONSISTENCY_FIXES.md"
)

$rootDir = "c:\Users\Pawan Shetty\OneDrive\Desktop\BizArena v1"

foreach ($file in $files) {
    $path = Join-Path -Path $rootDir -ChildPath $file
    
    if (Test-Path $path) {
        Write-Host "Processing $file..."
        
        $content = Get-Content $path -Raw -Encoding UTF8
        
        # Remove emoji characters (Unicode ranges)
        # Emoticons
        $content = $content -replace '[\u{1F600}-\u{1F64F}]', ''
        # Symbols & Pictographs
        $content = $content -replace '[\u{1F300}-\u{1F5FF}]', ''
        # Transport & Map Symbols
        $content = $content -replace '[\u{1F680}-\u{1F6FF}]', ''
        # Supplemental Symbols and Pictographs
        $content = $content -replace '[\u{1F900}-\u{1F9FF}]', ''
        # Miscellaneous Symbols
        $content = $content -replace '[\u{2600}-\u{26FF}]', ''
        # Dingbats
        $content = $content -replace '[\u{2700}-\u{27BF}]', ''
        # Enclosed Alphanumeric Supplement
        $content = $content -replace '[\u{1F100}-\u{1F1FF}]', ''
        # Enclosed Ideographic Supplement
        $content = $content -replace '[\u{1F200}-\u{1F2FF}]', ''
        
        # Clean up any double spaces left by emoji removal
        $content = $content -replace '  +', ' '
        # Clean up space at beginning of lines after emoji removal
        $content = $content -replace '(?m)^\s+(\*\*|-)','$1'
        # Clean up lines that now start with whitespace followed by text
        $content = $content -replace '(?m)^- \s+', '- '
        
        Set-Content -Path $path -Value $content -Encoding UTF8 -NoNewline
        Write-Host "Completed $file"
    } else {
        Write-Host "File not found: $path" -ForegroundColor Yellow
    }
}

Write-Host "`nEmoji removal complete!" -ForegroundColor Green
