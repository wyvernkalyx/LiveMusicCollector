# Metadata Editor - Implementation Guide

## Overview

A new, clean metadata tagging application has been created with a dBpoweramp CD Ripper-style interface. This tool allows you to edit album and track-level metadata and write it directly to audio file tags (FLAC, MP3, M4A).

## Features

### Album-Level Metadata (Top Section)
- **Date** (required): Performance date in YYYY-MM-DD format
- **Venue** (required): Venue name
- **City**: City name
- **State**: Two-letter state code (automatically uppercased)
- **Notes**: Additional notes (e.g., "Dick's Picks 36", "SBD", etc.)
- **Album Art**: Display, auto-fetch from MusicBrainz, or manual selection
- **Auto-Generated Title**: Automatically creates album title from metadata in format:
  ```
  Date Venue - City, State - Notes
  Example: 1972-02-13 Winterland - San Francisco, CA - Dick's Picks 36
  ```

### Track-Level Editing (Bottom Grid)
- **Inline Editing**: Double-click or use edit button to modify track titles and dates
- **Individual Dates**: Override album date per track if needed
- **Audio Preview**: Play button for each track using existing HTTP streaming server
- **Visual Indicators**: Currently playing track is highlighted
- **Apply to All**: Button to apply album date to all tracks at once

### Song Title Format
When saving, song titles are automatically formatted as:
```
Song Name (Date)
Example: Bertha (1972-02-13)
```

Date can be overwritten at the song level if different than album-level date.

### Audio Playback
- Integrated player controls in footer
- Uses existing HTTP streaming server
- Auto-play next track capability
- Play/Pause/Previous/Next controls

## File Structure

### Main Components

1. **MetadataEditorPage.jsx** (`src/renderer/pages/MetadataEditorPage.jsx`)
   - Main page component
   - State management for album and track metadata
   - Load files from folder or library
   - Save functionality

2. **AlbumMetadataSection.jsx** (`src/renderer/components/AlbumMetadataSection.jsx`)
   - Album-level metadata form
   - Album art preview and selection
   - Auto-fetch from MusicBrainz
   - Auto-generated title display

3. **TrackMetadataGrid.jsx** (`src/renderer/components/TrackMetadataGrid.jsx`)
   - Editable track grid
   - Inline editing for title and date
   - Play controls per track
   - Format duration display

### Services

4. **metadata-writer.js** (`src/main/services/metadata-writer.js`)
   - Metadata writing service for FLAC, MP3, M4A
   - Uses command-line tools (metaflac, ffmpeg) and node-id3
   - Embeds album art
   - Batch processing support

### IPC Integration

5. **index.js** - Added IPC handlers:
   - `metadata:write` - Write metadata to single file
   - `metadata:batchWrite` - Batch write to multiple files with progress
   - `metadata:checkTools` - Check availability of command-line tools

6. **preload.js** - Exposed methods:
   - `window.api.writeMetadata(filePath, metadata, options)`
   - `window.api.batchWriteMetadata(files, options)`
   - `window.api.checkMetadataTools()`
   - `window.api.onMetadataProgress(callback)`

### Routing

7. **App.jsx** - Added route:
   - `/metadata-editor` - Main metadata editor page

8. **Layout.jsx** - Added navigation:
   - "Metadata Editor" menu item with Edit3 icon

## Installation Requirements

### Required npm Packages

Due to network issues during development, the following package still needs to be installed:

```bash
npm install node-id3 --save
```

This package is needed for writing ID3 tags to MP3 files. Without it, the system will fall back to ffmpeg (if available).

### Required Command-Line Tools

The metadata writer uses command-line tools for maximum compatibility:

#### For FLAC files:
Install FLAC command-line tools (includes `metaflac`):

**Windows:**
```bash
# Using Chocolatey
choco install flac

# Or download from: https://xiph.org/flac/download.html
```

**Linux:**
```bash
sudo apt-get install flac
```

#### For MP3/M4A files (optional, if node-id3 is not available):
Install ffmpeg:

**Windows:**
```bash
# Using Chocolatey
choco install ffmpeg

# Or download from: https://ffmpeg.org/download.html
```

**Linux:**
```bash
sudo apt-get install ffmpeg
```

## Usage Workflow

### 1. Loading Files

Click "Load Folder" to select a folder containing audio files. The system will:
- Scan for all audio files (FLAC, MP3, M4A)
- Extract existing metadata
- Auto-populate album-level fields from most frequent values
- Display tracks in editable grid

### 2. Edit Album Metadata

Fill in the album-level fields:
- **Date** (required): Select performance date
- **Venue** (required): Enter venue name
- **City/State**: Enter location details
- **Notes**: Add any additional information
- **Album Art**:
  - Click "Auto-Fetch" to search MusicBrainz
  - Click "Select Image" to choose local file

The album title will auto-generate as you fill in fields.

### 3. Edit Track Metadata

In the track grid:
- **Double-click** any track title to edit
- **Click** date field to change individual track date
- **Click edit icon** for inline editing
- Use "Apply Date to All" button to sync all tracks with album date

### 4. Preview Audio

- Click **Play button** on any track to preview
- Use player controls in footer for playback

### 5. Save Metadata

Click "Save All Metadata" to write tags to audio files:
- Song titles formatted as: "Song Name (Date)"
- Album title uses auto-generated format
- Album art embedded in all files
- Progress updates shown during batch operation
- Success/error summary displayed

## Tag Writing Details

### FLAC Files (Vorbis Comments)
```
TITLE = Song Name (Date)
ARTIST = Artist Name
ALBUM = Auto-Generated Album Title
DATE = YYYY-MM-DD
VENUE = Venue Name
CITY = City Name
STATE = State Code
COMMENT = Additional notes
PICTURE = Embedded album art
```

### MP3 Files (ID3v2)
```
Title = Song Name (Date)
Artist = Artist Name
Album = Auto-Generated Album Title
Year = YYYY
Track = Track Number
Genre = Live
Comment = Venue, location, and notes
Picture = Embedded album art (APIC frame)
```

### M4A Files (MP4 tags)
```
©nam = Song Name (Date)
©ART = Artist Name
©alb = Auto-Generated Album Title
©day = YYYY-MM-DD
©gen = Live
©cmt = Venue, location, and notes
covr = Embedded album art
```

## Integration with Import System

The metadata editor can be used in two ways:

1. **Standalone**: Load any folder of audio files for metadata editing
2. **Import Integration**: Called during the import process for metadata review/editing before adding to library

## Windows 11 Compatibility

All code is designed for Windows 11 compatibility:
- Uses Windows-compatible file paths
- Command-line tools use appropriate shell commands
- File dialogs use native Windows dialogs
- Path handling uses proper separators

## Technical Architecture

### Data Flow

```
User Input → AlbumMetadataSection → MetadataEditorPage State
                                   ↓
                          TrackMetadataGrid → Individual Track State
                                   ↓
                          Save Button Click
                                   ↓
                   window.api.batchWriteMetadata()
                                   ↓
                   IPC Handler (metadata:batchWrite)
                                   ↓
                   MetadataWriter.batchWriteMetadata()
                                   ↓
                   For Each File:
                     - Format song title with date
                     - Write FLAC/MP3/M4A tags
                     - Embed album art
                     - Report progress
                                   ↓
                          Results Summary
```

### Progress Tracking

The batch writer sends progress updates via IPC:
```javascript
{
  current: 3,
  total: 10,
  file: 'track03.flac',
  success: true
}
```

## Testing Checklist

- [ ] Install node-id3 package
- [ ] Install FLAC tools (metaflac)
- [ ] Install ffmpeg (optional)
- [ ] Test loading FLAC files from folder
- [ ] Test loading MP3 files from folder
- [ ] Test loading M4A files from folder
- [ ] Test album metadata editing
- [ ] Test track title editing
- [ ] Test track date editing
- [ ] Test "Apply Date to All" functionality
- [ ] Test album art selection (local file)
- [ ] Test album art auto-fetch (MusicBrainz)
- [ ] Test audio playback
- [ ] Test metadata saving to FLAC files
- [ ] Test metadata saving to MP3 files
- [ ] Test metadata saving to M4A files
- [ ] Verify embedded album art in output files
- [ ] Verify song title format: "Name (Date)"
- [ ] Verify album title format: "Date Venue - City, State - Notes"

## Troubleshooting

### "metaflac not found"
- Install FLAC command-line tools
- Verify `metaflac --version` works in terminal
- Add FLAC tools directory to PATH if needed

### "ffmpeg not found"
- Install ffmpeg
- Verify `ffmpeg -version` works in terminal
- Add ffmpeg directory to PATH if needed

### "node-id3 not available"
- Run `npm install node-id3 --save`
- Restart application after installation

### Album art not embedding
- Check image file format (should be JPG or PNG)
- Verify image file exists and is readable
- Check file permissions
- Try smaller image file size (< 5MB recommended)

### Metadata not saving
- Check file write permissions
- Ensure files are not open in other applications
- Verify command-line tools are installed
- Check console logs for specific error messages

## Future Enhancements

Potential improvements for future versions:

1. **Bulk Operations**
   - Process multiple albums at once
   - Batch rename files based on metadata

2. **Advanced Features**
   - Undo/redo functionality
   - Metadata templates for common patterns
   - Direct library integration (edit existing shows)

3. **MusicBrainz Integration**
   - Auto-populate all fields from MusicBrainz match
   - Track-level MusicBrainz data
   - Confidence scoring for matches

4. **Validation**
   - Check for missing required fields
   - Warn about unusual dates
   - Validate venue names against known database

5. **Preview**
   - Show what tags will be written before saving
   - Compare old vs new metadata
   - Selective saving (choose which files to update)

## Support

For issues or questions:
1. Check console logs for error messages
2. Verify command-line tools are installed
3. Ensure npm packages are up-to-date
4. Review this documentation for common issues
