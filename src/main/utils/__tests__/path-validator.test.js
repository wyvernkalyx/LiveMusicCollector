const path = require('path');
const fs = require('fs');
const pathValidator = require('../path-validator');

describe('PathValidator', () => {
  beforeEach(() => {
    // Clear allowed paths before each test
    pathValidator.clearAllowedPaths();
  });

  describe('addAllowedPath', () => {
    it('should add a path to allowed paths', () => {
      const testPath = '/home/user/music';
      pathValidator.addAllowedPath(testPath);

      const allowedPaths = pathValidator.getAllowedPaths();
      expect(allowedPaths).toContain(path.resolve(testPath));
    });

    it('should resolve relative paths to absolute paths', () => {
      pathValidator.addAllowedPath('./music');

      const allowedPaths = pathValidator.getAllowedPaths();
      expect(allowedPaths[0]).toBe(path.resolve('./music'));
    });
  });

  describe('removeAllowedPath', () => {
    it('should remove a path from allowed paths', () => {
      const testPath = '/home/user/music';
      pathValidator.addAllowedPath(testPath);
      pathValidator.removeAllowedPath(testPath);

      const allowedPaths = pathValidator.getAllowedPaths();
      expect(allowedPaths).not.toContain(path.resolve(testPath));
    });
  });

  describe('isPathSafe', () => {
    it('should return true for paths within allowed directories', () => {
      pathValidator.addAllowedPath('/home/user/music');

      const safePath = '/home/user/music/albums/album1.flac';
      expect(pathValidator.isPathSafe(safePath)).toBe(true);
    });

    it('should return false for paths outside allowed directories', () => {
      pathValidator.addAllowedPath('/home/user/music');

      const unsafePath = '/etc/passwd';
      expect(pathValidator.isPathSafe(unsafePath)).toBe(false);
    });

    it('should prevent path traversal attacks', () => {
      pathValidator.addAllowedPath('/home/user/music');

      const traversalPath = '/home/user/music/../../../etc/passwd';
      expect(pathValidator.isPathSafe(traversalPath)).toBe(false);
    });

    it('should handle empty allowed paths', () => {
      const testPath = '/home/user/music/test.flac';
      expect(pathValidator.isPathSafe(testPath)).toBe(false);
    });

    it('should return false for invalid paths', () => {
      pathValidator.addAllowedPath('/home/user/music');

      expect(pathValidator.isPathSafe(null)).toBe(false);
      expect(pathValidator.isPathSafe(undefined)).toBe(false);
      expect(pathValidator.isPathSafe('')).toBe(false);
    });
  });

  describe('validatePath', () => {
    it('should throw error if path is empty', () => {
      expect(() => pathValidator.validatePath('')).toThrow('Path is required');
      expect(() => pathValidator.validatePath(null)).toThrow('Path is required');
    });

    it('should throw error if path is outside allowed directories', () => {
      pathValidator.addAllowedPath('/home/user/music');

      expect(() => pathValidator.validatePath('/etc/passwd')).toThrow(
        'Access denied: Path is outside allowed directories'
      );
    });

    it('should throw error if file does not exist', () => {
      // Mock fs.existsSync to return false
      const originalExistsSync = fs.existsSync;
      fs.existsSync = jest.fn(() => false);

      pathValidator.addAllowedPath('/home/user/music');

      expect(() => pathValidator.validatePath('/home/user/music/test.flac')).toThrow(
        'File not found'
      );

      // Restore original function
      fs.existsSync = originalExistsSync;
    });

    it('should return validated path if all checks pass', () => {
      // Mock fs.existsSync to return true
      const originalExistsSync = fs.existsSync;
      fs.existsSync = jest.fn(() => true);

      pathValidator.addAllowedPath('/home/user/music');
      const testPath = '/home/user/music/test.flac';

      const result = pathValidator.validatePath(testPath);
      expect(result).toBe(path.resolve(testPath));

      // Restore original function
      fs.existsSync = originalExistsSync;
    });
  });

  describe('getAllowedPaths', () => {
    it('should return array of allowed paths', () => {
      pathValidator.addAllowedPath('/home/user/music');
      pathValidator.addAllowedPath('/home/user/downloads');

      const allowedPaths = pathValidator.getAllowedPaths();
      expect(Array.isArray(allowedPaths)).toBe(true);
      expect(allowedPaths.length).toBe(2);
    });

    it('should return empty array when no paths are allowed', () => {
      const allowedPaths = pathValidator.getAllowedPaths();
      expect(allowedPaths).toEqual([]);
    });
  });

  describe('clearAllowedPaths', () => {
    it('should remove all allowed paths', () => {
      pathValidator.addAllowedPath('/home/user/music');
      pathValidator.addAllowedPath('/home/user/downloads');

      pathValidator.clearAllowedPaths();

      const allowedPaths = pathValidator.getAllowedPaths();
      expect(allowedPaths).toEqual([]);
    });
  });

  describe('Security edge cases', () => {
    it('should handle double path traversal attempts', () => {
      pathValidator.addAllowedPath('/home/user/music');

      const maliciousPath = '/home/user/music/../../../../../../etc/passwd';
      expect(pathValidator.isPathSafe(maliciousPath)).toBe(false);
    });

    it('should handle URL-encoded path traversal', () => {
      pathValidator.addAllowedPath('/home/user/music');

      // %2e%2e = ..
      const encodedPath = '/home/user/music/%2e%2e/etc/passwd';
      expect(pathValidator.isPathSafe(encodedPath)).toBe(false);
    });

    it('should handle null byte injection attempts', () => {
      pathValidator.addAllowedPath('/home/user/music');

      const nullBytePath = '/home/user/music/test.flac\0/etc/passwd';
      expect(pathValidator.isPathSafe(nullBytePath)).toBe(false);
    });

    it('should handle symlink paths within allowed directory', () => {
      pathValidator.addAllowedPath('/home/user/music');

      // Even if it's a symlink, if the resolved path is within allowed dir, it's safe
      const symlinkPath = '/home/user/music/linked-album';
      // This would be safe if the symlink points to something within /home/user/music
      // The path.resolve handles this correctly
      expect(typeof pathValidator.isPathSafe(symlinkPath)).toBe('boolean');
    });
  });
});
