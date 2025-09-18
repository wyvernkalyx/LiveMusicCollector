import React from 'react';
import styled from '@emotion/styled';
import { Search, X, Music, Calendar, User, Disc, CheckCircle, AlertCircle, ExternalLink, Fingerprint, FileAudio } from 'lucide-react';
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
  margin-bottom: ${theme.spacing.lg};

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

const TracksList = styled.div`
  margin-top: ${theme.spacing.lg};
  padding: ${theme.spacing.md};
  background: ${theme.colors.background.elevated};
  border-radius: ${theme.borderRadius.md};
  max-height: 400px;
  min-height: 200px;
  overflow-y: auto;
  border: 1px solid ${theme.colors.border};

  h3 {
    font-size: ${theme.typography.fontSize.md};
    font-weight: 600;
    margin-bottom: ${theme.spacing.md};
    color: ${theme.colors.text.primary};
    display: flex;
    align-items: center;
    gap: ${theme.spacing.sm};

    svg {
      width: 18px;
      height: 18px;
      color: ${theme.colors.accent.primary};
    }
  }
`;

const TrackItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${theme.spacing.sm};
  border-radius: ${theme.borderRadius.sm};
  margin-bottom: ${theme.spacing.xs};
  background: ${props => props.hasFingerprint ?
    theme.colors.status.success + '10' :
    theme.colors.background.surface};
  border: 2px solid ${props => props.isSelected ?
    theme.colors.accent.primary :
    props.hasFingerprint ?
    theme.colors.status.success + '30' :
    theme.colors.border};
  cursor: ${props => props.hasFingerprint ? 'pointer' : 'default'};
  transition: all ${theme.transitions.fast};

  &:hover {
    background: ${props => props.hasFingerprint ?
      theme.colors.status.success + '20' :
      theme.colors.background.secondary};
    transform: ${props => props.hasFingerprint ? 'translateX(4px)' : 'none'};
  }

  .track-info {
    display: flex;
    align-items: center;
    gap: ${theme.spacing.md};
    flex: 1;

    .track-number {
      width: 30px;
      text-align: center;
      font-size: ${theme.typography.fontSize.sm};
      color: ${theme.colors.text.secondary};
    }

    .track-name {
      flex: 1;
      font-size: ${theme.typography.fontSize.sm};
      color: ${theme.colors.text.primary};
    }
  }

  .fingerprint-status {
    display: flex;
    align-items: center;
    gap: ${theme.spacing.xs};
    font-size: ${theme.typography.fontSize.xs};
    color: ${props => props.hasFingerprint ?
      theme.colors.status.success :
      theme.colors.text.secondary};

    svg {
      width: 16px;
      height: 16px;
    }

    .confidence {
      padding: 2px 6px;
      background: ${props => props.hasFingerprint ?
        theme.colors.status.success + '20' :
        theme.colors.background.elevated};
      border-radius: ${theme.borderRadius.sm};
      font-weight: 600;
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
  const [tracksWithFingerprints, setTracksWithFingerprints] = React.useState([]);
  const [selectedTrack, setSelectedTrack] = React.useState(null);
  const [trackReleases, setTrackReleases] = React.useState({});
  const [releaseType, setReleaseType] = React.useState(null); // 'official' or 'concert'
  const [showMergeWarning, setShowMergeWarning] = React.useState(false);

  // Check for fingerprint data when component mounts or when initial data changes
  React.useEffect(() => {
    if (initialData?.tracks) {
      console.log('MusicBrainz Dialog - Initial tracks:', initialData.tracks);

      // Generate fingerprint status for each track
      const trackFingerprintData = initialData.tracks.map((track, index) => {
        // Get the original title from the track object
        let originalTitle = '';
        if (typeof track === 'string') {
          originalTitle = track;
        } else {
          // Track object from AlbumView has title field
          originalTitle = track.title;

          // If still no title, use filename from path
          if (!originalTitle && track.path) {
            const filename = track.path.split(/[\\/]/).pop();
            originalTitle = filename.replace(/\.[^.]+$/, '');
          }

          // Final fallback
          if (!originalTitle) {
            originalTitle = `Track ${track.trackNumber || index + 1}`;
          }
        }

        console.log(`Track ${index + 1}: "${originalTitle}" from path: ${track.path}`);

        return {
          number: track.trackNumber || index + 1,
          title: originalTitle,
          path: track.path || track.file_path,
          duration: track.duration,
          trackNumber: track.trackNumber,
          hasFingerprint: false,
          confidence: 0,
          matchedTitle: null,
          originalData: track.originalData
        };
      });
      setTracksWithFingerprints(trackFingerprintData);

      // Start fingerprinting process for each track
      checkFingerprints(trackFingerprintData);
    }
  }, [initialData]);

  const checkFingerprints = async (tracks) => {
    let foundMatches = false;

    for (const track of tracks) {
      if (track.path) {
        try {
          // Request fingerprint match for this track
          const match = await window.api.invoke('musicbrainz:fingerprint', track.path);

          if (match && match.confidence > 0) {
            foundMatches = true;
            setTracksWithFingerprints(prev => prev.map(t =>
              t.path === track.path ? {
                ...t,
                hasFingerprint: true,
                confidence: match.confidence,
                matchedTitle: match.title,  // Keep the matched title separate
                acousticId: match.recordingId,
                artist: match.artist,
                album: match.album,
                releaseId: match.releaseId,
                releaseDate: match.releaseDate,
                recordings: match.recordings || []
                // Note: DO NOT overwrite the original title field
              } : t
            ));

            // Store release info for this track
            if (match.recordings && match.recordings.length > 0) {
              setTrackReleases(prev => ({
                ...prev,
                [track.path]: match.recordings
              }));
            }

            // Update search query with first match info
            if (match.artist && !searchQuery.artist) {
              setSearchQuery(prev => ({
                ...prev,
                artist: match.artist
              }));
            }
          }
        } catch (error) {
          console.error('Error getting fingerprint for track:', track.title, error);
        }
      }
    }

    // Auto-search if we found fingerprint matches
    if (foundMatches) {
      // Find the most common artist from matches
      const artistCounts = {};
      tracks.forEach(t => {
        const updatedTrack = tracksWithFingerprints.find(tf => tf.path === t.path);
        if (updatedTrack?.artist) {
          artistCounts[updatedTrack.artist] = (artistCounts[updatedTrack.artist] || 0) + 1;
        }
      });

      const mostCommonArtist = Object.keys(artistCounts).reduce((a, b) =>
        artistCounts[a] > artistCounts[b] ? a : b, searchQuery.artist);

      if (mostCommonArtist && mostCommonArtist !== searchQuery.artist) {
        setSearchQuery(prev => ({
          ...prev,
          artist: mostCommonArtist
        }));
      }

      setTimeout(() => {
        console.log('Auto-searching based on fingerprint matches');
        handleSearch();
      }, 1500);
    }
  };

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
        isOfficialRelease: releaseType === 'official',
        releaseType: releaseType,
        status: selectedResult.status,
        discCount: selectedResult.discCount,
        coverArt: selectedResult.coverArt,
        shouldMerge: showMergeWarning, // Indicates multi-disc official release that needs merging
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
          <div style={{
            padding: theme.spacing.md,
            background: theme.colors.accent.primary + '10',
            borderRadius: theme.borderRadius.md,
            marginBottom: theme.spacing.lg,
            fontSize: theme.typography.fontSize.sm,
            color: theme.colors.text.primary,
            lineHeight: 1.6
          }}>
            <strong>How to use this dialog:</strong>
            <ol style={{ margin: `${theme.spacing.sm} 0 0 ${theme.spacing.lg}`, padding: 0 }}>
              <li>✅ Fingerprints identify individual tracks (green = matched)</li>
              <li>🔍 Search for the complete album/release in MusicBrainz</li>
              <li>🎵 Identify if this is an <strong>Official Release</strong> or <strong>Concert Recording</strong></li>
              <li>📀 Select the best matching release from the results</li>
              <li>💾 Click "Apply Selected" to update all track metadata</li>
            </ol>
            {showMergeWarning && (
              <div style={{
                marginTop: theme.spacing.sm,
                padding: theme.spacing.sm,
                background: theme.colors.status.warning + '20',
                borderRadius: theme.borderRadius.sm,
                border: `1px solid ${theme.colors.status.warning}50`
              }}>
                ⚠️ <strong>Multi-disc Official Release Detected:</strong> This appears to be a multi-disc official release that was imported as separate concerts. Applying this metadata will merge them into a single album.
              </div>
            )}
          </div>

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
              <label>Album</label>
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

          {tracksWithFingerprints.length > 0 && (
            <TracksList>
              <h3>
                <FileAudio />
                Tracks to Match ({tracksWithFingerprints.length})
              </h3>
              {tracksWithFingerprints.map((track) => (
                <TrackItem
                  key={track.number}
                  hasFingerprint={track.hasFingerprint}
                  isSelected={selectedTrack?.path === track.path}
                  onClick={() => {
                    if (track.hasFingerprint) {
                      setSelectedTrack(track);
                      // Update search with this track's matched info
                      if (track.artist) {
                        setSearchQuery({
                          artist: track.artist || searchQuery.artist,
                          album: track.album || searchQuery.album,
                          date: searchQuery.date,
                          trackCount: searchQuery.trackCount
                        });
                      }
                    }
                  }}
                  title={track.hasFingerprint ? 'Click to see matches and update search' : ''}
                >
                  <div className="track-info">
                    <span className="track-number">{track.number}</span>
                    <span className="track-name">
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                          <span style={{
                            fontWeight: 500,
                            color: theme.colors.text.primary,
                            fontSize: '0.95em'
                          }}>
                            {track.title || 'Unknown Track'}
                          </span>
                          {track.duration && (
                            <span style={{
                              color: theme.colors.text.secondary,
                              fontSize: '0.75em',
                              opacity: 0.7
                            }}>
                              ({Math.floor(track.duration / 60)}:{String(Math.floor(track.duration % 60)).padStart(2, '0')})
                            </span>
                          )}
                        </div>

                        {track.hasFingerprint && track.matchedTitle && track.matchedTitle !== track.title && (
                          <div style={{
                            padding: '4px 8px',
                            background: theme.colors.status.success + '15',
                            borderRadius: theme.borderRadius.sm,
                            border: `1px solid ${theme.colors.status.success}30`
                          }}>
                            <span style={{
                              color: theme.colors.status.success,
                              fontSize: '0.85em',
                              fontWeight: 600
                            }}>
                              ✓ Match: {track.matchedTitle}
                            </span>
                            {track.artist && track.album && (
                              <span style={{
                                color: theme.colors.text.secondary,
                                fontSize: '0.8em',
                                marginLeft: '8px'
                              }}>
                                • {track.artist} - {track.album}
                                {track.releaseDate && ` (${track.releaseDate})`}
                              </span>
                            )}
                          </div>
                        )}

                        {!track.hasFingerprint && track.path && (
                          <span style={{
                            color: theme.colors.text.secondary,
                            fontSize: '0.75em',
                            opacity: 0.6,
                            fontStyle: 'italic'
                          }}>
                            File: {track.path.split(/[\\/]/).pop()}
                          </span>
                        )}
                      </div>
                    </span>
                  </div>
                  <div className="fingerprint-status">
                    {track.hasFingerprint ? (
                      <>
                        <Fingerprint />
                        <span className="confidence">
                          {Math.round(track.confidence * 100)}% match
                        </span>
                      </>
                    ) : (
                      <>
                        <AlertCircle />
                        <span>No fingerprint</span>
                      </>
                    )}
                  </div>
                </TrackItem>
              ))}
            </TracksList>
          )}

          {selectedTrack && selectedTrack.recordings && selectedTrack.recordings.length > 0 && (
            <TracksList style={{ marginTop: theme.spacing.md }}>
              <h3>
                <Disc />
                Releases containing "{selectedTrack.matchedTitle || selectedTrack.title}"
              </h3>
              <div style={{ fontSize: theme.typography.fontSize.sm, color: theme.colors.text.secondary, marginBottom: theme.spacing.md }}>
                This track appears on {selectedTrack.recordings.length} release{selectedTrack.recordings.length > 1 ? 's' : ''}
              </div>
              {selectedTrack.recordings.slice(0, 5).map((recording, idx) => (
                <div key={idx} style={{
                  padding: theme.spacing.sm,
                  background: theme.colors.background.surface,
                  borderRadius: theme.borderRadius.sm,
                  marginBottom: theme.spacing.sm,
                  border: `1px solid ${theme.colors.border}`
                }}>
                  <div style={{ fontWeight: 600, marginBottom: '4px' }}>
                    {recording.releaseTitle || recording.album || 'Unknown Release'}
                  </div>
                  <div style={{
                    fontSize: theme.typography.fontSize.xs,
                    color: theme.colors.text.secondary,
                    display: 'flex',
                    gap: theme.spacing.md
                  }}>
                    {recording.artist && <span>{recording.artist}</span>}
                    {recording.date && <span>{recording.date}</span>}
                    {recording.country && <span>{recording.country}</span>}
                    {recording.format && <span>{recording.format}</span>}
                  </div>
                  {recording.isLive && (
                    <span style={{
                      fontSize: '0.7em',
                      background: theme.colors.status.success + '20',
                      color: theme.colors.status.success,
                      padding: '2px 6px',
                      borderRadius: theme.borderRadius.sm,
                      marginTop: '4px',
                      display: 'inline-block'
                    }}>
                      Live Recording
                    </span>
                  )}
                </div>
              ))}
              {selectedTrack.recordings.length > 5 && (
                <div style={{
                  fontSize: theme.typography.fontSize.xs,
                  color: theme.colors.text.secondary,
                  textAlign: 'center',
                  marginTop: theme.spacing.sm
                }}>
                  +{selectedTrack.recordings.length - 5} more releases
                </div>
              )}
            </TracksList>
          )}

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
                  onClick={() => {
                    setSelectedResult(result);
                    // Detect release type
                    const isOfficial = result.status === 'Official' ||
                                      result.type === 'album' ||
                                      result.type === 'compilation' ||
                                      !result.isLive;
                    setReleaseType(isOfficial ? 'official' : 'concert');

                    // Check if we need to show merge warning
                    if (isOfficial && result.discCount > 1 && initialData?.date) {
                      // This is a multi-disc official release and we have date info (suggesting it was split)
                      setShowMergeWarning(true);
                    } else {
                      setShowMergeWarning(false);
                    }
                  }}
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
                      <div style={{ marginTop: '4px', display: 'flex', gap: theme.spacing.xs }}>
                        {result.isLive && (
                          <span style={{
                            fontSize: '0.75em',
                            background: theme.colors.accent.primary + '20',
                            color: theme.colors.accent.primary,
                            padding: '2px 6px',
                            borderRadius: theme.borderRadius.sm,
                            display: 'inline-block'
                          }}>
                            🎤 Live Recording
                          </span>
                        )}
                        {result.status === 'Official' && (
                          <span style={{
                            fontSize: '0.75em',
                            background: theme.colors.status.success + '20',
                            color: theme.colors.status.success,
                            padding: '2px 6px',
                            borderRadius: theme.borderRadius.sm,
                            display: 'inline-block'
                          }}>
                            ✓ Official Release
                          </span>
                        )}
                        {result.status === 'Bootleg' && (
                          <span style={{
                            fontSize: '0.75em',
                            background: theme.colors.status.warning + '20',
                            color: theme.colors.status.warning,
                            padding: '2px 6px',
                            borderRadius: theme.borderRadius.sm,
                            display: 'inline-block'
                          }}>
                            📦 Bootleg
                          </span>
                        )}
                      </div>
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
                            {track.displayTitle || track.title || (typeof track === 'string' ? track : 'Unknown Track')}
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
          {selectedResult?.status === 'Official' && (
            <button
              className="apply"
              onClick={() => {
                if (window.confirm(
                  `This will apply "${selectedResult.title}" metadata to ALL tracks in this collection.\n\n` +
                  `This is recommended for official releases to ensure consistent metadata.\n\n` +
                  `Continue?`
                )) {
                  handleApply();
                }
              }}
              disabled={!selectedResult}
              style={{
                background: theme.colors.status.success,
                marginRight: theme.spacing.sm
              }}
            >
              Apply to All Tracks
            </button>
          )}
          <button
            className="apply"
            onClick={handleApply}
            disabled={!selectedResult}
          >
            {selectedResult?.status === 'Official' ? 'Apply Without Confirmation' : 'Apply Selected'}
          </button>
        </DialogFooter>
      </DialogContainer>
    </DialogOverlay>
  );
}

export default MusicBrainzDialog;