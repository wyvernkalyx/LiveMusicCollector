import React, { useState } from 'react';
import styled from '@emotion/styled';
import { Play, Pause, Edit2, Check, X } from 'lucide-react';
import { theme } from '../styles/globalStyles';

const Container = styled.div`
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
`;

const TableContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.borderRadius.md};

  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: ${theme.colors.background.elevated};
  }

  &::-webkit-scrollbar-thumb {
    background: ${theme.colors.border};
    border-radius: 4px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: ${theme.colors.text.secondary};
  }
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;

  thead {
    position: sticky;
    top: 0;
    background: ${theme.colors.background.elevated};
    z-index: 1;
    border-bottom: 2px solid ${theme.colors.border};
  }

  th {
    padding: ${theme.spacing.sm} ${theme.spacing.md};
    text-align: left;
    font-size: ${theme.typography.fontSize.sm};
    font-weight: 600;
    color: ${theme.colors.text.secondary};
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  tbody tr {
    border-bottom: 1px solid ${theme.colors.border};
    transition: background 0.15s;

    &:hover {
      background: ${theme.colors.background.elevated};
    }

    &.playing {
      background: ${theme.colors.accent.primary}15;
    }
  }

  td {
    padding: ${theme.spacing.sm} ${theme.spacing.md};
    font-size: ${theme.typography.fontSize.md};
    color: ${theme.colors.text.primary};
  }
`;

const TrackNumber = styled.div`
  font-weight: 600;
  color: ${theme.colors.text.secondary};
  min-width: 30px;
`;

const TitleCell = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};
  flex: 1;

  input {
    flex: 1;
    padding: ${theme.spacing.xs} ${theme.spacing.sm};
    background: ${theme.colors.background.default};
    border: 1px solid ${theme.colors.accent.primary};
    border-radius: ${theme.borderRadius.sm};
    color: ${theme.colors.text.primary};
    font-size: ${theme.typography.fontSize.md};

    &:focus {
      outline: none;
      border-color: ${theme.colors.accent.secondary};
    }
  }

  .view {
    flex: 1;
    cursor: pointer;
    padding: ${theme.spacing.xs} 0;

    &:hover {
      color: ${theme.colors.accent.primary};
    }
  }
`;

const DateCell = styled.div`
  input {
    padding: ${theme.spacing.xs} ${theme.spacing.sm};
    background: ${theme.colors.background.default};
    border: 1px solid ${theme.colors.border};
    border-radius: ${theme.borderRadius.sm};
    color: ${theme.colors.text.primary};
    font-size: ${theme.typography.fontSize.sm};
    cursor: pointer;

    &:focus {
      outline: none;
      border-color: ${theme.colors.accent.primary};
    }
  }

  .view {
    padding: ${theme.spacing.xs} 0;
    cursor: pointer;

    &:hover {
      color: ${theme.colors.accent.primary};
    }
  }
`;

const PlayButton = styled.button`
  padding: ${theme.spacing.xs};
  background: transparent;
  color: ${theme.colors.accent.primary};
  border-radius: ${theme.borderRadius.sm};
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background: ${theme.colors.accent.primary}20;
  }

  svg {
    width: 20px;
    height: 20px;
  }
`;

const EditButton = styled.button`
  padding: ${theme.spacing.xs};
  background: transparent;
  color: ${theme.colors.text.secondary};
  border-radius: ${theme.borderRadius.sm};
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background: ${theme.colors.background.elevated};
    color: ${theme.colors.text.primary};
  }

  svg {
    width: 16px;
    height: 16px;
  }
`;

const Duration = styled.div`
  font-variant-numeric: tabular-nums;
  color: ${theme.colors.text.secondary};
`;

const Format = styled.div`
  font-size: ${theme.typography.fontSize.sm};
  color: ${theme.colors.text.secondary};
  text-transform: uppercase;
  font-weight: 500;
`;

/**
 * TrackMetadataGrid - Editable grid for track-level metadata
 *
 * Features:
 * - Inline editing of track title and date
 * - Play button per track
 * - Visual indicator for currently playing track
 * - Quick edit mode with double-click
 */
const TrackMetadataGrid = ({ tracks, onTrackChange, onPlayTrack, currentTrack, isPlaying }) => {
  const [editingTrack, setEditingTrack] = useState(null);
  const [editingField, setEditingField] = useState(null);
  const [editValue, setEditValue] = useState('');

  /**
   * Start editing a field
   */
  const startEdit = (track, field) => {
    setEditingTrack(track.id);
    setEditingField(field);
    setEditValue(track[field] || '');
  };

  /**
   * Save edit
   */
  const saveEdit = () => {
    if (editingTrack && editingField) {
      onTrackChange(editingTrack, editingField, editValue);
    }
    setEditingTrack(null);
    setEditingField(null);
    setEditValue('');
  };

  /**
   * Cancel edit
   */
  const cancelEdit = () => {
    setEditingTrack(null);
    setEditingField(null);
    setEditValue('');
  };

  /**
   * Format duration in MM:SS
   */
  const formatDuration = (seconds) => {
    if (!seconds) return '--:--';

    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  /**
   * Handle play button click
   */
  const handlePlay = (track) => {
    onPlayTrack(track);
  };

  return (
    <Container>
      <TableContainer>
        <Table>
          <thead>
            <tr>
              <th style={{ width: '50px' }}>#</th>
              <th style={{ width: '60px' }}>Play</th>
              <th>Title</th>
              <th style={{ width: '140px' }}>Date</th>
              <th style={{ width: '80px' }}>Duration</th>
              <th style={{ width: '80px' }}>Format</th>
            </tr>
          </thead>
          <tbody>
            {tracks.map((track) => {
              const isCurrentTrack = currentTrack && currentTrack.id === track.id;
              const isEditingTitle = editingTrack === track.id && editingField === 'title';
              const isEditingDate = editingTrack === track.id && editingField === 'date';

              return (
                <tr key={track.id} className={isCurrentTrack ? 'playing' : ''}>
                  {/* Track Number */}
                  <td>
                    <TrackNumber>{track.trackNumber}</TrackNumber>
                  </td>

                  {/* Play Button */}
                  <td>
                    <PlayButton onClick={() => handlePlay(track)}>
                      {isCurrentTrack && isPlaying ? <Pause /> : <Play />}
                    </PlayButton>
                  </td>

                  {/* Title (editable) */}
                  <td>
                    <TitleCell>
                      {isEditingTitle ? (
                        <>
                          <input
                            type="text"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveEdit();
                              if (e.key === 'Escape') cancelEdit();
                            }}
                            autoFocus
                          />
                          <EditButton onClick={saveEdit} title="Save">
                            <Check />
                          </EditButton>
                          <EditButton onClick={cancelEdit} title="Cancel">
                            <X />
                          </EditButton>
                        </>
                      ) : (
                        <>
                          <div
                            className="view"
                            onDoubleClick={() => startEdit(track, 'title')}
                            title="Double-click to edit"
                          >
                            {track.title}
                          </div>
                          <EditButton
                            onClick={() => startEdit(track, 'title')}
                            title="Edit title"
                          >
                            <Edit2 />
                          </EditButton>
                        </>
                      )}
                    </TitleCell>
                  </td>

                  {/* Date (editable) */}
                  <td>
                    <DateCell>
                      {isEditingDate ? (
                        <input
                          type="date"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={saveEdit}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') saveEdit();
                            if (e.key === 'Escape') cancelEdit();
                          }}
                          autoFocus
                        />
                      ) : (
                        <div
                          className="view"
                          onClick={() => startEdit(track, 'date')}
                          title="Click to edit date"
                        >
                          {track.date || 'No date'}
                        </div>
                      )}
                    </DateCell>
                  </td>

                  {/* Duration */}
                  <td>
                    <Duration>{formatDuration(track.duration)}</Duration>
                  </td>

                  {/* Format */}
                  <td>
                    <Format>{track.format || 'N/A'}</Format>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      </TableContainer>
    </Container>
  );
};

export default TrackMetadataGrid;
