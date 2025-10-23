# Quick version check script for Windows PowerShell
# Run this to verify you have all the security improvements

Write-Host "🔍 Version Check - Live Music Collector" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check git branch
Write-Host "📍 Current Branch:" -ForegroundColor Yellow
git branch --show-current
Write-Host ""

# Check latest commits
Write-Host "📝 Recent Commits:" -ForegroundColor Yellow
git log --oneline -3
Write-Host ""

# Check for new files
Write-Host "✅ Checking for Security Improvement Files:" -ForegroundColor Yellow

$missing = 0

function Check-File {
    param($path)
    if (Test-Path $path) {
        Write-Host "  ✓ $path" -ForegroundColor Green
        return $true
    } else {
        Write-Host "  ✗ MISSING: $path" -ForegroundColor Red
        $script:missing++
        return $false
    }
}

Check-File "SECURITY_IMPROVEMENTS.md"
Check-File "TESTING_GUIDE.md"
Check-File "test-security.sh"
Check-File "src\main\utils\logger.js"
Check-File "src\main\utils\path-validator.js"
Check-File "src\main\utils\__tests__\path-validator.test.js"
Check-File "src\renderer\components\ErrorBoundary.jsx"
Check-File "src\renderer\components\import\BulkActionsBar.jsx"
Check-File "src\renderer\components\import\MetadataField.jsx"
Check-File "src\renderer\components\import\TrackEditor.jsx"
Check-File "jest.config.js"

Write-Host ""

# Check for security fixes in code
Write-Host "🔒 Checking for Security Fixes in Code:" -ForegroundColor Yellow

if (Select-String -Path "src\main\index.js" -Pattern "webSecurity: true" -Quiet) {
    Write-Host "  ✓ Web security enabled" -ForegroundColor Green
} else {
    Write-Host "  ✗ Web security NOT enabled" -ForegroundColor Red
    $missing++
}

if (Select-String -Path "src\main\index.js" -Pattern "pathValidator" -Quiet) {
    Write-Host "  ✓ Path validator in use" -ForegroundColor Green
} else {
    Write-Host "  ✗ Path validator NOT in use" -ForegroundColor Red
    $missing++
}

if (Select-String -Path "src\main\index.js" -Pattern "const logger = require\('./utils/logger'\)" -Quiet) {
    Write-Host "  ✓ Logger imported" -ForegroundColor Green
} else {
    Write-Host "  ✗ Logger NOT imported" -ForegroundColor Red
    $missing++
}

if (Select-String -Path "src\renderer\App.jsx" -Pattern "ErrorBoundary" -Quiet) {
    Write-Host "  ✓ ErrorBoundary added to App" -ForegroundColor Green
} else {
    Write-Host "  ✗ ErrorBoundary NOT added" -ForegroundColor Red
    $missing++
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan

if ($missing -eq 0) {
    Write-Host "✅ SUCCESS! You have the latest version with all security fixes!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Expected commits:"
    Write-Host "  • 223cf90 - Version check script"
    Write-Host "  • e110495 - Testing documentation"
    Write-Host "  • 03b89a8 - Security fixes"
    Write-Host ""
    Write-Host "Ready to run: npm run dev" -ForegroundColor Green
} else {
    Write-Host "⚠️  MISSING $missing items!" -ForegroundColor Red
    Write-Host ""
    Write-Host "You may need to:"
    Write-Host "  git fetch origin"
    Write-Host "  git checkout claude/code-review-011CUNRmeo9g1HeW3sWQS3CJ"
    Write-Host "  git pull origin claude/code-review-011CUNRmeo9g1HeW3sWQS3CJ"
}

Write-Host ""
