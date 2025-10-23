#!/bin/bash

# Quick version check script
# Run this to verify you have all the security improvements

echo "🔍 Version Check - Live Music Collector"
echo "========================================"
echo ""

# Check git branch
echo "📍 Current Branch:"
git branch --show-current
echo ""

# Check latest commits
echo "📝 Recent Commits:"
git log --oneline -3
echo ""

# Check for new files
echo "✅ Checking for Security Improvement Files:"

check_file() {
    if [ -f "$1" ]; then
        echo "  ✓ $1"
        return 0
    else
        echo "  ✗ MISSING: $1"
        return 1
    fi
}

MISSING=0

check_file "SECURITY_IMPROVEMENTS.md" || ((MISSING++))
check_file "TESTING_GUIDE.md" || ((MISSING++))
check_file "test-security.sh" || ((MISSING++))
check_file "src/main/utils/logger.js" || ((MISSING++))
check_file "src/main/utils/path-validator.js" || ((MISSING++))
check_file "src/main/utils/__tests__/path-validator.test.js" || ((MISSING++))
check_file "src/renderer/components/ErrorBoundary.jsx" || ((MISSING++))
check_file "src/renderer/components/import/BulkActionsBar.jsx" || ((MISSING++))
check_file "src/renderer/components/import/MetadataField.jsx" || ((MISSING++))
check_file "src/renderer/components/import/TrackEditor.jsx" || ((MISSING++))
check_file "jest.config.js" || ((MISSING++))

echo ""

# Check for security fixes in code
echo "🔒 Checking for Security Fixes in Code:"

if grep -q "webSecurity: true" src/main/index.js 2>/dev/null; then
    echo "  ✓ Web security enabled"
else
    echo "  ✗ Web security NOT enabled"
    ((MISSING++))
fi

if grep -q "pathValidator" src/main/index.js 2>/dev/null; then
    echo "  ✓ Path validator in use"
else
    echo "  ✗ Path validator NOT in use"
    ((MISSING++))
fi

if grep -q "const logger = require('./utils/logger')" src/main/index.js 2>/dev/null; then
    echo "  ✓ Logger imported"
else
    echo "  ✗ Logger NOT imported"
    ((MISSING++))
fi

if grep -q "ErrorBoundary" src/renderer/App.jsx 2>/dev/null; then
    echo "  ✓ ErrorBoundary added to App"
else
    echo "  ✗ ErrorBoundary NOT added"
    ((MISSING++))
fi

echo ""
echo "========================================"

if [ $MISSING -eq 0 ]; then
    echo "✅ SUCCESS! You have the latest version with all security fixes!"
    echo ""
    echo "Expected commits:"
    echo "  • e110495 - Testing documentation"
    echo "  • 03b89a8 - Security fixes"
    echo ""
    echo "Ready to run: npm run dev"
else
    echo "⚠️  MISSING $MISSING items!"
    echo ""
    echo "You may need to:"
    echo "  git fetch origin"
    echo "  git checkout claude/code-review-011CUNRmeo9g1HeW3sWQS3CJ"
    echo "  git pull origin claude/code-review-011CUNRmeo9g1HeW3sWQS3CJ"
fi

echo ""
