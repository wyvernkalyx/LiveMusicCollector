const { exec } = require('child_process');
const { promisify } = require('util');
const path = require('path');
const fs = require('fs').promises;
const https = require('https');
const querystring = require('querystring');
const ChromaprintSetup = require('./chromaprintSetup');

const execPromise = promisify(exec);

class AcoustIDService {
  constructor() {
    // AcoustID API key for Live Music Collector
    // You should register your app at https://acoustid.org/new-application
    this.apiKey = process.env.ACOUSTID_API_KEY || 'asa4wLQhwJ';
    this.chromaprintSetup = new ChromaprintSetup();
    this.fpcalcPath = null;
    this.initPromise = this.init();
  }

  async init() {
    try {
      this.fpcalcPath = await this.chromaprintSetup.ensureFpcalcExists();
      console.log('AcoustID Service initialized with fpcalc at:', this.fpcalcPath);
    } catch (error) {
      console.error('Failed to initialize fpcalc:', error);
    }
  }

  async ensureInitialized() {
    await this.initPromise;
    if (!this.fpcalcPath) {
      throw new Error('fpcalc not available');
    }
  }

  /**
   * Generate audio fingerprint using fpcalc
   * @param {string} filePath - Path to audio file
   * @returns {Promise<{duration: number, fingerprint: string}>}
   */
  async generateFingerprint(filePath) {
    try {
      console.log('\n=== FINGERPRINT GENERATION START ===');
      console.log('File path:', filePath);
      console.log('File exists:', await fs.access(filePath).then(() => true).catch(() => false));

      // Ensure fpcalc is available
      await this.ensureInitialized();

      // Check if file exists
      await fs.access(filePath);

      // Use fpcalc to generate fingerprint
      const command = `"${this.fpcalcPath}" -json "${filePath}"`;
      console.log('Running command:', command);

      try {
        const { stdout, stderr } = await execPromise(command, {
          maxBuffer: 10 * 1024 * 1024 // 10MB buffer for large files
        });

        if (stderr && !stderr.includes('WARNING')) {
          console.warn('fpcalc warning:', stderr);
        }

        const result = JSON.parse(stdout);
        console.log('Fingerprint generated successfully:');
        console.log('  Duration:', result.duration, 'seconds');
        console.log('  Fingerprint hash:', result.fingerprint.substring(0, 50) + '...');
        console.log('  Fingerprint length:', result.fingerprint.length, 'characters');
        console.log('=== FINGERPRINT GENERATION END ===\n');

        return {
          duration: result.duration,
          fingerprint: result.fingerprint
        };
      } catch (error) {
        // If fpcalc fails, try to use the fallback method
        console.error('fpcalc error, trying alternative method:', error.message);

        // Try without the JSON flag as some versions don't support it
        try {
          const { stdout } = await execPromise(`"${this.fpcalcPath}" "${filePath}"`);
          const lines = stdout.trim().split('\n');
          const duration = lines.find(l => l.startsWith('DURATION='))?.split('=')[1];
          const fingerprint = lines.find(l => l.startsWith('FINGERPRINT='))?.split('=')[1];

          if (duration && fingerprint) {
            return {
              duration: parseInt(duration),
              fingerprint: fingerprint
            };
          }
        } catch (fallbackError) {
          console.error('Fallback also failed:', fallbackError.message);
        }

        // Last resort: use acoustid's built-in fingerprinting
        return this.generateFingerprintFallback(filePath);
      }
    } catch (error) {
      console.error('Error generating fingerprint:', error);
      throw error;
    }
  }

  /**
   * Fallback fingerprint generation - just throw an error
   */
  async generateFingerprintFallback(filePath) {
    throw new Error('Failed to generate fingerprint - fpcalc not available');
  }

  /**
   * Lookup track information using AcoustID
   * @param {string} fingerprint - Audio fingerprint
   * @param {number} duration - Track duration in seconds
   * @returns {Promise<Array>} - Array of matching recordings
   */
  async lookup(fingerprint, duration) {
    return new Promise((resolve, reject) => {
      console.log('\n=== ACOUSTID API LOOKUP START ===');
      console.log('Duration:', duration, 'seconds');
      console.log('Fingerprint (first 50 chars):', fingerprint.substring(0, 50) + '...');

      const params = {
        client: this.apiKey,
        meta: 'recordings releasegroups releases tracks compress',
        duration: Math.round(duration),
        fingerprint: fingerprint
      };

      const url = `https://api.acoustid.org/v2/lookup?${querystring.stringify(params)}`;
      console.log('API URL (truncated):', url.substring(0, 100) + '...');

      https.get(url, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          try {
            const results = JSON.parse(data);
            console.log('API Response Status:', results.status);
            if (results.status === 'ok') {
              console.log('Number of results:', results.results?.length || 0);
              if (results.results && results.results.length > 0) {
                console.log('First result score:', results.results[0].score);
                console.log('First result recordings:', results.results[0].recordings?.length || 0);
                if (results.results[0].recordings && results.results[0].recordings.length > 0) {
                  const firstRec = results.results[0].recordings[0];
                  console.log('First recording:', {
                    id: firstRec.id,
                    title: firstRec.title,
                    artists: firstRec.artists?.map(a => a.name).join(', ')
                  });
                }
              }
              console.log('=== ACOUSTID API LOOKUP END ===\n');
              resolve(this.parseResults(results));
            } else {
              console.error('API Error:', results.error);
              console.log('=== ACOUSTID API LOOKUP END (ERROR) ===\n');
              reject(new Error(results.error?.message || 'AcoustID lookup failed'));
            }
          } catch (error) {
            console.error('Parse error:', error);
            console.log('=== ACOUSTID API LOOKUP END (PARSE ERROR) ===\n');
            reject(error);
          }
        });
      }).on('error', (err) => {
        console.error('AcoustID lookup error:', err);
        reject(err);
      });
    });
  }

  /**
   * Parse AcoustID results into a more usable format
   */
  parseResults(results) {
    if (!results || !results.results || results.results.length === 0) {
      return [];
    }

    const matches = [];

    for (const result of results.results) {
      if (!result.recordings) continue;

      for (const recording of result.recordings) {
        const match = {
          score: result.score,
          recordingId: recording.id,
          title: recording.title,
          artists: recording.artists ? recording.artists.map(a => ({
            id: a.id,
            name: a.name
          })) : [],
          duration: recording.duration,
          releases: []
        };

        // Add release information
        if (recording.releasegroups) {
          for (const releasegroup of recording.releasegroups) {
            if (releasegroup.releases) {
              for (const release of releasegroup.releases) {
                match.releases.push({
                  id: release.id,
                  title: releasegroup.title,
                  type: releasegroup.type,
                  date: release.date,
                  country: release.country,
                  trackCount: release.track_count,
                  mediumCount: release.medium_count
                });
              }
            }
          }
        }

        matches.push(match);
      }
    }

    // Sort by score (highest first) and remove duplicates
    matches.sort((a, b) => b.score - a.score);

    // Remove duplicate recordings
    const seen = new Set();
    return matches.filter(match => {
      if (seen.has(match.recordingId)) {
        return false;
      }
      seen.add(match.recordingId);
      return true;
    });
  }

  /**
   * Find matches for an audio file
   * @param {string} filePath - Path to audio file
   * @returns {Promise<Array>} - Array of potential matches
   */
  async findMatches(filePath) {
    try {
      console.log(`\n>>> FINDING MATCHES FOR FILE: ${filePath}`);
      const fileName = filePath.split(/[\\/]/).pop();
      console.log(`File name: ${fileName}`);

      const { duration, fingerprint } = await this.generateFingerprint(filePath);

      const matches = await this.lookup(fingerprint, duration);

      console.log(`\n>>> MATCH RESULTS FOR ${fileName}:`);
      console.log(`Total matches found: ${matches.length}`);
      if (matches.length > 0) {
        console.log('Top 3 matches:');
        matches.slice(0, 3).forEach((match, i) => {
          console.log(`  ${i + 1}. "${match.title}" by ${match.artists.map(a => a.name).join(', ')}`);
          console.log(`     Score: ${(match.score * 100).toFixed(1)}%, Recording ID: ${match.recordingId}`);
        });
      }
      console.log('<<< END MATCH RESULTS\n');

      return matches;
    } catch (error) {
      console.error('Error finding matches:', error);
      return [];
    }
  }

  /**
   * Enhanced match scoring for live recordings
   * Prioritizes live albums and recordings
   */
  scoreForLiveRecording(match) {
    let score = match.score * 100; // Base score from AcoustID

    // Boost score for live releases
    for (const release of match.releases) {
      if (release.type === 'Live' || release.type === 'Album + Live') {
        score += 20;
      }

      // Check if title contains live indicators
      const liveIndicators = ['live', 'concert', 'bootleg', 'audience', 'soundboard'];
      const titleLower = release.title.toLowerCase();
      for (const indicator of liveIndicators) {
        if (titleLower.includes(indicator)) {
          score += 10;
          break;
        }
      }
    }

    return score;
  }

  /**
   * Get best match for a live recording
   */
  async getBestLiveMatch(filePath) {
    const matches = await this.findMatches(filePath);

    if (matches.length === 0) {
      return null;
    }

    // Score matches for live recordings
    const scoredMatches = matches.map(match => ({
      ...match,
      liveScore: this.scoreForLiveRecording(match)
    }));

    // Sort by live score
    scoredMatches.sort((a, b) => b.liveScore - a.liveScore);

    // Return best match if confidence is high enough
    const bestMatch = scoredMatches[0];
    if (bestMatch.score >= 0.5) { // 50% confidence threshold
      return bestMatch;
    }

    return null;
  }
}

module.exports = AcoustIDService;