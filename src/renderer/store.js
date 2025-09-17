import { create } from 'zustand';

const useStore = create((set, get) => ({
  // App state
  initialized: false,
  loading: false,
  error: null,

  // Library stats
  stats: {
    totalShows: 0,
    totalTracks: 0,
    totalRecordings: 0,
    totalSize: '0 GB',
    yearStats: [],
  },

  // Shows data
  shows: [],

  // Current view state
  currentView: 'year',
  selectedYear: null,
  selectedShow: null,
  expandedShows: new Set(),

  // Player state
  player: {
    isPlaying: false,
    currentTrack: null,
    queue: [],
    volume: 0.7,
  },

  // Search state
  searchQuery: '',
  searchFilters: {
    dateFrom: null,
    dateTo: null,
    sourceType: null,
    minQuality: null,
    venue: null,
  },

  // Settings
  settings: {
    libraryPath: '',
    importCopyFiles: true,
    autoNormalize: true,
    preferredFormat: 'flac',
    darkMode: true,
    notifications: true,
    autoPlayNext: true,
    crossfadeDuration: 0,
    bandFocus: 'Grateful Dead'
  },

  // Actions
  initialize: async () => {
    try {
      set({ loading: true });

      // Try to load from API if available
      if (window.api) {
        const savedSettings = await window.api.getAllSettings();
        const yearStats = await window.api.getYearStats();

        // Merge saved settings with defaults
        const mergedSettings = {
          ...get().settings,
          ...savedSettings
        };

        set({
          initialized: true,
          loading: false,
          settings: mergedSettings,
          stats: {
            ...get().stats,
            yearStats: yearStats || [],
          },
        });

        console.log('Settings loaded:', mergedSettings);
      } else {
        // Use dummy data for now
        set({
          initialized: true,
          loading: false,
        });
      }
    } catch (error) {
      console.error('Store initialization error:', error);
      set({ error: error.message, loading: false, initialized: true });
    }
  },

  setView: (view) => set({ currentView: view }),

  selectYear: (year) => set({ selectedYear: year }),

  selectShow: async (showId) => {
    try {
      if (window.api) {
        const show = await window.api.getShow(showId);
        set({ selectedShow: show });
      }
    } catch (error) {
      set({ error: error.message });
    }
  },

  toggleShowExpanded: (showId) => {
    const expanded = new Set(get().expandedShows);
    if (expanded.has(showId)) {
      expanded.delete(showId);
    } else {
      expanded.add(showId);
    }
    set({ expandedShows: expanded });
  },

  // Fetch shows - fetch all shows from database
  fetchShows: async () => {
    try {
      if (window.api) {
        const allShows = await window.api.getAllShows();
        console.log('Fetched shows:', allShows ? allShows.length : 0);

        // Update shows and stats
        set({
          shows: allShows || [],
          stats: {
            ...get().stats,
            totalShows: allShows ? allShows.length : 0,
            totalTracks: allShows ? allShows.reduce((sum, show) => sum + (show.recording_count || 0), 0) : 0
          }
        });
      } else {
        set({ shows: [] });
      }
    } catch (error) {
      console.error('Error fetching shows:', error);
      set({ shows: [] });
    }
  },

  // Search shows
  searchShows: async (query, filters) => {
    try {
      if (window.api) {
        const results = await window.api.searchShows(query, filters);
        return results || [];
      }
      return [];
    } catch (error) {
      console.error('Error searching shows:', error);
      return [];
    }
  },

  // Import files
  importFiles: async (filePaths, options) => {
    try {
      if (window.api) {
        const results = await window.api.processFiles(filePaths, options);
        return results;
      }
      return [];
    } catch (error) {
      console.error('Error importing files:', error);
      throw error;
    }
  },

  // Update settings
  updateSettings: (newSettings) => {
    set({ settings: { ...get().settings, ...newSettings } });
    if (window.api) {
      Object.entries(newSettings).forEach(([key, value]) => {
        window.api.setSettings(key, value);
      });
    }
  },

  // Player actions
  playTrack: async (track) => {
    console.log('Playing track:', track);

    // If track doesn't have file_path, try to get it from the database
    let trackWithPath = track;
    if (!track.file_path && track.id && window.api) {
      try {
        // Get the full track info from database
        const trackInfo = await window.api.getTrack(track.id);
        if (trackInfo) {
          trackWithPath = { ...track, ...trackInfo };
        }
      } catch (error) {
        console.error('Error fetching track info:', error);
      }
    }

    set((state) => ({
      player: {
        ...state.player,
        isPlaying: true,
        currentTrack: trackWithPath,
      },
    }));
  },

  pausePlayback: () => {
    set((state) => ({
      player: {
        ...state.player,
        isPlaying: false,
      },
    }));
  },

  setVolume: (volume) => {
    set((state) => ({
      player: {
        ...state.player,
        volume,
      },
    }));
  },

  setPlaylist: (tracks) => {
    set((state) => ({
      player: {
        ...state.player,
        queue: tracks || [],
      },
    }));
  },

  setCurrentTrack: (track) => {
    set((state) => ({
      player: {
        ...state.player,
        currentTrack: track,
      },
    }));
  },

  // Search actions
  setSearchQuery: (query) => set({ searchQuery: query }),

  updateSearchFilter: (filterName, value) => {
    set((state) => ({
      searchFilters: {
        ...state.searchFilters,
        [filterName]: value,
      },
    }));
  },

  clearSearchFilters: () => {
    set({
      searchQuery: '',
      searchFilters: {
        dateFrom: null,
        dateTo: null,
        sourceType: null,
        minQuality: null,
        venue: null,
      },
    });
  },
}));

export { useStore };
export default useStore;