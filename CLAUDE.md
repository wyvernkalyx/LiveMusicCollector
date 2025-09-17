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

## Recent Updates

### Audio Playback System
- Implemented HTTP streaming server to handle FLAC files (Chromium doesn't support FLAC natively)
- Added IPC handlers for audio file checking and URL generation
- Fixed preload script to expose audio operations

### MusicBrainz Integration
- Full API integration with release and recording search
- Cover Art Archive support for album artwork
- Disc-based track numbering (101, 102 for disc 1; 201, 202 for disc 2)
- Performance date extraction for live recordings
- Confidence scoring for search results

### UI/UX Improvements
- Collapsible main navigation sidebar
- Two-column album view with narrower sidebar (260px)
- Fixed track table column alignment
- Made title column wider for better readability
- Added date editing capability in track list
- MusicBrainz lookup available in both view and edit modes

## Development Notes

- The application is in active development with core functionality implemented
- Database uses SQLite with FTS5 for efficient full-text search
- The app follows non-destructive principles - original files are never modified
- Library organization follows pattern: `/Band/Year/Date - Venue - (Source)/tracks`
- Audio streaming server automatically starts on app launch for FLAC support