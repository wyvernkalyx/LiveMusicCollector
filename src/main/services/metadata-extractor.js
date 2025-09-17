const mm = require('music-metadata');
const path = require('path');
const fs = require('fs').promises;

class MetadataExtractor {
  constructor() {
    // Common patterns for extracting metadata from filenames and paths
    this.patterns = {
      // Date patterns
      date: [
        /(\d{4})-(\d{2})-(\d{2})/, // 1969-06-05
        /(\d{2})-(\d{2})-(\d{4})/, // 06-05-1969
        /(\d{1,2})[_-](\d{1,2})[_-](\d{4})/, // 6_5_1969 or 6-5-1969
        /(\d{4})\.(\d{2})\.(\d{2})/, // 1969.06.05
        /(\d{2})\.(\d{2})\.(\d{2})/, // 69.06.05
      ],
      // Venue patterns
      venue: [
        /(?:at|@)\s+([^,_-]+?)(?:[,_-]|$)/i, // "at Fillmore West"
        /Live\s+(?:at|from)\s+([^,_-]+?)(?:[,_-]|$)/i, // "Live at Fillmore"
      ],
      // City/State patterns
      location: [
        /([^,]+),\s*([A-Z]{2})\b/, // "San Francisco, CA"
        /([^,]+)\s+([A-Z]{2})\s+\d{1,2}[_-]\d{1,2}[_-]\d{4}/, // "San Francisco CA 6_5_1969"
      ],
      // Set/Track patterns
      setTrack: [
        /^[sS](\d+)[tT](\d+)/, // s1t01, S2T03
        /^(\d+)-(\d+)/, // 1-01, 2-03
        /^[dD](\d+)[tT](\d+)/, // d1t01 (disc/track)
        /^(\d{1,2})(?:\s|_)/, // Leading track number
      ],
      // Source type patterns
      sourceType: [
        /\b(SBD|sbd)\b/i,
        /\b(AUD|aud)\b/i,
        /\b(MATRIX|matrix)\b/i,
        /\b(FM|fm)\b/i,
        /\b(OFFICIAL|official)\b/i,
      ],
      // Quality indicators
      quality: [
        /\b(FLAC|flac)(?:\d+)?\b/, // FLAC16, FLAC24
        /\b(\d+)\s*kbps\b/i, // 320kbps
        /\b(24|16)\s*bit\b/i, // 24bit, 16bit
      ]
    };
  }

  /**
   * Get duration using multiple fallback methods
   * @param {string} filePath - Full path to the audio file
   * @returns {number|null} Duration in seconds or null
   */
  async getDurationFallback(filePath) {
    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execAsync = promisify(exec);

    // Method 1: Try ffprobe first (most reliable)
    try {
      const { stdout } = await execAsync(
        `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${filePath}"`
      );
      const duration = parseFloat(stdout.trim());
      if (!isNaN(duration) && duration > 0) {
        console.log(`Got duration from ffprobe: ${duration} seconds`);
        return duration;
      }
    } catch (error) {
      console.log('ffprobe not available:', error.message);
    }

    // Method 2: Try Windows PowerShell (for Windows systems)
    if (process.platform === 'win32') {
      try {
        const command = `powershell -Command "(New-Object -ComObject Shell.Application).Namespace('${path.dirname(filePath)}').ParseName('${path.basename(filePath)}').ExtendedProperty('System.Media.Duration')"`;
        const { stdout } = await execAsync(command);
        // PowerShell returns duration in 100-nanosecond units
        const nanoseconds = parseInt(stdout.trim());
        if (!isNaN(nanoseconds) && nanoseconds > 0) {
          const duration = nanoseconds / 10000000; // Convert to seconds
          console.log(`Got duration from Windows Shell: ${duration} seconds`);
          return duration;
        }
      } catch (error) {
        console.log('Windows Shell method failed:', error.message);
      }
    }

    // Method 3: Try sox (if installed)
    try {
      const { stdout } = await execAsync(`soxi -D "${filePath}"`);
      const duration = parseFloat(stdout.trim());
      if (!isNaN(duration) && duration > 0) {
        console.log(`Got duration from sox: ${duration} seconds`);
        return duration;
      }
    } catch (error) {
      console.log('sox not available:', error.message);
    }

    return null;
  }

  /**
   * Extract all possible metadata from a file
   * @param {string} filePath - Full path to the audio file
   * @returns {object} Comprehensive metadata object
   */
  async extractMetadata(filePath) {
    const filename = path.basename(filePath);
    const directory = path.dirname(filePath);
    const parentDir = path.basename(directory);

    let metadata = {
      // File info
      path: filePath,
      filename: filename,
      directory: directory,

      // Will be populated with extracted data
      title: null,
      artist: null,
      album: null,
      date: null,
      venue: null,
      city: null,
      state: null,
      setNumber: null,
      trackNumber: null,
      sourceType: null,
      format: null,
      duration: null,
      bitrate: null,
      sampleRate: null,

      // Additional metadata
      taper: null,
      lineage: null,
      notes: null,
      quality: null,

      // Extraction sources
      sources: {
        tags: false,
        filename: false,
        directory: false
      }
    };

    // Get file stats
    try {
      const stats = await fs.stat(filePath);
      metadata.fileSize = stats.size;
    } catch (error) {
      console.error('Error getting file stats:', error);
    }

    // 1. Try to extract from audio file tags
    try {
      const audioMetadata = await mm.parseFile(filePath);
      if (audioMetadata) {
        metadata.sources.tags = true;

        // Common tags
        metadata.title = audioMetadata.common.title || null;
        metadata.artist = audioMetadata.common.artist || null;
        metadata.album = audioMetadata.common.album || null;
        metadata.date = audioMetadata.common.date || null;
        metadata.trackNumber = audioMetadata.common.track?.no || null;

        // Format info
        metadata.format = audioMetadata.format.codec || null;
        metadata.duration = audioMetadata.format.duration || null;
        metadata.bitrate = audioMetadata.format.bitrate || null;
        metadata.sampleRate = audioMetadata.format.sampleRate || null;
        metadata.bitsPerSample = audioMetadata.format.bitsPerSample || null;

        // Check comment fields for venue info
        const comment = audioMetadata.common.comment?.join(' ') || '';
        if (comment) {
          // Look for venue in comments
          const venueMatch = comment.match(/venue[:\s]+([^,\n]+)/i);
          if (venueMatch) metadata.venue = venueMatch[1].trim();

          // Look for source info
          const sourceMatch = comment.match(/source[:\s]+([^,\n]+)/i);
          if (sourceMatch) metadata.lineage = sourceMatch[1].trim();

          // Look for taper info
          const taperMatch = comment.match(/taper[:\s]+([^,\n]+)/i);
          if (taperMatch) metadata.taper = taperMatch[1].trim();
        }
      }
    } catch (error) {
      console.log('Could not read audio tags:', error.message);
    }

    // If duration is still null, try fallback methods
    if (!metadata.duration || metadata.duration === 0) {
      const fallbackDuration = await this.getDurationFallback(filePath);
      if (fallbackDuration) {
        metadata.duration = fallbackDuration;
        console.log(`Using fallback duration for ${filename}: ${fallbackDuration} seconds`);
      }
    }

    // 2. Extract from filename
    metadata = this.extractFromFilename(filename, metadata);

    // 3. Extract from directory structure
    metadata = this.extractFromDirectory(directory, parentDir, metadata);

    // 4. Apply defaults and cleanup
    metadata = this.applyDefaults(metadata);

    // 5. Normalize extracted data
    metadata = this.normalizeMetadata(metadata);

    return metadata;
  }

  /**
   * Extract metadata from filename
   */
  extractFromFilename(filename, metadata) {
    metadata.sources.filename = true;

    // Remove extension for processing
    const nameWithoutExt = filename.replace(/\.[^.]+$/, '');

    // Extract date
    if (!metadata.date) {
      for (const pattern of this.patterns.date) {
        const match = filename.match(pattern);
        if (match) {
          metadata.date = this.parseDate(match);
          break;
        }
      }
    }

    // Extract venue - but be careful with official releases
    if (!metadata.venue) {
      // Check for patterns like "Live_at_Tower_Theater_Philadelphia"
      const liveAtMatch = nameWithoutExt.match(/Live_at_([^_]+(?:_[^_]+)*?)_(?:Philadelphia|PA|[A-Z]{2})/i);
      if (liveAtMatch) {
        metadata.venue = liveAtMatch[1].replace(/_/g, ' ');
      } else {
        // Standard venue patterns
        for (const pattern of this.patterns.venue) {
          const match = nameWithoutExt.match(pattern);
          if (match) {
            metadata.venue = match[1].trim().replace(/_/g, ' ');
            break;
          }
        }
      }
    }

    // Extract location (city, state)
    if (!metadata.city || !metadata.state) {
      for (const pattern of this.patterns.location) {
        const match = nameWithoutExt.match(pattern);
        if (match) {
          metadata.city = metadata.city || match[1].trim();
          metadata.state = metadata.state || match[2].trim();
          break;
        }
      }
    }

    // Extract set and track numbers
    for (const pattern of this.patterns.setTrack) {
      const match = filename.match(pattern);
      if (match) {
        if (match[1] && match[2]) {
          metadata.setNumber = parseInt(match[1]);
          metadata.trackNumber = parseInt(match[2]);
        } else if (match[1]) {
          metadata.trackNumber = parseInt(match[1]);
        }
        break;
      }
    }

    // Extract source type
    if (!metadata.sourceType) {
      for (const pattern of this.patterns.sourceType) {
        const match = filename.match(pattern);
        if (match) {
          metadata.sourceType = match[1].toUpperCase();
          break;
        }
      }
    }

    // Extract title from filename if not in tags
    if (!metadata.title) {
      let title = nameWithoutExt;

      // Remove common prefixes
      title = title.replace(/^[sS]\d+[tT]\d+[-_\s]/, ''); // s1t01
      title = title.replace(/^\d{1,2}[-_\s]/, ''); // 01_
      title = title.replace(/^[dD]\d+[tT]\d+[-_\s]/, ''); // d1t01

      // Remove date patterns
      title = title.replace(/\d{1,2}[_-]\d{1,2}[_-]\d{4}/, '');
      title = title.replace(/\d{4}[_-]\d{2}[_-]\d{2}/, '');

      // Clean up
      title = title.replace(/_/g, ' ').trim();

      if (title) metadata.title = title;
    }

    // Get format from extension
    if (!metadata.format) {
      const ext = path.extname(filename).substring(1).toUpperCase();
      metadata.format = ext;
    }

    return metadata;
  }

  /**
   * Extract metadata from directory structure
   */
  extractFromDirectory(directory, parentDir, metadata) {
    metadata.sources.directory = true;

    // Check if this is an official release folder
    const officialPatterns = [
      'Anniversary',
      'Remaster',
      'Box Set',
      'Dick\'s Picks',
      'Dave\'s Picks',
      'Road Trips',
      'Download Series',
      'from the Vault',
      'Complete',
      'Deluxe',
      'Edition',
      'Volume',
      'Vol\\.',
      'Blues for Allah',
      'American Beauty',
      'Workingman\'s Dead',
      'Europe \'72'
    ];

    const isOfficialRelease = officialPatterns.some(pattern =>
      parentDir.match(new RegExp(pattern, 'i'))
    );

    if (isOfficialRelease) {
      // This is an official release - folder name is the album
      if (!metadata.album) {
        // Clean up the folder name to get album name
        let albumName = parentDir;

        // Remove band name prefix if present
        albumName = albumName.replace(/^Grateful Dead\s*[-–—]\s*/i, '');

        metadata.album = albumName;
        console.log('Detected official release album from folder:', albumName);
      }

      // Don't treat the album name as a venue
      return metadata;
    }

    // Common directory patterns for live shows:
    // Grateful Dead/1969/1969-06-05 - Fillmore West - San Francisco, CA
    // Band Name - 1969-06-05 - Venue - City, State

    // Try to extract date from parent directory
    if (!metadata.date) {
      for (const pattern of this.patterns.date) {
        const match = parentDir.match(pattern);
        if (match) {
          metadata.date = this.parseDate(match);
          break;
        }
      }
    }

    // Parse directory name for venue and location
    const dirParts = parentDir.split(/\s*[-–—]\s*/);
    if (dirParts.length >= 2) {
      // First part might be band or date
      let venueIndex = 1;

      // Skip date if it's in the first part
      if (dirParts[0].match(/\d{4}/) || dirParts[0].match(/\d{1,2}[_-]\d{1,2}/)) {
        venueIndex = 1;
      } else if (dirParts[1].match(/\d{4}/) || dirParts[1].match(/\d{1,2}[_-]\d{1,2}/)) {
        venueIndex = 2;
      }

      // Extract venue
      if (!metadata.venue && dirParts[venueIndex]) {
        metadata.venue = dirParts[venueIndex].trim();
      }

      // Extract location (might be in the venue part or next part)
      if (!metadata.city && dirParts[venueIndex + 1]) {
        const locationPart = dirParts[venueIndex + 1];
        const locationMatch = locationPart.match(/([^,]+),\s*([A-Z]{2})/);
        if (locationMatch) {
          metadata.city = locationMatch[1].trim();
          metadata.state = locationMatch[2].trim();
        } else {
          // Might just be city
          metadata.city = locationPart.trim();
        }
      }
    }

    // Check parent directories for band name
    if (!metadata.artist) {
      const pathParts = directory.split(path.sep);
      // Look for "Grateful Dead" or similar in path
      for (const part of pathParts) {
        if (part.match(/grateful\s*dead/i)) {
          metadata.artist = 'Grateful Dead';
          break;
        }
        // Could add more band patterns here
      }
    }

    return metadata;
  }

  /**
   * Parse date from regex match
   */
  parseDate(match) {
    let year, month, day;

    if (match[1].length === 4) {
      // Year first: YYYY-MM-DD
      year = match[1];
      month = match[2];
      day = match[3];
    } else if (match[3].length === 4) {
      // Year last: MM-DD-YYYY or DD-MM-YYYY
      year = match[3];
      // Assume MM-DD-YYYY for US dates
      month = match[1];
      day = match[2];
    } else {
      // Two digit year: YY-MM-DD or MM-DD-YY
      if (match[1].length === 2 && parseInt(match[1]) > 31) {
        // Probably YY
        year = (parseInt(match[1]) > 50 ? '19' : '20') + match[1];
        month = match[2];
        day = match[3];
      } else {
        // Probably MM-DD-YY
        year = (parseInt(match[3]) > 50 ? '19' : '20') + match[3];
        month = match[1];
        day = match[2];
      }
    }

    // Ensure proper formatting
    month = month.padStart(2, '0');
    day = day.padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  /**
   * Apply defaults for missing metadata
   */
  applyDefaults(metadata) {
    // Default artist for Grateful Dead collection
    if (!metadata.artist) {
      metadata.artist = 'Grateful Dead';
    }

    // Default source type based on quality indicators
    if (!metadata.sourceType) {
      if (metadata.filename?.match(/\b(official|release)\b/i)) {
        metadata.sourceType = 'OFFICIAL';
      } else if (metadata.filename?.match(/\b(fm|broadcast)\b/i)) {
        metadata.sourceType = 'FM';
      } else {
        metadata.sourceType = 'AUD'; // Default assumption
      }
    }

    // If we have venue but no location, try to look it up from known venues
    if (metadata.venue && (!metadata.city || !metadata.state)) {
      const venueLocation = this.lookupVenueLocation(metadata.venue);
      if (venueLocation) {
        metadata.city = metadata.city || venueLocation.city;
        metadata.state = metadata.state || venueLocation.state;
      }
    }

    return metadata;
  }

  /**
   * Normalize metadata for consistency
   */
  normalizeMetadata(metadata) {
    // Normalize venue names
    if (metadata.venue) {
      metadata.venue = metadata.venue
        .replace(/\bThe\s+/i, 'The ')
        .replace(/\s+/g, ' ')
        .trim();
    }

    // Normalize city names
    if (metadata.city) {
      metadata.city = metadata.city
        .replace(/\s+/g, ' ')
        .replace(/\bSf\b/i, 'San Francisco')
        .replace(/\bNyc\b/i, 'New York City')
        .replace(/\bLa\b/i, 'Los Angeles')
        .trim();
    }

    // Ensure state is uppercase
    if (metadata.state) {
      metadata.state = metadata.state.toUpperCase();
    }

    // Clean up title
    if (metadata.title) {
      metadata.title = metadata.title
        .replace(/\s+/g, ' ')
        .replace(/^\W+|\W+$/g, '') // Remove leading/trailing non-word chars
        .trim();
    }

    return metadata;
  }

  /**
   * Lookup known venue locations
   */
  lookupVenueLocation(venueName) {
    const knownVenues = {
      'Fillmore West': { city: 'San Francisco', state: 'CA' },
      'Fillmore East': { city: 'New York City', state: 'NY' },
      'Winterland': { city: 'San Francisco', state: 'CA' },
      'Madison Square Garden': { city: 'New York City', state: 'NY' },
      'Greek Theatre': { city: 'Berkeley', state: 'CA' },
      'Red Rocks': { city: 'Morrison', state: 'CO' },
      'Alpine Valley': { city: 'East Troy', state: 'WI' },
      'Nassau Coliseum': { city: 'Uniondale', state: 'NY' },
      'Hampton Coliseum': { city: 'Hampton', state: 'VA' },
      'Capitol Theatre': { city: 'Port Chester', state: 'NY' },
      // Add more known venues here
    };

    // Try exact match first
    if (knownVenues[venueName]) {
      return knownVenues[venueName];
    }

    // Try partial match
    const venueNameLower = venueName.toLowerCase();
    for (const [venue, location] of Object.entries(knownVenues)) {
      if (venueNameLower.includes(venue.toLowerCase())) {
        return location;
      }
    }

    return null;
  }
}

module.exports = MetadataExtractor;