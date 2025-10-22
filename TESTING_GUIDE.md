# Testing Guide - Security & Quality Improvements

This guide walks you through testing all the security fixes and improvements.

## Prerequisites

First, install all the new dependencies:

```bash
npm install
```

This will install:
- winston (logging)
- react-window (performance)
- babel-jest, @testing-library/react (testing)

---

## 1. Automated Tests

### Run All Tests

```bash
npm test
```

Expected output:
```
PASS  src/main/utils/__tests__/path-validator.test.js
  PathValidator
    ✓ should add a path to allowed paths
    ✓ should prevent path traversal attacks
    ✓ should handle double path traversal attempts
    ✓ should handle URL-encoded path traversal
    ✓ should handle null byte injection attempts
    ... (15+ tests)

PASS  src/main/services/__tests__/import.test.js
  ImportService
    ✓ should analyze audio files and extract metadata
    ✓ should handle fingerprinting when enabled
    ... (more tests)

Test Suites: 2 passed, 2 total
Tests:       20+ passed, 20+ total
```

### Run with Coverage

```bash
npm test -- --coverage
```

This shows you which code is covered by tests.

### Run Specific Tests

```bash
# Test path validator only
npm test path-validator

# Test in watch mode (great for development)
npm test -- --watch
```

---

## 2. Manual Testing - Start the App

### Start Development Mode

```bash
npm run dev
```

This starts both the main process and renderer with hot-reload.

**What to check:**
- ✅ App starts without errors
- ✅ No console errors in terminal
- ✅ Logs appear in terminal (from new logger)

---

## 3. Test Path Validation (Security Fix #1)

### Test 1: Normal File Access (Should Work)

1. Start the app: `npm run dev`
2. Import a music file normally
3. Try to play it
4. **Expected:** File plays normally ✅

### Test 2: Path Traversal Attack (Should Block)

Open DevTools Console in the app (should open automatically in dev mode), then try:

```javascript
// Try to access a file outside the library
window.api.getAudioFileUrl('/etc/passwd')
```

**Expected:**
- ❌ Request blocked with 403 error
- ✅ Log message: "Access denied: Path is outside allowed directories"
- ✅ No file served

### Test 3: Check the Logs

After running the app, check the log files:

**On Linux/Mac:**
```bash
# Find userData directory
ls ~/.config/live-music-collector/

# View error log
cat ~/.config/live-music-collector/error.log

# View combined log
cat ~/.config/live-music-collector/combined.log
```

**On Windows:**
```powershell
# Find userData directory
dir %APPDATA%\live-music-collector\

# View logs
type %APPDATA%\live-music-collector\error.log
type %APPDATA%\live-music-collector\combined.log
```

**What you should see:**
```json
{"level":"info","message":"Application starting","version":"0.1.0","isPackaged":false,"timestamp":"2025-10-22 12:00:00"}
{"level":"info","message":"Added library path to allowed paths","libraryPath":"/home/user/music","timestamp":"2025-10-22 12:00:00"}
{"level":"info","message":"Audio server listening on http://127.0.0.1:54321","timestamp":"2025-10-22 12:00:00"}
```

---

## 4. Test Error Boundary (Error Handling)

### Method 1: Trigger a React Error

1. Open DevTools Console
2. Paste this code to simulate a component error:

```javascript
// This will trigger the error boundary
throw new Error('Test error boundary');
```

**Expected:**
- ✅ App doesn't crash
- ✅ Error fallback UI appears with:
  - Warning icon
  - "Something went wrong" message
  - Technical details (expandable)
  - "Try Again" button
  - "Go Home" button

### Method 2: Create a Test Component

Add this to any page temporarily:

```javascript
// Add to AlbumView.jsx or any component
const ErrorTest = () => {
  const [shouldError, setShouldError] = React.useState(false);

  if (shouldError) {
    throw new Error('Test error!');
  }

  return <button onClick={() => setShouldError(true)}>Trigger Error</button>;
};

// Then add <ErrorTest /> in the render
```

Click the button and verify the error boundary catches it.

---

## 5. Test Structured Logging

### Test 1: Check Log Levels

Add this to `src/main/index.js` temporarily:

```javascript
const logger = require('./utils/logger');

logger.debug('This is a debug message', { data: 'test' });
logger.info('This is an info message');
logger.warn('This is a warning', { reason: 'testing' });
logger.error('This is an error', { error: 'fake error' });
```

Run the app and check:
- ✅ In development: All messages appear in console
- ✅ In log files: Messages are structured JSON
- ✅ error.log contains only error level messages

### Test 2: Log Rotation

Check that logs don't grow forever:

```bash
# Check log file size (should be < 5MB each)
ls -lh ~/.config/live-music-collector/*.log
```

---

## 6. Test Web Security Fix

### Test: CSP and Security Headers

1. Start the app
2. Open DevTools Console
3. Try to execute inline script:

```javascript
// This should be blocked by security settings
eval('console.log("test")');
```

**Expected:**
- In production: Script blocked
- No XSS vulnerabilities

### Test: External Resources

Try loading external content:

```javascript
// Should be restricted
fetch('https://malicious-site.com/data')
```

**Expected:** Same-origin policy enforced ✅

---

## 7. Test Refactored Components

### Test Import Metadata Review

1. Start app: `npm run dev`
2. Go to Import page
3. Select audio files
4. Click "Review Metadata"

**Check that new components work:**
- ✅ BulkActionsBar appears at top
- ✅ "Run Fingerprinting" button works
- ✅ "Import Files" button works
- ✅ MetadataField components show comparisons
- ✅ TrackEditor rows display tracks

---

## 8. Integration Testing

### Full Import Workflow Test

1. **Setup:**
   ```bash
   npm run dev
   ```

2. **Import files:**
   - Navigate to Import page
   - Select a folder with audio files
   - Review metadata
   - Click "Import Files"

3. **Verify:**
   - ✅ Files import successfully
   - ✅ No path traversal errors in logs
   - ✅ Error boundary doesn't trigger
   - ✅ Logs show structured messages

---

## 9. Performance Testing

### Test with Large Libraries

```bash
# Import 100+ files
# Expected: No crashes, proper logging
```

Check logs for any errors or warnings.

---

## 10. Error Handling Testing

### Test 1: Crash Recovery

```javascript
// In main process, trigger an uncaught exception
process.emit('uncaughtException', new Error('Test crash'));
```

**Expected:**
- ✅ Error logged to error.log
- ✅ User sees error dialog
- ✅ App closes gracefully

### Test 2: Promise Rejection

```javascript
// Trigger unhandled rejection
Promise.reject(new Error('Test rejection'));
```

**Expected:**
- ✅ Error logged
- ✅ Warning in logs
- ✅ App continues running (doesn't crash)

---

## 11. Quick Smoke Test Checklist

Run through this checklist quickly:

```
□ npm install (no errors)
□ npm test (all tests pass)
□ npm run dev (app starts)
□ Import a file (works normally)
□ Play audio (works normally)
□ Check logs exist (in userData directory)
□ DevTools console (no errors)
□ Navigate between pages (no crashes)
□ Trigger error boundary (shows fallback UI)
```

---

## 12. Production Build Testing

### Build and Test

```bash
# Build for production
npm run build

# Run production build
npm run start
```

**Check:**
- ✅ No console.log in production (only structured logs)
- ✅ Error boundary works
- ✅ Path validation works
- ✅ Logs go to files (not console)

---

## Common Issues & Solutions

### Issue: "winston not found"

**Solution:**
```bash
npm install winston
```

The logger has a fallback, but winston provides better features.

### Issue: Tests fail with "Cannot find module"

**Solution:**
```bash
npm install --save-dev @babel/preset-env babel-jest
```

### Issue: "Cannot read property 'getPath' of undefined"

**Solution:** This is normal in tests. Electron is mocked in jest.setup.js.

### Issue: Logs not appearing

**Check:**
1. Look in userData directory:
   - Linux: `~/.config/live-music-collector/`
   - Mac: `~/Library/Application Support/live-music-collector/`
   - Windows: `%APPDATA%\live-music-collector\`

2. Run with LOG_LEVEL:
   ```bash
   LOG_LEVEL=debug npm run dev
   ```

---

## Expected Test Results Summary

After all tests, you should see:

✅ **Automated Tests:** 20+ tests passing
✅ **Path Validation:** Blocks malicious paths
✅ **Error Boundary:** Catches errors gracefully
✅ **Logging:** Structured logs in files
✅ **Web Security:** XSS protection enabled
✅ **Components:** New components render correctly
✅ **No Crashes:** App handles errors gracefully

---

## Next Steps After Testing

Once all tests pass:

1. **Review the changes:**
   ```bash
   git log -1 --stat
   ```

2. **Check the diff:**
   ```bash
   git show HEAD
   ```

3. **Merge to main** (if everything works):
   ```bash
   git checkout main
   git merge claude/code-review-011CUNRmeo9g1HeW3sWQS3CJ
   ```

4. **Deploy** with confidence! 🚀

---

## Need Help?

- Check `SECURITY_IMPROVEMENTS.md` for detailed documentation
- Review test files for examples: `src/main/utils/__tests__/path-validator.test.js`
- Look at the logger implementation: `src/main/utils/logger.js`

Happy testing! 🧪
