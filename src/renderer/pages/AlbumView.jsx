import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  ChevronLeft,
  Play,
  Search,
  CheckCircle,
  Clock,
  MessageSquare,
  Hash,
  GripVertical,
  ExternalLink,
  Image
} from 'lucide-react';
import { theme } from '../styles/globalStyles';
import { useStore } from '../store';
import MusicBrainzDialog from '../components/MusicBrainzDialog';
import MusicBrainzDialogV2 from '../components/MusicBrainzDialogV2';
import MusicBrainzDialogMinimal from '../components/MusicBrainzDialogMinimal';
import MusicBrainzFingerprint from '../components/MusicBrainzFingerprint';
import MetadataEditor from '../components/MetadataEditor';

const PageContainer = styled.div`
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const PageHeader = styled.div`
  background: ${theme.colors.background.surface};
  padding: 20px;
  border-bottom: 1px solid ${theme.colors.border};
  display: flex;
  flex-direction: column;
  gap: 12px;

  /* Row 1: Title and Badge */
  .header-row-1 {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  /* Row 2: Artist and Buttons */
  .header-row-2 {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  h1 {
    font-size: 26px;
    font-weight: 600;
    margin: 0;
    color: #FFFFFF;
    line-height: 1.2;
  }

  .artist-name {
    font-size: 18px;
    font-weight: 500;
    color: #D0D0D0;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .subtitle {
    color: ${theme.colors.text.secondary};
    font-size: ${theme.typography.fontSize.md};
    margin-left: ${theme.spacing.md};
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
`;

const PageContent = styled.div`
  flex: 1;
  display: grid;
  grid-template-columns: 260px 1fr;
  padding: ${theme.spacing.lg};
  gap: ${theme.spacing.lg};
  overflow: auto;
  min-height: 0;
`;

const AlbumSidebar = styled.div`
  background: ${theme.colors.background.surface};
  border-radius: ${theme.borderRadius.lg};
  padding: ${theme.spacing.xl};
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.lg};
  height: fit-content;
  position: sticky;
  top: 0;
`;

const AlbumArtwork = styled.div`
  width: 200px;
  height: 200px;
  background: ${theme.colors.background.elevated};
  border-radius: ${theme.borderRadius.md};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border: 2px solid ${theme.colors.border};

  svg {
    width: 64px;
    height: 64px;
    color: ${theme.colors.text.disabled};
  }

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: ${theme.borderRadius.md};
  }
`;

const AlbumInfo = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.md};
`;

const AlbumTitle = styled.div`
  h1 {
    font-size: ${theme.typography.fontSize.xxl};
    font-weight: 700;
    margin-bottom: ${theme.spacing.sm};

    input {
      font-size: inherit;
      font-weight: inherit;
      width: 100%;
      background: transparent;
      border: none;
      border-bottom: 2px solid transparent;

      &:focus {
        outline: none;
        border-bottom-color: ${theme.colors.accent.primary};
      }
    }
  }

  .artist {
    font-size: ${theme.typography.fontSize.lg};
    color: ${theme.colors.text.secondary};

    input {
      font-size: inherit;
      width: 100%;
      background: transparent;
      border: none;
      border-bottom: 1px solid transparent;

      &:focus {
        outline: none;
        border-bottom-color: ${theme.colors.accent.primary};
      }
    }
  }
`;

const AlbumMeta = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: ${theme.spacing.md};
  padding-top: ${theme.spacing.md};
  border-top: 1px solid ${theme.colors.border};
`;

const MetaField = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.xs};

  label {
    font-size: ${theme.typography.fontSize.xs};
    text-transform: uppercase;
    color: ${theme.colors.text.disabled};
    font-weight: 600;
  }

  .value {
    font-size: ${theme.typography.fontSize.sm};
    color: ${theme.colors.text.primary};
    display: flex;
    align-items: center;
    gap: ${theme.spacing.xs};

    svg {
      width: 14px;
      height: 14px;
      color: ${theme.colors.text.secondary};
    }

    input, select {
      width: 100%;
      padding: ${theme.spacing.xs};
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

const AlbumActions = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
  flex-shrink: 0;

  /* No longer need divider in new layout */
  .divider {
    display: none;
  }

  button {
    padding: 4px 10px;
    border-radius: ${theme.borderRadius.md};
    display: flex;
    align-items: center;
    gap: ${theme.spacing.xs};
    font-size: 13px;
    transition: all ${theme.transitions.fast};
    max-height: 32px;

    svg {
      width: 16px;
      height: 16px;
    }

    /* Primary button - Play Album */
    &.primary {
      background: ${theme.colors.accent.primary};
      color: white;
      border: 1px solid ${theme.colors.accent.primary};

      &:hover {
        background: ${theme.colors.accent.secondary};
        border-color: ${theme.colors.accent.secondary};
      }
    }

    /* Secondary outlined buttons */
    &.secondary {
      background: transparent;
      color: #B0B0B0;
      border: 1px solid #606060;

      &:hover {
        background: rgba(255, 255, 255, 0.05);
        border-color: #808080;
      }
    }

    /* Success outlined button - Mark as Verified */
    &.success {
      background: transparent;
      color: #B0B0B0;
      border: 1px solid #606060;

      &:hover {
        background: rgba(255, 255, 255, 0.05);
        border-color: #808080;
      }
    }

    /* Cancel button */
    &.cancel {
      background: ${theme.colors.status.error};
      color: white;
      border: 1px solid ${theme.colors.status.error};

      &:hover {
        opacity: 0.9;
      }
    }
  }
`;

const ReleaseStatusIndicator = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 10px;

  &.official {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    box-shadow: 0 2px 4px rgba(102, 126, 234, 0.3);
  }

  &.bootleg {
    background: rgba(255, 193, 7, 0.15);
    color: #FFC107;
    border: 1px solid rgba(255, 193, 7, 0.3);
  }

  &.promotion {
    background: rgba(33, 150, 243, 0.15);
    color: #2196F3;
    border: 1px solid rgba(33, 150, 243, 0.3);
  }

  &.pseudo {
    background: rgba(158, 158, 158, 0.15);
    color: #9E9E9E;
    border: 1px solid rgba(158, 158, 158, 0.3);
  }
`;

const AlbumType = styled.div`
  display: inline-flex;
  padding: ${theme.spacing.xs} ${theme.spacing.sm};
  border-radius: ${theme.borderRadius.sm};
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  align-items: center;
  gap: ${theme.spacing.xs};

  /* Official Release - blue/teal */
  &.official {
    background: ${theme.colors.accent.primary}20;
    color: ${theme.colors.accent.primary};
  }

  /* Soundboard - green */
  &.soundboard {
    background: rgba(76, 175, 80, 0.2);
    color: #4CAF50;
  }

  /* Audience - orange */
  &.audience {
    background: rgba(255, 152, 0, 0.2);
    color: #FF9800;
  }

  /* Matrix - purple */
  &.matrix {
    background: rgba(156, 39, 176, 0.2);
    color: #9C27B0;
  }

  /* FM Broadcast / Pre-FM - blue */
  &.broadcast {
    background: rgba(33, 150, 243, 0.2);
    color: #2196F3;
  }

  /* Studio - gray */
  &.studio {
    background: rgba(158, 158, 158, 0.2);
    color: #9E9E9E;
  }

  &.unknown {
    background: rgba(128, 128, 128, 0.2);
    color: #808080;
  }

  /* Default - gray */
  &.default {
    background: rgba(128, 128, 128, 0.2);
    color: #808080;
  }
`;

const TracksSection = styled.div`
  background: ${theme.colors.background.surface};
  border-radius: ${theme.borderRadius.lg};
  display: flex;
  flex-direction: column;
  overflow: hidden;
  height: 100%;
`;

const TracksHeader = styled.div`
  padding: ${theme.spacing.md} ${theme.spacing.lg};
  border-bottom: 1px solid ${theme.colors.border};
  display: flex;
  justify-content: space-between;
  align-items: center;

  h2 {
    font-size: ${theme.typography.fontSize.md};
    font-weight: 600;
  }

  .track-count {
    color: ${theme.colors.text.secondary};
    font-size: ${theme.typography.fontSize.sm};
  }
`;

const TracksTable = styled.div`
  flex: 1;
  overflow-y: auto;
  min-height: 0;
  padding-bottom: ${theme.spacing.xl};
`;

const Track = styled.div`
  display: grid;
  grid-template-columns: ${props => props.editMode
    ? '32px 50px minmax(300px, 3fr) 100px 70px 40px minmax(150px, 1fr)'
    : '50px minmax(300px, 3fr) 100px 70px minmax(150px, 1fr)'};
  align-items: center;
  padding: ${theme.spacing.sm} ${theme.spacing.md};
  border-bottom: 1px solid ${theme.colors.border};
  gap: ${theme.spacing.sm};
  transition: background ${theme.transitions.fast};
  position: relative;

  &:hover {
    background: ${theme.colors.background.elevated}50;
  }

  &.selected {
    background: ${theme.colors.accent.primary}10;
  }

  &.playing {
    background: ${theme.colors.accent.primary}15;
    border-left: 3px solid ${theme.colors.accent.primary};

    .track-number {
      color: ${theme.colors.accent.primary};
      font-weight: 700;
    }

    &::before {
      content: '♪';
      position: absolute;
      left: 5px;
      color: ${theme.colors.accent.primary};
      animation: pulse 1.5s ease-in-out infinite;
    }
  }

  @keyframes pulse {
    0% { opacity: 1; }
    50% { opacity: 0.5; }
    100% { opacity: 1; }
  }

  &.dragging {
    opacity: 0.5;
  }

  &.disc-break {
    border-top: 3px solid ${theme.colors.accent.primary};
  }

  .drag-handle {
    cursor: grab;
    color: ${theme.colors.text.disabled};

    &:active {
      cursor: grabbing;
    }
  }

  .track-number {
    font-weight: 600;
    color: #909090;  /* Track numbers improved contrast */
    font-family: 'Monaco', 'Consolas', monospace;
    font-size: ${theme.typography.fontSize.sm};
    text-align: center;
  }

  .track-title {
    font-weight: 500;
    font-size: ${theme.typography.fontSize.sm};
    word-wrap: break-word;
    overflow-wrap: break-word;
    white-space: normal;
    line-height: 1.4;
    padding-right: ${theme.spacing.sm};

    input {
      width: 100%;
      padding: ${theme.spacing.xs};
      background: transparent;
      border: 1px solid transparent;
      border-radius: ${theme.borderRadius.sm};
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
  }

  .track-duration {
    font-family: 'Monaco', 'Consolas', monospace;
    color: ${theme.colors.text.secondary};
    font-size: ${theme.typography.fontSize.sm};
    text-align: center;
  }

  .segue-toggle {
    width: 28px;
    height: 16px;
    background: ${theme.colors.background.elevated};
    border: 1px solid ${theme.colors.border};
    border-radius: 8px;
    position: relative;
    cursor: pointer;
    transition: all ${theme.transitions.fast};
    margin: 0 auto;

    &.active {
      background: ${theme.colors.accent.primary};
      border-color: ${theme.colors.accent.primary};

      &::after {
        transform: translateX(10px);
      }
    }

    &::after {
      content: '';
      position: absolute;
      top: 1px;
      left: 1px;
      width: 12px;
      height: 12px;
      background: white;
      border-radius: 50%;
      transition: transform ${theme.transitions.fast};
    }
  }

  .track-comment {
    font-size: ${theme.typography.fontSize.sm};
    color: ${theme.colors.text.secondary};

    input {
      width: 100%;
      padding: ${theme.spacing.xs};
      background: transparent;
      border: 1px solid transparent;
      border-radius: ${theme.borderRadius.sm};
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
  }

`;

const TracksTableHeader = styled.div`
  display: grid;
  grid-template-columns: ${props => props.editMode
    ? '32px 50px minmax(300px, 3fr) 100px 70px 40px minmax(150px, 1fr)'
    : '50px minmax(300px, 3fr) 100px 70px minmax(150px, 1fr)'};
  align-items: center;
  padding: ${theme.spacing.sm} ${theme.spacing.md};
  gap: ${theme.spacing.sm};
  background: ${theme.colors.background.elevated};
  border-bottom: 2px solid ${theme.colors.border};
  font-size: ${theme.typography.fontSize.xs};
  font-weight: 600;
  color: #B0B0B0;  /* Table headers improved contrast */
  position: sticky;
  top: 0;
  z-index: 1;

  .center {
    text-align: center;
  }
`;

const VerificationBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: ${theme.spacing.xs};
  padding: 4px 12px;
  border-radius: 4px;
  font-size: ${theme.typography.fontSize.sm};
  font-weight: 600;

  &.verified {
    background: rgba(76, 175, 80, 0.15);
    color: ${theme.colors.status.success};
    border: 1px solid rgba(76, 175, 80, 0.3);
  }

  &.needs-review {
    background: rgba(243, 156, 18, 0.15);
    color: ${theme.colors.status.warning};
    border: 1px solid rgba(243, 156, 18, 0.3);
  }

  &.unverified {
    background: rgba(112, 112, 112, 0.15);
    color: ${theme.colors.text.secondary};
    border: 1px solid rgba(112, 112, 112, 0.3);
  }

  svg {
    width: 16px;
    height: 16px;
  }
`;

const VerificationModal = styled.div`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: ${theme.colors.background.surface};
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.borderRadius.lg};
  padding: ${theme.spacing.xl};
  width: 400px;
  z-index: 1000;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);

  h3 {
    margin-top: 0;
    margin-bottom: ${theme.spacing.md};
  }

  textarea {
    width: 100%;
    min-height: 100px;
    padding: ${theme.spacing.sm};
    background: ${theme.colors.background.main};
    border: 1px solid ${theme.colors.border};
    border-radius: ${theme.borderRadius.md};
    color: ${theme.colors.text.primary};
    font-size: ${theme.typography.fontSize.md};
    resize: vertical;

    &:focus {
      outline: none;
      border-color: ${theme.colors.accent.primary};
    }
  }

  .modal-actions {
    display: flex;
    gap: ${theme.spacing.sm};
    justify-content: flex-end;
    margin-top: ${theme.spacing.lg};

    button {
      padding: ${theme.spacing.sm} ${theme.spacing.md};
    }
  }
`;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 999;
`;

function AlbumView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { shows, fetchShows, playTrack, setPlaylist, player } = useStore();
  const currentTrack = player?.currentTrack;

  const [editMode, setEditMode] = React.useState(false);
  const [showMusicBrainz, setShowMusicBrainz] = React.useState(false);
  const [album, setAlbum] = React.useState(null);
  const [tracks, setTracks] = React.useState([]);
  const [albumType, setAlbumType] = React.useState('album');
  const [performanceDateRange, setPerformanceDateRange] = React.useState(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const [draggedTrack, setDraggedTrack] = React.useState(null);
  const [verificationStatus, setVerificationStatus] = React.useState(null);
  const [showVerificationModal, setShowVerificationModal] = React.useState(false);
  const [verificationNotes, setVerificationNotes] = React.useState('');
  const [showMetadataEditor, setShowMetadataEditor] = React.useState(false);

  React.useEffect(() => {
    fetchShows();
    loadAlbum();
    loadVerificationStatus();
  }, [id]);

  const loadAlbum = async () => {
    try {
      // Load show/album data
      const showData = await window.api.getShow(parseInt(id));
      console.log('CRITICAL: Loaded show data from database:', {
        id: showData.id,
        release_status: showData.release_status,
        source_type: showData.source_type,
        notes: showData.notes
      });

      // Fix incorrectly parsed venue name
      if (showData.venue_name === '25,' || showData.venue_name === '25') {
        console.log('Fixing incorrectly parsed venue name:', showData.venue_name);
        showData.venue_name = 'Unknown Venue'; // Will be fixed by MusicBrainz lookup
      }

      // Use recordings data as fallback only if not already set
      if (showData.recordings && showData.recordings.length > 0) {
        const firstRecording = showData.recordings[0];
        // Only set source_type if not already present
        if (!showData.source_type) {
          console.log('Setting source_type from recording:', firstRecording.source_type);
          showData.source_type = firstRecording.source_type;
        }
        // Only set release_status if not already present
        if (!showData.release_status) {
          console.log('WARNING: release_status was null, setting from recording:', firstRecording.release_status);
          showData.release_status = firstRecording.release_status;
        } else {
          console.log('release_status already set to:', showData.release_status, '- NOT overwriting with recording value:', firstRecording.release_status);
        }
      }

      setAlbum(showData);

      // Load tracks
      const tracksData = await window.api.getTracksByShow(parseInt(id));
      setTracks(tracksData);

      // Detect album type
      detectAlbumType(showData, tracksData);
    } catch (error) {
      console.error('Error loading album:', error);
    }
  };

  const loadVerificationStatus = async () => {
    try {
      const status = await window.api.getShowVerificationStatus(parseInt(id));
      console.log('Loaded verification status:', JSON.stringify(status, null, 2));
      setVerificationStatus(status);
      if (status?.review_notes) {
        setVerificationNotes(status.review_notes);
      }
    } catch (error) {
      console.error('Error loading verification status:', error);
    }
  };

  const handleMarkAsVerified = async () => {
    try {
      await window.api.markShowAsVerified(parseInt(id), verificationNotes || null);
      await loadVerificationStatus();
      setShowVerificationModal(false);
      setVerificationNotes('');
    } catch (error) {
      console.error('Error marking as verified:', error);
    }
  };

  const handleMarkForReview = async () => {
    try {
      const notes = prompt('Add notes for review (required):', verificationNotes);
      if (!notes) return;

      await window.api.markShowForReview(parseInt(id), notes);
      await loadVerificationStatus();
    } catch (error) {
      console.error('Error marking for review:', error);
    }
  };

  const handleClearVerification = async () => {
    try {
      if (confirm('Clear verification status for this album?')) {
        await window.api.clearShowVerification(parseInt(id));
        await loadVerificationStatus();
        setVerificationNotes('');
      }
    } catch (error) {
      console.error('Error clearing verification:', error);
    }
  };

  const detectAlbumType = (albumData, tracksData) => {
    // If has venue, it's likely a concert
    if (albumData.venue_name && albumData.venue_name !== 'Unknown Venue') {
      setAlbumType('live');
      return;
    }

    // Check if tracks have different dates (compilation)
    const dates = new Set(tracksData.map(t => t.recording_date || t.performance_date || t.date).filter(Boolean));

    // Check if this is a box set based on the title
    const isBoxSet = albumData.notes?.includes("Listen to the River") ||
                     albumData.notes?.includes("Box Set") ||
                     albumData.notes?.includes("'71 '72 '73");

    if (dates.size > 1 || isBoxSet) {
      setAlbumType('compilation');
      // Store the performance date range for display
      const sortedDates = Array.from(dates).sort();

      // If box set but only one track loaded so far, extract year from title
      if (isBoxSet && dates.size <= 1) {
        // Extract years from title like "St. Louis '71 '72 '73"
        const yearMatches = albumData.notes?.match(/[''](\d{2})/g);
        if (yearMatches) {
          const years = yearMatches.map(m => {
            const year = m.replace(/['']/, '');
            return parseInt(year) > 50 ? `19${year}` : `20${year}`;
          });
          setPerformanceDateRange({
            earliest: `${Math.min(...years.map(y => parseInt(y)))}-01-01`,
            latest: `${Math.max(...years.map(y => parseInt(y)))}-12-31`,
            dates: years.map(y => `${y}-01-01`)
          });
        } else if (dates.size === 1) {
          const performanceDate = dates.values().next().value;
          if (performanceDate && performanceDate !== '1970-01-01' && performanceDate !== albumData.date) {
            setPerformanceDateRange({ single: performanceDate });
          }
        }
      } else if (dates.size > 1) {
        setPerformanceDateRange({
          earliest: sortedDates[0],
          latest: sortedDates[sortedDates.length - 1],
          dates: sortedDates
        });
      }
      return;
    }

    // Check for official release markers
    if (albumData.notes?.includes('Anniversary') ||
        albumData.notes?.includes('Picks') ||
        albumData.release_status === 'OFFICIAL') {
      setAlbumType('official');

      // For official releases with a single performance date, use that instead of release date
      if (dates.size === 1) {
        const performanceDate = dates.values().next().value;
        if (performanceDate && performanceDate !== '1970-01-01' && performanceDate !== albumData.date) {
          setPerformanceDateRange({ single: performanceDate });
        }
      }
      return;
    }

    // Default to studio album
    setAlbumType('album');
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

  const formatTrackTitle = (track) => {
    let title = track.song_name || track.song_title || track.title || 'Unknown Track';

    // Apply normalization if not already normalized
    if (!track.normalized) {
      title = normalizeSongTitle(title);
    }

    // Add full performance date if available (not for 1970 which is a fallback)
    if (track.performance_date && track.performance_date !== '1970-01-01') {
      title += ` [${track.performance_date}]`;
    } else if (track.recording_date && track.recording_date !== '1970-01-01') {
      title += ` [${track.recording_date}]`;
    }

    // Add segue marker if track flows into next
    if (track.has_segue || track.segue_type === '>') {
      title += ' >';
    }

    return title;
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSave = async () => {
    try {
      // Save album metadata
      await window.api.bulkUpdateShows([{
        showId: album.id,
        updates: {
          date: album.date,
          notes: album.notes,
          artwork: album.artwork_url || album.artwork, // Use artwork_url if available
          releaseVersion: album.releaseVersion,
          originalReleaseDate: album.originalReleaseDate,
          label: album.label,
          catalogNumber: album.catalogNumber,
          isLive: album.isLive,
          discCount: album.discCount,
          musicbrainz_release_id: album.musicbrainz_release_id,
          release_type: album.release_type,
          release_status: album.release_status,  // Save to main show record
          source_type: album.source_type,         // Save to main show record
          venue: {
            name: album.venue_name,
            city: album.city,
            state: album.state
          }
        }
      }]);

      // Save track updates
      for (const track of tracks) {
        await window.api.updateTrack(track.id, {
          track_number: track.track_number,
          song_name: track.song_name || track.song_title,
          performance_date: track.recording_date || track.performance_date || track.date,
          has_segue: track.has_segue,
          comment: track.comment
        });
      }

      setEditMode(false);
      // Reload data to refresh the UI with saved changes
      await loadAlbum();
    } catch (error) {
      console.error('Error saving changes:', error);
      alert('Error saving changes. Please try again.');
    }
  };

  const handleCancel = () => {
    setEditMode(false);
    loadAlbum(); // Reload original data
  };

  const handleTrackChange = (trackId, field, value) => {
    setTracks(tracks.map(track =>
      track.id === trackId
        ? { ...track, [field]: value }
        : track
    ));
  };

  const handleDragStart = (e, track, index) => {
    setIsDragging(true);
    setDraggedTrack({ track, index });
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (!draggedTrack || draggedTrack.index === index) return;

    const newTracks = [...tracks];
    const [removed] = newTracks.splice(draggedTrack.index, 1);
    newTracks.splice(index, 0, removed);

    // Update track numbers
    newTracks.forEach((track, i) => {
      track.track_number = i + 1;
    });

    setTracks(newTracks);
    setDraggedTrack({ ...draggedTrack, index });
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    setDraggedTrack(null);
  };

  const handleMusicBrainzApply = async (mbData) => {
    console.log('=== HANDLE MUSICBRAINZ APPLY ===');
    console.log('Raw mbData received:', mbData);
    console.log('mbData.status:', mbData.status);
    console.log('mbData.isOfficialRelease:', mbData.isOfficialRelease);
    console.log('Applying MusicBrainz data:', mbData);

    // Check if this is an official release that needs merging
    if (mbData.isOfficialRelease && mbData.shouldMerge) {
      console.log('Multi-disc official release detected');

      // Show confirmation dialog
      const confirmMerge = window.confirm(
        `This appears to be a multi-disc official release "${mbData.album}".\n\n` +
        `Current structure: Separate folders by date\n` +
        `New structure: Single album folder with disc numbers\n\n` +
        `The tracks will be updated with proper disc and track numbers.\n\n` +
        `Continue?`
      );

      if (!confirmMerge) {
        setShowMusicBrainz(false);
        return;
      }
    }

    // Create updated album data
    console.log('MusicBrainz data received:', {
      isOfficialRelease: mbData.isOfficialRelease,
      album: mbData.album,
      artist: mbData.artist,
      releaseType: mbData.releaseType
    });

    const updatedAlbum = {
      ...album,
      band_name: mbData.artist || album.band_name,
      notes: mbData.album || album.notes,
      date: mbData.date || album.date,
      originalReleaseDate: mbData.originalReleaseDate,
      releaseVersion: mbData.releaseVersion,
      label: mbData.label,
      venue_name: mbData.venue || album.venue_name,
      city: mbData.concertInfo?.city || album.city,
      state: mbData.concertInfo?.state || album.state,
      catalogNumber: mbData.catalogNumber,
      isLive: mbData.isLive,
      isOfficial: mbData.isOfficialRelease,
      releaseType: mbData.releaseType,
      artwork_url: mbData.coverArtUrl || album.artwork_url, // Apply cover art URL
      discCount: mbData.discCount,
      artwork: mbData.coverArt?.medium || mbData.coverArt?.small || album.artwork,
      musicbrainz_release_id: mbData.releaseId || mbData.musicbrainz_release_id || mbData.mbid || album.musicbrainz_release_id,
      // Intelligently determine release_status using available data
      release_status: (() => {
        // The MusicBrainz 'status' field is the most reliable, if it exists
        if (mbData.status) {
          return mbData.status;
        }
        // If no status, but the release type is "bootleg", we can be certain
        if (mbData.releaseType && mbData.releaseType.toLowerCase() === 'bootleg') {
          return 'Bootleg';
        }
        // Fallback using the boolean flag
        return mbData.isOfficialRelease ? 'Official' : 'Bootleg';
      })()
    };

    console.log('MusicBrainz data received:', {
      status: mbData.status,
      isOfficialRelease: mbData.isOfficialRelease,
      releaseType: mbData.releaseType,
      determinedStatus: updatedAlbum.release_status,
      fullMbData: mbData
    });
    console.log('Final release_status determined:', updatedAlbum.release_status);

    // Update tracks if provided with enhanced metadata
    let updatedTracks = tracks;
    if (mbData.tracks) {
      updatedTracks = tracks.map((track, index) => {
        const mbTrack = mbData.tracks[index];
        if (mbTrack) {
          // For multi-disc releases, use disc-based numbering (101, 102, 201, 202, etc.)
          const trackNumber = mbTrack.discNumber && mbData.discCount > 1 ?
            (mbTrack.discNumber * 100 + mbTrack.discTrackNumber) :
            (mbTrack.discTrackNumber || mbTrack.position || track.track_number);

          // Normalize the title from MusicBrainz according to our conventions
          const normalizedTitle = normalizeSongTitle(mbTrack.title || track.song_name);

          return {
            ...track,
            song_name: normalizedTitle,
            song_title: normalizedTitle, // Update both fields with normalized version
            duration: mbTrack.duration || track.duration,
            track_number: trackNumber,
            disc_number: mbTrack.discNumber || track.disc_number,
            has_segue: mbTrack.hasSegue || track.has_segue,
            recording_date: mbTrack.recordingDate || track.recording_date,
            mb_recording_id: mbTrack.recordingId || track.mb_recording_id,
            mb_release_id: mbTrack.releaseId || track.mb_release_id,
            normalized: true // Mark as normalized
          };
        }
        return track;
      });
    }

    // Apply updates to UI state
    setAlbum(updatedAlbum);
    setTracks(updatedTracks);

    // Save to database immediately
    try {
      console.log('Saving MusicBrainz data to database...');

      // Save album metadata
      await window.api.bulkUpdateShows([{
        showId: album.id,
        updates: {
          date: updatedAlbum.date,
          notes: updatedAlbum.notes,
          artwork: updatedAlbum.artwork_url || updatedAlbum.artwork,
          releaseVersion: updatedAlbum.releaseVersion,
          originalReleaseDate: updatedAlbum.originalReleaseDate,
          label: updatedAlbum.label,
          catalogNumber: updatedAlbum.catalogNumber,
          isLive: updatedAlbum.isLive,
          discCount: updatedAlbum.discCount,
          musicbrainz_release_id: updatedAlbum.musicbrainz_release_id,
          release_status: updatedAlbum.release_status,  // Save to main show record
          venue: {
            name: updatedAlbum.venue_name,
            city: updatedAlbum.city,
            state: updatedAlbum.state
          }
        }
      }]);

      // Save track updates
      for (const track of updatedTracks) {
        await window.api.updateTrack(track.id, {
          track_number: track.track_number,
          song_name: track.song_name || track.song_title,
          performance_date: track.recording_date || track.performance_date || track.date,
          has_segue: track.has_segue,
          comment: track.comment,
          mb_recording_id: track.mb_recording_id,
          mb_release_id: track.mb_release_id
        });
      }

      console.log('✅ MusicBrainz data saved successfully');
      console.log('CRITICAL: About to reload album from database...');

      // Reload album to refresh UI with saved data
      await loadAlbum();

      console.log('CRITICAL: Album reloaded from database. release_status is now:', album.release_status);
    } catch (error) {
      console.error('Error saving MusicBrainz data:', error);
      alert('Failed to save MusicBrainz data. Please try saving manually.');
    }

    setShowMusicBrainz(false);
  };

  const getTotalDuration = () => {
    const totalSeconds = tracks.reduce((sum, track) => sum + (track.duration || 0), 0);
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getAlbumTypeLabel = () => {
    const source = album?.source_type?.toUpperCase();

    if (source === 'SBD' || source === 'SOUNDBOARD') return 'SOUNDBOARD';
    if (source === 'AUD') return 'AUDIENCE';
    if (source === 'MATRIX') return 'MATRIX';
    if (source === 'FM' || source === 'FM BROADCAST') return 'FM BROADCAST';
    if (source === 'PRE-FM') return 'PRE-FM';
    if (source === 'STUDIO') return 'STUDIO';

    // If it's an official release and no source type specified, show OFFICIAL
    if (album?.release_status === 'OFFICIAL' && !source) return 'OFFICIAL';

    return 'UNKNOWN'; // A clear fallback
  };

  const getReleaseStatusInfo = () => {
    const status = album?.release_status;

    if (!status) {
      return null; // Don't show a badge if the status is unknown
    }

    // Use a simple, clear label. The "MusicBrainz:" prefix is no longer needed.
    let text = status;
    let className = status.toLowerCase(); // 'official', 'bootleg', etc.

    return { text, className };
  };

  const getAlbumTypeClass = () => {
    const label = getAlbumTypeLabel();
    if (label === 'OFFICIAL') return 'official';
    if (label === 'SOUNDBOARD') return 'soundboard';
    if (label === 'AUDIENCE') return 'audience';
    if (label === 'MATRIX') return 'matrix';
    if (label === 'FM BROADCAST' || label === 'PRE-FM') return 'broadcast';
    if (label === 'STUDIO') return 'studio';
    if (label === 'UNKNOWN') return 'unknown';
    return 'default';
  };

  const handleOpenMusicBrainz = () => {
    console.log('Opening MusicBrainz...', album);
    let url;

    // Check if we have a stored MusicBrainz Release ID at album level
    if (album?.musicbrainz_release_id) {
      url = `https://musicbrainz.org/release/${album.musicbrainz_release_id}`;
      console.log('Opening MusicBrainz release from album:', album.musicbrainz_release_id);
    } else {
      // Try to use the first track's release ID as fallback
      const firstTrackWithMbId = tracks.find(t => t.mb_release_id);
      if (firstTrackWithMbId?.mb_release_id) {
        url = `https://musicbrainz.org/release/${firstTrackWithMbId.mb_release_id}`;
        console.log('Opening MusicBrainz release from first track:', firstTrackWithMbId.mb_release_id);
      } else {
        // Fall back to search if no mbid is stored anywhere
        const artist = encodeURIComponent(album?.band_name || 'Grateful Dead');
        const albumTitle = encodeURIComponent(album?.notes || `${album?.date} ${album?.venue_name}` || '');
        url = `https://musicbrainz.org/search?query=${artist}+${albumTitle}&type=release`;
        console.log('Searching MusicBrainz for:', artist, albumTitle);
      }
    }

    console.log('MusicBrainz URL:', url);
    window.open(url, '_blank');
  };

  const handlePlayAlbum = async () => {
    if (tracks.length > 0) {
      // Ensure tracks have proper title field
      const tracksWithTitles = tracks.map(t => ({
        ...t,
        title: t.song_name || t.song_title || t.title || 'Unknown Track'
      }));
      // Set the playlist to all tracks
      setPlaylist(tracksWithTitles);
      // Play the first track
      await playTrack(tracksWithTitles[0]);
    }
  };

  const handlePlayTrack = async (track) => {
    // Ensure tracks have proper title field
    const tracksWithTitles = tracks.map(t => ({
      ...t,
      title: t.song_name || t.song_title || t.title || 'Unknown Track'
    }));
    // Set the playlist to all tracks starting from this one
    const trackIndex = tracksWithTitles.findIndex(t => t.id === track.id);
    const playlist = tracksWithTitles.slice(trackIndex);
    setPlaylist(playlist);
    // Play the selected track with title
    const trackWithTitle = {
      ...track,
      title: track.song_name || track.song_title || track.title || 'Unknown Track'
    };
    await playTrack(trackWithTitle);
  };

  if (!album) {
    return <PageContainer>Loading...</PageContainer>;
  }

  return (
    <PageContainer>
      <PageHeader>
        {/* Row 1: Title and Verification Badge */}
        <div className="header-row-1">
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <h1>
              {editMode ? (
                <input
                  type="text"
                  value={album.notes || ''}
                  onChange={(e) => setAlbum({ ...album, notes: e.target.value })}
                  placeholder="Album title..."
                  style={{
                    fontSize: 'inherit',
                    fontWeight: 'inherit',
                    background: 'transparent',
                    border: '1px solid #4a4a4a',
                    borderRadius: '4px',
                    padding: '4px 8px',
                    color: 'inherit',
                    width: '100%'
                  }}
                />
              ) : (
                (() => {
                  // For live concerts, show date - venue: album name
                  if (album.date && album.venue_name) {
                    const dateFormatted = album.date;
                    const venue = album.venue_name;
                    const city = album.city || '';
                    const state = album.state || '';
                    const location = [city, state].filter(Boolean).join(', ');
                    const venueDisplay = location ? `${venue}, ${location}` : venue;
                    const albumName = album.notes || '';

                    if (albumName && !albumName.includes(album.date)) {
                      // If we have an album name that doesn't already include the date
                      return `${dateFormatted} - ${venueDisplay}: ${albumName}`;
                    } else {
                      // Just show date and venue
                      return `${dateFormatted} - ${venueDisplay}`;
                    }
                  }
                  // Fallback to original logic
                  return album.notes || 'Untitled Album';
                })()
              )}
            </h1>
          </div>
          {/* Verification Status Badge */}
          {verificationStatus && (
            <VerificationBadge
              className={
                verificationStatus.verified ? 'verified' :
                (verificationStatus.needs_review && verificationStatus.needs_review !== 0) ? 'needs-review' :
                'unverified'
              }
            >
              {verificationStatus.verified ? (
                <>
                  <CheckCircle />
                  Verified
                </>
              ) : (verificationStatus.needs_review && verificationStatus.needs_review !== 0) ? (
                <>
                  <MessageSquare />
                  Needs Review
                </>
              ) : (
                <>
                  <Clock />
                  Unverified
                </>
              )}
            </VerificationBadge>
          )}
        </div>

        {/* Row 2: Artist Name and Action Buttons */}
        <div className="header-row-2">
          <div className="artist-name">
            <Music />
            {album.band_name || 'Grateful Dead'}
          </div>
          <AlbumActions>
            {editMode ? (
              <>
                <button className="secondary" onClick={() => setShowMusicBrainz(true)}>
                  <Search /> MusicBrainz
                </button>
                <button
                  className="secondary"
                  onClick={handleOpenMusicBrainz}
                  title="View on MusicBrainz"
                >
                  <ExternalLink /> Open
                </button>
                <button className="success" onClick={handleSave}>
                  <Save /> Save
                </button>
                <button className="cancel" onClick={handleCancel}>
                  <X /> Cancel
                </button>
              </>
            ) : (
              <>
                {verificationStatus && !verificationStatus.verified && (
                  <button className="success" onClick={() => setShowVerificationModal(true)}>
                    <CheckCircle /> Verify
                  </button>
                )}
                {verificationStatus && !!verificationStatus.verified && (
                  <button className="secondary" onClick={handleClearVerification}>
                    <X /> Clear
                  </button>
                )}
                {verificationStatus && !verificationStatus.verified && !verificationStatus.needs_review && (
                  <button className="secondary" onClick={handleMarkForReview}>
                    <MessageSquare /> Review
                  </button>
                )}
                <button className="secondary" onClick={() => setShowMetadataEditor(true)}>
                  <Edit /> Edit Metadata
                </button>
                <button className="secondary" onClick={() => setShowMusicBrainz(true)}>
                  <Search /> MusicBrainz
                </button>
                <button
                  className="secondary"
                  onClick={handleOpenMusicBrainz}
                  title="View on MusicBrainz"
                >
                  <ExternalLink /> Open
                </button>
                <button className="primary" onClick={handlePlayAlbum}>
                  <Play /> Play
                </button>
              </>
            )}
          </AlbumActions>
        </div>
      </PageHeader>

      <PageContent>
        <AlbumSidebar>
          <AlbumArtwork>
          {(album.artwork_url || album.artwork) ? (
            <img src={album.artwork_url || album.artwork} alt={album.notes || 'Album artwork'} />
          ) : (
            <Disc />
          )}
        </AlbumArtwork>

        <AlbumInfo>
          {/* Display the Release Status */}
          {getReleaseStatusInfo() && (
            <ReleaseStatusIndicator className={getReleaseStatusInfo().className}>
              {getReleaseStatusInfo().text}
            </ReleaseStatusIndicator>
          )}

          {/* Source Type Badge (Soundboard, Audience, etc.) */}
          <AlbumType className={getAlbumTypeClass()}>
            {getAlbumTypeLabel()}
          </AlbumType>

          <AlbumMeta>
            <MetaField>
              <label>{performanceDateRange ? 'Performance Date' : 'Release Date'}</label>
              <div className="value">
                <Calendar />
                {editMode ? (
                  <input
                    type="text"
                    value={album.date || ''}
                    onChange={(e) => setAlbum({ ...album, date: e.target.value })}
                    placeholder="yyyy-mm-dd"
                  />
                ) : (
                  (() => {
                    // If we have performance dates, display those instead of release date
                    if (performanceDateRange) {
                      if (performanceDateRange.single) {
                        return performanceDateRange.single;
                      } else if (performanceDateRange.earliest && performanceDateRange.latest) {
                        // Format as year range if spanning multiple years
                        const startYear = performanceDateRange.earliest.substring(0, 4);
                        const endYear = performanceDateRange.latest.substring(0, 4);
                        if (startYear === endYear) {
                          return startYear;
                        } else {
                          return `${startYear}-${endYear}`;
                        }
                      }
                    }
                    return album.date || 'Unknown';
                  })()
                )}
              </div>
            </MetaField>

            {/* Show box set release date if we're showing performance dates instead */}
            {performanceDateRange && album.date && (
              <MetaField>
                <label>Box Set Release</label>
                <div className="value">
                  <Calendar />
                  {album.date}
                </div>
              </MetaField>
            )}

            {album.originalReleaseDate && album.originalReleaseDate !== album.date && (
              <MetaField>
                <label>Original Release</label>
                <div className="value">
                  <Calendar />
                  {album.originalReleaseDate}
                </div>
              </MetaField>
            )}

            {(albumType === 'live' || album.venue_name) && (
              <MetaField>
                <label>Venue</label>
                <div className="value">
                  <MapPin />
                  {editMode ? (
                    <input
                      type="text"
                      value={album.venue_name || ''}
                      onChange={(e) => setAlbum({ ...album, venue_name: e.target.value })}
                      placeholder="Venue name..."
                    />
                  ) : (
                    album.venue_name || 'Unknown Venue'
                  )}
                </div>
              </MetaField>
            )}

            {(album.city || album.state) && (
              <MetaField>
                <label>Location</label>
                <div className="value">
                  <MapPin />
                  {editMode ? (
                    <input
                      type="text"
                      value={`${album.city || ''}, ${album.state || ''}`}
                      onChange={(e) => {
                        const [city, state] = e.target.value.split(',').map(s => s.trim());
                        setAlbum({ ...album, city, state });
                      }}
                      placeholder="City, State"
                    />
                  ) : (
                    `${album.city || ''}, ${album.state || ''}`
                  )}
                </div>
              </MetaField>
            )}

            <MetaField>
              <label>Tracks</label>
              <div className="value">
                <Music />
                {tracks.length} tracks • {getTotalDuration()}
              </div>
            </MetaField>

            {album.source_type && (
              <MetaField>
                <label>Source</label>
                <div className="value">
                  {editMode ? (
                    <select
                      value={album.source_type}
                      onChange={(e) => setAlbum({ ...album, source_type: e.target.value })}
                    >
                      <option value="SBD">Soundboard</option>
                      <option value="AUD">Audience</option>
                      <option value="MATRIX">Matrix</option>
                      <option value="FM">FM Broadcast</option>
                    </select>
                  ) : (
                    album.source_type
                  )}
                </div>
              </MetaField>
            )}

            {(album.release_status || editMode) && (
              <MetaField>
                <label>Release Status</label>
                <div className="value">
                  {editMode ? (
                    <select
                      value={album.release_status || 'BOOTLEG'}
                      onChange={(e) => setAlbum({ ...album, release_status: e.target.value })}
                    >
                      <option value="OFFICIAL">Official</option>
                      <option value="BOOTLEG">Bootleg</option>
                      <option value="PROMOTION">Promotion</option>
                      <option value="PSEUDO">Pseudo-Release</option>
                    </select>
                  ) : (
                    album.release_status || 'BOOTLEG'
                  )}
                </div>
              </MetaField>
            )}
          </AlbumMeta>
        </AlbumInfo>
        </AlbumSidebar>

        <TracksSection>
        <TracksHeader>
          <h2>Track List</h2>
          <div className="track-count">
            {tracks.length} tracks • {getTotalDuration()} total
          </div>
        </TracksHeader>

        <TracksTable>
          <TracksTableHeader editMode={editMode}>
            {editMode && <div></div>}
            <div className="center">#</div>
            <div>Title</div>
            <div className="center">Date</div>
            <div className="center">Duration</div>
            {editMode && <div className="center">Segue</div>}
            <div>Comment</div>
          </TracksTableHeader>

          {tracks.map((track, index) => {
            const isDiscBreak = index > 0 &&
              Math.floor(track.track_number / 100) !== Math.floor(tracks[index - 1].track_number / 100);

            return (
              <Track
                key={track.id}
                className={`
                  ${isDiscBreak ? 'disc-break' : ''}
                  ${draggedTrack?.track.id === track.id ? 'dragging' : ''}
                  ${currentTrack?.id === track.id ? 'playing' : ''}
                `}
                editMode={editMode}
                draggable={editMode}
                onDragStart={(e) => handleDragStart(e, track, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                onDoubleClick={() => !editMode && handlePlayTrack(track)}
                style={{ cursor: editMode ? 'move' : 'pointer' }}
              >
                {editMode && (
                  <div className="drag-handle">
                    <GripVertical />
                  </div>
                )}

                <div className="track-number">
                  {track.track_number || index + 1}
                </div>

                <div className="track-title">
                  {editMode ? (
                    <input
                      type="text"
                      value={track.song_name || track.song_title || track.title || ''}
                      onChange={(e) => handleTrackChange(track.id, 'song_name', e.target.value)}
                      placeholder="Track title..."
                    />
                  ) : (
                    formatTrackTitle(track)
                  )}
                </div>

                <div className="track-date" style={{
                  textAlign: 'center',
                  fontSize: theme.typography.fontSize.xs,
                  color: theme.colors.text.secondary
                }}>
                  {editMode ? (
                    <input
                      type="text"
                      value={track.recording_date || track.performance_date || track.date || ''}
                      onChange={(e) => handleTrackChange(track.id, 'recording_date', e.target.value)}
                      placeholder="yyyy-mm-dd"
                      style={{
                        width: '100%',
                        padding: theme.spacing.xs,
                        background: 'transparent',
                        border: '1px solid transparent',
                        borderRadius: theme.borderRadius.sm,
                        fontSize: theme.typography.fontSize.xs,
                        textAlign: 'center'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.background = theme.colors.background.elevated;
                        e.target.style.borderColor = theme.colors.border;
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.background = 'transparent';
                        e.target.style.borderColor = 'transparent';
                      }}
                      onFocus={(e) => {
                        e.target.style.outline = 'none';
                        e.target.style.background = theme.colors.background.elevated;
                        e.target.style.borderColor = theme.colors.accent.primary;
                      }}
                      onBlur={(e) => {
                        e.target.style.background = 'transparent';
                        e.target.style.borderColor = 'transparent';
                      }}
                    />
                  ) : (
                    track.recording_date || track.performance_date || track.date || '-'
                  )}
                </div>

                <div className="track-duration">
                  {formatDuration(track.duration)}
                </div>

                {editMode && (
                  <div
                    className={`segue-toggle ${track.has_segue ? 'active' : ''}`}
                    onClick={() => handleTrackChange(track.id, 'has_segue', !track.has_segue)}
                  />
                )}

                <div className="track-comment">
                  {editMode ? (
                    <input
                      type="text"
                      value={track.comment || ''}
                      onChange={(e) => handleTrackChange(track.id, 'comment', e.target.value)}
                      placeholder="Add comment..."
                    />
                  ) : (
                    track.comment
                  )}
                </div>

              </Track>
            );
          })}
        </TracksTable>
      </TracksSection>
      </PageContent>

      {showMusicBrainz && (
        <MusicBrainzFingerprint
          skipAutoProcess={verificationStatus?.verified || false}
          initialData={{
            artist: album.band_name || 'Grateful Dead',
            album: album.notes || '',
            date: album.date,
            trackCount: tracks.length,
            tracks: tracks.map(track => ({
              title: track.song_title || track.title || track.file_path?.split(/[\\\/]/).pop()?.replace(/\.[^.]+$/, '') || `Track ${track.track_number}`,
              path: track.file_path,
              duration: track.duration,
              trackNumber: track.track_number,
              // Pass all original data for debugging
              originalData: track
            }))
          }}
          isVerified={verificationStatus?.verified || false}
          onApply={handleMusicBrainzApply}
          onClose={() => setShowMusicBrainz(false)}
        />
      )}

      {showVerificationModal && (
        <>
          <ModalOverlay onClick={() => setShowVerificationModal(false)} />
          <VerificationModal>
            <h3>Mark Album as Verified</h3>
            <p>
              Marking this album as verified indicates that all metadata has been reviewed
              and confirmed. The app will no longer automatically process this album.
            </p>
            <textarea
              placeholder="Optional: Add notes about this verification..."
              value={verificationNotes}
              onChange={(e) => setVerificationNotes(e.target.value)}
            />
            <div className="modal-actions">
              <button className="secondary" onClick={() => setShowVerificationModal(false)}>
                Cancel
              </button>
              <button className="success" onClick={handleMarkAsVerified}>
                <CheckCircle /> Verify
              </button>
            </div>
          </VerificationModal>
        </>
      )}

      {showMetadataEditor && album && (
        <MetadataEditor
          albumData={album}
          tracks={tracks}
          onSave={async (updates) => {
            try {
              // Save album metadata
              if (updates.album) {
                await window.api.bulkUpdateShows([updates.album]);
              }

              // Save track metadata
              if (updates.tracks && updates.tracks.length > 0) {
                await window.api.bulkUpdateTracks(updates.tracks);
              }

              // Reload the album data
              await loadAlbum();
              setShowMetadataEditor(false);
            } catch (error) {
              console.error('Error saving metadata:', error);
            }
          }}
          onClose={() => setShowMetadataEditor(false)}
        />
      )}
    </PageContainer>
  );
}

export default AlbumView;