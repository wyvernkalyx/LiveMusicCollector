import React from 'react';
import styled from '@emotion/styled';
import { Music, Disc, Calendar, MapPin, Edit, Save, Check, X, ChevronDown, ChevronRight, Filter, Cloud } from 'lucide-react';
import { theme } from '../styles/globalStyles';
import { useStore } from '../store';
import ShowCard from '../components/ShowCard';

const PageContainer = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
`;

const Header = styled.div`
  margin-bottom: ${theme.spacing.lg};

  h2 {
    font-size: ${theme.typography.fontSize.xl};
    font-weight: 600;
    margin-bottom: ${theme.spacing.sm};
  }

  p {
    color: ${theme.colors.text.secondary};
  }
`;

const FilterBar = styled.div`
  display: flex;
  gap: ${theme.spacing.md};
  margin-bottom: ${theme.spacing.lg};
  padding: ${theme.spacing.md};
  background: ${theme.colors.background.surface};
  border-radius: ${theme.borderRadius.lg};

  input, select {
    padding: ${theme.spacing.sm} ${theme.spacing.md};
    background: ${theme.colors.background.secondary};
    border: 1px solid ${theme.colors.border};
    border-radius: ${theme.borderRadius.sm};
    color: ${theme.colors.text.primary};
    flex: 1;
    max-width: 200px;
  }

  button {
    padding: ${theme.spacing.sm} ${theme.spacing.lg};
    background: ${theme.colors.accent.primary};
    color: white;
    border-radius: ${theme.borderRadius.md};

    &:hover {
      background: ${theme.colors.accent.secondary};
    }

    &.secondary {
      background: ${theme.colors.background.elevated};
      color: ${theme.colors.text.primary};

      &:hover {
        background: ${theme.colors.background.secondary};
      }
    }
  }
`;

const MainContent = styled.div`
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  background: ${theme.colors.background.surface};
  border-radius: ${theme.borderRadius.lg};
`;

const AlbumHeader = styled.div`
  padding: ${theme.spacing.lg};
  background: ${theme.colors.background.elevated};
  border-bottom: 2px solid ${theme.colors.border};
`;

const AlbumInfo = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: start;
  margin-bottom: ${theme.spacing.md};

  .album-details {
    flex: 1;

    h3 {
      font-size: ${theme.typography.fontSize.lg};
      font-weight: 600;
      margin-bottom: ${theme.spacing.sm};
      display: flex;
      align-items: center;
      gap: ${theme.spacing.sm};

      svg {
        width: 20px;
        height: 20px;
        color: ${theme.colors.accent.primary};
      }
    }

    .meta {
      display: flex;
      gap: ${theme.spacing.lg};
      color: ${theme.colors.text.secondary};
      font-size: ${theme.typography.fontSize.sm};

      span {
        display: flex;
        align-items: center;
        gap: ${theme.spacing.xs};

        svg {
          width: 14px;
          height: 14px;
        }
      }
    }
  }

  .album-actions {
    display: flex;
    gap: ${theme.spacing.sm};

    button {
      padding: ${theme.spacing.sm} ${theme.spacing.md};
      border-radius: ${theme.borderRadius.md};
      display: flex;
      align-items: center;
      gap: ${theme.spacing.xs};

      &.primary {
        background: ${theme.colors.accent.primary};
        color: white;

        &:hover {
          background: ${theme.colors.accent.secondary};
        }
      }

      &.secondary {
        background: ${theme.colors.background.surface};
        color: ${theme.colors.text.primary};
        border: 1px solid ${theme.colors.border};

        &:hover {
          background: ${theme.colors.background.secondary};
        }
      }

      svg {
        width: 16px;
        height: 16px;
      }
    }
  }
`;

const AlbumMetadata = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: ${theme.spacing.md};
  padding: ${theme.spacing.md};
  background: ${theme.colors.background.surface};
  border-radius: ${theme.borderRadius.md};

  .field {
    display: flex;
    flex-direction: column;
    gap: ${theme.spacing.xs};

    label {
      font-size: ${theme.typography.fontSize.xs};
      color: ${theme.colors.text.secondary};
      text-transform: uppercase;
      font-weight: 600;
    }

    input, select, textarea {
      padding: ${theme.spacing.sm};
      background: ${theme.colors.background.secondary};
      border: 1px solid ${theme.colors.border};
      border-radius: ${theme.borderRadius.sm};
      color: ${theme.colors.text.primary};

      &:focus {
        outline: none;
        border-color: ${theme.colors.accent.primary};
      }

      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      &.has-differences {
        color: ${theme.colors.status.warning};
        font-style: italic;
      }
    }

    textarea {
      min-height: 60px;
      resize: vertical;
    }
  }
`;

const TracksContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: ${theme.spacing.md};
`;

const TracksTable = styled.table`
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;

  thead {
    position: sticky;
    top: 0;
    background: ${theme.colors.background.surface};
    z-index: 1;

    th {
      text-align: left;
      padding: ${theme.spacing.sm} ${theme.spacing.md};
      font-size: ${theme.typography.fontSize.sm};
      font-weight: 600;
      color: ${theme.colors.text.secondary};
      border-bottom: 2px solid ${theme.colors.border};

      &:first-child {
        width: 40px;
      }

      &.track-number {
        width: 60px;
      }

      &.duration {
        width: 80px;
      }

      &.actions {
        width: 100px;
        text-align: center;
      }
    }
  }

  tbody {
    tr {
      transition: background ${theme.transitions.fast};

      &:hover {
        background: ${theme.colors.background.elevated};
      }

      &.selected {
        background: ${theme.colors.accent.primary}10;
      }

      td {
        padding: ${theme.spacing.sm} ${theme.spacing.md};
        border-bottom: 1px solid ${theme.colors.border};
        font-size: ${theme.typography.fontSize.sm};

        input {
          width: 100%;
          padding: ${theme.spacing.xs};
          background: transparent;
          border: 1px solid transparent;
          border-radius: ${theme.borderRadius.sm};

          &:focus {
            background: ${theme.colors.background.secondary};
            border-color: ${theme.colors.accent.primary};
            outline: none;
          }
        }

        &.track-number {
          font-weight: 600;
          color: ${theme.colors.text.secondary};
        }

        &.duration {
          font-family: 'Consolas', monospace;
          color: ${theme.colors.text.secondary};
        }

        &.actions {
          text-align: center;

          button {
            padding: ${theme.spacing.xs};
            background: transparent;
            color: ${theme.colors.text.secondary};
            border-radius: ${theme.borderRadius.sm};

            &:hover {
              background: ${theme.colors.background.elevated};
              color: ${theme.colors.text.primary};
            }

            svg {
              width: 16px;
              height: 16px;
            }
          }
        }
      }
    }
  }
`;

const ShowGroup = styled.div`
  margin-bottom: ${theme.spacing.lg};
  background: ${theme.colors.background.surface};
  border-radius: ${theme.borderRadius.lg};
  overflow: hidden;
`;

const ShowHeader = styled.div`
  padding: ${theme.spacing.md};
  background: ${theme.colors.background.elevated};
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  transition: background ${theme.transitions.fast};

  &:hover {
    background: ${theme.colors.background.secondary};
  }

  .show-info {
    display: flex;
    align-items: center;
    gap: ${theme.spacing.md};

    .toggle {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 24px;

      svg {
        width: 16px;
        height: 16px;
        transition: transform ${theme.transitions.fast};
      }
    }

    .date {
      font-weight: 600;
      font-size: ${theme.typography.fontSize.md};
    }

    .venue {
      color: ${theme.colors.text.secondary};
      font-size: ${theme.typography.fontSize.sm};
    }

    .stats {
      display: flex;
      gap: ${theme.spacing.md};
      font-size: ${theme.typography.fontSize.sm};
      color: ${theme.colors.text.disabled};
    }
  }

  .show-actions {
    display: flex;
    gap: ${theme.spacing.sm};

    button {
      padding: ${theme.spacing.xs} ${theme.spacing.sm};
      background: ${theme.colors.background.surface};
      border: 1px solid ${theme.colors.border};
      border-radius: ${theme.borderRadius.sm};
      font-size: ${theme.typography.fontSize.sm};

      &:hover {
        background: ${theme.colors.background.primary};
      }
    }
  }
`;

function TracksPage() {
  const { shows, fetchShows } = useStore();
  const [selectedShow, setSelectedShow] = React.useState(null);
  const [expandedShows, setExpandedShows] = React.useState(new Set());
  const [editingAlbum, setEditingAlbum] = React.useState(false);
  const [selectedTracks, setSelectedTracks] = React.useState(new Set());
  const [trackData, setTrackData] = React.useState({});
  const [allTracks, setAllTracks] = React.useState({});
  const [albumMetadata, setAlbumMetadata] = React.useState({
    artist: 'Grateful Dead',
    album: '',
    date: '',
    venue: '',
    city: '',
    state: '',
    sourceType: 'AUD',
    taper: '',
    genre: 'Rock',
    year: '',
    lineage: '',
    notes: ''
  });

  const [filters, setFilters] = React.useState({
    date: '',
    venue: '',
    showTracks: true
  });

  React.useEffect(() => {
    fetchShows();
  }, [fetchShows]);

  React.useEffect(() => {
    // Load tracks for selected show
    if (selectedShow && selectedShow.id) {
      console.log('useEffect: selectedShow changed:', selectedShow);
      loadShowTracks(selectedShow);
    }
  }, [selectedShow]);

  const loadShowTracks = async (show) => {
    console.log('Loading tracks for show:', show);
    try {
      const tracks = await window.api.getTracksByShow(show.id);
      console.log('Loaded tracks for show:', show.id, tracks);
      console.log('Number of tracks:', tracks ? tracks.length : 0);

      if (tracks && tracks.length > 0) {
        // Convert array to object keyed by track ID
        const tracksObj = {};
        tracks.forEach(track => {
          console.log('Track:', track.id, 'Duration:', track.duration, 'Title:', track.song_title || track.title);
          tracksObj[track.id] = track;
        });
        setTrackData(tracksObj);

        // Analyze tracks to find common values and differences
        const analyzeField = (fieldName) => {
          const values = new Set(tracks.map(t => t[fieldName] || ''));
          return values.size === 1 ? Array.from(values)[0] : '<different>';
        };

        // Format album title properly: yyyy-mm-dd - venue - city, state
        const formatAlbumTitle = () => {
          const parts = [];
          if (show.date) parts.push(show.date);
          if (show.venue_name && show.venue_name !== 'Unknown Venue') parts.push(show.venue_name);
          if (show.city || show.state) {
            const location = [show.city, show.state].filter(Boolean).join(', ');
            if (location) parts.push(location);
          }
          return parts.join(' - ');
        };

        // Set album metadata with difference detection
        setAlbumMetadata({
          artist: analyzeField('artist') !== '<different>' ? analyzeField('artist') : 'Grateful Dead',
          album: formatAlbumTitle(),
          date: show.date || analyzeField('date'),
          venue: show.venue_name || analyzeField('venue') || '',
          city: show.city || analyzeField('city') || '',
          state: show.state || analyzeField('state') || '',
          sourceType: show.source_type || analyzeField('source_type') || 'AUD',
          taper: show.taper || analyzeField('taper') || '',
          genre: analyzeField('genre') !== '<different>' ? analyzeField('genre') : 'Rock',
          year: show.date ? show.date.substring(0, 4) : analyzeField('year') || '',
          lineage: show.lineage || analyzeField('lineage') || '',
          notes: show.notes || analyzeField('notes') || ''
        });
      } else {
        // No tracks, just set basic metadata
        setTrackData({});
        // Format album title properly: yyyy-mm-dd - venue - city, state
        const formatAlbumTitle = () => {
          const parts = [];
          if (show.date) parts.push(show.date);
          if (show.venue_name && show.venue_name !== 'Unknown Venue') parts.push(show.venue_name);
          if (show.city || show.state) {
            const location = [show.city, show.state].filter(Boolean).join(', ');
            if (location) parts.push(location);
          }
          return parts.join(' - ');
        };

        setAlbumMetadata({
          artist: 'Grateful Dead',
          album: formatAlbumTitle(),
          date: show.date,
          venue: show.venue_name || '',
          city: show.city || '',
          state: show.state || '',
          sourceType: show.source_type || 'AUD',
          taper: show.taper || '',
          genre: 'Rock',
          year: show.date ? show.date.substring(0, 4) : '',
          lineage: show.lineage || '',
          notes: show.notes || ''
        });
      }
    } catch (error) {
      console.error('Error loading show tracks:', error);
      console.error('Error details:', error.message, error.stack);
      setTrackData({});
    }
  };

  const toggleShow = (showId) => {
    const expanded = new Set(expandedShows);
    if (expanded.has(showId)) {
      expanded.delete(showId);
      if (selectedShow?.id === showId) {
        setSelectedShow(null);
      }
    } else {
      expanded.add(showId);
      const show = shows.find(s => s.id === showId);
      console.log('Found show:', show, 'from shows:', shows);
      setSelectedShow(show);
    }
    setExpandedShows(expanded);
  };

  const handleSelectAllTracks = () => {
    if (selectedTracks.size === Object.keys(trackData).length) {
      setSelectedTracks(new Set());
    } else {
      setSelectedTracks(new Set(Object.keys(trackData).map(id => parseInt(id))));
    }
  };

  const handleTrackSelect = (trackId) => {
    const selected = new Set(selectedTracks);
    if (selected.has(trackId)) {
      selected.delete(trackId);
    } else {
      selected.add(trackId);
    }
    setSelectedTracks(selected);
  };

  const handleArchiveLookup = async () => {
    if (!selectedShow || !selectedShow.date) {
      alert('Please select a show with a date to lookup');
      return;
    }

    try {
      // Search Archive.org for this show
      const matches = await window.api.searchArchive(
        selectedShow.date,
        selectedShow.venue_name || albumMetadata.venue
      );

      if (matches && matches.length > 0) {
        // Use the best match (first result, sorted by rating)
        const bestMatch = matches[0];

        // Auto-fill the form with Archive.org data
        setAlbumMetadata(prev => ({
          ...prev,
          venue: bestMatch.venue || prev.venue,
          city: bestMatch.city || prev.city,
          state: bestMatch.state || prev.state,
          sourceType: bestMatch.source?.includes('SBD') ? 'SBD' :
                     bestMatch.source?.includes('AUD') ? 'AUD' :
                     bestMatch.source?.includes('MTX') ? 'MTX' : prev.sourceType,
          taper: bestMatch.taper || prev.taper,
          lineage: bestMatch.lineage || prev.lineage,
          notes: bestMatch.notes || prev.notes,
          album: bestMatch.title || prev.album
        }));

        alert(`Found on Archive.org: ${bestMatch.title}\nRating: ${bestMatch.rating || 'N/A'}/5\nSource: ${bestMatch.source || 'Unknown'}`);
      } else {
        alert('No matches found on Archive.org for this date and venue');
      }
    } catch (error) {
      console.error('Archive.org lookup error:', error);
      alert('Error looking up data from Archive.org');
    }
  };

  const handleSaveAlbumMetadata = async () => {
    if (!selectedShow) return;

    try {
      // Update show metadata
      const updates = [{
        showId: selectedShow.id,
        updates: {
          date: albumMetadata.date,
          venue: {
            name: albumMetadata.venue,
            city: albumMetadata.city,
            state: albumMetadata.state
          },
          recordings: {
            sourceType: albumMetadata.sourceType,
            taper: albumMetadata.taper,
            lineage: albumMetadata.lineage
          }
        }
      }];

      const result = await window.api.bulkUpdateShows(updates);

      if (result && result.length > 0) {
        alert('Album metadata saved successfully');
        setEditingAlbum(false);
        fetchShows(); // Refresh shows
        // Reload tracks to show updated metadata
        if (selectedShow) {
          await loadShowTracks(selectedShow);
        }
      } else {
        alert('Error saving metadata');
      }
    } catch (error) {
      console.error('Error saving album metadata:', error);
      alert('Error saving metadata');
    }
  };

  const handleApplyToSelected = async () => {
    if (selectedTracks.size === 0) {
      alert('Please select tracks to apply metadata to');
      return;
    }

    try {
      const trackIds = Array.from(selectedTracks);

      // Apply album-level metadata to selected tracks
      const results = await window.api.bulkUpdateTracks(trackIds, {
        artist: albumMetadata.artist,
        album: albumMetadata.album,
        date: albumMetadata.date,
        venue: albumMetadata.venue,
        city: albumMetadata.city,
        state: albumMetadata.state,
        source_type: albumMetadata.sourceType,
        taper: albumMetadata.taper,
        genre: albumMetadata.genre,
        year: albumMetadata.year,
        lineage: albumMetadata.lineage,
        notes: albumMetadata.notes
      });

      const successCount = results.filter(r => r.success).length;
      const failureCount = results.filter(r => !r.success).length;

      if (failureCount > 0) {
        alert(`Updated ${successCount} tracks successfully. ${failureCount} tracks failed to update.`);
      } else {
        alert(`Successfully updated metadata for ${successCount} tracks!`);
      }

      // Refresh tracks to show updated metadata
      if (selectedShow) {
        await loadShowTracks(selectedShow);
      }
      setEditingAlbum(false);
      setSelectedTracks(new Set());
    } catch (error) {
      console.error('Error applying metadata:', error);
      alert('Failed to apply metadata to tracks');
    }
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const filteredShows = React.useMemo(() => {
    let filtered = [...shows];

    if (filters.date) {
      filtered = filtered.filter(show =>
        show.date?.includes(filters.date)
      );
    }

    if (filters.venue) {
      filtered = filtered.filter(show =>
        show.venue_name?.toLowerCase().includes(filters.venue.toLowerCase())
      );
    }

    return filtered;
  }, [shows, filters]);

  return (
    <PageContainer>
      <Header>
        <h2>Track Management</h2>
        <p>View and edit all tracks with album-level metadata consistency</p>
      </Header>

      <FilterBar>
        <input
          type="text"
          placeholder="Filter by date (yyyy-mm-dd)"
          value={filters.date}
          onChange={(e) => setFilters({ ...filters, date: e.target.value })}
        />
        <input
          type="text"
          placeholder="Filter by venue"
          value={filters.venue}
          onChange={(e) => setFilters({ ...filters, venue: e.target.value })}
        />
        <button
          className="secondary"
          onClick={() => setFilters({ date: '', venue: '', showTracks: true })}
        >
          Clear Filters
        </button>
        <button
          className="secondary"
          onClick={async () => {
            if (window.confirm('Fix missing track durations? This may take a moment.')) {
              try {
                const result = await window.api.fixTrackDurations();
                alert(`Fixed ${result.fixed} of ${result.total} tracks with missing durations`);
                // Reload current show to see updated durations
                if (selectedShow) {
                  await loadShowTracks(selectedShow);
                }
              } catch (error) {
                console.error('Error fixing durations:', error);
                alert('Failed to fix track durations');
              }
            }
          }}
        >
          Fix Durations
        </button>
      </FilterBar>

      {selectedShow ? (
        <MainContent>
          <AlbumHeader>
            <AlbumInfo>
              <div className="album-details">
                <h3>
                  <Disc />
                  {selectedShow.date} - {selectedShow.venue_name || 'Unknown Venue'}
                </h3>
                <div className="meta">
                  <span>
                    <Calendar />
                    {selectedShow.date}
                  </span>
                  <span>
                    <MapPin />
                    {selectedShow.city}, {selectedShow.state}
                  </span>
                  <span>
                    <Music />
                    {Object.keys(trackData).length} tracks
                  </span>
                </div>
              </div>
              <div className="album-actions">
                <button
                  className="secondary"
                  onClick={() => setEditingAlbum(!editingAlbum)}
                >
                  <Edit />
                  {editingAlbum ? 'Cancel Edit' : 'Edit Album Metadata'}
                </button>
                {editingAlbum && (
                  <>
                    <button
                      className="secondary"
                      onClick={handleArchiveLookup}
                      title="Lookup metadata from Archive.org"
                    >
                      <Cloud />
                      Lookup from Archive.org
                    </button>
                    <button
                      className="primary"
                      onClick={handleSaveAlbumMetadata}
                    >
                      <Save />
                      Save Changes
                    </button>
                  </>
                )}
                {selectedTracks.size > 0 && (
                  <button
                    className="primary"
                    onClick={handleApplyToSelected}
                  >
                    <Check />
                    Apply to {selectedTracks.size} Tracks
                  </button>
                )}
              </div>
            </AlbumInfo>

            {editingAlbum && (
              <AlbumMetadata>
                <div className="field">
                  <label>Artist/Band</label>
                  <input
                    type="text"
                    value={albumMetadata.artist}
                    onChange={(e) => setAlbumMetadata({ ...albumMetadata, artist: e.target.value })}
                  />
                </div>
                <div className="field">
                  <label>Album Title</label>
                  <input
                    type="text"
                    value={albumMetadata.album}
                    onChange={(e) => setAlbumMetadata({ ...albumMetadata, album: e.target.value })}
                  />
                </div>
                <div className="field">
                  <label>Date</label>
                  <input
                    type="text"
                    placeholder="yyyy-mm-dd"
                    value={albumMetadata.date}
                    onChange={(e) => setAlbumMetadata({ ...albumMetadata, date: e.target.value })}
                  />
                </div>
                <div className="field">
                  <label>Venue</label>
                  <input
                    type="text"
                    value={albumMetadata.venue}
                    onChange={(e) => setAlbumMetadata({ ...albumMetadata, venue: e.target.value })}
                  />
                </div>
                <div className="field">
                  <label>City</label>
                  <input
                    type="text"
                    value={albumMetadata.city}
                    onChange={(e) => setAlbumMetadata({ ...albumMetadata, city: e.target.value })}
                  />
                </div>
                <div className="field">
                  <label>State</label>
                  <input
                    type="text"
                    value={albumMetadata.state}
                    onChange={(e) => setAlbumMetadata({ ...albumMetadata, state: e.target.value })}
                  />
                </div>
                <div className="field">
                  <label>Source Type</label>
                  <select
                    value={albumMetadata.sourceType}
                    onChange={(e) => setAlbumMetadata({ ...albumMetadata, sourceType: e.target.value })}
                  >
                    <option value="SBD">Soundboard (SBD)</option>
                    <option value="AUD">Audience (AUD)</option>
                    <option value="MATRIX">Matrix</option>
                    <option value="OFFICIAL">Official Release</option>
                  </select>
                </div>
                <div className="field">
                  <label>Taper</label>
                  <input
                    type="text"
                    value={albumMetadata.taper}
                    onChange={(e) => setAlbumMetadata({ ...albumMetadata, taper: e.target.value })}
                  />
                </div>
                <div className="field">
                  <label>Genre</label>
                  <input
                    type="text"
                    value={albumMetadata.genre}
                    onChange={(e) => setAlbumMetadata({ ...albumMetadata, genre: e.target.value })}
                  />
                </div>
                <div className="field">
                  <label>Year</label>
                  <input
                    type="text"
                    value={albumMetadata.year}
                    onChange={(e) => setAlbumMetadata({ ...albumMetadata, year: e.target.value })}
                  />
                </div>
                <div className="field" style={{ gridColumn: 'span 2' }}>
                  <label>Lineage</label>
                  <textarea
                    value={albumMetadata.lineage}
                    onChange={(e) => setAlbumMetadata({ ...albumMetadata, lineage: e.target.value })}
                    placeholder="e.g., SBD > Cassette Master > DAT > CDR > FLAC"
                  />
                </div>
                <div className="field" style={{ gridColumn: 'span 2' }}>
                  <label>Notes</label>
                  <textarea
                    value={albumMetadata.notes}
                    onChange={(e) => setAlbumMetadata({ ...albumMetadata, notes: e.target.value })}
                  />
                </div>
              </AlbumMetadata>
            )}
          </AlbumHeader>

          <TracksContainer>
            <TracksTable>
              <thead>
                <tr>
                  <th>
                    <input
                      type="checkbox"
                      checked={selectedTracks.size === Object.keys(trackData).length && Object.keys(trackData).length > 0}
                      onChange={handleSelectAllTracks}
                    />
                  </th>
                  <th className="track-number">#</th>
                  <th>Title</th>
                  <th>Artist</th>
                  <th>Album</th>
                  <th className="duration">Duration</th>
                  <th>Source</th>
                  <th className="actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {console.log('Rendering tracks, trackData:', trackData, 'Count:', Object.keys(trackData).length)}
                {Object.values(trackData).map(track => (
                  <tr
                    key={track.id}
                    className={selectedTracks.has(track.id) ? 'selected' : ''}
                  >
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedTracks.has(track.id)}
                        onChange={() => handleTrackSelect(track.id)}
                      />
                    </td>
                    <td className="track-number">{track.track_number}</td>
                    <td>
                      <input
                        type="text"
                        value={track.song_title || track.title || ''}
                        onChange={(e) => {
                          setTrackData(prev => ({
                            ...prev,
                            [track.id]: { ...track, song_title: e.target.value }
                          }));
                        }}
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        value={albumMetadata.artist}
                        disabled={!editingAlbum}
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        value={albumMetadata.album}
                        disabled={!editingAlbum}
                      />
                    </td>
                    <td className="duration">{formatDuration(track.duration)}</td>
                    <td>{track.source_type || albumMetadata.sourceType}</td>
                    <td className="actions">
                      <button
                        title="Save track changes"
                        onClick={async () => {
                          try {
                            await window.api.updateTrack(track.id, {
                              title: track.song_title || track.title
                            });
                            alert('Track updated successfully');
                            // Reload tracks to show updated data
                            if (selectedShow) {
                              await loadShowTracks(selectedShow);
                            }
                          } catch (error) {
                            console.error('Error updating track:', error);
                            alert('Failed to update track');
                          }
                        }}
                      >
                        <Edit />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </TracksTable>
          </TracksContainer>
        </MainContent>
      ) : (
        <TracksContainer>
          {filteredShows.map(show => (
            <ShowCard
              key={show.id}
              show={show}
              expanded={expandedShows.has(show.id)}
              onToggle={toggleShow}
              onAction={(action, selectedShow) => {
                if (action === 'tracks') {
                  setSelectedShow(selectedShow);
                  setExpandedShows(new Set([selectedShow.id]));
                }
              }}
              showActions={true}
            />
          ))}
        </TracksContainer>
      )}
    </PageContainer>
  );
}

export default TracksPage;