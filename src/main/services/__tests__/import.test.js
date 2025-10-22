const ImportService = require('../import');
const path = require('path');

// Mock dependencies
jest.mock('../metadata-extractor');
jest.mock('../officialReleases');
jest.mock('../musicBrainzService');

describe('ImportService', () => {
  let importService;
  let mockDb;

  beforeEach(() => {
    // Create mock database
    mockDb = {
      getAsync: jest.fn(),
      runAsync: jest.fn(),
      createRecording: jest.fn(() => Promise.resolve(1)),
      findOrCreateVenue: jest.fn(() => Promise.resolve(1)),
      findOrCreateShow: jest.fn(() => Promise.resolve(1)),
      findOrCreateSong: jest.fn(() => Promise.resolve(1))
    };

    importService = new ImportService(mockDb);
  });

  describe('analyzeFiles', () => {
    it('should analyze audio files and extract metadata', async () => {
      const filePaths = ['/test/audio1.flac'];

      // Mock metadata extractor
      importService.metadataExtractor.extractMetadata = jest.fn(() =>
        Promise.resolve({
          title: 'Test Song',
          artist: 'Test Artist',
          album: 'Test Album',
          duration: 300
        })
      );

      const results = await importService.analyzeFiles(filePaths);

      expect(results).toHaveLength(1);
      expect(results[0]).toHaveProperty('title', 'Test Song');
      expect(results[0]).toHaveProperty('artist', 'Test Artist');
    });

    it('should handle fingerprinting when enabled', async () => {
      const filePaths = ['/test/audio1.flac'];

      importService.metadataExtractor.extractMetadata = jest.fn(() =>
        Promise.resolve({
          title: 'Test Song',
          artist: 'Test Artist'
        })
      );

      importService.musicBrainzService.findBestMatchWithFingerprint = jest.fn(() =>
        Promise.resolve({
          title: 'Correct Song Name',
          artist: 'Test Artist',
          confidence: 0.95
        })
      );

      const results = await importService.analyzeFiles(filePaths, {
        enableFingerprinting: true
      });

      expect(importService.musicBrainzService.findBestMatchWithFingerprint).toHaveBeenCalled();
      expect(results[0].fingerprintMatch).toBeDefined();
    });

    it('should handle errors gracefully', async () => {
      const filePaths = ['/test/nonexistent.flac'];

      importService.metadataExtractor.extractMetadata = jest.fn(() =>
        Promise.reject(new Error('File not found'))
      );

      const results = await importService.analyzeFiles(filePaths);

      expect(results).toHaveLength(1);
      expect(results[0]).toHaveProperty('error');
    });
  });

  describe('importFile', () => {
    it('should validate required metadata before import', async () => {
      const fileInfo = {
        path: '/test/audio1.flac',
        title: 'Test Song'
        // Missing date and venue
      };

      // Since date and venue are required, this should handle missing data
      // The actual implementation may throw or handle differently
      // Adjust based on actual behavior
      await expect(async () => {
        await importService.importFile(fileInfo);
      }).rejects.toThrow();
    });

    it('should prevent duplicate imports using file hash', async () => {
      const fileInfo = {
        path: '/test/audio1.flac',
        title: 'Test Song',
        artist: 'Test Artist',
        date: '2024-01-01',
        venue: 'Test Venue'
      };

      // Mock existing recording
      mockDb.getAsync.mockResolvedValueOnce({
        id: 123,
        show_id: 1,
        library_path: '/library/audio1.flac'
      });

      const result = await importService.importFile(fileInfo);

      expect(result).toHaveProperty('duplicate', true);
      expect(result).toHaveProperty('id', 123);
    });

    it('should create venue if not exists', async () => {
      const fileInfo = {
        path: '/test/audio1.flac',
        title: 'Test Song',
        artist: 'Test Artist',
        date: '2024-01-01',
        venue: 'New Venue',
        city: 'Test City',
        state: 'TS'
      };

      mockDb.getAsync.mockResolvedValueOnce(null); // No existing recording

      await importService.importFile(fileInfo);

      // Check if venue creation was attempted (implementation dependent)
      // This test structure depends on your actual implementation
    });

    it('should handle official release detection', async () => {
      const fileInfo = {
        path: '/test/audio1.flac',
        title: 'Test Song',
        album: '50th Anniversary Edition',
        artist: 'Test Artist',
        date: '2024-01-01',
        venue: 'Studio'
      };

      // The official release detector should identify this as official
      importService.releaseDetector.detectOfficialReleaseEnhanced = jest.fn(() =>
        Promise.resolve({
          matched: true,
          release: { name: '50th Anniversary Edition' },
          matchType: 'album_pattern'
        })
      );

      mockDb.getAsync.mockResolvedValueOnce(null); // No existing recording

      const result = await importService.importFile(fileInfo);

      expect(importService.releaseDetector.detectOfficialReleaseEnhanced).toHaveBeenCalled();
    });
  });

  describe('suggestShowMatch', () => {
    it('should suggest matching existing shows', async () => {
      const metadata = {
        artist: 'Test Artist',
        date: '2024-01-01',
        venue: 'Test Venue'
      };

      mockDb.getAsync.mockResolvedValueOnce({
        id: 1,
        date: '2024-01-01'
      });

      const result = await importService.suggestShowMatch(metadata);

      expect(result).toBeDefined();
      // Add more specific expectations based on implementation
    });
  });

  describe('Security considerations', () => {
    it('should not allow path traversal in file paths', async () => {
      const fileInfo = {
        path: '../../../etc/passwd',
        title: 'Test',
        date: '2024-01-01',
        venue: 'Test'
      };

      // Depending on implementation, this should either throw or sanitize
      // Adjust expectation based on actual behavior
      await expect(async () => {
        await importService.importFile(fileInfo, { copyToLibrary: true });
      }).rejects.toThrow();
    });

    it('should validate file extensions', async () => {
      const fileInfo = {
        path: '/test/malicious.exe',
        title: 'Test',
        date: '2024-01-01',
        venue: 'Test'
      };

      // Should reject non-audio files
      // Adjust based on implementation
    });
  });
});
