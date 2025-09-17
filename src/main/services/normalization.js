class NormalizationService {
  constructor(database) {
    this.db = database;
    this.abbreviations = {
      'GDTRFB': 'Going Down the Road Feeling Bad',
      'NFA': 'Not Fade Away',
      'TLEO': 'They Love Each Other',
      'FOTM': 'Fire on the Mountain',
      'SOTM': 'Sugar Magnolia',
      'SSDD': 'Sunshine Daydream',
      'BEW': 'Black-Throated Wind',
      'BIODTL': 'Beat It On Down the Line',
      'CC': 'Cold Rain and Snow',
      'GSET': 'Greatest Story Ever Told',
      'IKYR': 'I Know You Rider',
      'OMSN': 'Old Man Sunshine Nightfall',
      'PITB': 'Playing in the Band',
      'TOO': 'The Other One',
      'WRS': 'Weather Report Suite'
    };
  }

  async normalizeRecording(recordingId) {
    const tracks = await this.db.getRecordingTracks(recordingId);

    for (const track of tracks) {
      // Handle cases where song_title might be undefined
      const songTitle = track.song_title || 'Unknown Track';
      const normalizedTitle = this.normalizeSongTitle(songTitle);

      const songId = await this.findOrCreateSong(normalizedTitle, songTitle);

      await this.db.updateTrackSong(track.id, songId);

      if (this.detectSegue(track, tracks)) {
        await this.db.updateTrackSegue(track.id, '>');
      }
    }

    await this.detectAndMarkSets(recordingId, tracks);
  }

  normalizeSongTitle(title) {
    if (!title) return 'Unknown';

    let normalized = title.trim();

    for (const [abbr, full] of Object.entries(this.abbreviations)) {
      const regex = new RegExp(`\\b${abbr}\\b`, 'gi');
      normalized = normalized.replace(regex, full);
    }

    normalized = normalized.replace(/\s+/g, ' ');

    normalized = normalized.replace(/[^\w\s'-]/g, '');

    normalized = this.titleCase(normalized);

    return normalized;
  }

  titleCase(str) {
    const exceptions = ['and', 'or', 'the', 'in', 'on', 'at', 'to', 'for', 'of', 'a', 'an'];

    return str.toLowerCase().split(' ').map((word, index) => {
      if (index === 0 || !exceptions.includes(word)) {
        return word.charAt(0).toUpperCase() + word.slice(1);
      }
      return word;
    }).join(' ');
  }

  detectSegue(track, allTracks) {
    const nextTrack = allTracks.find(t => t.track_number === track.track_number + 1);

    if (!nextTrack) return false;

    const indicators = ['>', '->', '=>', 'segue', 'jam'];

    const titleLower = (track.song_title || '').toLowerCase();
    return indicators.some(indicator => titleLower.includes(indicator));
  }

  async detectAndMarkSets(recordingId, tracks) {
    const setBreaks = this.identifySetBreaks(tracks);

    let setNumber = 1;
    let startTrack = 1;

    for (const breakPoint of setBreaks) {
      await this.db.createSet(recordingId, setNumber, startTrack, breakPoint - 1);
      setNumber++;
      startTrack = breakPoint;
    }

    if (tracks.length > 0) {
      await this.db.createSet(recordingId, setNumber, startTrack, tracks.length);
    }
  }

  identifySetBreaks(tracks) {
    const breaks = [];
    const typicalSetBreakSongs = ['Drums', 'Space', 'Drum Solo', 'Bass Solo'];

    for (let i = 1; i < tracks.length - 1; i++) {
      const prevTrack = tracks[i - 1];
      const currentTrack = tracks[i];
      const nextTrack = tracks[i + 1];

      if (prevTrack && currentTrack) {
        const timeDiff = (currentTrack.start_time || 0) - (prevTrack.end_time || 0);
        if (timeDiff > 900) {
          breaks.push(i + 1);
          continue;
        }
      }

      const currentTitle = (currentTrack.song_title || '').toLowerCase();
      if (typicalSetBreakSongs.some(song => currentTitle.includes(song.toLowerCase()))) {
        if (!typicalSetBreakSongs.some(song => (nextTrack?.song_title || '').toLowerCase().includes(song.toLowerCase()))) {
          breaks.push(i + 2);
        }
      }
    }

    return breaks;
  }

  async findOrCreateSong(normalizedTitle, originalTitle) {
    const bandId = 1;

    // Handle undefined or null titles
    if (!originalTitle) {
      originalTitle = 'Unknown Track';
    }
    if (!normalizedTitle) {
      normalizedTitle = this.normalizeSongTitle(originalTitle);
    }

    const existing = await this.db.getAsync(
      `SELECT * FROM songs WHERE normalized_title = ? AND band_id = ?`,
      [normalizedTitle, bandId]
    );
    if (existing) return existing.id;

    const abbreviations = this.findAbbreviations(originalTitle);

    return await this.db.createSong(
      bandId,
      originalTitle,
      normalizedTitle,
      JSON.stringify(abbreviations)
    );
  }

  findAbbreviations(title) {
    const found = [];

    for (const [abbr, full] of Object.entries(this.abbreviations)) {
      const regex = new RegExp(`\\b${abbr}\\b`, 'gi');
      if (regex.test(title)) {
        found.push(abbr);
      }
    }

    return found;
  }

  async normalizeVenue(venueName, city, state) {
    if (!venueName) return null;

    let normalized = venueName.trim();

    normalized = normalized.replace(/\s+/g, ' ');

    const patterns = [
      /^The\s+/i,
      /\s+(Arena|Stadium|Theatre|Theater|Auditorium|Ballroom|Pavilion|Center|Centre)$/i
    ];

    for (const pattern of patterns) {
      normalized = normalized.replace(pattern, '');
    }

    return this.titleCase(normalized);
  }

  parseVenueFromFilename(filename) {
    const pattern = /\d{4}-\d{2}-\d{2}\s+-\s+([^-]+),\s*([^,]+),\s*(\w{2})/;
    const match = filename.match(pattern);

    if (match) {
      return {
        venue: match[1].trim(),
        city: match[2].trim(),
        state: match[3].trim()
      };
    }

    return null;
  }
}

module.exports = NormalizationService;