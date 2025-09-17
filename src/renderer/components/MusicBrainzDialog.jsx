import React from 'react';
import styled from '@emotion/styled';
import { Search, X, Music, Calendar, User, Disc, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react';
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
  width: 90%;
  max-width: 800px;
  max-height: 80vh;
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

const DialogContent = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: ${theme.spacing.lg};
`;

const SearchForm = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: ${theme.spacing.md};
  margin-bottom: ${theme.spacing.xl};

  .field {
    display: flex;
    flex-direction: column;
    gap: ${theme.spacing.xs};

    label {
      font-size: ${theme.typography.fontSize.sm};
      font-weight: 600;
      color: ${theme.colors.text.secondary};
    }

    input {
      padding: ${theme.spacing.sm};
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

const SearchButton = styled.button`
  padding: ${theme.spacing.sm} ${theme.spacing.lg};
  background: ${theme.colors.accent.primary};
  color: white;
  border-radius: ${theme.borderRadius.md};
  display: flex;
  align-items: center;
  gap: ${theme.spacing.xs};
  font-weight: 600;
  margin-top: ${theme.spacing.md};
  width: fit-content;

  &:hover {
    background: ${theme.colors.accent.secondary};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  svg {
    width: 16px;
    height: 16px;
  }
`;

const ResultsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.md};
`;

const ResultItem = styled.div`
  padding: ${theme.spacing.lg};
  background: ${theme.colors.background.elevated};
  border-radius: ${theme.borderRadius.md};
  border: 2px solid ${props => props.selected ? theme.colors.accent.primary : 'transparent'};
  cursor: pointer;
  transition: all ${theme.transitions.fast};

  &:hover {
    border-color: ${theme.colors.accent.primary}50;
  }

  .result-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: ${theme.spacing.md};

    .result-title {
      flex: 1;

      h3 {
        font-size: ${theme.typography.fontSize.md};
        font-weight: 600;
        margin-bottom: ${theme.spacing.xs};
      }

      .artist {
        color: ${theme.colors.text.secondary};
        font-size: ${theme.typography.fontSize.sm};
      }
    }

    .confidence {
      display: flex;
      align-items: center;
      gap: ${theme.spacing.xs};
      padding: ${theme.spacing.xs} ${theme.spacing.sm};
      background: ${props => props.confidence > 0.8
        ? theme.colors.status.success + '20'
        : props.confidence > 0.5
        ? theme.colors.status.warning + '20'
        : theme.colors.status.error + '20'
      };
      color: ${props => props.confidence > 0.8
        ? theme.colors.status.success
        : props.confidence > 0.5
        ? theme.colors.status.warning
        : theme.colors.status.error
      };
      border-radius: ${theme.borderRadius.sm};
      font-size: ${theme.typography.fontSize.sm};
      font-weight: 600;

      svg {
        width: 14px;
        height: 14px;
      }
    }
  }

  .result-meta {
    display: flex;
    gap: ${theme.spacing.lg};
    font-size: ${theme.typography.fontSize.sm};
    color: ${theme.colors.text.secondary};

    .meta-item {
      display: flex;
      align-items: center;
      gap: ${theme.spacing.xs};

      svg {
        width: 14px;
        height: 14px;
      }
    }
  }

  .track-list {
    margin-top: ${theme.spacing.md};
    padding-top: ${theme.spacing.md};
    border-top: 1px solid ${theme.colors.border};

    .track-count {
      font-size: ${theme.typography.fontSize.sm};
      color: ${theme.colors.text.secondary};
      margin-bottom: ${theme.spacing.sm};
    }

    .tracks {
      display: flex;
      flex-wrap: wrap;
      gap: ${theme.spacing.xs};

      .track {
        padding: ${theme.spacing.xs} ${theme.spacing.sm};
        background: ${theme.colors.background.surface};
        border-radius: ${theme.borderRadius.sm};
        font-size: ${theme.typography.fontSize.xs};
      }
    }
  }
`;

const DialogFooter = styled.div`
  padding: ${theme.spacing.lg};
  border-top: 1px solid ${theme.colors.border};
  display: flex;
  justify-content: flex-end;
  gap: ${theme.spacing.sm};

  button {
    padding: ${theme.spacing.sm} ${theme.spacing.lg};
    border-radius: ${theme.borderRadius.md};
    font-weight: 600;

    &.cancel {
      background: ${theme.colors.background.elevated};
      color: ${theme.colors.text.primary};

      &:hover {
        background: ${theme.colors.background.secondary};
      }
    }

    &.apply {
      background: ${theme.colors.accent.primary};
      color: white;

      &:hover {
        background: ${theme.colors.accent.secondary};
      }

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }
  }
`;

const LoadingState = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: ${theme.spacing.xl};
  color: ${theme.colors.text.secondary};

  svg {
    width: 20px;
    height: 20px;
    margin-right: ${theme.spacing.sm};
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: ${theme.spacing.xl};
  color: ${theme.colors.text.secondary};

  svg {
    width: 48px;
    height: 48px;
    margin-bottom: ${theme.spacing.md};
    opacity: 0.5;
  }

  p {
    font-size: ${theme.typography.fontSize.sm};
  }
`;

function MusicBrainzDialog({ initialData, onApply, onClose }) {
  const [searchQuery, setSearchQuery] = React.useState({
    artist: initialData?.artist || 'Grateful Dead',
    album: initialData?.album || '',
    date: initialData?.date || '',
    trackCount: initialData?.trackCount || ''
  });

  const [results, setResults] = React.useState([]);
  const [selectedResult, setSelectedResult] = React.useState(null);
  const [isSearching, setIsSearching] = React.useState(false);

  const handleSearch = async () => {
    setIsSearching(true);

    try {
      // Call MusicBrainz API
      const response = await window.api.invoke('musicbrainz:search', searchQuery);

      // Mock results for demo
      const mockResults = [
        {
          id: '1',
          title: searchQuery.album || 'Blues for Allah (50th Anniversary Remaster)',
          artist: searchQuery.artist,
          date: '2025-01-01',
          trackCount: 14,
          confidence: 0.95,
          type: 'album',
          label: 'Grateful Dead Records',
          tracks: [
            'Help on the Way',
            'Slipknot!',
            'Franklin\'s Tower',
            'King Solomon\'s Marbles',
            'Stronger Than Dirt',
            'The Music Never Stopped',
            'Crazy Fingers',
            'Sage & Spirit',
            'Blues for Allah'
          ]
        },
        {
          id: '2',
          title: 'Blues for Allah',
          artist: 'Grateful Dead',
          date: '1975-09-01',
          trackCount: 9,
          confidence: 0.7,
          type: 'album',
          label: 'Grateful Dead Records',
          tracks: [
            'Help on the Way',
            'Slipknot!',
            'Franklin\'s Tower',
            'King Solomon\'s Marbles',
            'The Music Never Stopped',
            'Crazy Fingers',
            'Sage & Spirit',
            'Blues for Allah'
          ]
        }
      ];

      setResults(response || mockResults);
    } catch (error) {
      console.error('MusicBrainz search error:', error);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleApply = () => {
    if (selectedResult) {
      onApply({
        artist: selectedResult.artist,
        album: selectedResult.title,
        date: selectedResult.date,
        originalReleaseDate: selectedResult.originalReleaseDate,
        releaseVersion: selectedResult.releaseVersion,
        label: selectedResult.label,
        catalogNumber: selectedResult.catalogNumber,
        isLive: selectedResult.isLive,
        discCount: selectedResult.discCount,
        coverArt: selectedResult.coverArt,
        tracks: selectedResult.tracks?.map(track => ({
          title: track.formattedTitle || track.displayTitle || track.title,
          position: track.position,
          discNumber: track.discNumber,
          discTrackNumber: track.discTrackNumber,
          duration: track.duration,
          hasSegue: track.hasSegue,
          recordingDate: track.recordingDate || track.displayDate || track.date
        }))
      });
    }
  };

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

        <DialogContent>
          <SearchForm>
            <div className="field">
              <label>Artist</label>
              <input
                type="text"
                value={searchQuery.artist}
                onChange={(e) => setSearchQuery({ ...searchQuery, artist: e.target.value })}
                placeholder="e.g., Grateful Dead"
              />
            </div>
            <div className="field">
              <label>Album/Release</label>
              <input
                type="text"
                value={searchQuery.album}
                onChange={(e) => setSearchQuery({ ...searchQuery, album: e.target.value })}
                placeholder="e.g., Blues for Allah"
              />
            </div>
            <div className="field">
              <label>Date</label>
              <input
                type="text"
                value={searchQuery.date}
                onChange={(e) => setSearchQuery({ ...searchQuery, date: e.target.value })}
                placeholder="yyyy-mm-dd"
              />
            </div>
            <div className="field">
              <label>Track Count</label>
              <input
                type="number"
                value={searchQuery.trackCount}
                onChange={(e) => setSearchQuery({ ...searchQuery, trackCount: e.target.value })}
                placeholder="Number of tracks"
              />
            </div>
          </SearchForm>

          <SearchButton onClick={handleSearch} disabled={isSearching}>
            <Search />
            {isSearching ? 'Searching...' : 'Search MusicBrainz'}
          </SearchButton>

          {isSearching && (
            <LoadingState>
              <Search />
              Searching MusicBrainz database...
            </LoadingState>
          )}

          {!isSearching && results.length > 0 && (
            <ResultsList>
              {results.map(result => (
                <ResultItem
                  key={result.id}
                  selected={selectedResult?.id === result.id}
                  confidence={result.confidence}
                  onClick={() => setSelectedResult(result)}
                >
                  <div className="result-header">
                    <div className="result-title">
                      <h3>
                        {result.title}
                        {result.releaseVersion && (
                          <span style={{ fontSize: '0.85em', color: theme.colors.text.secondary, marginLeft: '8px' }}>
                            ({result.releaseVersion})
                          </span>
                        )}
                      </h3>
                      <div className="artist">{result.artist}</div>
                      {result.id && (
                        <a
                          href={`https://musicbrainz.org/release/${result.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            color: theme.colors.accent.primary,
                            fontSize: theme.typography.fontSize.xs,
                            marginTop: '4px',
                            textDecoration: 'none'
                          }}
                          onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
                          onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
                        >
                          View on MusicBrainz
                          <ExternalLink style={{ width: '12px', height: '12px' }} />
                        </a>
                      )}
                      {result.isLive && (
                        <span style={{
                          fontSize: '0.75em',
                          background: theme.colors.accent.primary + '20',
                          color: theme.colors.accent.primary,
                          padding: '2px 6px',
                          borderRadius: theme.borderRadius.sm,
                          marginTop: '4px',
                          display: 'inline-block'
                        }}>
                          Live Recording
                        </span>
                      )}
                    </div>
                    <div className="confidence">
                      {result.confidence > 0.8 ? <CheckCircle /> : <AlertCircle />}
                      {Math.round(result.confidence * 100)}% match
                    </div>
                  </div>

                  <div className="result-meta">
                    {result.originalReleaseDate && (
                      <div className="meta-item">
                        <Calendar />
                        Original: {result.originalReleaseDate}
                      </div>
                    )}
                    {result.date && result.date !== result.originalReleaseDate && (
                      <div className="meta-item">
                        <Calendar />
                        This release: {result.date}
                      </div>
                    )}
                    {result.trackCount && (
                      <div className="meta-item">
                        <Music />
                        {result.trackCount} tracks
                        {result.discCount > 1 && ` • ${result.discCount} discs`}
                      </div>
                    )}
                    {result.type && (
                      <div className="meta-item">
                        <Disc />
                        {result.type}
                      </div>
                    )}
                    {result.label && (
                      <div className="meta-item">
                        <User />
                        {result.label}
                        {result.catalogNumber && ` • ${result.catalogNumber}`}
                      </div>
                    )}
                  </div>

                  {result.tracks && result.tracks.length > 0 && (
                    <div className="track-list">
                      <div className="track-count">
                        Sample tracks:
                      </div>
                      <div className="tracks">
                        {result.tracks.slice(0, 5).map((track, i) => (
                          <div key={i} className="track">
                            {track.discTrackNumber && (
                              <span style={{ fontWeight: 600, marginRight: '6px' }}>
                                {track.discTrackNumber}.
                              </span>
                            )}
                            {track.displayTitle || track.title || (typeof track === 'string' ? track : track.title)}
                            {track.hasSegue && ' >'}
                          </div>
                        ))}
                        {result.tracks.length > 5 && (
                          <div className="track">
                            +{result.tracks.length - 5} more
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </ResultItem>
              ))}
            </ResultsList>
          )}

          {!isSearching && results.length === 0 && searchQuery.album && (
            <EmptyState>
              <Music />
              <p>No results found. Try adjusting your search criteria.</p>
            </EmptyState>
          )}
        </DialogContent>

        <DialogFooter>
          <button className="cancel" onClick={onClose}>
            Cancel
          </button>
          <button
            className="apply"
            onClick={handleApply}
            disabled={!selectedResult}
          >
            Apply Selected
          </button>
        </DialogFooter>
      </DialogContainer>
    </DialogOverlay>
  );
}

export default MusicBrainzDialog;