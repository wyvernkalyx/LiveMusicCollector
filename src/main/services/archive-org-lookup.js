const axios = require('axios');

class ArchiveOrgLookup {
  constructor() {
    this.baseUrl = 'https://archive.org';
    this.cache = new Map();
  }

  /**
   * Search Archive.org for Grateful Dead shows
   * @param {string} date - Date in yyyy-mm-dd format
   * @param {string} venue - Optional venue name
   * @returns {Promise<Array>} - Array of matching shows
   */
  async searchShows(date, venue = '') {
    const cacheKey = `${date}-${venue}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      // Build query for Archive.org
      let query = `collection:GratefulDead AND date:${date}`;
      if (venue) {
        query += ` AND venue:"${venue}"`;
      }

      const url = `${this.baseUrl}/advancedsearch.php`;
      const params = {
        q: query,
        fl: 'identifier,title,date,venue,coverage,source,transferer,taper,lineage,description,avg_rating,num_reviews',
        rows: 50,
        output: 'json',
        sort: 'avg_rating desc'
      };

      console.log('Searching Archive.org:', params);
      const response = await axios.get(url, { params });

      if (response.data && response.data.response) {
        const results = response.data.response.docs.map(doc => this.parseArchiveShow(doc));
        this.cache.set(cacheKey, results);
        return results;
      }

      return [];
    } catch (error) {
      console.error('Archive.org search error:', error);
      return [];
    }
  }

  /**
   * Get detailed information about a specific Archive.org item
   * @param {string} identifier - Archive.org identifier
   * @returns {Promise<Object>} - Detailed show information
   */
  async getShowDetails(identifier) {
    if (this.cache.has(identifier)) {
      return this.cache.get(identifier);
    }

    try {
      const url = `${this.baseUrl}/metadata/${identifier}`;
      console.log('Fetching details from Archive.org:', identifier);

      const response = await axios.get(url);

      if (response.data) {
        const details = this.parseDetailedShow(response.data);
        this.cache.set(identifier, details);
        return details;
      }

      return null;
    } catch (error) {
      console.error('Archive.org details error:', error);
      return null;
    }
  }

  /**
   * Search for setlist information
   * @param {string} date - Date in yyyy-mm-dd format
   * @returns {Promise<Array>} - Array of songs/setlist
   */
  async getSetlist(date) {
    try {
      // Search for shows on this date
      const shows = await this.searchShows(date);

      if (shows.length > 0) {
        // Get the highest rated show's details
        const bestShow = shows[0];
        const details = await this.getShowDetails(bestShow.identifier);

        if (details && details.tracks) {
          return details.tracks;
        }
      }

      return [];
    } catch (error) {
      console.error('Error fetching setlist:', error);
      return [];
    }
  }

  /**
   * Parse Archive.org show document
   */
  parseArchiveShow(doc) {
    return {
      identifier: doc.identifier,
      title: doc.title,
      date: doc.date,
      venue: doc.venue || doc.coverage,
      source: doc.source,
      taper: doc.taper,
      transferer: doc.transferer,
      lineage: doc.lineage,
      description: doc.description,
      rating: doc.avg_rating ? parseFloat(doc.avg_rating) : null,
      reviews: doc.num_reviews || 0
    };
  }

  /**
   * Parse detailed show information
   */
  parseDetailedShow(data) {
    const metadata = data.metadata;
    const files = data.files || [];

    // Extract audio files and build track list
    const audioFiles = files.filter(f =>
      f.format && (
        f.format.includes('Flac') ||
        f.format.includes('MP3') ||
        f.format.includes('Ogg')
      ) && !f.name.includes('_vbr')
    );

    const tracks = audioFiles.map((file, index) => {
      // Clean up track title from filename
      let title = file.title || file.name;
      title = title
        .replace(/^\d+[\s\-_]+/, '') // Remove track numbers
        .replace(/\.(flac|mp3|ogg|shn)$/i, '') // Remove extensions
        .replace(/_/g, ' ') // Replace underscores with spaces
        .replace(/\s+/g, ' ') // Normalize spaces
        .trim();

      return {
        track_number: index + 1,
        title: title,
        filename: file.name,
        duration: file.length ? this.parseLength(file.length) : null,
        size: file.size,
        format: file.format
      };
    });

    return {
      identifier: metadata.identifier?.[0],
      date: metadata.date?.[0],
      venue: metadata.venue?.[0] || metadata.coverage?.[0],
      city: metadata.coverage?.[0]?.split(',')[0],
      state: metadata.coverage?.[0]?.split(',')[1]?.trim(),
      source: metadata.source?.[0],
      lineage: metadata.lineage?.[0],
      taper: metadata.taper?.[0],
      transferer: metadata.transferer?.[0],
      description: metadata.description?.[0],
      notes: metadata.notes?.[0],
      tracks: tracks,
      year: metadata.year?.[0],
      collection: metadata.collection,
      publicdate: metadata.publicdate?.[0],
      addeddate: metadata.addeddate?.[0],
      runtime: metadata.runtime?.[0]
    };
  }

  /**
   * Parse duration string (HH:MM:SS or MM:SS) to seconds
   */
  parseLength(length) {
    if (!length) return null;

    const parts = length.split(':').map(p => parseInt(p, 10));

    if (parts.length === 3) {
      // HH:MM:SS
      return parts[0] * 3600 + parts[1] * 60 + parts[2];
    } else if (parts.length === 2) {
      // MM:SS
      return parts[0] * 60 + parts[1];
    }

    return null;
  }

  /**
   * Find best match for a local show in Archive.org
   */
  async findBestMatch(date, venue, sourceType) {
    const shows = await this.searchShows(date, venue);

    if (shows.length === 0) {
      return null;
    }

    // Score each show based on matching criteria
    const scoredShows = shows.map(show => {
      let score = 0;

      // Date match (should always match from search)
      if (show.date === date) score += 10;

      // Venue match
      if (venue && show.venue) {
        const venueMatch = show.venue.toLowerCase().includes(venue.toLowerCase()) ||
                          venue.toLowerCase().includes(show.venue.toLowerCase());
        if (venueMatch) score += 5;
      }

      // Source type match
      if (sourceType && show.source) {
        if (show.source.toLowerCase().includes(sourceType.toLowerCase())) {
          score += 3;
        }
      }

      // Rating bonus
      if (show.rating) {
        score += show.rating;
      }

      return { ...show, matchScore: score };
    });

    // Sort by score and return best match
    scoredShows.sort((a, b) => b.matchScore - a.matchScore);
    return scoredShows[0];
  }

  /**
   * Clear the cache
   */
  clearCache() {
    this.cache.clear();
  }
}

module.exports = ArchiveOrgLookup;