/**
 * Database schema for properly handling the Concert/Release/Track relationship
 * This allows organizing by concert date while maintaining release quality information
 */

class ConcertReleaseSchema {
  /**
   * Create the concerts and releases tables
   * This migration adds support for the three-tier structure
   */
  static createTables(db) {
    try {
      // Concerts table - represents actual performances
      db.prepare(`
        CREATE TABLE IF NOT EXISTS concerts (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          date TEXT NOT NULL,
          venue TEXT NOT NULL,
          city TEXT,
          state TEXT,
          country TEXT DEFAULT 'USA',
          band_id INTEGER,
          setlist TEXT,
          notes TEXT,
          archive_identifier TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (band_id) REFERENCES bands(id),
          UNIQUE(date, venue, band_id)
        )
      `).run();
    } catch (error) {
      if (!error.message.includes('already exists')) {
        console.error('Error creating concerts table:', error.message);
      }
    }

    try {
      // Releases table - represents commercial products/compilations
      db.prepare(`
        CREATE TABLE IF NOT EXISTS releases (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          release_date TEXT,
          release_year INTEGER,
          type TEXT, -- 'official', 'box_set', 'compilation', 'bootleg', 'live_album'
          label TEXT,
          catalog_number TEXT,
          musicbrainz_release_id TEXT UNIQUE,
          musicbrainz_release_group_id TEXT,
          cover_art_url TEXT,
          disambiguation TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `).run();
    } catch (error) {
      if (!error.message.includes('already exists')) {
        console.error('Error creating releases table:', error.message);
      }
    }

    try {
      // Concert_recordings junction table - links concerts to their recordings on various releases
      db.prepare(`
        CREATE TABLE IF NOT EXISTS concert_recordings (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          concert_id INTEGER NOT NULL,
          release_id INTEGER,
          recording_id INTEGER,
          quality_notes TEXT, -- 'remastered', 'soundboard', 'audience', etc
          source TEXT,
          FOREIGN KEY (concert_id) REFERENCES concerts(id),
          FOREIGN KEY (release_id) REFERENCES releases(id),
          FOREIGN KEY (recording_id) REFERENCES recordings(id)
        )
      `).run();
    } catch (error) {
      if (!error.message.includes('already exists')) {
        console.error('Error creating concert_recordings table:', error.message);
      }
    }

    // Update tracks table to reference both concert and release
    // Add columns one by one, silently ignoring if they already exist
    const columnsToAdd = [
      { name: 'concert_id', type: 'INTEGER REFERENCES concerts(id)' },
      { name: 'release_id', type: 'INTEGER REFERENCES releases(id)' },
      { name: 'original_performance_date', type: 'TEXT' },
      { name: 'release_title', type: 'TEXT' }
    ];

    for (const column of columnsToAdd) {
      try {
        db.prepare(`ALTER TABLE tracks ADD COLUMN ${column.name} ${column.type}`).run();
        console.log(`Added column ${column.name} to tracks table`);
      } catch (err) {
        // Silently ignore duplicate column errors - this is expected on subsequent runs
        if (!err.message.includes('duplicate column')) {
          console.error(`Unexpected error adding column ${column.name}:`, err.message);
        }
      }
    }

    // Create indexes for better query performance
    try {
      db.prepare(`CREATE INDEX IF NOT EXISTS idx_concerts_date ON concerts(date)`).run();
      db.prepare(`CREATE INDEX IF NOT EXISTS idx_concerts_venue ON concerts(venue)`).run();
      db.prepare(`CREATE INDEX IF NOT EXISTS idx_releases_title ON releases(title)`).run();
      db.prepare(`CREATE INDEX IF NOT EXISTS idx_releases_mbid ON releases(musicbrainz_release_id)`).run();
      db.prepare(`CREATE INDEX IF NOT EXISTS idx_concert_recordings ON concert_recordings(concert_id, release_id)`).run();
    } catch (error) {
      console.log('Note: Some indexes may already exist:', error.message);
    }

    console.log('Concert/Release schema created successfully');
  }

  /**
   * Parse concert information from a recording title
   * @param {string} title - Recording title like "Truckin' (Live at Fillmore East, New York, NY, 4/27/1971)"
   * @returns {Object|null} Parsed concert info or null
   */
  static parseRecordingTitle(title) {
    if (!title) return null;

    // Multiple patterns to try
    const patterns = [
      // Standard MusicBrainz format: "Song (Live at Venue, City, State, M/D/YYYY)"
      /\(Live at ([^,]+),\s*([^,]+),\s*([A-Z]{2}),\s*(\d{1,2}\/\d{1,2}\/\d{4})\)/i,
      // Alternate format: "Song (Live at Venue, City, M/D/YYYY)"
      /\(Live at ([^,]+),\s*([^,]+),\s*(\d{1,2}\/\d{1,2}\/\d{4})\)/i,
      // Format: "Song - Live at Venue, Date"
      /Live at ([^,]+),\s*([^,]+),\s*(\d{1,2}\/\d{1,2}\/\d{4})/i,
      // ISO date format
      /\(Live at ([^,]+),\s*([^,]+),\s*([A-Z]{2}),\s*(\d{4}-\d{2}-\d{2})\)/i,
    ];

    for (const pattern of patterns) {
      const match = title.match(pattern);
      if (match) {
        if (match.length === 5) {
          // Format with state
          return {
            venue: match[1].trim(),
            city: match[2].trim(),
            state: match[3].trim(),
            date: this.normalizeDate(match[4].trim()),
            originalTitle: title
          };
        } else if (match.length === 4) {
          // Format without state
          const location = match[2].trim();
          const [city, state] = location.includes(',') ?
            location.split(',').map(s => s.trim()) :
            [location, null];

          return {
            venue: match[1].trim(),
            city: city,
            state: state,
            date: this.normalizeDate(match[3].trim()),
            originalTitle: title
          };
        }
      }
    }

    return null;
  }

  /**
   * Normalize date to ISO format (YYYY-MM-DD)
   */
  static normalizeDate(dateStr) {
    if (!dateStr) return null;

    // Already in ISO format
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return dateStr;
    }

    // US format M/D/YYYY or MM/DD/YYYY
    const usMatch = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (usMatch) {
      const month = usMatch[1].padStart(2, '0');
      const day = usMatch[2].padStart(2, '0');
      const year = usMatch[3];
      return `${year}-${month}-${day}`;
    }

    return dateStr;
  }

  /**
   * Create a normalized album title combining concert and release info
   * @param {Object} concert - Concert information
   * @param {Object} release - Release information
   * @returns {string} Normalized title
   */
  static createNormalizedTitle(concert, release) {
    let title = '';

    if (concert) {
      // Format: "1971-04-27 - Fillmore East - New York, NY"
      title = `${concert.date} - ${concert.venue}`;
      if (concert.city) {
        title += ` - ${concert.city}`;
        if (concert.state) {
          title += `, ${concert.state}`;
        }
      }
    }

    if (release && release.title && !release.title.includes('Unknown')) {
      // Add release info as subtitle
      title += ` : ${release.title}`;
      if (release.release_year && release.release_year !== new Date(concert?.date).getFullYear()) {
        title += ` (${release.release_year})`;
      }
      if (release.disambiguation) {
        title += ` [${release.disambiguation}]`;
      }
    }

    return title;
  }

  /**
   * Find or create a concert record
   */
  static findOrCreateConcert(db, concertInfo, bandId = 1) {
    if (!concertInfo || !concertInfo.date || !concertInfo.venue) {
      return null;
    }

    // Check if concert exists
    let concert = db.prepare(`
      SELECT * FROM concerts
      WHERE date = ? AND venue = ? AND band_id = ?
    `).get(concertInfo.date, concertInfo.venue, bandId);

    if (!concert) {
      // Create new concert
      const result = db.prepare(`
        INSERT INTO concerts (date, venue, city, state, band_id)
        VALUES (?, ?, ?, ?, ?)
      `).run(
        concertInfo.date,
        concertInfo.venue,
        concertInfo.city || null,
        concertInfo.state || null,
        bandId
      );

      concert = {
        id: result.lastInsertRowid,
        ...concertInfo,
        band_id: bandId
      };

      console.log('Created new concert:', concert);
    }

    return concert;
  }

  /**
   * Find or create a release record
   */
  static findOrCreateRelease(db, releaseInfo) {
    if (!releaseInfo || !releaseInfo.musicbrainz_release_id) {
      return null;
    }

    // Check if release exists
    let release = db.prepare(`
      SELECT * FROM releases
      WHERE musicbrainz_release_id = ?
    `).get(releaseInfo.musicbrainz_release_id);

    if (!release) {
      // Create new release
      const result = db.prepare(`
        INSERT INTO releases (
          title, release_date, release_year, type, label,
          catalog_number, musicbrainz_release_id, musicbrainz_release_group_id,
          cover_art_url, disambiguation
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        releaseInfo.title,
        releaseInfo.release_date || null,
        releaseInfo.release_year || null,
        releaseInfo.type || 'unknown',
        releaseInfo.label || null,
        releaseInfo.catalog_number || null,
        releaseInfo.musicbrainz_release_id,
        releaseInfo.musicbrainz_release_group_id || null,
        releaseInfo.cover_art_url || null,
        releaseInfo.disambiguation || null
      );

      release = {
        id: result.lastInsertRowid,
        ...releaseInfo
      };

      console.log('Created new release:', release);
    }

    return release;
  }

  /**
   * Process fingerprint results to extract concert and release information
   */
  static processFingerprintMatch(db, fingerprintResult, track) {
    const result = {
      concert: null,
      release: null,
      normalizedTitle: null
    };

    // Extract concert info from recording title
    if (fingerprintResult.title) {
      const concertInfo = this.parseRecordingTitle(fingerprintResult.title);
      if (concertInfo) {
        result.concert = this.findOrCreateConcert(db, concertInfo);
      }
    }

    // Extract release info
    if (fingerprintResult.releaseId) {
      const releaseInfo = {
        musicbrainz_release_id: fingerprintResult.releaseId,
        title: fingerprintResult.album || fingerprintResult.release?.title,
        release_date: fingerprintResult.releaseDate,
        release_year: fingerprintResult.releaseDate ?
          new Date(fingerprintResult.releaseDate).getFullYear() : null,
        type: fingerprintResult.releaseType || 'unknown',
        musicbrainz_release_group_id: fingerprintResult.release?.['release-group']?.id
      };

      // Determine release type
      if (releaseInfo.title) {
        if (releaseInfo.title.includes('Box Set') || releaseInfo.title.includes('Enjoying the Ride')) {
          releaseInfo.type = 'box_set';
        } else if (releaseInfo.title.includes('Compilation')) {
          releaseInfo.type = 'compilation';
        } else if (fingerprintResult.isLive) {
          releaseInfo.type = 'live_album';
        }
      }

      result.release = this.findOrCreateRelease(db, releaseInfo);
    }

    // Create normalized title
    result.normalizedTitle = this.createNormalizedTitle(result.concert, result.release);

    return result;
  }
}

module.exports = ConcertReleaseSchema;