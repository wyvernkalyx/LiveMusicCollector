/**
 * Format duration from seconds to MM:SS or HH:MM:SS format
 * @param {number} seconds - Duration in seconds
 * @returns {string} Formatted duration string
 */
export function formatDuration(seconds) {
  if (!seconds || seconds === 0) {
    return '--:--';
  }

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Format duration from milliseconds to MM:SS or HH:MM:SS format
 * @param {number} milliseconds - Duration in milliseconds
 * @returns {string} Formatted duration string
 */
export function formatDurationMs(milliseconds) {
  if (!milliseconds || milliseconds === 0) {
    return '--:--';
  }

  return formatDuration(Math.floor(milliseconds / 1000));
}

/**
 * Parse duration string (MM:SS or HH:MM:SS) to seconds
 * @param {string} durationStr - Duration string
 * @returns {number} Duration in seconds
 */
export function parseDuration(durationStr) {
  if (!durationStr || durationStr === '--:--') {
    return 0;
  }

  const parts = durationStr.split(':').map(p => parseInt(p, 10));

  if (parts.length === 3) {
    // HH:MM:SS
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  } else if (parts.length === 2) {
    // MM:SS
    return parts[0] * 60 + parts[1];
  }

  return 0;
}

/**
 * Format total duration for multiple tracks
 * @param {Array} tracks - Array of tracks with duration property
 * @returns {string} Formatted total duration
 */
export function formatTotalDuration(tracks) {
  if (!tracks || tracks.length === 0) {
    return '--:--';
  }

  const totalSeconds = tracks.reduce((sum, track) => {
    return sum + (track.duration || 0);
  }, 0);

  return formatDuration(totalSeconds);
}