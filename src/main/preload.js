const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('api', {
  // App info
  getVersion: () => ipcRenderer.invoke('app:getVersion'),

  // File operations
  openDirectory: () => ipcRenderer.invoke('dialog:openDirectory'),
  openFiles: () => ipcRenderer.invoke('dialog:openFiles'),

  // Import operations
  analyzeFiles: (filePaths) => ipcRenderer.invoke('import:analyzeFiles', filePaths),
  scanFolder: (folderPath, options) => ipcRenderer.invoke('import:scanFolder', folderPath, options),
  processFiles: (files, options) => ipcRenderer.invoke('import:processFiles', files, options),
  onImportProgress: (callback) => {
    ipcRenderer.on('import:progress', (event, progress) => callback(progress));
  },
  onScanProgress: (callback) => {
    ipcRenderer.on('scan:progress', (event, progress) => callback(progress));
  },

  // Database operations
  searchShows: (query, filters) => ipcRenderer.invoke('db:searchShows', query, filters),
  searchTracks: (songTitle) => ipcRenderer.invoke('db:searchTracks', songTitle),
  rebuildSearchIndex: () => ipcRenderer.invoke('db:rebuildSearchIndex'),
  fixTrackDurations: () => ipcRenderer.invoke('db:fixTrackDurations'),
  getShow: (showId) => ipcRenderer.invoke('db:getShow', showId),
  getShowsByYear: (year) => ipcRenderer.invoke('db:getShowsByYear', year),
  getAllShows: () => ipcRenderer.invoke('db:getAllShows'),
  getYearStats: () => ipcRenderer.invoke('db:getYearStats'),
  findShowsStartingWith: (songTitle) => ipcRenderer.invoke('db:findShowsStartingWith', songTitle),
  findSongOrder: (song1, song2, options) => ipcRenderer.invoke('db:findSongOrder', song1, song2, options),
  compareRecordings: (date) => ipcRenderer.invoke('db:compareRecordings', date),
  clearDatabase: () => ipcRenderer.invoke('db:clearAll'),
  bulkUpdateShows: (updates) => ipcRenderer.invoke('db:bulkUpdateShows', updates),

  // Verification status operations
  markShowAsVerified: (showId, notes) => ipcRenderer.invoke('db:markShowAsVerified', showId, notes),
  markShowForReview: (showId, notes) => ipcRenderer.invoke('db:markShowForReview', showId, notes),
  clearShowVerification: (showId) => ipcRenderer.invoke('db:clearShowVerification', showId),
  getShowVerificationStatus: (showId) => ipcRenderer.invoke('db:getShowVerificationStatus', showId),
  getUnverifiedShows: () => ipcRenderer.invoke('db:getUnverifiedShows'),
  getShowsNeedingReview: () => ipcRenderer.invoke('db:getShowsNeedingReview'),

  // Track management operations
  getAllTracks: () => ipcRenderer.invoke('db:getAllTracks'),
  getTracksByShow: (showId) => ipcRenderer.invoke('db:getTracksByShow', showId),
  bulkUpdateTracks: (trackIds, metadata) => ipcRenderer.invoke('db:bulkUpdateTracks', trackIds, metadata),
  updateTrack: (trackId, updates) => ipcRenderer.invoke('db:updateTrack', trackId, updates),

  // Player operations
  getTrackPath: (trackId) => ipcRenderer.invoke('player:getTrackPath', trackId),
  getTrack: (trackId) => ipcRenderer.invoke('player:getTrack', trackId),

  // Settings
  getSettings: (key) => ipcRenderer.invoke('settings:get', key),
  setSettings: (key, value) => ipcRenderer.invoke('settings:set', key, value),
  getAllSettings: () => ipcRenderer.invoke('settings:getAll'),

  // Archive.org data lookup
  searchArchive: (date, venue) => ipcRenderer.invoke('lookup:searchArchive', date, venue),
  getArchiveDetails: (identifier) => ipcRenderer.invoke('lookup:getArchiveDetails', identifier),
  getSetlist: (date) => ipcRenderer.invoke('lookup:getSetlist', date),
  findBestMatch: (date, venue, sourceType) => ipcRenderer.invoke('lookup:findBestMatch', date, venue, sourceType),

  // Audio operations
  checkAudioFile: (filePath) => ipcRenderer.invoke('audio:checkFile', filePath),
  getAudioFileUrl: (filePath) => ipcRenderer.invoke('audio:getFileUrl', filePath),

  // File metadata operations
  getFileMetadata: (filePath) => ipcRenderer.invoke('file:getMetadata', filePath),

  // MusicBrainz API
  invoke: (channel, ...args) => {
    // Allow only specific channels for security
    const validChannels = ['musicbrainz:search', 'musicbrainz:fingerprint', 'musicbrainz:fetchCover', 'file:getMetadata', 'audio:checkFile', 'audio:getFileUrl'];
    if (validChannels.includes(channel)) {
      return ipcRenderer.invoke(channel, ...args);
    }
    throw new Error(`Invalid channel: ${channel}`);
  },
});