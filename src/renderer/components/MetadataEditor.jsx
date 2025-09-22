import React, { useState, useEffect, useRef } from 'react';
import styled from '@emotion/styled';
import { X, Save, ChevronLeft, ChevronRight, Music, Calendar, MapPin, Hash, ChevronDown, Image, Upload, ExternalLink, Wand2 } from 'lucide-react';
import { theme } from '../styles/globalStyles';

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const Dialog = styled.div`
  background: ${theme.colors.background.surface};
  border-radius: 12px;
  width: 90%;
  max-width: 900px;
  height: 85vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const Header = styled.div`
  padding: ${theme.spacing.lg};
  border-bottom: 1px solid ${theme.colors.border};
  display: flex;
  justify-content: space-between;
  align-items: center;

  h2 {
    font-size: 20px;
    font-weight: 600;
    color: ${theme.colors.text.primary};
    display: flex;
    align-items: center;
    gap: ${theme.spacing.sm};
  }

  .close-btn {
    background: transparent;
    border: none;
    color: ${theme.colors.text.secondary};
    cursor: pointer;
    padding: ${theme.spacing.xs};

    &:hover {
      color: ${theme.colors.text.primary};
    }
  }
`;

const TabContainer = styled.div`
  display: flex;
  border-bottom: 1px solid ${theme.colors.border};
  padding: 0 ${theme.spacing.lg};
`;

const Tab = styled.button`
  background: transparent;
  border: none;
  padding: ${theme.spacing.md} ${theme.spacing.lg};
  color: ${props => props.active ? theme.colors.accent.primary : theme.colors.text.secondary};
  font-size: 14px;
  font-weight: ${props => props.active ? '600' : '400'};
  border-bottom: 2px solid ${props => props.active ? theme.colors.accent.primary : 'transparent'};
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    color: ${theme.colors.text.primary};
  }
`;

const Content = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: ${theme.spacing.xl};
`;

const AlbumForm = styled.div`
  display: grid;
  grid-template-columns: 200px 1fr;
  gap: ${theme.spacing.xl};
  max-width: 900px;
  margin: 0 auto;

  .artwork-section {
    display: flex;
    flex-direction: column;
    gap: ${theme.spacing.md};
  }

  .form-fields {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: ${theme.spacing.lg};
  }
`;

const ArtworkPreview = styled.div`
  width: 200px;
  height: 200px;
  background: ${theme.colors.background.elevated};
  border: 2px solid ${theme.colors.border};
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  position: relative;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: ${theme.spacing.sm};
    color: ${theme.colors.text.disabled};

    svg {
      width: 48px;
      height: 48px;
    }

    span {
      font-size: 12px;
    }
  }
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.xs};

  &.full-width {
    grid-column: span 2;
  }

  label {
    font-size: 12px;
    text-transform: uppercase;
    color: ${theme.colors.text.secondary};
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: ${theme.spacing.xs};

    svg {
      width: 14px;
      height: 14px;
    }
  }

  input, select {
    background: ${theme.colors.background.elevated};
    border: 1px solid ${theme.colors.border};
    border-radius: 6px;
    padding: ${theme.spacing.sm} ${theme.spacing.md};
    color: ${theme.colors.text.primary};
    font-size: 14px;
    transition: all 0.2s ease;

    &:focus {
      outline: none;
      border-color: ${theme.colors.accent.primary};
      background: ${theme.colors.background.surface};
    }

    &::placeholder {
      color: ${theme.colors.text.disabled};
    }
  }

  .date-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: ${theme.spacing.sm};
  }
`;

const TracksContainer = styled.div`
  max-width: 900px;
  margin: 0 auto;
`;

const TracksHeader = styled.div`
  display: grid;
  grid-template-columns: 60px 1fr 140px 80px;
  gap: ${theme.spacing.md};
  padding: ${theme.spacing.sm} ${theme.spacing.md};
  border-bottom: 2px solid ${theme.colors.border};
  margin-bottom: ${theme.spacing.md};
  align-items: center;

  .header-label {
    font-size: 11px;
    text-transform: uppercase;
    color: ${theme.colors.text.secondary};
    font-weight: 600;
    letter-spacing: 0.5px;

    &.center {
      text-align: center;
    }
  }
`;

const TracksList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.sm};
`;

const TrackItem = styled.div`
  background: ${theme.colors.background.elevated};
  border: 1px solid ${theme.colors.border};
  border-radius: 6px;
  padding: ${theme.spacing.md};
  transition: all 0.2s ease;

  &:hover {
    border-color: ${theme.colors.accent.primary}40;
    background: ${theme.colors.background.elevated}cc;
  }

  .track-row {
    display: grid;
    grid-template-columns: 60px 1fr 140px 80px;
    gap: ${theme.spacing.md};
    align-items: center;

    &.bottom-row {
      margin-top: ${theme.spacing.sm};
      grid-template-columns: 60px 1fr;
      padding-left: 0;

      .preview-section {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: ${theme.spacing.xs} ${theme.spacing.sm};
        background: ${theme.colors.background.surface};
        border-radius: 4px;
        font-size: 12px;
        color: ${theme.colors.text.secondary};

        .preview-label {
          font-weight: 600;
          margin-right: ${theme.spacing.xs};
        }

        .preview-text {
          flex: 1;
          color: ${theme.colors.text.primary};
          font-style: italic;
        }

        .mb-link {
          color: ${theme.colors.accent.primary};
          text-decoration: none;
          font-size: 11px;
          display: flex;
          align-items: center;
          gap: 4px;

          &:hover {
            text-decoration: underline;
          }
        }
      }
    }
  }

  .track-field {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .field-label {
    font-size: 10px;
    text-transform: uppercase;
    color: ${theme.colors.text.disabled};
    font-weight: 500;
    letter-spacing: 0.3px;
  }

  input[type="text"], input[type="number"] {
    width: 100%;
    background: ${theme.colors.background.surface};
    border: 1px solid ${theme.colors.border};
    border-radius: 4px;
    padding: ${theme.spacing.xs} ${theme.spacing.sm};
    color: ${theme.colors.text.primary};
    font-size: 13px;
    transition: all 0.2s ease;

    &:focus {
      outline: none;
      border-color: ${theme.colors.accent.primary};
      background: ${theme.colors.background.elevated};
    }

    &::placeholder {
      color: ${theme.colors.text.disabled};
      font-size: 12px;
    }
  }

  .track-number input {
    text-align: center;
  }

  .track-title {
    position: relative;

    .autocomplete {
      position: absolute;
      top: calc(100% + 2px);
      left: 0;
      right: 0;
      background: ${theme.colors.background.surface};
      border: 1px solid ${theme.colors.accent.primary};
      border-radius: 4px;
      max-height: 200px;
      overflow-y: auto;
      z-index: 100;
      box-shadow: 0 4px 12px rgba(0,0,0,0.4);
    }

    .autocomplete-item {
      padding: ${theme.spacing.sm} ${theme.spacing.md};
      cursor: pointer;
      font-size: 13px;
      color: ${theme.colors.text.primary};
      border-bottom: 1px solid ${theme.colors.border};

      &:last-child {
        border-bottom: none;
      }

      &:hover, &.selected {
        background: ${theme.colors.accent.primary}20;
      }

      .abbr {
        color: ${theme.colors.text.secondary};
        font-size: 11px;
        margin-left: ${theme.spacing.xs};
      }
    }
  }

  .track-segue {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;

    label {
      display: flex;
      align-items: center;
      gap: 6px;
      cursor: pointer;
      font-size: 12px;
      color: ${theme.colors.text.primary};

      input[type="checkbox"] {
        width: 16px;
        height: 16px;
        cursor: pointer;
        margin: 0;
      }

      span {
        font-size: 11px;
      }
    }
  }
`;

const Pagination = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: ${theme.spacing.lg};
  border-top: 1px solid ${theme.colors.border};

  .page-info {
    color: ${theme.colors.text.secondary};
    font-size: 14px;
  }

  .page-controls {
    display: flex;
    gap: ${theme.spacing.md};

    button {
      background: ${theme.colors.background.elevated};
      border: 1px solid ${theme.colors.border};
      border-radius: 6px;
      padding: ${theme.spacing.sm} ${theme.spacing.md};
      color: ${theme.colors.text.primary};
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: ${theme.spacing.xs};
      font-size: 14px;
      transition: all 0.2s ease;

      &:hover:not(:disabled) {
        background: ${theme.colors.accent.primary}20;
        border-color: ${theme.colors.accent.primary};
      }

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }
  }
`;

const Footer = styled.div`
  padding: ${theme.spacing.lg};
  border-top: 1px solid ${theme.colors.border};
  display: flex;
  justify-content: flex-end;
  gap: ${theme.spacing.md};

  button {
    padding: ${theme.spacing.sm} ${theme.spacing.lg};
    border-radius: 6px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    gap: ${theme.spacing.xs};

    &.primary {
      background: ${theme.colors.accent.primary};
      color: white;
      border: none;

      &:hover {
        background: ${theme.colors.accent.primaryHover};
      }
    }

    &.secondary {
      background: transparent;
      color: ${theme.colors.text.secondary};
      border: 1px solid ${theme.colors.border};

      &:hover {
        background: ${theme.colors.background.elevated};
        color: ${theme.colors.text.primary};
      }
    }
  }
`;

// Common Grateful Dead song titles and abbreviations
const SONG_CATALOG = [
  { title: "Althea", abbr: "" },
  { title: "Beat It On Down the Line", abbr: "BIODTL" },
  { title: "Bertha", abbr: "" },
  { title: "Bird Song", abbr: "" },
  { title: "Black Peter", abbr: "" },
  { title: "Black-Throated Wind", abbr: "BTW" },
  { title: "Box of Rain", abbr: "" },
  { title: "Brown-Eyed Women", abbr: "BEW" },
  { title: "Casey Jones", abbr: "" },
  { title: "China Cat Sunflower", abbr: "" },
  { title: "Cold Rain and Snow", abbr: "CC" },
  { title: "Cumberland Blues", abbr: "" },
  { title: "Dark Star", abbr: "" },
  { title: "Deal", abbr: "" },
  { title: "Dire Wolf", abbr: "" },
  { title: "El Paso", abbr: "" },
  { title: "Eyes of the World", abbr: "EOTW" },
  { title: "Fire on the Mountain", abbr: "FOTM" },
  { title: "Franklin's Tower", abbr: "" },
  { title: "Friend of the Devil", abbr: "FOTD" },
  { title: "Going Down the Road Feeling Bad", abbr: "GDTRFB" },
  { title: "Greatest Story Ever Told", abbr: "GSET" },
  { title: "He's Gone", abbr: "" },
  { title: "Help on the Way", abbr: "HOTW" },
  { title: "I Know You Rider", abbr: "IKYR" },
  { title: "Jack Straw", abbr: "" },
  { title: "Me and My Uncle", abbr: "MAMU" },
  { title: "Morning Dew", abbr: "" },
  { title: "Not Fade Away", abbr: "NFA" },
  { title: "One More Saturday Night", abbr: "OMSN" },
  { title: "Playing in the Band", abbr: "PITB" },
  { title: "Promised Land", abbr: "" },
  { title: "Ramble On Rose", abbr: "" },
  { title: "Ripple", abbr: "" },
  { title: "Row Jimmy", abbr: "" },
  { title: "Scarlet Begonias", abbr: "" },
  { title: "Shakedown Street", abbr: "" },
  { title: "Ship of Fools", abbr: "" },
  { title: "Slipknot!", abbr: "" },
  { title: "St. Stephen", abbr: "" },
  { title: "Stella Blue", abbr: "" },
  { title: "Sugar Magnolia", abbr: "SOTM" },
  { title: "Sugaree", abbr: "" },
  { title: "Sunshine Daydream", abbr: "SSDD" },
  { title: "Terrapin Station", abbr: "" },
  { title: "The Other One", abbr: "TOO" },
  { title: "The Wheel", abbr: "" },
  { title: "They Love Each Other", abbr: "TLEO" },
  { title: "Touch of Grey", abbr: "" },
  { title: "Truckin'", abbr: "" },
  { title: "Uncle John's Band", abbr: "UJB" },
  { title: "U.S. Blues", abbr: "USB" },
  { title: "Weather Report Suite", abbr: "WRS" },
  { title: "Wharf Rat", abbr: "" }
];

function MetadataEditor({ albumData, tracks, onSave, onClose }) {
  const [activeTab, setActiveTab] = useState('album');
  const [currentPage, setCurrentPage] = useState(0);
  const [album, setAlbum] = useState({
    title: albumData?.notes || '',
    venue: albumData?.venue_name || '',
    city: albumData?.city || '',
    state: albumData?.state || '',
    releaseDate: albumData?.date || '',
    originalDate: albumData?.originalReleaseDate || '',
    releaseStatus: albumData?.release_status || 'BOOTLEG',
    sourceType: albumData?.source_type || 'SBD',
    artworkUrl: albumData?.artwork_url || albumData?.artwork || '',
    musicbrainzReleaseId: albumData?.musicbrainz_release_id || '',
    musicbrainzUrl: '',
    notes: albumData?.review_notes || ''  // Notes field
  });

  const [editedTracks, setEditedTracks] = useState(
    tracks.map((t, idx) => ({
      id: t.id,
      trackNumber: t.track_number || idx + 1,
      title: t.song_name || t.song_title || t.title || '',
      date: t.recording_date || t.performance_date || t.date || '',
      hasSegue: t.has_segue || false,
      displayTitle: '',
      musicbrainzRecordingId: t.mb_recording_id || t.musicbrainz_recording_id || '',
      musicbrainzReleaseId: t.mb_release_id || '',
      acoustId: t.acoust_id || ''
    }))
  );

  const [autocompleteIndex, setAutocompleteIndex] = useState(-1);
  const [showAutocomplete, setShowAutocomplete] = useState({});
  const [filteredSongs, setFilteredSongs] = useState([]);

  const tracksPerPage = 10;
  const totalPages = Math.ceil(editedTracks.length / tracksPerPage);
  const currentTracks = editedTracks.slice(
    currentPage * tracksPerPage,
    (currentPage + 1) * tracksPerPage
  );

  // Generate display title for track
  const generateDisplayTitle = (title, date, hasSegue) => {
    let displayTitle = title || 'Unknown Track';
    if (date && date !== '1970-01-01') {
      displayTitle += ` [${date}]`;
    }
    if (hasSegue) {
      displayTitle += ' >';
    }
    return displayTitle;
  };

  // Auto-generate album title from venue, city, state
  const generateAlbumTitle = () => {
    const parts = [];

    // Add date first
    if (album.originalDate) {
      parts.push(album.originalDate);
    }

    // Add venue
    if (album.venue && album.venue.toLowerCase() !== 'the') {
      parts.push(album.venue);
    }

    // Add location
    if (album.city || album.state) {
      const location = [];
      if (album.city) location.push(album.city);
      if (album.state) location.push(album.state);
      parts.push(location.join(', '));
    }

    // Add the existing notes/album name if it contains special text
    if (album.title && album.title.includes("Listen to the River")) {
      parts.push("Listen to the River '71 '72 '73");
    }

    return parts.join(' - ');
  };

  // Update display titles when tracks change
  useEffect(() => {
    setEditedTracks(prev => prev.map(track => ({
      ...track,
      displayTitle: generateDisplayTitle(track.title, track.date, track.hasSegue)
    })));
  }, []);

  const handleTrackChange = (trackId, field, value) => {
    setEditedTracks(prev => prev.map(track => {
      if (track.id === trackId) {
        const updated = { ...track, [field]: value };
        if (field === 'title' || field === 'date' || field === 'hasSegue') {
          updated.displayTitle = generateDisplayTitle(
            field === 'title' ? value : track.title,
            field === 'date' ? value : track.date,
            field === 'hasSegue' ? value : track.hasSegue
          );
        }
        return updated;
      }
      return track;
    }));

    // Handle autocomplete for title field
    if (field === 'title') {
      const filtered = SONG_CATALOG.filter(song =>
        song.title.toLowerCase().includes(value.toLowerCase()) ||
        (song.abbr && song.abbr.toLowerCase().includes(value.toLowerCase()))
      );
      setFilteredSongs(filtered);
      setShowAutocomplete({ ...showAutocomplete, [trackId]: filtered.length > 0 && value.length > 0 });
      setAutocompleteIndex(-1);
    }
  };

  const selectSong = (trackId, song) => {
    handleTrackChange(trackId, 'title', song.title);
    setShowAutocomplete({ ...showAutocomplete, [trackId]: false });
  };

  const handleKeyDown = (e, trackId) => {
    if (!showAutocomplete[trackId]) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setAutocompleteIndex(prev =>
        prev < filteredSongs.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setAutocompleteIndex(prev => prev > 0 ? prev - 1 : -1);
    } else if (e.key === 'Enter' && autocompleteIndex >= 0) {
      e.preventDefault();
      selectSong(trackId, filteredSongs[autocompleteIndex]);
    } else if (e.key === 'Escape') {
      setShowAutocomplete({ ...showAutocomplete, [trackId]: false });
    }
  };

  const handleSave = async () => {
    const updates = {
      album: {
        showId: albumData.id,
        updates: {
          notes: album.title,
          venue: {
            name: album.venue,
            city: album.city,
            state: album.state
          },
          date: album.releaseDate,
          originalReleaseDate: album.originalDate,
          release_status: album.releaseStatus,
          source_type: album.sourceType,
          artwork: album.artworkUrl,
          review_notes: album.notes
        }
      },
      tracks: editedTracks.map(track => ({
        trackId: track.id,
        updates: {
          track_number: track.trackNumber,
          song_name: track.title,
          performance_date: track.date,
          has_segue: track.hasSegue
        }
      }))
    };

    await onSave(updates);
    onClose();
  };

  return (
    <Overlay onClick={(e) => e.target === e.currentTarget && onClose()}>
      <Dialog>
        <Header>
          <h2>
            <Music />
            Edit Metadata
          </h2>
          <button className="close-btn" onClick={onClose}>
            <X />
          </button>
        </Header>

        <TabContainer>
          <Tab active={activeTab === 'album'} onClick={() => setActiveTab('album')}>
            Album Information
          </Tab>
          <Tab active={activeTab === 'tracks'} onClick={() => setActiveTab('tracks')}>
            Track List
          </Tab>
        </TabContainer>

        <Content>
          {activeTab === 'album' ? (
            <AlbumForm>
              <div className="artwork-section">
                <ArtworkPreview>
                  {album.artworkUrl ? (
                    <img src={album.artworkUrl} alt="Album artwork" />
                  ) : (
                    <div className="placeholder">
                      <Image />
                      <span>No artwork</span>
                    </div>
                  )}
                </ArtworkPreview>
                <FormGroup>
                  <label>
                    <Image />
                    Artwork URL
                  </label>
                  <input
                    type="text"
                    value={album.artworkUrl}
                    onChange={(e) => setAlbum({ ...album, artworkUrl: e.target.value })}
                    placeholder="https://..."
                  />
                </FormGroup>
                <FormGroup>
                  <label>
                    <ExternalLink />
                    MusicBrainz URL
                  </label>
                  <input
                    type="text"
                    value={album.musicbrainzUrl || (album.musicbrainzReleaseId ? `https://musicbrainz.org/release/${album.musicbrainzReleaseId}` : '')}
                    onChange={(e) => setAlbum({ ...album, musicbrainzUrl: e.target.value })}
                    placeholder="https://musicbrainz.org/..."
                    style={{ fontSize: '12px' }}
                  />
                  {(album.musicbrainzUrl || album.musicbrainzReleaseId) && (
                    <a
                      href={album.musicbrainzUrl || `https://musicbrainz.org/release/${album.musicbrainzReleaseId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        marginTop: '4px',
                        color: theme.colors.accent.primary,
                        fontSize: '11px',
                        textDecoration: 'none'
                      }}
                    >
                      <ExternalLink size={10} />
                      Open
                    </a>
                  )}
                </FormGroup>
              </div>

              <div className="form-fields">
                <FormGroup className="full-width">
                  <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Music />
                      Album Title
                    </span>
                    <button
                      type="button"
                      onClick={() => setAlbum({ ...album, title: generateAlbumTitle() })}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '4px 8px',
                        fontSize: '11px',
                        background: theme.colors.accent.primary + '20',
                        color: theme.colors.accent.primary,
                        border: `1px solid ${theme.colors.accent.primary}40`,
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      <Wand2 size={12} />
                      Auto-generate
                    </button>
                  </label>
                  <input
                    type="text"
                    value={album.title}
                    onChange={(e) => setAlbum({ ...album, title: e.target.value })}
                    placeholder="e.g., Dick's Picks Vol. 8"
                  />
                </FormGroup>

                <FormGroup>
                  <label>
                    <MapPin />
                    Venue
                  </label>
                  <input
                    type="text"
                    value={album.venue}
                    onChange={(e) => setAlbum({ ...album, venue: e.target.value })}
                    placeholder="e.g., Fox Theatre"
                  />
                </FormGroup>

                <FormGroup>
                  <label>
                    <MapPin />
                    City
                  </label>
                  <input
                    type="text"
                    value={album.city}
                    onChange={(e) => setAlbum({ ...album, city: e.target.value })}
                    placeholder="e.g., St. Louis"
                  />
                </FormGroup>

                <FormGroup>
                  <label>
                    <MapPin />
                    State
                  </label>
                  <input
                    type="text"
                    value={album.state}
                    onChange={(e) => setAlbum({ ...album, state: e.target.value })}
                    placeholder="e.g., MO"
                    maxLength={2}
                  />
                </FormGroup>

                <FormGroup>
                  <label>Release Status</label>
                  <select
                    value={album.releaseStatus}
                    onChange={(e) => setAlbum({ ...album, releaseStatus: e.target.value })}
                  >
                    <option value="OFFICIAL">Official</option>
                    <option value="BOOTLEG">Bootleg</option>
                    <option value="PROMOTION">Promotion</option>
                    <option value="PSEUDO">Pseudo-Release</option>
                  </select>
                </FormGroup>

                <FormGroup>
                  <label>Source Type</label>
                  <select
                    value={album.sourceType}
                    onChange={(e) => setAlbum({ ...album, sourceType: e.target.value })}
                  >
                    <option value="SBD">Soundboard</option>
                    <option value="AUD">Audience</option>
                    <option value="MATRIX">Matrix</option>
                    <option value="FM">FM Broadcast</option>
                  </select>
                </FormGroup>

                <FormGroup>
                  <label>
                    <Calendar />
                    Release Date
                  </label>
                  <input
                    type="text"
                    value={album.releaseDate}
                    onChange={(e) => setAlbum({ ...album, releaseDate: e.target.value })}
                    placeholder="YYYY-MM-DD"
                  />
                </FormGroup>

                <FormGroup>
                  <label>
                    <Calendar />
                    Original/Performance Date
                  </label>
                  <input
                    type="text"
                    value={album.originalDate}
                    onChange={(e) => setAlbum({ ...album, originalDate: e.target.value })}
                    placeholder="YYYY-MM-DD"
                  />
                </FormGroup>

                <FormGroup className="full-width">
                  <label>
                    Notes
                  </label>
                  <textarea
                    value={album.notes}
                    onChange={(e) => setAlbum({ ...album, notes: e.target.value })}
                    placeholder="Additional notes..."
                    style={{
                      background: theme.colors.background.elevated,
                      border: `1px solid ${theme.colors.border}`,
                      borderRadius: '6px',
                      padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                      color: theme.colors.text.primary,
                      fontSize: '14px',
                      minHeight: '80px',
                      resize: 'vertical',
                      fontFamily: 'inherit'
                    }}
                  />
                </FormGroup>
              </div>
            </AlbumForm>
          ) : (
            <TracksContainer>
              <TracksHeader>
                <div className="header-label center">Track #</div>
                <div className="header-label">Song Title</div>
                <div className="header-label center">Performance Date</div>
                <div className="header-label center">Segue</div>
              </TracksHeader>

              <TracksList>
                {currentTracks.map((track) => (
                  <TrackItem key={track.id}>
                    <div className="track-row">
                      <div className="track-field track-number">
                        <input
                          type="number"
                          value={track.trackNumber}
                          onChange={(e) => handleTrackChange(track.id, 'trackNumber', parseInt(e.target.value) || 0)}
                          min={1}
                        />
                      </div>

                      <div className="track-field track-title">
                        <input
                          type="text"
                          value={track.title}
                          onChange={(e) => handleTrackChange(track.id, 'title', e.target.value)}
                          onKeyDown={(e) => handleKeyDown(e, track.id)}
                          onBlur={() => setTimeout(() => setShowAutocomplete({ ...showAutocomplete, [track.id]: false }), 200)}
                          placeholder="Enter song title or abbreviation..."
                        />
                        {showAutocomplete[track.id] && (
                          <div className="autocomplete">
                            {filteredSongs.map((song, idx) => (
                              <div
                                key={song.title}
                                className={`autocomplete-item ${idx === autocompleteIndex ? 'selected' : ''}`}
                                onClick={() => selectSong(track.id, song)}
                              >
                                {song.title}
                                {song.abbr && <span className="abbr">({song.abbr})</span>}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="track-field">
                        <input
                          type="text"
                          value={track.date}
                          onChange={(e) => handleTrackChange(track.id, 'date', e.target.value)}
                          placeholder="YYYY-MM-DD"
                        />
                      </div>

                      <div className="track-segue">
                        <label>
                          <input
                            type="checkbox"
                            checked={track.hasSegue}
                            onChange={(e) => handleTrackChange(track.id, 'hasSegue', e.target.checked)}
                          />
                          <span>→</span>
                        </label>
                      </div>
                    </div>

                    <div className="track-row bottom-row">
                      <div></div>
                      <div className="preview-section">
                        <span className="preview-label">Preview:</span>
                        <span className="preview-text">{track.displayTitle}</span>
                        {(track.musicbrainzRecordingId || track.acoustId) && (
                          <a
                            href={track.musicbrainzRecordingId ?
                              `https://musicbrainz.org/recording/${track.musicbrainzRecordingId}` :
                              `https://acoustid.org/track/${track.acoustId}`
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mb-link"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <ExternalLink size={10} />
                            {track.musicbrainzRecordingId ? 'MusicBrainz' : 'AcoustID'}
                          </a>
                        )}
                      </div>
                    </div>
                  </TrackItem>
                ))}
              </TracksList>

              {totalPages > 1 && (
                <Pagination>
                  <div className="page-info">
                    Page {currentPage + 1} of {totalPages} • Tracks {currentPage * tracksPerPage + 1}-{Math.min((currentPage + 1) * tracksPerPage, editedTracks.length)} of {editedTracks.length}
                  </div>
                  <div className="page-controls">
                    <button
                      onClick={() => setCurrentPage(prev => prev - 1)}
                      disabled={currentPage === 0}
                    >
                      <ChevronLeft />
                      Previous
                    </button>
                    <button
                      onClick={() => setCurrentPage(prev => prev + 1)}
                      disabled={currentPage === totalPages - 1}
                    >
                      Next
                      <ChevronRight />
                    </button>
                  </div>
                </Pagination>
              )}
            </TracksContainer>
          )}
        </Content>

        <Footer>
          <button className="secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="primary" onClick={handleSave}>
            <Save />
            Save All Changes
          </button>
        </Footer>
      </Dialog>
    </Overlay>
  );
}

export default MetadataEditor;