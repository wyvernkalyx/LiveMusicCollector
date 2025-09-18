import React, { useState, useEffect, useMemo } from 'react';
import styled from '@emotion/styled';
import { X } from 'lucide-react';

const theme = {
  colors: {
    background: '#1a1a1a',
    surface: '#2d2d2d',
    border: '#3a3a3a',
    text: {
      primary: '#e0e0e0',
      secondary: '#999999',
      dimmed: '#666666'
    },
    accent: '#1e3a5f',
    match: {
      perfect: '#4a9d4a',
      partial: '#d4a644',
      none: '#666666'
    }
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px'
  },
  transitions: {
    fast: '150ms ease',
    normal: '250ms ease'
  }
};

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const Dialog = styled.div`
  background: ${theme.colors.surface};
  border-radius: 8px;
  width: 90%;
  max-width: 1200px;
  height: 85vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const Header = styled.div`
  padding: ${theme.spacing.lg};
  border-bottom: 1px solid ${theme.colors.border};

  .title-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: ${theme.spacing.md};

    h2 {
      font-size: 18px;
      font-weight: normal;
      color: ${theme.colors.text.primary};

      .arrow {
        display: inline-block;
        margin: 0 ${theme.spacing.md};
        color: ${theme.colors.text.secondary};
      }
    }

    button {
      background: transparent;
      border: none;
      color: ${theme.colors.text.secondary};
      cursor: pointer;
      padding: ${theme.spacing.xs};

      &:hover {
        color: ${theme.colors.text.primary};
      }

      svg {
        width: 20px;
        height: 20px;
      }
    }
  }

  .match-modes {
    display: flex;
    gap: ${theme.spacing.lg};
    font-size: 14px;

    label {
      display: flex;
      align-items: center;
      gap: ${theme.spacing.xs};
      color: ${theme.colors.text.secondary};
      cursor: pointer;

      input {
        cursor: pointer;
      }

      &:hover {
        color: ${theme.colors.text.primary};
      }
    }
  }
`;

const Content = styled.div`
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
`;

const TracksGrid = styled.div`
  flex: 1;
  overflow-y: auto;
  display: grid;
  grid-template-columns: 45% 10% 45%;

  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: ${theme.colors.background};
  }

  &::-webkit-scrollbar-thumb {
    background: ${theme.colors.border};
    border-radius: 4px;
  }
`;

const ColumnHeader = styled.div`
  position: sticky;
  top: 0;
  background: ${theme.colors.surface};
  padding: ${theme.spacing.md};
  border-bottom: 1px solid ${theme.colors.border};
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: ${theme.colors.text.secondary};
  z-index: 10;

  &.match-column {
    text-align: center;
    padding: ${theme.spacing.md} ${theme.spacing.xs};
  }
`;

const TrackRow = styled.div`
  padding: ${theme.spacing.md};
  border-bottom: 1px solid ${theme.colors.background};
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.xs};
  background: ${props => props.$selected ? theme.colors.accent : 'transparent'};
  cursor: ${props => props.$clickable ? 'pointer' : 'default'};
  transition: background ${theme.transitions.fast};

  &:hover {
    ${props => props.$clickable && `
      background: ${props.$selected ? theme.colors.accent : '#1e1e1e'};
    `}
  }

  .track-main {
    display: flex;
    align-items: baseline;
    gap: ${theme.spacing.sm};

    .number {
      color: ${theme.colors.text.dimmed};
      font-size: 14px;
      min-width: 30px;
    }

    .title {
      flex: 1;
      color: ${props => props.$dimmed ? theme.colors.text.secondary : theme.colors.text.primary};
      font-size: 15px;
      opacity: ${props => props.$noMatch ? 0.4 : 1};
    }
  }

  .track-duration {
    margin-left: 38px;
    color: ${theme.colors.text.dimmed};
    font-size: 13px;
  }

  .track-details {
    margin-left: 38px;
    color: ${theme.colors.text.dimmed};
    font-size: 12px;
    display: ${props => props.$showDetails ? 'block' : 'none'};
    margin-top: ${theme.spacing.xs};
  }
`;

const MatchIndicator = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  font-size: 24px;
  color: ${props =>
    props.$type === 'perfect' ? theme.colors.match.perfect :
    props.$type === 'partial' ? theme.colors.match.partial :
    props.$type === 'uncertain' ? theme.colors.match.partial :
    theme.colors.match.none
  };
  opacity: ${props => props.$type === 'none' ? 0.3 : 1};
  border-left: 1px solid ${theme.colors.background};
  border-right: 1px solid ${theme.colors.background};

  .symbol {
    user-select: none;
    position: relative;
  }

  .tooltip {
    display: none;
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    background: ${theme.colors.background};
    color: ${theme.colors.text.secondary};
    padding: ${theme.spacing.xs} ${theme.spacing.sm};
    border-radius: 4px;
    font-size: 12px;
    white-space: nowrap;
    z-index: 100;
    margin-top: ${theme.spacing.xs};
  }

  &:hover .tooltip {
    display: block;
  }
`;

const Footer = styled.div`
  padding: ${theme.spacing.lg};
  border-top: 1px solid ${theme.colors.border};
  display: flex;
  justify-content: space-between;
  align-items: center;

  .summary {
    color: ${theme.colors.text.secondary};
    font-size: 14px;

    .separator {
      margin: 0 ${theme.spacing.md};
      color: ${theme.colors.text.dimmed};
    }

    strong {
      color: ${theme.colors.text.primary};
      font-weight: normal;
    }
  }

  .actions {
    display: flex;
    gap: ${theme.spacing.md};

    button {
      padding: ${theme.spacing.sm} ${theme.spacing.lg};
      border-radius: 4px;
      font-size: 14px;
      cursor: pointer;
      transition: all ${theme.transitions.fast};
      border: none;

      &.cancel {
        background: transparent;
        color: ${theme.colors.text.secondary};
        border: 1px solid ${theme.colors.border};

        &:hover {
          background: ${theme.colors.background};
          color: ${theme.colors.text.primary};
        }
      }

      &.apply {
        background: ${theme.colors.accent};
        color: ${theme.colors.text.primary};

        &:hover {
          background: #2a4a70;
        }

        &:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      }
    }
  }
`;

const ViewToggle = styled.div`
  padding: ${theme.spacing.sm} ${theme.spacing.lg};
  background: ${theme.colors.background};
  border-bottom: 1px solid ${theme.colors.border};
  display: flex;
  gap: ${theme.spacing.md};
  font-size: 13px;

  button {
    background: transparent;
    border: none;
    color: ${theme.colors.text.secondary};
    cursor: pointer;
    padding: ${theme.spacing.xs} ${theme.spacing.sm};
    border-radius: 4px;

    &:hover {
      background: ${theme.colors.surface};
      color: ${theme.colors.text.primary};
    }

    &.active {
      background: ${theme.colors.surface};
      color: ${theme.colors.text.primary};
    }
  }
`;

function MusicBrainzDialogMinimal({ initialData, onApply, onClose }) {
  const [matchMode, setMatchMode] = useState('smart');
  const [selectedTracks, setSelectedTracks] = useState(new Set());
  const [viewMode, setViewMode] = useState('basic'); // basic, details, technical
  const [trackMatches, setTrackMatches] = useState([]);
  const [searchResult, setSearchResult] = useState(null);
  const [isSearching, setIsSearching] = useState(true);

  // Calculate match type between tracks
  const getMatchType = (localTrack, mbTrack) => {
    if (!mbTrack) return 'none';

    const titleMatch = localTrack?.title?.toLowerCase() === mbTrack?.title?.toLowerCase();
    const durationMatch = Math.abs((localTrack?.duration || 0) - (mbTrack?.duration || 0)) < 5;

    if (titleMatch && durationMatch) return 'perfect';
    if (titleMatch || durationMatch) return 'partial';
    return 'uncertain';
  };

  // Get match symbol
  const getMatchSymbol = (type) => {
    switch (type) {
      case 'perfect': return '=';
      case 'partial': return '≈';
      case 'uncertain': return '?';
      default: return ' ';
    }
  };

  // Get match tooltip
  const getMatchTooltip = (type) => {
    switch (type) {
      case 'perfect': return 'Perfect match';
      case 'partial': return 'Close match';
      case 'uncertain': return 'Needs review';
      default: return 'No match';
    }
  };

  // Initialize matches
  useEffect(() => {
    if (initialData?.tracks) {
      console.log('MusicBrainz Minimal - Tracks:', initialData.tracks);

      // Simulate searching delay
      setTimeout(() => {
        setIsSearching(false);

        // In production, this would be the actual MusicBrainz search result
        setSearchResult({
          album: 'Best Match Album',
          artist: initialData.artist || 'Unknown Artist',
          date: '2024-01-01',
          confidence: 0.85
        });

        // Create matches from actual track data
        const matches = initialData.tracks.map((track, index) => {
          // For now, simulate matching - in production this would come from MusicBrainz API
          const hasMatch = Math.random() > 0.3; // 70% match rate for demo
          const matchType = !hasMatch ? 'none' :
                           Math.random() > 0.5 ? 'perfect' : 'partial';

          // Extract the actual title from the track object
          const trackTitle = track.title || track.song_title || track.song_name || `Track ${index + 1}`;

          return {
            local: {
              ...track,
              title: trackTitle,
              displayTitle: trackTitle
            },
            mb: matchType !== 'none' ? {
              title: trackTitle, // In production, this would be the MusicBrainz title
              duration: track.duration,
              trackNumber: 101 + index
            } : null,
            type: matchType,
            selected: matchType === 'perfect' // Auto-select perfect matches
          };
        });

        setTrackMatches(matches);

        // Set initial selection
        const initialSelected = new Set();
        matches.forEach((match, index) => {
          if (match.selected) initialSelected.add(index);
        });
        setSelectedTracks(initialSelected);
      }, 1000);
    }
  }, [initialData]);

  // Toggle track selection
  const toggleTrack = (index) => {
    setSelectedTracks(prev => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  // Calculate statistics
  const stats = useMemo(() => {
    const matched = trackMatches.filter(m => m.type !== 'none').length;
    return {
      total: trackMatches.length,
      matched,
      selected: selectedTracks.size
    };
  }, [trackMatches, selectedTracks]);

  // Format duration
  const formatDuration = (seconds) => {
    if (!seconds) return '';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Overlay onClick={onClose}>
      <Dialog onClick={(e) => e.stopPropagation()}>
        <Header>
          <div className="title-row">
            <h2>
              {initialData?.album || 'Unknown Album'}
              <span className="arrow">→</span>
              {isSearching ? 'Searching...' : (searchResult?.album || 'No matches found')}
            </h2>
            <button onClick={onClose}>
              <X />
            </button>
          </div>
          <div className="match-modes">
            <label>
              <input
                type="radio"
                checked={matchMode === 'position'}
                onChange={() => setMatchMode('position')}
              />
              Match by position
            </label>
            <label>
              <input
                type="radio"
                checked={matchMode === 'smart'}
                onChange={() => setMatchMode('smart')}
              />
              Smart match
            </label>
            <label>
              <input
                type="radio"
                checked={matchMode === 'manual'}
                onChange={() => setMatchMode('manual')}
              />
              Manual match
            </label>
          </div>
        </Header>

        <ViewToggle>
          <button
            className={viewMode === 'basic' ? 'active' : ''}
            onClick={() => setViewMode('basic')}
          >
            Basic view
          </button>
          <button
            className={viewMode === 'details' ? 'active' : ''}
            onClick={() => setViewMode('details')}
          >
            Show details
          </button>
          <button
            className={viewMode === 'technical' ? 'active' : ''}
            onClick={() => setViewMode('technical')}
          >
            Show technical
          </button>
        </ViewToggle>

        <Content>
          <TracksGrid>
            <ColumnHeader>Your Album</ColumnHeader>
            <ColumnHeader className="match-column">Match</ColumnHeader>
            <ColumnHeader>MusicBrainz Match</ColumnHeader>

            {trackMatches.map((match, index) => (
              <React.Fragment key={index}>
                {/* Local track */}
                <TrackRow
                  $dimmed={match.type === 'none'}
                  $showDetails={viewMode !== 'basic'}
                >
                  <div className="track-main">
                    <span className="number">{index + 1}.</span>
                    <span className="title">
                      {match.local?.displayTitle || match.local?.title || `Track ${index + 1}`}
                    </span>
                  </div>
                  <div className="track-duration">
                    {formatDuration(match.local?.duration)}
                  </div>
                  {viewMode === 'technical' && match.local?.path && (
                    <div className="track-details">
                      {match.local.path.split(/[\\\/]/).pop()}
                    </div>
                  )}
                </TrackRow>

                {/* Match indicator */}
                <MatchIndicator $type={match.type}>
                  <div className="symbol">
                    {getMatchSymbol(match.type)}
                    <div className="tooltip">{getMatchTooltip(match.type)}</div>
                  </div>
                </MatchIndicator>

                {/* MusicBrainz track */}
                <TrackRow
                  $selected={selectedTracks.has(index)}
                  $clickable={match.type !== 'none'}
                  $noMatch={match.type === 'none'}
                  $showDetails={viewMode !== 'basic'}
                  onClick={() => match.type !== 'none' && toggleTrack(index)}
                >
                  {match.mb ? (
                    <>
                      <div className="track-main">
                        <span className="number">{match.mb.trackNumber}.</span>
                        <span className="title">{match.mb.title}</span>
                      </div>
                      <div className="track-duration">
                        {formatDuration(match.mb.duration)}
                      </div>
                      {viewMode === 'details' && (
                        <div className="track-details">
                          From disc 1 • Studio recording
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="track-main">
                      <span className="number">—</span>
                      <span className="title">No match</span>
                    </div>
                  )}
                </TrackRow>
              </React.Fragment>
            ))}
          </TracksGrid>
        </Content>

        <Footer>
          <div className="summary">
            <strong>{stats.total}</strong> tracks
            <span className="separator">•</span>
            <strong>{stats.matched}</strong> matched
            <span className="separator">•</span>
            <strong>{stats.selected}</strong> selected
          </div>
          <div className="actions">
            <button className="cancel" onClick={onClose}>Cancel</button>
            <button
              className="apply"
              onClick={() => onApply(selectedTracks)}
              disabled={selectedTracks.size === 0}
            >
              Apply Selected
            </button>
          </div>
        </Footer>
      </Dialog>
    </Overlay>
  );
}

export default MusicBrainzDialogMinimal;