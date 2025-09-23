import React, { useState, useEffect, useRef } from 'react';
import styled from '@emotion/styled';
import { X, Volume2, AlertCircle, CheckCircle, XCircle, Clock, Loader, ChevronDown, ChevronRight, Search, AlertTriangle, Info } from 'lucide-react';

const theme = {
  colors: {
    background: '#1a1a1a',
    surface: '#2d2d2d',
    elevated: '#3a3a3a',
    border: '#4a4a4a',
    text: {
      primary: '#e0e0e0',
      secondary: '#999999',
      dimmed: '#666666'
    },
    status: {
      success: '#4a9d4a',
      warning: '#d4a644',
      error: '#d44444',
      info: '#4a7dd4',
      processing: '#7d4ad4'
    }
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px'
  }
};

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const Dialog = styled.div`
  background: ${theme.colors.surface};
  border-radius: 8px;
  width: 95%;
  max-width: 1400px;
  height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const Header = styled.div`
  padding: ${theme.spacing.lg};
  border-bottom: 1px solid ${theme.colors.border};
  display: flex;
  justify-content: space-between;
  align-items: center;

  h2 {
    font-size: 18px;
    font-weight: 500;
    color: ${theme.colors.text.primary};
    display: flex;
    align-items: center;
    gap: ${theme.spacing.sm};

    svg {
      width: 20px;
      height: 20px;
      color: ${theme.colors.status.processing};
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
`;

// New tabbed navigation
const TabNav = styled.div`
  display: flex;
  border-bottom: 1px solid ${theme.colors.border};
  background: ${theme.colors.background};

  .tab {
    padding: ${theme.spacing.md} ${theme.spacing.lg};
    background: none;
    border: none;
    color: ${theme.colors.text.secondary};
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    position: relative;
    transition: color 0.2s;

    &:hover {
      color: ${theme.colors.text.primary};
    }

    &.active {
      color: ${theme.colors.text.primary};

      &::after {
        content: '';
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        height: 2px;
        background: ${theme.colors.status.info};
      }
    }
  }
`;

// Metadata comparison view
const MetadataComparison = styled.div`
  flex: 1;
  padding: ${theme.spacing.lg};
  overflow-y: auto;

  .comparison-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: ${theme.spacing.lg};

    .column {
      background: ${theme.colors.elevated};
      border-radius: 8px;
      padding: ${theme.spacing.lg};

      h3 {
        font-size: 16px;
        font-weight: 600;
        margin-bottom: ${theme.spacing.lg};
        color: ${theme.colors.text.primary};
        display: flex;
        align-items: center;
        gap: ${theme.spacing.sm};

        &.current {
          color: ${theme.colors.text.secondary};
        }

        &.musicbrainz {
          color: ${theme.colors.status.info};
        }
      }

      .metadata-section {
        margin-bottom: ${theme.spacing.lg};

        h4 {
          font-size: 13px;
          font-weight: 600;
          text-transform: uppercase;
          color: ${theme.colors.text.dimmed};
          margin-bottom: ${theme.spacing.sm};
        }
      }

      .field {
        margin-bottom: ${theme.spacing.md};

        .label {
          font-size: 12px;
          color: ${theme.colors.text.dimmed};
          margin-bottom: ${theme.spacing.xs};
        }

        .value {
          font-size: 14px;
          color: ${theme.colors.text.primary};
          min-height: 24px;
          padding: ${theme.spacing.xs} ${theme.spacing.sm};
          background: ${theme.colors.background};
          border-radius: 4px;

          &.empty {
            color: ${theme.colors.text.dimmed};
            font-style: italic;
          }

          &.different {
            background: ${theme.colors.status.warning}20;
            border-left: 3px solid ${theme.colors.status.warning};
          }

          &.matched {
            background: ${theme.colors.status.success}20;
            border-left: 3px solid ${theme.colors.status.success};
          }
        }

        .artwork {
          width: 100%;
          max-width: 200px;
          height: 200px;
          background: ${theme.colors.background};
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: ${theme.colors.text.dimmed};
          margin-top: ${theme.spacing.sm};

          img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            border-radius: 4px;
          }

          &.empty {
            border: 2px dashed ${theme.colors.border};
          }
        }
      }
    }
  }

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

// Track comparison table
const TrackComparison = styled.div`
  padding: ${theme.spacing.lg};

  .track-table {
    background: ${theme.colors.elevated};
    border-radius: 8px;
    overflow: hidden;

    table {
      width: 100%;
      border-collapse: collapse;

      thead {
        background: ${theme.colors.background};

        th {
          padding: ${theme.spacing.md};
          text-align: left;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          color: ${theme.colors.text.dimmed};
          border-bottom: 1px solid ${theme.colors.border};
        }
      }

      tbody {
        tr {
          border-bottom: 1px solid ${theme.colors.border};

          &:last-child {
            border-bottom: none;
          }

          &:hover {
            background: ${theme.colors.background};
          }
        }

        td {
          padding: ${theme.spacing.md};
          font-size: 14px;
          color: ${theme.colors.text.primary};

          &.track-number {
            width: 60px;
            color: ${theme.colors.text.dimmed};
          }

          &.different {
            background: ${theme.colors.status.warning}10;
          }

          &.matched {
            background: ${theme.colors.status.success}10;
          }

          .empty {
            color: ${theme.colors.text.dimmed};
            font-style: italic;
          }
        }
      }
    }
  }

  .pagination {
    display: flex;
    justify-content: center;
    gap: ${theme.spacing.sm};
    margin-top: ${theme.spacing.lg};

    button {
      padding: ${theme.spacing.xs} ${theme.spacing.md};
      background: ${theme.colors.elevated};
      border: 1px solid ${theme.colors.border};
      color: ${theme.colors.text.secondary};
      border-radius: 4px;
      cursor: pointer;
      font-size: 13px;

      &:hover:not(:disabled) {
        background: ${theme.colors.background};
        color: ${theme.colors.text.primary};
      }

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      &.active {
        background: ${theme.colors.status.info};
        color: white;
        border-color: ${theme.colors.status.info};
      }
    }

    .page-info {
      display: flex;
      align-items: center;
      color: ${theme.colors.text.secondary};
      font-size: 13px;
    }
  }
`;

const OverallProgress = styled.div`
  padding: ${theme.spacing.md} ${theme.spacing.lg};
  background: ${theme.colors.background};
  border-bottom: 1px solid ${theme.colors.border};

  .progress-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: ${theme.spacing.sm};
    font-size: 14px;

    .progress-title {
      color: ${theme.colors.text.primary};
      font-weight: 500;
    }

    .progress-stats {
      display: flex;
      gap: ${theme.spacing.md};
      color: ${theme.colors.text.secondary};

      span {
        display: flex;
        align-items: center;
        gap: ${theme.spacing.xs};

        svg {
          width: 14px;
          height: 14px;
        }

        &.success { color: ${theme.colors.status.success}; }
        &.warning { color: ${theme.colors.status.warning}; }
        &.error { color: ${theme.colors.status.error}; }
      }
    }
  }

  .progress-bar {
    height: 6px;
    background: ${theme.colors.elevated};
    border-radius: 3px;
    overflow: hidden;

    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg,
        ${theme.colors.status.processing} 0%,
        ${theme.colors.status.info} 100%);
      transition: width 0.3s ease;
    }
  }

  .eta {
    margin-top: ${theme.spacing.xs};
    font-size: 12px;
    color: ${theme.colors.text.dimmed};
  }
`;

const TracksContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: ${theme.spacing.lg};

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

const TrackCard = styled.div`
  background: ${theme.colors.elevated};
  border-radius: 6px;
  padding: ${theme.spacing.md};
  margin-bottom: ${theme.spacing.md};
  border: 1px solid ${props =>
    props.$status === 'matched' ? theme.colors.status.success + '40' :
    props.$status === 'error' ? theme.colors.status.error + '40' :
    props.$status === 'processing' ? theme.colors.status.processing + '40' :
    theme.colors.border};
`;

const TrackHeader = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.md};

  .track-number {
    min-width: 30px;
    font-size: 14px;
    color: ${theme.colors.text.dimmed};
  }

  .track-info {
    flex: 1;

    .track-title {
      font-size: 15px;
      color: ${theme.colors.text.primary};
      margin-bottom: ${theme.spacing.xs};
    }

    .track-details {
      font-size: 12px;
      color: ${theme.colors.text.dimmed};
    }
  }

  .status-icon {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    background: ${props =>
      props.$status === 'matched' ? theme.colors.status.success + '20' :
      props.$status === 'error' ? theme.colors.status.error + '20' :
      props.$status === 'processing' ? theme.colors.status.processing + '20' :
      props.$status === 'warning' ? theme.colors.status.warning + '20' :
      theme.colors.elevated};

    svg {
      width: 18px;
      height: 18px;
      color: ${props =>
        props.$status === 'matched' ? theme.colors.status.success :
        props.$status === 'error' ? theme.colors.status.error :
        props.$status === 'processing' ? theme.colors.status.processing :
        props.$status === 'warning' ? theme.colors.status.warning :
        theme.colors.text.secondary};

      &.spinning {
        animation: spin 1s linear infinite;
      }
    }
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

const StatusMessage = styled.div`
  margin-top: ${theme.spacing.sm};
  padding: ${theme.spacing.sm};
  background: ${theme.colors.background};
  border-radius: 4px;
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};
  color: ${props =>
    props.$type === 'success' ? theme.colors.status.success :
    props.$type === 'error' ? theme.colors.status.error :
    props.$type === 'warning' ? theme.colors.status.warning :
    props.$type === 'info' ? theme.colors.status.info :
    theme.colors.text.secondary};

  svg {
    width: 14px;
    height: 14px;
  }

  .message-text {
    flex: 1;
  }

  .progress-indicator {
    font-size: 12px;
    color: ${theme.colors.text.dimmed};
  }
`;

const MatchResults = styled.div`
  margin-top: ${theme.spacing.md};
  padding: ${theme.spacing.sm};
  background: ${theme.colors.background};
  border-radius: 4px;

  .matches-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: ${theme.spacing.sm};
    font-size: 13px;
    color: ${theme.colors.text.secondary};
    cursor: pointer;
    user-select: none;

    &:hover {
      color: ${theme.colors.text.primary};
    }

    svg {
      width: 14px;
      height: 14px;
    }
  }

  .matches-list {
    display: ${props => props.$expanded ? 'block' : 'none'};
  }
`;

const MatchItem = styled.div`
  padding: ${theme.spacing.sm};
  margin-bottom: ${theme.spacing.xs};
  background: ${theme.colors.elevated};
  border-radius: 4px;
  border-left: 3px solid ${props =>
    props.$confidence > 90 ? theme.colors.status.success :
    props.$confidence > 70 ? theme.colors.status.warning :
    theme.colors.status.error};

  .match-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: ${theme.spacing.xs};

    .match-title {
      font-size: 14px;
      color: ${theme.colors.text.primary};
    }

    .confidence-badge {
      padding: 2px 8px;
      background: ${props =>
        props.$confidence > 90 ? theme.colors.status.success + '20' :
        props.$confidence > 70 ? theme.colors.status.warning + '20' :
        theme.colors.status.error + '20'};
      color: ${props =>
        props.$confidence > 90 ? theme.colors.status.success :
        props.$confidence > 70 ? theme.colors.status.warning :
        theme.colors.status.error};
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
    }
  }

  .match-details {
    font-size: 12px;
    color: ${theme.colors.text.dimmed};
    line-height: 1.4;
  }
`;

const AudioQuality = styled.div`
  margin-top: ${theme.spacing.sm};
  padding: ${theme.spacing.xs} ${theme.spacing.sm};
  background: ${theme.colors.background};
  border-radius: 4px;
  font-size: 12px;
  display: flex;
  gap: ${theme.spacing.md};

  .quality-item {
    display: flex;
    align-items: center;
    gap: ${theme.spacing.xs};
    color: ${theme.colors.text.dimmed};

    &.good { color: ${theme.colors.status.success}; }
    &.warning { color: ${theme.colors.status.warning}; }
    &.error { color: ${theme.colors.status.error}; }
  }
`;

const Footer = styled.div`
  padding: ${theme.spacing.lg};
  border-top: 1px solid ${theme.colors.border};
  display: flex;
  justify-content: space-between;
  align-items: center;

  .summary {
    display: flex;
    gap: ${theme.spacing.lg};
    font-size: 14px;
    color: ${theme.colors.text.secondary};

    .summary-item {
      display: flex;
      align-items: center;
      gap: ${theme.spacing.xs};

      svg {
        width: 14px;
        height: 14px;
      }

      strong {
        color: ${theme.colors.text.primary};
        font-weight: 500;
      }
    }
  }

  .actions {
    display: flex;
    gap: ${theme.spacing.sm};

    button {
      padding: ${theme.spacing.sm} ${theme.spacing.md};
      border-radius: 4px;
      font-size: 14px;
      cursor: pointer;
      border: none;
      transition: all 0.2s;

      &.secondary {
        background: transparent;
        color: ${theme.colors.text.secondary};
        border: 1px solid ${theme.colors.border};

        &:hover {
          background: ${theme.colors.elevated};
          color: ${theme.colors.text.primary};
        }
      }

      &.primary {
        background: ${theme.colors.status.success};
        color: white;

        &:hover {
          background: ${theme.colors.status.success}dd;
        }

        &:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      }
    }
  }
`;

function MusicBrainzFingerprint({ initialData, onApply, onClose, isVerified = false, skipAutoProcess = false }) {
  const [tracks, setTracks] = useState([]);
  const [overallProgress, setOverallProgress] = useState(0);
  const [expandedMatches, setExpandedMatches] = useState({});
  const [showVerificationWarning, setShowVerificationWarning] = useState(false);
  const [processingState, setProcessingState] = useState('initializing'); // 'initializing', 'ready', 'processing', 'completed'
  const [activeTab, setActiveTab] = useState('metadata'); // 'metadata' or 'tracks' or 'fingerprint'
  const [currentMetadata, setCurrentMetadata] = useState(null);
  const [musicBrainzMetadata, setMusicBrainzMetadata] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const tracksPerPage = 10;

  // Initialize tracks with fingerprint status
  useEffect(() => {
    if (initialData?.tracks) {
      // Set current metadata from initialData
      setCurrentMetadata({
        artist: initialData.artist || 'Unknown Artist',
        album: initialData.album || initialData.title || 'Unknown Album',
        releaseDate: initialData.releaseDate || initialData.date,
        performanceDate: initialData.performanceDate || initialData.date,
        venue: initialData.venue?.name || initialData.venue || '',
        city: initialData.venue?.city || initialData.city || '',
        state: initialData.venue?.state || initialData.state || '',
        releaseType: initialData.isOfficialRelease ? 'Official Release' : 'Bootleg/Audience Recording',
        artworkUrl: initialData.artworkUrl || initialData.artwork_url || '',
        notes: initialData.notes || '',
        musicbrainzUrl: initialData.musicbrainz_url || '',
        trackCount: initialData.tracks?.length || 0
      });

      // Check if we should skip auto-processing
      if (skipAutoProcess || (isVerified && !window.confirm('This album is already verified. Do you want to re-process it anyway?'))) {
        // Just load tracks without fingerprinting
        const tracksWithMetadata = initialData.tracks.map((track, index) => ({
          ...track,
          id: track.id || index,
          displayTitle: track.title || track.song_title || `Track ${index + 1}`,
          status: 'skipped',
          statusMessage: 'Album is verified - skipping automatic processing',
          progress: 0,
          matches: [],
          metadata: null,
          fingerprint: null,
          quality: {}
        }));
        setTracks(tracksWithMetadata);
      } else {
        initializeTracks();
      }
    }
  }, [initialData, isVerified, skipAutoProcess]);

  // Initialize and fetch real metadata
  const initializeTracks = async () => {
    const tracksWithMetadata = [];

    for (const track of initialData.tracks) {
      const trackData = {
        ...track,
        id: track.id || tracksWithMetadata.length,
        displayTitle: track.title || track.song_title || `Track ${tracksWithMetadata.length + 1}`,
        status: 'waiting',
        statusMessage: 'Waiting to read metadata...',
        progress: 0,
        matches: [],
        metadata: null,
        fingerprint: null,
        quality: {}
      };

      // Get real file metadata if we have a path
      if (track.path || track.file_path) {
        const filePath = track.path || track.file_path;
        try {
          console.log('Getting metadata for:', filePath);
          const metadata = await window.api.getFileMetadata(filePath);

          if (metadata) {
            trackData.metadata = metadata;
            trackData.displayTitle = metadata.title || trackData.displayTitle;
            trackData.artist = metadata.artist;
            trackData.album = metadata.album;
            trackData.duration = metadata.duration;
            trackData.quality = {
              bitrate: metadata.bitrate || 0,
              format: metadata.format || 'Unknown',
              sampleRate: metadata.sampleRate,
              channels: metadata.format?.numberOfChannels === 2 ? 'Stereo' : 'Mono',
              issues: []
            };

            // Check for quality issues
            if (metadata.bitrate && metadata.bitrate < 192) {
              trackData.quality.issues.push(`Low bitrate: ${metadata.bitrate} kbps`);
            }

            console.log('Metadata loaded for track:', {
              title: trackData.displayTitle,
              artist: trackData.artist,
              album: trackData.album,
              duration: trackData.duration,
              format: trackData.quality.format,
              bitrate: trackData.quality.bitrate
            });
          }
        } catch (error) {
          console.error('Error getting metadata for', filePath, ':', error);
          trackData.statusMessage = 'Failed to read metadata';
          trackData.quality.issues = ['Could not read file metadata'];
        }
      }

      tracksWithMetadata.push(trackData);
    }

    setTracks(tracksWithMetadata);

    // Don't automatically start fingerprinting - wait for user to click start
    setProcessingState('ready');
  };

  // Start the real fingerprinting process
  const startFingerprintingProcess = (trackList) => {
    let currentTrackIndex = 0;

    const processTrack = async () => {
      if (currentTrackIndex >= trackList.length) {
        console.log('\n=== ALL TRACKS PROCESSED ===');
        setProcessingState('completed');
        return;
      }

      // Create local copies to avoid closure issues
      const trackIndex = currentTrackIndex;
      const track = { ...trackList[trackIndex] }; // Clone the track object
      const trackId = track.id;
      const filePath = track.path || track.file_path;

      console.log(`\n=== PROCESSING TRACK ${trackIndex + 1}/${trackList.length} ===`);
      console.log(`Track ID: ${trackId}, Title: ${track.displayTitle}`);

      if (!filePath) {
        console.error('No file path for track:', track);
        currentTrackIndex++;
        processTrack();
        return;
      }

      // Start processing
      setTracks(prev => prev.map(t => t.id === trackId ? {
        ...t,
        status: 'processing',
        statusMessage: 'Reading audio file...',
        progress: 10
      } : t));

      try {
        // Step 1: Generate fingerprint
        setTracks(prev => prev.map(t => t.id === trackId ? {
          ...t,
          status: 'analyzing',
          statusMessage: 'Generating audio fingerprint...',
          progress: 30
        } : t));

        // Call the actual fingerprint API - UNIQUE for each track
        console.log(`\n[TRACK ${trackId}] Generating fingerprint for: ${filePath}`);
        console.log(`[TRACK ${trackId}] File name: ${filePath.split(/[\\\/]/).pop()}`);

        const fingerprintResult = await window.api.invoke('musicbrainz:fingerprint', filePath);

        if (fingerprintResult) {
          console.log(`[TRACK ${trackId}] Fingerprint result for "${track.displayTitle}":`, {
            confidence: fingerprintResult.confidence,
            title: fingerprintResult.title,
            artist: fingerprintResult.artist,
            recordingId: fingerprintResult.recordingId,
            fingerprint: fingerprintResult.fingerprint?.substring(0, 50) + '...',
            source: fingerprintResult.source
          });

          // Update with fingerprint info
          setTracks(prev => prev.map(t => t.id === trackId ? {
            ...t,
            status: 'searching',
            statusMessage: `Fingerprint generated, searching MusicBrainz...`,
            progress: 60,
            fingerprint: fingerprintResult.fingerprint,
            fingerprintDuration: fingerprintResult.duration
          } : t));

          // If we got matches from fingerprint
          if (fingerprintResult.confidence > 0) {
            // Create UNIQUE matches array for THIS track
            const trackMatches = [];

            // Add the primary match - specific to THIS fingerprint result
            if (fingerprintResult.title) {
              const primaryMatch = {
                title: fingerprintResult.title,
                artist: fingerprintResult.artist || track.artist || 'Unknown Artist',
                album: fingerprintResult.album || fingerprintResult.release?.title || '',
                confidence: Math.round(fingerprintResult.confidence * 100),
                duration: fingerprintResult.duration ? `${Math.floor(fingerprintResult.duration / 60)}:${String(Math.floor(fingerprintResult.duration % 60)).padStart(2, '0')}` : '',
                year: fingerprintResult.releaseDate || '',
                recordingId: fingerprintResult.recordingId,
                releaseId: fingerprintResult.releaseId,
                releases: fingerprintResult.releases || [], // All releases this recording appears on
                status: fingerprintResult.status, // Include the status from the API
                isLive: fingerprintResult.isLive,
                releaseType: fingerprintResult.release?.['release-group']?.['primary-type'] || 'Unknown',
                method: 'fingerprint',
                trackId: trackId // Add track ID to ensure uniqueness
              };
              trackMatches.push(primaryMatch);
              console.log(`[TRACK ${trackId}] Primary match added:`, primaryMatch.title, primaryMatch.confidence + '%');
              console.log(`[TRACK ${trackId}] Match status:`, primaryMatch.status || 'undefined');
            }

            // Add any additional recordings - also unique to THIS result
            if (fingerprintResult.recordings && fingerprintResult.recordings.length > 0) {
              fingerprintResult.recordings.slice(0, 3).forEach((rec, idx) => {
                if (rec.title !== fingerprintResult.title) {
                  const additionalMatch = {
                    title: rec.title || rec.releaseTitle,
                    artist: rec.artist || rec.artists?.[0]?.name || track.artist,
                    album: rec.releaseTitle || rec.album || rec.releases?.[0]?.title || '',
                    confidence: Math.round((rec.score || 0.5) * 100),
                    duration: rec.duration || '',
                    year: rec.date || rec.releases?.[0]?.date || '',
                    recordingId: rec.recordingId,
                    releaseId: rec.releases?.[0]?.id,
                    releases: rec.releases || [],
                    method: 'fingerprint',
                    trackId: trackId
                  };
                  trackMatches.push(additionalMatch);
                  console.log(`[TRACK ${trackId}] Additional match ${idx + 1}:`, additionalMatch.title, additionalMatch.confidence + '%');
                }
              });
            }

            console.log(`[TRACK ${trackId}] Total matches for this track:`, trackMatches.length);

            // Update ONLY this specific track with its unique matches
            setTracks(prev => {
              const updated = prev.map(t => {
                if (t.id === trackId) {
                  console.log(`[TRACK ${trackId}] Updating track state with matches`);
                  return {
                    ...t,
                    status: 'matched',
                    statusMessage: `Found ${trackMatches.length} match${trackMatches.length > 1 ? 'es' : ''} via fingerprint`,
                    progress: 100,
                    matches: trackMatches // Use the unique matches for THIS track
                  };
                }
                return t;
              });
              return updated;
            });

            // Update MusicBrainz metadata if this is the first match
            if (!musicBrainzMetadata && trackMatches.length > 0) {
              const bestMatch = trackMatches[0];
              const concertInfo = extractConcertInfo(bestMatch.title);

              setMusicBrainzMetadata({
                artist: bestMatch.artist || 'Unknown Artist',
                album: bestMatch.album || 'Unknown Album',
                releaseDate: bestMatch.year || '',
                performanceDate: concertInfo?.date || '',
                venue: concertInfo?.venue || '',
                city: concertInfo?.city || '',
                state: concertInfo?.state || '',
                releaseType: bestMatch.releaseType || 'Unknown',
                releaseId: bestMatch.releaseId || '',
                artworkUrl: '', // Will be fetched later
                notes: bestMatch.isLive ? 'Live Recording' : '',
                musicbrainzUrl: bestMatch.releaseId ? `https://musicbrainz.org/release/${bestMatch.releaseId}` : '',
                trackCount: 0 // Will be updated later
              });

              // Fetch artwork if we have a release ID
              if (bestMatch.releaseId) {
                try {
                  const coverArt = await window.api.invoke('musicbrainz:fetchCover', bestMatch.releaseId);
                  if (coverArt) {
                    setMusicBrainzMetadata(prev => ({
                      ...prev,
                      artworkUrl: coverArt.large || coverArt.original || ''
                    }));
                  }
                } catch (error) {
                  console.error('Error fetching cover art:', error);
                }
              }
            }
          } else {
            // No fingerprint match, try metadata search
            await searchByMetadata(track, trackId);
          }
        } else {
          // Fingerprinting failed, try metadata search
          await searchByMetadata(track, trackId);
        }
      } catch (error) {
        console.error('Error processing track:', error);

        // Try metadata search as fallback
        try {
          await searchByMetadata(track, trackId);
        } catch (fallbackError) {
          setTracks(prev => prev.map(t => t.id === trackId ? {
            ...t,
            status: 'error',
            statusMessage: `Error: ${error.message || 'Failed to process track'}`,
            progress: 100
          } : t));
        }
      }

      // Update overall progress
      setOverallProgress(((currentTrackIndex + 1) / trackList.length) * 100);

      // Process next track
      currentTrackIndex++;
      console.log(`Track ${trackIndex + 1} processing complete. Moving to next track...\n`);
      setTimeout(processTrack, 500);
    };

    // Helper function to search by metadata
    const searchByMetadata = async (track, trackId) => {
      setTracks(prev => prev.map(t => t.id === trackId ? {
        ...t,
        status: 'searching',
        statusMessage: 'No fingerprint match, searching by metadata...',
        progress: 80
      } : t));

      try {
        // Try searching by title and artist
        const searchQuery = {
          artist: track.artist || track.metadata?.artist || 'Grateful Dead',
          recording: track.displayTitle || track.metadata?.title || '',
          limit: 5
        };

        console.log('Searching MusicBrainz by metadata:', searchQuery);

        // For now, simulate a metadata search result
        // In production, this would call the actual MusicBrainz search API
        const metadataMatches = [];

        if (track.metadata?.title) {
          metadataMatches.push({
            title: track.metadata.title,
            artist: track.metadata.artist || 'Grateful Dead',
            album: track.metadata.album || '',
            confidence: 70, // Lower confidence for metadata matches
            duration: track.metadata.duration ? `${Math.floor(track.metadata.duration / 60)}:${String(Math.floor(track.metadata.duration % 60)).padStart(2, '0')}` : '',
            year: track.metadata.date || '',
            method: 'metadata'
          });
        }

        if (metadataMatches.length > 0) {
          setTracks(prev => prev.map(t => t.id === trackId ? {
            ...t,
            status: 'matched',
            statusMessage: `Found ${metadataMatches.length} match${metadataMatches.length > 1 ? 'es' : ''} via metadata`,
            progress: 100,
            matches: metadataMatches
          } : t));
        } else {
          setTracks(prev => prev.map(t => t.id === trackId ? {
            ...t,
            status: 'nomatch',
            statusMessage: 'No matches found in MusicBrainz database',
            progress: 100
          } : t));
        }
      } catch (error) {
        console.error('Metadata search error:', error);
        setTracks(prev => prev.map(t => t.id === trackId ? {
          ...t,
          status: 'nomatch',
          statusMessage: 'Search failed - track may not be in database',
          progress: 100
        } : t));
      }
    };

    // Start processing
    setTimeout(processTrack, 500);
  };

  // Get status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case 'waiting': return <Clock />;
      case 'processing':
      case 'analyzing':
      case 'searching': return <Loader className="spinning" />;
      case 'matched': return <CheckCircle />;
      case 'nomatch': return <XCircle />;
      case 'error': return <AlertCircle />;
      default: return <Info />;
    }
  };

  // Get status message type
  const getStatusType = (status) => {
    switch (status) {
      case 'matched': return 'success';
      case 'nomatch': return 'warning';
      case 'error': return 'error';
      case 'processing':
      case 'analyzing':
      case 'searching': return 'info';
      default: return 'default';
    }
  };

  // Toggle match expansion
  const toggleMatchExpansion = (trackId) => {
    setExpandedMatches(prev => ({
      ...prev,
      [trackId]: !prev[trackId]
    }));
  };

  // Calculate statistics
  const stats = {
    total: tracks.length,
    completed: tracks.filter(t => ['matched', 'nomatch', 'error'].includes(t.status)).length,
    matched: tracks.filter(t => t.status === 'matched').length,
    failed: tracks.filter(t => t.status === 'error').length,
    processing: tracks.filter(t => ['processing', 'analyzing', 'searching'].includes(t.status)).length
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Extract concert information from recording title
  const extractConcertInfo = (title) => {
    if (!title) return null;

    // Pattern: "Song (Live at Venue, City, State, M/D/YYYY)"
    const match = title.match(/\(Live at ([^,]+),\s*([^,]+),\s*([A-Z]{2}),\s*(\d{1,2}\/\d{1,2}\/\d{4})\)/i);
    if (match) {
      const [_, venue, city, state, date] = match;

      // Convert date to ISO format
      const dateParts = date.split('/');
      const isoDate = `${dateParts[2]}-${dateParts[0].padStart(2, '0')}-${dateParts[1].padStart(2, '0')}`;

      return {
        venue: venue.trim(),
        city: city.trim(),
        state: state.trim(),
        date: isoDate,
        displayDate: date,
        originalTitle: title
      };
    }

    // Try alternate pattern without state
    const match2 = title.match(/\(Live at ([^,]+),\s*([^,]+),\s*(\d{1,2}\/\d{1,2}\/\d{4})\)/i);
    if (match2) {
      const [_, venue, location, date] = match2;
      const dateParts = date.split('/');
      const isoDate = `${dateParts[2]}-${dateParts[0].padStart(2, '0')}-${dateParts[1].padStart(2, '0')}`;

      return {
        venue: venue.trim(),
        city: location.trim(),
        state: null,
        date: isoDate,
        displayDate: date,
        originalTitle: title
      };
    }

    // Try to extract from common patterns like "St. Louis '71 '72 '73"
    const cityMatch = title.match(/(St\.\s*Louis|San Francisco|New York|Chicago|Philadelphia|Boston|Atlanta|Denver|Portland|Seattle|Los Angeles|Oakland)[,:]?\s*'?(\d{2})/);
    if (cityMatch) {
      const city = cityMatch[1].replace(/\s+/g, ' ').trim();
      // Map common cities to states
      const cityStateMap = {
        'St. Louis': 'MO',
        'San Francisco': 'CA',
        'New York': 'NY',
        'Chicago': 'IL',
        'Philadelphia': 'PA',
        'Boston': 'MA',
        'Atlanta': 'GA',
        'Denver': 'CO',
        'Portland': 'OR',
        'Seattle': 'WA',
        'Los Angeles': 'CA',
        'Oakland': 'CA'
      };

      return {
        venue: null, // Will need to be filled from other sources
        city: city,
        state: cityStateMap[city] || null,
        date: null, // Multiple dates in title
        originalTitle: title
      };
    }

    return null;
  };

  // Song title abbreviations used by Grateful Dead community
  const songAbbreviations = {
    'GDTRFB': 'Going Down the Road Feeling Bad',
    'NFA': 'Not Fade Away',
    'TLEO': 'They Love Each Other',
    'FOTM': 'Fire on the Mountain',
    'SOTM': 'Sugar Magnolia',
    'SSDD': 'Sunshine Daydream',
    'BEW': 'Black-Throated Wind',
    'BIODTL': 'Beat It On Down the Line',
    'CC': 'Cold Rain and Snow',
    'GSET': 'Greatest Story Ever Told',
    'IKYR': 'I Know You Rider',
    'OMSN': 'Old Man Sunshine Nightfall',
    'PITB': 'Playing in the Band',
    'TOO': 'The Other One',
    'WRS': 'Weather Report Suite'
  };

  // Normalize song title according to our conventions
  const normalizeSongTitle = (title) => {
    if (!title) return 'Unknown Track';

    let normalized = title.trim();

    // Remove live indicators and parenthetical info from MusicBrainz
    normalized = normalized.replace(/\s*\(Live.*?\)\s*/gi, '');
    normalized = normalized.replace(/\s*\[.*?\]\s*/g, '');

    // Expand abbreviations
    for (const [abbr, full] of Object.entries(songAbbreviations)) {
      const regex = new RegExp(`\\b${abbr}\\b`, 'gi');
      normalized = normalized.replace(regex, full);
    }

    // Normalize whitespace
    normalized = normalized.replace(/\s+/g, ' ');

    // Title case
    const exceptions = ['and', 'or', 'the', 'in', 'on', 'at', 'to', 'for', 'of', 'a', 'an'];
    normalized = normalized.toLowerCase().split(' ').map((word, index) => {
      if (index === 0 || !exceptions.includes(word)) {
        return word.charAt(0).toUpperCase() + word.slice(1);
      }
      return word;
    }).join(' ');

    return normalized;
  };

  // Format track title with date instead of full location
  const formatTrackTitle = (title, date) => {
    if (!title) return title;

    // First normalize the title
    const normalizedTitle = normalizeSongTitle(title);

    // If we have a date, add it in parentheses
    if (date) {
      return `${normalizedTitle} (${date})`;
    }

    return normalizedTitle;
  };

  // Create normalized album title
  const createNormalizedAlbumTitle = (concertInfo, releaseInfo) => {
    let title = '';

    if (concertInfo) {
      // Format: "1971-04-27 - Fillmore East - New York, NY"
      title = `${concertInfo.date} - ${concertInfo.venue}`;
      if (concertInfo.city) {
        title += ` - ${concertInfo.city}`;
        if (concertInfo.state) {
          title += `, ${concertInfo.state}`;
        }
      }
    }

    if (releaseInfo && releaseInfo.title) {
      // Add release info as subtitle without "Remaster" text
      title += ` : ${releaseInfo.title}`;
    }

    return title;
  };

  // Handle applying matches to tracks
  const handleApplyMatches = async () => {
    console.log('\n=== APPLY MATCHES STARTED ===');
    console.log(`Attempting to apply ${stats.matched} matches`);

    const matchedTracks = tracks.filter(t => t.status === 'matched' && t.matches && t.matches.length > 0);
    console.log(`Found ${matchedTracks.length} tracks with matches to apply`);

    // Build track updates array in the expected format
    const trackUpdates = [];
    let commonAlbum = null;
    let commonArtist = null;
    let commonReleaseId = null;
    let isCompilation = false;
    let releaseYear = null;

    for (let i = 0; i < tracks.length; i++) {
      const track = tracks[i];

      if (track.status === 'matched' && track.matches && track.matches.length > 0) {
        const bestMatch = track.matches[0]; // Use the highest confidence match

        console.log(`\nApplying match for track ${i + 1}:`, {
          originalTitle: track.displayTitle,
          matchedTitle: bestMatch.title,
          matchedArtist: bestMatch.artist,
          matchedAlbum: bestMatch.album,
          confidence: bestMatch.confidence,
          releaseType: bestMatch.releaseType
        });

        // Check for compilation/box set
        if (bestMatch.releaseType === 'Compilation' || bestMatch.album?.includes('Box Set') ||
            bestMatch.album?.includes('Compilation')) {
          isCompilation = true;
          console.warn(`⚠ Track matched to compilation/box set: ${bestMatch.album}`);
        }

        // Extract concert info from the recording title
        const concertInfo = extractConcertInfo(bestMatch.title);
        if (concertInfo) {
          console.log(`Concert info extracted from "${bestMatch.title}":`, {
            venue: concertInfo.venue,
            city: concertInfo.city,
            state: concertInfo.state,
            date: concertInfo.date
          });
        }

        // Track if all tracks are from the same release
        if (!commonAlbum) commonAlbum = bestMatch.album;
        if (!commonArtist) commonArtist = bestMatch.artist;
        if (!commonReleaseId) commonReleaseId = bestMatch.releaseId;
        if (!releaseYear) releaseYear = bestMatch.year;

        // Check for potential issues
        if (bestMatch.releases && bestMatch.releases.length > 1) {
          console.warn(`⚠ Recording appears on ${bestMatch.releases.length} releases`);
          bestMatch.releases.slice(0, 5).forEach((rel, idx) => {
            console.log(`  ${idx + 1}. "${rel.title}" (${rel.date || 'unknown'}) - ${rel.type || 'Unknown type'}`);
          });
        }

        // Create track update in expected format with normalized title
        const normalizedTitle = normalizeSongTitle(bestMatch.title);

        trackUpdates.push({
          title: normalizedTitle,
          artist: bestMatch.artist,
          duration: track.duration, // Keep original duration
          position: i + 1,
          discNumber: 1, // Default to disc 1 for now
          discTrackNumber: i + 1,
          recordingId: bestMatch.recordingId,
          releaseId: bestMatch.releaseId,
          hasSegue: track.hasSegue || false,
          recordingDate: concertInfo?.date || track.recordingDate
        });
      } else {
        // Keep original track data if no match
        trackUpdates.push({
          title: track.displayTitle,
          artist: track.artist || commonArtist || 'Grateful Dead',
          duration: track.duration,
          position: i + 1,
          discNumber: 1,
          discTrackNumber: i + 1
        });
      }
    }

    console.log(`\nPrepared ${trackUpdates.length} track updates`);

    // Extract concert info from the first matched track
    let concertInfo = null;
    let normalizedTitle = commonAlbum;

    for (const track of matchedTracks) {
      if (track.matches && track.matches[0] && track.matches[0].title) {
        concertInfo = extractConcertInfo(track.matches[0].title);
        if (concertInfo) {
          console.log('Concert information extracted:', concertInfo);

          // Create normalized album title
          normalizedTitle = createNormalizedAlbumTitle(concertInfo, {
            title: commonAlbum,
            year: releaseYear
          });

          console.log('Normalized album title:', normalizedTitle);
          break;
        }
      }
    }

    // Fetch album cover if we have a release ID
    let coverArtUrl = null;
    if (commonReleaseId) {
      try {
        console.log('Fetching cover art for release:', commonReleaseId);
        const coverArt = await window.api.invoke('musicbrainz:fetchCover', commonReleaseId);
        if (coverArt) {
          coverArtUrl = coverArt.large || coverArt.original;
          console.log('Cover art found:', coverArtUrl);
        }
      } catch (error) {
        console.error('Error fetching cover art:', error);
      }
    }

    // Check if any of the matched releases are official
    let isOfficialRelease = false;
    console.log('=== CHECKING FOR OFFICIAL RELEASES ===');
    matchedTracks.forEach((track, trackIndex) => {
      if (track.matches && track.matches.length > 0) {
        const bestMatch = track.matches[0];
        console.log(`Track ${trackIndex + 1} best match:`, bestMatch.title);
        if (bestMatch.releases) {
          console.log(`  Has ${bestMatch.releases.length} releases:`);
          bestMatch.releases.forEach((release, idx) => {
            console.log(`    ${idx + 1}. "${release.title}" - Status: ${release.status}, Type: ${release.type}`);

            // Check multiple ways to detect official release
            // Log the raw release data to understand what we're getting
            if (idx === 0) {
              console.log('    Full release object:', JSON.stringify(release, null, 2));
            }

            const isOfficial =
              release.status === 'Official' ||
              release.status === 'official' ||
              (!release.status && release.type !== 'Bootleg') || // If no status but not a bootleg type
              (!release.status && !release.type) || // If neither field exists, assume official
              (release.title && release.title.includes('(Official')) ||
              (release.title && (
                release.title.includes("Dave's Picks") ||
                release.title.includes("Dick's Picks") ||
                release.title.includes("Road Trips") ||
                release.title.includes("Truckin' Up to Buffalo") ||
                release.title.includes("Truckin' Up to Buffalo") ||
                release.title.includes("Winterland") ||
                release.title.includes("Fillmore") ||
                release.title.includes("Europe '72") ||
                release.title.includes("Sunshine Daydream") ||
                release.title.includes("Alpine Valley")
              ));

            if (isOfficial) {
              isOfficialRelease = true;
              console.log(`    ✓ FOUND OFFICIAL RELEASE! (status: ${release.status}, type: ${release.type})`);
            }
          });
        } else {
          console.log('  No releases data available');
        }
      }
    });
    console.log('Final isOfficialRelease:', isOfficialRelease);
    console.log('=====================================');

    // Find the actual status value from releases
    let actualStatus = null;
    console.log('=== SEARCHING FOR STATUS IN MATCHED TRACKS ===');
    console.log('Number of matched tracks:', matchedTracks.length);

    matchedTracks.forEach((track, trackIdx) => {
      if (track.matches && track.matches[0] && !actualStatus) {
        const bestMatch = track.matches[0];
        console.log(`Track ${trackIdx + 1} best match:`, {
          title: bestMatch.title,
          hasStatus: !!bestMatch.status,
          status: bestMatch.status,
          hasReleases: !!bestMatch.releases,
          releasesCount: bestMatch.releases?.length
        });

        // Check if the match itself has status information
        if (bestMatch.status) {
          actualStatus = bestMatch.status;
          if (actualStatus === 'Official') {
            isOfficialRelease = true;
          }
          console.log(`✓ Found status directly on match: ${actualStatus}`);
        }

        // Check if the match has release information
        if (!actualStatus && bestMatch.releases) {
          const officialRelease = bestMatch.releases.find(r => r.status === 'Official');
          if (officialRelease) {
            actualStatus = 'Official';
            isOfficialRelease = true;
            console.log('✓ Found official release in releases array:', officialRelease.title);
          } else if (bestMatch.releases[0]) {
            actualStatus = bestMatch.releases[0].status || null;
            // If any release has 'Official' status, mark as official
            if (actualStatus === 'Official') {
              isOfficialRelease = true;
            }
            console.log(`✓ Using first release status: ${actualStatus}`);
          }
        }
      }
    });
    console.log('Actual MusicBrainz status value:', actualStatus);
    console.log('Is official release:', isOfficialRelease);
    console.log('DEBUG: Status detection summary:');
    console.log('  - actualStatus:', actualStatus);
    console.log('  - isOfficialRelease:', isOfficialRelease);
    console.log('  - First match status:', matchedTracks[0]?.matches?.[0]?.status);

    // Prepare the album-level data structure expected by handleMusicBrainzApply
    const mbData = {
      artist: commonArtist || initialData?.artist || 'Grateful Dead',
      album: normalizedTitle || commonAlbum || initialData?.album || 'Unknown Album',
      date: concertInfo?.date || releaseYear || initialData?.date,
      isOfficialRelease: isOfficialRelease,
      status: actualStatus, // Pass through the actual MusicBrainz status value
      isLive: true,
      releaseType: isCompilation ? 'Compilation' : 'Live',
      discCount: 1,
      tracks: trackUpdates,
      // Add concert and release info
      concertInfo: concertInfo,
      releaseInfo: {
        title: commonAlbum,
        year: releaseYear,
        mbid: commonReleaseId,
        isCompilation: isCompilation,
        status: actualStatus // Also add status to releaseInfo
      },
      originalAlbum: commonAlbum, // Keep original album name for reference
      performanceDate: concertInfo?.date,
      venue: concertInfo?.venue,
      location: concertInfo ? `${concertInfo.city}${concertInfo.state ? ', ' + concertInfo.state : ''}` : null,
      coverArtUrl: coverArtUrl // Add cover art URL
    };

    if (isCompilation) {
      console.warn('\n⚠ WARNING: Matches are from a compilation/box set!');
      console.warn('The track numbers and disc organization may not match your files.');
      console.warn('Album will be organized by concert date with release info.');

      let warningMessage = `The matches found are from a compilation/box set:\n"${commonAlbum}"`;

      if (concertInfo) {
        warningMessage += `\n\nOriginal Concert: ${concertInfo.displayDate} at ${concertInfo.venue}`;
        warningMessage += `\nAlbum will be titled: "${normalizedTitle}"`;
      }

      warningMessage += `\n\nThis preserves the concert date while noting the remastered source.`;
      warningMessage += `\nApply these matches?`;

      const proceed = window.confirm(warningMessage);

      if (!proceed) {
        console.log('User cancelled applying compilation matches');
        return;
      }
    }

    // Log the venue and location data being sent
    console.log('Venue and location data being applied:', {
      venue: mbData.venue,
      concertInfo: mbData.concertInfo,
      location: mbData.location
    });

    // Call the parent's onApply callback if provided
    if (onApply && typeof onApply === 'function') {
      try {
        console.log('Calling onApply callback with album data structure:', mbData);
        console.log('CRITICAL: mbData.status being sent:', mbData.status);
        console.log('CRITICAL: mbData.isOfficialRelease being sent:', mbData.isOfficialRelease);
        await onApply(mbData);
        console.log('✅ Successfully applied matches');
        onClose(); // Close the dialog after successful apply
      } catch (error) {
        console.error('❌ Error applying matches:', error);
        console.error('Error details:', {
          message: error.message,
          stack: error.stack
        });
        alert(`Failed to apply matches: ${error.message}`);
      }
    } else {
      console.error('❌ No onApply callback provided!');
      alert('Cannot apply matches: No apply handler configured');
    }

    console.log('=== APPLY MATCHES COMPLETED ===\n');
  };

  // Helper function to compare values
  const compareValues = (current, musicbrainz) => {
    if (!current && !musicbrainz) return 'empty';
    if (!current || !musicbrainz) return 'different';
    return current.toLowerCase() === musicbrainz.toLowerCase() ? 'matched' : 'different';
  };

  // Get paginated tracks
  const totalPages = Math.ceil(tracks.length / tracksPerPage);
  const startIndex = (currentPage - 1) * tracksPerPage;
  const endIndex = startIndex + tracksPerPage;
  const paginatedTracks = tracks.slice(startIndex, endIndex);

  return (
    <Overlay onClick={onClose}>
      <Dialog onClick={(e) => e.stopPropagation()}>
        <Header>
          <h2>
            <Volume2 />
            MusicBrainz Metadata Comparison & Fingerprinting
          </h2>
          <button onClick={onClose}>
            <X />
          </button>
        </Header>

        <TabNav>
          <button
            className={`tab ${activeTab === 'metadata' ? 'active' : ''}`}
            onClick={() => setActiveTab('metadata')}
          >
            Metadata Comparison
          </button>
          <button
            className={`tab ${activeTab === 'tracks' ? 'active' : ''}`}
            onClick={() => setActiveTab('tracks')}
          >
            Track List
          </button>
          <button
            className={`tab ${activeTab === 'fingerprint' ? 'active' : ''}`}
            onClick={() => setActiveTab('fingerprint')}
          >
            Fingerprinting Progress
          </button>
        </TabNav>

        {activeTab === 'metadata' && (
          <MetadataComparison>
            <div className="comparison-grid">
              {/* Current Metadata Column */}
              <div className="column">
                <h3 className="current">
                  <Info />
                  Current Metadata
                </h3>

                {currentMetadata && (
                  <>
                    <div className="metadata-section">
                      <h4>Album Information</h4>
                      <div className="field">
                        <div className="label">Artist</div>
                        <div className={`value ${!currentMetadata.artist ? 'empty' : ''}`}>
                          {currentMetadata.artist || 'No artist'}
                        </div>
                      </div>
                      <div className="field">
                        <div className="label">Album Title</div>
                        <div className={`value ${!currentMetadata.album ? 'empty' : ''}`}>
                          {currentMetadata.album || 'No album title'}
                        </div>
                      </div>
                      <div className="field">
                        <div className="label">Release Type</div>
                        <div className="value">
                          {currentMetadata.releaseType}
                        </div>
                      </div>
                      <div className="field">
                        <div className="label">Performance Date</div>
                        <div className={`value ${!currentMetadata.performanceDate ? 'empty' : ''}`}>
                          {currentMetadata.performanceDate || 'No date'}
                        </div>
                      </div>
                      <div className="field">
                        <div className="label">Release Date</div>
                        <div className={`value ${!currentMetadata.releaseDate ? 'empty' : ''}`}>
                          {currentMetadata.releaseDate || 'No release date'}
                        </div>
                      </div>
                    </div>

                    <div className="metadata-section">
                      <h4>Venue Information</h4>
                      <div className="field">
                        <div className="label">Venue</div>
                        <div className={`value ${!currentMetadata.venue ? 'empty' : ''}`}>
                          {currentMetadata.venue || 'No venue'}
                        </div>
                      </div>
                      <div className="field">
                        <div className="label">City</div>
                        <div className={`value ${!currentMetadata.city ? 'empty' : ''}`}>
                          {currentMetadata.city || 'No city'}
                        </div>
                      </div>
                      <div className="field">
                        <div className="label">State</div>
                        <div className={`value ${!currentMetadata.state ? 'empty' : ''}`}>
                          {currentMetadata.state || 'No state'}
                        </div>
                      </div>
                    </div>

                    <div className="metadata-section">
                      <h4>Additional Information</h4>
                      <div className="field">
                        <div className="label">Track Count</div>
                        <div className="value">
                          {currentMetadata.trackCount} tracks
                        </div>
                      </div>
                      <div className="field">
                        <div className="label">Album Artwork</div>
                        <div className={`artwork ${!currentMetadata.artworkUrl ? 'empty' : ''}`}>
                          {currentMetadata.artworkUrl ? (
                            <img src={currentMetadata.artworkUrl} alt="Current album artwork" />
                          ) : (
                            'No artwork'
                          )}
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* MusicBrainz Metadata Column */}
              <div className="column">
                <h3 className="musicbrainz">
                  <Volume2 />
                  MusicBrainz Metadata
                </h3>

                {musicBrainzMetadata ? (
                  <>
                    <div className="metadata-section">
                      <h4>Album Information</h4>
                      <div className="field">
                        <div className="label">Artist</div>
                        <div className={`value ${compareValues(currentMetadata?.artist, musicBrainzMetadata.artist)}`}>
                          {musicBrainzMetadata.artist || 'No artist'}
                        </div>
                      </div>
                      <div className="field">
                        <div className="label">Album Title</div>
                        <div className={`value ${compareValues(currentMetadata?.album, musicBrainzMetadata.album)}`}>
                          {musicBrainzMetadata.album || 'No album title'}
                        </div>
                      </div>
                      <div className="field">
                        <div className="label">Release Type</div>
                        <div className={`value ${compareValues(currentMetadata?.releaseType, musicBrainzMetadata.releaseType)}`}>
                          {musicBrainzMetadata.releaseType}
                        </div>
                      </div>
                      <div className="field">
                        <div className="label">Performance Date</div>
                        <div className={`value ${compareValues(currentMetadata?.performanceDate, musicBrainzMetadata.performanceDate)}`}>
                          {musicBrainzMetadata.performanceDate || 'No date'}
                        </div>
                      </div>
                      <div className="field">
                        <div className="label">Release Date</div>
                        <div className={`value ${compareValues(currentMetadata?.releaseDate, musicBrainzMetadata.releaseDate)}`}>
                          {musicBrainzMetadata.releaseDate || 'No release date'}
                        </div>
                      </div>
                    </div>

                    <div className="metadata-section">
                      <h4>Venue Information</h4>
                      <div className="field">
                        <div className="label">Venue</div>
                        <div className={`value ${compareValues(currentMetadata?.venue, musicBrainzMetadata.venue)}`}>
                          {musicBrainzMetadata.venue || 'No venue'}
                        </div>
                      </div>
                      <div className="field">
                        <div className="label">City</div>
                        <div className={`value ${compareValues(currentMetadata?.city, musicBrainzMetadata.city)}`}>
                          {musicBrainzMetadata.city || 'No city'}
                        </div>
                      </div>
                      <div className="field">
                        <div className="label">State</div>
                        <div className={`value ${compareValues(currentMetadata?.state, musicBrainzMetadata.state)}`}>
                          {musicBrainzMetadata.state || 'No state'}
                        </div>
                      </div>
                    </div>

                    <div className="metadata-section">
                      <h4>Additional Information</h4>
                      <div className="field">
                        <div className="label">MusicBrainz URL</div>
                        <div className="value">
                          {musicBrainzMetadata.musicbrainzUrl ? (
                            <a href={musicBrainzMetadata.musicbrainzUrl} target="_blank" rel="noopener noreferrer" style={{ color: theme.colors.status.info }}>
                              View on MusicBrainz →
                            </a>
                          ) : (
                            <span className="empty">No MusicBrainz link</span>
                          )}
                        </div>
                      </div>
                      <div className="field">
                        <div className="label">Album Artwork</div>
                        <div className={`artwork ${!musicBrainzMetadata.artworkUrl ? 'empty' : ''}`}>
                          {musicBrainzMetadata.artworkUrl ? (
                            <img src={musicBrainzMetadata.artworkUrl} alt="MusicBrainz album artwork" />
                          ) : (
                            'No artwork found'
                          )}
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div style={{ padding: theme.spacing.lg, textAlign: 'center', color: theme.colors.text.dimmed }}>
                    {processingState === 'ready' ? (
                      'Click "Start Fingerprinting" to fetch MusicBrainz metadata'
                    ) : processingState === 'processing' ? (
                      'Fingerprinting in progress...'
                    ) : (
                      'No MusicBrainz metadata available yet'
                    )}
                  </div>
                )}
              </div>
            </div>
          </MetadataComparison>
        )}

        {activeTab === 'tracks' && (
          <TrackComparison>
            <div className="track-table">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Current Title</th>
                    <th>MusicBrainz Title</th>
                    <th>Duration</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedTracks.map((track, index) => {
                    const globalIndex = startIndex + index;
                    const mbMatch = track.matches?.[0]; // Best match from MusicBrainz
                    return (
                      <tr key={track.id}>
                        <td className="track-number">{globalIndex + 1}</td>
                        <td>{track.displayTitle}</td>
                        <td className={mbMatch?.title ? (compareValues(track.displayTitle, mbMatch.title)) : ''}>
                          {mbMatch?.title ? normalizeSongTitle(mbMatch.title) : <span className="empty">No match</span>}
                        </td>
                        <td>{formatDuration(track.duration)}</td>
                        <td>
                          <span style={{
                            color: track.status === 'matched' ? theme.colors.status.success :
                                   track.status === 'error' ? theme.colors.status.error :
                                   theme.colors.text.secondary
                          }}>
                            {track.statusMessage || 'Pending'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="pagination">
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                >
                  First
                </button>
                <button
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  Previous
                </button>
                <div className="page-info">
                  Page {currentPage} of {totalPages}
                </div>
                <button
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Next
                </button>
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                >
                  Last
                </button>
              </div>
            )}
          </TrackComparison>
        )}

        {activeTab === 'fingerprint' && (
          <>
            <OverallProgress>
              <div className="progress-header">
                <div className="progress-title">
                  Fingerprinting {stats.total} tracks
                </div>
                <div className="progress-stats">
                  <span className="success">
                    <CheckCircle />
                    {stats.matched} matched
                  </span>
                  <span className="warning">
                    <AlertTriangle />
                    {stats.total - stats.matched - stats.failed} pending
                  </span>
                  {stats.failed > 0 && (
                    <span className="error">
                      <XCircle />
                      {stats.failed} failed
                    </span>
                  )}
                </div>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${overallProgress}%` }} />
              </div>
              {stats.processing > 0 && (
                <div className="eta">
                  Estimated time remaining: ~{Math.ceil((stats.total - stats.completed) * 3)} seconds
                </div>
              )}
            </OverallProgress>

            <TracksContainer>
              {tracks.map((track, index) => (
                <TrackCard key={track.id} $status={track.status}>
              <TrackHeader $status={track.status}>
                <div className="track-number">{index + 1}.</div>
                <div className="track-info">
                  <div className="track-title">{track.displayTitle}</div>
                  <div className="track-details">
                    {track.path && track.path.split(/[\\\/]/).pop()} • {formatDuration(track.duration)}
                  </div>
                </div>
                <div className="status-icon">
                  {getStatusIcon(track.status)}
                </div>
              </TrackHeader>

              <StatusMessage $type={getStatusType(track.status)}>
                {track.status === 'processing' && <Volume2 />}
                {track.status === 'analyzing' && <Loader className="spinning" />}
                {track.status === 'searching' && <Search />}
                <span className="message-text">{track.statusMessage}</span>
                {track.progress > 0 && track.progress < 100 && (
                  <span className="progress-indicator">{track.progress}%</span>
                )}
              </StatusMessage>

              {track.quality && (track.quality.issues?.length > 0 || track.status === 'error') && (
                <AudioQuality>
                  <div className={`quality-item ${track.quality.bitrate >= 256 ? 'good' : 'warning'}`}>
                    Bitrate: {track.quality.bitrate} kbps
                  </div>
                  <div className="quality-item good">
                    Format: {track.quality.format}
                  </div>
                  {track.quality.issues?.map((issue, i) => (
                    <div key={i} className="quality-item warning">
                      ⚠ {issue}
                    </div>
                  ))}
                </AudioQuality>
              )}

              {track.fingerprint && (
                <AudioQuality>
                  <div className="quality-item" style={{ fontSize: '11px', fontFamily: 'monospace' }}>
                    Fingerprint: {track.fingerprint.substring(0, 40)}...
                  </div>
                  {track.fingerprintDuration && (
                    <div className="quality-item">
                      Duration: {track.fingerprintDuration}s
                    </div>
                  )}
                </AudioQuality>
              )}

              {track.matches && track.matches.length > 0 && (
                <MatchResults $expanded={expandedMatches[track.id]}>
                  <div className="matches-header" onClick={() => toggleMatchExpansion(track.id)}>
                    <span>
                      {track.matches.length} possible matches found
                      {track.matches[0].method && ` (via ${track.matches[0].method})`}
                    </span>
                    {expandedMatches[track.id] ? <ChevronDown /> : <ChevronRight />}
                  </div>
                  <div className="matches-list">
                    {track.matches.map((match, matchIndex) => (
                      <MatchItem key={matchIndex} $confidence={match.confidence}>
                        <div className="match-header">
                          <div className="match-title">
                            {match.title} - {match.artist}
                          </div>
                          <div className="confidence-badge">
                            {match.confidence}% {match.method === 'metadata' ? 'metadata' : 'fingerprint'}
                          </div>
                        </div>
                        <div className="match-details">
                          <div>{match.album || 'Unknown Album'} {match.year && `(${match.year})`}</div>
                          <div style={{ fontSize: '11px', marginTop: '2px' }}>
                            Duration: {match.duration}
                            {match.releaseType && match.releaseType !== 'Unknown' && ` • Type: ${match.releaseType}`}
                            {match.isLive && ' • Live Recording'}
                          </div>
                          {match.releases && match.releases.length > 1 && (
                            <div style={{ fontSize: '10px', marginTop: '4px', color: theme.colors.status.info }}>
                              Also appears on {match.releases.length - 1} other release{match.releases.length > 2 ? 's' : ''}
                            </div>
                          )}
                          {match.recordingId && (
                            <div style={{ fontSize: '10px', marginTop: '4px', opacity: 0.5 }}>
                              Recording ID: {match.recordingId}
                            </div>
                          )}
                        </div>
                      </MatchItem>
                    ))}
                  </div>
                </MatchResults>
              )}

              {track.status === 'nomatch' && (
                <StatusMessage $type="warning">
                  <Info />
                  <span className="message-text">
                    Possible reasons: Track not in database • Live/bootleg recording • Audio quality issues
                  </span>
                </StatusMessage>
              )}
              </TrackCard>
            ))}
          </TracksContainer>
          </>
        )}

        <Footer>
          <div className="summary">
            <div className="summary-item">
              <Volume2 />
              <strong>{stats.total}</strong> tracks
            </div>
            <div className="summary-item">
              <CheckCircle />
              <strong>{stats.matched}</strong> matched
            </div>
            <div className="summary-item">
              <Clock />
              <strong>{stats.processing}</strong> processing
            </div>
            {stats.failed > 0 && (
              <div className="summary-item">
                <AlertCircle />
                <strong>{stats.failed}</strong> failed
              </div>
            )}
          </div>
          <div className="actions">
            {processingState === 'ready' || (stats.skipped === tracks.length && tracks.length > 0) ? (
              <>
                <button className="primary" onClick={() => {
                  setProcessingState('processing');
                  startFingerprintingProcess(tracks);
                }}>
                  Start Fingerprinting
                </button>
                <button className="secondary" onClick={onClose}>
                  Cancel
                </button>
              </>
            ) : processingState === 'processing' ? (
              <>
                <button className="secondary" disabled>
                  Processing...
                </button>
                <button className="secondary" onClick={onClose}>
                  Cancel
                </button>
              </>
            ) : (
              <>
                <button className="secondary" onClick={() => console.log('Manual search not yet implemented')}>
                  Try Manual Search
                </button>
                <button
                  className="primary"
                  disabled={stats.matched === 0}
                  onClick={() => handleApplyMatches()}
                >
                  Apply {stats.matched} Matches
                </button>
              </>
            )}
          </div>
        </Footer>
      </Dialog>
    </Overlay>
  );
}

export default MusicBrainzFingerprint;