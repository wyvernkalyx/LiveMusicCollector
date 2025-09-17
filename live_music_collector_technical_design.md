# Live Music Collector - Technical Design Document

## 1. Overview

Live Music Collector is a desktop application for managing large collections of live music recordings. It normalizes metadata, provides powerful search and browsing capabilities, and maintains a pristine library organization while preserving original source files.

### Key Design Principles
- **Band-agnostic architecture** - No hardcoded band-specific logic
- **Non-destructive** - Never modify original files
- **Extensible** - Plugin architecture for band-specific rules
- **Fast** - Handle thousands of recordings efficiently

## 2. System Architecture

### 2.1 High-Level Components

```
┌─────────────────────────────────────────────────────────────┐
│                     Desktop Application                      │
├─────────────────────────────────────────────────────────────┤
│  UI Layer           │  Business Logic    │  Data Layer      │
│  ├─ Main Window     │  ├─ Import Engine  │  ├─ Local DB     │
│  ├─ Player Controls │  ├─ Normalizer     │  ├─ File System  │
│  ├─ Search/Filter   │  ├─ Matcher        │  └─ External APIs│
│  └─ Metadata Editor │  └─ Playback       │                  │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Technology Stack

**Option 1: Electron + React + Node.js**
- **Pros**: Web technologies, cross-platform, rich ecosystem
- **Cons**: Larger memory footprint, electron overhead

**Option 2: .NET 6+ with WPF/Avalonia**
- **Pros**: Native performance, excellent Windows integration, LINQ for data
- **Cons**: More complex audio handling

**Option 3: Python + Qt (PyQt6)**
- **Pros**: Excellent audio libraries, rapid development, cross-platform
- **Cons**: Distribution can be complex

**Recommendation**: Electron + React + Node.js for MVP
- Fastest path to working product
- Best audio library support (node-audio-player, music-metadata)
- Easier integration with web APIs

## 3. Data Model

### 3.1 Core Entities

```sql
-- Bands
CREATE TABLE bands (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    musicbrainz_id TEXT,
    archive_org_collection TEXT
);

-- Venues
CREATE TABLE venues (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    city TEXT,
    state TEXT,
    country TEXT,
    normalized_name TEXT
);

-- Shows
CREATE TABLE shows (
    id INTEGER PRIMARY KEY,
    band_id INTEGER,
    date DATE NOT NULL,
    venue_id INTEGER,
    archive_org_identifier TEXT,
    setlist_fm_id TEXT,
    notes TEXT,
    FOREIGN KEY (band_id) REFERENCES bands(id),
    FOREIGN KEY (venue_id) REFERENCES venues(id)
);

-- Songs
CREATE TABLE songs (
    id INTEGER PRIMARY KEY,
    band_id INTEGER,
    title TEXT NOT NULL,
    normalized_title TEXT NOT NULL,
    abbreviations TEXT, -- JSON array of known abbreviations
    FOREIGN KEY (band_id) REFERENCES bands(id)
);

-- Recordings
CREATE TABLE recordings (
    id INTEGER PRIMARY KEY,
    show_id INTEGER,
    source_type TEXT, -- 'SBD', 'AUD', 'MATRIX', 'OFFICIAL'
    taper TEXT,
    lineage TEXT,
    library_path TEXT NOT NULL,
    original_path TEXT,
    file_hash TEXT,
    quality_rating INTEGER,
    FOREIGN KEY (show_id) REFERENCES shows(id)
);

-- Tracks
CREATE TABLE tracks (
    id INTEGER PRIMARY KEY,
    recording_id INTEGER,
    track_number INTEGER,
    song_id INTEGER,
    duration INTEGER,
    segue_type TEXT, -- '>', 'jam', null
    file_path TEXT NOT NULL,
    FOREIGN KEY (recording_id) REFERENCES recordings(id),
    FOREIGN KEY (song_id) REFERENCES songs(id)
);
```

### 3.2 Database Choice

**SQLite** for local storage
- Embedded, no server required
- Excellent performance for read-heavy workloads
- Full-text search capabilities
- Easy backup/restore

## 4. Core Components

### 4.1 Import Engine

```javascript
class ImportEngine {
    async importFiles(filePaths) {
        // 1. Copy files to library location
        // 2. Extract metadata
        // 3. Attempt automatic matching
        // 4. Queue for normalization
        // 5. Update database
    }
    
    async extractMetadata(filePath) {
        // Use music-metadata library
        // Extract: artist, album, date, track info
        // Generate fingerprint for duplicate detection
    }
}
```

### 4.2 Normalizer

```javascript
class Normalizer {
    constructor(bandRules) {
        this.rules = bandRules; // Per-band normalization rules
    }
    
    normalizeSongTitle(title, bandId) {
        // Apply abbreviation expansions
        // Remove special characters
        // Standardize capitalization
    }
    
    normalizeDate(dateString) {
        // Convert various formats to yyyy-mm-dd
        // Handle common variants (77 → 1977)
    }
    
    generateFileName(show, recording) {
        // Format: "yyyy-mm-dd - Venue, City, ST - (Source Info)"
    }
}
```

### 4.3 Matcher

```javascript
class ShowMatcher {
    async matchRecording(metadata, bandId) {
        // 1. Parse date from metadata
        // 2. Query known shows for that date
        // 3. Use fuzzy matching on venue/location
        // 4. Return confidence score
    }
    
    async suggestMatches(metadata) {
        // Return top 5 potential matches
        // Include confidence scores
    }
}
```

### 4.4 External API Integration

```javascript
class DataProviders {
    async fetchGratefulDeadShows() {
        // Archive.org API
        // Cache results locally
    }
    
    async fetchSetlist(showId) {
        // Setlist.fm API
        // Parse and normalize song names
    }
    
    async fetchOfficialReleases(bandId) {
        // MusicBrainz/Discogs APIs
    }
}
```

## 5. File Organization

### 5.1 Library Structure

```
/MusicLibrary
├── /Grateful Dead
│   ├── /1977
│   │   ├── /1977-05-08 - Cornell University, Ithaca, NY - (Barton Hall SBD)
│   │   │   ├── 01 - New Minglewood Blues.flac
│   │   │   ├── 02 - Loser.flac
│   │   │   └── ...
│   │   └── /1977-05-09 - War Memorial, Buffalo, NY - (AUD Miller)
│   └── /1978
└── /Phish
    └── ...
```

### 5.2 Metadata Storage

Each audio file will have embedded tags:
- **Title**: "Song Name - 1977-05-08"
- **Album**: "1977-05-08 - Cornell University, Ithaca, NY"
- **Artist**: "Grateful Dead"
- **Track**: Proper sequence number
- **Date**: "1977-05-08" (stored in date field)
- **Comment**: Source info, taper, lineage, segue info (e.g., "> Fire on the Mountain")

## 6. Search & Query System

### 6.1 Search Types

1. **Quick Search**: Full-text across all fields
2. **Advanced Search**: 
   - By date range
   - By venue/location
   - By song appearance
   - By source type
   - By quality rating
   - **By set position**: "Shows starting with X", "X as encore"
   - **By song order**: "X before Y", "X > Y" (with segue)
3. **Comparison Search**: Find multiple versions of same show/date

### 6.2 Search Implementation

```javascript
class SearchEngine {
    buildSearchIndex() {
        // Create FTS5 virtual table in SQLite
        // Index: songs, venues, dates, source info
    }
    
    search(query, filters) {
        // Parse query
        // Apply filters
        // Return ranked results
    }
    
    // Find shows that start with a specific song
    findShowsStartingWith(songTitle) {
        return db.query(`
            SELECT DISTINCT s.* FROM shows s
            JOIN recordings r ON s.id = r.show_id
            JOIN tracks t ON r.id = t.recording_id
            JOIN songs sg ON t.song_id = sg.id
            WHERE sg.normalized_title = ? 
            AND t.track_number = 1
        `, [songTitle]);
    }
    
    // Find shows where song X appears before song Y
    findSongOrder(song1, song2) {
        return db.query(`
            SELECT DISTINCT s.* FROM shows s
            JOIN recordings r ON s.id = r.show_id
            JOIN tracks t1 ON r.id = t1.recording_id
            JOIN tracks t2 ON r.id = t2.recording_id
            JOIN songs sg1 ON t1.song_id = sg1.id
            JOIN songs sg2 ON t2.song_id = sg2.id
            WHERE sg1.normalized_title = ?
            AND sg2.normalized_title = ?
            AND t1.track_number < t2.track_number
        `, [song1, song2]);
    }
    
    // Find shows where song X segues into song Y
    findSegues(song1, song2) {
        return db.query(`
            SELECT DISTINCT s.* FROM shows s
            JOIN recordings r ON s.id = r.show_id
            JOIN tracks t1 ON r.id = t1.recording_id
            JOIN tracks t2 ON r.id = t2.recording_id
            JOIN songs sg1 ON t1.song_id = sg1.id
            JOIN songs sg2 ON t2.song_id = sg2.id
            WHERE sg1.normalized_title = ?
            AND sg2.normalized_title = ?
            AND t1.track_number + 1 = t2.track_number
            AND t1.segue_type IS NOT NULL
        `, [song1, song2]);
    }
}
```

## 7. Performance Considerations

### 7.1 Optimization Strategies

1. **Lazy Loading**: Don't load full setlists until expanded
2. **Virtual Scrolling**: For lists with 1000+ items
3. **Background Processing**: Import/normalize in worker threads
4. **Caching**: Cache API responses and computed values
5. **Indexing**: Proper database indexes on common queries

### 7.2 Scalability Targets

- Handle 10,000+ shows
- Sub-second search response
- Import 100 shows in under 5 minutes
- Smooth playback while browsing

## 8. Configuration & Settings

### 8.1 User Preferences

```json
{
    "library_path": "D:\\MusicLibrary",
    "import_copy_files": true,
    "auto_normalize": true,
    "preferred_format": "flac",
    "naming_convention": {
        "date_format": "yyyy-mm-dd",
        "venue_format": "{name}, {city}, {state}",
        "include_source": true
    }
}
```

### 8.2 Band-Specific Rules

```json
{
    "grateful_dead": {
        "abbreviations": {
            "GDTRFB": "Going Down the Road Feeling Bad",
            "NFA": "Not Fade Away",
            "TLEO": "They Love Each Other"
        },
        "year_assumptions": {
            "65-74": 1900,
            "75-95": 1900,
            "96-99": 1900,
            "00-30": 2000
        }
    }
}
```

## 9. API Endpoints (Internal)

For separation of concerns between UI and logic:

```javascript
// Library Management
POST   /api/import
GET    /api/library/stats
DELETE /api/recordings/{id}

// Search & Browse
GET    /api/shows?year=1977&venue=cornell
GET    /api/songs/{songId}/performances
GET    /api/search?q=fire+mountain+1977

// Metadata
PUT    /api/recordings/{id}/metadata
POST   /api/recordings/{id}/match
GET    /api/shows/{date}/suggestions

// Playback
GET    /api/play/{trackId}
POST   /api/playlist
```

## 10. Security & Privacy

- No user authentication required (local app)
- No telemetry or usage tracking
- Optional crash reporting
- Local database encryption option

## 11. Development Phases

### Phase 1: Core Infrastructure (Week 1-2)
- Set up Electron app
- Create database schema
- Basic file import

### Phase 2: Matching & Normalization (Week 3-4)
- Implement rule engine
- Build show matcher
- Create normalizer

### Phase 3: UI Implementation (Week 5-6)
- Browse interface
- Search functionality
- Metadata editor

### Phase 4: Integration & Polish (Week 7-8)
- External API integration
- Audio playback
- Testing & refinement

## 12. Future Enhancements (Post-MVP)

- CD ripping integration
- Format conversion
- Duplicate detection algorithms
- Trading network features
- Mobile companion app
- Cloud backup options
- Multi-user support
- Visualization tools (show frequency, song statistics)
