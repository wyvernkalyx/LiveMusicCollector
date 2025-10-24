import React, { useState, useEffect } from 'react';
import styled from '@emotion/styled';
import { Save, Play, Pause, SkipForward, SkipBack, Upload, Search, FolderOpen } from 'lucide-react';
import { theme } from '../styles/globalStyles';
import AlbumMetadataSection from '../components/AlbumMetadataSection';
import TrackMetadataGrid from '../components/TrackMetadataGrid';

const PageContainer = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
  background: ${theme.colors.background.default};
  overflow: hidden;
`;

const Header = styled.div`
  padding: ${theme.spacing.lg};
  border-bottom: 1px solid ${theme.colors.border};
  background: ${theme.colors.background.surface};

  h1 {
    font-size: ${theme.typography.fontSize.xl};
    font-weight: 600;
    margin-bottom: ${theme.spacing.xs};
    color: ${theme.colors.text.primary};
  }

  p {
    color: ${theme.colors.text.secondary};
    font-size: ${theme.typography.fontSize.md};
  }
`;

const MainContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: ${theme.spacing.lg};
  gap: ${theme.spacing.lg};
`;

const Section = styled.div`
  background: ${theme.colors.background.surface};
  border-radius: ${theme.borderRadius.lg};
  padding: ${theme.spacing.lg};
  border: 1px solid ${theme.colors.border};
`;

const TracksSection = styled(Section)`
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
`;

const SectionTitle = styled.h2`
  font-size: ${theme.typography.fontSize.lg};
  font-weight: 600;
  margin-bottom: ${theme.spacing.md};
  color: ${theme.colors.text.primary};
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};
`;

const ActionBar = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.md};
  padding: ${theme.spacing.md} ${theme.spacing.lg};
  background: ${theme.colors.background.surface};
  border-top: 1px solid ${theme.colors.border};
`;

const Button = styled.button`
  padding: ${theme.spacing.sm} ${theme.spacing.lg};
  background: ${props => props.primary ? theme.colors.accent.primary : theme.colors.background.elevated};
  color: ${props => props.primary ? 'white' : theme.colors.text.primary};
  border-radius: ${theme.borderRadius.md};
  font-size: ${theme.typography.fontSize.md};
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: ${theme.spacing.xs};
  transition: all 0.2s;

  &:hover:not(:disabled) {
    background: ${props => props.primary ? theme.colors.accent.secondary : theme.colors.background.hover};
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  svg {
    width: 18px;
    height: 18px;
  }
`;

const LoadSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: ${theme.spacing.xl} ${theme.spacing.lg};
  gap: ${theme.spacing.lg};
  text-align: center;
  min-height: 400px;

  h3 {
    font-size: ${theme.typography.fontSize.lg};
    font-weight: 500;
    color: ${theme.colors.text.primary};
    margin-bottom: ${theme.spacing.sm};
  }

  p {
    color: ${theme.colors.text.secondary};
    font-size: ${theme.typography.fontSize.md};
    max-width: 500px;
  }

  svg {
    width: 64px;
    height: 64px;
    opacity: 0.5;
    color: ${theme.colors.accent.primary};
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: ${theme.spacing.md};
`;

const PlayerControls = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};
  margin-left: auto;
  padding-left: ${theme.spacing.lg};
  border-left: 1px solid ${theme.colors.border};

  button {
    padding: ${theme.spacing.xs} ${theme.spacing.sm};
    background: transparent;
    color: ${theme.colors.text.secondary};
    border-radius: ${theme.borderRadius.sm};

    &:hover {
      background: ${theme.colors.background.elevated};
      color: ${theme.colors.text.primary};
    }

    svg {
      width: 20px;
      height: 20px;
    }
  }
`;

const NowPlaying = styled.div`
  color: ${theme.colors.text.secondary};
  font-size: ${theme.typography.fontSize.sm};
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

/**
 * MetadataEditorPage - Clean, focused interface for editing album and track metadata
 *
 * Features:
 * - Album-level metadata (date, venue, city, state, notes, album art)
 * - Track-level grid with inline editing
 * - Auto-title generation: "Date Venue - City, State - Notes"
 * - Song title format: "Song Name (Date)"
 * - Integrated audio player
 * - ID3/Vorbis tag writing to audio files
 */
const MetadataEditorPage = () => {
  // State for album-level metadata
  const [albumMetadata, setAlbumMetadata] = useState({
    date: '',
    venue: '',
    city: '',
    state: '',
    notes: '',
    artist: 'Grateful Dead', // Default artist
    albumArt: null,
    albumArtUrl: null
  });

  // State for tracks
  const [tracks, setTracks] = useState([]);

  // State for playback
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // State for loading
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  /**
   * Load files from folder or import
   */
  const handleLoadFolder = async () => {
    try {
      const result = await window.api.openDirectory();
      if (result.canceled || !result.filePaths || result.filePaths.length === 0) {
        return;
      }

      const folderPath = result.filePaths[0];
      console.log('Loading folder:', folderPath);

      // Scan folder for audio files
      const scanResult = await window.api.scanFolder(folderPath, {
        includeSubfolders: true,
        audioOnly: true
      });

      if (scanResult.files && scanResult.files.length > 0) {
        // Extract metadata from files
        const loadedTracks = scanResult.files.map((file, index) => ({
          id: `track_${index}`,
          path: file.path,
          filename: file.name,
          trackNumber: index + 1,
          title: file.title || file.name.replace(/\.[^/.]+$/, ''),
          artist: file.artist || albumMetadata.artist,
          date: file.date || albumMetadata.date,
          duration: file.duration || 0,
          format: file.format || '',
          // Album-level metadata will be applied
          venue: file.venue || albumMetadata.venue,
          city: file.city || albumMetadata.city,
          state: file.state || albumMetadata.state
        }));

        setTracks(loadedTracks);

        // Auto-populate album metadata from most common values
        autoPopulateAlbumMetadata(loadedTracks);

        setIsLoaded(true);
      }
    } catch (error) {
      console.error('Error loading folder:', error);
      alert(`Error loading folder: ${error.message}`);
    }
  };

  /**
   * Load files for editing (from library)
   */
  const handleLoadFromLibrary = async () => {
    // TODO: Implement loading from library (show picker)
    alert('Load from library - Coming soon!');
  };

  /**
   * Auto-populate album metadata from track metadata
   */
  const autoPopulateAlbumMetadata = (trackList) => {
    // Find most frequent date
    const dates = trackList.map(t => t.date).filter(Boolean);
    const mostFrequentDate = getMostFrequent(dates);

    // Find most frequent venue
    const venues = trackList.map(t => t.venue).filter(Boolean);
    const mostFrequentVenue = getMostFrequent(venues);

    // Find most frequent city/state
    const cities = trackList.map(t => t.city).filter(Boolean);
    const states = trackList.map(t => t.state).filter(Boolean);

    setAlbumMetadata(prev => ({
      ...prev,
      date: mostFrequentDate || prev.date,
      venue: mostFrequentVenue || prev.venue,
      city: getMostFrequent(cities) || prev.city,
      state: getMostFrequent(states) || prev.state
    }));
  };

  /**
   * Get most frequent value in array
   */
  const getMostFrequent = (arr) => {
    if (!arr || arr.length === 0) return null;

    const counts = {};
    arr.forEach(item => {
      counts[item] = (counts[item] || 0) + 1;
    });

    return Object.keys(counts).reduce((a, b) =>
      counts[a] > counts[b] ? a : b
    );
  };

  /**
   * Handle album metadata changes
   */
  const handleAlbumMetadataChange = (field, value) => {
    setAlbumMetadata(prev => ({
      ...prev,
      [field]: value
    }));
  };

  /**
   * Handle track metadata changes
   */
  const handleTrackChange = (trackId, field, value) => {
    setTracks(prev => prev.map(track =>
      track.id === trackId ? { ...track, [field]: value } : track
    ));
  };

  /**
   * Apply album-level date to all tracks
   */
  const handleApplyDateToAll = () => {
    if (!albumMetadata.date) {
      alert('Please enter a date first');
      return;
    }

    setTracks(prev => prev.map(track => ({
      ...track,
      date: albumMetadata.date
    })));
  };

  /**
   * Save metadata to audio files
   */
  const handleSave = async () => {
    if (tracks.length === 0) {
      alert('No tracks to save');
      return;
    }

    // Validate required fields
    if (!albumMetadata.date) {
      alert('Album date is required');
      return;
    }

    if (!albumMetadata.venue) {
      alert('Venue is required');
      return;
    }

    setIsSaving(true);

    try {
      // Prepare metadata for each track
      const tracksToWrite = tracks.map(track => ({
        path: track.path,
        metadata: {
          title: track.title,
          artist: track.artist || albumMetadata.artist,
          album: generateAlbumTitle(),
          date: track.date || albumMetadata.date,
          trackNumber: track.trackNumber,
          genre: 'Live',
          venue: albumMetadata.venue,
          city: albumMetadata.city,
          state: albumMetadata.state,
          notes: albumMetadata.notes,
          albumArtist: albumMetadata.artist
        }
      }));

      // Write metadata via IPC
      const options = {
        albumArtPath: albumMetadata.albumArt
      };

      const results = await window.api.batchWriteMetadata(tracksToWrite, options);

      // Check results
      const failed = results.filter(r => !r.success);
      if (failed.length > 0) {
        alert(`Warning: ${failed.length} files failed to update. Check console for details.`);
        console.error('Failed files:', failed);
      } else {
        alert('✅ All metadata saved successfully!');
      }
    } catch (error) {
      console.error('Error saving metadata:', error);
      alert(`Error saving metadata: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Generate album title from metadata
   * Format: "Date Venue - City, State - Notes"
   */
  const generateAlbumTitle = () => {
    const parts = [];

    if (albumMetadata.date) parts.push(albumMetadata.date);
    if (albumMetadata.venue) parts.push(albumMetadata.venue);

    let location = '';
    if (albumMetadata.city && albumMetadata.state) {
      location = `${albumMetadata.city}, ${albumMetadata.state}`;
    } else if (albumMetadata.city) {
      location = albumMetadata.city;
    }

    if (location) parts.push(location);
    if (albumMetadata.notes) parts.push(albumMetadata.notes);

    return parts.join(' - ');
  };

  /**
   * Playback controls
   */
  const handlePlayTrack = (track) => {
    setCurrentTrack(track);
    setIsPlaying(true);
    // TODO: Implement actual audio playback
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
    // TODO: Implement play/pause
  };

  const handleNext = () => {
    if (!currentTrack) return;
    const currentIndex = tracks.findIndex(t => t.id === currentTrack.id);
    if (currentIndex < tracks.length - 1) {
      setCurrentTrack(tracks[currentIndex + 1]);
      setIsPlaying(true);
    }
  };

  const handlePrevious = () => {
    if (!currentTrack) return;
    const currentIndex = tracks.findIndex(t => t.id === currentTrack.id);
    if (currentIndex > 0) {
      setCurrentTrack(tracks[currentIndex - 1]);
      setIsPlaying(true);
    }
  };

  return (
    <PageContainer>
      <Header>
        <h1>Metadata Editor</h1>
        <p>Edit album and track metadata with audio preview</p>
      </Header>

      <MainContent>
        {!isLoaded ? (
          <Section>
            <LoadSection>
              <FolderOpen />
              <div>
                <h3>Load Audio Files</h3>
                <p>
                  Select a folder containing audio files to begin editing metadata.
                  Album-level metadata will be applied to all tracks.
                </p>
              </div>
              <ButtonGroup>
                <Button primary onClick={handleLoadFolder}>
                  <FolderOpen />
                  Load Folder
                </Button>
                <Button onClick={handleLoadFromLibrary}>
                  <Upload />
                  Load from Library
                </Button>
              </ButtonGroup>
            </LoadSection>
          </Section>
        ) : (
          <>
            <Section>
              <SectionTitle>Album Metadata</SectionTitle>
              <AlbumMetadataSection
                metadata={albumMetadata}
                onChange={handleAlbumMetadataChange}
                albumTitle={generateAlbumTitle()}
              />
            </Section>

            <TracksSection>
              <SectionTitle>
                Tracks ({tracks.length})
                <Button
                  onClick={handleApplyDateToAll}
                  style={{ marginLeft: 'auto', padding: '4px 12px', fontSize: '14px' }}
                >
                  Apply Date to All
                </Button>
              </SectionTitle>
              <TrackMetadataGrid
                tracks={tracks}
                onTrackChange={handleTrackChange}
                onPlayTrack={handlePlayTrack}
                currentTrack={currentTrack}
                isPlaying={isPlaying}
              />
            </TracksSection>
          </>
        )}
      </MainContent>

      <ActionBar>
        <Button
          primary
          onClick={handleSave}
          disabled={!isLoaded || isSaving || tracks.length === 0}
        >
          <Save />
          {isSaving ? 'Saving...' : 'Save All Metadata'}
        </Button>

        {isLoaded && (
          <Button onClick={() => {
            setIsLoaded(false);
            setTracks([]);
            setCurrentTrack(null);
            setIsPlaying(false);
          }}>
            Load Different Files
          </Button>
        )}

        {currentTrack && (
          <PlayerControls>
            <button onClick={handlePrevious}>
              <SkipBack />
            </button>
            <button onClick={handlePlayPause}>
              {isPlaying ? <Pause /> : <Play />}
            </button>
            <button onClick={handleNext}>
              <SkipForward />
            </button>
            <NowPlaying title={currentTrack.title}>
              {currentTrack.title}
            </NowPlaying>
          </PlayerControls>
        )}
      </ActionBar>
    </PageContainer>
  );
};

export default MetadataEditorPage;
