const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');
const MetadataExtractor = require('./metadata-extractor');
const OfficialReleaseDetector = require('./officialReleases');
const MusicBrainzService = require('./musicBrainzService');

class ImportService {
  constructor(database) {
    this.db = database;
    this.metadataExtractor = new MetadataExtractor();
    this.releaseDetector = new OfficialReleaseDetector();
    this.musicBrainzService = new MusicBrainzService();
  }

  async analyzeFiles(filePaths) {
    const results = [];

    for (const filePath of filePaths) {
      try {
        // Use the enhanced metadata extractor
        const metadata = await this.metadataExtractor.extractMetadata(filePath);

        // Try to find matches using audio fingerprinting
        console.log('Attempting audio fingerprint matching for:', path.basename(filePath));
        const fingerprintMatch = await this.musicBrainzService.findBestMatchWithFingerprint(filePath, {
          artist: metadata.artist,
          title: metadata.title,
          album: metadata.album
        });

        if (fingerprintMatch) {
          console.log(`Fingerprint match found: ${fingerprintMatch.title} by ${fingerprintMatch.artist} (confidence: ${fingerprintMatch.confidence})`);

          // Merge fingerprint data with metadata
          if (fingerprintMatch.confidence >= 0.7) {
            metadata.artist = fingerprintMatch.artist || metadata.artist;
            metadata.title = fingerprintMatch.title || metadata.title;
            metadata.musicBrainzRecordingId = fingerprintMatch.recordingId;
            metadata.musicBrainzReleaseId = fingerprintMatch.releaseId;
            metadata.fingerprintMatch = fingerprintMatch;

            // Check if it's a live recording
            if (fingerprintMatch.isLive) {
              metadata.isLiveRecording = true;
            }
          }
        }

        // Suggest show match based on extracted metadata
        const suggested = await this.suggestShowMatch(metadata);

        results.push({
          ...metadata,
          suggested,
          fingerprintMatch
        });
      } catch (error) {
        console.error('Error analyzing file:', filePath, error);
        results.push({
          path: filePath,
          filename: path.basename(filePath),
          error: error.message
        });
      }
    }

    return results;
  }

  async importFile(fileInfo, options = {}) {
    const { copyToLibrary = true, libraryPath = '' } = options;

    // Check if album metadata indicates an official release
    if (fileInfo.album && !fileInfo.isOfficialRelease) {
      // Check if the album name matches official release patterns
      const officialPatterns = ['Anniversary', 'Remaster', 'Box Set', 'Picks', 'Vault', 'Complete', 'Deluxe'];
      const isOfficial = officialPatterns.some(pattern => fileInfo.album.includes(pattern));

      if (isOfficial) {
        fileInfo.isOfficialRelease = true;
        fileInfo.officialRelease = {
          matched: true,
          release: { name: fileInfo.album },
          matchType: 'album_pattern'
        };
        console.log('Official release detected from album name:', fileInfo.album);
      }
    }

    // Check if this is an official release using enhanced detection
    if (!fileInfo.isOfficialRelease) {
      const officialMatch = await this.releaseDetector.detectOfficialReleaseEnhanced(fileInfo.path, fileInfo);
      if (officialMatch && officialMatch.matched) {
        console.log('Official release detected:', officialMatch.release.name, '(method:', officialMatch.matchType, ')');
        // Merge official metadata with file info
        fileInfo = {
          ...fileInfo,
          ...officialMatch.metadata,
          album: officialMatch.release.name,
          title: officialMatch.track.title,
          trackNumber: officialMatch.track.trackNumber,
          disc: officialMatch.track.disc,
          officialRelease: officialMatch,
          isOfficialRelease: true
        };
      }
    }

    console.log('importFile called with options:', options);
    console.log('Importing file with metadata:', {
      path: fileInfo.path,
      title: fileInfo.title,
      date: fileInfo.date,
      venue: fileInfo.venue,
      city: fileInfo.city,
      state: fileInfo.state,
      sourceType: fileInfo.sourceType
    });

    let finalPath = fileInfo.path;

    // Check if we should copy to library
    console.log('Copy to library check:', { copyToLibrary, libraryPath, shouldCopy: copyToLibrary && libraryPath });

    if (copyToLibrary && libraryPath) {
      console.log('Attempting to copy file to library...');
      try {
        finalPath = await this.copyToLibrary(fileInfo.path, libraryPath, fileInfo, options);
        console.log('File copied successfully to:', finalPath);
      } catch (error) {
        console.error('Error copying file to library:', error);
        // Continue with original path if copy fails
        finalPath = fileInfo.path;
      }
    } else {
      console.log('Not copying to library:', { copyToLibrary, libraryPath });
    }

    // Calculate file hash for duplicate detection
    const hash = await this.calculateFileHash(fileInfo.path);

    // Check for existing recording with same hash
    const existingRecording = await this.db.getAsync(
      'SELECT * FROM recordings WHERE file_hash = ?',
      [hash]
    );

    if (existingRecording) {
      console.log('File already imported:', existingRecording.id);
      return {
        id: existingRecording.id,
        showId: existingRecording.show_id,
        path: existingRecording.library_path,
        duplicate: true
      };
    }

    // Find or create venue if we have location info
    let venueId = null;
    if (fileInfo.venue) {
      venueId = await this.findOrCreateVenue(
        fileInfo.venue,
        fileInfo.city,
        fileInfo.state
      );
    }

    // Find or create the show
    const showId = fileInfo.suggested?.showId ||
                   await this.findOrCreateShow(fileInfo, venueId);

    console.log('Show ID:', showId);

    if (!showId) {
      console.error('Failed to create or find show!');
      throw new Error('Could not create show entry');
    }

    // Create the recording
    const recordingId = await this.db.createRecording(
      showId,
      fileInfo.sourceType || (fileInfo.officialRelease ? 'OFFICIAL' : 'AUD'),
      finalPath,
      fileInfo.path
    );

    // Store additional recording metadata including official release info
    const releaseInfo = fileInfo.officialRelease ? JSON.stringify(fileInfo.officialRelease) : null;
    const isOfficial = fileInfo.officialRelease ? 1 : 0;

    await this.db.runAsync(
      `UPDATE recordings
       SET taper = ?, lineage = ?, file_hash = ?, file_size = ?, is_official = ?, release_info = ?
       WHERE id = ?`,
      [fileInfo.taper, fileInfo.lineage, hash, fileInfo.fileSize, isOfficial, releaseInfo, recordingId]
    );

    console.log('Recording ID:', recordingId);

    // Create track entry (title already has date suffix if it's an official release)
    const trackNumber = fileInfo.trackNumber || 1;
    const songTitle = fileInfo.title || 'Unknown Track'; // Title already modified if official release
    const songId = await this.findOrCreateSong(songTitle, fileInfo.artist);

    console.log('Creating track:', {
      recordingId,
      trackNumber,
      songId,
      duration: Math.floor(fileInfo.duration || 0),
      path: finalPath
    });

    const trackId = await this.db.createTrack(
      recordingId,
      trackNumber,
      songId,
      Math.floor(fileInfo.duration || 0),
      finalPath
    );

    console.log('Track created with ID:', trackId);

    // Calculate checksums for the track
    const checksums = await this.releaseDetector.calculateChecksums(fileInfo.path);

    // Store format info and checksums
    await this.db.runAsync(
      `UPDATE tracks
       SET file_format = ?, bitrate = ?, checksum_md5 = ?, checksum_sha256 = ?
       WHERE recording_id = ? AND track_number = ?`,
      [fileInfo.format, fileInfo.bitrate, checksums.md5, checksums.sha256, recordingId, trackNumber]
    );

    console.log('Track created for recording:', recordingId);

    return {
      id: recordingId,
      showId,
      path: finalPath,
      metadata: fileInfo
    };
  }

  async suggestShowMatch(metadata) {
    if (!metadata.date) return null;

    const bandName = metadata.artist || 'Grateful Dead';
    const band = await this.getOrCreateBand(bandName);

    // Look for existing shows on this date
    const shows = await this.db.getShowsByDate(metadata.date);

    if (shows.length > 0) {
      // Try to match by venue if we have it
      if (metadata.venue) {
        for (const show of shows) {
          if (show.venue_name &&
              show.venue_name.toLowerCase().includes(metadata.venue.toLowerCase())) {
            return {
              showId: show.id,
              confidence: 0.9,
              date: metadata.date,
              venue: show.venue_name,
              matched: 'exact'
            };
          }
        }
      }

      // Return first show if no venue match
      return {
        showId: shows[0].id,
        confidence: 0.7,
        date: metadata.date,
        venue: shows[0].venue_name,
        matched: 'date-only'
      };
    }

    // No existing show found
    return {
      date: metadata.date,
      bandId: band.id,
      venue: metadata.venue,
      city: metadata.city,
      state: metadata.state,
      confidence: 0.5,
      matched: 'none'
    };
  }

  async findOrCreateShow(fileInfo, venueId) {
    const band = await this.getOrCreateBand(fileInfo.artist || 'Grateful Dead');
    const date = fileInfo.date || '1970-01-01';

    // For official releases, create a single show entry for the entire release
    const isOfficialRelease = fileInfo.isOfficialRelease ||
                              fileInfo.officialRelease ||
                              fileInfo.album?.includes('Anniversary') ||
                              fileInfo.album?.includes('Picks') ||
                              fileInfo.album?.includes('Box Set') ||
                              (fileInfo.album?.includes('Blues') && fileInfo.album?.includes('Allah'));

    if (isOfficialRelease && fileInfo.album) {
      // For official releases, look up by album name only (ignore date)
      const existingRelease = await this.db.getAsync(
        `SELECT s.* FROM shows s
         WHERE s.notes = ? AND s.band_id = ?`,
        [fileInfo.album, band.id]
      );

      if (existingRelease) {
        console.log('Found existing release show:', existingRelease.id);
        return existingRelease.id;
      }

      // For official releases, use the release year or current date
      let releaseDate = date; // Use the track's date if available

      // If no valid date, try to extract from metadata or use current date
      if (!releaseDate || releaseDate === '1970-01-01') {
        // Try to extract year from album title or metadata
        const yearMatch = fileInfo.album?.match(/\b(19\d{2}|20\d{2})\b/);
        if (yearMatch) {
          releaseDate = `${yearMatch[1]}-01-01`;
        } else if (fileInfo.year) {
          releaseDate = `${fileInfo.year}-01-01`;
        } else {
          // Use current date as last resort
          const now = new Date();
          releaseDate = now.toISOString().split('T')[0];
        }
      }

      // Create a new show entry for this release
      const newShowId = await this.db.createShow(band.id, releaseDate, venueId);

      // Update the show with album info in notes (exact match for future lookups)
      await this.db.runAsync(
        `UPDATE shows SET notes = ? WHERE id = ?`,
        [fileInfo.album, newShowId]
      );

      console.log('Created new release show:', newShowId, 'for album:', fileInfo.album);
      return newShowId;
    }

    // Standard show matching logic
    const existingShows = await this.db.getShowsByDate(date);

    // If venue provided, try to match
    if (venueId && existingShows.length > 0) {
      for (const show of existingShows) {
        if (show.venue_id === venueId) {
          console.log('Found existing show with matching venue:', show.id);
          return show.id;
        }
      }
    }

    // If we have any show on this date and no specific venue, use it
    if (existingShows.length > 0) {
      console.log('Found existing show on date:', existingShows[0].id);
      return existingShows[0].id;
    }

    // Create new show
    const newShowId = await this.db.createShow(band.id, date, venueId);
    console.log('Created new show:', newShowId, 'for date:', date);
    return newShowId;
  }

  async findOrCreateVenue(name, city, state) {
    if (!name) return null;

    // Check for existing venue
    const existing = await this.db.getAsync(
      `SELECT * FROM venues
       WHERE name = ? AND
             (city = ? OR city IS NULL) AND
             (state = ? OR state IS NULL)`,
      [name, city, state]
    );

    if (existing) {
      return existing.id;
    }

    // Create new venue
    return await this.db.createVenue(name, city, state);
  }

  async findOrCreateSong(title, artist) {
    if (!title) return null;

    const bandId = (await this.getOrCreateBand(artist)).id;

    // Normalize the title for matching
    const normalizedTitle = this.normalizeSongTitle(title);

    // Check for existing song
    const existing = await this.db.getAsync(
      `SELECT * FROM songs
       WHERE band_id = ? AND normalized_title = ?`,
      [bandId, normalizedTitle]
    );

    if (existing) {
      return existing.id;
    }

    // Create new song
    return await this.db.createSong(bandId, title, normalizedTitle);
  }

  normalizeSongTitle(title) {
    if (!title) return '';

    return title
      .toLowerCase()
      .replace(/[^\w\s]/g, '') // Remove special characters
      .replace(/\s+/g, ' ')     // Normalize spaces
      .trim();
  }

  async getOrCreateBand(name) {
    const existing = await this.db.getAsync(
      'SELECT * FROM bands WHERE name = ?',
      [name]
    );

    if (existing) {
      return existing;
    }

    // Create new band
    const result = await this.db.runAsync(
      'INSERT INTO bands (name) VALUES (?)',
      [name]
    );

    return {
      id: result.lastID,
      name: name
    };
  }

  async copyToLibrary(sourcePath, libraryRoot, metadata, options = {}) {
    console.log('copyToLibrary called with:', {
      sourcePath,
      libraryRoot,
      metadata: {
        artist: metadata.artist,
        date: metadata.date,
        venue: metadata.venue,
        city: metadata.city,
        state: metadata.state,
        album: metadata.album
      }
    });

    if (!libraryRoot) {
      console.error('No library root path provided');
      return sourcePath;
    }

    const band = metadata.artist || 'Grateful Dead';
    const date = metadata.date || 'Unknown-Date';

    // Check if this is an official release or box set
    const isOfficialRelease = options?.isOfficialRelease ||
                              metadata.isOfficialRelease ||
                              metadata.officialRelease ||
                              metadata.album?.includes('Picks') ||
                              metadata.album?.includes('Anniversary') ||
                              metadata.album?.includes('Box Set') ||
                              (metadata.album?.includes('Live') && metadata.album?.includes('Allah'));

    let destDir;

    // For official releases, use simple Artist/Album structure (no year/date folders)
    if (isOfficialRelease && metadata.album) {
      const safeAlbumName = metadata.album.replace(/[<>:"/\\|?*]/g, '-');
      destDir = path.join(libraryRoot, band, safeAlbumName);
      console.log('Official release - using simple path structure:', destDir);
    } else {
      // Standard shows: Band/Year/Date - Venue structure
      let folderName;
      const year = metadata.date?.substring(0, 4) || 'Unknown';

      if (options?.folderName) {
        folderName = options.folderName.replace(/[<>:"/\\|?*]/g, '-');
      } else {
        // Standard format: Artist - yyyy-mm-dd - venue - city, state
        let folderParts = [band, date];

        if (metadata.venue && metadata.venue !== 'Unknown Venue') {
          folderParts.push(metadata.venue);
        }

        if (metadata.city || metadata.state) {
          const location = [metadata.city, metadata.state].filter(Boolean).join(', ');
          if (location) folderParts.push(location);
        }

        folderName = folderParts.join(' - ');
      }

      destDir = path.join(libraryRoot, band, year, folderName);
    }

    console.log('Creating directory:', destDir);
    await fs.mkdir(destDir, { recursive: true });

    // Handle long filenames - Windows has a 255 character limit for filenames
    let filename = path.basename(sourcePath);
    const ext = path.extname(filename);
    const nameWithoutExt = path.basename(filename, ext);

    // If filename is too long, truncate it
    const maxFilenameLength = 240; // Leave some room for safety
    if (filename.length > maxFilenameLength) {
      const truncatedName = nameWithoutExt.substring(0, maxFilenameLength - ext.length - 3) + '...';
      filename = truncatedName + ext;
      console.log('Truncated long filename to:', filename);
    }

    const destPath = path.join(destDir, filename);

    console.log('Copying file from:', sourcePath, 'to:', destPath);
    await fs.copyFile(sourcePath, destPath);
    console.log('Successfully copied file to library:', destPath);

    return destPath;
  }

  isOfficialRelease(metadata) {
    if (!metadata.album) return false;

    const album = metadata.album.toLowerCase();
    return album.includes('dick\'s picks') ||
           album.includes('dave\'s picks') ||
           album.includes('road trips') ||
           album.includes('download series') ||
           album.includes('official release') ||
           album.includes('box set') ||
           album.includes('live at') ||
           (album.includes('live') && album.includes('fillmore'));
  }

  async calculateFileHash(filePath) {
    const hash = crypto.createHash('sha256');
    const stream = require('fs').createReadStream(filePath);

    return new Promise((resolve, reject) => {
      stream.on('data', data => hash.update(data));
      stream.on('end', () => resolve(hash.digest('hex')));
      stream.on('error', reject);
    });
  }

  parseDate(dateInput) {
    if (!dateInput) return null;

    const dateStr = dateInput.toString();

    const patterns = [
      /(\d{4})-(\d{2})-(\d{2})/,
      /(\d{2})\/(\d{2})\/(\d{4})/,
      /(\d{2})-(\d{2})-(\d{2})/
    ];

    for (const pattern of patterns) {
      const match = dateStr.match(pattern);
      if (match) {
        let year = match[1];
        let month = match[2];
        let day = match[3];

        if (match[1].length === 2) {
          year = parseInt(match[1]) > 50 ? '19' + match[1] : '20' + match[1];
          month = match[2];
          day = match[3];
        } else if (match[3].length === 4) {
          year = match[3];
          month = match[1];
          day = match[2];
        }

        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }
    }

    return null;
  }

  detectSourceType(fileInfo) {
    const filename = (fileInfo.filename || '').toLowerCase();
    const album = (fileInfo.album || '').toLowerCase();
    const combined = filename + ' ' + album;

    if (combined.includes('sbd')) return 'SBD';
    if (combined.includes('aud')) return 'AUD';
    if (combined.includes('matrix')) return 'MATRIX';
    if (combined.includes('official') || combined.includes('release')) return 'OFFICIAL';
    if (combined.includes('fm') || combined.includes('broadcast')) return 'FM';

    return 'AUD'; // Default
  }
}

module.exports = ImportService;