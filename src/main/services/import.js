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

  async analyzeFiles(filePaths, options = {}) {
    const results = [];
    const { enableFingerprinting = false } = options;

    console.log('=== ANALYZE FILES CALLED ===');
    console.log('Options received:', options);
    console.log('Fingerprinting enabled?', enableFingerprinting);

    for (const filePath of filePaths) {
      try {
        // Use the enhanced metadata extractor
        const metadata = await this.metadataExtractor.extractMetadata(filePath);
        console.log('Basic metadata extracted:', { title: metadata.title, artist: metadata.artist });

        let fingerprintMatch = null;

        // Only do fingerprinting if enabled
        if (enableFingerprinting) {
          // Try to find matches using audio fingerprinting
          console.log('FINGERPRINTING ENABLED - Attempting audio fingerprint matching for:', path.basename(filePath));
          fingerprintMatch = await this.musicBrainzService.findBestMatchWithFingerprint(filePath, {
            artist: metadata.artist,
            title: metadata.title,
            album: metadata.album
          });

          if (fingerprintMatch) {
            console.log(`FINGERPRINT MATCH FOUND!`);
            console.log(`  Title: ${fingerprintMatch.title}`);
            console.log(`  Artist: ${fingerprintMatch.artist}`);
            console.log(`  Album: ${fingerprintMatch.album}`);
            console.log(`  Confidence: ${fingerprintMatch.confidence}`);
            console.log(`  Status: ${fingerprintMatch.status}`);

            // Merge fingerprint data with metadata
            if (fingerprintMatch.confidence >= 0.7) {
              console.log('Confidence >= 0.7, applying match data to metadata');
              metadata.artist = fingerprintMatch.artist || metadata.artist;
              metadata.title = fingerprintMatch.title || metadata.title;
              metadata.album = fingerprintMatch.album || metadata.album;
              metadata.musicBrainzRecordingId = fingerprintMatch.recordingId;
              metadata.musicBrainzReleaseId = fingerprintMatch.releaseId;
              metadata.fingerprintMatch = fingerprintMatch;

              // Check if it's a live recording
              if (fingerprintMatch.isLive) {
                metadata.isLiveRecording = true;
              }

              // Apply release status from fingerprint match
              if (fingerprintMatch.status) {
                metadata.releaseStatus = fingerprintMatch.status;
              }

              // Apply venue info if available
              if (fingerprintMatch.venue) {
                metadata.venue = fingerprintMatch.venue;
              }

              console.log('Updated metadata:', {
                title: metadata.title,
                artist: metadata.artist,
                album: metadata.album,
                releaseStatus: metadata.releaseStatus
              });
            } else {
              console.log('Confidence too low, not applying match');
            }
          } else {
            console.log('No fingerprint match found');
          }
        } else {
          console.log('FINGERPRINTING DISABLED for:', path.basename(filePath));
        }

        // Suggest show match based on extracted metadata
        const suggested = await this.suggestShowMatch(metadata);

        // Debug: Log what we're about to return
        console.log('About to push to results:', {
          title: metadata.title,
          hasTitle: !!metadata.title,
          fingerprintMatch: !!fingerprintMatch,
          fingerprintMatchTitle: fingerprintMatch?.title
        });

        results.push({
          ...metadata,
          suggested,
          fingerprintMatch,
          fingerprintingAttempted: enableFingerprinting,
          fingerprintingSuccessful: enableFingerprinting && !!fingerprintMatch
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
    console.log('=== IMPORT FILE CALLED ===');
    console.log('FileInfo received:', {
      path: fileInfo.path,
      title: fileInfo.title,
      artist: fileInfo.artist,
      album: fileInfo.album,
      fingerprintMatch: fileInfo.fingerprintMatch,
      fingerprintingAttempted: fileInfo.fingerprintingAttempted,
      fingerprintingSuccessful: fileInfo.fingerprintingSuccessful
    });

    // Debug: Check if title exists at the very start
    if (!fileInfo.title) {
      console.error('WARNING: fileInfo.title is undefined at start of importFile!');
      // Try to get title from fingerprintMatch if available
      if (fileInfo.fingerprintMatch && fileInfo.fingerprintMatch.title) {
        console.log('Recovering title from fingerprintMatch:', fileInfo.fingerprintMatch.title);
        fileInfo.title = fileInfo.fingerprintMatch.title;
      }
    }

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

    console.log('After official check, title is:', fileInfo.title);

    // Check if this is an official release using enhanced detection
    if (!fileInfo.isOfficialRelease) {
      const officialMatch = await this.releaseDetector.detectOfficialReleaseEnhanced(fileInfo.path, fileInfo);
      if (officialMatch && officialMatch.matched) {
        console.log('Official release detected:', officialMatch.release.name, '(method:', officialMatch.matchType, ')');
        // Merge official metadata with file info
        // Only override title if we don't have a fingerprint match
        const shouldOverrideTitle = !fileInfo.fingerprintingSuccessful && officialMatch.track?.title;

        // Preserve the title from fingerprinting if it exists
        const preservedTitle = fileInfo.title;
        const preservedArtist = fileInfo.artist;
        const preservedAlbum = fileInfo.album;

        fileInfo = {
          ...fileInfo,
          ...officialMatch.metadata,
          album: preservedAlbum || officialMatch.release.name,
          title: shouldOverrideTitle ? officialMatch.track.title : preservedTitle,
          artist: preservedArtist || officialMatch.metadata?.artist,
          trackNumber: officialMatch.track?.trackNumber || fileInfo.trackNumber,
          disc: officialMatch.track?.disc || fileInfo.disc,
          officialRelease: officialMatch,
          isOfficialRelease: true
        };
        console.log('After official match, title is:', fileInfo.title);
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

    // Create track entry - use fingerprint matched title if available
    const trackNumber = fileInfo.trackNumber || 1;
    const songTitle = fileInfo.title || 'Unknown Track';

    console.log('=== CREATING TRACK ENTRY ===');
    console.log('Track title to be saved:', songTitle);
    console.log('Was fingerprinting successful?', fileInfo.fingerprintingSuccessful);

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
      finalPath,
      songTitle  // Pass the song title directly
    );

    console.log('Track created with ID:', trackId);

    // Calculate checksums for the track
    const checksums = await this.releaseDetector.calculateChecksums(fileInfo.path);

    // Store format info, checksums, and performance date if available
    const trackUpdateFields = ['file_format = ?', 'bitrate = ?', 'checksum_md5 = ?', 'checksum_sha256 = ?'];
    const trackUpdateValues = [fileInfo.format, fileInfo.bitrate, checksums.md5, checksums.sha256];

    // Add performance date if available from fingerprint match
    if (fileInfo.performanceDate || fileInfo.recordingDate ||
        fileInfo.fingerprintMatch?.performanceDate || fileInfo.fingerprintMatch?.recordingDate) {
      trackUpdateFields.push('performance_date = ?');
      trackUpdateValues.push(
        fileInfo.performanceDate ||
        fileInfo.fingerprintMatch?.performanceDate ||
        fileInfo.recordingDate ||
        fileInfo.fingerprintMatch?.recordingDate
      );
    }

    // Add MusicBrainz IDs if available
    if (fileInfo.fingerprintMatch?.recordingId) {
      trackUpdateFields.push('mb_recording_id = ?');
      trackUpdateValues.push(fileInfo.fingerprintMatch.recordingId);
    }
    if (fileInfo.fingerprintMatch?.releaseId) {
      trackUpdateFields.push('mb_release_id = ?');
      trackUpdateValues.push(fileInfo.fingerprintMatch.releaseId);
    }

    trackUpdateValues.push(recordingId, trackNumber);

    await this.db.runAsync(
      `UPDATE tracks SET ${trackUpdateFields.join(', ')} WHERE recording_id = ? AND track_number = ?`,
      trackUpdateValues
    );

    console.log('Track created for recording:', recordingId);

    // Update show with fingerprint data if available
    if (fileInfo.fingerprintingSuccessful && showId) {
      console.log('Updating show with fingerprint data...');
      await this.updateShowWithFingerprintData(showId, fileInfo);
    }

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

  async updateShowWithFingerprintData(showId, fileInfo) {
    console.log('=== UPDATE SHOW WITH FINGERPRINT DATA ===');
    console.log('Show ID:', showId);
    console.log('Release Status:', fileInfo.releaseStatus);
    console.log('Album:', fileInfo.album);

    const updates = [];
    const values = [];

    // Update release status if available
    if (fileInfo.releaseStatus) {
      updates.push('release_status = ?');
      values.push(fileInfo.releaseStatus.toUpperCase());
      console.log('Will update release_status to:', fileInfo.releaseStatus.toUpperCase());
    }

    // Update album notes if available and not already set
    if (fileInfo.album) {
      const show = await this.db.getAsync('SELECT notes FROM shows WHERE id = ?', [showId]);
      if (!show.notes || show.notes === 'Unknown Album') {
        updates.push('notes = ?');
        values.push(fileInfo.album);
      }
    }

    // Update MusicBrainz Release ID if available
    if (fileInfo.fingerprintMatch && fileInfo.fingerprintMatch.releaseId) {
      updates.push('musicbrainz_release_id = ?');
      values.push(fileInfo.fingerprintMatch.releaseId);
      console.log('Will update MusicBrainz Release ID:', fileInfo.fingerprintMatch.releaseId);

      // Also try to get artwork
      try {
        const coverArt = await this.musicBrainzService.fetchCoverArt(fileInfo.fingerprintMatch.releaseId);
        if (coverArt && coverArt.medium) {
          updates.push('artwork = ?');
          values.push(coverArt.medium);
          console.log('Will update artwork URL from MusicBrainz');
        }
      } catch (error) {
        console.log('Could not fetch cover art:', error.message);
      }
    }

    // Update venue if we have better info from fingerprinting
    if (fileInfo.venue && fileInfo.venue !== 'Unknown Venue') {
      const venueId = await this.findOrCreateVenue(
        fileInfo.venue,
        fileInfo.city,
        fileInfo.state
      );
      if (venueId) {
        updates.push('venue_id = ?');
        values.push(venueId);
      }
    }

    if (updates.length > 0) {
      values.push(showId);
      console.log('Executing UPDATE with values:', values);
      console.log('SQL:', `UPDATE shows SET ${updates.join(', ')} WHERE id = ?`);
      await this.db.runAsync(
        `UPDATE shows SET ${updates.join(', ')} WHERE id = ?`,
        values
      );
      console.log('Updated show', showId, 'with fingerprint data');
    } else {
      console.log('No updates to apply for show', showId);
    }
  }

  async findOrCreateShow(fileInfo, venueId) {
    const band = await this.getOrCreateBand(fileInfo.artist || 'Grateful Dead');

    // Try to get performance date from various sources
    let date = fileInfo.performanceDate || fileInfo.recordingDate || fileInfo.date;

    // Check fingerprint match data for dates
    if (fileInfo.fingerprintMatch) {
      date = fileInfo.fingerprintMatch.performanceDate ||
             fileInfo.fingerprintMatch.recordingDate ||
             date;
    }

    // Store release date separately if it's different from performance date
    const releaseDate = fileInfo.releaseDate || fileInfo.fingerprintMatch?.releaseDate

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

      // For official releases, use release date for the show date
      // But we'll store performance dates on individual tracks
      let showDate = releaseDate || date;

      // If no valid date, try to extract from metadata
      if (!showDate) {
        // Try to extract year from album title or metadata
        const yearMatch = fileInfo.album?.match(/\b(19\d{2}|20\d{2})\b/);
        if (yearMatch) {
          showDate = `${yearMatch[1]}-01-01`;
        } else if (fileInfo.year) {
          showDate = `${fileInfo.year}-01-01`;
        } else {
          // Use current date as last resort
          const now = new Date();
          showDate = now.toISOString().split('T')[0];
        }
      }

      // Create a new show entry for this release
      const newShowId = await this.db.createShow(band.id, showDate, venueId);

      // Update the show with album info in notes and release status if available
      const releaseStatus = fileInfo.releaseStatus ? fileInfo.releaseStatus.toUpperCase() :
                           (isOfficialRelease ? 'OFFICIAL' : 'BOOTLEG');

      await this.db.runAsync(
        `UPDATE shows SET notes = ?, release_status = ? WHERE id = ?`,
        [fileInfo.album, releaseStatus, newShowId]
      );

      console.log('Created new release show:', newShowId, 'for album:', fileInfo.album);
      return newShowId;
    }

    // Standard show matching logic
    // If we don't have a date, we can't create or match a show properly
    if (!date) {
      console.warn('Cannot create show without date for:', fileInfo.path);
      // Try to extract date from filename or use a placeholder
      const dateFromFile = this.parseDate(fileInfo.filename) || this.parseDate(fileInfo.path);
      if (dateFromFile) {
        console.log('Extracted date from filename:', dateFromFile);
        return this.findOrCreateShow({...fileInfo, date: dateFromFile}, venueId);
      }
      // Skip this file if no date can be determined
      return null;
    }

    const existingShows = await this.db.getShowsByDate(date);

    // If venue provided, try to match
    if (venueId && existingShows.length > 0) {
      for (const show of existingShows) {
        if (show.venue_id === venueId) {
          console.log('Found existing show with matching venue:', show.id);

          // Update existing show with fingerprint metadata if available
          if (fileInfo.fingerprintingSuccessful || fileInfo.releaseStatus || fileInfo.album) {
            await this.updateShowWithFingerprintData(show.id, fileInfo);
          }

          return show.id;
        }
      }
    }

    // If we have any show on this date and no specific venue, use it
    if (existingShows.length > 0) {
      console.log('Found existing show on date:', existingShows[0].id);

      // Update existing show with fingerprint metadata if available
      if (fileInfo.fingerprintingSuccessful || fileInfo.releaseStatus || fileInfo.album) {
        await this.updateShowWithFingerprintData(existingShows[0].id, fileInfo);
      }

      return existingShows[0].id;
    }

    // Create new show (date is required and validated above)
    const newShowId = await this.db.createShow(band.id, date, venueId);

    // Update the new show with all fingerprint data including artwork
    if (fileInfo.fingerprintingSuccessful) {
      await this.updateShowWithFingerprintData(newShowId, fileInfo);
    } else {
      // Set release status if we have it from fingerprinting
      if (fileInfo.releaseStatus) {
        await this.db.runAsync(
          `UPDATE shows SET release_status = ? WHERE id = ?`,
          [fileInfo.releaseStatus.toUpperCase(), newShowId]
        );
      }

      // If we have album info from fingerprinting, add it to notes
      if (fileInfo.album) {
        await this.db.runAsync(
          `UPDATE shows SET notes = ? WHERE id = ?`,
          [fileInfo.album, newShowId]
        );
      }
    }

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

    // Try to get performance date from various sources
    let date = metadata.performanceDate || metadata.recordingDate || metadata.date;

    // If we have fingerprint match data with a performance date, prefer that
    if (metadata.fingerprintMatch?.performanceDate) {
      date = metadata.fingerprintMatch.performanceDate;
    } else if (metadata.fingerprintMatch?.recordingDate) {
      date = metadata.fingerprintMatch.recordingDate;
    }

    // Fall back to parsing from filename if no date found
    if (!date) {
      date = this.parseDate(metadata.filename) || this.parseDate(metadata.path);
    }

    // If still no valid date, don't copy the file - require date to be set
    if (!date || date === 'Unknown-Date') {
      console.error('Cannot copy file to library without a valid date. Please provide a date in metadata review.');
      throw new Error('Date is required for importing files. Please set a valid date in the metadata review.');
    }

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

    // Try MMDDYY format like "101772" (October 17, 1972)
    const mmddyyMatch = dateStr.match(/(\d{2})(\d{2})(\d{2})(?!\d)/);
    if (mmddyyMatch) {
      const [_, month, day, yearShort] = mmddyyMatch;
      const year = parseInt(yearShort) > 50 ? '19' + yearShort : '20' + yearShort;
      // Validate the date components
      const monthNum = parseInt(month);
      const dayNum = parseInt(day);
      if (monthNum >= 1 && monthNum <= 12 && dayNum >= 1 && dayNum <= 31) {
        console.log(`Parsed date from MMDDYY format: ${dateStr} -> ${year}-${month}-${day}`);
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }
    }

    // Try standard patterns
    const patterns = [
      /(\d{4})-(\d{2})-(\d{2})/,     // YYYY-MM-DD
      /(\d{2})\/(\d{2})\/(\d{4})/,   // MM/DD/YYYY
      /(\d{2})-(\d{2})-(\d{2})/,      // MM-DD-YY or YY-MM-DD
      /(\d{4})(\d{2})(\d{2})/,        // YYYYMMDD
      /(\d{1,2})\/(\d{1,2})\/(\d{2})/ // M/D/YY or MM/DD/YY
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
        } else if (match[3] && match[3].length === 4) {
          year = match[3];
          month = match[1];
          day = match[2];
        } else if (match[3] && match[3].length === 2) {
          // MM/DD/YY format
          year = parseInt(match[3]) > 50 ? '19' + match[3] : '20' + match[3];
        } else if (match[1].length === 8) {
          // YYYYMMDD format
          year = match[1].substring(0, 4);
          month = match[1].substring(4, 6);
          day = match[1].substring(6, 8);
        }

        // Validate month and day
        const monthNum = parseInt(month);
        const dayNum = parseInt(day);
        if (monthNum >= 1 && monthNum <= 12 && dayNum >= 1 && dayNum <= 31) {
          return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        }
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