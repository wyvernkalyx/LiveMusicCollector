const { app, BrowserWindow, ipcMain, dialog, protocol, net } = require('electron');
const path = require('path');
const fs = require('fs');

// Import services
const DatabaseService = require('./services/database');
const ImportService = require('./services/import');
const NormalizationService = require('./services/normalization');
const FolderScanner = require('./services/folder-scanner');
const ArchiveOrgLookup = require('./services/archive-org-lookup');
const MusicBrainzService = require('./services/musicBrainzService');
const MetadataExtractor = require('./services/metadata-extractor');

let mainWindow;
let db;

// Suppress SQLite duplicate column errors
process.on('uncaughtException', (error) => {
  if (error.message && error.message.includes('duplicate column')) {
    // Silently ignore duplicate column errors
    return;
  }
  // Log other errors but don't crash
  console.error('Uncaught exception:', error);
});

process.on('unhandledRejection', (error) => {
  if (error && error.message && error.message.includes('duplicate column')) {
    // Silently ignore duplicate column errors
    return;
  }
  // Log other errors
  console.error('Unhandled rejection:', error);
});

// Register custom protocol for audio streaming
const { protocol: electronProtocol } = require('electron');

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 768,
    backgroundColor: '#121212', // Dark mode background
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: false, // Allow loading local files
      allowRunningInsecureContent: true
    },
    icon: path.join(__dirname, '../../public/icon.png'),
    titleBarStyle: 'hiddenInset',
    frame: process.platform !== 'darwin'
  });

  // Load the app
  const isDev = !app.isPackaged;

  if (isDev) {
    // In development, load from Vite dev server
    const loadDevServer = async () => {
      // Start with 5182 since that's the port commonly in use
      const ports = [5182, 5181, 5180, 5179, 5178, 5177, 5176, 5175, 5174, 5173];

      for (const port of ports) {
        try {
          console.log(`Trying to connect to Vite on port ${port}...`);
          await mainWindow.loadURL(`http://localhost:${port}`);
          console.log(`Connected to Vite dev server on port ${port}`);
          return;
        } catch (err) {
          // Continue to next port
        }
      }

      console.log('Failed to connect to Vite dev server on any port. Retrying...');
      setTimeout(loadDevServer, 3000);
    };

    await loadDevServer();
    mainWindow.webContents.openDevTools();
  } else {
    // In production, load the built files
    mainWindow.loadFile(path.join(__dirname, '../../dist/index.html'));
  }

  // Handle file drops
  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (url.startsWith('file://')) {
      event.preventDefault();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Create a simple HTTP server to serve audio files
const http = require('http');
const { parse: parseUrl } = require('url');
let audioServer;

function createAudioServer() {
  audioServer = http.createServer((req, res) => {
    const parsedUrl = parseUrl(req.url, true);
    const filePath = decodeURIComponent(parsedUrl.query.path || '');

    console.log('Audio server request for:', filePath);

    if (!filePath || !fs.existsSync(filePath)) {
      res.writeHead(404);
      res.end('File not found');
      return;
    }

    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;

    // Get MIME type based on extension
    const ext = path.extname(filePath).toLowerCase();
    let mimeType = 'audio/mpeg'; // default
    if (ext === '.flac') mimeType = 'audio/flac';
    else if (ext === '.mp3') mimeType = 'audio/mpeg';
    else if (ext === '.m4a') mimeType = 'audio/mp4';
    else if (ext === '.wav') mimeType = 'audio/wav';
    else if (ext === '.ogg') mimeType = 'audio/ogg';

    if (range) {
      // Support range requests for seeking
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = (end - start) + 1;
      const file = fs.createReadStream(filePath, { start, end });
      const head = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': mimeType,
        'Access-Control-Allow-Origin': '*'
      };
      res.writeHead(206, head);
      file.pipe(res);
    } else {
      const head = {
        'Content-Length': fileSize,
        'Content-Type': mimeType,
        'Access-Control-Allow-Origin': '*'
      };
      res.writeHead(200, head);
      fs.createReadStream(filePath).pipe(res);
    }
  });

  audioServer.listen(0, '127.0.0.1', () => {
    const port = audioServer.address().port;
    console.log(`Audio server listening on http://127.0.0.1:${port}`);
    // Store the port for later use
    global.audioServerPort = port;
  });
}

// App event handlers
app.whenReady().then(async () => {
  // Create audio server
  createAudioServer();

  // Initialize database
  db = new DatabaseService();
  await db.initialize();

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (audioServer) {
    audioServer.close();
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC Handlers
ipcMain.handle('app:getVersion', () => app.getVersion());

// File operations
ipcMain.handle('dialog:openDirectory', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory']
  });
  return result;
});

ipcMain.handle('dialog:openFiles', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile', 'multiSelections'],
    filters: [
      { name: 'Audio Files', extensions: ['flac', 'mp3', 'wav', 'alac', 'm4a'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  });
  return result;
});

// Import operations
ipcMain.handle('import:analyzeFiles', async (event, filePaths) => {
  const importService = new ImportService(db);
  return await importService.analyzeFiles(filePaths);
});

// Folder scanning
ipcMain.handle('import:scanFolder', async (event, folderPath, options) => {
  const scanner = new FolderScanner(db);

  // Scan folder for audio files
  const audioFiles = await scanner.scanFolder(folderPath, {
    ...options,
    progressCallback: (progress) => {
      mainWindow.webContents.send('scan:progress', progress);
    }
  });

  // Organize by show/album
  const shows = scanner.organizeByShow(audioFiles);

  return {
    files: audioFiles,
    shows: shows,
    totalSize: audioFiles.reduce((sum, f) => sum + f.size, 0)
  };
});

ipcMain.handle('import:processFiles', async (event, files, options) => {
  const importService = new ImportService(db);
  const normalizationService = new NormalizationService(db);
  const OfficialReleaseDetector = require('./services/officialReleases');
  const releaseDetector = new OfficialReleaseDetector();

  // Check if user marked this as an official release or if we can detect it
  let officialRelease = null;
  let officialAlbumName = null;

  // First, analyze all files to get metadata
  console.log(`Analyzing ${files.length} files for import...`);
  const analyzedFiles = [];
  for (const file of files) {
    if (file.path) {
      const analyzed = await importService.analyzeFiles([file.path]);
      if (analyzed && analyzed.length > 0) {
        const fileData = { ...file, ...analyzed[0] };
        console.log(`Analyzed file: ${path.basename(file.path)}, album: ${fileData.album}`);
        analyzedFiles.push(fileData);
      }
    }
  }

  if (options.isOfficialRelease) {
    console.log('User marked import as official release');
    // Get album name from first file's metadata or use most common album name
    const albumNames = analyzedFiles.map(f => f.album).filter(Boolean);
    if (albumNames.length > 0) {
      // Use the most common album name in case there are slight variations
      const albumCounts = {};
      albumNames.forEach(name => {
        albumCounts[name] = (albumCounts[name] || 0) + 1;
      });
      officialAlbumName = Object.keys(albumCounts).reduce((a, b) =>
        albumCounts[a] > albumCounts[b] ? a : b
      );

      officialRelease = {
        matched: true,
        release: { name: officialAlbumName },
        userMarked: true
      };
      console.log(`Official release album: ${officialAlbumName}`);
    }
  } else {
    // Try automatic detection using folder-based detection
    const filePaths = files.filter(f => f.path).map(f => f.path);
    const folderMatch = await releaseDetector.detectOfficialReleaseFromFolder(filePaths, analyzedFiles);

    if (folderMatch && folderMatch.matched) {
      console.log(`Detected official release: ${folderMatch.release.name}`);
      officialRelease = folderMatch;
      officialAlbumName = folderMatch.release.name;
    } else {
      // Fallback: Check if majority of files have the same album name
      const albumNames = analyzedFiles.map(f => f.album).filter(Boolean);
      if (albumNames.length > files.length * 0.8) { // 80% have album metadata
        const albumCounts = {};
        albumNames.forEach(name => {
          albumCounts[name] = (albumCounts[name] || 0) + 1;
        });
        const mostCommon = Object.keys(albumCounts).reduce((a, b) =>
          albumCounts[a] > albumCounts[b] ? a : b
        );

        // If majority share the same album, treat as official release
        if (albumCounts[mostCommon] > files.length * 0.8) {
          // Check if it matches known patterns
          if (mostCommon.includes('Anniversary') || mostCommon.includes('Picks') ||
              mostCommon.includes('Box Set') || mostCommon.includes('Blues for Allah')) {
            officialAlbumName = mostCommon;
            officialRelease = {
              matched: true,
              release: { name: officialAlbumName },
              autoDetected: true
            };
            console.log(`Auto-detected official release by album consistency: ${officialAlbumName}`);
          }
        }
      }
    }
  }

  // Process imports with progress updates
  const results = [];
  for (let i = 0; i < files.length; i++) {
    const file = files[i];

    // Send progress update
    mainWindow.webContents.send('import:progress', {
      current: i + 1,
      total: files.length,
      file: file.path || file.name
    });

    try {
      // Process file - make sure we have a valid path
      if (!file.path) {
        console.error('No path provided for file:', file);
        results.push({ error: 'No file path provided', file: file.name });
        continue;
      }

      // Check if the file exists
      const fs = require('fs');
      if (!fs.existsSync(file.path)) {
        console.error('File does not exist:', file.path);
        results.push({ error: 'File not found', file: file.path });
        continue;
      }

      // Use pre-analyzed metadata
      let fileWithMetadata = analyzedFiles.find(af => af.path === file.path) || file;
      console.log('Processing file with metadata:', fileWithMetadata.path);
      console.log('Initial album:', fileWithMetadata.album);

      // If this is an official release, ensure consistent album naming for ALL files
      if (officialRelease && officialAlbumName) {
        fileWithMetadata.officialRelease = officialRelease;
        fileWithMetadata.album = officialAlbumName; // Use the SAME album name for all files
        fileWithMetadata.isOfficialRelease = true;
        // Force all files to stay in the same folder
        options.folderName = officialAlbumName;
        options.isOfficialRelease = true;
        console.log(`Processing as official release track: ${officialAlbumName}`);
      } else if (fileWithMetadata.album && !officialAlbumName) {
        // Check if individual file has album that indicates official release
        const albumPatterns = ['Anniversary', 'Picks', 'Box Set', 'Remaster', 'Blues for Allah'];
        if (albumPatterns.some(p => fileWithMetadata.album.includes(p))) {
          officialAlbumName = fileWithMetadata.album;
          officialRelease = {
            matched: true,
            release: { name: officialAlbumName },
            autoDetected: true
          };
          fileWithMetadata.isOfficialRelease = true;
          options.folderName = officialAlbumName;
          options.isOfficialRelease = true;
          console.log(`Late detection of official release: ${officialAlbumName}`);
        }
      }

      // Import the file with consistent metadata
      const imported = await importService.importFile(fileWithMetadata, options);
      if (options.autoNormalize && imported.id) {
        await normalizationService.normalizeRecording(imported.id);
      }

      results.push(imported);
    } catch (error) {
      console.error('Error importing file:', error);
      results.push({ error: error.message, file: file.path });
    }
  }

  return results;
});

// Database queries
ipcMain.handle('db:searchShows', async (event, query, filters) => {
  return await db.searchShows(query, filters);
});

ipcMain.handle('db:searchTracks', async (event, songTitle) => {
  return await db.searchTracks(songTitle);
});

ipcMain.handle('db:rebuildSearchIndex', async () => {
  return await db.rebuildSearchIndex();
});

ipcMain.handle('db:fixTrackDurations', async () => {
  const MetadataExtractor = require('./services/metadata-extractor');
  const extractor = new MetadataExtractor();

  try {
    const tracks = await db.getTracksWithNoDuration();
    console.log(`Found ${tracks.length} tracks with no duration`);

    let fixed = 0;
    for (const track of tracks) {
      try {
        const duration = await extractor.getDurationFallback(track.file_path);
        if (duration && duration > 0) {
          await db.updateTrackDuration(track.id, duration);
          fixed++;
          console.log(`Fixed duration for track ${track.id}: ${duration} seconds`);
        }
      } catch (error) {
        console.error(`Error fixing track ${track.id}:`, error);
      }
    }

    return { total: tracks.length, fixed };
  } catch (error) {
    console.error('Error fixing track durations:', error);
    throw error;
  }
});

ipcMain.handle('db:getShow', async (event, showId) => {
  return await db.getShow(showId);
});

ipcMain.handle('db:getShowsByYear', async (event, year) => {
  return await db.getShowsByYear(year);
});

ipcMain.handle('db:getAllShows', async () => {
  const shows = await db.getAllShows();
  console.log(`getAllShows returned ${shows.length} shows`);

  // Also log raw counts for debugging
  const showCount = await db.getAsync('SELECT COUNT(*) as count FROM shows');
  const recordingCount = await db.getAsync('SELECT COUNT(*) as count FROM recordings');
  const trackCount = await db.getAsync('SELECT COUNT(*) as count FROM tracks');

  console.log('Database counts:', {
    shows: showCount?.count,
    recordings: recordingCount?.count,
    tracks: trackCount?.count
  });

  if (shows.length === 0 && showCount?.count > 0) {
    // There are shows but the query isn't returning them
    console.log('Shows exist but getAllShows query is not returning them');

    // Try a simpler query
    const simpleShows = await db.allAsync('SELECT * FROM shows LIMIT 5');
    console.log('Simple query results:', simpleShows);
  }

  return shows;
});

ipcMain.handle('db:getYearStats', async () => {
  return await db.getYearStats();
});

// Advanced search queries
ipcMain.handle('db:findShowsStartingWith', async (event, songTitle) => {
  return await db.findShowsStartingWith(songTitle);
});

ipcMain.handle('db:findSongOrder', async (event, song1, song2, options) => {
  return await db.findSongOrder(song1, song2, options);
});

ipcMain.handle('db:compareRecordings', async (event, date) => {
  return await db.getRecordingsByDate(date);
});

// Playback
ipcMain.handle('player:getTrackPath', async (event, trackId) => {
  const track = await db.getTrack(trackId);
  return track?.file_path;
});

ipcMain.handle('player:getTrack', async (event, trackId) => {
  return await db.getTrack(trackId);
});


// Track management
ipcMain.handle('db:getAllTracks', async () => {
  const tracks = await db.getAllTracks();
  console.log(`getAllTracks returned ${tracks.length} tracks`);

  if (tracks.length === 0) {
    // Check if tracks actually exist
    const trackCount = await db.getAsync('SELECT COUNT(*) as count FROM tracks');
    if (trackCount?.count > 0) {
      console.log(`Found ${trackCount.count} tracks in DB but query returned 0`);
      // Try simpler query
      const simpleTracks = await db.allAsync('SELECT * FROM tracks LIMIT 5');
      console.log('Sample tracks:', simpleTracks);
    }
  }

  return tracks;
});

ipcMain.handle('db:getTracksByShow', async (event, showId) => {
  return await db.getTracksByShow(showId);
});

ipcMain.handle('db:bulkUpdateTracks', async (event, trackIds, metadata) => {
  const results = [];
  for (const trackId of trackIds) {
    try {
      await db.updateTrackMetadata(trackId, metadata);
      results.push({ trackId, success: true });
    } catch (error) {
      console.error(`Error updating track ${trackId}:`, error);
      results.push({ trackId, success: false, error: error.message });
    }
  }
  return results;
});

ipcMain.handle('db:updateTrack', async (event, trackId, updates) => {
  return await db.updateTrack(trackId, updates);
});

// Database management
ipcMain.handle('db:clearAll', async () => {
  return await db.clearAllData();
});

ipcMain.handle('db:bulkUpdateShows', async (event, updates) => {
  return await db.bulkUpdateShows(updates);
});

// Verification status handlers
ipcMain.handle('db:markShowAsVerified', async (event, showId, notes) => {
  return await db.markShowAsVerified(showId, notes);
});

ipcMain.handle('db:markShowForReview', async (event, showId, notes) => {
  return await db.markShowForReview(showId, notes);
});

ipcMain.handle('db:clearShowVerification', async (event, showId) => {
  return await db.clearShowVerification(showId);
});

ipcMain.handle('db:getShowVerificationStatus', async (event, showId) => {
  return await db.getShowVerificationStatus(showId);
});

ipcMain.handle('db:getUnverifiedShows', async () => {
  return await db.getUnverifiedShows();
});

ipcMain.handle('db:getShowsNeedingReview', async () => {
  return await db.getShowsNeedingReview();
});

// Archive.org data lookup
const archiveLookup = new ArchiveOrgLookup();

ipcMain.handle('lookup:searchArchive', async (event, date, venue) => {
  return await archiveLookup.searchShows(date, venue);
});

ipcMain.handle('lookup:getArchiveDetails', async (event, identifier) => {
  return await archiveLookup.getShowDetails(identifier);
});

ipcMain.handle('lookup:getSetlist', async (event, date) => {
  return await archiveLookup.getSetlist(date);
});

ipcMain.handle('lookup:findBestMatch', async (event, date, venue, sourceType) => {
  return await archiveLookup.findBestMatch(date, venue, sourceType);
});

// MusicBrainz API lookup
const musicBrainzService = new MusicBrainzService();

ipcMain.handle('musicbrainz:search', async (event, searchQuery) => {
  try {
    console.log('MusicBrainz search request:', searchQuery);

    // Perform search based on provided criteria
    let results = [];

    if (searchQuery.album && searchQuery.artist) {
      // Search by metadata (artist and album)
      const metadataResult = await musicBrainzService.searchByMetadata(
        searchQuery.artist,
        searchQuery.album
      );

      if (metadataResult) {
        results.push({
          id: metadataResult.id,
          title: metadataResult.releases?.[0]?.title || searchQuery.album,
          artist: metadataResult.artist,
          date: metadataResult.releases?.[0]?.date,
          trackCount: null, // Will be filled if we get release details
          confidence: 0.8,
          type: 'recording',
          label: null,
          tracks: null
        });
      }
    }

    // Search for Grateful Dead releases if artist matches
    if (searchQuery.artist && searchQuery.artist.toLowerCase().includes('grateful dead')) {
      const gdReleases = await musicBrainzService.searchGratefulDeadReleases(searchQuery.album || '');

      for (const release of gdReleases.slice(0, 5)) { // Limit to 5 results
        try {
          const releaseDetails = await musicBrainzService.getReleaseDetails(release.id);

          if (releaseDetails) {
            const confidence = calculateSearchConfidence(searchQuery, releaseDetails);

            // Process tracks for display with formatting
            const processedTracks = releaseDetails.tracks ?
              musicBrainzService.processTracksForDisplay(releaseDetails.tracks, releaseDetails.isLive) :
              null;

            // Fetch cover art
            const coverArt = await musicBrainzService.fetchCoverArt(releaseDetails.id);

            results.push({
              id: releaseDetails.id,
              title: releaseDetails.title,
              artist: releaseDetails.artist,
              date: releaseDetails.date,
              originalReleaseDate: releaseDetails.originalReleaseDate,
              releaseVersion: releaseDetails.releaseVersion,
              trackCount: releaseDetails.trackCount,
              discCount: releaseDetails.discCount,
              confidence: confidence,
              type: releaseDetails.type || 'album',
              label: releaseDetails.label,
              catalogNumber: releaseDetails.catalogNumber,
              isLive: releaseDetails.isLive,
              isOfficial: releaseDetails.isOfficial,
              tracks: processedTracks,
              segues: releaseDetails.segues || [],
              coverArt: coverArt
            });
          }
        } catch (error) {
          console.error('Error getting release details:', error);
        }
      }
    }

    // Sort results by confidence
    results.sort((a, b) => b.confidence - a.confidence);

    console.log(`MusicBrainz search returned ${results.length} results`);
    return results;

  } catch (error) {
    console.error('MusicBrainz search error:', error);
    return [];
  }
});

// Helper function to calculate search confidence
function calculateSearchConfidence(searchQuery, releaseDetails) {
  let confidence = 0.5; // Base confidence

  // Check album title similarity
  if (searchQuery.album && releaseDetails.title) {
    const albumSimilarity = calculateStringSimilarity(
      searchQuery.album.toLowerCase(),
      releaseDetails.title.toLowerCase()
    );
    confidence += albumSimilarity * 0.3;
  }

  // Check track count match
  if (searchQuery.trackCount && releaseDetails.trackCount) {
    const trackCountDiff = Math.abs(parseInt(searchQuery.trackCount) - releaseDetails.trackCount);
    if (trackCountDiff === 0) confidence += 0.2;
    else if (trackCountDiff <= 2) confidence += 0.1;
  }

  // Check date proximity
  if (searchQuery.date && releaseDetails.date) {
    const searchDate = new Date(searchQuery.date);
    const releaseDate = new Date(releaseDetails.date);
    const daysDiff = Math.abs((searchDate - releaseDate) / (1000 * 60 * 60 * 24));

    if (daysDiff === 0) confidence += 0.2;
    else if (daysDiff <= 30) confidence += 0.1;
    else if (daysDiff <= 365) confidence += 0.05;
  }

  // Boost confidence for official releases
  if (releaseDetails.isOfficial) {
    confidence += 0.1;
  }

  return Math.min(confidence, 1.0);
}

// Handler to get real file metadata
ipcMain.handle('file:getMetadata', async (event, filePath) => {
  try {
    const metadataExtractor = new MetadataExtractor();
    const metadata = await metadataExtractor.extractMetadata(filePath);
    console.log('Extracted metadata for', path.basename(filePath), ':', {
      title: metadata.title,
      artist: metadata.artist,
      album: metadata.album,
      duration: metadata.duration,
      format: metadata.format,
      bitrate: metadata.bitrate
    });
    return metadata;
  } catch (error) {
    console.error('Error extracting metadata:', error);
    return null;
  }
});

// IPC handler for fetching album cover
ipcMain.handle('musicbrainz:fetchCover', async (event, releaseId) => {
  try {
    console.log('Fetching album cover for release:', releaseId);
    const coverArt = await musicBrainzService.fetchAlbumCover(releaseId);
    return coverArt;
  } catch (error) {
    console.error('Error fetching album cover:', error);
    return null;
  }
});

// IPC handler for audio fingerprint matching
ipcMain.handle('musicbrainz:fingerprint', async (event, filePath) => {
  try {
    console.log('Fingerprint match request for:', filePath);

    // Create import service instance
    const importService = new ImportService(db);

    // Get basic metadata first
    const metadata = await importService.metadataExtractor.extractMetadata(filePath);

    // Find best match with fingerprint
    const match = await musicBrainzService.findBestMatchWithFingerprint(filePath, metadata);

    if (match) {
      console.log(`Fingerprint match found: ${match.title} (confidence: ${match.confidence})`);

      // If we have a release ID, fetch full details including cover art
      if (match.releaseId) {
        try {
          const releaseDetails = await musicBrainzService.getReleaseDetails(match.releaseId);
          const coverArt = await musicBrainzService.fetchCoverArt(match.releaseId);

          match.releaseDetails = releaseDetails;
          match.coverArt = coverArt;
        } catch (error) {
          console.error('Error fetching release details:', error);
        }
      }
    }

    return match;
  } catch (error) {
    console.error('Fingerprint matching error:', error);
    throw error;
  }
});

// Simple string similarity calculation
function calculateStringSimilarity(str1, str2) {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;

  if (longer.length === 0) return 1.0;

  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

// Levenshtein distance calculation
function levenshteinDistance(str1, str2) {
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

// Add IPC handler for getting audio file URL
ipcMain.handle('audio:getFileUrl', async (event, filePath) => {
  try {
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    // Return HTTP URL from our audio server
    if (global.audioServerPort) {
      const encodedPath = encodeURIComponent(filePath);
      return `http://127.0.0.1:${global.audioServerPort}/?path=${encodedPath}`;
    } else {
      // Fallback to file URL if server not ready
      if (process.platform === 'win32') {
        const normalizedPath = filePath.replace(/\\/g, '/');
        return `file:///${normalizedPath}`;
      } else {
        return `file://${filePath}`;
      }
    }
  } catch (error) {
    console.error('Error getting audio file URL:', error);
    throw error;
  }
});

// Add IPC handler to check audio file
ipcMain.handle('audio:checkFile', async (event, filePath) => {
  try {
    const exists = fs.existsSync(filePath);
    if (!exists) {
      return { exists: false };
    }

    const stats = fs.statSync(filePath);
    return {
      exists: true,
      size: stats.size,
      extension: path.extname(filePath).toLowerCase()
    };
  } catch (error) {
    console.error('Error checking audio file:', error);
    return { exists: false, error: error.message };
  }
});

// Settings
const Store = require('electron-store');
const store = new Store();

ipcMain.handle('settings:get', (event, key) => {
  return store.get(key);
});

ipcMain.handle('settings:set', (event, key, value) => {
  store.set(key, value);
});

ipcMain.handle('settings:getAll', () => {
  return store.store;
});

// Debug endpoint
ipcMain.handle('debug:checkDatabase', async () => {
  const debug = {};

  // Get raw counts
  debug.shows = await db.getAsync('SELECT COUNT(*) as count FROM shows');
  debug.recordings = await db.getAsync('SELECT COUNT(*) as count FROM recordings');
  debug.tracks = await db.getAsync('SELECT COUNT(*) as count FROM tracks');
  debug.songs = await db.getAsync('SELECT COUNT(*) as count FROM songs');
  debug.bands = await db.getAsync('SELECT COUNT(*) as count FROM bands');
  debug.venues = await db.getAsync('SELECT COUNT(*) as count FROM venues');

  // Get sample data if any exists
  if (debug.shows?.count > 0) {
    debug.sampleShow = await db.getAsync('SELECT * FROM shows LIMIT 1');
  }
  if (debug.recordings?.count > 0) {
    debug.sampleRecording = await db.getAsync('SELECT * FROM recordings LIMIT 1');
  }
  if (debug.tracks?.count > 0) {
    debug.sampleTrack = await db.getAsync('SELECT * FROM tracks LIMIT 1');
  }

  console.log('Database debug info:', debug);
  return debug;
});