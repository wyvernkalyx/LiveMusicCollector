# Live Music Collector

A desktop application for managing live music collections with advanced metadata normalization, search capabilities, and comparison features.

## Features

- **Smart Import**: Automatically matches recordings to known shows
- **Metadata Normalization**: Standardizes song names, dates, and venue information
- **Advanced Search**: Find shows by opener, song order, or segue patterns
- **Source Comparison**: Compare multiple recordings of the same show
- **Dark Mode UI**: Modern, music-focused interface
- **FLAC Support**: Native playback of lossless audio

## Development Setup

### Prerequisites

- Node.js 18+ and npm
- VS Code
- Claude-Code extension (for AI-assisted development)
- Windows 10/11 (primary target, but cross-platform)

### Quick Start

1. **Clone and Install**
   ```bash
   git clone [repository-url]
   cd live-music-collector
   npm install
   ```

2. **Open in VS Code**
   ```bash
   code live-music-collector.code-workspace
   ```

3. **Start Development**
   ```bash
   npm run dev
   ```

### VS Code Setup

The workspace is pre-configured with:
- ESLint and Prettier for code formatting
- Debug configurations for main and renderer processes
- Recommended extensions for Electron/React development
- Claude-Code integration points

### Project Structure

```
live-music-collector/
├── src/
│   ├── main/           # Electron main process
│   │   ├── index.js    # Entry point
│   │   ├── services/   # Database, import, normalization
│   │   └── preload.js  # Preload script
│   └── renderer/       # React frontend
│       ├── components/ # Reusable components
│       ├── pages/      # Route pages
│       ├── services/   # API calls
│       ├── hooks/      # Custom React hooks
│       └── styles/     # Global styles
├── public/             # Static assets
├── docs/               # Documentation
└── tests/              # Test files
```

### Key Technologies

- **Electron**: Desktop application framework
- **React**: UI library
- **better-sqlite3**: Local database
- **music-metadata**: Audio file parsing
- **Vite**: Fast build tool
- **Zustand**: State management

### Database Schema

The application uses a band-agnostic schema supporting multiple artists:
- `bands`: Artist information
- `shows`: Concert records
- `venues`: Location data
- `songs`: Track catalog with abbreviation support
- `recordings`: Different sources of same show
- `tracks`: Individual files with segue information

### Development Commands

```bash
npm run dev          # Start in development mode
npm run build        # Build for production
npm run test         # Run tests
npm run lint         # Lint code
```

### Debugging

1. **Main Process**: Use VS Code debugger with "Debug Main Process" configuration
2. **Renderer Process**: Chrome DevTools opens automatically in dev mode
3. **Both**: Use "Debug All" compound configuration

### Claude-Code Integration

When using Claude-Code:
1. Open the workspace file for proper context
2. Reference `/docs` for design decisions
3. Use the provided prompts in `/docs/claude-prompts.md`

### Building for Distribution

```bash
npm run build        # Build renderer and main
npm run dist         # Package with electron-builder
```

Output will be in `/dist` directory.

## Contributing

1. Follow the existing code style (enforced by ESLint/Prettier)
2. Write tests for new features
3. Update documentation as needed
4. Use conventional commits for clear history

## License

MIT

## Acknowledgments

- Inspired by the live music trading community
- Special focus on Grateful Dead archive preservation
- Built with modern web technologies for desktop