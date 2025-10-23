const MusicBrainzApi = require('musicbrainz-api').MusicBrainzApi;
const CoverArtArchiveApi = require('musicbrainz-api').CoverArtArchiveApi;
const { exec } = require('child_process');
const { promisify } = require('util');
const path = require('path');
const fs = require('fs').promises;
const https = require('https');
const AcoustIDService = require('./acoustidService');

const execAsync = promisify(exec);

class MusicBrainzService {
  constructor() {
    // Initialize MusicBrainz API client
    this.mbApi = new MusicBrainzApi({
      appName: 'LiveMusicCollector',
      appVersion: '0.1.0',
      appContactInfo: 'https://github.com/user/live-music-collector'
    });

    // Initialize Cover Art Archive API
    this.coverArtApi = new CoverArtArchiveApi();

    // Initialize AcoustID Service for fingerprinting
    this.acoustIDService = new AcoustIDService();

    // Cache for fingerprints and lookups
    this.fingerprintCache = new Map();
    this.releaseCache = new Map();

    // Rate limiting
    this.lastRequestTime = 0;
    this.minRequestInterval = 1000; // 1 second between requests per MusicBrainz rate limits
  }

  /**
   * Calculate acoustic fingerprint using Chromaprint/fpcalc
   * @param {string} filePath - Path to audio file
   * @returns {Object} - { fingerprint, duration }
   */
  async calculateFingerprint(filePath) {
    // Check cache first
    if (this.fingerprintCache.has(filePath)) {
      return this.fingerprintCache.get(filePath);
    }

    try {
      // Use fpcalc to generate acoustic fingerprint
      // Note: fpcalc must be installed on the system
      const { stdout } = await execAsync(`fpcalc -json "${filePath}"`);
      const result = JSON.parse(stdout);

      const fingerprintData = {
        fingerprint: result.fingerprint,
        duration: result.duration
      };

      // Cache the result
      this.fingerprintCache.set(filePath, fingerprintData);

      return fingerprintData;
    } catch (error) {
      console.error('Error calculating fingerprint:', error);
      // Try alternative method if fpcalc is not available
      return this.calculateFallbackFingerprint(filePath);
    }
  }

  /**
   * Fallback fingerprint generation using file hash
   * This is less accurate but works without external dependencies
   */
  async calculateFallbackFingerprint(filePath) {
    const crypto = require('crypto');
    const buffer = await fs.readFile(filePath);
    const hash = crypto.createHash('sha256').update(buffer).digest('hex');

    return {
      fingerprint: hash,
      duration: 0, // Would need audio library to get actual duration
      isFallback: true
    };
  }

  /**
   * Query MusicBrainz for recording information using fingerprint
   * @param {string} fingerprint - Acoustic fingerprint
   * @param {number} duration - Track duration in seconds
   */
  async queryByFingerprint(fingerprint, duration) {
    // Implement rate limiting
    await this.rateLimit();

    try {
      // Query AcoustID service first (separate from MusicBrainz)
      const acoustIdResult = await this.queryAcoustId(fingerprint, duration);

      if (acoustIdResult && acoustIdResult.recordings) {
        // Get the most confident match
        const bestMatch = acoustIdResult.recordings[0];

        if (bestMatch && bestMatch.id) {
          // Now query MusicBrainz for full details
          return await this.getRecordingDetails(bestMatch.id);
        }
      }

      return null;
    } catch (error) {
      console.error('Error querying by fingerprint:', error);
      return null;
    }
  }

  /**
   * Query AcoustID service for recording matches
   */
  async queryAcoustId(fingerprint, duration) {
    // Note: In production, you'd need an AcoustID API key
    // For now, return null as placeholder
    console.log('AcoustID query would happen here with fingerprint');
    return null;
  }

  /**
   * Get full recording details from MusicBrainz
   */
  async getRecordingDetails(recordingId) {
    await this.rateLimit();

    try {
      const recording = await this.mbApi.lookup('recording', recordingId, [
        'releases',
        'artists',
        'isrcs'
      ]);

      return this.parseRecordingData(recording);
    } catch (error) {
      console.error('Error getting recording details:', error);
      return null;
    }
  }

  /**
   * Search MusicBrainz by artist and track title
   */
  async searchByMetadata(artist, title, album = null) {
    await this.rateLimit();

    try {
      let query = `artist:"${artist}" AND recording:"${title}"`;
      if (album) {
        query += ` AND release:"${album}"`;
      }

      const results = await this.mbApi.search('recording', {
        query: query,
        limit: 10
      });

      if (results && results.recordings && results.recordings.length > 0) {
        // Get details for the best match
        const bestMatch = results.recordings[0];
        return await this.getRecordingDetails(bestMatch.id);
      }

      return null;
    } catch (error) {
      console.error('Error searching by metadata:', error);
      return null;
    }
  }

  /**
   * Search for Grateful Dead releases
   */
  async searchGratefulDeadReleases(query = '') {
    await this.rateLimit();

    try {
      const searchQuery = query
        ? `artist:"Grateful Dead" AND release:"${query}"`
        : 'artist:"Grateful Dead"';

      const results = await this.mbApi.search('release', {
        query: searchQuery,
        limit: 100,
        inc: ['recordings', 'release-groups', 'media']
      });

      return results.releases || [];
    } catch (error) {
      console.error('Error searching Grateful Dead releases:', error);
      return [];
    }
  }

  /**
   * Get full release details including tracklist
   */
  async getReleaseDetails(releaseId) {
    // Check cache first
    if (this.releaseCache.has(releaseId)) {
      return this.releaseCache.get(releaseId);
    }

    await this.rateLimit();

    try {
      const release = await this.mbApi.lookup('release', releaseId, [
        'recordings',
        'artists',
        'media',
        'labels',
        'release-groups',
        'annotation',
        'recording-level-rels',
        'work-level-rels'
      ]);

      const releaseData = this.parseReleaseData(release);

      // Cache the result
      this.releaseCache.set(releaseId, releaseData);

      return releaseData;
    } catch (error) {
      console.error('Error getting release details:', error);
      return null;
    }
  }

  /**
   * Parse recording data from MusicBrainz response
   */
  parseRecordingData(recording) {
    if (!recording) return null;

    const releases = recording.releases || [];
    const officialReleases = releases.filter(r =>
      r.status === 'Official' &&
      (r['release-group'] && r['release-group']['primary-type'] !== 'Bootleg')
    );

    return {
      id: recording.id,
      title: recording.title,
      duration: recording.length ? Math.floor(recording.length / 1000) : null,
      artist: recording['artist-credit']?.[0]?.artist?.name,
      releases: releases.map(r => ({  // Return ALL releases, not just official ones
        id: r.id,
        title: r.title,
        date: r.date,
        country: r.country,
        status: r.status,
        type: r['release-group']?.['primary-type'],
        secondaryTypes: r['release-group']?.['secondary-types'] || []
      })),
      isOfficialRelease: officialReleases.length > 0
    };
  }

  /**
   * Parse release data from MusicBrainz response
   */
  parseReleaseData(release) {
    if (!release) return null;

    // Extract performance date from release title (for live albums)
    // This is the actual concert date, different from release.date (when album was released)
    const releaseGroup = release['release-group'];
    const isLiveRelease = releaseGroup?.['secondary-types']?.includes('Live') ||
                          releaseGroup?.['primary-type'] === 'Live';

    let performanceDate = null;
    let performanceVenue = null;
    let performanceCity = null;
    let performanceState = null;

    if (isLiveRelease && release.title) {
      const liveInfo = this.extractLiveInfoFromTitle(release.title);
      if (liveInfo) {
        performanceDate = liveInfo.date;
        performanceVenue = liveInfo.venue;
        performanceCity = liveInfo.city;
        performanceState = liveInfo.state;

        console.log('Extracted performance info from title:', {
          title: release.title,
          performanceDate,
          venue: performanceVenue,
          city: performanceCity,
          state: performanceState
        });
      }
    }

    const tracks = [];
    const segues = new Map(); // Track segue relationships

    if (release.media) {
      release.media.forEach(medium => {
        if (medium.tracks) {
          medium.tracks.forEach((track, index) => {
            // Generate disc-based numbering (101, 102... for disc 1, 201, 202... for disc 2)
            const discTrackNumber = medium.position * 100 + track.position;

            // Check for segue relationships
            let hasSegue = false;
            if (track.recording?.relations) {
              const segueRel = track.recording.relations.find(rel =>
                rel.type === 'performance' && rel.attributes?.includes('medley')
              );
              hasSegue = !!segueRel;
            }

            // Determine if track is live based on title or disc title
            const isLiveTrack = track.title?.toLowerCase().includes('live') ||
                               medium.title?.toLowerCase().includes('live') ||
                               track.recording?.disambiguation?.toLowerCase().includes('live');

            // Get recording date - check multiple possible date fields
            let trackDate = null;
            if (track.recording) {
              // Try different date fields that MusicBrainz might use
              trackDate = track.recording['first-release-date'] ||
                         track.recording.date ||
                         track.recording['recording-date'] ||
                         null;

              // For recordings, also check if there's a specific recording date in relations
              if (!trackDate && track.recording.relations) {
                const recordingRel = track.recording.relations.find(rel =>
                  rel.type === 'performance' || rel.type === 'recorded_at'
                );
                if (recordingRel && recordingRel.begin) {
                  trackDate = recordingRel.begin;
                }
              }
            }

            // CRITICAL FIX: Use performance date for live releases, not release date
            // For live albums, use the extracted performance date
            if (!trackDate && isLiveRelease && performanceDate) {
              trackDate = performanceDate;
            }

            // If still no date and it's not a live track, don't set a date
            // (We'll use release.date separately as releaseDate, not as trackDate)

            tracks.push({
              position: track.position,
              discTrackNumber: discTrackNumber,
              title: track.title,
              duration: track.length ? Math.floor(track.length / 1000) : null,
              recordingId: track.recording?.id,
              recordingDate: trackDate,
              isLiveTrack: isLiveTrack,
              discNumber: medium.position,
              discTitle: medium.title || `Disc ${medium.position}`,
              hasSegue: hasSegue,
              // Add segue notation if this track flows into the next
              displayTitle: hasSegue && index < medium.tracks.length - 1
                ? `${track.title} >`
                : track.title
            });

            if (hasSegue) {
              segues.set(discTrackNumber, true);
            }
          });
        }
      });
    }

    // Get release group information for original release date
    const originalReleaseDate = releaseGroup?.['first-release-date'] || release.date;

    return {
      id: release.id,
      title: release.title,
      artist: release['artist-credit']?.[0]?.artist?.name,
      date: release.date, // When the album was RELEASED
      releaseDate: release.date, // Explicit: when album was released (for official live albums)
      performanceDate: performanceDate, // CRITICAL: when concert HAPPENED (extracted from title)
      performanceVenue: performanceVenue, // Venue name from title
      performanceCity: performanceCity, // City from title
      performanceState: performanceState, // State from title
      originalReleaseDate: originalReleaseDate,
      releaseVersion: release.disambiguation || '',
      country: release.country,
      status: release.status,
      type: releaseGroup?.['primary-type'],
      secondaryTypes: releaseGroup?.['secondary-types'] || [],
      barcode: release.barcode,
      label: release['label-info']?.[0]?.label?.name,
      catalogNumber: release['label-info']?.[0]?.['catalog-number'],
      annotation: release.annotation,
      tracks: tracks,
      trackCount: tracks.length,
      discCount: release.media?.length || 1,
      segues: Array.from(segues.keys()),
      isCompilation: releaseGroup?.['secondary-types']?.includes('Compilation'),
      isLive: isLiveRelease, // Use the isLiveRelease flag we already calculated
      isOfficial: release.status === 'Official',
      coverArt: release['cover-art-archive'] ? {
        exists: release['cover-art-archive'].artwork,
        front: release['cover-art-archive'].front,
        back: release['cover-art-archive'].back
      } : null
    };
  }

  /**
   * Rate limiting helper
   */
  async rateLimit() {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;

    if (timeSinceLastRequest < this.minRequestInterval) {
      const waitTime = this.minRequestInterval - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    this.lastRequestTime = Date.now();
  }

  /**
   * Identify if files belong to an official release
   */
  async identifyOfficialRelease(filePaths, metadata = []) {
    console.log(`Checking ${filePaths.length} files for official release match...`);

    // Try to identify using metadata first (faster)
    if (metadata.length > 0 && metadata[0].artist && metadata[0].album) {
      const artist = metadata[0].artist;
      const album = metadata[0].album;

      console.log(`Searching MusicBrainz for: ${artist} - ${album}`);
      const releases = await this.searchGratefulDeadReleases(album);

      if (releases.length > 0) {
        // Get full details for the best match
        const bestMatch = releases[0];
        const releaseDetails = await this.getReleaseDetails(bestMatch.id);

        if (releaseDetails && releaseDetails.isOfficial) {
          console.log(`Found official release: ${releaseDetails.title}`);

          return {
            matched: true,
            confidence: 0.9,
            release: releaseDetails,
            matchMethod: 'metadata'
          };
        }
      }
    }

    // Try fingerprinting if metadata search didn't work
    // (This would be slower but more accurate)
    console.log('No metadata match found, would try fingerprinting next...');

    return null;
  }

  /**
   * Match local files to a known release tracklist
   */
  matchFilesToRelease(files, release) {
    const matches = [];
    const unmatchedFiles = [];
    const unmatchedTracks = [...release.tracks];

    // Try to match each file to a track
    files.forEach(file => {
      let bestMatch = null;
      let bestScore = 0;

      unmatchedTracks.forEach((track, index) => {
        const score = this.calculateMatchScore(file, track);
        if (score > bestScore) {
          bestScore = score;
          bestMatch = { track, index };
        }
      });

      if (bestMatch && bestScore > 0.7) {
        matches.push({
          file: file,
          track: bestMatch.track,
          confidence: bestScore
        });
        // Remove matched track from unmatched list
        unmatchedTracks.splice(bestMatch.index, 1);
      } else {
        unmatchedFiles.push(file);
      }
    });

    return {
      matches,
      unmatchedFiles,
      unmatchedTracks,
      completeMatch: unmatchedFiles.length === 0 && unmatchedTracks.length === 0
    };
  }

  /**
   * Calculate match score between file and track
   */
  calculateMatchScore(file, track) {
    let score = 0;
    let factors = 0;

    // Check title similarity
    if (file.title && track.title) {
      const similarity = this.calculateStringSimilarity(
        file.title.toLowerCase(),
        track.title.toLowerCase()
      );
      score += similarity;
      factors++;
    }

    // Check duration match (within 10 seconds)
    if (file.duration && track.duration) {
      const durationDiff = Math.abs(file.duration - track.duration);
      if (durationDiff < 10) {
        score += 1.0;
      } else if (durationDiff < 30) {
        score += 0.5;
      }
      factors++;
    }

    // Check track number match
    if (file.trackNumber && track.position) {
      if (file.trackNumber === track.position) {
        score += 1.0;
      }
      factors++;
    }

    // Check disc number match
    if (file.discNumber && track.discNumber) {
      if (file.discNumber === track.discNumber) {
        score += 1.0;
      }
      factors++;
    }

    return factors > 0 ? score / factors : 0;
  }

  /**
   * Calculate string similarity (simple Levenshtein distance ratio)
   */
  calculateStringSimilarity(str1, str2) {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) {
      return 1.0;
    }

    const distance = this.levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
  }

  /**
   * Extract live performance information from title
   */
  extractLiveInfoFromTitle(title) {
    if (!title) return null;

    let date = null;
    let venue = null;
    let city = null;
    let state = null;

    // Pattern 1: "Live at [Venue], [City], [State/Country] YYYY-MM-DD"
    let match = title.match(/Live at ([^,]+),?\s*([^,]+)?,?\s*([A-Z]{2}|[^,]+)?\s+(\d{4}-\d{2}-\d{2})/i);
    if (match) {
      venue = match[1]?.trim();
      city = match[2]?.trim();
      state = match[3]?.trim();
      date = match[4];
      return { date, venue, city, state };
    }

    // Pattern 2: "Live at [Venue] YYYY-MM-DD"
    match = title.match(/Live at ([^,]+)\s+(\d{4}-\d{2}-\d{2})/i);
    if (match) {
      venue = match[1]?.trim();
      date = match[2];
      return { date, venue, city, state };
    }

    // Pattern 3: "[City] 'YY" or "[City] YYYY" (e.g., "St. Louis '71" or "Boston 1977")
    match = title.match(/([A-Za-z\s.]+)\s+'?(\d{2,4})\b/);
    if (match) {
      city = match[1]?.trim();
      let year = match[2];
      // Convert 2-digit year to 4-digit
      if (year.length === 2) {
        year = parseInt(year) > 50 ? `19${year}` : `20${year}`;
      }
      // Just return the year as a partial date
      date = `${year}`;
      return { date, venue, city, state };
    }

    // Pattern 4: Date in parentheses "(YYYY-MM-DD)" or "(MM/DD/YYYY)"
    match = title.match(/\((\d{4}-\d{2}-\d{2})\)/);
    if (match) {
      date = match[1];
      return { date, venue, city, state };
    }

    match = title.match(/\((\d{1,2})\/(\d{1,2})\/(\d{4})\)/);
    if (match) {
      const month = match[1].padStart(2, '0');
      const day = match[2].padStart(2, '0');
      date = `${match[3]}-${month}-${day}`;
      return { date, venue, city, state };
    }

    // Pattern 5: "Live from [Venue]" or "Recorded at [Venue]"
    match = title.match(/(Live from|Recorded at|At)\s+([^,\(]+)/i);
    if (match) {
      venue = match[2]?.trim();
      return { date, venue, city, state };
    }

    // Pattern 6: Just a date somewhere in the title
    match = title.match(/(\d{4}-\d{2}-\d{2})/);
    if (match) {
      date = match[1];
      return { date, venue, city, state };
    }

    // Pattern 7: Month Day, Year format (e.g., "February 27, 1969")
    match = title.match(/(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),?\s+(\d{4})/i);
    if (match) {
      const months = {
        'january': '01', 'february': '02', 'march': '03', 'april': '04',
        'may': '05', 'june': '06', 'july': '07', 'august': '08',
        'september': '09', 'october': '10', 'november': '11', 'december': '12'
      };
      const month = months[match[1].toLowerCase()];
      const day = match[2].padStart(2, '0');
      date = `${match[3]}-${month}-${day}`;
      return { date, venue, city, state };
    }

    return null;
  }

  /**
   * Format track title with performance date for live recordings
   */
  formatTrackTitleWithDate(title, performanceDate, isLive = false) {
    if (!isLive || !performanceDate) {
      return title;
    }

    // Format date as yyyy-mm-dd
    const date = new Date(performanceDate);
    if (!isNaN(date)) {
      const formattedDate = date.toISOString().split('T')[0];
      return `${title} (${formattedDate})`;
    }

    return title;
  }

  /**
   * Process tracks to add formatted titles and segue notations
   */
  processTracksForDisplay(tracks, isAlbumLive = false) {
    return tracks.map((track, index) => {
      let formattedTitle = track.title;

      // Add performance date for live recordings
      // Use track-specific live flag if available, otherwise use album-level flag
      const isLive = track.isLiveTrack !== undefined ? track.isLiveTrack : isAlbumLive;

      if (isLive && track.recordingDate) {
        formattedTitle = this.formatTrackTitleWithDate(
          formattedTitle,
          track.recordingDate,
          true
        );
      }

      // Add segue notation
      if (track.hasSegue && index < tracks.length - 1) {
        formattedTitle = `${formattedTitle} >`;
      }

      return {
        ...track,
        formattedTitle,
        displayNumber: track.discTrackNumber || track.position,
        displayDate: track.recordingDate || null
      };
    });
  }

  /**
   * Fetch cover art for a release
   */
  async fetchCoverArt(releaseId) {
    try {
      // Try to get cover art from Cover Art Archive
      const coverArt = await this.coverArtApi.getReleaseCovers(releaseId);

      if (coverArt && coverArt.images) {
        // Find front cover or first available image
        const frontCover = coverArt.images.find(img => img.front) || coverArt.images[0];

        if (frontCover) {
          return {
            small: frontCover.thumbnails?.['250'] || frontCover.thumbnails?.small,
            medium: frontCover.thumbnails?.['500'] || frontCover.image,
            large: frontCover.image,
            back: coverArt.images.find(img => img.back)?.image
          };
        }
      }

      // Alternative: Direct URL approach
      return {
        small: `https://coverartarchive.org/release/${releaseId}/front-250`,
        medium: `https://coverartarchive.org/release/${releaseId}/front-500`,
        large: `https://coverartarchive.org/release/${releaseId}/front`,
        back: `https://coverartarchive.org/release/${releaseId}/back`
      };

    } catch (error) {
      console.log(`No cover art available for release ${releaseId}`);
      return null;
    }
  }

  /**
   * Enhanced audio file matching using AcoustID fingerprinting
   * @param {string} filePath - Path to audio file
   * @param {Object} metadata - Basic metadata (artist, title, etc.)
   * @returns {Promise<Object>} - Best match with combined confidence score
   */
  async findBestMatchWithFingerprint(filePath, metadata = {}) {
    try {
      console.log('\n===== MUSICBRAINZ FINGERPRINT MATCH START =====');
      console.log('File:', filePath);
      console.log('Metadata provided:', {
        artist: metadata.artist || 'none',
        title: metadata.title || 'none',
        album: metadata.album || 'none'
      });

      // Get AcoustID matches first
      const acoustIDMatches = await this.acoustIDService.findMatches(filePath);

      if (acoustIDMatches.length === 0) {
        console.log('No AcoustID matches found, falling back to metadata search');
        console.log('===== MUSICBRAINZ FINGERPRINT MATCH END (NO MATCHES) =====\n');
        return this.searchByMetadataWrapper(metadata);
      }

      // Get the best AcoustID match
      const bestAcoustIDMatch = acoustIDMatches[0];
      console.log('\nBest AcoustID match selected:');
      console.log('  Title:', bestAcoustIDMatch.title);
      console.log('  Artists:', bestAcoustIDMatch.artists?.map(a => a.name).join(', '));
      console.log('  Score:', bestAcoustIDMatch.score);
      console.log('  Recording ID:', bestAcoustIDMatch.recordingId);

      // If we have a high-confidence AcoustID match, enhance it with MusicBrainz data
      if (bestAcoustIDMatch.score >= 0.8) {
        console.log(`High confidence AcoustID match:`, {
          title: bestAcoustIDMatch.title,
          score: bestAcoustIDMatch.score,
          recordingId: bestAcoustIDMatch.recordingId,
          artists: bestAcoustIDMatch.artists
        });

        // Get full MusicBrainz data for the recording
        let recording = null;
        let recordingTitle = bestAcoustIDMatch.title;
        let recordingArtist = bestAcoustIDMatch.artists?.[0]?.name;

        try {
          await this.rateLimit();
          recording = await this.mbApi.lookup('recording', bestAcoustIDMatch.recordingId, [
            'artists',
            'releases',
            'release-groups',
            'place-rels',
            'work-rels',
            'artist-rels'
          ]);

          // MusicBrainz recording objects have title at the top level
          if (recording) {
            console.log('MusicBrainz recording lookup result:', {
              hasTitle: !!recording.title,
              title: recording.title,
              hasArtistCredit: !!recording['artist-credit'],
              artistCreditLength: recording['artist-credit']?.length
            });

            recordingTitle = recording.title || recordingTitle;
            // Extract artist from artist-credit structure
            if (recording['artist-credit'] && recording['artist-credit'].length > 0) {
              const artistCredit = recording['artist-credit'][0];
              if (artistCredit.artist) {
                recordingArtist = artistCredit.artist.name || artistCredit.name || recordingArtist;
              } else if (artistCredit.name) {
                recordingArtist = artistCredit.name || recordingArtist;
              }
            }
          }
        } catch (lookupError) {
          console.error('Error looking up recording from MusicBrainz:', lookupError);
          // Continue with AcoustID data
        }

        // Find best release (prefer live releases)
        let bestRelease = null;
        let highestScore = 0;

        for (const release of recording?.releases || []) {
          let score = bestAcoustIDMatch.score * 100;

          // Boost score for live releases
          const releaseGroup = release['release-group'];
          if (releaseGroup) {
            const primaryType = releaseGroup['primary-type'];
            const secondaryTypes = releaseGroup['secondary-types'] || [];

            if (primaryType === 'Live' || secondaryTypes.includes('Live')) {
              score += 30;
            }

            // Check for live indicators in title
            const titleLower = release.title.toLowerCase();
            if (titleLower.includes('live') || titleLower.includes('concert')) {
              score += 20;
            }
          }

          if (score > highestScore) {
            highestScore = score;
            bestRelease = release;
          }
        }

        // Use the extracted title and artist with fallbacks
        const title = recordingTitle || metadata?.title || 'Unknown Track';
        const artistName = recordingArtist || metadata?.artist || 'Unknown Artist';

        // Extract performance date from relationships first (most accurate)
        let performanceDate = null;
        let venue = null;
        let city = null;
        let state = null;

        // Check for place relationships (recorded at, performed at)
        if (recording?.relations) {
          console.log('Recording has relations:', recording.relations.length);

          // Look for place relationships
          const placeRelations = recording.relations.filter(rel =>
            rel.type === 'recorded at' ||
            rel.type === 'performance' ||
            rel.place
          );

          if (placeRelations.length > 0) {
            const placeRel = placeRelations[0];
            console.log('Found place relation:', placeRel);

            // Extract date from the relationship
            if (placeRel.begin) {
              performanceDate = placeRel.begin;
              console.log('Found performance date from relationship:', performanceDate);
            } else if (placeRel.end) {
              performanceDate = placeRel.end;
            }

            // Extract venue information
            if (placeRel.place) {
              venue = placeRel.place.name;

              // Extract location from place
              if (placeRel.place.area) {
                city = placeRel.place.area.name;

                // Check for state in parent areas
                if (placeRel.place.area['area-relation-list']) {
                  const parentAreas = placeRel.place.area['area-relation-list'];
                  // Look for state-level area
                  const stateArea = parentAreas.find(a =>
                    a.area?.type === 'State' ||
                    a.area?.type === 'Province'
                  );
                  if (stateArea) {
                    state = stateArea.area.name;
                  }
                }
              }
            }
          }
        }

        // Fallback to title extraction if no relationship data
        if (!performanceDate && this.isLiveRecording(bestRelease)) {
          // Try to extract performance date and venue from release title
          const titleInfo = this.extractLiveInfoFromTitle(bestRelease?.title || '');
          if (titleInfo) {
            performanceDate = performanceDate || titleInfo.date;
            venue = venue || titleInfo.venue;
            city = city || titleInfo.city;
            state = state || titleInfo.state;
          }

          // Try to get more info from the recording disambiguation
          if (recording?.disambiguation) {
            const disambInfo = this.extractLiveInfoFromTitle(recording.disambiguation);
            if (disambInfo) {
              performanceDate = performanceDate || disambInfo.date;
              venue = venue || disambInfo.venue;
              city = city || disambInfo.city;
              state = state || disambInfo.state;
            }
          }
        }

        const result = {
          source: 'acoustid',
          confidence: bestAcoustIDMatch.score,
          recordingId: bestAcoustIDMatch.recordingId,
          releaseId: bestRelease?.id,
          title: title,
          artist: artistName,
          artists: bestAcoustIDMatch.artists || recording?.['artist-credit'],
          release: bestRelease,
          releases: recording?.releases || [], // Include all releases with their status
          album: bestRelease?.title,
          releaseDate: bestRelease?.date,
          performanceDate: performanceDate, // Add performance date
          recordingDate: performanceDate || bestRelease?.date, // Recording date fallback
          venue: venue,
          city: city,
          state: state,
          status: bestRelease?.status, // Include the status directly
          isLive: this.isLiveRecording(bestRelease),
          duration: bestAcoustIDMatch.duration || recording?.length,
          fingerprint: 'generated' // Mark that we generated a unique fingerprint
        };

        console.log('\nFinal result to return:');
        console.log('  Title:', result.title);
        console.log('  Artist:', result.artist);
        console.log('  Album:', result.album);
        console.log('  Performance Date:', result.performanceDate || 'Not found');
        console.log('  Venue:', result.venue || 'Not found');
        console.log('  City:', result.city || 'Not found');
        console.log('  State:', result.state || 'Not found');
        console.log('  Status:', result.status || 'undefined');
        console.log('  Confidence:', (result.confidence * 100).toFixed(1) + '%');
        console.log('  Recording ID:', result.recordingId);
        console.log('  Releases count:', result.releases?.length || 0);
        console.log('===== MUSICBRAINZ FINGERPRINT MATCH END (SUCCESS) =====\n');

        return result;
      }

      // For medium confidence matches, combine with metadata search
      if (bestAcoustIDMatch.score >= 0.5) {
        console.log('\nMedium confidence AcoustID match (50-80%), combining with metadata search');
        console.log('  Current best match:', bestAcoustIDMatch.title, 'at', (bestAcoustIDMatch.score * 100).toFixed(1) + '%');

        // Search by artist and title from AcoustID match
        const artistName = bestAcoustIDMatch.artists && bestAcoustIDMatch.artists[0] ? bestAcoustIDMatch.artists[0].name : null;
        const metadataMatches = await this.searchByMetadata(artistName, bestAcoustIDMatch.title, null);

        // Combine scores
        if (metadataMatches.recordings?.length > 0) {
          const combined = this.combineAcoustIDAndMetadataResults(
            bestAcoustIDMatch,
            metadataMatches.recordings[0]
          );
          return combined;
        }
      }

      // Low confidence - return AcoustID match but flag it
      return {
        source: 'acoustid-low-confidence',
        confidence: bestAcoustIDMatch.score,
        ...bestAcoustIDMatch,
        needsVerification: true
      };

    } catch (error) {
      console.error('Error in fingerprint matching:', error);
      // Fall back to metadata-only search
      return this.searchByMetadataWrapper(metadata);
    }
  }

  /**
   * Combine AcoustID and metadata search results
   */
  combineAcoustIDAndMetadataResults(acoustIDMatch, metadataMatch) {
    // Calculate combined confidence score
    const acoustIDWeight = 0.7;
    const metadataWeight = 0.3;

    const metadataScore = metadataMatch.score || 50;
    const combinedScore = (acoustIDMatch.score * 100 * acoustIDWeight) +
                         (metadataScore * metadataWeight);

    return {
      source: 'combined',
      confidence: combinedScore / 100,
      acoustIDScore: acoustIDMatch.score,
      metadataScore: metadataScore / 100,
      recordingId: acoustIDMatch.recordingId || metadataMatch.id,
      title: acoustIDMatch.title,
      artist: acoustIDMatch.artists[0]?.name,
      artists: acoustIDMatch.artists,
      releases: acoustIDMatch.releases,
      metadataMatch: metadataMatch
    };
  }

  /**
   * Check if a release is a live recording
   */
  isLiveRecording(release) {
    if (!release) return false;

    const releaseGroup = release['release-group'];
    if (releaseGroup) {
      if (releaseGroup['primary-type'] === 'Live') return true;
      if (releaseGroup['secondary-types']?.includes('Live')) return true;
    }

    // Check title for live indicators
    const titleLower = (release.title || '').toLowerCase();
    const liveIndicators = ['live', 'concert', 'bootleg', '(live)', 'in concert'];

    return liveIndicators.some(indicator => titleLower.includes(indicator));
  }

  /**
   * Fallback metadata-only search wrapper
   */
  async searchByMetadataWrapper(metadata) {
    if (!metadata.artist && !metadata.title) {
      return null;
    }

    try {
      const results = await this.searchByMetadata(metadata.artist, metadata.title, null);

      if (results.recordings?.length > 0) {
        const best = results.recordings[0];
        return {
          source: 'metadata',
          confidence: (best.score || 50) / 100,
          recordingId: best.id,
          title: best.title,
          artist: best['artist-credit']?.[0]?.artist?.name,
          releases: best.releases
        };
      }
    } catch (error) {
      console.error('Metadata search failed:', error);
    }

    return null;
  }

  /**
   * Fetch album cover from CoverArtArchive
   */
  async fetchAlbumCover(releaseId) {
    if (!releaseId) return null;

    try {
      console.log('Fetching cover art for release:', releaseId);

      // CoverArtArchive API endpoint
      const coverArtUrl = `https://coverartarchive.org/release/${releaseId}`;

      const response = await fetch(coverArtUrl);

      if (!response.ok) {
        if (response.status === 404) {
          console.log('No cover art found for release:', releaseId);
        } else {
          console.error('CoverArtArchive error:', response.status);
        }
        return null;
      }

      const data = await response.json();

      // Find the front cover
      let coverImage = data.images.find(img => img.front === true);

      // If no front cover, use the first image
      if (!coverImage && data.images.length > 0) {
        coverImage = data.images[0];
      }

      if (coverImage) {
        console.log('Found cover art:', coverImage.thumbnails?.large || coverImage.image);
        return {
          small: coverImage.thumbnails?.small || coverImage.image,
          large: coverImage.thumbnails?.large || coverImage.image,
          original: coverImage.image
        };
      }
    } catch (error) {
      console.error('Error fetching cover art:', error);
    }

    return null;
  }

  /**
   * Calculate Levenshtein distance between two strings
   */
  levenshteinDistance(str1, str2) {
    const matrix = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }
}

module.exports = MusicBrainzService;