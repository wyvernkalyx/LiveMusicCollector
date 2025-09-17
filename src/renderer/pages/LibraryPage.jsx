import React from 'react';
import styled from '@emotion/styled';
import { Filter, SortAsc, SortDesc } from 'lucide-react';
import { theme } from '../styles/globalStyles';
import { useStore } from '../store';
import ShowCard from '../components/ShowCard';

const PageContainer = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${theme.spacing.lg};

  h2 {
    font-size: ${theme.typography.fontSize.xl};
    font-weight: 600;
  }

  .stats {
    color: ${theme.colors.text.secondary};
    font-size: ${theme.typography.fontSize.sm};
  }
`;

const ControlBar = styled.div`
  display: flex;
  gap: ${theme.spacing.md};
  margin-bottom: ${theme.spacing.lg};
  align-items: center;
`;

const ViewSelector = styled.div`
  display: flex;
  gap: ${theme.spacing.xs};
  background: ${theme.colors.background.surface};
  padding: ${theme.spacing.xs};
  border-radius: ${theme.borderRadius.md};

  button {
    padding: ${theme.spacing.sm} ${theme.spacing.md};
    border-radius: ${theme.borderRadius.sm};
    transition: all ${theme.transitions.fast};
    font-size: ${theme.typography.fontSize.sm};

    &.active {
      background: ${theme.colors.primary};
      color: white;
    }

    &:hover:not(.active) {
      background: ${theme.colors.background.secondary};
    }
  }
`;

const SortDropdown = styled.select`
  padding: ${theme.spacing.sm} ${theme.spacing.md};
  background: ${theme.colors.background.surface};
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.borderRadius.md};
  color: ${theme.colors.text.primary};
  font-size: ${theme.typography.fontSize.sm};
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: ${theme.colors.primary};
  }
`;

const ShowsContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.xs};
  padding-right: ${theme.spacing.sm};
`;

const TrackList = styled.div`
  background: ${theme.colors.background.secondary};
  padding: ${theme.spacing.md};
  margin-top: ${theme.spacing.sm};
  border-top: 1px solid ${theme.colors.border};
`;

const TrackItem = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.md};
  padding: ${theme.spacing.sm};
  border-radius: ${theme.borderRadius.sm};
  transition: all ${theme.transitions.fast};
  cursor: pointer;

  &:hover {
    background: ${theme.colors.background.surface};
  }

  .track-number {
    width: 30px;
    color: ${theme.colors.text.secondary};
    font-size: ${theme.typography.fontSize.sm};
  }

  .track-title {
    flex: 1;
    color: ${theme.colors.text.primary};
  }

  .track-duration {
    color: ${theme.colors.text.secondary};
    font-size: ${theme.typography.fontSize.sm};
  }
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: ${theme.spacing.xl};
  color: ${theme.colors.text.secondary};

  h3 {
    font-size: ${theme.typography.fontSize.lg};
    margin-bottom: ${theme.spacing.sm};
  }

  p {
    font-size: ${theme.typography.fontSize.sm};
  }
`;

function LibraryPage() {
  const {
    shows,
    fetchShows,
    playTrack: playTrackFromStore,
    setPlaylist,
    currentView = 'all'
  } = useStore();

  const [expandedShows, setExpandedShows] = React.useState(new Set());
  const [tracksByShow, setTracksByShow] = React.useState({});
  const [viewMode, setViewMode] = React.useState('all');
  const [sortBy, setSortBy] = React.useState('date');
  const [sortOrder, setSortOrder] = React.useState('desc');

  React.useEffect(() => {
    fetchShows();
  }, [fetchShows]);

  const toggleShowExpanded = async (showId) => {
    const newExpanded = new Set(expandedShows);
    if (newExpanded.has(showId)) {
      newExpanded.delete(showId);
    } else {
      newExpanded.add(showId);
      // Load tracks if not already loaded
      if (!tracksByShow[showId]) {
        try {
          const tracks = await window.api.getTracksByShow(showId);
          setTracksByShow(prev => ({ ...prev, [showId]: tracks || [] }));
        } catch (error) {
          console.error('Error loading tracks:', error);
        }
      }
    }
    setExpandedShows(newExpanded);
  };

  const playShow = async (show) => {
    try {
      const tracks = await window.api.getTracksByShow(show.id);
      if (tracks && tracks.length > 0) {
        setPlaylist(tracks);
        playTrackFromStore(tracks[0]);
      }
    } catch (error) {
      console.error('Error playing show:', error);
    }
  };

  const playTrack = (track) => {
    playTrackFromStore(track);
  };

  const handleAction = (action, show) => {
    switch (action) {
      case 'play':
        playShow(show);
        break;
      case 'edit':
        // Navigate to track management with this show selected
        window.location.href = '#/tracks';
        break;
      case 'tracks':
        toggleShowExpanded(show.id);
        break;
      default:
        break;
    }
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Filter shows based on view mode
  const filteredShows = React.useMemo(() => {
    let filtered = [...shows];

    switch (viewMode) {
      case 'soundboards':
        filtered = filtered.filter(s => s.source_type === 'SBD');
        break;
      case 'official':
        filtered = filtered.filter(s => s.source_type === 'OFFICIAL');
        break;
      default:
        // Show all
        break;
    }

    // Sort shows
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'date':
          comparison = (a.date || '').localeCompare(b.date || '');
          break;
        case 'venue':
          comparison = (a.venue_name || '').localeCompare(b.venue_name || '');
          break;
        case 'rating':
          comparison = (a.quality_rating || 0) - (b.quality_rating || 0);
          break;
        default:
          comparison = 0;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [shows, viewMode, sortBy, sortOrder]);

  return (
    <PageContainer>
      <Header>
        <div>
          <h2>Music Library</h2>
          <div className="stats">
            {filteredShows.length} shows • {shows.reduce((sum, s) => sum + (s.recording_count || 0), 0)} recordings
          </div>
        </div>
      </Header>

      <ControlBar>
        <ViewSelector>
          <button
            className={viewMode === 'all' ? 'active' : ''}
            onClick={() => setViewMode('all')}
          >
            All Shows
          </button>
          <button
            className={viewMode === 'soundboards' ? 'active' : ''}
            onClick={() => setViewMode('soundboards')}
          >
            Soundboards
          </button>
          <button
            className={viewMode === 'official' ? 'active' : ''}
            onClick={() => setViewMode('official')}
          >
            Official Releases
          </button>
        </ViewSelector>

        <SortDropdown
          value={`${sortBy}-${sortOrder}`}
          onChange={(e) => {
            const [field, order] = e.target.value.split('-');
            setSortBy(field);
            setSortOrder(order);
          }}
        >
          <option value="date-desc">Sort by Date (Newest)</option>
          <option value="date-asc">Sort by Date (Oldest)</option>
          <option value="venue-asc">Sort by Venue (A-Z)</option>
          <option value="venue-desc">Sort by Venue (Z-A)</option>
          <option value="rating-desc">Sort by Rating (High-Low)</option>
          <option value="rating-asc">Sort by Rating (Low-High)</option>
        </SortDropdown>
      </ControlBar>

      {filteredShows.length === 0 ? (
        <EmptyState>
          <h3>No shows found</h3>
          <p>Import some music to get started</p>
        </EmptyState>
      ) : (
        <ShowsContainer>
          {filteredShows.map(show => {
            const isExpanded = expandedShows.has(show.id);
            const tracks = tracksByShow[show.id] || [];

            return (
              <div key={show.id}>
                <ShowCard
                  show={show}
                  expanded={isExpanded}
                  onToggle={toggleShowExpanded}
                  onAction={handleAction}
                  showActions={true}
                />

                {isExpanded && tracks.length > 0 && (
                  <TrackList>
                    {tracks.map((track, index) => (
                      <TrackItem
                        key={track.id || index}
                        onClick={() => playTrack(track)}
                      >
                        <span className="track-number">
                          {track.track_number || index + 1}
                        </span>
                        <span className="track-title">
                          {track.song_title || track.title || 'Unknown Track'}
                        </span>
                        <span className="track-duration">
                          {formatDuration(track.duration)}
                        </span>
                      </TrackItem>
                    ))}
                  </TrackList>
                )}
              </div>
            );
          })}
        </ShowsContainer>
      )}
    </PageContainer>
  );
}

export default LibraryPage;