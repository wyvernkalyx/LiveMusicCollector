/**
 * Path Validation Utilities
 *
 * Provides secure path validation to prevent path traversal attacks.
 */

const path = require('path');
const fs = require('fs');

class PathValidator {
  constructor() {
    this.allowedBasePaths = new Set();
  }

  /**
   * Register an allowed base path
   * @param {string} basePath - Base path to allow
   */
  addAllowedPath(basePath) {
    const resolved = path.resolve(basePath);
    this.allowedBasePaths.add(resolved);
  }

  /**
   * Remove an allowed base path
   * @param {string} basePath - Base path to remove
   */
  removeAllowedPath(basePath) {
    const resolved = path.resolve(basePath);
    this.allowedBasePaths.delete(resolved);
  }

  /**
   * Check if a path is within allowed directories
   * @param {string} requestedPath - Path to validate
   * @returns {boolean} True if path is safe
   */
  isPathSafe(requestedPath) {
    try {
      // Resolve to absolute path
      const resolved = path.resolve(requestedPath);

      // Check if path is within any allowed base path
      for (const basePath of this.allowedBasePaths) {
        if (resolved.startsWith(basePath)) {
          return true;
        }
      }

      return false;
    } catch (error) {
      return false;
    }
  }

  /**
   * Validate and return safe path
   * @param {string} requestedPath - Path to validate
   * @returns {string} Validated path
   * @throws {Error} If path is not safe
   */
  validatePath(requestedPath) {
    if (!requestedPath) {
      throw new Error('Path is required');
    }

    const resolved = path.resolve(requestedPath);

    if (!this.isPathSafe(resolved)) {
      throw new Error('Access denied: Path is outside allowed directories');
    }

    if (!fs.existsSync(resolved)) {
      throw new Error('File not found');
    }

    return resolved;
  }

  /**
   * Get all allowed base paths
   * @returns {Array<string>} Array of allowed paths
   */
  getAllowedPaths() {
    return Array.from(this.allowedBasePaths);
  }

  /**
   * Clear all allowed paths
   */
  clearAllowedPaths() {
    this.allowedBasePaths.clear();
  }
}

// Singleton instance
const pathValidator = new PathValidator();

module.exports = pathValidator;
