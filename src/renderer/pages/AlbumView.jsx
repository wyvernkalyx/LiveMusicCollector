import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from '@emotion/styled';
import {
  Music,
  Disc,
  Calendar,
  MapPin,
  Edit,
  Save,
  X,
  ChevronRight,
  ChevronLeft,
  Play,
  Search,
  CheckCircle,
  Clock,
  MessageSquare,
  Hash,
  GripVertical,
  Image
} from 'lucide-react';
import { theme } from '../styles/globalStyles';
import { useStore } from '../store';
import MusicBrainzDialog from '../components/MusicBrainzDialog';

const PageContainer = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
`;

const PageHeader = styled.div`
  background: ${theme.colors.background.surface};
  padding: ${theme.spacing.md} ${theme.spacing.lg};
  border-bottom: 1px solid ${theme.colors.border};
  display: flex;
  align-items: center;
  justify-content: space-between;

  h1 {
    font-size: ${theme.typography.fontSize.xl};
    font-weight: 600;
    margin: 0;
  }

  .subtitle {
    color: ${theme.colors.text.secondary};
    font-size: ${theme.typography.fontSize.md};
    margin-left: ${theme.spacing.md};
  }
`;

const PageContent = styled.div`
  flex: 1;
  display: grid;
  grid-template-columns: 260px 1fr;
  padding: ${theme.spacing.lg};
  gap: ${theme.spacing.lg};
  overflow: hidden;
`;

const AlbumSidebar = styled.div`
  background: ${theme.colors.background.surface};
  border-radius: ${theme.borderRadius.lg};
  padding: ${theme.spacing.xl};
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.lg};
  height: fit-content;
  max-height: calc(100vh - ${theme.spacing.lg} * 4);
  overflow-y: auto;
`;

const AlbumArtwork = styled.div`
  width: 200px;
  height: 200px;
  background: ${theme.colors.background.elevated};
  border-radius: ${theme.borderRadius.md};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border: 2px solid ${theme.colors.border};

  svg {
    width: 64px;
    height: 64px;
    color: ${theme.colors.text.disabled};
  }

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: ${theme.borderRadius.md};
  }
`;

const AlbumInfo = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.md};
`;

const AlbumTitle = styled.div`
  h1 {
    font-size: ${theme.typography.fontSize.xxl};
    font-weight: 700;
    margin-bottom: ${theme.spacing.sm};

    input {
      font-size: inherit;
      font-weight: inherit;
      width: 100%;
      background: transparent;
      border: none;
      border-bottom: 2px solid transparent;

      &:focus {
        outline: none;
        border-bottom-color: ${theme.colors.accent.primary};
      }
    }
  }

  .artist {
    font-size: ${theme.typography.fontSize.lg};
    color: ${theme.colors.text.secondary};

    input {
      font-size: inherit;
      width: 100%;
      background: transparent;
      border: none;
      border-bottom: 1px solid transparent;

      &:focus {
        outline: none;
        border-bottom-color: ${theme.colors.accent.primary};
      }
    }
  }
`;

const AlbumMeta = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: ${theme.spacing.md};
  padding-top: ${theme.spacing.md};
  border-top: 1px solid ${theme.colors.border};
`;

const MetaField = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.xs};

  label {
    font-size: ${theme.typography.fontSize.xs};
    text-transform: uppercase;
    color: ${theme.colors.text.disabled};
    font-weight: 600;
  }

  .value {
    font-size: ${theme.typography.fontSize.sm};
    color: ${theme.colors.text.primary};
    display: flex;
    align-items: center;
    gap: ${theme.spacing.xs};

    svg {
      width: 14px;
      height: 14px;
      color: ${theme.colors.text.secondary};
    }

    input, select {
      width: 100%;
      padding: ${theme.spacing.xs};
      background: ${theme.colors.background.elevated};
      border: 1px solid ${theme.colors.border};
      border-radius: ${theme.borderRadius.sm};
      color: ${theme.colors.text.primary};

      &:focus {
        outline: none;
        border-color: ${theme.colors.accent.primary};
      }
    }
  }
`;

const AlbumActions = styled.div`
  display: flex;
  gap: ${theme.spacing.sm};
  margin-bottom: ${theme.spacing.md};
  flex-wrap: wrap;

  button {
    padding: ${theme.spacing.sm} ${theme.spacing.md};
    border-radius: ${theme.borderRadius.md};
    display: flex;
    align-items: center;
    gap: ${theme.spacing.xs};
    font-size: ${theme.typography.fontSize.sm};
    transition: all ${theme.transitions.fast};

    svg {
      width: 16px;
      height: 16px;
    }

    &.primary {
      background: ${theme.colors.accent.primary};
      color: white;

      &:hover {
        background: ${theme.colors.accent.secondary};
      }
    }

    &.secondary {
      background: ${theme.colors.background.elevated};
      color: ${theme.colors.text.primary};
      border: 1px solid ${theme.colors.border};

      &:hover {
        background: ${theme.colors.background.secondary};
      }
    }

    &.success {
      background: ${theme.colors.status.success};
      color: white;

      &:hover {
        opacity: 0.9;
      }
    }

    &.cancel {
      background: ${theme.colors.status.error};
      color: white;

      &:hover {
        opacity: 0.9;
      }
    }
  }
`;

const AlbumType = styled.div`
  display: inline-flex;
  padding: ${theme.spacing.xs} ${theme.spacing.sm};
  background: ${theme.colors.accent.primary}20;
  color: ${theme.colors.accent.primary};
  border-radius: ${theme.borderRadius.sm};
  font-size: ${theme.typography.fontSize.xs};
  font-weight: 600;
  text-transform: uppercase;
  align-items: center;
  gap: ${theme.spacing.xs};

  &.live {
    background: ${theme.colors.status.success}20;
    color: ${theme.colors.status.success};
  }

  &.compilation {
    background: ${theme.colors.status.warning}20;
    color: ${theme.colors.status.warning};
  }
`;

const TracksSection = styled.div`
  background: ${theme.colors.background.surface};
  border-radius: ${theme.borderRadius.lg};
  display: flex;
  flex-direction: column;
  overflow: hidden;
  height: calc(100vh - ${theme.spacing.lg} * 4);
`;

const TracksHeader = styled.div`
  padding: ${theme.spacing.md} ${theme.spacing.lg};
  border-bottom: 1px solid ${theme.colors.border};
  display: flex;
  justify-content: space-between;
  align-items: center;

  h2 {
    font-size: ${theme.typography.fontSize.md};
    font-weight: 600;
  }

  .track-count {
    color: ${theme.colors.text.secondary};
    font-size: ${theme.typography.fontSize.sm};
  }
`;

const TracksTable = styled.div`
  flex: 1;
  overflow-y: auto;
`;

const Track = styled.div`
  display: grid;
  grid-template-columns: ${props => props.editMode
    ? '32px 60px 2fr 120px 80px 40px minmax(150px, 250px)'
    : '60px 2fr 120px 80px minmax(150px, 250px)'};
  align-items: center;
  padding: ${theme.spacing.sm} ${theme.spacing.md};
  border-bottom: 1px solid ${theme.colors.border};
  gap: ${theme.spacing.sm};
  transition: background ${theme.transitions.fast};
  position: relative;

  &:hover {
    background: ${theme.colors.background.elevated}50;
  }

  &.selected {
    background: ${theme.colors.accent.primary}10;
  }

  &.playing {
    background: ${theme.colors.accent.primary}15;
    border-left: 3px solid ${theme.colors.accent.primary};

    .track-number {
      color: ${theme.colors.accent.primary};
      font-weight: 700;
    }

    &::before {
      content: '♪';
      position: absolute;
      left: 5px;
      color: ${theme.colors.accent.primary};
      animation: pulse 1.5s ease-in-out infinite;
    }
  }

  @keyframes pulse {
    0% { opacity: 1; }
    50% { opacity: 0.5; }
    100% { opacity: 1; }
  }

  &.dragging {
    opacity: 0.5;
  }

  &.disc-break {
    border-top: 3px solid ${theme.colors.accent.primary};
  }

  .drag-handle {
    cursor: grab;
    color: ${theme.colors.text.disabled};

    &:active {
      cursor: grabbing;
    }
  }

  .track-number {
    font-weight: 600;
    color: ${theme.colors.text.secondary};
    font-family: 'Monaco', 'Consolas', monospace;
    font-size: ${theme.typography.fontSize.sm};
    text-align: center;
  }

  .track-title {
    font-weight: 500;
    font-size: ${theme.typography.fontSize.sm};
    word-wrap: break-word;
    overflow-wrap: break-word;
    white-space: normal;
    line-height: 1.4;
    padding-right: ${theme.spacing.sm};

    input {
      width: 100%;
      padding: ${theme.spacing.xs};
      background: transparent;
      border: 1px solid transparent;
      border-radius: ${theme.borderRadius.sm};
      font-size: ${theme.typography.fontSize.sm};

      &:hover {
        background: ${theme.colors.background.elevated};
        border-color: ${theme.colors.border};
      }

      &:focus {
        outline: none;
        background: ${theme.colors.background.elevated};
        border-color: ${theme.colors.accent.primary};
      }
    }
  }

  .track-duration {
    font-family: 'Monaco', 'Consolas', monospace;
    color: ${theme.colors.text.secondary};
    font-size: ${theme.typography.fontSize.sm};
    text-align: center;
  }

  .segue-toggle {
    width: 28px;
    height: 16px;
    background: ${theme.colors.background.elevated};
    border: 1px solid ${theme.colors.border};
    border-radius: 8px;
    position: relative;
    cursor: pointer;
    transition: all ${theme.transitions.fast};
    margin: 0 auto;

    &.active {
      background: ${theme.colors.accent.primary};
      border-color: ${theme.colors.accent.primary};

      &::after {
        transform: translateX(10px);
      }
    }

    &::after {
      content: '';
      position: absolute;
      top: 1px;
      left: 1px;
      width: 12px;
      height: 12px;
      background: white;
      border-radius: 50%;
      transition: transform ${theme.transitions.fast};
    }
  }

  .track-comment {
    font-size: ${theme.typography.fontSize.sm};
    color: ${theme.colors.text.secondary};

    input {
      width: 100%;
      padding: ${theme.spacing.xs};
      background: transparent;
      border: 1px solid transparent;
      border-radius: ${theme.borderRadius.sm};
      font-size: ${theme.typography.fontSize.sm};

      &:hover {
        background: ${theme.colors.background.elevated};
        border-color: ${theme.colors.border};
      }

      &:focus {
        outline: none;
        background: ${theme.colors.background.elevated};
        border-color: ${theme.colors.accent.primary};
      }
    }
  }

`;

const TracksTableHeader = styled.div`
  display: grid;
  grid-template-columns: ${props => props.editMode
    ? '32px 60px 2fr 120px 80px 40px minmax(150px, 250px)'
    : '60px 2fr 120px 80px minmax(150px, 250px)'};
  align-items: center;
  padding: ${theme.spacing.sm} ${theme.spacing.md};
  gap: ${theme.spacing.sm};
  background: ${theme.colors.background.elevated};
  border-bottom: 2px solid ${theme.colors.border};
  font-size: ${theme.typography.fontSize.xs};
  font-weight: 600;
  color: ${theme.colors.text.secondary};
  position: sticky;
  top: 0;
  z-index: 1;

  .center {
    text-align: center;
  }
`;

function AlbumView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { shows, fetchShows, playTrack, setPlaylist, player } = useStore();
  const currentTrack = player?.currentTrack;

  const [editMode, setEditMode] = React.useState(false);
  const [showMusicBrainz, setShowMusicBrainz] = React.useState(false);
  const [album, setAlbum] = React.useState(null);
  const [tracks, setTracks] = React.useState([]);
  const [albumType, setAlbumType] = React.useState('album');
  const [isDragging, setIsDragging] = React.useState(false);
  const [draggedTrack, setDraggedTrack] = React.useState(null);

  React.useEffect(() => {
    fetchShows();
    loadAlbum();
  }, [id]);

  const loadAlbum = async () => {
    try {
      // Load show/album data
      const showData = await window.api.getShow(parseInt(id));
      setAlbum(showData);

      // Load tracks
      const tracksData = await window.api.getTracksByShow(parseInt(id));
      setTracks(tracksData);

      // Detect album type
      detectAlbumType(showData, tracksData);
    } catch (error) {
      console.error('Error loading album:', error);
    }
  };

  const detectAlbumType = (albumData, tracksData) => {
    // If has venue, it's likely a concert
    if (albumData.venue_name && albumData.venue_name !== 'Unknown Venue') {
      setAlbumType('live');
      return;
    }

    // Check if tracks have different dates (compilation)
    const dates = new Set(tracksData.map(t => t.performance_date || t.date).filter(Boolean));
    if (dates.size > 1) {
      setAlbumType('compilation');
      return;
    }

    // Check for official release markers
    if (albumData.notes?.includes('Anniversary') ||
        albumData.notes?.includes('Picks') ||
        albumData.source_type === 'OFFICIAL') {
      setAlbumType('official');
      return;
    }

    // Default to studio album
    setAlbumType('album');
  };

  const formatTrackTitle = (track) => {
    let title = track.song_name || track.song_title || track.title || 'Unknown Track';

    if (track.has_segue || track.segue_type === '>') {
      title += ' >';
    }

    if (track.performance_date) {
      title += ` (${track.performance_date})`;
    }

    return title;
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSave = async () => {
    try {
      // Save album metadata
      await window.api.bulkUpdateShows([{
        showId: album.id,
        updates: {
          date: album.date,
          notes: album.notes,
          artwork: album.artwork, // Preserve the artwork URL
          releaseVersion: album.releaseVersion,
          originalReleaseDate: album.originalReleaseDate,
          label: album.label,
          catalogNumber: album.catalogNumber,
          isLive: album.isLive,
          discCount: album.discCount,
          venue: {
            name: album.venue_name,
            city: album.city,
            state: album.state
          }
        }
      }]);

      // Save track updates
      for (const track of tracks) {
        await window.api.updateTrack(track.id, {
          track_number: track.track_number,
          song_name: track.song_name || track.song_title,
          performance_date: track.recording_date || track.performance_date || track.date,
          has_segue: track.has_segue,
          comment: track.comment
        });
      }

      setEditMode(false);
      await loadAlbum(); // Reload data
    } catch (error) {
      console.error('Error saving changes:', error);
    }
  };

  const handleCancel = () => {
    setEditMode(false);
    loadAlbum(); // Reload original data
  };

  const handleTrackChange = (trackId, field, value) => {
    setTracks(tracks.map(track =>
      track.id === trackId
        ? { ...track, [field]: value }
        : track
    ));
  };

  const handleDragStart = (e, track, index) => {
    setIsDragging(true);
    setDraggedTrack({ track, index });
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (!draggedTrack || draggedTrack.index === index) return;

    const newTracks = [...tracks];
    const [removed] = newTracks.splice(draggedTrack.index, 1);
    newTracks.splice(index, 0, removed);

    // Update track numbers
    newTracks.forEach((track, i) => {
      track.track_number = i + 1;
    });

    setTracks(newTracks);
    setDraggedTrack({ ...draggedTrack, index });
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    setDraggedTrack(null);
  };

  const handleMusicBrainzApply = (mbData) => {
    // Apply MusicBrainz data to album and tracks
    setAlbum({
      ...album,
      band_name: mbData.artist || album.band_name,
      notes: mbData.album || album.notes,
      date: mbData.date || album.date,
      originalReleaseDate: mbData.originalReleaseDate,
      releaseVersion: mbData.releaseVersion,
      label: mbData.label,
      catalogNumber: mbData.catalogNumber,
      isLive: mbData.isLive,
      discCount: mbData.discCount,
      artwork: mbData.coverArt?.medium || mbData.coverArt?.small || album.artwork
    });

    // Update tracks if provided with enhanced metadata
    if (mbData.tracks) {
      const updatedTracks = tracks.map((track, index) => {
        const mbTrack = mbData.tracks[index];
        if (mbTrack) {
          return {
            ...track,
            song_name: mbTrack.title || track.song_name,
            duration: mbTrack.duration || track.duration,
            track_number: mbTrack.discTrackNumber || mbTrack.position || track.track_number,
            disc_number: mbTrack.discNumber || track.disc_number,
            has_segue: mbTrack.hasSegue || track.has_segue,
            recording_date: mbTrack.recordingDate || track.recording_date
          };
        }
        return track;
      });
      setTracks(updatedTracks);
    }

    setShowMusicBrainz(false);
  };

  const getTotalDuration = () => {
    const totalSeconds = tracks.reduce((sum, track) => sum + (track.duration || 0), 0);
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getAlbumTypeLabel = () => {
    switch (albumType) {
      case 'live': return 'Live Concert';
      case 'compilation': return 'Compilation';
      case 'official': return 'Official Release';
      default: return 'Studio Album';
    }
  };

  const handlePlayAlbum = async () => {
    if (tracks.length > 0) {
      // Ensure tracks have proper title field
      const tracksWithTitles = tracks.map(t => ({
        ...t,
        title: t.song_name || t.song_title || t.title || 'Unknown Track'
      }));
      // Set the playlist to all tracks
      setPlaylist(tracksWithTitles);
      // Play the first track
      await playTrack(tracksWithTitles[0]);
    }
  };

  const handlePlayTrack = async (track) => {
    // Ensure tracks have proper title field
    const tracksWithTitles = tracks.map(t => ({
      ...t,
      title: t.song_name || t.song_title || t.title || 'Unknown Track'
    }));
    // Set the playlist to all tracks starting from this one
    const trackIndex = tracksWithTitles.findIndex(t => t.id === track.id);
    const playlist = tracksWithTitles.slice(trackIndex);
    setPlaylist(playlist);
    // Play the selected track with title
    const trackWithTitle = {
      ...track,
      title: track.song_name || track.song_title || track.title || 'Unknown Track'
    };
    await playTrack(trackWithTitle);
  };

  if (!album) {
    return <PageContainer>Loading...</PageContainer>;
  }

  return (
    <PageContainer>
      <PageHeader>
        <div>
          <h1>
            {album.notes || `${album.date} - ${album.venue_name}` || 'Untitled Album'}
            <br />
            <span className="subtitle" style={{ fontSize: '0.75em', fontWeight: 'normal' }}>
              {album.band_name || 'Grateful Dead'}
            </span>
          </h1>
        </div>
        <AlbumActions>
          {editMode ? (
            <>
              <button className="secondary" onClick={() => setShowMusicBrainz(true)}>
                <Search /> Lookup from MusicBrainz
              </button>
              <button className="success" onClick={handleSave}>
                <Save /> Save Changes
              </button>
              <button className="cancel" onClick={handleCancel}>
                <X /> Cancel
              </button>
            </>
          ) : (
            <>
              <button className="secondary" onClick={() => setEditMode(true)}>
                <Edit /> Edit Metadata
              </button>
              <button className="secondary" onClick={() => setShowMusicBrainz(true)}>
                <Search /> Lookup from MusicBrainz
              </button>
              <button className="primary" onClick={handlePlayAlbum}>
                <Play /> Play Album
              </button>
            </>
          )}
        </AlbumActions>
      </PageHeader>

      <PageContent>
        <AlbumSidebar>
          <AlbumArtwork>
          {album.artwork ? (
            <img src={album.artwork} alt={album.notes || 'Album artwork'} />
          ) : (
            <Disc />
          )}
        </AlbumArtwork>

        <AlbumInfo>
          <AlbumType className={albumType}>
            {getAlbumTypeLabel()}
          </AlbumType>

          <AlbumMeta>
            <MetaField>
              <label>Release Date</label>
              <div className="value">
                <Calendar />
                {editMode ? (
                  <input
                    type="text"
                    value={album.date || ''}
                    onChange={(e) => setAlbum({ ...album, date: e.target.value })}
                    placeholder="yyyy-mm-dd"
                  />
                ) : (
                  album.date || 'Unknown'
                )}
              </div>
            </MetaField>

            {album.originalReleaseDate && album.originalReleaseDate !== album.date && (
              <MetaField>
                <label>Original Release</label>
                <div className="value">
                  <Calendar />
                  {album.originalReleaseDate}
                </div>
              </MetaField>
            )}

            {(albumType === 'live' || album.venue_name) && (
              <MetaField>
                <label>Venue</label>
                <div className="value">
                  <MapPin />
                  {editMode ? (
                    <input
                      type="text"
                      value={album.venue_name || ''}
                      onChange={(e) => setAlbum({ ...album, venue_name: e.target.value })}
                      placeholder="Venue name..."
                    />
                  ) : (
                    album.venue_name || 'Unknown Venue'
                  )}
                </div>
              </MetaField>
            )}

            {(album.city || album.state) && (
              <MetaField>
                <label>Location</label>
                <div className="value">
                  <MapPin />
                  {editMode ? (
                    <input
                      type="text"
                      value={`${album.city || ''}, ${album.state || ''}`}
                      onChange={(e) => {
                        const [city, state] = e.target.value.split(',').map(s => s.trim());
                        setAlbum({ ...album, city, state });
                      }}
                      placeholder="City, State"
                    />
                  ) : (
                    `${album.city || ''}, ${album.state || ''}`
                  )}
                </div>
              </MetaField>
            )}

            <MetaField>
              <label>Tracks</label>
              <div className="value">
                <Music />
                {tracks.length} tracks • {getTotalDuration()}
              </div>
            </MetaField>

            {album.source_type && (
              <MetaField>
                <label>Source</label>
                <div className="value">
                  {editMode ? (
                    <select
                      value={album.source_type}
                      onChange={(e) => setAlbum({ ...album, source_type: e.target.value })}
                    >
                      <option value="SBD">Soundboard</option>
                      <option value="AUD">Audience</option>
                      <option value="MATRIX">Matrix</option>
                      <option value="OFFICIAL">Official</option>
                    </select>
                  ) : (
                    album.source_type
                  )}
                </div>
              </MetaField>
            )}
          </AlbumMeta>
        </AlbumInfo>
        </AlbumSidebar>

        <TracksSection>
        <TracksHeader>
          <h2>Track List</h2>
          <div className="track-count">
            {tracks.length} tracks • {getTotalDuration()} total
          </div>
        </TracksHeader>

        <TracksTable>
          <TracksTableHeader editMode={editMode}>
            {editMode && <div></div>}
            <div className="center">#</div>
            <div>Title</div>
            <div className="center">Date</div>
            <div className="center">Duration</div>
            {editMode && <div className="center">Segue</div>}
            <div>Comment</div>
          </TracksTableHeader>

          {tracks.map((track, index) => {
            const isDiscBreak = index > 0 &&
              Math.floor(track.track_number / 100) !== Math.floor(tracks[index - 1].track_number / 100);

            return (
              <Track
                key={track.id}
                className={`
                  ${isDiscBreak ? 'disc-break' : ''}
                  ${draggedTrack?.track.id === track.id ? 'dragging' : ''}
                  ${currentTrack?.id === track.id ? 'playing' : ''}
                `}
                editMode={editMode}
                draggable={editMode}
                onDragStart={(e) => handleDragStart(e, track, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                onDoubleClick={() => !editMode && handlePlayTrack(track)}
                style={{ cursor: editMode ? 'move' : 'pointer' }}
              >
                {editMode && (
                  <div className="drag-handle">
                    <GripVertical />
                  </div>
                )}

                <div className="track-number">
                  {track.track_number || index + 1}
                </div>

                <div className="track-title">
                  {editMode ? (
                    <input
                      type="text"
                      value={track.song_name || track.song_title || track.title || ''}
                      onChange={(e) => handleTrackChange(track.id, 'song_name', e.target.value)}
                      placeholder="Track title..."
                    />
                  ) : (
                    formatTrackTitle(track)
                  )}
                </div>

                <div className="track-date" style={{
                  textAlign: 'center',
                  fontSize: theme.typography.fontSize.xs,
                  color: theme.colors.text.secondary
                }}>
                  {editMode ? (
                    <input
                      type="text"
                      value={track.recording_date || track.performance_date || track.date || ''}
                      onChange={(e) => handleTrackChange(track.id, 'recording_date', e.target.value)}
                      placeholder="yyyy-mm-dd"
                      style={{
                        width: '100%',
                        padding: theme.spacing.xs,
                        background: 'transparent',
                        border: '1px solid transparent',
                        borderRadius: theme.borderRadius.sm,
                        fontSize: theme.typography.fontSize.xs,
                        textAlign: 'center'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.background = theme.colors.background.elevated;
                        e.target.style.borderColor = theme.colors.border;
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.background = 'transparent';
                        e.target.style.borderColor = 'transparent';
                      }}
                      onFocus={(e) => {
                        e.target.style.outline = 'none';
                        e.target.style.background = theme.colors.background.elevated;
                        e.target.style.borderColor = theme.colors.accent.primary;
                      }}
                      onBlur={(e) => {
                        e.target.style.background = 'transparent';
                        e.target.style.borderColor = 'transparent';
                      }}
                    />
                  ) : (
                    track.recording_date || track.performance_date || track.date || '-'
                  )}
                </div>

                <div className="track-duration">
                  {formatDuration(track.duration)}
                </div>

                {editMode && (
                  <div
                    className={`segue-toggle ${track.has_segue ? 'active' : ''}`}
                    onClick={() => handleTrackChange(track.id, 'has_segue', !track.has_segue)}
                  />
                )}

                <div className="track-comment">
                  {editMode ? (
                    <input
                      type="text"
                      value={track.comment || ''}
                      onChange={(e) => handleTrackChange(track.id, 'comment', e.target.value)}
                      placeholder="Add comment..."
                    />
                  ) : (
                    track.comment
                  )}
                </div>

              </Track>
            );
          })}
        </TracksTable>
      </TracksSection>
      </PageContent>

      {showMusicBrainz && (
        <MusicBrainzDialog
          initialData={{
            artist: album.band_name || 'Grateful Dead',
            album: album.notes || '',
            date: album.date,
            trackCount: tracks.length
          }}
          onApply={handleMusicBrainzApply}
          onClose={() => setShowMusicBrainz(false)}
        />
      )}
    </PageContainer>
  );
}

export default AlbumView;