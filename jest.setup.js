// Jest setup file
// This file runs before tests

// Mock Electron modules
jest.mock('electron', () => ({
  app: {
    getPath: jest.fn(() => '/tmp/test'),
    getVersion: jest.fn(() => '0.1.0'),
    isPackaged: false,
    whenReady: jest.fn(() => Promise.resolve()),
    on: jest.fn(),
    quit: jest.fn()
  },
  BrowserWindow: jest.fn(),
  ipcMain: {
    handle: jest.fn(),
    on: jest.fn()
  },
  dialog: {
    showOpenDialog: jest.fn(),
    showSaveDialog: jest.fn(),
    showMessageBox: jest.fn(),
    showErrorBox: jest.fn()
  }
}));

// Mock electron-store
jest.mock('electron-store', () => {
  return jest.fn().mockImplementation(() => ({
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
    clear: jest.fn(),
    store: {}
  }));
});

// Suppress console errors in tests
global.console = {
  ...console,
  error: jest.fn(),
  warn: jest.fn()
};
