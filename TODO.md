# TODO - Live Music Collector

## ✅ Completed Features
- [x] MusicBrainz integration with album artwork
- [x] Audio playback with FLAC support via HTTP streaming
- [x] Collapsible sidebar navigation
- [x] Track metadata editing (dates, titles, etc.)
- [x] Auto-play next track in playlist
- [x] Two-column album view layout
- [x] Disc-based track numbering for multi-disc albums
- [x] Cover Art Archive integration
- [x] Track table column alignment fixes

## 🔧 Bug Fixes Needed
- [ ] Handle missing audio files gracefully
- [ ] Improve error messages for unsupported audio formats
- [ ] Fix duplicate dev server instances on restart
- [ ] Persist sidebar collapsed state between sessions
- [ ] Handle MusicBrainz rate limiting with retry logic

## 🎵 Audio Player Enhancements
- [ ] Volume control persistence
- [ ] Shuffle mode
- [ ] Repeat modes (none, all, one)
- [ ] Keyboard shortcuts (space for play/pause, arrow keys for seek)
- [ ] Waveform visualization
- [ ] Gapless playback for live albums
- [ ] Queue management (add to queue, clear queue, reorder)
- [ ] Playback speed control
- [ ] Equalizer settings

## 📊 Main Library View
- [ ] Implement grid view for albums/shows
- [ ] Add list view with sortable columns
- [ ] Search and filter functionality
- [ ] Year/decade grouping
- [ ] Statistics dashboard (total shows, tracks, duration, etc.)
- [ ] Recently played section
- [ ] Most played tracks/albums
- [ ] Random album suggestion

## 🔍 Search & Discovery
- [ ] Advanced search with multiple criteria
- [ ] Smart playlists based on criteria
- [ ] Similar show recommendations
- [ ] Tour/year navigation
- [ ] Setlist.fm integration for setlists
- [ ] Show notes and reviews

## 📁 Import & Organization
- [ ] Batch import with progress indication
- [ ] Duplicate detection
- [ ] Auto-organize files based on metadata
- [ ] Import from Archive.org
- [ ] Export playlists (M3U, PLS)
- [ ] Backup and restore database

## 🎨 UI/UX Improvements
- [ ] Dark/Light theme toggle
- [ ] Customizable color schemes
- [ ] Responsive design for different screen sizes
- [ ] Drag and drop file import
- [ ] Context menus for tracks and albums
- [ ] Breadcrumb navigation
- [ ] Keyboard navigation throughout app
- [ ] Toast notifications for actions
- [ ] Loading states and skeletons

## 📝 Metadata Management
- [ ] Bulk metadata editing
- [ ] Auto-fetch missing metadata
- [ ] Custom tags and genres
- [ ] Lyrics support
- [ ] Concert posters and memorabilia
- [ ] Venue information and maps
- [ ] Recording source details (taper, equipment)
- [ ] Personal ratings and notes

## 🔗 Integrations
- [ ] Last.fm scrobbling
- [ ] Discord rich presence
- [ ] Plex/Jellyfin media server export
- [ ] Social sharing features
- [ ] Concert ticket stub scanning
- [ ] Spotify playlist import/export

## 📱 Additional Features
- [ ] Mini player mode
- [ ] System tray integration
- [ ] Global hotkeys
- [ ] Chromecast support
- [ ] AirPlay support
- [ ] Mobile companion app
- [ ] Cloud sync for library metadata
- [ ] Offline mode with cached data

## 🏗️ Technical Improvements
- [ ] Add comprehensive test coverage
- [ ] Performance optimization for large libraries
- [ ] Lazy loading for track lists
- [ ] Virtual scrolling for long lists
- [ ] WebWorker for heavy computations
- [ ] Better error boundaries
- [ ] Logging system with levels
- [ ] Auto-update mechanism
- [ ] Installer with file association

## 📚 Documentation
- [ ] User manual
- [ ] API documentation
- [ ] Contributing guidelines
- [ ] Video tutorials
- [ ] Keyboard shortcuts reference
- [ ] FAQ section

## Priority for Next Session
1. **Main library view** - Grid/list view for all shows
2. **Search functionality** - Basic search across shows/tracks
3. **Import improvements** - Better progress indication and batch import
4. **Keyboard shortcuts** - Space to play/pause, arrows to seek
5. **Settings page** - Theme, library path, audio preferences

## Notes
- Focus on core music library features before advanced integrations
- Ensure all basic CRUD operations work smoothly
- Prioritize performance for large music collections (10,000+ tracks)
- Keep the UI clean and focused on the music listening experience