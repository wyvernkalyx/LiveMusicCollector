const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');
const MusicBrainzService = require('./musicBrainzService');

class OfficialReleaseDetector {
  constructor() {
    // Load local database of known releases
    this.loadLocalDatabase();

    // Initialize MusicBrainz service
    this.musicBrainz = new MusicBrainzService();

    // Initialize with known official releases and their checksums
    // This can be expanded with more releases over time
    this.releases = {
      "Blues for Allah (50th Anniversary Remaster)": {
        "release_date": "2025-01-01",
        "label": "Grateful Dead Records",
        "catalog": "GD50-BA",
        "type": "studio_plus_live",
        "tracks": [
          // Studio tracks
          {
            "disc": 1,
            "track": 1,
            "title": "Help on the Way",
            "date": "1975",
            "venue": "Studio",
            "city": null,
            "state": null,
            "md5": null,
            "sha256": null,
            "duration": 311
          },
          {
            "disc": 1,
            "track": 2,
            "title": "Slipknot!",
            "date": "1975",
            "venue": "Studio",
            "city": null,
            "state": null,
            "md5": null,
            "sha256": null,
            "duration": 258
          },
          {
            "disc": 1,
            "track": 3,
            "title": "Franklin's Tower",
            "date": "1975",
            "venue": "Studio",
            "city": null,
            "state": null,
            "md5": null,
            "sha256": null,
            "duration": 296
          },
          // Live bonus tracks from different shows
          {
            "disc": 2,
            "track": 1,
            "title": "Help on the Way (Live)",
            "date": "1975-08-13",
            "venue": "Great American Music Hall",
            "city": "San Francisco",
            "state": "CA",
            "md5": null,
            "sha256": null,
            "duration": 320
          },
          {
            "disc": 2,
            "track": 5,
            "title": "Franklin's Tower (Live)",
            "date": "1975-10-30",
            "venue": "Lindley Meadows",
            "city": "San Francisco",
            "state": "CA",
            "md5": null,
            "sha256": null,
            "duration": 540
          }
        ]
      },
      "Dick's Picks Vol. 1": {
        "release_date": "1993-12-01",
        "label": "Grateful Dead Records",
        "catalog": "GDCD 4001",
        "tracks": [
          {
            "disc": 1,
            "track": 1,
            "title": "Bertha",
            "date": "1973-12-19",
            "venue": "Curtis Hixon Hall",
            "city": "Tampa",
            "state": "FL",
            "md5": "d8e8fca2dc0f896fd7cb4cb0031ba249",
            "sha256": null,
            "duration": 391
          },
          {
            "disc": 1,
            "track": 2,
            "title": "Big River",
            "date": "1973-12-19",
            "venue": "Curtis Hixon Hall",
            "city": "Tampa",
            "state": "FL",
            "md5": "e2fc714c4727ee9395f324cd2e7f331f",
            "sha256": null,
            "duration": 307
          }
          // More tracks would be added here
        ]
      },
      "Live at Fillmore East 2-11-69": {
        "release_date": "2025-01-01",
        "label": "Dead.net",
        "catalog": "DN-2025-01",
        "tracks": [
          {
            "disc": 1,
            "track": 3,
            "title": "Hard to Handle",
            "date": "1971-04-25",
            "venue": "Fillmore East",
            "city": "New York",
            "state": "NY",
            "md5": null,
            "sha256": null,
            "duration": 283
          },
          {
            "disc": 2,
            "track": 28,
            "title": "Sugar Magnolia",
            "date": "1971-04-27",
            "venue": "Fillmore East",
            "city": "New York",
            "state": "NY",
            "md5": null,
            "sha256": null,
            "duration": 438
          }
          // This would be populated with actual checksums
        ]
      }
    };

    // Cache for calculated checksums to avoid recalculation
    this.checksumCache = new Map();
  }

  /**
   * Calculate MD5 and SHA256 checksums for a file
   */
  async calculateChecksums(filePath) {
    // Check cache first
    if (this.checksumCache.has(filePath)) {
      return this.checksumCache.get(filePath);
    }

    try {
      const fileBuffer = await fs.readFile(filePath);

      const md5 = crypto.createHash('md5').update(fileBuffer).digest('hex');
      const sha256 = crypto.createHash('sha256').update(fileBuffer).digest('hex');

      const checksums = { md5, sha256 };
      this.checksumCache.set(filePath, checksums);

      return checksums;
    } catch (error) {
      console.error('Error calculating checksums:', error);
      return { md5: null, sha256: null };
    }
  }

  /**
   * Detect if files from a folder are part of an official release
   * If even one file matches, return the entire release info
   */
  async detectOfficialReleaseFromFolder(filePaths, metadataArray = []) {
    // Check each file for a match
    for (let i = 0; i < filePaths.length; i++) {
      const filePath = filePaths[i];
      const metadata = metadataArray[i] || {};

      const match = await this.detectOfficialRelease(filePath, metadata);
      if (match && match.matched) {
        console.log(`Detected official release "${match.release.name}" from file ${i + 1} of ${filePaths.length}`);

        // Return info indicating this entire folder is an official release
        return {
          ...match,
          folderIsOfficialRelease: true,
          detectedFromFile: filePath,
          totalTracksInRelease: this.releases[match.release.name].tracks.length
        };
      }
    }

    return null;
  }

  /**
   * Get all tracks for a detected official release
   */
  getOfficialReleaseInfo(releaseName) {
    const release = this.releases[releaseName];
    if (!release) return null;

    return {
      name: releaseName,
      ...release,
      shouldStayTogether: true,
      folderName: releaseName.replace(/[<>:"/\\|?*]/g, '-')
    };
  }

  /**
   * Detect if a file is part of an official release
   */
  async detectOfficialRelease(filePath, metadata = {}) {
    const checksums = await this.calculateChecksums(filePath);

    // Search through all known releases
    for (const [releaseName, releaseInfo] of Object.entries(this.releases)) {
      for (const track of releaseInfo.tracks) {
        // Check MD5 first (faster)
        if (track.md5 && checksums.md5 === track.md5) {
          return this.createReleaseMatch(releaseName, releaseInfo, track, 'md5');
        }

        // Check SHA256 if available
        if (track.sha256 && checksums.sha256 === track.sha256) {
          return this.createReleaseMatch(releaseName, releaseInfo, track, 'sha256');
        }
      }
    }

    // Try fuzzy matching based on metadata if no checksum match
    if (metadata.album || metadata.title) {
      return this.fuzzyMatchRelease(metadata, checksums);
    }

    return null;
  }

  /**
   * Create a release match object with all relevant information
   */
  createReleaseMatch(releaseName, releaseInfo, track, matchType) {
    return {
      matched: true,
      matchType: matchType,
      confidence: 1.0,
      release: {
        name: releaseName,
        releaseDate: releaseInfo.release_date,
        label: releaseInfo.label,
        catalog: releaseInfo.catalog
      },
      track: {
        disc: track.disc,
        trackNumber: track.track,
        title: `${track.title} (${track.date})`, // Include date in title
        originalTitle: track.title,
        date: track.date,
        venue: track.venue,
        city: track.city,
        state: track.state,
        duration: track.duration
      },
      metadata: {
        artist: 'Grateful Dead',
        album: releaseName,
        date: track.date,
        venue: track.venue,
        city: track.city,
        state: track.state,
        sourceType: 'OFFICIAL',
        isOfficial: true
      }
    };
  }

  /**
   * Try to match based on metadata when checksum doesn't match
   */
  fuzzyMatchRelease(metadata, checksums) {
    const albumLower = metadata.album?.toLowerCase() || '';
    const titleLower = metadata.title?.toLowerCase() || '';

    for (const [releaseName, releaseInfo] of Object.entries(this.releases)) {
      const releaseNameLower = releaseName.toLowerCase();

      // Check if album name matches
      if (albumLower && (albumLower.includes(releaseNameLower) || releaseNameLower.includes(albumLower))) {
        // Try to find the specific track
        for (const track of releaseInfo.tracks) {
          const trackTitleLower = track.title.toLowerCase();

          if (titleLower && titleLower.includes(trackTitleLower)) {
            // Store the checksum for future exact matching
            if (checksums.md5) {
              track.md5 = checksums.md5;
            }
            if (checksums.sha256) {
              track.sha256 = checksums.sha256;
            }

            return {
              ...this.createReleaseMatch(releaseName, releaseInfo, track, 'fuzzy'),
              confidence: 0.8,
              matchType: 'fuzzy'
            };
          }
        }
      }
    }

    return null;
  }

  /**
   * Add a new release to the database
   */
  addRelease(releaseName, releaseInfo) {
    this.releases[releaseName] = releaseInfo;
  }

  /**
   * Update checksums for a track based on actual file
   */
  async updateTrackChecksum(releaseName, discNumber, trackNumber, filePath) {
    if (!this.releases[releaseName]) {
      return false;
    }

    const checksums = await this.calculateChecksums(filePath);
    const release = this.releases[releaseName];

    const track = release.tracks.find(t => t.disc === discNumber && t.track === trackNumber);
    if (track) {
      track.md5 = checksums.md5;
      track.sha256 = checksums.sha256;
      return true;
    }

    return false;
  }

  /**
   * Export the release database to JSON
   */
  exportReleases() {
    return JSON.stringify(this.releases, null, 2);
  }

  /**
   * Import releases from JSON
   */
  importReleases(jsonData) {
    try {
      const imported = JSON.parse(jsonData);
      this.releases = { ...this.releases, ...imported };
      return true;
    } catch (error) {
      console.error('Error importing releases:', error);
      return false;
    }
  }

  /**
   * Get all known releases
   */
  getAllReleases() {
    return Object.keys(this.releases).map(name => ({
      name,
      ...this.releases[name]
    }));
  }

  /**
   * Load local database of Grateful Dead releases
   */
  async loadLocalDatabase() {
    try {
      const dbPath = path.join(__dirname, '..', 'data', 'gratefulDeadReleases.json');
      const data = await fs.readFile(dbPath, 'utf8');
      const db = JSON.parse(data);

      // Merge local database releases with existing releases
      if (db.releases) {
        db.releases.forEach(release => {
          // Convert to our internal format
          const tracks = [];
          if (release.tracklist) {
            release.tracklist.forEach(track => {
              tracks.push({
                disc: track.disc || 1,
                track: track.position,
                title: track.title,
                date: track.recordingDate,
                venue: track.venue || (track.isLive ? 'Unknown Venue' : 'Studio'),
                city: track.city || null,
                state: track.state || null,
                md5: null,
                sha256: null,
                duration: track.duration
              });
            });
          }

          this.releases[release.name] = {
            release_date: release.releaseDate,
            label: release.label,
            catalog: release.catalogNumber,
            type: release.type,
            subTypes: release.subTypes,
            musicbrainzId: release.musicbrainzId,
            tracks: tracks
          };
        });
      }

      // Store patterns for detection
      this.patterns = db.patterns || {};
      this.labelMappings = db.labelMappings || {};

      console.log(`Loaded ${Object.keys(this.releases).length} official releases from local database`);
    } catch (error) {
      console.log('Could not load local releases database:', error.message);
      // Continue without local database
    }
  }

  /**
   * Check if metadata matches known official release patterns
   */
  matchesOfficialPattern(metadata) {
    const album = metadata.album || '';
    const label = metadata.label || '';

    // Check against pattern indicators
    if (this.patterns && this.patterns.officialReleaseIndicators) {
      for (const pattern of this.patterns.officialReleaseIndicators) {
        if (album.includes(pattern)) {
          return true;
        }
      }
    }

    // Check label mappings
    if (this.labelMappings) {
      for (const [mainLabel, variations] of Object.entries(this.labelMappings)) {
        if (label.includes(mainLabel) || variations.some(v => label.includes(v))) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Enhanced detection using both local database and MusicBrainz
   */
  async detectOfficialReleaseEnhanced(filePath, metadata = {}) {
    // First try local database with checksums
    const localMatch = await this.detectOfficialRelease(filePath, metadata);
    if (localMatch && localMatch.matched && localMatch.confidence > 0.9) {
      return localMatch;
    }

    // Check if metadata matches known patterns
    if (this.matchesOfficialPattern(metadata)) {
      // Try MusicBrainz lookup
      if (this.musicBrainz && metadata.artist && metadata.album) {
        try {
          const mbResult = await this.musicBrainz.searchByMetadata(
            metadata.artist,
            metadata.title,
            metadata.album
          );

          if (mbResult && mbResult.isOfficialRelease) {
            return {
              matched: true,
              matchType: 'musicbrainz',
              confidence: 0.95,
              release: {
                name: metadata.album,
                releaseDate: mbResult.releases[0]?.date,
                label: 'Various',
                catalog: null,
                musicbrainzId: mbResult.id
              },
              track: {
                title: metadata.title,
                date: metadata.date,
                venue: metadata.venue
              },
              metadata: {
                ...metadata,
                isOfficial: true,
                sourceType: 'OFFICIAL'
              }
            };
          }
        } catch (error) {
          console.log('MusicBrainz lookup failed:', error.message);
        }
      }
    }

    // Return local match if available, even with lower confidence
    return localMatch;
  }
}

module.exports = OfficialReleaseDetector;