const MusicBrainzApi = require('musicbrainz-api').MusicBrainzApi;
const CoverArtArchiveApi = require('musicbrainz-api').CoverArtArchiveApi;
const { exec } = require('child_process');
const { promisify } = require('util');
const path = require('path');
const fs = require('fs').promises;
const https = require('https');

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
      releases: officialReleases.map(r => ({
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

            // If still no date and it's not a live track, use the release date
            if (!trackDate && !isLiveTrack && release.date) {
              trackDate = release.date;
            }

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
    const releaseGroup = release['release-group'];
    const originalReleaseDate = releaseGroup?.['first-release-date'] || release.date;

    return {
      id: release.id,
      title: release.title,
      artist: release['artist-credit']?.[0]?.artist?.name,
      date: release.date,
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
      isLive: releaseGroup?.['secondary-types']?.includes('Live'),
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