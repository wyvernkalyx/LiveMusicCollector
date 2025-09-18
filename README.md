# Live Music Collector

A sophisticated Electron application for managing and organizing live music collections with advanced metadata management, audio fingerprinting, and MusicBrainz integration.

## 🎵 Features

### Core Functionality
- **Smart Library Management**: Organize concerts by date, venue, and source type
- **Audio Fingerprinting**: Automatic track identification using AcoustID/Chromaprint
- **MusicBrainz Integration**: Comprehensive metadata lookup and album artwork retrieval
- **FLAC Support**: Built-in HTTP streaming server for lossless audio playback
- **Album Verification System**: Lock verified albums to prevent accidental re-processing

### Advanced Metadata Management
- **Three-tier Architecture**: Concert → Release → Track structure for complex live recordings
- **Automatic Normalization**: Expands abbreviations (NFA → Not Fade Away) and applies proper formatting
- **Multi-disc Support**: Intelligent track numbering for box sets and compilations
- **Inline Editing**: Edit all metadata directly in the UI without modal dialogs
- **Drag-and-drop Reordering**: Reorganize tracks with visual feedback

### Audio Player
- **Queue Management**: Auto-play next track with playlist support
- **Volume Control**: Smooth drag-enabled volume slider with visual handle
- **Format Support**: FLAC, MP3, and other common audio formats
- **Segue Tracking**: Special handling for continuous track transitions

### Search & Discovery
- **Full-text Search**: SQLite FTS5 for instant searching across all metadata
- **Smart Filters**: Filter by date, venue, source type, and quality
- **Archive.org Integration**: Direct access to live music archives
- **Advanced Queries**: Find shows by song order, segues, or specific criteria

## 🚀 Installation

### Prerequisites
- Node.js 16+ and npm
- Windows 10/11, macOS, or Linux
- Chromaprint (for audio fingerprinting)

### Setup
```bash
# Clone the repository
git clone https://github.com/yourusername/LiveMusicCollector.git
cd LiveMusicCollector

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

### Chromaprint Setup
For audio fingerprinting to work, you need Chromaprint installed:
- **Windows**: Download from [AcoustID](https://acoustid.org/chromaprint)
- **macOS**: `brew install chromaprint`
- **Linux**: `sudo apt-get install libchromaprint-tools`

## 📖 Usage

### Importing Music
1. Click "Import Music" in the sidebar
2. Select folders containing your live recordings
3. The app will extract metadata and organize files automatically
4. Files are organized as: `/Band/Year/Date - Venue - (Source)/tracks`

### Managing Albums
1. **View Mode**: Browse and play albums with full metadata display
2. **Edit Mode**: Click "Edit Metadata" to modify track information inline
3. **MusicBrainz Lookup**: Click "Lookup from MusicBrainz" for automatic metadata
4. **Verification**: Mark albums as "Verified" when metadata is complete

### Audio Fingerprinting
1. Open any album and click "Lookup from MusicBrainz"
2. The app will fingerprint each track and find matches
3. Review matches with confidence scoring
4. Apply changes - metadata saves automatically
5. Verified albums skip automatic processing unless explicitly requested

### Verification Workflow
- **Mark as Verified**: Locks album from automatic re-processing
- **Mark for Review**: Flag albums needing attention with notes
- **Clear Verification**: Remove verification to allow re-processing
- Visual indicators show status: ✅ Verified, 🔍 Needs Review

### Keyboard Shortcuts
- `Space`: Play/Pause
- `→`: Next track
- `←`: Previous track
- `Ctrl+F`: Search
- `Escape`: Close dialogs

## 🗄️ Database Schema

### Core Tables
- `bands`: Artists with archive.org collection links
- `shows`: Concert records with date, venue, and verification status
- `concerts`: Actual performance events
- `releases`: Commercial products containing recordings
- `recordings`: Different sources (SBD/AUD/MATRIX) of shows
- `tracks`: Individual audio files with comprehensive metadata
- `venues`: Location data with normalization support
- `songs`: Track catalog with abbreviation mappings

### Verification Fields
- `verified`: Boolean flag for completed albums
- `verified_date`: Timestamp of verification
- `needs_review`: Flag for albums requiring attention
- `review_notes`: Text notes for review items

### Search Indexes
- Full-text search on songs and venues using SQLite FTS5
- Optimized queries for instant results

## ⚙️ Configuration

Settings are stored in:
- **Windows**: `%APPDATA%/live-music-collector`
- **macOS**: `~/Library/Application Support/live-music-collector`
- **Linux**: `~/.config/live-music-collector`

Configuration includes:
- Library paths
- Import preferences
- Player settings
- MusicBrainz API configuration

## 🏗️ Architecture

### Main Process (`src/main/`)
- Database operations (SQLite with better-sqlite3)
- File system management
- HTTP streaming server for audio
- IPC handlers for renderer communication

### Renderer Process (`src/renderer/`)
- React 18 with Vite for fast development
- Zustand for state management
- Emotion for CSS-in-JS styling
- React Router for navigation

### Services
- `DatabaseService`: All database operations with async support
- `ImportService`: File import and organization
- `MusicBrainzService`: API integration for metadata
- `NormalizationService`: Metadata standardization
- `ChromaprintSetup`: Audio fingerprinting setup
- `ConcertReleaseSchema`: Three-tier data management

## 🔧 Development

### Commands
```bash
npm run dev          # Start development environment
npm run build        # Build for production
npm run test         # Run tests
npm run lint         # Run ESLint
npm run dev:main     # Start main process only
npm run dev:renderer # Start renderer only
```

### Project Structure
```
LiveMusicCollector/
├── src/
│   ├── main/           # Electron main process
│   │   ├── services/   # Business logic
│   │   ├── index.js    # Main entry point
│   │   └── preload.js  # Preload script
│   └── renderer/       # React application
│       ├── components/ # Reusable components
│       ├── pages/      # Route pages
│       ├── styles/     # Global styles
│       └── store.js    # State management
├── CLAUDE.md          # AI assistant documentation
├── package.json       # Dependencies and scripts
└── README.md          # This file
```

### Key Dependencies
- `better-sqlite3`: Fast SQLite database
- `music-metadata`: Audio file parsing
- `electron-builder`: Application packaging
- `lucide-react`: Icon library
- `date-fns`: Date manipulation
- `musicbrainz-api`: MusicBrainz API client
- `@emotion/styled`: CSS-in-JS styling
- `zustand`: State management

## 🐛 Recent Fixes

### Critical UX Improvements
- **Auto-refresh**: Album view now refreshes automatically after saving
- **Volume Slider**: Fixed drag functionality with proper mouse tracking
- **Grid Columns**: Expanded title column to minmax(300px, 3fr) for readability

### Performance Optimizations
- Verification system prevents unnecessary re-fingerprinting
- Efficient bulk updates for metadata changes
- Optimized FTS5 search indexes

## 🤝 Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Code Style
- ESLint and Prettier are configured
- Follow existing patterns in the codebase
- Write meaningful commit messages

## 📝 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

- [MusicBrainz](https://musicbrainz.org/) for comprehensive music metadata
- [AcoustID](https://acoustid.org/) for audio fingerprinting technology
- [Archive.org](https://archive.org/) for live music preservation
- The Grateful Dead community for inspiring this project
- All contributors who have helped improve this application

## 💬 Support

For issues, questions, or suggestions:
- Open an issue on [GitHub](https://github.com/yourusername/LiveMusicCollector/issues)
- Check existing issues before creating new ones
- Provide detailed information for bug reports

---

Built with ❤️ for the live music community