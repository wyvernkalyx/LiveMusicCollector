#!/bin/bash

# Security Testing Script
# Run this to quickly test all security improvements

echo "🔒 Live Music Collector - Security Testing Suite"
echo "================================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

# Function to run a test
run_test() {
    local test_name="$1"
    local test_command="$2"

    echo -n "Testing: $test_name... "

    if eval "$test_command" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ PASS${NC}"
        ((TESTS_PASSED++))
        return 0
    else
        echo -e "${RED}✗ FAIL${NC}"
        ((TESTS_FAILED++))
        return 1
    fi
}

# 1. Check if dependencies are installed
echo "Step 1: Checking Dependencies"
echo "------------------------------"

if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}⚠ node_modules not found. Running npm install...${NC}"
    npm install
fi

run_test "Winston installed" "npm list winston --depth=0"
run_test "React testing library installed" "npm list @testing-library/react --depth=0"
run_test "Jest installed" "npm list jest --depth=0"

echo ""

# 2. Run automated tests
echo "Step 2: Running Automated Tests"
echo "--------------------------------"

echo "Running Jest tests..."
if npm test -- --passWithNoTests 2>&1 | tee /tmp/test-output.log; then
    echo -e "${GREEN}✓ All tests passed${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${RED}✗ Some tests failed${NC}"
    ((TESTS_FAILED++))
    echo "Check /tmp/test-output.log for details"
fi

echo ""

# 3. Check file structure
echo "Step 3: Verifying File Structure"
echo "---------------------------------"

run_test "Logger utility exists" "test -f src/main/utils/logger.js"
run_test "Path validator exists" "test -f src/main/utils/path-validator.js"
run_test "Error boundary exists" "test -f src/renderer/components/ErrorBoundary.jsx"
run_test "Path validator tests exist" "test -f src/main/utils/__tests__/path-validator.test.js"
run_test "Jest config exists" "test -f jest.config.js"

echo ""

# 4. Check code changes
echo "Step 4: Verifying Security Fixes"
echo "---------------------------------"

# Check if webSecurity is enabled
if grep -q "webSecurity: true" src/main/index.js; then
    echo -e "${GREEN}✓ Web security enabled${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${RED}✗ Web security NOT enabled${NC}"
    ((TESTS_FAILED++))
fi

# Check if path validator is used
if grep -q "pathValidator.validatePath" src/main/index.js; then
    echo -e "${GREEN}✓ Path validation implemented${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${RED}✗ Path validation NOT implemented${NC}"
    ((TESTS_FAILED++))
fi

# Check if logger is imported
if grep -q "require('./utils/logger')" src/main/index.js; then
    echo -e "${GREEN}✓ Logger imported${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${RED}✗ Logger NOT imported${NC}"
    ((TESTS_FAILED++))
fi

# Check if ErrorBoundary is used
if grep -q "ErrorBoundary" src/renderer/App.jsx; then
    echo -e "${GREEN}✓ Error boundary added to App${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${RED}✗ Error boundary NOT added${NC}"
    ((TESTS_FAILED++))
fi

echo ""

# 5. Summary
echo "=========================================="
echo "Test Summary"
echo "=========================================="
echo -e "Tests Passed: ${GREEN}${TESTS_PASSED}${NC}"
echo -e "Tests Failed: ${RED}${TESTS_FAILED}${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 All security improvements verified!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Run 'npm run dev' to start the app"
    echo "2. Test the app manually (see TESTING_GUIDE.md)"
    echo "3. Check logs in userData directory"
    echo ""
    exit 0
else
    echo -e "${RED}⚠ Some tests failed. Please review the output above.${NC}"
    echo ""
    echo "Troubleshooting:"
    echo "1. Run 'npm install' to ensure all dependencies are installed"
    echo "2. Check TESTING_GUIDE.md for detailed instructions"
    echo "3. Review the failed tests above"
    echo ""
    exit 1
fi
