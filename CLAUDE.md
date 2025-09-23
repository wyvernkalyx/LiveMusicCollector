# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
- `npm run dev` - Start both main and renderer processes in development mode with hot reload
- `npm run start` - Start the application in production mode
- `npm run build` - Build both renderer (Vite) and main process for production
- `npm run test` - Run Jest tests
- `npm run lint` - Run ESLint on src directory

### Individual Process Commands
- `npm run dev:main` - Start Electron main process with nodemon watch
- `npm run dev:renderer` - Start Vite dev server for renderer
- `npm run build:main` - Build main process with build.js script
- `npm run build:renderer` - Build renderer with Vite

## Major Design Decisions & Requirements

### Core Principles
1. **Non-destructive**: Original audio files are NEVER modified or renamed
2. **Metadata-focused**: All organization is done through database metadata, not file manipulation
3. **Live music optimized**: Designed specifically for managing concert recordings, not studio albums
4. **Automatic identification**: Uses audio fingerprinting to identify tracks and shows
5. **Flexible organization**: Supports both official releases and bootleg recordings

### Import Requirements
- **Date is mandatory**: Cannot import without a valid performance date (YYYY-MM-DD format)
- **Venue is mandatory**: Cannot import without a valid venue name
- **Folder = Album**: Each folder is treated as a separate album/show during import
- **Metadata validation**: All metadata must be validated before files are copied to library

### Folder Structure Rules
- **Official Releases**: `/Artist/Album Name/[original files]`
- **Live Bootlegs**: `/Artist/Year/Date - Venue - State (Source)/[original files]`
- **Source types**: SBD (Soundboard), AUD (Audience), Matrix, FM, Stream
- **No file renaming**: Original filenames are always preserved

### MusicBrainz Integration
- **Performance date priority**: Always extracts actual concert date, never release date
- **Auto-fingerprinting**: Triggered automatically when critical metadata is missing
- **Bulk processing**: Fingerprints multiple tracks for better album identification
- **Smart matching**: Uses confidence scores to determine best matches

### User Experience Requirements
- **Visual feedback**: All operations must show clear status and progress
- **Validation errors**: Clear messages explaining why operations cannot proceed
- **Bulk operations**: Support for importing and processing multiple albums at once
- **Edit flexibility**: All metadata fields must be editable with undo capability

## Architecture

This is an Electron + React application for managing live music collections. The architecture follows Electron's process separation model:

### Main Process (`index.js`, `database.js`)
- Manages application lifecycle and window creation
- Handles all database operations through `DatabaseService`
- Provides IPC handlers for renderer communication
- HTTP audio streaming server for FLAC/audio file playback (port dynamically assigned)
- Services include:
  - `DatabaseService` - SQLite database with FTS5 for search
  - `ImportService` - File import and metadata extraction
  - `NormalizationService` - Metadata normalization and standardization
  - `MusicBrainzService` - MusicBrainz API integration for metadata lookup and album artwork
  - `ArchiveOrgLookup` - Archive.org integration for live show data
- Uses `electron-store` for persistent settings

### Renderer Process (React frontend)
- React 18 with Vite as build tool
- State management with Zustand
- Styling with Emotion (CSS-in-JS)
- React Router for navigation
- Features implemented:
  - Album/Show view with track listing and metadata editing
  - MusicBrainz metadata lookup with Cover Art Archive integration
  - Audio player with playlist support and auto-play next track
  - Inline editing of all metadata fields including dates
  - Collapsible sidebar navigation
  - Two-column layout with adjustable album sidebar

### Database Schema
Band-agnostic design supporting multiple artists with these core tables:
- `bands` - Artist information with archive.org collection links
- `shows` - Concert records with date, venue, and artwork URL
- `venues` - Location data with normalization support
- `songs` - Track catalog with abbreviation support
- `recordings` - Different sources (SBD/AUD/MATRIX) of same show
- `tracks` - Individual files with segue tracking and recording dates
- FTS5 virtual tables for full-text search on songs and venues

### IPC Communication Patterns
All database operations go through IPC handlers:
- `db:*` - Database queries (searchShows, getShow, etc.)
- `import:*` - File import operations with progress updates
- `dialog:*` - File/directory selection dialogs
- `player:*` - Audio playback controls
- `settings:*` - Application settings management
- `musicbrainz:*` - MusicBrainz API operations
- `audio:*` - Audio file checking and URL generation

### Audio Playback
- HTTP streaming server for FLAC and other audio formats
- Supports range requests for seeking
- Automatic MIME type detection based on file extension
- File paths served through `http://127.0.0.1:[port]/?path=[encoded_path]`

### Key Dependencies
- `better-sqlite3` - Local SQLite database with WAL mode
- `music-metadata` - Audio file parsing
- `electron-builder` - Application packaging
- `lucide-react` - Icon library
- `date-fns` - Date manipulation
- `musicbrainz-api` - MusicBrainz API client
- `@emotion/styled` - CSS-in-JS styling
- `zustand` - State management

## Recent Updates (2025-09-23)

### Import System Major Overhaul
- **Auto-fingerprinting on import**: Automatically fingerprints tracks when metadata is missing or invalid
- **Proper metadata persistence**: Fixed issue where user-edited metadata was being overwritten during import
- **Date/venue validation**: Made date and venue required fields before import can proceed
- **Batch folder import**: Each folder treated as separate album, maintaining organization (Note: Currently only first folder's metadata can be reviewed/edited)
- **Multi-date album detection**: Warns when tracks have different performance dates

### ImportMetadataReviewV2 Enhanced UI
- **Dynamic status indicators**: Real-time updates showing match/differ/missing states
- **Source Information section**: Added Release Type, Source Type, and Taper/Lineage fields
- **Track-level editing**: Edit individual track metadata with "Apply to All" functionality
- **Improved folder preview**: Shows full file paths and proper organization structure
- **Official vs Bootleg handling**: Different folder structures based on release type
  - Official: `/Artist/Album Name/`
  - Bootleg: `/Artist/Year/Date - Venue - State (Source)/`

### MusicBrainz Integration Improvements
- **Performance date extraction**: Successfully extracts actual concert dates (not release dates)
- **Venue/location data**: Pulls venue, city, state from MusicBrainz relationships
- **Release type detection**: Automatically detects official vs bootleg releases
- **Album metadata re-evaluation**: Properly updates UI after fingerprinting completes
- **Bulk fingerprinting**: Fingerprints up to 5 tracks for better album identification

### File Organization Rules
- **Original filenames preserved**: Files are never renamed, only metadata is updated
- **Required metadata**: Date and venue are mandatory for proper organization
- **Source type tracking**: SBD/AUD/Matrix/FM included in folder names
- **Year-based organization**: Live shows organized by year subdirectories

### UI/UX Fixes
- **Album view scrolling**: Fixed bottom content being cut off
- **Volume slider**: Fixed drag functionality
- **Auto-refresh**: Album view refreshes after saving metadata
- **Grid column widths**: Improved readability with proper column sizing
- **Sticky sidebar**: Album sidebar stays in place while scrolling tracks

### Album Verification System
- Added verification status tracking to prevent re-processing of verified albums
- Database columns: `verified`, `verified_date`, `needs_review`, `review_notes`
- UI indicators show verification status (green for verified, yellow for needs review)
- "Mark as Verified" button locks albums from automatic fingerprinting
- Fingerprinting prompts for confirmation on verified albums
- Complete verification workflow with notes and review tracking

### Critical UX Fixes
- **Auto-refresh after save**: Album view now refreshes automatically after saving changes
- **Volume slider drag**: Fixed volume control to support proper drag functionality
- **Grid column widths**: Expanded title column to minmax(300px, 3fr) for readability

### Three-tier Data Architecture
- Implemented Concert/Release/Track structure for managing live recordings
- `concerts` table: Actual performance events (date, venue, setlist)
- `releases` table: Commercial products/compilations containing recordings
- `concert_recordings` junction table: Links concerts to their appearances on releases
- Automatic parsing of concert info from MusicBrainz titles

### Enhanced Metadata Management
- Song title normalization with abbreviation expansion (NFA → Not Fade Away)
- Proper title case formatting with exception handling
- Automatic metadata persistence when applying MusicBrainz data
- Support for multi-disc releases with proper track numbering

### Audio Playback System
- HTTP streaming server for FLAC files (Chromium doesn't support FLAC natively)
- Volume control with drag support and visual handle
- Auto-play next track in queue functionality
- Proper play promise management to handle interruptions

### MusicBrainz/AcoustID Integration
- Audio fingerprinting using Chromaprint for track identification
- Full MusicBrainz API integration with release and recording search
- Cover Art Archive support for album artwork
- Disc-based track numbering (101, 102 for disc 1; 201, 202 for disc 2)
- Performance date extraction for live recordings
- Confidence scoring and quality assessment for matches

### UI/UX Improvements
- Collapsible main navigation sidebar
- Two-column album view with optimized sidebar (260px)
- Enhanced track table with proper column spacing
- Inline editing for all metadata fields
- Drag-and-drop track reordering in edit mode
- Visual indicators for playing tracks and segues

## Development Notes

### Current State (2025-09-23)
- **Core functionality**: Import, fingerprinting, playback, and organization fully working
- **MusicBrainz integration**: Successfully identifies Grateful Dead and other jam band recordings
- **Batch import**: Can handle hundreds of folders/shows in single import operation
- **Auto-organization**: Files automatically organized based on metadata

### Technical Decisions
- **SQLite with FTS5**: Chosen for fast full-text search across large music libraries
- **Non-destructive approach**: Files are copied, never moved or renamed
- **HTTP streaming**: Required for FLAC playback in Chromium-based renderer
- **Electron + React**: Provides native file access with modern UI capabilities

### Testing Approach
- Test with actual Grateful Dead recordings from Archive.org
- Verify fingerprinting with both official releases and bootlegs
- Ensure date extraction works with various naming conventions
- Test batch imports with 100+ folders

### Future Enhancements (Planned)
- Archive.org direct integration for downloading shows
- Setlist integration and management
- Advanced search with date ranges and venue filters
- Duplicate detection across different sources
- FLAC to MP3 conversion for mobile sync

## Development Environment
- OS: Windows 10.0.26100
- Shell: Git Bash
- Path format: Windows (use forward slashes in Git Bash)
- File system: Case-insensitive
- Line endings: CRLF (configure Git autocrlf)

## Playwright MCP Guide

File paths:
- Screenshots: `./CCimages/screenshots/`
- PDFs: `./CCimages/pdfs/`

Browser error fix: `npx playwright install`
