const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class DatabaseService {
  constructor() {
    const dbPath = path.join(process.cwd(), 'library.db');
    console.log('Database path:', dbPath);
    this.db = new sqlite3.Database(dbPath);
  }

  async initialize() {
    console.log('Initializing database...');

    // Create each table separately
    const tables = [
      // Bands
      `CREATE TABLE IF NOT EXISTS bands (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        musicbrainz_id TEXT,
        archive_org_collection TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

      // Venues
      `CREATE TABLE IF NOT EXISTS venues (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        city TEXT,
        state TEXT,
        country TEXT,
        normalized_name TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(name, city, state)
      )`,

      // Shows
      `CREATE TABLE IF NOT EXISTS shows (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        band_id INTEGER NOT NULL,
        date DATE NOT NULL,
        venue_id INTEGER,
        archive_org_identifier TEXT,
        setlist_fm_id TEXT,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (band_id) REFERENCES bands(id),
        FOREIGN KEY (venue_id) REFERENCES venues(id),
        UNIQUE(band_id, date, venue_id)
      )`,

      // Songs
      `CREATE TABLE IF NOT EXISTS songs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        band_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        normalized_title TEXT NOT NULL,
        abbreviations TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (band_id) REFERENCES bands(id),
        UNIQUE(band_id, normalized_title)
      )`,

      // Recordings
      `CREATE TABLE IF NOT EXISTS recordings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        show_id INTEGER NOT NULL,
        source_type TEXT CHECK(source_type IN ('SBD', 'AUD', 'MATRIX', 'FM')),
        release_status TEXT CHECK(release_status IN ('OFFICIAL', 'BOOTLEG', 'PROMOTION', 'PSEUDO')) DEFAULT 'BOOTLEG',
        taper TEXT,
        lineage TEXT,
        library_path TEXT NOT NULL,
        original_path TEXT,
        file_hash TEXT,
        quality_rating INTEGER CHECK(quality_rating BETWEEN 1 AND 5),
        file_size INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (show_id) REFERENCES shows(id)
      )`,

      // Tracks
      `CREATE TABLE IF NOT EXISTS tracks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        recording_id INTEGER NOT NULL,
        track_number INTEGER NOT NULL,
        song_id INTEGER,
        duration INTEGER,
        segue_type TEXT,
        file_path TEXT NOT NULL,
        file_format TEXT,
        bitrate INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (recording_id) REFERENCES recordings(id),
        FOREIGN KEY (song_id) REFERENCES songs(id)
      )`,

      // Sets
      `CREATE TABLE IF NOT EXISTS sets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        recording_id INTEGER NOT NULL,
        set_number INTEGER NOT NULL,
        start_track INTEGER NOT NULL,
        end_track INTEGER NOT NULL,
        FOREIGN KEY (recording_id) REFERENCES recordings(id)
      )`,


      // Indexes
      `CREATE INDEX IF NOT EXISTS idx_shows_date ON shows(date)`,
      `CREATE INDEX IF NOT EXISTS idx_shows_band_date ON shows(band_id, date)`,
      `CREATE INDEX IF NOT EXISTS idx_tracks_recording ON tracks(recording_id)`,
      `CREATE INDEX IF NOT EXISTS idx_tracks_song ON tracks(song_id)`,
      `CREATE INDEX IF NOT EXISTS idx_recordings_show ON recordings(show_id)`,

      // FTS5 tables for full-text search
      `CREATE VIRTUAL TABLE IF NOT EXISTS search_index USING fts5(
        entity_type,
        entity_id UNINDEXED,
        date UNINDEXED,
        venue,
        city,
        state,
        song_title,
        source_type,
        taper,
        notes,
        content
      )`,

      // Triggers to maintain FTS index
      `CREATE TRIGGER IF NOT EXISTS shows_insert_fts
       AFTER INSERT ON shows
       BEGIN
         INSERT INTO search_index (entity_type, entity_id, date, venue, city, state, notes, content)
         SELECT
           'show',
           NEW.id,
           NEW.date,
           v.name,
           v.city,
           v.state,
           NEW.notes,
           v.name || ' ' || v.city || ' ' || v.state || ' ' || NEW.notes
         FROM venues v WHERE v.id = NEW.venue_id;
       END`,

      `CREATE TRIGGER IF NOT EXISTS tracks_insert_fts
       AFTER INSERT ON tracks
       BEGIN
         INSERT INTO search_index (entity_type, entity_id, song_title, content)
         SELECT
           'track',
           NEW.id,
           s.title,
           s.title
         FROM songs s WHERE s.id = NEW.song_id;
       END`
    ];

    // Execute each table creation
    for (const sql of tables) {
      await this.runAsync(sql);
    }

    // Insert default band (Grateful Dead)
    await this.runAsync(
      `INSERT OR IGNORE INTO bands (name, archive_org_collection) VALUES (?, ?)`,
      ['Grateful Dead', 'GratefulDead']
    );

    console.log('Database initialized successfully');

    // Run migrations for new columns
    await this.runMigrations();
  }

  async runMigrations() {
    console.log('Running database migrations...');

    // Import and run concert/release schema migrations
    const ConcertReleaseSchema = require('./concertReleaseSchema');
    try {
      ConcertReleaseSchema.createTables(this.db);
      console.log('Concert/Release schema migration completed');
    } catch (error) {
      // Only log non-duplicate column errors
      if (!error.message || !error.message.includes('duplicate column')) {
        console.error('Error in concert/release migration:', error);
      }
    }

    // Check if columns exist before adding them
    const checkColumn = async (table, column) => {
      const result = await this.allAsync(`PRAGMA table_info(${table})`);
      return result.some(col => col.name === column);
    };

    // Add MusicBrainz columns to shows table
    if (!(await checkColumn('shows', 'musicbrainz_release_id'))) {
      try {
        await this.runAsync('ALTER TABLE shows ADD COLUMN musicbrainz_release_id TEXT');
        console.log('Added musicbrainz_release_id column to shows table');
      } catch (error) {
        if (!error.message.includes('duplicate column')) {
          console.error('Error adding musicbrainz_release_id column:', error.message);
        }
      }
    }

    if (!(await checkColumn('shows', 'release_type'))) {
      try {
        await this.runAsync('ALTER TABLE shows ADD COLUMN release_type TEXT');
        console.log('Added release_type column to shows table');
      } catch (error) {
        if (!error.message.includes('duplicate column')) {
          console.error('Error adding release_type column:', error.message);
        }
      }
    }

    // Add is_official column to recordings if it doesn't exist
    if (!(await checkColumn('recordings', 'is_official'))) {
      try {
        await this.runAsync('ALTER TABLE recordings ADD COLUMN is_official BOOLEAN DEFAULT 0');
        console.log('Added is_official column to recordings table');
      } catch (err) {
        console.log('Column is_official may already exist:', err.message);
      }
    }

    // Add release_info column to recordings if it doesn't exist
    if (!(await checkColumn('recordings', 'release_info'))) {
      try {
        await this.runAsync('ALTER TABLE recordings ADD COLUMN release_info TEXT');
        console.log('Added release_info column to recordings table');
      } catch (err) {
        console.log('Column release_info may already exist:', err.message);
      }
    }

    // Add artwork column to shows if it doesn't exist
    if (!(await checkColumn('shows', 'artwork'))) {
      try {
        await this.runAsync('ALTER TABLE shows ADD COLUMN artwork TEXT');
        console.log('Added artwork column to shows table');
      } catch (err) {
        console.log('Column artwork may already exist:', err.message);
      }
    }

    // Add new track metadata columns if they don't exist
    if (!(await checkColumn('tracks', 'disc_number'))) {
      try {
        await this.runAsync('ALTER TABLE tracks ADD COLUMN disc_number INTEGER DEFAULT 1');
        console.log('Added disc_number column to tracks table');
      } catch (err) {
        console.log('Column disc_number may already exist:', err.message);
      }
    }

    if (!(await checkColumn('tracks', 'song_name'))) {
      try {
        await this.runAsync('ALTER TABLE tracks ADD COLUMN song_name TEXT');
        console.log('Added song_name column to tracks table');
      } catch (err) {
        console.log('Column song_name may already exist:', err.message);
      }
    }

    if (!(await checkColumn('tracks', 'performance_date'))) {
      try {
        await this.runAsync('ALTER TABLE tracks ADD COLUMN performance_date DATE');
        console.log('Added performance_date column to tracks table');
      } catch (err) {
        console.log('Column performance_date may already exist:', err.message);
      }
    }

    if (!(await checkColumn('tracks', 'has_segue'))) {
      try {
        await this.runAsync('ALTER TABLE tracks ADD COLUMN has_segue BOOLEAN DEFAULT 0');
        console.log('Added has_segue column to tracks table');
      } catch (err) {
        console.log('Column has_segue may already exist:', err.message);
      }
    }

    if (!(await checkColumn('tracks', 'comment'))) {
      try {
        await this.runAsync('ALTER TABLE tracks ADD COLUMN comment TEXT');
        console.log('Added comment column to tracks table');
      } catch (err) {
        console.log('Column comment may already exist:', err.message);
      }
    }

    // Add checksum_md5 column to tracks if it doesn't exist
    if (!(await checkColumn('tracks', 'checksum_md5'))) {
      try {
        await this.runAsync('ALTER TABLE tracks ADD COLUMN checksum_md5 TEXT');
        console.log('Added checksum_md5 column to tracks table');
      } catch (err) {
        console.log('Column checksum_md5 may already exist:', err.message);
      }
    }

    // Add checksum_sha256 column to tracks if it doesn't exist
    if (!(await checkColumn('tracks', 'checksum_sha256'))) {
      try {
        await this.runAsync('ALTER TABLE tracks ADD COLUMN checksum_sha256 TEXT');
        console.log('Added checksum_sha256 column to tracks table');
      } catch (err) {
        console.log('Column checksum_sha256 may already exist:', err.message);
      }
    }

    // Add MusicBrainz columns to tracks table
    if (!(await checkColumn('tracks', 'mb_recording_id'))) {
      try {
        await this.runAsync('ALTER TABLE tracks ADD COLUMN mb_recording_id TEXT');
        console.log('Added mb_recording_id column to tracks table');
      } catch (err) {
        console.log('Column mb_recording_id may already exist:', err.message);
      }
    }

    if (!(await checkColumn('tracks', 'mb_release_id'))) {
      try {
        await this.runAsync('ALTER TABLE tracks ADD COLUMN mb_release_id TEXT');
        console.log('Added mb_release_id column to tracks table');
      } catch (err) {
        console.log('Column mb_release_id may already exist:', err.message);
      }
    }

    // Add release_status column to recordings table
    if (!(await checkColumn('recordings', 'release_status'))) {
      try {
        await this.runAsync(`ALTER TABLE recordings ADD COLUMN release_status TEXT
          CHECK(release_status IN ('OFFICIAL', 'BOOTLEG', 'PROMOTION', 'PSEUDO'))
          DEFAULT 'BOOTLEG'`);
        console.log('Added release_status column to recordings table');

        // Migrate existing OFFICIAL source_type to release_status
        await this.runAsync(`
          UPDATE recordings
          SET release_status = 'OFFICIAL',
              source_type = 'SBD'
          WHERE source_type = 'OFFICIAL'
        `);
        console.log('Migrated OFFICIAL source_type to release_status');
      } catch (err) {
        console.log('Column release_status may already exist:', err.message);
      }
    }

    // Add verification status columns to shows table
    if (!(await checkColumn('shows', 'verified'))) {
      try {
        await this.runAsync('ALTER TABLE shows ADD COLUMN verified BOOLEAN DEFAULT 0');
        console.log('Added verified column to shows table');
      } catch (err) {
        console.log('Column verified may already exist:', err.message);
      }
    }

    if (!(await checkColumn('shows', 'verified_date'))) {
      try {
        await this.runAsync('ALTER TABLE shows ADD COLUMN verified_date DATETIME');
        console.log('Added verified_date column to shows table');
      } catch (err) {
        console.log('Column verified_date may already exist:', err.message);
      }
    }

    if (!(await checkColumn('shows', 'needs_review'))) {
      try {
        await this.runAsync('ALTER TABLE shows ADD COLUMN needs_review BOOLEAN DEFAULT 0');
        console.log('Added needs_review column to shows table');
      } catch (err) {
        console.log('Column needs_review may already exist:', err.message);
      }
    }

    if (!(await checkColumn('shows', 'review_notes'))) {
      try {
        await this.runAsync('ALTER TABLE shows ADD COLUMN review_notes TEXT');
        console.log('Added review_notes column to shows table');
      } catch (err) {
        console.log('Column review_notes may already exist:', err.message);
      }
    }

    // Add release_status column to shows table
    if (!(await checkColumn('shows', 'release_status'))) {
      try {
        await this.runAsync(`ALTER TABLE shows ADD COLUMN release_status TEXT
          CHECK(release_status IN ('OFFICIAL', 'BOOTLEG', 'PROMOTION', 'PSEUDO'))
          DEFAULT 'BOOTLEG'`);
        console.log('Added release_status column to shows table');
      } catch (err) {
        console.log('Column release_status may already exist:', err.message);
      }
    }

    // Add source_type column to shows table
    if (!(await checkColumn('shows', 'source_type'))) {
      try {
        await this.runAsync(`ALTER TABLE shows ADD COLUMN source_type TEXT
          CHECK(source_type IN ('SBD', 'AUD', 'MATRIX', 'FM', 'PRE-FM', 'POST-FM', 'STREAM', 'WEBCAST'))
          DEFAULT 'SBD'`);
        console.log('Added source_type column to shows table');
      } catch (err) {
        console.log('Column source_type may already exist:', err.message);
      }
    }

    // Create indexes for new columns
    try {
      await this.runAsync('CREATE INDEX IF NOT EXISTS idx_tracks_checksum_md5 ON tracks(checksum_md5)');
      await this.runAsync('CREATE INDEX IF NOT EXISTS idx_recordings_official ON recordings(is_official)');
      await this.runAsync('CREATE INDEX IF NOT EXISTS idx_shows_verified ON shows(verified)');
      await this.runAsync('CREATE INDEX IF NOT EXISTS idx_shows_needs_review ON shows(needs_review)');
      console.log('Created indexes for new columns');
    } catch (err) {
      console.log('Indexes may already exist:', err.message);
    }

    console.log('Migrations completed');
  }

  // Promise wrapper for database operations
  runAsync(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function(err) {
        if (err) reject(err);
        else resolve({ lastID: this.lastID, changes: this.changes });
      });
    });
  }

  getAsync(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  allAsync(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  // Get year stats for browsing
  async getYearStats() {
    return this.allAsync(`
      SELECT
        strftime('%Y', date) as year,
        COUNT(DISTINCT s.id) as show_count,
        COUNT(DISTINCT r.id) as recording_count
      FROM shows s
      LEFT JOIN recordings r ON s.id = r.show_id
      GROUP BY year
      ORDER BY year
    `);
  }

  // Get shows by date
  async getShow(showId) {
    const show = await this.getAsync(`
      SELECT s.*, b.name as band_name, v.name as venue_name,
             v.city, v.state,
             s.musicbrainz_release_id, s.release_type,
             s.release_status, s.source_type, s.artwork
      FROM shows s
      JOIN bands b ON s.band_id = b.id
      LEFT JOIN venues v ON s.venue_id = v.id
      WHERE s.id = ?
    `, [showId]);

    if (show) {
      console.log(`Retrieved show ${showId} with release_status: "${show.release_status}"`);
      show.recordings = await this.allAsync(`
        SELECT * FROM recordings WHERE show_id = ?
      `, [showId]);

      for (const recording of show.recordings) {
        recording.tracks = await this.allAsync(`
          SELECT t.*, s.title as song_title
          FROM tracks t
          LEFT JOIN songs s ON t.song_id = s.id
          WHERE t.recording_id = ?
          ORDER BY t.track_number
        `, [recording.id]);
      }
    }

    return show;
  }

  async getRecordingsByDate(date) {
    return this.allAsync(`
      SELECT r.*, s.date, b.name as band_name, v.name as venue_name
      FROM recordings r
      JOIN shows s ON r.show_id = s.id
      JOIN bands b ON s.band_id = b.id
      LEFT JOIN venues v ON s.venue_id = v.id
      WHERE s.date = ?
    `, [date]);
  }

  async getYearStats() {
    return this.allAsync(`
      SELECT
        strftime('%Y', date) as year,
        COUNT(DISTINCT s.id) as show_count,
        COUNT(DISTINCT r.id) as recording_count
      FROM shows s
      LEFT JOIN recordings r ON s.id = r.show_id
      GROUP BY year
      ORDER BY year
    `);
  }

  async getShowsByYear(year) {
    return this.allAsync(`
      SELECT s.*, b.name as band_name, v.name as venue_name,
             v.city, v.state, COUNT(r.id) as recording_count,
             s.verified, s.verified_date, s.needs_review, s.review_notes
      FROM shows s
      JOIN bands b ON s.band_id = b.id
      LEFT JOIN venues v ON s.venue_id = v.id
      LEFT JOIN recordings r ON s.id = r.show_id
      WHERE strftime('%Y', s.date) = ?
      GROUP BY s.id
      ORDER BY s.date
    `, [year.toString()]);
  }

  async getAllShows() {
    return this.allAsync(`
      SELECT s.*, b.name as band_name, v.name as venue_name,
             v.city, v.state,
             COUNT(DISTINCT r.id) as recording_count,
             COUNT(DISTINCT t.id) as track_count,
             AVG(r.quality_rating) as quality_rating,
             s.verified, s.verified_date, s.needs_review, s.review_notes
      FROM shows s
      JOIN bands b ON s.band_id = b.id
      LEFT JOIN venues v ON s.venue_id = v.id
      LEFT JOIN recordings r ON s.id = r.show_id
      LEFT JOIN tracks t ON r.id = t.recording_id
      GROUP BY s.id
      ORDER BY s.date DESC
    `);
  }

  // Advanced search queries using FTS5
  async searchShows(query, filters = {}) {
    // If we have a text query, use FTS5
    if (query && query.trim()) {
      const ftsQuery = query.trim().split(/\s+/).map(term => `"${term}"*`).join(' OR ');

      let sql = `
        SELECT DISTINCT
          s.*,
          b.name as band_name,
          v.name as venue_name,
          v.city,
          v.state,
          COUNT(DISTINCT r.id) as recording_count,
          COUNT(DISTINCT t.id) as track_count,
          highlight(search_index, -1, '<mark>', '</mark>') as highlight
        FROM search_index si
        JOIN shows s ON si.entity_id = s.id AND si.entity_type = 'show'
        JOIN bands b ON s.band_id = b.id
        LEFT JOIN venues v ON s.venue_id = v.id
        LEFT JOIN recordings r ON s.id = r.show_id
        LEFT JOIN tracks t ON r.id = t.recording_id
        WHERE search_index MATCH ?
      `;
      const params = [ftsQuery];

      // Add filters
      if (filters.dateFrom) {
        sql += ` AND s.date >= ?`;
        params.push(filters.dateFrom);
      }
      if (filters.dateTo) {
        sql += ` AND s.date <= ?`;
        params.push(filters.dateTo);
      }
      if (filters.sourceType) {
        sql += ` AND r.source_type = ?`;
        params.push(filters.sourceType);
      }
      if (filters.minRating) {
        sql += ` AND r.quality_rating >= ?`;
        params.push(filters.minRating);
      }

      sql += ` GROUP BY s.id ORDER BY rank, s.date DESC`;

      return this.allAsync(sql, params);
    }

    // No text query, use regular filters
    let sql = `
      SELECT DISTINCT s.*, b.name as band_name, v.name as venue_name,
             v.city, v.state,
             COUNT(DISTINCT r.id) as recording_count,
             COUNT(DISTINCT t.id) as track_count
      FROM shows s
      JOIN bands b ON s.band_id = b.id
      LEFT JOIN venues v ON s.venue_id = v.id
      LEFT JOIN recordings r ON s.id = r.show_id
      LEFT JOIN tracks t ON r.id = t.recording_id
      WHERE 1=1
    `;
    const params = [];

    if (filters.dateFrom) {
      sql += ` AND s.date >= ?`;
      params.push(filters.dateFrom);
    }

    if (filters.dateTo) {
      sql += ` AND s.date <= ?`;
      params.push(filters.dateTo);
    }

    if (filters.sourceType) {
      sql += ` AND r.source_type = ?`;
      params.push(filters.sourceType);
    }

    if (filters.minQuality) {
      sql += ` AND r.quality_rating >= ?`;
      params.push(filters.minQuality);
    }

    if (filters.venue) {
      sql += ` AND v.id = ?`;
      params.push(filters.venue);
    }

    sql += ` GROUP BY s.id ORDER BY s.date DESC`;

    return this.allAsync(sql, params);
  }

  // Search for tracks by song title
  async searchTracks(songTitle) {
    const ftsQuery = songTitle.trim().split(/\s+/).map(term => `"${term}"*`).join(' OR ');

    return this.allAsync(`
      SELECT DISTINCT
        t.*,
        s.title as song_title,
        r.source_type,
        sh.date,
        v.name as venue_name,
        v.city,
        v.state,
        b.name as band_name,
        highlight(search_index, -1, '<mark>', '</mark>') as highlight
      FROM search_index si
      JOIN tracks t ON si.entity_id = t.id AND si.entity_type = 'track'
      JOIN songs s ON t.song_id = s.id
      JOIN recordings r ON t.recording_id = r.id
      JOIN shows sh ON r.show_id = sh.id
      JOIN bands b ON sh.band_id = b.id
      LEFT JOIN venues v ON sh.venue_id = v.id
      WHERE search_index MATCH ?
      ORDER BY rank, sh.date DESC
      LIMIT 100
    `, [ftsQuery]);
  }

  // Rebuild FTS index from existing data
  async rebuildSearchIndex() {
    console.log('Rebuilding search index...');

    // Clear existing index
    await this.runAsync('DELETE FROM search_index');

    // Re-index shows
    await this.runAsync(`
      INSERT INTO search_index (entity_type, entity_id, date, venue, city, state, notes, content)
      SELECT
        'show',
        s.id,
        s.date,
        v.name,
        v.city,
        v.state,
        s.notes,
        v.name || ' ' || IFNULL(v.city, '') || ' ' || IFNULL(v.state, '') || ' ' || IFNULL(s.notes, '')
      FROM shows s
      LEFT JOIN venues v ON s.venue_id = v.id
    `);

    // Re-index tracks
    await this.runAsync(`
      INSERT INTO search_index (entity_type, entity_id, song_title, content)
      SELECT
        'track',
        t.id,
        sg.title,
        sg.title
      FROM tracks t
      LEFT JOIN songs sg ON t.song_id = sg.id
      WHERE sg.id IS NOT NULL
    `);

    console.log('Search index rebuilt successfully');
  }

  async findShowsStartingWith(songTitle) {
    return this.allAsync(`
      SELECT DISTINCT s.*, b.name as band_name, v.name as venue_name,
             v.city, v.state
      FROM shows s
      JOIN bands b ON s.band_id = b.id
      LEFT JOIN venues v ON s.venue_id = v.id
      JOIN recordings r ON s.id = r.show_id
      JOIN tracks t ON r.id = t.recording_id
      JOIN songs sg ON t.song_id = sg.id
      WHERE t.track_number = 1 AND sg.title LIKE ?
      ORDER BY s.date
    `, [`${songTitle}%`]);
  }

  async findSongOrder(song1, song2, options = {}) {
    const baseQuery = `
      SELECT s.date, v.name as venue_name, v.city, v.state,
             t1.track_number as song1_pos, t2.track_number as song2_pos,
             (t2.track_number - t1.track_number) as distance
      FROM shows s
      JOIN venues v ON s.venue_id = v.id
      JOIN recordings r ON s.id = r.show_id
      JOIN tracks t1 ON r.id = t1.recording_id
      JOIN tracks t2 ON r.id = t2.recording_id
      JOIN songs sg1 ON t1.song_id = sg1.id
      JOIN songs sg2 ON t2.song_id = sg2.id
      WHERE sg1.title LIKE ? AND sg2.title LIKE ?
    `;

    const params = [`%${song1}%`, `%${song2}%`];

    if (options.samSet) {
      // Additional logic to ensure same set
    }

    const sql = baseQuery + ` ORDER BY s.date`;
    return this.allAsync(sql, params);
  }

  async getTopVenues(limit = 10) {
    return this.allAsync(`
      SELECT v.*, COUNT(s.id) as show_count
      FROM venues v
      JOIN shows s ON v.id = s.venue_id
      GROUP BY v.id
      ORDER BY show_count DESC
      LIMIT ?
    `, [limit]);
  }

  async getTopSongs(limit = 50) {
    return this.allAsync(`
      SELECT sg.*, COUNT(t.id) as play_count
      FROM songs sg
      JOIN tracks t ON sg.id = t.song_id
      GROUP BY sg.id
      ORDER BY play_count DESC
      LIMIT ?
    `, [limit]);
  }

  // Insert operations
  async createShow(bandId, date, venueId) {
    const result = await this.runAsync(
      `INSERT INTO shows (band_id, date, venue_id) VALUES (?, ?, ?)`,
      [bandId, date, venueId]
    );
    return result.lastID;
  }

  async createRecording(showId, sourceType, libraryPath, originalPath) {
    const result = await this.runAsync(
      `INSERT INTO recordings (show_id, source_type, library_path, original_path) VALUES (?, ?, ?, ?)`,
      [showId, sourceType, libraryPath, originalPath]
    );
    return result.lastID;
  }

  async createTrack(recordingId, trackNumber, songId, duration, filePath, songName = null) {
    // Get the song name if we have a songId but no songName provided
    if (songId && !songName) {
      const song = await this.getAsync('SELECT title FROM songs WHERE id = ?', [songId]);
      songName = song ? song.title : null;
    }

    const result = await this.runAsync(
      `INSERT INTO tracks (recording_id, track_number, song_id, duration, file_path, song_name) VALUES (?, ?, ?, ?, ?, ?)`,
      [recordingId, trackNumber, songId, duration, filePath, songName]
    );
    return result.lastID;
  }

  async createSet(recordingId, setNumber, startTrack, endTrack) {
    const result = await this.runAsync(
      `INSERT INTO sets (recording_id, set_number, start_track, end_track) VALUES (?, ?, ?, ?)`,
      [recordingId, setNumber, startTrack, endTrack]
    );
    return result.lastID;
  }

  async createSong(bandId, title, normalizedTitle) {
    const result = await this.runAsync(
      `INSERT INTO songs (band_id, title, normalized_title) VALUES (?, ?, ?)`,
      [bandId, title, normalizedTitle]
    );
    return result.lastID;
  }

  async createVenue(name, city, state, country = 'USA') {
    const result = await this.runAsync(
      `INSERT INTO venues (name, city, state, country) VALUES (?, ?, ?, ?)`,
      [name, city, state, country]
    );
    return result.lastID;
  }

  // Additional methods for services
  async getShowsByDate(date) {
    return this.allAsync(`
      SELECT s.*, b.name as band_name, v.name as venue_name, v.city, v.state
      FROM shows s
      JOIN bands b ON s.band_id = b.id
      LEFT JOIN venues v ON s.venue_id = v.id
      WHERE s.date = ?
    `, [date]);
  }

  async getTrack(trackId) {
    return this.getAsync('SELECT * FROM tracks WHERE id = ?', [trackId]);
  }

  async getAllTracks() {
    const sql = `
      SELECT
        t.*,
        s.date,
        v.name as venue,
        v.city,
        v.state,
        s.band_id,
        r.source_type,
        r.taper,
        r.lineage,
        s.notes as show_notes,
        b.name as artist,
        sg.title as song_title
      FROM tracks t
      LEFT JOIN recordings r ON t.recording_id = r.id
      LEFT JOIN shows s ON r.show_id = s.id
      LEFT JOIN venues v ON s.venue_id = v.id
      LEFT JOIN bands b ON s.band_id = b.id
      LEFT JOIN songs sg ON t.song_id = sg.id
      ORDER BY s.date DESC, t.track_number
    `;
    return this.allAsync(sql);
  }

  async getTracksByShow(showId) {
    const sql = `
      SELECT
        t.*,
        r.source_type,
        r.taper,
        r.lineage,
        r.quality_rating,
        s.date,
        COALESCE(t.performance_date, s.date) as recording_date,
        v.name as venue,
        v.city,
        v.state,
        s.band_id,
        s.notes as show_notes,
        b.name as artist,
        sg.title as song_title
      FROM recordings r
      INNER JOIN tracks t ON t.recording_id = r.id
      LEFT JOIN shows s ON r.show_id = s.id
      LEFT JOIN bands b ON s.band_id = b.id
      LEFT JOIN venues v ON s.venue_id = v.id
      LEFT JOIN songs sg ON t.song_id = sg.id
      WHERE r.show_id = ?
      ORDER BY t.recording_id, t.track_number
    `;
    return this.allAsync(sql, [showId]);
  }

  async getRecordingTracks(recordingId) {
    const sql = `
      SELECT * FROM tracks
      WHERE recording_id = ?
      ORDER BY track_number
    `;
    return this.allAsync(sql, [recordingId]);
  }

  async updateTrackSong(trackId, songId) {
    await this.runAsync('UPDATE tracks SET song_id = ? WHERE id = ?', [songId, trackId]);
  }

  async updateTrackDuration(trackId, duration) {
    await this.runAsync(
      'UPDATE tracks SET duration = ? WHERE id = ?',
      [Math.floor(duration), trackId]
    );
  }

  async updateTrack(trackId, updates) {
    const fields = [];
    const values = [];

    // Handle all possible track fields
    const fieldMap = {
      'track_number': 'track_number',
      'disc_number': 'disc_number',
      'song_name': 'song_name',
      'performance_date': 'performance_date',
      'has_segue': 'has_segue',
      'comment': 'comment',
      'title': 'title',
      'duration': 'duration',
      'segue_type': 'segue_type',
      'file_path': 'file_path',
      'mb_recording_id': 'mb_recording_id',
      'mb_release_id': 'mb_release_id'
    };

    for (const [key, dbField] of Object.entries(fieldMap)) {
      if (updates[key] !== undefined) {
        fields.push(`${dbField} = ?`);
        values.push(updates[key]);
      }
    }

    // Handle special case: if has_segue is set, update segue_type
    if (updates.has_segue !== undefined) {
      fields.push('segue_type = ?');
      values.push(updates.has_segue ? '>' : null);
    }

    if (fields.length === 0) {
      return { success: true, message: 'No fields to update' };
    }

    values.push(trackId);

    try {
      await this.runAsync(
        `UPDATE tracks SET ${fields.join(', ')} WHERE id = ?`,
        values
      );
      return { success: true };
    } catch (error) {
      console.error('Error updating track:', error);
      return { success: false, error: error.message };
    }
  }

  async getTracksWithNoDuration() {
    return this.allAsync(
      'SELECT id, file_path FROM tracks WHERE duration IS NULL OR duration = 0'
    );
  }

  async updateTrackMetadata(trackId, metadata) {
    const updates = [];
    const params = [];

    if (metadata.title !== undefined) {
      // Update or create song entry
      const songId = await this.findOrCreateSong(metadata.title, metadata.artist);
      updates.push('song_id = ?');
      params.push(songId);
    }

    if (metadata.track_number !== undefined) {
      updates.push('track_number = ?');
      params.push(metadata.track_number);
    }

    if (metadata.duration !== undefined) {
      updates.push('duration = ?');
      params.push(metadata.duration);
    }

    if (updates.length > 0) {
      params.push(trackId);
      await this.runAsync(
        `UPDATE tracks SET ${updates.join(', ')} WHERE id = ?`,
        params
      );
    }

    return { success: true };
  }

  async findOrCreateSong(title, artist = 'Grateful Dead') {
    if (!title) return null;

    // Get or create band
    let bandId = 1; // Default to Grateful Dead
    if (artist) {
      const band = await this.getAsync('SELECT id FROM bands WHERE name = ?', [artist]);
      if (band) {
        bandId = band.id;
      } else {
        const result = await this.runAsync('INSERT INTO bands (name) VALUES (?)', [artist]);
        bandId = result.lastID;
      }
    }

    // Normalize title for matching
    const normalizedTitle = title.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim();

    // Check for existing song
    const existing = await this.getAsync(
      'SELECT id FROM songs WHERE band_id = ? AND normalized_title = ?',
      [bandId, normalizedTitle]
    );

    if (existing) {
      return existing.id;
    }

    // Create new song
    const result = await this.runAsync(
      'INSERT INTO songs (band_id, title, normalized_title) VALUES (?, ?, ?)',
      [bandId, title, normalizedTitle]
    );

    return result.lastID;
  }

  async updateRecordingQuality(recordingId, rating) {
    await this.runAsync('UPDATE recordings SET quality_rating = ? WHERE id = ?', [rating, recordingId]);
  }

  async updateRecording(recordingId, updates) {
    const fields = [];
    const values = [];

    if (updates.source_type !== undefined) {
      fields.push('source_type = ?');
      values.push(updates.source_type);
    }

    if (updates.release_status !== undefined) {
      fields.push('release_status = ?');
      // Convert to uppercase to match CHECK constraint
      const upperStatus = updates.release_status ? updates.release_status.toUpperCase() : null;
      values.push(upperStatus);
    }

    if (updates.quality_rating !== undefined) {
      fields.push('quality_rating = ?');
      values.push(updates.quality_rating);
    }

    if (fields.length === 0) return;

    values.push(recordingId);
    await this.runAsync(
      `UPDATE recordings SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
  }

  async updateRecordingByShowId(showId, updates) {
    // Update the first recording for a show (most shows have only one recording)
    const recording = await this.getAsync(
      'SELECT id FROM recordings WHERE show_id = ? LIMIT 1',
      [showId]
    );

    if (recording) {
      await this.updateRecording(recording.id, updates);
    }
  }

  getBand(name) {
    // Synchronous for now - should be converted to async
    let band = null;
    this.db.get('SELECT * FROM bands WHERE name = ?', [name], (err, row) => {
      if (!err) band = row;
    });
    return band || { id: 1, name: 'Grateful Dead' };
  }

  // Bulk update shows
  async bulkUpdateShows(updates) {
    console.log('Bulk updating shows:', updates);
    let updatedCount = 0;

    try {
      for (const update of updates) {
        const { showId, updates: changes } = update;

        // Build dynamic update query for shows table
        const updateFields = [];
        const updateValues = [];

        if (changes.date) {
          updateFields.push('date = ?');
          updateValues.push(changes.date);
        }
        if (changes.notes !== undefined) {
          updateFields.push('notes = ?');
          updateValues.push(changes.notes);
        }
        if (changes.artwork !== undefined) {
          updateFields.push('artwork = ?');
          updateValues.push(changes.artwork);
        }
        if (changes.musicbrainz_release_id !== undefined) {
          updateFields.push('musicbrainz_release_id = ?');
          updateValues.push(changes.musicbrainz_release_id);
        }
        if (changes.release_type !== undefined) {
          updateFields.push('release_type = ?');
          updateValues.push(changes.release_type);
        }
        if (changes.release_status !== undefined) {
          updateFields.push('release_status = ?');
          // Convert to uppercase to match CHECK constraint
          const upperStatus = changes.release_status ? changes.release_status.toUpperCase() : null;
          updateValues.push(upperStatus);
          console.log(`Setting release_status to: "${upperStatus}" (original: "${changes.release_status}") for show ${showId}`);
        }
        if (changes.source_type !== undefined) {
          updateFields.push('source_type = ?');
          updateValues.push(changes.source_type);
        }

        // Execute update if there are fields to update
        if (updateFields.length > 0) {
          updateValues.push(showId);
          await this.runAsync(
            `UPDATE shows SET ${updateFields.join(', ')} WHERE id = ?`,
            updateValues
          );
        }

        // Update venue
        if (changes.venue) {
          // Find or create venue
          let venueId = null;
          if (changes.venue.name) {
            const existing = await this.getAsync(
              'SELECT id FROM venues WHERE name = ?',
              [changes.venue.name]
            );

            if (existing) {
              venueId = existing.id;
              // Update venue details
              await this.runAsync(
                'UPDATE venues SET city = ?, state = ? WHERE id = ?',
                [changes.venue.city || null, changes.venue.state || null, venueId]
              );
            } else {
              // Create new venue
              const result = await this.runAsync(
                'INSERT INTO venues (name, city, state) VALUES (?, ?, ?)',
                [changes.venue.name, changes.venue.city || null, changes.venue.state || null]
              );
              venueId = result.lastID;
            }

            // Update show's venue
            await this.runAsync(
              'UPDATE shows SET venue_id = ? WHERE id = ?',
              [venueId, showId]
            );
          }
        }

        // Update recordings
        if (changes.recordings) {
          const recordings = await this.allAsync(
            'SELECT id FROM recordings WHERE show_id = ?',
            [showId]
          );

          for (const recording of recordings) {
            const updates = [];
            const params = [];

            if (changes.recordings.sourceType !== undefined) {
              updates.push('source_type = ?');
              params.push(changes.recordings.sourceType);
            }
            if (changes.recordings.qualityRating !== undefined) {
              updates.push('quality_rating = ?');
              params.push(changes.recordings.qualityRating);
            }
            if (changes.recordings.taper !== undefined) {
              updates.push('taper = ?');
              params.push(changes.recordings.taper);
            }
            if (changes.recordings.lineage !== undefined) {
              updates.push('lineage = ?');
              params.push(changes.recordings.lineage);
            }

            if (updates.length > 0) {
              params.push(recording.id);
              await this.runAsync(
                `UPDATE recordings SET ${updates.join(', ')} WHERE id = ?`,
                params
              );
            }
          }
        }

        updatedCount++;
      }

      return { success: true, updatedCount };
    } catch (error) {
      console.error('Error bulk updating shows:', error);
      return { success: false, error: error.message };
    }
  }

  // Clear all data from database
  async clearAllData() {
    console.log('Clearing all data from database...');

    const tables = [
      'tracks',
      'sets',      // Add sets table to clear list
      'recordings',
      'shows',
      'songs',
      'venues',
      'bands'
    ];

    try {
      // Start a transaction for atomic operation
      await this.runAsync('BEGIN TRANSACTION');

      for (const table of tables) {
        const beforeCount = await this.getAsync(`SELECT COUNT(*) as count FROM ${table}`);
        console.log(`Table ${table} has ${beforeCount.count} records before clear`);

        await this.runAsync(`DELETE FROM ${table}`);
        // Reset auto-increment counters
        await this.runAsync(`DELETE FROM sqlite_sequence WHERE name = ?`, [table]);

        const afterCount = await this.getAsync(`SELECT COUNT(*) as count FROM ${table}`);
        console.log(`Table ${table} has ${afterCount.count} records after clear`);
      }

      // Commit the transaction
      await this.runAsync('COMMIT');

      // Verify the clear worked
      const showCount = await this.getAsync('SELECT COUNT(*) as count FROM shows');
      const trackCount = await this.getAsync('SELECT COUNT(*) as count FROM tracks');
      console.log(`VERIFICATION: Shows: ${showCount.count}, Tracks: ${trackCount.count}`);

      console.log('All database tables cleared successfully');
      return { success: true, message: 'Database cleared successfully' };
    } catch (error) {
      console.error('Error clearing database:', error);
      await this.runAsync('ROLLBACK');
      return { success: false, error: error.message };
    }
  }

  // Verification status methods
  async markShowAsVerified(showId, notes = null) {
    try {
      await this.runAsync(
        `UPDATE shows SET
         verified = 1,
         verified_date = CURRENT_TIMESTAMP,
         needs_review = 0,
         review_notes = ?
         WHERE id = ?`,
        [notes, showId]
      );
      return { success: true };
    } catch (error) {
      console.error('Error marking show as verified:', error);
      return { success: false, error: error.message };
    }
  }

  async markShowForReview(showId, notes) {
    try {
      await this.runAsync(
        `UPDATE shows SET
         needs_review = 1,
         review_notes = ?
         WHERE id = ?`,
        [notes, showId]
      );
      return { success: true };
    } catch (error) {
      console.error('Error marking show for review:', error);
      return { success: false, error: error.message };
    }
  }

  async clearShowVerification(showId) {
    try {
      await this.runAsync(
        `UPDATE shows SET
         verified = 0,
         verified_date = NULL,
         needs_review = 0,
         review_notes = NULL
         WHERE id = ?`,
        [showId]
      );
      return { success: true };
    } catch (error) {
      console.error('Error clearing show verification:', error);
      return { success: false, error: error.message };
    }
  }

  async getShowVerificationStatus(showId) {
    try {
      const show = await this.getAsync(
        'SELECT verified, verified_date, needs_review, review_notes FROM shows WHERE id = ?',
        [showId]
      );
      return show || { verified: false, needs_review: false };
    } catch (error) {
      console.error('Error getting show verification status:', error);
      return { verified: false, needs_review: false };
    }
  }

  async getUnverifiedShows() {
    try {
      return await this.allAsync(
        `SELECT s.*, b.name as band_name, v.name as venue_name, v.city, v.state
         FROM shows s
         JOIN bands b ON s.band_id = b.id
         LEFT JOIN venues v ON s.venue_id = v.id
         WHERE s.verified = 0 OR s.verified IS NULL
         ORDER BY s.date DESC`
      );
    } catch (error) {
      console.error('Error getting unverified shows:', error);
      return [];
    }
  }

  async getShowsNeedingReview() {
    try {
      return await this.allAsync(
        `SELECT s.*, b.name as band_name, v.name as venue_name, v.city, v.state, s.review_notes
         FROM shows s
         JOIN bands b ON s.band_id = b.id
         LEFT JOIN venues v ON s.venue_id = v.id
         WHERE s.needs_review = 1
         ORDER BY s.date DESC`
      );
    } catch (error) {
      console.error('Error getting shows needing review:', error);
      return [];
    }
  }
}

module.exports = DatabaseService;