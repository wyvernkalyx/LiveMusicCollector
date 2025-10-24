const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);
const path = require('path');
const fs = require('fs').promises;
const fsSync = require('fs');

/**
 * Service for writing metadata tags to audio files (FLAC, MP3, M4A)
 * Supports Vorbis Comments (FLAC), ID3v2 (MP3), and MP4 tags (M4A)
 *
 * Windows-compatible implementation using command-line tools and node-id3
 */
class MetadataWriter {
  constructor() {
    this.tempDir = path.join(process.cwd(), 'temp');
  }

  /**
   * Ensure temp directory exists
   */
  async ensureTempDir() {
    if (!fsSync.existsSync(this.tempDir)) {
      await fs.mkdir(this.tempDir, { recursive: true });
    }
  }

  /**
   * Write metadata to audio file based on format
   * @param {string} filePath - Path to audio file
   * @param {object} metadata - Metadata object
   * @param {object} options - Writing options
   * @returns {Promise<boolean>} Success status
   */
  async writeMetadata(filePath, metadata, options = {}) {
    const ext = path.extname(filePath).toLowerCase();

    try {
      switch (ext) {
        case '.flac':
          return await this.writeFLACMetadata(filePath, metadata, options);
        case '.mp3':
          return await this.writeMP3Metadata(filePath, metadata, options);
        case '.m4a':
        case '.mp4':
          return await this.writeM4AMetadata(filePath, metadata, options);
        default:
          console.error(`Unsupported file format: ${ext}`);
          return false;
      }
    } catch (error) {
      console.error(`Error writing metadata to ${filePath}:`, error);
      throw error;
    }
  }

  /**
   * Write FLAC Vorbis Comments using metaflac
   */
  async writeFLACMetadata(filePath, metadata, options = {}) {
    console.log(`Writing FLAC metadata to: ${filePath}`);

    // Check if metaflac is available
    const hasMetaflac = await this.checkCommandAvailable('metaflac');
    if (!hasMetaflac) {
      console.error('metaflac not found. Please install FLAC command-line tools.');
      return false;
    }

    try {
      // Format song title with date if specified
      const title = this.formatSongTitle(metadata.title, metadata.date);

      // Remove all existing tags first
      await execAsync(`metaflac --remove-all-tags "${filePath}"`);

      // Build metadata tags
      const tags = [];
      if (title) tags.push(`TITLE=${this.escapeMetaflacTag(title)}`);
      if (metadata.artist) tags.push(`ARTIST=${this.escapeMetaflacTag(metadata.artist)}`);
      if (metadata.album) tags.push(`ALBUM=${this.escapeMetaflacTag(metadata.album)}`);
      if (metadata.albumArtist) tags.push(`ALBUMARTIST=${this.escapeMetaflacTag(metadata.albumArtist)}`);
      if (metadata.date) tags.push(`DATE=${metadata.date}`);
      if (metadata.trackNumber) tags.push(`TRACKNUMBER=${metadata.trackNumber}`);
      if (metadata.genre) tags.push(`GENRE=${this.escapeMetaflacTag(metadata.genre)}`);

      // Custom tags for live shows
      if (metadata.venue) tags.push(`VENUE=${this.escapeMetaflacTag(metadata.venue)}`);
      if (metadata.city) tags.push(`CITY=${this.escapeMetaflacTag(metadata.city)}`);
      if (metadata.state) tags.push(`STATE=${this.escapeMetaflacTag(metadata.state)}`);
      if (metadata.notes) tags.push(`COMMENT=${this.escapeMetaflacTag(metadata.notes)}`);
      if (metadata.sourceType) tags.push(`SOURCE=${this.escapeMetaflacTag(metadata.sourceType)}`);
      if (metadata.taper) tags.push(`TAPER=${this.escapeMetaflacTag(metadata.taper)}`);
      if (metadata.lineage) tags.push(`LINEAGE=${this.escapeMetaflacTag(metadata.lineage)}`);

      // Write all tags
      for (const tag of tags) {
        await execAsync(`metaflac --set-tag="${tag}" "${filePath}"`);
      }

      // Embed album art if provided
      if (options.albumArtPath && fsSync.existsSync(options.albumArtPath)) {
        await this.embedFLACAlbumArt(filePath, options.albumArtPath);
      }

      console.log(`✅ Successfully wrote FLAC metadata for: ${path.basename(filePath)}`);
      return true;
    } catch (error) {
      console.error('Error writing FLAC metadata:', error);
      return false;
    }
  }

  /**
   * Write MP3 ID3v2 tags using node-id3 or ffmpeg
   */
  async writeMP3Metadata(filePath, metadata, options = {}) {
    console.log(`Writing MP3 metadata to: ${filePath}`);

    // Try node-id3 first (cleaner, pure JS solution)
    try {
      const NodeID3 = require('node-id3');

      const title = this.formatSongTitle(metadata.title, metadata.date);

      const tags = {
        title: title,
        artist: metadata.artist,
        album: metadata.album,
        year: metadata.date ? metadata.date.substring(0, 4) : undefined,
        trackNumber: metadata.trackNumber ? String(metadata.trackNumber) : undefined,
        genre: metadata.genre || 'Live',
        comment: {
          language: 'eng',
          text: this.buildComment(metadata)
        }
      };

      // Add album art if provided
      if (options.albumArtPath && fsSync.existsSync(options.albumArtPath)) {
        tags.image = await fs.readFile(options.albumArtPath);
      }

      // Write tags
      const success = NodeID3.write(tags, filePath);

      if (success) {
        console.log(`✅ Successfully wrote MP3 metadata for: ${path.basename(filePath)}`);
        return true;
      } else {
        throw new Error('node-id3 failed to write tags');
      }
    } catch (error) {
      // Fallback to ffmpeg
      console.log('node-id3 not available, falling back to ffmpeg');
      return await this.writeMP3MetadataWithFFmpeg(filePath, metadata, options);
    }
  }

  /**
   * Write MP3 metadata using ffmpeg (fallback)
   */
  async writeMP3MetadataWithFFmpeg(filePath, metadata, options = {}) {
    const hasFFmpeg = await this.checkCommandAvailable('ffmpeg');
    if (!hasFFmpeg) {
      console.error('ffmpeg not found. Please install ffmpeg or node-id3.');
      return false;
    }

    try {
      await this.ensureTempDir();
      const tempFile = path.join(this.tempDir, `temp_${Date.now()}${path.extname(filePath)}`);

      const title = this.formatSongTitle(metadata.title, metadata.date);

      // Build ffmpeg metadata arguments
      const metadataArgs = [
        '-i', `"${filePath}"`,
        '-c', 'copy',
        '-id3v2_version', '3'
      ];

      if (title) metadataArgs.push('-metadata', `title="${this.escapeFFmpegMeta(title)}"`);
      if (metadata.artist) metadataArgs.push('-metadata', `artist="${this.escapeFFmpegMeta(metadata.artist)}"`);
      if (metadata.album) metadataArgs.push('-metadata', `album="${this.escapeFFmpegMeta(metadata.album)}"`);
      if (metadata.date) metadataArgs.push('-metadata', `date="${metadata.date}"`);
      if (metadata.trackNumber) metadataArgs.push('-metadata', `track="${metadata.trackNumber}"`);
      if (metadata.genre) metadataArgs.push('-metadata', `genre="${this.escapeFFmpegMeta(metadata.genre)}"`);

      const comment = this.buildComment(metadata);
      if (comment) metadataArgs.push('-metadata', `comment="${this.escapeFFmpegMeta(comment)}"`);

      metadataArgs.push(`"${tempFile}"`);

      await execAsync(`ffmpeg ${metadataArgs.join(' ')} -y`);

      // Replace original with temp file
      await fs.unlink(filePath);
      await fs.rename(tempFile, filePath);

      // Add album art if provided (requires separate step)
      if (options.albumArtPath && fsSync.existsSync(options.albumArtPath)) {
        await this.embedMP3AlbumArtWithFFmpeg(filePath, options.albumArtPath);
      }

      console.log(`✅ Successfully wrote MP3 metadata for: ${path.basename(filePath)}`);
      return true;
    } catch (error) {
      console.error('Error writing MP3 metadata with ffmpeg:', error);
      return false;
    }
  }

  /**
   * Write M4A metadata using ffmpeg
   */
  async writeM4AMetadata(filePath, metadata, options = {}) {
    console.log(`Writing M4A metadata to: ${filePath}`);

    const hasFFmpeg = await this.checkCommandAvailable('ffmpeg');
    if (!hasFFmpeg) {
      console.error('ffmpeg not found. Please install ffmpeg.');
      return false;
    }

    try {
      await this.ensureTempDir();
      const tempFile = path.join(this.tempDir, `temp_${Date.now()}${path.extname(filePath)}`);

      const title = this.formatSongTitle(metadata.title, metadata.date);

      // Build ffmpeg metadata arguments for M4A
      const metadataArgs = [
        '-i', `"${filePath}"`,
        '-c', 'copy'
      ];

      if (title) metadataArgs.push('-metadata', `title="${this.escapeFFmpegMeta(title)}"`);
      if (metadata.artist) metadataArgs.push('-metadata', `artist="${this.escapeFFmpegMeta(metadata.artist)}"`);
      if (metadata.album) metadataArgs.push('-metadata', `album="${this.escapeFFmpegMeta(metadata.album)}"`);
      if (metadata.date) metadataArgs.push('-metadata', `date="${metadata.date}"`);
      if (metadata.trackNumber) metadataArgs.push('-metadata', `track="${metadata.trackNumber}"`);
      if (metadata.genre) metadataArgs.push('-metadata', `genre="${this.escapeFFmpegMeta(metadata.genre)}"`);

      const comment = this.buildComment(metadata);
      if (comment) metadataArgs.push('-metadata', `comment="${this.escapeFFmpegMeta(comment)}"`);

      metadataArgs.push(`"${tempFile}"`);

      await execAsync(`ffmpeg ${metadataArgs.join(' ')} -y`);

      // Replace original with temp file
      await fs.unlink(filePath);
      await fs.rename(tempFile, filePath);

      // Add album art if provided
      if (options.albumArtPath && fsSync.existsSync(options.albumArtPath)) {
        await this.embedM4AAlbumArtWithFFmpeg(filePath, options.albumArtPath);
      }

      console.log(`✅ Successfully wrote M4A metadata for: ${path.basename(filePath)}`);
      return true;
    } catch (error) {
      console.error('Error writing M4A metadata:', error);
      return false;
    }
  }

  /**
   * Embed album art in FLAC file
   */
  async embedFLACAlbumArt(filePath, artPath) {
    try {
      // Remove existing pictures first
      await execAsync(`metaflac --remove --block-type=PICTURE "${filePath}"`);

      // Add new picture
      await execAsync(`metaflac --import-picture-from="${artPath}" "${filePath}"`);

      console.log(`✅ Embedded album art in FLAC: ${path.basename(filePath)}`);
      return true;
    } catch (error) {
      console.error('Error embedding FLAC album art:', error);
      return false;
    }
  }

  /**
   * Embed album art in MP3 file using ffmpeg
   */
  async embedMP3AlbumArtWithFFmpeg(filePath, artPath) {
    try {
      await this.ensureTempDir();
      const tempFile = path.join(this.tempDir, `temp_art_${Date.now()}.mp3`);

      await execAsync(
        `ffmpeg -i "${filePath}" -i "${artPath}" -map 0:0 -map 1:0 -c copy -id3v2_version 3 ` +
        `-metadata:s:v title="Album cover" -metadata:s:v comment="Cover (front)" "${tempFile}" -y`
      );

      await fs.unlink(filePath);
      await fs.rename(tempFile, filePath);

      console.log(`✅ Embedded album art in MP3: ${path.basename(filePath)}`);
      return true;
    } catch (error) {
      console.error('Error embedding MP3 album art:', error);
      return false;
    }
  }

  /**
   * Embed album art in M4A file using ffmpeg
   */
  async embedM4AAlbumArtWithFFmpeg(filePath, artPath) {
    try {
      await this.ensureTempDir();
      const tempFile = path.join(this.tempDir, `temp_art_${Date.now()}.m4a`);

      await execAsync(
        `ffmpeg -i "${filePath}" -i "${artPath}" -map 0:0 -map 1:0 -c copy ` +
        `-disposition:v:0 attached_pic "${tempFile}" -y`
      );

      await fs.unlink(filePath);
      await fs.rename(tempFile, filePath);

      console.log(`✅ Embedded album art in M4A: ${path.basename(filePath)}`);
      return true;
    } catch (error) {
      console.error('Error embedding M4A album art:', error);
      return false;
    }
  }

  /**
   * Batch write metadata to multiple files
   * @param {Array<{path: string, metadata: object}>} files - Array of file/metadata pairs
   * @param {object} options - Writing options (shared across all files)
   * @param {Function} progressCallback - Progress callback function
   */
  async batchWriteMetadata(files, options = {}, progressCallback) {
    const results = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      try {
        const success = await this.writeMetadata(file.path, file.metadata, options);
        results.push({ path: file.path, success });

        if (progressCallback) {
          progressCallback({
            current: i + 1,
            total: files.length,
            file: path.basename(file.path),
            success
          });
        }
      } catch (error) {
        console.error(`Failed to write metadata for ${file.path}:`, error);
        results.push({ path: file.path, success: false, error: error.message });

        if (progressCallback) {
          progressCallback({
            current: i + 1,
            total: files.length,
            file: path.basename(file.path),
            success: false,
            error: error.message
          });
        }
      }
    }

    return results;
  }

  /**
   * Format song title with date: "Song Name (YYYY-MM-DD)"
   */
  formatSongTitle(title, date) {
    if (!title) return '';
    if (!date) return title;

    // Check if date is already in title
    if (title.includes(`(${date})`)) {
      return title;
    }

    return `${title} (${date})`;
  }

  /**
   * Build comment field from metadata
   */
  buildComment(metadata) {
    const parts = [];

    if (metadata.venue) parts.push(`Venue: ${metadata.venue}`);
    if (metadata.city && metadata.state) {
      parts.push(`Location: ${metadata.city}, ${metadata.state}`);
    } else if (metadata.city) {
      parts.push(`Location: ${metadata.city}`);
    }
    if (metadata.notes) parts.push(metadata.notes);
    if (metadata.sourceType) parts.push(`Source: ${metadata.sourceType}`);
    if (metadata.taper) parts.push(`Taper: ${metadata.taper}`);
    if (metadata.lineage) parts.push(`Lineage: ${metadata.lineage}`);

    return parts.join(' | ');
  }

  /**
   * Escape special characters for metaflac tags
   */
  escapeMetaflacTag(str) {
    if (!str) return '';
    return str.replace(/"/g, '\\"');
  }

  /**
   * Escape special characters for ffmpeg metadata
   */
  escapeFFmpegMeta(str) {
    if (!str) return '';
    return str.replace(/"/g, '\\"').replace(/'/g, "\\'");
  }

  /**
   * Check if a command-line tool is available
   */
  async checkCommandAvailable(command) {
    try {
      const checkCmd = process.platform === 'win32' ? 'where' : 'which';
      await execAsync(`${checkCmd} ${command}`);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Download album art from URL to temp file
   */
  async downloadAlbumArt(url) {
    try {
      const axios = require('axios');
      await this.ensureTempDir();

      const response = await axios.get(url, { responseType: 'arraybuffer' });
      const ext = url.includes('.jpg') ? '.jpg' : '.png';
      const tempPath = path.join(this.tempDir, `album_art_${Date.now()}${ext}`);

      await fs.writeFile(tempPath, response.data);
      return tempPath;
    } catch (error) {
      console.error('Error downloading album art:', error);
      return null;
    }
  }

  /**
   * Cleanup temp directory
   */
  async cleanupTemp() {
    try {
      const files = await fs.readdir(this.tempDir);
      for (const file of files) {
        await fs.unlink(path.join(this.tempDir, file));
      }
    } catch (error) {
      console.error('Error cleaning up temp directory:', error);
    }
  }
}

module.exports = MetadataWriter;
