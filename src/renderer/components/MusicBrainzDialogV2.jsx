import React, { useState, useEffect, useMemo } from 'react';
import styled from '@emotion/styled';
import {
  Search, X, Music, Calendar, User, Disc, CheckCircle, AlertCircle,
  ExternalLink, Fingerprint, FileAudio, ChevronDown, ChevronRight,
  Check, AlertTriangle, XCircle, ArrowRight, Info, Filter
} from 'lucide-react';
import { theme } from '../styles/globalStyles';

const DialogOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn ${theme.transitions.normal};

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
`;

const DialogContainer = styled.div`
  background: ${theme.colors.background.surface};
  border-radius: ${theme.borderRadius.lg};
  width: 95%;
  max-width: 1400px;
  height: 90vh;
  display: flex;
  flex-direction: column;
  animation: slideUp ${theme.transitions.normal};

  @keyframes slideUp {
    from {
      transform: translateY(20px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }
`;

const DialogHeader = styled.div`
  padding: ${theme.spacing.lg};
  border-bottom: 1px solid ${theme.colors.border};
  display: flex;
  justify-content: space-between;
  align-items: center;

  h2 {
    font-size: ${theme.typography.fontSize.lg};
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: ${theme.spacing.sm};

    svg {
      width: 20px;
      height: 20px;
      color: ${theme.colors.accent.primary};
    }
  }

  button {
    padding: ${theme.spacing.xs};
    background: transparent;
    border-radius: ${theme.borderRadius.sm};
    color: ${theme.colors.text.secondary};

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

const MainContent = styled.div`
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
`;

const AlbumComparison = styled.div`
  padding: ${theme.spacing.lg};
  background: ${theme.colors.background.elevated};
  border-bottom: 1px solid ${theme.colors.border};
  display: grid;
  grid-template-columns: 40% 60%;
  gap: ${theme.spacing.xl};

  .album-panel {
    display: flex;
    gap: ${theme.spacing.md};

    .album-art {
      width: 120px;
      height: 120px;
      background: ${theme.colors.background.surface};
      border-radius: ${theme.borderRadius.md};
      display: flex;
      align-items: center;
      justify-content: center;
      border: 1px solid ${theme.colors.border};
      overflow: hidden;

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      svg {
        width: 40px;
        height: 40px;
        color: ${theme.colors.text.secondary};
        opacity: 0.5;
      }
    }

    .album-info {
      flex: 1;

      .album-title {
        font-size: ${theme.typography.fontSize.md};
        font-weight: 600;
        margin-bottom: ${theme.spacing.xs};
        color: ${theme.colors.text.primary};
      }

      .album-artist {
        color: ${theme.colors.text.secondary};
        margin-bottom: ${theme.spacing.sm};
      }

      .album-meta {
        display: flex;
        flex-direction: column;
        gap: ${theme.spacing.xs};
        font-size: ${theme.typography.fontSize.sm};

        .meta-item {
          display: flex;
          align-items: center;
          gap: ${theme.spacing.xs};
          color: ${theme.colors.text.secondary};

          svg {
            width: 14px;
            height: 14px;
          }
        }
      }
    }
  }

  .match-info {
    display: flex;
    align-items: flex-end;
    flex-direction: column;
    gap: ${theme.spacing.sm};

    .confidence-badge {
      padding: ${theme.spacing.sm} ${theme.spacing.md};
      background: ${props => props.confidence > 80
        ? theme.colors.status.success + '20'
        : props.confidence > 60
        ? theme.colors.status.warning + '20'
        : theme.colors.status.error + '20'};
      color: ${props => props.confidence > 80
        ? theme.colors.status.success
        : props.confidence > 60
        ? theme.colors.status.warning
        : theme.colors.status.error};
      border-radius: ${theme.borderRadius.md};
      font-weight: 600;
      font-size: ${theme.typography.fontSize.md};
      display: flex;
      align-items: center;
      gap: ${theme.spacing.xs};

      svg {
        width: 18px;
        height: 18px;
      }
    }

    .release-badges {
      display: flex;
      gap: ${theme.spacing.xs};

      span {
        padding: ${theme.spacing.xs} ${theme.spacing.sm};
        background: ${theme.colors.background.surface};
        border-radius: ${theme.borderRadius.sm};
        font-size: ${theme.typography.fontSize.xs};
        display: flex;
        align-items: center;
        gap: ${theme.spacing.xs};
        border: 1px solid ${theme.colors.border};

        svg {
          width: 12px;
          height: 12px;
        }
      }
    }
  }
`;

const TracksComparison = styled.div`
  flex: 1;
  overflow: hidden;
  display: grid;
  grid-template-columns: 40% 60%;
  position: relative;

  .panel {
    overflow-y: auto;
    padding: ${theme.spacing.lg};

    h3 {
      font-size: ${theme.typography.fontSize.md};
      font-weight: 600;
      margin-bottom: ${theme.spacing.md};
      color: ${theme.colors.text.primary};
      display: flex;
      align-items: center;
      justify-content: space-between;

      .track-count {
        font-size: ${theme.typography.fontSize.sm};
        font-weight: normal;
        color: ${theme.colors.text.secondary};
      }
    }
  }

  .divider {
    position: absolute;
    left: 40%;
    top: 0;
    bottom: 0;
    width: 1px;
    background: ${theme.colors.border};
  }
`;

const TrackRow = styled.div`
  display: flex;
  align-items: center;
  padding: ${theme.spacing.sm};
  border-radius: ${theme.borderRadius.sm};
  margin-bottom: ${theme.spacing.xs};
  background: ${props => props.selected
    ? theme.colors.accent.primary + '10'
    : props.matchType === 'perfect'
    ? theme.colors.status.success + '10'
    : props.matchType === 'partial'
    ? theme.colors.status.warning + '10'
    : props.matchType === 'none'
    ? theme.colors.status.error + '05'
    : theme.colors.background.surface};
  border: 1px solid ${props => props.selected
    ? theme.colors.accent.primary + '50'
    : props.matchType === 'perfect'
    ? theme.colors.status.success + '30'
    : props.matchType === 'partial'
    ? theme.colors.status.warning + '30'
    : props.matchType === 'none'
    ? theme.colors.status.error + '20'
    : theme.colors.border};
  cursor: ${props => props.clickable ? 'pointer' : 'default'};
  transition: all ${theme.transitions.fast};

  &:hover {
    ${props => props.clickable && `
      transform: translateX(2px);
      border-color: ${theme.colors.accent.primary};
    `}
  }

  .checkbox {
    margin-right: ${theme.spacing.sm};
    width: 18px;
    height: 18px;
    cursor: pointer;
  }

  .track-number {
    width: 30px;
    text-align: center;
    font-size: ${theme.typography.fontSize.sm};
    color: ${theme.colors.text.secondary};
    font-weight: 600;
  }

  .track-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 2px;
    margin: 0 ${theme.spacing.sm};

    .track-title {
      font-size: ${theme.typography.fontSize.sm};
      color: ${theme.colors.text.primary};
      font-weight: ${props => props.hasChange ? 600 : 400};
    }

    .track-meta {
      display: flex;
      align-items: center;
      gap: ${theme.spacing.sm};
      font-size: ${theme.typography.fontSize.xs};
      color: ${theme.colors.text.secondary};

      .change-indicator {
        color: ${theme.colors.accent.primary};
        font-weight: 600;
      }
    }
  }

  .track-duration {
    font-size: ${theme.typography.fontSize.sm};
    color: ${theme.colors.text.secondary};
    margin-right: ${theme.spacing.sm};
  }

  .match-indicator {
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;

    svg {
      width: 16px;
      height: 16px;
      color: ${props => props.matchType === 'perfect'
        ? theme.colors.status.success
        : props.matchType === 'partial'
        ? theme.colors.status.warning
        : props.matchType === 'none'
        ? theme.colors.status.error
        : theme.colors.text.secondary};
    }
  }
`;

const FilterBar = styled.div`
  padding: ${theme.spacing.md} ${theme.spacing.lg};
  background: ${theme.colors.background.elevated};
  border-bottom: 1px solid ${theme.colors.border};
  display: flex;
  align-items: center;
  gap: ${theme.spacing.md};

  .filter-group {
    display: flex;
    align-items: center;
    gap: ${theme.spacing.xs};

    label {
      font-size: ${theme.typography.fontSize.sm};
      color: ${theme.colors.text.secondary};
    }
  }
`;

const FilterButton = styled.button`
  padding: ${theme.spacing.xs} ${theme.spacing.sm};
  background: ${props => props.$active ? theme.colors.accent.primary : theme.colors.background.surface};
  color: ${props => props.$active ? 'white' : theme.colors.text.primary};
  border: 1px solid ${props => props.$active ? theme.colors.accent.primary : theme.colors.border};
  border-radius: ${theme.borderRadius.sm};
  font-size: ${theme.typography.fontSize.sm};
  cursor: pointer;
  transition: all ${theme.transitions.fast};

  &:hover {
    background: ${props => props.$active ? theme.colors.accent.secondary : theme.colors.background.elevated};
  }
`;

const StatusBar = styled.div`
  padding: ${theme.spacing.md} ${theme.spacing.lg};
  background: ${theme.colors.background.elevated};
  border-top: 1px solid ${theme.colors.border};
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: ${theme.typography.fontSize.sm};

  .status-summary {
    display: flex;
    align-items: center;
    gap: ${theme.spacing.lg};
    color: ${theme.colors.text.secondary};

    .status-item {
      display: flex;
      align-items: center;
      gap: ${theme.spacing.xs};

      strong {
        color: ${theme.colors.text.primary};
      }

      svg {
        width: 14px;
        height: 14px;
      }
    }
  }

  .actions {
    display: flex;
    gap: ${theme.spacing.sm};

    button {
      padding: ${theme.spacing.sm} ${theme.spacing.lg};
      border-radius: ${theme.borderRadius.md};
      font-weight: 600;
      cursor: pointer;
      transition: all ${theme.transitions.fast};

      &.cancel {
        background: ${theme.colors.background.surface};
        color: ${theme.colors.text.primary};
        border: 1px solid ${theme.colors.border};

        &:hover {
          background: ${theme.colors.background.secondary};
        }
      }

      &.apply {
        background: ${theme.colors.accent.primary};
        color: white;
        border: none;

        &:hover {
          background: ${theme.colors.accent.secondary};
        }

        &:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      }
    }
  }
`;

function MusicBrainzDialogV2({ initialData, onApply, onClose }) {
  const [selectedRelease, setSelectedRelease] = useState(null);
  const [selectedTracks, setSelectedTracks] = useState(new Set());
  const [filter, setFilter] = useState('all'); // all, matched, unmatched, modified
  const [isSearching, setIsSearching] = useState(false);
  const [releases, setReleases] = useState([]);
  const [trackMatches, setTrackMatches] = useState(new Map());

  // Calculate match statistics
  const matchStats = useMemo(() => {
    const stats = {
      total: initialData?.tracks?.length || 0,
      perfect: 0,
      partial: 0,
      unmatched: 0,
      modified: 0
    };

    trackMatches.forEach(match => {
      if (match.type === 'perfect') stats.perfect++;
      else if (match.type === 'partial') stats.partial++;
      else if (match.type === 'none') stats.unmatched++;
      if (match.hasChanges) stats.modified++;
    });

    return stats;
  }, [trackMatches, initialData]);

  // Format duration helper
  const formatDuration = (seconds) => {
    if (!seconds) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = String(Math.floor(seconds % 60)).padStart(2, '0');
    return `${mins}:${secs}`;
  };

  // Determine match type for a track
  const getMatchType = (localTrack, mbTrack) => {
    if (!mbTrack) return 'none';

    const titleMatch = localTrack.title?.toLowerCase() === mbTrack.title?.toLowerCase();
    const durationMatch = Math.abs((localTrack.duration || 0) - (mbTrack.duration || 0)) < 5;

    if (titleMatch && durationMatch) return 'perfect';
    if (titleMatch || durationMatch) return 'partial';
    return 'none';
  };

  // Handle track selection
  const toggleTrackSelection = (trackId) => {
    setSelectedTracks(prev => {
      const next = new Set(prev);
      if (next.has(trackId)) {
        next.delete(trackId);
      } else {
        next.add(trackId);
      }
      return next;
    });
  };

  // Select all matched tracks
  const selectAllMatched = () => {
    const matched = [];
    trackMatches.forEach((match, trackId) => {
      if (match.type !== 'none') matched.push(trackId);
    });
    setSelectedTracks(new Set(matched));
  };

  // Mock search for demonstration
  useEffect(() => {
    if (initialData?.tracks) {
      setIsSearching(true);
      // Simulate search delay
      setTimeout(() => {
        // Mock matches for demonstration
        const mockMatches = new Map();
        initialData.tracks.forEach((track, index) => {
          const matchType = index % 3 === 0 ? 'perfect' : index % 3 === 1 ? 'partial' : 'none';
          mockMatches.set(track.id || index, {
            type: matchType,
            mbTrack: matchType !== 'none' ? {
              title: track.title || `Track ${index + 1}`,
              duration: track.duration,
              artist: 'Grateful Dead',
              recordingId: `mb-${index}`
            } : null,
            hasChanges: matchType === 'partial'
          });
        });
        setTrackMatches(mockMatches);
        setIsSearching(false);
      }, 1500);
    }
  }, [initialData]);

  return (
    <DialogOverlay onClick={onClose}>
      <DialogContainer onClick={(e) => e.stopPropagation()}>
        <DialogHeader>
          <h2>
            <Search />
            MusicBrainz Lookup
          </h2>
          <button onClick={onClose}>
            <X />
          </button>
        </DialogHeader>

        <MainContent>
          {/* Album Comparison Section */}
          <AlbumComparison confidence={85}>
            <div className="album-panel">
              <div className="album-art">
                <Music />
              </div>
              <div className="album-info">
                <div className="album-title">
                  {initialData?.album || 'Unknown Album'}
                </div>
                <div className="album-artist">
                  {initialData?.artist || 'Unknown Artist'}
                </div>
                <div className="album-meta">
                  <div className="meta-item">
                    <Calendar />
                    {initialData?.date || 'No date'}
                  </div>
                  <div className="meta-item">
                    <Music />
                    {initialData?.tracks?.length || 0} tracks
                  </div>
                </div>
              </div>
            </div>

            <div className="album-panel">
              <div className="album-art">
                <Music />
              </div>
              <div className="album-info">
                <div className="album-title">
                  Blues for Allah (50th Anniversary Deluxe Edition)
                </div>
                <div className="album-artist">
                  Grateful Dead
                </div>
                <div className="album-meta">
                  <div className="meta-item">
                    <Calendar />
                    Released: 2025-09-12 (Original: 1975-09-01)
                  </div>
                  <div className="meta-item">
                    <Music />
                    29 tracks • 2 discs
                  </div>
                  <div className="match-info">
                    <div className="confidence-badge">
                      <CheckCircle />
                      85% Match
                    </div>
                    <div className="release-badges">
                      <span>
                        <Check />
                        Official Release
                      </span>
                      <span>
                        <Disc />
                        Studio Album
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </AlbumComparison>

          {/* Filter Bar */}
          <FilterBar>
            <div className="filter-group">
              <Filter />
              <label>Show:</label>
              <FilterButton
                $active={filter === 'all'}
                onClick={() => setFilter('all')}
              >
                All
              </FilterButton>
              <FilterButton
                $active={filter === 'matched'}
                onClick={() => setFilter('matched')}
              >
                Matched Only
              </FilterButton>
              <FilterButton
                $active={filter === 'unmatched'}
                onClick={() => setFilter('unmatched')}
              >
                Unmatched Only
              </FilterButton>
              <FilterButton
                $active={filter === 'modified'}
                onClick={() => setFilter('modified')}
              >
                Will Change
              </FilterButton>
            </div>
            <div className="filter-group" style={{ marginLeft: 'auto' }}>
              <FilterButton onClick={selectAllMatched}>
                Select All Matched
              </FilterButton>
            </div>
          </FilterBar>

          {/* Tracks Comparison */}
          <TracksComparison>
            <div className="panel">
              <h3>
                Your Tracks
                <span className="track-count">{initialData?.tracks?.length || 0} tracks</span>
              </h3>
              {initialData?.tracks?.map((track, index) => {
                const matchInfo = trackMatches.get(track.id || index);
                return (
                  <TrackRow
                    key={track.id || index}
                    matchType={matchInfo?.type}
                    hasChange={matchInfo?.hasChanges}
                  >
                    <div className="track-number">{index + 1}</div>
                    <div className="track-info">
                      <div className="track-title">
                        {track.title || track.song_title || `Track ${index + 1}`}
                      </div>
                      {track.path && (
                        <div className="track-meta">
                          {track.path.split(/[\\\/]/).pop()}
                        </div>
                      )}
                    </div>
                    <div className="track-duration">
                      {formatDuration(track.duration)}
                    </div>
                    <div className="match-indicator">
                      {matchInfo?.type === 'perfect' && <CheckCircle />}
                      {matchInfo?.type === 'partial' && <AlertTriangle />}
                      {matchInfo?.type === 'none' && <XCircle />}
                    </div>
                  </TrackRow>
                );
              })}
            </div>

            <div className="divider" />

            <div className="panel">
              <h3>
                MusicBrainz Matches
                <span className="track-count">
                  {matchStats.perfect + matchStats.partial} matched
                </span>
              </h3>
              {initialData?.tracks?.map((track, index) => {
                const matchInfo = trackMatches.get(track.id || index);
                const isSelected = selectedTracks.has(track.id || index);

                if (!matchInfo?.mbTrack) {
                  return (
                    <TrackRow key={index} matchType="none">
                      <div className="track-number">--</div>
                      <div className="track-info">
                        <div className="track-title" style={{ opacity: 0.5 }}>
                          No match found
                        </div>
                      </div>
                    </TrackRow>
                  );
                }

                return (
                  <TrackRow
                    key={index}
                    matchType={matchInfo.type}
                    selected={isSelected}
                    clickable
                    onClick={() => toggleTrackSelection(track.id || index)}
                  >
                    <input
                      type="checkbox"
                      className="checkbox"
                      checked={isSelected}
                      onChange={() => toggleTrackSelection(track.id || index)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div className="track-number">
                      {101 + index}
                    </div>
                    <div className="track-info">
                      <div className="track-title">
                        {matchInfo.mbTrack.title}
                      </div>
                      <div className="track-meta">
                        {matchInfo.hasChanges && (
                          <span className="change-indicator">
                            Will be modified
                          </span>
                        )}
                        {matchInfo.mbTrack.recordingId && (
                          <span>MBID: {matchInfo.mbTrack.recordingId}</span>
                        )}
                      </div>
                    </div>
                    <div className="track-duration">
                      {formatDuration(matchInfo.mbTrack.duration)}
                    </div>
                    <div className="match-indicator">
                      <ArrowRight />
                    </div>
                  </TrackRow>
                );
              })}
            </div>
          </TracksComparison>
        </MainContent>

        {/* Status Bar */}
        <StatusBar>
          <div className="status-summary">
            <div className="status-item">
              <Music />
              <strong>{matchStats.total}</strong> tracks
            </div>
            <div className="status-item">
              <CheckCircle />
              <strong>{matchStats.perfect}</strong> perfect matches
            </div>
            <div className="status-item">
              <AlertTriangle />
              <strong>{matchStats.partial}</strong> partial matches
            </div>
            <div className="status-item">
              <XCircle />
              <strong>{matchStats.unmatched}</strong> unmatched
            </div>
            {matchStats.modified > 0 && (
              <div className="status-item">
                <Info />
                <strong>{matchStats.modified}</strong> will be modified
              </div>
            )}
          </div>
          <div className="actions">
            <button className="cancel" onClick={onClose}>
              Cancel
            </button>
            <button
              className="apply"
              onClick={() => onApply(selectedTracks)}
              disabled={selectedTracks.size === 0}
            >
              Apply {selectedTracks.size} Selected Tracks
            </button>
          </div>
        </StatusBar>
      </DialogContainer>
    </DialogOverlay>
  );
}

export default MusicBrainzDialogV2;