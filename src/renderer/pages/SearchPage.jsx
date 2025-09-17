import React from 'react';
import styled from '@emotion/styled';
import { Search, Filter, Calendar, MapPin, Music, ChevronRight, Mic, Disc } from 'lucide-react';
import { theme } from '../styles/globalStyles';
import { useStore } from '../store';
import { formatDuration } from '../utils/formatDuration';

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

const SearchBar = styled.div`
  display: flex;
  gap: ${theme.spacing.md};
  margin-bottom: ${theme.spacing.lg};

  .search-input {
    flex: 1;
    display: flex;
    align-items: center;
    background: ${theme.colors.background.surface};
    border-radius: ${theme.borderRadius.md};
    padding: 0 ${theme.spacing.md};
    border: 1px solid ${theme.colors.border};
    transition: all ${theme.transitions.fast};

    &:focus-within {
      border-color: ${theme.colors.accent.primary};
      box-shadow: 0 0 0 3px ${theme.colors.accent.primary}20;
    }

    svg {
      width: 18px;
      height: 18px;
      color: ${theme.colors.text.secondary};
      margin-right: ${theme.spacing.sm};
    }

    input {
      flex: 1;
      padding: ${theme.spacing.sm} 0;
      background: transparent;
      border: none;
      outline: none;
      color: ${theme.colors.text.primary};
      font-size: ${theme.typography.fontSize.md};

      &::placeholder {
        color: ${theme.colors.text.disabled};
      }
    }
  }

  button {
    padding: ${theme.spacing.sm} ${theme.spacing.lg};
    background: ${theme.colors.accent.primary};
    color: white;
    border-radius: ${theme.borderRadius.md};
    display: flex;
    align-items: center;
    gap: ${theme.spacing.sm};

    &:hover {
      background: ${theme.colors.accent.secondary};
    }
  }
`;

const FilterSection = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: ${theme.spacing.md};
  padding: ${theme.spacing.md};
  background: ${theme.colors.background.surface};
  border-radius: ${theme.borderRadius.lg};
  margin-bottom: ${theme.spacing.lg};
`;

const FilterGroup = styled.div`
  label {
    display: block;
    font-size: ${theme.typography.fontSize.sm};
    color: ${theme.colors.text.secondary};
    margin-bottom: ${theme.spacing.xs};
    font-weight: 500;
  }

  input, select {
    width: 100%;
    padding: ${theme.spacing.sm};
    background: ${theme.colors.background.secondary};
    border: 1px solid ${theme.colors.border};
    border-radius: ${theme.borderRadius.sm};
    color: ${theme.colors.text.primary};
  }
`;

const AdvancedSearch = styled.div`
  margin-bottom: ${theme.spacing.lg};

  h3 {
    font-size: ${theme.typography.fontSize.md};
    margin-bottom: ${theme.spacing.md};
    color: ${theme.colors.text.secondary};
  }

  .search-types {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: ${theme.spacing.md};
  }
`;

const SearchType = styled.div`
  padding: ${theme.spacing.md};
  background: ${theme.colors.background.surface};
  border-radius: ${theme.borderRadius.md};
  border: 1px solid ${theme.colors.border};
  cursor: pointer;
  transition: all ${theme.transitions.fast};

  &:hover {
    border-color: ${theme.colors.accent.primary};
    background: ${theme.colors.accent.primary}10;
  }

  h4 {
    font-size: ${theme.typography.fontSize.md};
    margin-bottom: ${theme.spacing.xs};
  }

  p {
    font-size: ${theme.typography.fontSize.sm};
    color: ${theme.colors.text.secondary};
  }

  .example {
    margin-top: ${theme.spacing.sm};
    padding: ${theme.spacing.xs} ${theme.spacing.sm};
    background: ${theme.colors.background.secondary};
    border-radius: ${theme.borderRadius.sm};
    font-family: 'Consolas', monospace;
    font-size: ${theme.typography.fontSize.xs};
  }
`;

const Results = styled.div`
  flex: 1;
  overflow-y: auto;
`;

const ResultItem = styled.div`
  padding: ${theme.spacing.md};
  background: ${theme.colors.background.surface};
  border-radius: ${theme.borderRadius.md};
  margin-bottom: ${theme.spacing.sm};
  cursor: pointer;
  transition: all ${theme.transitions.fast};

  &:hover {
    background: ${theme.colors.background.elevated};
    transform: translateX(4px);
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: start;
    margin-bottom: ${theme.spacing.sm};
  }

  .title {
    font-weight: 500;
    font-size: ${theme.typography.fontSize.md};
  }

  .meta {
    display: flex;
    gap: ${theme.spacing.md};
    font-size: ${theme.typography.fontSize.sm};
    color: ${theme.colors.text.secondary};

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

  .highlight {
    background: ${theme.colors.accent.primary}30;
    padding: 2px 4px;
    border-radius: 2px;
  }
`;

function SearchPage() {
  const { setCurrentTrack, setPlaylist } = useStore();
  const [query, setQuery] = React.useState('');
  const [filters, setFilters] = React.useState({
    dateFrom: '',
    dateTo: '',
    venue: '',
    sourceType: '',
    minRating: ''
  });
  const [searchType, setSearchType] = React.useState('shows');
  const [results, setResults] = React.useState([]);
  const [isSearching, setIsSearching] = React.useState(false);
  const [showAdvanced, setShowAdvanced] = React.useState(false);

  const advancedSearchTypes = [
    {
      id: 'opener',
      title: 'Find by Opener',
      description: 'Shows that start with a specific song',
      example: 'opener: "China Cat Sunflower"'
    },
    {
      id: 'encore',
      title: 'Find by Encore',
      description: 'Shows with specific encore songs',
      example: 'encore: "Brokedown Palace"'
    },
    {
      id: 'sequence',
      title: 'Song Sequence',
      description: 'Shows where song X appears before song Y',
      example: '"Fire on the Mountain" before "Scarlet Begonias"'
    },
    {
      id: 'segue',
      title: 'Segue Search',
      description: 'Shows with specific song transitions',
      example: '"China Cat" > "I Know You Rider"'
    }
  ];

  const handleSearch = async () => {
    setIsSearching(true);
    try {
      // Clean up filters to only send non-empty values
      const cleanFilters = {};
      Object.keys(filters).forEach(key => {
        if (filters[key] && filters[key] !== '' && filters[key] !== '0') {
          cleanFilters[key] = filters[key];
        }
      });

      if (searchType === 'tracks') {
        const searchResults = await window.api.searchTracks(query);
        setResults(searchResults || []);
      } else {
        const searchResults = await window.api.searchShows(query, cleanFilters);
        setResults(searchResults || []);
      }
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    }
    setIsSearching(false);
  };

  const playShow = async (show) => {
    try {
      const tracks = await window.api.getTracksByShow(show.id);
      if (tracks && tracks.length > 0) {
        setPlaylist(tracks);
        setCurrentTrack(tracks[0]);
      }
    } catch (error) {
      console.error('Error loading show tracks:', error);
    }
  };

  const playTrack = async (track) => {
    setCurrentTrack(track);
  };

  const rebuildIndex = async () => {
    if (window.confirm('Rebuild the search index? This may take a moment.')) {
      setIsSearching(true);
      try {
        await window.api.rebuildSearchIndex();
        alert('Search index rebuilt successfully!');
      } catch (error) {
        console.error('Error rebuilding index:', error);
        alert('Failed to rebuild search index');
      } finally {
        setIsSearching(false);
      }
    }
  };

  const handleAdvancedSearch = (type) => {
    setSearchType(type.id);
    // Set up the search query based on type
    switch (type.id) {
      case 'opener':
        setQuery('opener: ');
        break;
      case 'encore':
        setQuery('encore: ');
        break;
      case 'sequence':
        setQuery('');
        break;
      case 'segue':
        setQuery('');
        break;
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Unknown Date';
    // Return date in yyyy-mm-dd format
    return dateStr;
  };

  return (
    <PageContainer>
      <Header>
        <h2>Advanced Search</h2>
        <p>Find specific shows, songs, and patterns in your collection</p>
      </Header>

      <div style={{ display: 'flex', gap: theme.spacing.md, marginBottom: theme.spacing.md }}>
        <button
          onClick={() => setSearchType('shows')}
          style={{
            padding: `${theme.spacing.sm} ${theme.spacing.md}`,
            background: searchType === 'shows' ? theme.colors.accent.primary : theme.colors.background.surface,
            color: searchType === 'shows' ? 'white' : theme.colors.text.primary,
            borderRadius: theme.borderRadius.sm,
            border: `1px solid ${searchType === 'shows' ? theme.colors.accent.primary : theme.colors.border}`
          }}
        >
          Search Shows
        </button>
        <button
          onClick={() => setSearchType('tracks')}
          style={{
            padding: `${theme.spacing.sm} ${theme.spacing.md}`,
            background: searchType === 'tracks' ? theme.colors.accent.primary : theme.colors.background.surface,
            color: searchType === 'tracks' ? 'white' : theme.colors.text.primary,
            borderRadius: theme.borderRadius.sm,
            border: `1px solid ${searchType === 'tracks' ? theme.colors.accent.primary : theme.colors.border}`
          }}
        >
          Search Tracks
        </button>
        <div style={{ flex: 1 }} />
        <button
          onClick={rebuildIndex}
          style={{
            padding: `${theme.spacing.sm} ${theme.spacing.md}`,
            background: theme.colors.background.surface,
            color: theme.colors.text.secondary,
            borderRadius: theme.borderRadius.sm,
            border: `1px solid ${theme.colors.border}`
          }}
        >
          Rebuild Search Index
        </button>
      </div>

      <SearchBar>
        <div className="search-input">
          <Search />
          <input
            type="text"
            placeholder={searchType === 'tracks' ? "Search for song titles..." : "Search for shows, venues, cities..."}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
        </div>
        <button onClick={handleSearch} disabled={isSearching}>
          {isSearching ? 'Searching...' : 'Search'}
        </button>
      </SearchBar>

      <FilterSection>
        <FilterGroup>
          <label>Date From</label>
          <input
            type="text"
            placeholder="yyyy-mm-dd"
            value={filters.dateFrom}
            onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
          />
        </FilterGroup>
        <FilterGroup>
          <label>Date To</label>
          <input
            type="text"
            placeholder="yyyy-mm-dd"
            value={filters.dateTo}
            onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
          />
        </FilterGroup>
        <FilterGroup>
          <label>Venue</label>
          <input
            type="text"
            placeholder="e.g., Madison Square Garden"
            value={filters.venue}
            onChange={(e) => setFilters({ ...filters, venue: e.target.value })}
          />
        </FilterGroup>
        <FilterGroup>
          <label>Source Type</label>
          <select
            value={filters.sourceType}
            onChange={(e) => setFilters({ ...filters, sourceType: e.target.value })}
          >
            <option value="">All Sources</option>
            <option value="SBD">Soundboard</option>
            <option value="AUD">Audience</option>
            <option value="MATRIX">Matrix</option>
            <option value="OFFICIAL">Official</option>
          </select>
        </FilterGroup>
        <FilterGroup>
          <label>Min Rating</label>
          <select
            value={filters.minRating}
            onChange={(e) => setFilters({ ...filters, minRating: e.target.value })}
          >
            <option value="">Any Rating</option>
            <option value="3">3+ Stars</option>
            <option value="4">4+ Stars</option>
            <option value="5">5 Stars Only</option>
          </select>
        </FilterGroup>
      </FilterSection>

      {searchType === 'shows' && (
        <AdvancedSearch>
          <h3>Advanced Search Types</h3>
          <div className="search-types">
            {advancedSearchTypes.map(type => (
              <SearchType key={type.id} onClick={() => handleAdvancedSearch(type)}>
                <h4>{type.title}</h4>
                <p>{type.description}</p>
                <div className="example">{type.example}</div>
              </SearchType>
            ))}
          </div>
        </AdvancedSearch>
      )}

      <Results>
        {results.length === 0 && query && !isSearching && (
          <div style={{
            textAlign: 'center',
            padding: theme.spacing.xl,
            color: theme.colors.text.secondary
          }}>
            No results found for "{query}"
          </div>
        )}

        {results.map(result => (
          <ResultItem key={result.id} onClick={() => searchType === 'tracks' ? playTrack(result) : playShow(result)}>
            <div className="header">
              <div className="title">
                {searchType === 'tracks'
                  ? (result.highlight ? <span dangerouslySetInnerHTML={{ __html: result.highlight }} /> : result.song_title)
                  : `${formatDate(result.date)} - ${result.venue_name || 'Unknown Venue'}`
                }
              </div>
              {result.source_type && (
                <span style={{
                  padding: `2px 8px`,
                  background: theme.colors.accent.primary + '20',
                  color: theme.colors.accent.primary,
                  borderRadius: theme.borderRadius.sm,
                  fontSize: theme.typography.fontSize.xs,
                  fontWeight: 500
                }}>
                  {result.source_type}
                </span>
              )}
            </div>
            <div className="meta">
              {searchType === 'tracks' ? (
                <>
                  <span>
                    <Calendar />
                    {result.date}
                  </span>
                  <span>
                    <MapPin />
                    {result.venue_name}
                    {result.city && result.state && `, ${result.city}, ${result.state}`}
                  </span>
                  {result.source_type && (
                    <span>
                      <Mic />
                      {result.source_type}
                    </span>
                  )}
                </>
              ) : (
                <>
                  <span>
                    <Calendar />
                    {result.band_name}
                  </span>
                  <span>
                    <MapPin />
                    {result.city}, {result.state}
                  </span>
                  {result.recording_count > 0 && (
                    <span>
                      <Disc />
                      {result.recording_count} recordings
                    </span>
                  )}
                  {result.track_count > 0 && (
                    <span>
                      <Music />
                      {result.track_count} tracks
                    </span>
                  )}
                </>
              )}
            </div>
            {result.matched_songs && (
              <div style={{ marginTop: theme.spacing.sm }}>
                Matched: {result.matched_songs.map((song, i) => (
                  <span key={i}>
                    {i > 0 && ' → '}
                    <span className="highlight">{song}</span>
                  </span>
                ))}
              </div>
            )}
          </ResultItem>
        ))}
      </Results>
    </PageContainer>
  );
}

export default SearchPage;