const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

class FolderScanner {
  constructor(database) {
    this.db = database;
    this.supportedExtensions = ['.flac', '.mp3', '.wav', '.alac', '.m4a', '.ape', '.ogg', '.opus', '.wma'];
    this.scannedHashes = new Set();
  }

  /**
   * Scan a folder recursively for audio files
   * @param {string} folderPath - Path to folder to scan
   * @param {object} options - Scanning options
   * @returns {array} Array of discovered audio files with metadata
   */
  async scanFolder(folderPath, options = {}) {
    const {
      recursive = true,
      skipExisting = true,
      progressCallback = null
    } = options;

    console.log('Starting folder scan:', folderPath);

    // Load existing file hashes if we're skipping duplicates
    if (skipExisting) {
      await this.loadExistingHashes();
    }

    const audioFiles = [];
    await this.scanDirectory(folderPath, audioFiles, recursive, progressCallback);

    console.log(`Found ${audioFiles.length} audio files`);

    // Filter out files we already have
    const newFiles = skipExisting ?
      await this.filterNewFiles(audioFiles) :
      audioFiles;

    console.log(`${newFiles.length} new files to import`);

    return newFiles;
  }

  /**
   * Recursively scan a directory for audio files
   */
  async scanDirectory(dirPath, audioFiles, recursive, progressCallback) {
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);

        if (entry.isDirectory() && recursive) {
          // Recursively scan subdirectories
          await this.scanDirectory(fullPath, audioFiles, recursive, progressCallback);
        } else if (entry.isFile()) {
          // Check if it's an audio file
          const ext = path.extname(entry.name).toLowerCase();
          if (this.supportedExtensions.includes(ext)) {
            try {
              const stats = await fs.stat(fullPath);

              const fileInfo = {
                path: fullPath,
                name: entry.name,
                size: stats.size,
                modified: stats.mtime,
                directory: dirPath
              };

              audioFiles.push(fileInfo);

              if (progressCallback) {
                progressCallback({
                  type: 'file_found',
                  file: fileInfo,
                  total: audioFiles.length
                });
              }
            } catch (error) {
              console.error('Error getting file stats:', fullPath, error);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error scanning directory:', dirPath, error);
    }
  }

  /**
   * Load existing file hashes from database
   */
  async loadExistingHashes() {
    try {
      const recordings = await this.db.allAsync(
        'SELECT file_hash FROM recordings WHERE file_hash IS NOT NULL'
      );

      this.scannedHashes.clear();
      for (const recording of recordings) {
        this.scannedHashes.add(recording.file_hash);
      }

      console.log(`Loaded ${this.scannedHashes.size} existing file hashes`);
    } catch (error) {
      console.error('Error loading existing hashes:', error);
    }
  }

  /**
   * Filter out files that already exist in the database
   */
  async filterNewFiles(audioFiles) {
    const newFiles = [];

    for (const file of audioFiles) {
      // Quick check by hash if we have it
      const hash = await this.getQuickHash(file.path);

      if (!this.scannedHashes.has(hash)) {
        // Also check by exact path
        const existing = await this.db.getAsync(
          'SELECT id FROM recordings WHERE library_path = ? OR original_path = ?',
          [file.path, file.path]
        );

        if (!existing) {
          newFiles.push(file);
        } else {
          console.log('File already in database (by path):', file.name);
        }
      } else {
        console.log('File already in database (by hash):', file.name);
      }
    }

    return newFiles;
  }

  /**
   * Get a quick hash of a file (first and last MB)
   * This is faster than hashing the entire file for large files
   */
  async getQuickHash(filePath) {
    const stats = await fs.stat(filePath);
    const hash = crypto.createHash('sha256');

    // Hash file size and modified time for quick comparison
    hash.update(stats.size.toString());
    hash.update(stats.mtime.toISOString());

    // Read first 1MB and last 1MB for sampling
    const chunkSize = 1024 * 1024; // 1MB
    const fd = await fs.open(filePath, 'r');

    try {
      // Read first chunk
      const firstBuffer = Buffer.alloc(Math.min(chunkSize, stats.size));
      await fd.read(firstBuffer, 0, firstBuffer.length, 0);
      hash.update(firstBuffer);

      // Read last chunk if file is larger than chunk size
      if (stats.size > chunkSize) {
        const lastBuffer = Buffer.alloc(Math.min(chunkSize, stats.size));
        const position = Math.max(0, stats.size - chunkSize);
        await fd.read(lastBuffer, 0, lastBuffer.length, position);
        hash.update(lastBuffer);
      }
    } finally {
      await fd.close();
    }

    return hash.digest('hex');
  }

  /**
   * Organize files by album/show
   * Groups files that appear to be from the same show/recording
   */
  organizeByShow(audioFiles) {
    const shows = new Map();

    for (const file of audioFiles) {
      // Use parent directory as show key
      const showKey = path.dirname(file.path);

      if (!shows.has(showKey)) {
        shows.set(showKey, {
          directory: showKey,
          files: [],
          estimatedDate: null,
          estimatedVenue: null
        });
      }

      shows.get(showKey).files.push(file);
    }

    // Try to extract show info from directory names
    for (const [key, show] of shows) {
      const dirName = path.basename(key);

      // Look for date patterns
      const dateMatch = dirName.match(/(\d{4})[._-](\d{2})[._-](\d{2})/);
      if (dateMatch) {
        show.estimatedDate = `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}`;
      }

      // Extract venue if present
      const venueParts = dirName.split(/\s*[-–]\s*/);
      if (venueParts.length > 1) {
        // Usually: Date - Venue - Location
        for (let i = 1; i < venueParts.length; i++) {
          const part = venueParts[i].trim();
          if (part && !part.match(/\d{4}/) && !part.match(/^\d/)) {
            show.estimatedVenue = part;
            break;
          }
        }
      }

      // Sort files by name (usually track order)
      show.files.sort((a, b) => a.name.localeCompare(b.name));
    }

    return Array.from(shows.values());
  }

  /**
   * Watch a folder for new files
   */
  async watchFolder(folderPath, callback) {
    const watcher = require('chokidar').watch(folderPath, {
      persistent: true,
      ignoreInitial: true,
      followSymlinks: false,
      depth: 10,
      awaitWriteFinish: {
        stabilityThreshold: 2000,
        pollInterval: 100
      }
    });

    watcher.on('add', async (filePath) => {
      const ext = path.extname(filePath).toLowerCase();
      if (this.supportedExtensions.includes(ext)) {
        const stats = await fs.stat(filePath);
        callback({
          type: 'new_file',
          file: {
            path: filePath,
            name: path.basename(filePath),
            size: stats.size,
            modified: stats.mtime
          }
        });
      }
    });

    return watcher;
  }
}

module.exports = FolderScanner;