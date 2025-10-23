import React from 'react';
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
  Hash,
  Clock,
  MessageSquare,
  RefreshCw,
  Copy,
  CheckCircle
} from 'lucide-react';
import { theme } from '../styles/globalStyles';
import { useStore } from '../store';

const PageContainer = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: ${theme.spacing.lg};
`;

const Header = styled.div`
  margin-bottom: ${theme.spacing.xl};

  h2 {
    font-size: ${theme.typography.fontSize.xl};
    font-weight: 600;
    margin-bottom: ${theme.spacing.sm};
  }

  p {
    color: ${theme.colors.text.secondary};
  }
`;

const ToolBar = styled.div`
  display: flex;
  gap: ${theme.spacing.md};
  margin-bottom: ${theme.spacing.lg};
  padding: ${theme.spacing.md};
  background: ${theme.colors.background.surface};
  border-radius: ${theme.borderRadius.lg};
  align-items: center;

  .section {
    display: flex;
    gap: ${theme.spacing.sm};
    align-items: center;
    padding: 0 ${theme.spacing.md};
    border-right: 1px solid ${theme.colors.border};

    &:last-child {
      border-right: none;
    }
  }

  button {
    padding: ${theme.spacing.sm} ${theme.spacing.md};
    background: ${theme.colors.background.elevated};
    color: ${theme.colors.text.primary};
    border: 1px solid ${theme.colors.border};
    border-radius: ${theme.borderRadius.md};
    display: flex;
    align-items: center;
    gap: ${theme.spacing.xs};
    font-size: ${theme.typography.fontSize.sm};
    transition: all ${theme.transitions.fast};

    &:hover {
      background: ${theme.colors.accent.primary};
      color: white;
      border-color: ${theme.colors.accent.primary};
    }

    &.active {
      background: ${theme.colors.accent.primary};
      color: white;
      border-color: ${theme.colors.accent.primary};
    }

    svg {
      width: 16px;
      height: 16px;
    }
  }

  input[type="date"] {
    padding: ${theme.spacing.sm};
    background: ${theme.colors.background.elevated};
    border: 1px solid ${theme.colors.border};
    border-radius: ${theme.borderRadius.sm};
    color: ${theme.colors.text.primary};
  }

  .info {
    margin-left: auto;
    color: ${theme.colors.text.secondary};
    font-size: ${theme.typography.fontSize.sm};
  }
`;

const TrackGrid = styled.div`
  flex: 1;
  overflow: auto;
  background: ${theme.colors.background.surface};
  border-radius: ${theme.borderRadius.lg};
`;

const GridTable = styled.table`
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;

  thead {
    position: sticky;
    top: 0;
    background: ${theme.colors.background.elevated};
    z-index: 10;

    th {
      padding: ${theme.spacing.md};
      text-align: left;
      font-weight: 600;
      font-size: ${theme.typography.fontSize.sm};
      color: ${theme.colors.text.secondary};
      border-bottom: 2px solid ${theme.colors.border};
      white-space: nowrap;

      &.center {
        text-align: center;
      }

      &.track-col {
        width: 80px;
      }

      &.duration-col {
        width: 80px;
      }

      &.segue-col {
        width: 60px;
        text-align: center;
      }

      &.actions-col {
        width: 100px;
      }
    }
  }

  tbody {
    tr {
      transition: background ${theme.transitions.fast};

      &:hover {
        background: ${theme.colors.background.elevated}50;
      }

      &.selected {
        background: ${theme.colors.accent.primary}15;
      }

      &.disc-break {
        border-top: 3px solid ${theme.colors.accent.primary};
      }

      td {
        padding: ${theme.spacing.sm} ${theme.spacing.md};
        border-bottom: 1px solid ${theme.colors.border};
        font-size: ${theme.typography.fontSize.sm};

        &.center {
          text-align: center;
        }

        input[type="text"],
        input[type="number"],
        textarea {
          width: 100%;
          padding: ${theme.spacing.xs} ${theme.spacing.sm};
          background: transparent;
          border: 1px solid transparent;
          border-radius: ${theme.borderRadius.sm};
          color: ${theme.colors.text.primary};
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

        input[type="number"] {
          width: 60px;
          text-align: center;
        }

        input[type="checkbox"] {
          cursor: pointer;
        }

        textarea {
          min-height: 32px;
          resize: vertical;
        }

        .track-number {
          font-weight: 600;
          font-family: 'Monaco', 'Consolas', monospace;
          color: ${theme.colors.text.secondary};
        }

        .title-input {
          font-weight: 500;
        }

        .duration {
          font-family: 'Monaco', 'Consolas', monospace;
          color: ${theme.colors.text.secondary};
        }

        .segue-toggle {
          width: 32px;
          height: 20px;
          background: ${theme.colors.background.elevated};
          border: 1px solid ${theme.colors.border};
          border-radius: 10px;
          position: relative;
          cursor: pointer;
          transition: all ${theme.transitions.fast};

          &.active {
            background: ${theme.colors.accent.primary};
            border-color: ${theme.colors.accent.primary};

            &::after {
              transform: translateX(12px);
            }
          }

          &::after {
            content: '';
            position: absolute;
            top: 2px;
            left: 2px;
            width: 14px;
            height: 14px;
            background: white;
            border-radius: 50%;
            transition: transform ${theme.transitions.fast};
          }
        }
      }
    }
  }
`;

const StatusBar = styled.div`
  margin-top: ${theme.spacing.md};
  padding: ${theme.spacing.md};
  background: ${theme.colors.background.surface};
  border-radius: ${theme.borderRadius.md};
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: ${theme.typography.fontSize.sm};
  color: ${theme.colors.text.secondary};

  .status-section {
    display: flex;
    gap: ${theme.spacing.lg};
    align-items: center;

    .status-item {
      display: flex;
      align-items: center;
      gap: ${theme.spacing.xs};

      svg {
        width: 14px;
        height: 14px;
      }

      &.success {
        color: ${theme.colors.status.success};
      }

      &.warning {
        color: ${theme.colors.status.warning};
      }
    }
  }
`;

function TrackManagementPage() {
  const { shows, fetchShows } = useStore();
  const [selectedShow, setSelectedShow] = React.useState(null);
  const [tracks, setTracks] = React.useState([]);
  const [selectedTracks, setSelectedTracks] = React.useState(new Set());
  const [editMode, setEditMode] = React.useState(false);
  const [autoNumber, setAutoNumber] = React.useState(true);
  const [bulkDate, setBulkDate] = React.useState('');
  const [saveStatus, setSaveStatus] = React.useState(null);

  React.useEffect(() => {
    fetchShows();
  }, [fetchShows]);

  React.useEffect(() => {
    if (selectedShow) {
      loadTracks(selectedShow.id);
    }
  }, [selectedShow]);

  const loadTracks = async (showId) => {
    try {
      const loadedTracks = await window.api.getTracksByShow(showId);

      // Format tracks with proper numbering and title formatting
      const formattedTracks = loadedTracks.map(track => ({
        ...track,
        disc_number: track.disc_number || Math.floor((track.track_number - 1) / 100) + 1,
        song_name: track.song_name || track.song_title || track.title || '',
        performance_date: track.performance_date || track.date || selectedShow?.date,
        has_segue: track.has_segue || track.segue_type === '>',
        comment: track.comment || ''
      }));

      setTracks(formattedTracks);
    } catch (error) {
      console.error('Error loading tracks:', error);
    }
  };

  // Generate track number based on disc/set (101, 201, 301, etc.)
  const getTrackNumber = (discNumber, position) => {
    return (discNumber * 100) + position;
  };

  // Format track title with segue and date
  const formatTrackTitle = (songName, hasSegue, performanceDate) => {
    let title = songName || 'Unknown Track';

    if (hasSegue) {
      title += ' >';
    }

    if (performanceDate) {
      title += ` (${performanceDate})`;
    }

    return title;
  };

  // Parse track title back into components
  const parseTrackTitle = (title) => {
    const segueMatch = title.match(/(.+?)\s*>\s*(\(.+\))?$/);
    const dateMatch = title.match(/\((\d{4}-\d{2}-\d{2})\)$/);

    let songName = title;
    let hasSegue = false;
    let date = null;

    if (segueMatch) {
      songName = segueMatch[1].trim();
      hasSegue = true;
    }

    if (dateMatch) {
      date = dateMatch[1];
      songName = songName.replace(/\s*\(\d{4}-\d{2}-\d{2}\)$/, '').trim();
    }

    return { songName, hasSegue, date };
  };

  const handleTrackChange = (trackId, field, value) => {
    setTracks(tracks.map(track =>
      track.id === trackId
        ? { ...track, [field]: value }
        : track
    ));
  };

  const handleAutoNumber = () => {
    const numbered = [...tracks];
    let currentDisc = 1;
    let positionInDisc = 1;

    numbered.forEach((track, index) => {
      // Check if we should start a new disc
      if (index > 0 && (positionInDisc > 99 || track.disc_number > currentDisc)) {
        currentDisc = track.disc_number || currentDisc + 1;
        positionInDisc = 1;
      }

      track.disc_number = currentDisc;
      track.track_number = getTrackNumber(currentDisc, positionInDisc);
      positionInDisc++;
    });

    setTracks(numbered);
  };

  const handleBulkDateUpdate = () => {
    if (!bulkDate) return;

    if (selectedTracks.size > 0) {
      // Update only selected tracks
      setTracks(tracks.map(track =>
        selectedTracks.has(track.id)
          ? { ...track, performance_date: bulkDate }
          : track
      ));
    } else {
      // Update all tracks
      setTracks(tracks.map(track => ({
        ...track,
        performance_date: bulkDate
      })));
    }
  };

  const handleSaveChanges = async () => {
    try {
      setSaveStatus('saving');

      for (const track of tracks) {
        // Generate formatted title
        const formattedTitle = formatTrackTitle(
          track.song_name,
          track.has_segue,
          track.performance_date
        );

        await window.api.updateTrack(track.id, {
          track_number: track.track_number,
          disc_number: track.disc_number,
          song_name: track.song_name,
          performance_date: track.performance_date,
          has_segue: track.has_segue,
          comment: track.comment,
          title: formattedTitle // Store formatted title
        });
      }

      setSaveStatus('success');
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (error) {
      console.error('Error saving tracks:', error);
      setSaveStatus('error');
    }
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSelectAll = () => {
    if (selectedTracks.size === tracks.length) {
      setSelectedTracks(new Set());
    } else {
      setSelectedTracks(new Set(tracks.map(t => t.id)));
    }
  };

  return (
    <PageContainer>
      <Header>
        <h2>Track Management</h2>
        <p>Advanced track editing with disc numbering and title formatting</p>
      </Header>

      <ToolBar>
        <div className="section">
          <select
            value={selectedShow?.id || ''}
            onChange={(e) => {
              const show = shows.find(s => s.id === parseInt(e.target.value));
              setSelectedShow(show);
            }}
          >
            <option value="">Select a show...</option>
            {shows.map(show => (
              <option key={show.id} value={show.id}>
                {show.date} - {show.venue_name || 'Unknown Venue'}
              </option>
            ))}
          </select>
        </div>

        <div className="section">
          <button
            onClick={handleAutoNumber}
            title="Auto-number tracks with disc breaks (101, 201, 301)"
          >
            <Hash />
            Auto Number
          </button>

          <input
            type="text"
            value={bulkDate}
            onChange={(e) => setBulkDate(e.target.value)}
            placeholder="YYYY-MM-DD"
            pattern="\d{4}-\d{2}-\d{2}"
            title="Set performance date for tracks (format: YYYY-MM-DD)"
            style={{
              borderColor: bulkDate && !/^\d{4}-\d{2}-\d{2}$/.test(bulkDate) ? 'red' : undefined,
              color: bulkDate && !/^\d{4}-\d{2}-\d{2}$/.test(bulkDate) ? 'red' : undefined
            }}
          />

          <button
            onClick={handleBulkDateUpdate}
            disabled={!bulkDate || !/^\d{4}-\d{2}-\d{2}$/.test(bulkDate)}
            title={selectedTracks.size > 0
              ? `Apply date to ${selectedTracks.size} selected tracks (format: YYYY-MM-DD)`
              : 'Apply date to all tracks (format: YYYY-MM-DD)'
            }
          >
            <Calendar />
            Set Date
          </button>

          <button
            onClick={() => {
              const selected = tracks.filter(t => selectedTracks.has(t.id));
              selected.forEach(track => {
                track.has_segue = !track.has_segue;
              });
              setTracks([...tracks]);
            }}
            disabled={selectedTracks.size === 0}
            title="Toggle segue for selected tracks"
          >
            <ChevronRight />
            Toggle Segue
          </button>
        </div>

        <div className="section">
          <button
            className={editMode ? 'active' : ''}
            onClick={() => setEditMode(!editMode)}
          >
            <Edit />
            {editMode ? 'View Mode' : 'Edit Mode'}
          </button>

          <button
            onClick={handleSaveChanges}
            disabled={!editMode}
          >
            <Save />
            Save All Changes
          </button>
        </div>

        <div className="info">
          {tracks.length} tracks
          {selectedTracks.size > 0 && ` • ${selectedTracks.size} selected`}
        </div>
      </ToolBar>

      <TrackGrid>
        <GridTable>
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  checked={selectedTracks.size === tracks.length && tracks.length > 0}
                  onChange={handleSelectAll}
                />
              </th>
              <th className="track-col">Track</th>
              <th>Song Title</th>
              <th className="duration-col">Duration</th>
              <th className="segue-col">Segue</th>
              <th>Comment</th>
            </tr>
          </thead>
          <tbody>
            {tracks.map((track, index) => {
              const isDiscBreak = index > 0 &&
                track.disc_number !== tracks[index - 1].disc_number;

              return (
                <tr
                  key={track.id}
                  className={`
                    ${selectedTracks.has(track.id) ? 'selected' : ''}
                    ${isDiscBreak ? 'disc-break' : ''}
                  `}
                >
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedTracks.has(track.id)}
                      onChange={(e) => {
                        const selected = new Set(selectedTracks);
                        if (e.target.checked) {
                          selected.add(track.id);
                        } else {
                          selected.delete(track.id);
                        }
                        setSelectedTracks(selected);
                      }}
                    />
                  </td>
                  <td>
                    {editMode ? (
                      <input
                        type="number"
                        value={track.track_number}
                        onChange={(e) => handleTrackChange(
                          track.id,
                          'track_number',
                          parseInt(e.target.value)
                        )}
                      />
                    ) : (
                      <span className="track-number">
                        {String(track.track_number).padStart(3, '0')}
                      </span>
                    )}
                  </td>
                  <td>
                    {editMode ? (
                      <input
                        type="text"
                        className="title-input"
                        value={track.song_name}
                        onChange={(e) => handleTrackChange(
                          track.id,
                          'song_name',
                          e.target.value
                        )}
                        placeholder="Song title..."
                      />
                    ) : (
                      <span className="title-display">
                        {formatTrackTitle(
                          track.song_name,
                          track.has_segue,
                          track.performance_date
                        )}
                      </span>
                    )}
                  </td>
                  <td>
                    <span className="duration">{formatDuration(track.duration)}</span>
                  </td>
                  <td className="center">
                    <div
                      className={`segue-toggle ${track.has_segue ? 'active' : ''}`}
                      onClick={() => editMode && handleTrackChange(
                        track.id,
                        'has_segue',
                        !track.has_segue
                      )}
                      style={{
                        pointerEvents: editMode ? 'auto' : 'none',
                        opacity: editMode ? 1 : 0.6
                      }}
                    />
                  </td>
                  <td>
                    {editMode ? (
                      <textarea
                        value={track.comment || ''}
                        onChange={(e) => handleTrackChange(
                          track.id,
                          'comment',
                          e.target.value
                        )}
                        placeholder="Add comment..."
                        rows="1"
                      />
                    ) : (
                      <span>{track.comment}</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </GridTable>
      </TrackGrid>

      <StatusBar>
        <div className="status-section">
          {saveStatus === 'saving' && (
            <div className="status-item">
              <RefreshCw className="spin" />
              Saving changes...
            </div>
          )}
          {saveStatus === 'success' && (
            <div className="status-item success">
              <CheckCircle />
              All changes saved successfully
            </div>
          )}
          {saveStatus === 'error' && (
            <div className="status-item warning">
              <X />
              Error saving changes
            </div>
          )}
        </div>
        <div className="status-section">
          <div className="status-item">
            Standard Metadata Fields: Album Artist • Album • Track • Title • Year • Comment
          </div>
        </div>
      </StatusBar>
    </PageContainer>
  );
}

export default TrackManagementPage;