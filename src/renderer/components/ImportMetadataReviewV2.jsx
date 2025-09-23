import React, { useState, useEffect } from 'react';
import styled from '@emotion/styled';
import {
  X, Save, AlertCircle, Folder, FolderOpen, Calendar, MapPin, Music,
  ChevronRight, ChevronDown, Info, CheckCircle, XCircle,
  AlertTriangle, Edit2, Copy, RefreshCw, Eye, List, Disc,
  Mic2, Radio, User
} from 'lucide-react';
import { theme } from '../styles/globalStyles';

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
  background: ${theme.colors.background.surface};
  border-radius: 12px;
  width: 95%;
  max-width: 1400px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const Header = styled.div`
  padding: ${theme.spacing.lg};
  border-bottom: 1px solid ${theme.colors.border};
  background: ${theme.colors.background.elevated};

  h2 {
    font-size: 20px;
    font-weight: 600;
    color: ${theme.colors.text.primary};
    display: flex;
    align-items: center;
    gap: ${theme.spacing.sm};
  }

  p {
    margin-top: ${theme.spacing.sm};
    color: ${theme.colors.text.secondary};
    font-size: 14px;
  }
`;

const BulkActionsBar = styled.div`
  padding: ${theme.spacing.md} ${theme.spacing.lg};
  background: ${theme.colors.background.elevated};
  border-bottom: 1px solid ${theme.colors.border};
  display: flex;
  justify-content: space-between;
  align-items: center;

  .actions-left {
    display: flex;
    gap: ${theme.spacing.sm};
  }

  .actions-right {
    display: flex;
    gap: ${theme.spacing.sm};
  }

  button {
    padding: ${theme.spacing.xs} ${theme.spacing.md};
    border-radius: 6px;
    font-size: 13px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: ${theme.spacing.xs};
    transition: all 0.2s;
    border: 1px solid ${theme.colors.border};
    background: ${theme.colors.background.surface};
    color: ${theme.colors.text.secondary};

    &:hover:not(:disabled) {
      background: ${theme.colors.background.elevated};
      color: ${theme.colors.text.primary};
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    &.primary {
      background: ${theme.colors.accent.primary};
      color: white;
      border-color: ${theme.colors.accent.primary};

      &:hover:not(:disabled) {
        background: ${theme.colors.accent.primaryHover};
      }
    }

    svg {
      width: 14px;
      height: 14px;

      &.spinning {
        animation: spin 1s linear infinite;
      }
    }
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  .stats {
    color: ${theme.colors.text.secondary};
    font-size: 13px;
    display: flex;
    align-items: center;
    gap: ${theme.spacing.md};

    .stat {
      display: flex;
      align-items: center;
      gap: ${theme.spacing.xs};

      &.match { color: ${theme.colors.status.success}; }
      &.differ { color: ${theme.colors.status.warning}; }
      &.missing { color: ${theme.colors.status.error}; }
    }
  }
`;

const Content = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: ${theme.spacing.lg};
`;

const Section = styled.div`
  margin-bottom: ${theme.spacing.lg};
  background: ${theme.colors.background.elevated};
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid ${theme.colors.border};
`;

const SectionHeader = styled.div`
  padding: ${theme.spacing.md} ${theme.spacing.lg};
  background: ${theme.colors.background.surface};
  border-bottom: 1px solid ${theme.colors.border};
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  user-select: none;

  &:hover {
    background: ${theme.colors.background.elevated};
  }

  .title {
    display: flex;
    align-items: center;
    gap: ${theme.spacing.sm};
    font-size: 14px;
    font-weight: 600;
    color: ${theme.colors.text.primary};

    svg {
      width: 16px;
      height: 16px;
      transition: transform 0.2s;

      &.expanded {
        transform: rotate(90deg);
      }
    }

    .count {
      padding: 2px 6px;
      background: ${theme.colors.background.elevated};
      border-radius: 4px;
      font-size: 11px;
      font-weight: 500;
      color: ${theme.colors.text.secondary};
    }
  }

  .section-status {
    display: flex;
    gap: ${theme.spacing.xs};
    font-size: 12px;
    color: ${theme.colors.text.secondary};

    .indicator {
      display: flex;
      align-items: center;
      gap: 4px;

      svg {
        width: 12px;
        height: 12px;
      }

      &.success { color: ${theme.colors.status.success}; }
      &.warning { color: ${theme.colors.status.warning}; }
      &.error { color: ${theme.colors.status.error}; }
    }
  }
`;

const SectionContent = styled.div`
  padding: ${theme.spacing.md};
  display: ${props => props.collapsed ? 'none' : 'block'};
`;

const FieldComparison = styled.div`
  margin-bottom: ${theme.spacing.md};

  &:last-child {
    margin-bottom: 0;
  }
`;

const FieldHeader = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};
  margin-bottom: ${theme.spacing.xs};
  font-size: 12px;
  text-transform: uppercase;
  color: ${theme.colors.text.secondary};
  font-weight: 600;
  letter-spacing: 0.5px;

  svg {
    width: 14px;
    height: 14px;
  }

  .status-icon {
    margin-left: auto;

    &.match { color: ${theme.colors.status.success}; }
    &.differ { color: ${theme.colors.status.warning}; }
    &.missing { color: ${theme.colors.status.error}; }
  }
`;

const ComparisonRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr auto;
  gap: ${theme.spacing.sm};
  align-items: stretch;
`;

const ValueBox = styled.div`
  background: ${theme.colors.background.surface};
  border: 1px solid ${theme.colors.border};
  border-radius: 6px;
  padding: ${theme.spacing.sm} ${theme.spacing.md};
  font-size: 14px;
  color: ${theme.colors.text.primary};
  position: relative;
  min-height: 38px;
  display: flex;
  align-items: center;

  &.current {
    border-left: 3px solid ${theme.colors.text.secondary};
  }

  &.musicbrainz {
    border-left: 3px solid ${theme.colors.status.info};
  }

  &.empty {
    color: ${theme.colors.text.dimmed};
    font-style: italic;
  }

  &.match {
    background: ${theme.colors.status.success}10;
  }

  &.differ {
    background: ${theme.colors.status.warning}10;
  }

  &.error {
    background: ${theme.colors.status.error}10;
  }

  &.selected {
    border-color: ${theme.colors.accent.primary};
    box-shadow: 0 0 0 1px ${theme.colors.accent.primary};
  }

  .label {
    position: absolute;
    top: -8px;
    left: 12px;
    background: ${theme.colors.background.surface};
    padding: 0 4px;
    font-size: 10px;
    text-transform: uppercase;
    color: ${theme.colors.text.dimmed};
    font-weight: 600;
  }

  input {
    background: transparent;
    border: none;
    color: ${theme.colors.text.primary};
    width: 100%;
    font-size: 14px;
    outline: none;
  }
`;

const ActionButtons = styled.div`
  display: flex;
  gap: ${theme.spacing.xs};
  align-items: center;

  button {
    padding: ${theme.spacing.xs};
    background: ${theme.colors.background.surface};
    border: 1px solid ${theme.colors.border};
    border-radius: 4px;
    cursor: pointer;
    color: ${theme.colors.text.secondary};
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;

    &:hover {
      background: ${theme.colors.background.elevated};
      color: ${theme.colors.text.primary};
      border-color: ${theme.colors.accent.primary};
    }

    &.active {
      background: ${theme.colors.accent.primary};
      color: white;
      border-color: ${theme.colors.accent.primary};
    }

    svg {
      width: 14px;
      height: 14px;
    }
  }
`;

const TracksSection = styled.div`
  background: ${theme.colors.background.surface};
  border: 1px solid ${theme.colors.border};
  border-radius: 8px;
  padding: ${theme.spacing.lg};
  margin-bottom: ${theme.spacing.lg};

  .tracks-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: ${theme.spacing.md};
    flex-wrap: wrap;
    gap: ${theme.spacing.sm};

    h4 {
      font-size: 14px;
      font-weight: 600;
      text-transform: uppercase;
      color: ${theme.colors.text.secondary};
      display: flex;
      align-items: center;
      gap: ${theme.spacing.sm};

      svg {
        width: 16px;
        height: 16px;
      }
    }

    .match-summary {
      display: flex;
      gap: ${theme.spacing.md};
      font-size: 13px;

      .stat {
        display: flex;
        align-items: center;
        gap: 4px;
        padding: 4px 8px;
        background: ${theme.colors.background.elevated};
        border-radius: 4px;

        &.matched {
          color: ${theme.colors.status.success};
        }
        &.unmatched {
          color: ${theme.colors.text.secondary};
        }

        svg {
          width: 14px;
          height: 14px;
        }
      }
    }
  }

  .track-list {
    display: flex;
    flex-direction: column;
    gap: ${theme.spacing.sm};
  }

  .track-match {
    background: ${theme.colors.background.elevated};
    border: 1px solid ${theme.colors.border};
    border-radius: 6px;
    padding: ${theme.spacing.md};
    transition: all 0.2s;

    &:hover {
      border-color: ${theme.colors.accent.primary};
    }

    &.has-match {
      border-left: 3px solid ${theme.colors.status.success};
    }

    &.no-match {
      border-left: 3px solid ${theme.colors.text.secondary};
      opacity: 0.8;
    }

    .track-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: ${theme.spacing.sm};

      .track-info {
        flex: 1;

        .track-number {
          font-size: 12px;
          color: ${theme.colors.text.secondary};
          margin-bottom: 2px;
        }

        .track-title {
          font-size: 14px;
          font-weight: 500;
          color: ${theme.colors.text.primary};
          margin-bottom: 4px;
        }

        .file-name {
          font-size: 12px;
          color: ${theme.colors.text.secondary};
          font-style: italic;
        }
      }

      .confidence {
        padding: 4px 8px;
        background: ${theme.colors.background.surface};
        border-radius: 4px;
        font-size: 12px;
        font-weight: 600;

        &.high {
          color: ${theme.colors.status.success};
        }
        &.medium {
          color: ${theme.colors.status.warning};
        }
        &.low {
          color: ${theme.colors.status.error};
        }
      }
    }

    .match-details {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: ${theme.spacing.md};
      padding-top: ${theme.spacing.sm};
      border-top: 1px solid ${theme.colors.border};

      .detail-item {
        font-size: 12px;

        .label {
          color: ${theme.colors.text.secondary};
          margin-bottom: 2px;
        }

        .value {
          color: ${theme.colors.text.primary};
          font-weight: 500;

          &.missing {
            color: ${theme.colors.text.secondary};
            font-style: italic;
          }
        }
      }
    }
  }

  .no-tracks {
    text-align: center;
    padding: ${theme.spacing.xl};
    color: ${theme.colors.text.secondary};
    font-style: italic;
  }
`;

const PreviewPanel = styled.div`
  background: ${theme.colors.background.surface};
  border: 1px solid ${theme.colors.border};
  border-radius: 8px;
  padding: ${theme.spacing.lg};
  margin-bottom: ${theme.spacing.lg};

  h3 {
    font-size: 14px;
    font-weight: 600;
    text-transform: uppercase;
    color: ${theme.colors.text.secondary};
    margin-bottom: ${theme.spacing.md};
    display: flex;
    align-items: center;
    gap: ${theme.spacing.sm};

    svg {
      width: 16px;
      height: 16px;
    }
  }

  .folder-structure {
    font-family: 'Courier New', monospace;
    font-size: 13px;
    color: ${theme.colors.text.primary};
    line-height: 1.6;

    .folder {
      display: flex;
      align-items: center;
      gap: ${theme.spacing.xs};
      padding: 2px 0;

      &.root {
        font-weight: 600;
        color: ${theme.colors.accent.primary};
      }

      &.indent-1 {
        padding-left: ${theme.spacing.lg};
      }

      &.indent-2 {
        padding-left: calc(${theme.spacing.lg} * 2);
      }

      svg {
        width: 14px;
        height: 14px;
      }
    }
  }
`;

const TabContainer = styled.div`
  display: flex;
  gap: ${theme.spacing.xs};
  padding: 0 ${theme.spacing.lg};
  border-bottom: 2px solid ${theme.colors.border};
  background: ${theme.colors.background.elevated};
`;

const Tab = styled.button`
  padding: ${theme.spacing.sm} ${theme.spacing.lg};
  background: transparent;
  border: none;
  border-bottom: 3px solid transparent;
  color: ${theme.colors.text.secondary};
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: ${theme.spacing.xs};

  svg {
    width: 16px;
    height: 16px;
  }

  &:hover {
    color: ${theme.colors.text.primary};
    background: ${theme.colors.background.surface};
  }

  &.active {
    color: ${theme.colors.accent.primary};
    border-bottom-color: ${theme.colors.accent.primary};
    background: ${theme.colors.background.surface};
  }
`;

const TabContent = styled.div`
  display: ${props => props.active ? 'block' : 'none'};
`;

const TrackTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;

  thead {
    background: ${theme.colors.background.elevated};
    border-bottom: 2px solid ${theme.colors.border};

    th {
      padding: ${theme.spacing.sm} ${theme.spacing.md};
      text-align: left;
      font-weight: 600;
      color: ${theme.colors.text.secondary};
      text-transform: uppercase;
      font-size: 12px;
    }
  }

  tbody tr {
    border-bottom: 1px solid ${theme.colors.border};
    transition: background 0.2s;

    &:hover {
      background: ${theme.colors.background.elevated};
    }

    td {
      padding: ${theme.spacing.sm} ${theme.spacing.md};
      vertical-align: middle;

      &.track-number {
        width: 50px;
        text-align: center;
        font-weight: 600;
        color: ${theme.colors.text.secondary};
      }

      &.comparison-cell {
        display: flex;
        gap: ${theme.spacing.sm};
        align-items: center;

        .current, .musicbrainz {
          flex: 1;
          padding: 6px 8px;
          border-radius: 4px;
          font-size: 12px;

          &.current {
            background: ${theme.colors.background.surface};
            border: 1px solid ${theme.colors.border};
          }

          &.musicbrainz {
            background: rgba(99, 102, 241, 0.1);
            border: 1px solid rgba(99, 102, 241, 0.3);
          }

          &.match {
            border-color: ${theme.colors.status.success};
          }

          &.differ {
            border-color: ${theme.colors.status.warning};
          }

          &.missing {
            opacity: 0.6;
            font-style: italic;
          }
        }

        .arrow {
          color: ${theme.colors.text.secondary};
        }
      }

      .action-buttons {
        display: flex;
        gap: 4px;

        button {
          padding: 4px 6px;
          background: ${theme.colors.background.surface};
          border: 1px solid ${theme.colors.border};
          border-radius: 3px;
          cursor: pointer;
          transition: all 0.2s;

          svg {
            width: 14px;
            height: 14px;
          }

          &:hover {
            background: ${theme.colors.accent.primary};
            color: white;
            border-color: ${theme.colors.accent.primary};
          }
        }
      }
    }
  }
`;

const Footer = styled.div`
  padding: ${theme.spacing.lg};
  border-top: 1px solid ${theme.colors.border};
  background: ${theme.colors.background.elevated};
  display: flex;
  justify-content: space-between;
  align-items: center;

  .summary {
    font-size: 14px;
    color: ${theme.colors.text.secondary};
  }

  .actions {
    display: flex;
    gap: ${theme.spacing.md};

    button {
      padding: ${theme.spacing.sm} ${theme.spacing.lg};
      border-radius: 6px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      gap: ${theme.spacing.xs};

      &.secondary {
        background: transparent;
        color: ${theme.colors.text.secondary};
        border: 1px solid ${theme.colors.border};

        &:hover {
          background: ${theme.colors.background.surface};
          color: ${theme.colors.text.primary};
        }
      }

      &.primary {
        background: ${theme.colors.accent.primary};
        color: white;
        border: none;

        &:hover {
          background: ${theme.colors.accent.primaryHover};
        }

        &:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      }
    }
  }
`;

function ImportMetadataReviewV2({ fileGroups, onConfirm, onCancel }) {
  const [editedGroups, setEditedGroups] = useState(fileGroups);
  const [expandedSections, setExpandedSections] = useState({
    basic: true,
    location: true,
    source: true,
    tracks: false,
    preview: true
  });
  const [fieldSelections, setFieldSelections] = useState({});
  const [editMode, setEditMode] = useState({});
  const [isFingerprinting, setIsFingerprinting] = useState(false);
  const [fingerprintStatus, setFingerprintStatus] = useState('');
  const [trackMatches, setTrackMatches] = useState([]);
  const [activeTab, setActiveTab] = useState('album'); // 'album' or 'tracks'
  const [trackSelections, setTrackSelections] = useState({}); // Track-level field selections
  const [trackEditMode, setTrackEditMode] = useState(false);
  const [releaseType, setReleaseType] = useState('BOOTLEG'); // OFFICIAL or BOOTLEG
  const [sourceType, setSourceType] = useState(''); // SBD, AUD, MATRIX, FM
  const [taperInfo, setTaperInfo] = useState('');
  const [multiDateWarning, setMultiDateWarning] = useState(null);

  // Initialize field selections based on which has better data
  useEffect(() => {
    if (fileGroups && fileGroups.length > 0) {
      const group = fileGroups[0];
      const selections = {};

      // Auto-select the better value for each field
      selections.artist = group.artist ? 'current' : 'musicbrainz';
      selections.album = group.album ? 'current' : 'musicbrainz';
      selections.date = group.date && group.date !== 'Unknown-Date' && group.date !== '' ? 'current' : 'musicbrainz';
      selections.venue = group.venue && group.venue !== 'the' && group.venue !== 'Unknown Venue' && group.venue !== '' ? 'current' : 'musicbrainz';
      selections.city = group.city ? 'current' : 'musicbrainz';
      selections.state = group.state ? 'current' : 'musicbrainz';
      selections.sourceType = 'current';

      setFieldSelections(selections);
    }
  }, [fileGroups]);

  // Auto-fingerprint on mount if needed
  useEffect(() => {
    if (fileGroups && fileGroups.length > 0) {
      const group = fileGroups[0];

      // Auto-fingerprint if we have tracks and no MusicBrainz data and missing critical metadata
      const hasInvalidMetadata =
        (!group.date || group.date === 'Unknown-Date' || group.date === '') ||
        (!group.venue || group.venue === 'the' || group.venue === 'Unknown Venue' || group.venue === '') ||
        (!group.album || group.album === '');

      if (hasInvalidMetadata && !group.musicbrainzData && group.tracks?.length > 0) {
        // Small delay to let the component fully render first
        const timer = setTimeout(() => {
          fetchMusicBrainzData();
        }, 500);
        return () => clearTimeout(timer);
      }
    }
  }, []); // Only run once on mount

  // Check for multi-date albums when track matches are updated
  useEffect(() => {
    if (trackMatches.length > 0) {
      const dates = trackMatches
        .filter(m => m.match?.performanceDate)
        .map(m => m.match.performanceDate);

      const uniqueDates = [...new Set(dates)];

      if (uniqueDates.length > 1) {
        setMultiDateWarning({
          dates: uniqueDates,
          message: `This album contains recordings from ${uniqueDates.length} different dates: ${uniqueDates.join(', ')}. Consider splitting into separate albums for each date.`
        });
      } else {
        setMultiDateWarning(null);
      }
    }
  }, [trackMatches]);

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleFieldAction = (field, action) => {
    if (action === 'edit') {
      setEditMode(prev => ({ ...prev, [field]: true }));
    } else {
      setFieldSelections(prev => ({ ...prev, [field]: action }));
      setEditMode(prev => ({ ...prev, [field]: false }));

      // Update the edited group with the selected value
      const group = editedGroups[0];
      let value = '';

      if (action === 'current') {
        value = group[field] || '';
      } else if (action === 'musicbrainz' && group.musicbrainzData) {
        // Special handling for date field - use performanceDate if available
        if (field === 'date') {
          value = group.musicbrainzData.performanceDate || group.musicbrainzData.releaseDate || '';
        } else {
          value = group.musicbrainzData[field] || '';
        }
      }

      updateGroupMetadata(0, field, value);
    }
  };

  const updateGroupMetadata = (groupIndex, field, value) => {
    setEditedGroups(prev => {
      const updated = [...prev];
      updated[groupIndex] = {
        ...updated[groupIndex],
        [field]: value
      };
      return updated;
    });
  };

  const applyAllMusicBrainz = () => {
    const newSelections = {};
    Object.keys(fieldSelections).forEach(field => {
      newSelections[field] = 'musicbrainz';
    });
    setFieldSelections(newSelections);
  };

  const applyAllCurrent = () => {
    const newSelections = {};
    Object.keys(fieldSelections).forEach(field => {
      newSelections[field] = 'current';
    });
    setFieldSelections(newSelections);
  };

  const autoFix = () => {
    const group = editedGroups[0];
    const newSelections = { ...fieldSelections };
    const mbData = group.musicbrainzData || {};

    // Smart auto-fix: choose the non-empty, valid value
    Object.keys(fieldSelections).forEach(field => {
      const currentValue = group[field];
      let mbValue = mbData[field];

      // Special handling for date field - use performanceDate if available
      if (field === 'date') {
        mbValue = mbData.performanceDate || mbData.releaseDate || mbData.date;
      }

      // Check for invalid current values
      const invalidValues = ['Unknown', 'the', 'Unknown-Date', 'Unknown Venue', ''];
      const currentIsInvalid = !currentValue || invalidValues.includes(currentValue);

      if (currentIsInvalid && mbValue && !invalidValues.includes(mbValue)) {
        newSelections[field] = 'musicbrainz';
        // Actually update the field value when auto-fixing
        updateGroupMetadata(0, field, mbValue);
      } else if (!currentIsInvalid) {
        newSelections[field] = 'current';
      }
    });

    setFieldSelections(newSelections);
  };

  // Fingerprint multiple tracks to get album and track metadata
  const fetchMusicBrainzData = async () => {
    const group = editedGroups[0];
    if (!group.tracks || group.tracks.length === 0) {
      setFingerprintStatus('No tracks available');
      return;
    }

    setIsFingerprinting(true);
    setFingerprintStatus('Fingerprinting tracks to identify album...');
    setExpandedSections(prev => ({ ...prev, tracks: true })); // Show tracks section

    const matches = [];
    let albumData = null;
    let performanceDate = null;

    // Fingerprint up to 5 tracks for better coverage
    const tracksToFingerprint = group.tracks.slice(0, Math.min(5, group.tracks.length));

    for (let i = 0; i < tracksToFingerprint.length; i++) {
      const track = tracksToFingerprint[i];
      const filePath = track.path || track.file_path;

      if (!filePath) {
        console.error(`No file path found for track ${i + 1}`);
        matches.push({
          track,
          match: null,
          error: 'No file path'
        });
        continue;
      }

      setFingerprintStatus(`Fingerprinting track ${i + 1} of ${tracksToFingerprint.length}: ${track.title || track.filename}...`);

      try {
        // Call the MusicBrainz fingerprint API
        console.log(`Fingerprinting track ${i + 1}:`, filePath);
        const result = await window.api.invoke('musicbrainz:fingerprint', filePath);

        if (result && result.confidence > 0) {
          console.log(`Track ${i + 1} match found:`, result);

          // Store the track match with all metadata
          matches.push({
            track,
            match: {
              ...result,
              trackNumber: i + 1,
              title: result.title,
              artist: result.artist,
              album: result.album || result.release?.title,
              performanceDate: result.performanceDate || result.recordingDate,
              venue: result.venue,
              city: result.city,
              state: result.state,
              duration: result.duration,
              confidence: result.confidence,
              recordingId: result.recordingId,
              releaseId: result.releaseId
            }
          });

          // Use the first track's data for album-level information, or first good match as fallback
          if (!albumData && (i === 0 || result.confidence > 0.5)) {
            const concertInfo = extractConcertInfo(result.title);

            // Extract performance date from the result (it's already found by the service)
            performanceDate = result.performanceDate ||
                            result.recordingDate ||
                            concertInfo?.date ||
                            (result.release?.date ? result.release.date.split('-').slice(0, 3).join('-') : null);

            console.log(`Using track ${i + 1} for album data. Performance date:`, performanceDate);

            albumData = {
              artist: result.artist || 'Grateful Dead',
              album: result.album || result.release?.title || '',
              releaseDate: result.releaseDate || result.release?.date || '',
              performanceDate: performanceDate || '',
              venue: result.venue || concertInfo?.venue || '',
              city: result.city || concertInfo?.city || '',
              state: result.state || concertInfo?.state || '',
              releaseType: result.release?.['release-group']?.['primary-type'] || 'Unknown',
              releaseStatus: result.release?.status || 'Unknown',
              artworkUrl: '',
              trackCount: group.tracks?.length || 0,
              notes: result.isLive ? 'Live Recording' : '',
              musicbrainzUrl: result.releaseId ? `https://musicbrainz.org/release/${result.releaseId}` : '',
              releaseId: result.releaseId,
              recordingId: result.recordingId
            };

            // Determine if it's official based on MusicBrainz data
            const primaryType = result.release?.['release-group']?.['primary-type'];
            const status = result.release?.status;
            const secondaryTypes = result.release?.['release-group']?.['secondary-types'] || [];

            if (status === 'Official' || primaryType === 'Album' || primaryType === 'EP') {
              setReleaseType('OFFICIAL');
            } else if (status === 'Bootleg' || secondaryTypes.includes('Live')) {
              setReleaseType('BOOTLEG');
            }

            // Fetch album artwork if we have a release ID
            if (result.releaseId) {
              try {
                const coverArt = await window.api.invoke('musicbrainz:fetchCover', result.releaseId);
                if (coverArt) {
                  albumData.artworkUrl = coverArt.large || coverArt.original || '';
                }
              } catch (error) {
                console.error('Error fetching cover art:', error);
              }
            }
          }
        } else {
          matches.push({
            track,
            match: null,
            error: 'No match found'
          });
        }
      } catch (error) {
        console.error(`Error fingerprinting track ${i + 1}:`, error);
        matches.push({
          track,
          match: null,
          error: error.message
        });
      }
    }

    // Store all track matches
    setTrackMatches(matches);

    // Update the edited groups with MusicBrainz data if we found any matches
    if (albumData) {
      // If we found performance dates in individual tracks but not in album, use the most common one
      if (!albumData.performanceDate && matches.some(m => m.match?.performanceDate)) {
        const dates = matches
          .filter(m => m.match?.performanceDate)
          .map(m => m.match.performanceDate);

        // Use the most frequent date or the first one
        const dateFrequency = {};
        dates.forEach(date => {
          dateFrequency[date] = (dateFrequency[date] || 0) + 1;
        });

        const mostCommonDate = Object.entries(dateFrequency)
          .sort((a, b) => b[1] - a[1])[0]?.[0];

        if (mostCommonDate) {
          albumData.performanceDate = mostCommonDate;
          console.log('Using most common performance date from tracks:', mostCommonDate);
        }
      }

      setEditedGroups(prev => {
        const updated = [...prev];
        // Update the musicbrainzData
        updated[0] = {
          ...updated[0],
          musicbrainzData: albumData
        };

        // Also update the actual fields if they're empty or invalid
        const invalidValues = ['Unknown', 'the', 'Unknown-Date', 'Unknown Venue', ''];

        if (!updated[0].date || invalidValues.includes(updated[0].date)) {
          updated[0].date = albumData.performanceDate || updated[0].date;
        }
        if (!updated[0].venue || invalidValues.includes(updated[0].venue)) {
          updated[0].venue = albumData.venue || updated[0].venue;
        }
        if (!updated[0].city || invalidValues.includes(updated[0].city)) {
          updated[0].city = albumData.city || updated[0].city;
        }
        if (!updated[0].state || invalidValues.includes(updated[0].state)) {
          updated[0].state = albumData.state || updated[0].state;
        }
        if (!updated[0].album || invalidValues.includes(updated[0].album)) {
          updated[0].album = albumData.album || updated[0].album;
        }
        if (!updated[0].artist || invalidValues.includes(updated[0].artist)) {
          updated[0].artist = albumData.artist || updated[0].artist;
        }

        return updated;
      });

      const matchedCount = matches.filter(m => m.match).length;
      setFingerprintStatus(`Found ${matchedCount} track matches out of ${tracksToFingerprint.length} fingerprinted`);

      // Auto-select MusicBrainz values for empty fields
      setTimeout(() => autoFix(), 100); // Small delay to ensure state is updated
    } else {
      setFingerprintStatus('No matches found in MusicBrainz');
    }

    setIsFingerprinting(false);
  };

  // Helper function to extract concert info from MusicBrainz title
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
        date: isoDate
      };
    }

    return null;
  };

  const getFieldStatus = (field) => {
    const group = editedGroups[0];
    let currentValue = group[field];
    let mbValue = group.musicbrainzData?.[field];

    // Special handling for date field
    if (field === 'date') {
      mbValue = group.musicbrainzData?.performanceDate || group.musicbrainzData?.releaseDate;
    }

    // Check for invalid/empty values
    const invalidValues = ['Unknown', 'the', 'Unknown-Date', 'Unknown Venue', ''];
    const currentIsEmpty = !currentValue || invalidValues.includes(currentValue);
    const mbIsEmpty = !mbValue || invalidValues.includes(mbValue);

    if (currentIsEmpty && mbIsEmpty) return 'missing';
    if (!currentIsEmpty && !mbIsEmpty && currentValue === mbValue) return 'match';
    if (!currentIsEmpty && !mbIsEmpty && currentValue !== mbValue) return 'differ';
    if (currentIsEmpty && !mbIsEmpty) return 'missing';
    if (!currentIsEmpty && mbIsEmpty) return 'match';
    return 'missing';
  };

  const generateFolderPreview = () => {
    const group = editedGroups[0];
    const artist = group.artist || 'Grateful Dead';
    const date = group.date || 'Unknown-Date';
    const year = date && date !== 'Unknown-Date' ? date.substring(0, 4) : 'Unknown';
    const venue = group.venue || '';
    const city = group.city || '';
    const state = group.state || '';
    const album = group.album || '';

    // Check for invalid values
    const hasValidDate = date && date !== 'Unknown-Date' && date !== '';
    const hasValidVenue = venue && venue !== 'Unknown Venue' && venue !== 'the' && venue !== '';

    let folderName;
    let fullPath;

    // Different folder structure based on release type
    if (releaseType === 'OFFICIAL' && album) {
      // Official releases: /Artist/Album Name
      folderName = album;
      fullPath = `/${artist}/${album}/`;
    } else {
      // Bootlegs/Live recordings: /Artist/Year/Date - Venue - State (Source)
      folderName = date;
      if (hasValidVenue) {
        folderName += ` - ${venue}`;
      }
      if (state) {
        folderName += ` - ${state}`;
      }
      // Add source type to folder name if specified
      if (sourceType) {
        folderName += ` (${sourceType})`;
      }
      fullPath = `/${artist}/${year}/${folderName}/`;
    }

    // Keep original file names - don't alter them
    const formatTrackTitle = (track, index) => {
      // Use original filename
      const filename = track.filename || track.name || track.path?.split('/').pop() || `Track ${index + 1}`;
      // Ensure it has an extension
      if (!filename.includes('.')) {
        return `${filename}.flac`;
      }
      return filename;
    };

    return {
      artist,
      year,
      folder: folderName,
      fullPath,
      tracks: group.tracks?.slice(0, 5).map((t, i) => formatTrackTitle(t, i)) || [],
      hasValidDate,
      hasValidVenue,
      totalTracks: group.tracks?.length || 0,
      isOfficial: releaseType === 'OFFICIAL'
    };
  };

  const preview = generateFolderPreview();
  const group = editedGroups[0] || {};
  const mbData = group.musicbrainzData || {};

  // Count statistics
  const stats = {
    match: 0,
    differ: 0,
    missing: 0
  };

  Object.keys(fieldSelections).forEach(field => {
    const status = getFieldStatus(field);
    if (status === 'match') stats.match++;
    else if (status === 'differ') stats.differ++;
    else if (status === 'missing') stats.missing++;
  });

  return (
    <Overlay onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <Dialog>
        <Header>
          <h2>
            <AlertCircle />
            Import Metadata Review & Comparison
          </h2>
          <p>
            Compare current file metadata with MusicBrainz suggestions. Choose the best values for each field.
          </p>
        </Header>

        {fingerprintStatus && (
          <div style={{
            padding: `${theme.spacing.md} ${theme.spacing.lg}`,
            background: isFingerprinting ? theme.colors.status.info + '20' :
                       fingerprintStatus.includes('found') ? theme.colors.status.success + '20' :
                       theme.colors.status.warning + '20',
            borderBottom: `1px solid ${theme.colors.border}`,
            fontSize: '13px',
            color: theme.colors.text.primary,
            display: 'flex',
            alignItems: 'center',
            gap: theme.spacing.sm
          }}>
            {isFingerprinting ? <RefreshCw size={14} className="spinning" /> :
             fingerprintStatus.includes('found') ? <CheckCircle size={14} /> :
             <AlertCircle size={14} />}
            {fingerprintStatus}
          </div>
        )}

        {multiDateWarning && (
          <div style={{
            padding: `${theme.spacing.md} ${theme.spacing.lg}`,
            background: theme.colors.status.warning + '20',
            borderBottom: `1px solid ${theme.colors.border}`,
            fontSize: '13px',
            color: theme.colors.text.primary,
            display: 'flex',
            alignItems: 'flex-start',
            gap: theme.spacing.sm
          }}>
            <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: '2px', color: theme.colors.status.warning }} />
            <div>
              <strong>Multi-Date Album Detected</strong>
              <div style={{ marginTop: '4px', color: theme.colors.text.secondary }}>
                {multiDateWarning.message}
              </div>
              <div style={{ marginTop: '8px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {multiDateWarning.dates.map((date, i) => (
                  <span key={i} style={{
                    padding: '2px 8px',
                    background: theme.colors.background.surface,
                    border: `1px solid ${theme.colors.border}`,
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: '500'
                  }}>
                    {date}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        <BulkActionsBar>
          <div className="actions-left">
            {!group.musicbrainzData && !isFingerprinting && (
              <button
                onClick={fetchMusicBrainzData}
                disabled={isFingerprinting}
                className="primary"
              >
                <Music size={14} />
                Fetch from MusicBrainz
              </button>
            )}
            {isFingerprinting && (
              <button disabled className="primary">
                <RefreshCw size={14} className="spinning" />
                Fingerprinting...
              </button>
            )}
            <button onClick={applyAllCurrent}>
              <Copy size={14} />
              Use All Current
            </button>
            <button onClick={applyAllMusicBrainz} disabled={!group.musicbrainzData}>
              <Music size={14} />
              Use All MusicBrainz
            </button>
            <button onClick={autoFix}>
              <RefreshCw size={14} />
              Auto-Fix Missing
            </button>
          </div>
          <div className="stats">
            <div className="stat match">
              <CheckCircle size={14} />
              {stats.match} matching
            </div>
            <div className="stat differ">
              <AlertTriangle size={14} />
              {stats.differ} different
            </div>
            <div className="stat missing">
              <XCircle size={14} />
              {stats.missing} missing
            </div>
          </div>
        </BulkActionsBar>

        <Content>
          {/* Basic Information Section */}
          <Section>
            <SectionHeader onClick={() => toggleSection('basic')}>
              <div className="title">
                <ChevronRight className={expandedSections.basic ? 'expanded' : ''} />
                Basic Information
                <span className="count">3 fields</span>
              </div>
              <div className="section-status">
                <div className="indicator success">
                  <CheckCircle /> 1
                </div>
                <div className="indicator warning">
                  <AlertTriangle /> 1
                </div>
                <div className="indicator error">
                  <XCircle /> 1
                </div>
              </div>
            </SectionHeader>
            <SectionContent collapsed={!expandedSections.basic}>
              {/* Artist Field */}
              <FieldComparison>
                <FieldHeader>
                  <Music />
                  Artist
                  <div className={`status-icon ${getFieldStatus('artist')}`}>
                    {getFieldStatus('artist') === 'match' && <CheckCircle />}
                    {getFieldStatus('artist') === 'differ' && <AlertTriangle />}
                    {getFieldStatus('artist') === 'missing' && <XCircle />}
                  </div>
                </FieldHeader>
                <ComparisonRow>
                  <ValueBox className={`current ${!group.artist ? 'empty' : ''} ${fieldSelections.artist === 'current' ? 'selected' : ''}`}>
                    <span className="label">Current</span>
                    {group.artist || 'No artist'}
                  </ValueBox>
                  <ValueBox className={`musicbrainz ${!mbData.artist ? 'empty' : ''} ${fieldSelections.artist === 'musicbrainz' ? 'selected' : ''}`}>
                    <span className="label">MusicBrainz</span>
                    {mbData.artist || 'Not found'}
                  </ValueBox>
                  <ActionButtons>
                    <button
                      className={fieldSelections.artist === 'current' ? 'active' : ''}
                      onClick={() => handleFieldAction('artist', 'current')}
                      title="Keep current file metadata"
                    >
                      <Copy />
                    </button>
                    <button
                      className={fieldSelections.artist === 'musicbrainz' ? 'active' : ''}
                      onClick={() => handleFieldAction('artist', 'musicbrainz')}
                      title="Replace with MusicBrainz metadata"
                    >
                      <Music />
                    </button>
                    <button
                      onClick={() => handleFieldAction('artist', 'edit')}
                      title="Edit this field manually"
                    >
                      <Edit2 />
                    </button>
                  </ActionButtons>
                </ComparisonRow>
              </FieldComparison>

              {/* Album Field */}
              <FieldComparison>
                <FieldHeader>
                  <Music />
                  Album
                  <div className={`status-icon ${getFieldStatus('album')}`}>
                    {getFieldStatus('album') === 'match' && <CheckCircle />}
                    {getFieldStatus('album') === 'differ' && <AlertTriangle />}
                    {getFieldStatus('album') === 'missing' && <XCircle />}
                  </div>
                </FieldHeader>
                <ComparisonRow>
                  <ValueBox className={`current ${!group.album ? 'empty' : ''} ${fieldSelections.album === 'current' ? 'selected' : ''}`}>
                    <span className="label">Current</span>
                    {group.album || 'No album'}
                  </ValueBox>
                  <ValueBox className={`musicbrainz ${!mbData.album ? 'empty' : ''} ${fieldSelections.album === 'musicbrainz' ? 'selected' : ''}`}>
                    <span className="label">MusicBrainz</span>
                    {mbData.album || 'Not found'}
                  </ValueBox>
                  <ActionButtons>
                    <button
                      className={fieldSelections.album === 'current' ? 'active' : ''}
                      onClick={() => handleFieldAction('album', 'current')}
                      title="Keep current file metadata"
                    >
                      <Copy />
                    </button>
                    <button
                      className={fieldSelections.album === 'musicbrainz' ? 'active' : ''}
                      onClick={() => handleFieldAction('album', 'musicbrainz')}
                      title="Replace with MusicBrainz metadata"
                    >
                      <Music />
                    </button>
                    <button
                      onClick={() => handleFieldAction('album', 'edit')}
                      title="Edit this field manually"
                    >
                      <Edit2 />
                    </button>
                  </ActionButtons>
                </ComparisonRow>
              </FieldComparison>

              {/* Date Field */}
              <FieldComparison>
                <FieldHeader>
                  <Calendar />
                  Performance Date
                  <div className={`status-icon ${getFieldStatus('date')}`}>
                    {getFieldStatus('date') === 'match' && <CheckCircle />}
                    {getFieldStatus('date') === 'differ' && <AlertTriangle />}
                    {getFieldStatus('date') === 'missing' && <XCircle />}
                  </div>
                </FieldHeader>
                <ComparisonRow>
                  <ValueBox className={`current ${!group.date || group.date === 'Unknown-Date' ? 'error' : ''} ${fieldSelections.date === 'current' ? 'selected' : ''}`}>
                    <span className="label">Current</span>
                    {editMode.date ? (
                      <input
                        type="text"
                        value={group.date || ''}
                        onChange={(e) => updateGroupMetadata(0, 'date', e.target.value)}
                        onBlur={() => setEditMode(prev => ({ ...prev, date: false }))}
                        placeholder="YYYY-MM-DD"
                        autoFocus
                      />
                    ) : (
                      group.date || 'Missing date'
                    )}
                  </ValueBox>
                  <ValueBox className={`musicbrainz ${!mbData.performanceDate ? 'empty' : ''} ${fieldSelections.date === 'musicbrainz' ? 'selected' : ''}`}>
                    <span className="label">MusicBrainz</span>
                    {mbData.performanceDate || mbData.releaseDate || 'Not found'}
                  </ValueBox>
                  <ActionButtons>
                    <button
                      className={fieldSelections.date === 'current' ? 'active' : ''}
                      onClick={() => handleFieldAction('date', 'current')}
                      title="Keep current file metadata"
                    >
                      <Copy />
                    </button>
                    <button
                      className={fieldSelections.date === 'musicbrainz' ? 'active' : ''}
                      onClick={() => handleFieldAction('date', 'musicbrainz')}
                      title="Use performance date from MusicBrainz"
                    >
                      <Music />
                    </button>
                    <button
                      onClick={() => handleFieldAction('date', 'edit')}
                      title="Edit date manually (YYYY-MM-DD)"
                    >
                      <Edit2 />
                    </button>
                  </ActionButtons>
                </ComparisonRow>
              </FieldComparison>
            </SectionContent>
          </Section>

          {/* Location Section */}
          <Section>
            <SectionHeader onClick={() => toggleSection('location')}>
              <div className="title">
                <ChevronRight className={expandedSections.location ? 'expanded' : ''} />
                <MapPin size={16} />
                Location Information
                <span className="count">3 fields</span>
              </div>
            </SectionHeader>
            <SectionContent collapsed={!expandedSections.location}>
              {/* Venue Field */}
              <FieldComparison>
                <FieldHeader>
                  <MapPin />
                  Venue
                  <div className={`status-icon ${getFieldStatus('venue')}`}>
                    {getFieldStatus('venue') === 'match' && <CheckCircle />}
                    {getFieldStatus('venue') === 'differ' && <AlertTriangle />}
                    {getFieldStatus('venue') === 'missing' && <XCircle />}
                  </div>
                </FieldHeader>
                <ComparisonRow>
                  <ValueBox className={`current ${!group.venue || group.venue === 'the' ? 'error' : ''} ${fieldSelections.venue === 'current' ? 'selected' : ''}`}>
                    <span className="label">Current</span>
                    {editMode.venue ? (
                      <input
                        type="text"
                        value={group.venue || ''}
                        onChange={(e) => updateGroupMetadata(0, 'venue', e.target.value)}
                        onBlur={() => setEditMode(prev => ({ ...prev, venue: false }))}
                        placeholder="Enter venue name"
                        autoFocus
                      />
                    ) : (
                      group.venue || 'No venue'
                    )}
                  </ValueBox>
                  <ValueBox className={`musicbrainz ${!mbData.venue ? 'empty' : ''} ${fieldSelections.venue === 'musicbrainz' ? 'selected' : ''}`}>
                    <span className="label">MusicBrainz</span>
                    {mbData.venue || 'Not found'}
                  </ValueBox>
                  <ActionButtons>
                    <button
                      className={fieldSelections.venue === 'current' ? 'active' : ''}
                      onClick={() => handleFieldAction('venue', 'current')}
                      title="Keep current file metadata"
                    >
                      <Copy />
                    </button>
                    <button
                      className={fieldSelections.venue === 'musicbrainz' ? 'active' : ''}
                      onClick={() => handleFieldAction('venue', 'musicbrainz')}
                      title="Replace with MusicBrainz venue"
                    >
                      <Music />
                    </button>
                    <button
                      onClick={() => handleFieldAction('venue', 'edit')}
                      title="Edit venue name manually"
                    >
                      <Edit2 />
                    </button>
                  </ActionButtons>
                </ComparisonRow>
              </FieldComparison>

              {/* City Field */}
              <FieldComparison>
                <FieldHeader>
                  <MapPin />
                  City
                  <div className={`status-icon ${getFieldStatus('city')}`}>
                    {getFieldStatus('city') === 'match' && <CheckCircle />}
                    {getFieldStatus('city') === 'differ' && <AlertTriangle />}
                    {getFieldStatus('city') === 'missing' && <XCircle />}
                  </div>
                </FieldHeader>
                <ComparisonRow>
                  <ValueBox className={`current ${!group.city ? 'empty' : ''} ${fieldSelections.city === 'current' ? 'selected' : ''}`}>
                    <span className="label">Current</span>
                    {editMode.city ? (
                      <input
                        type="text"
                        value={group.city || ''}
                        onChange={(e) => updateGroupMetadata(0, 'city', e.target.value)}
                        onBlur={() => setEditMode(prev => ({ ...prev, city: false }))}
                        placeholder="Enter city name"
                        autoFocus
                      />
                    ) : (
                      group.city || 'No city'
                    )}
                  </ValueBox>
                  <ValueBox className={`musicbrainz ${!mbData.city ? 'empty' : ''} ${fieldSelections.city === 'musicbrainz' ? 'selected' : ''}`}>
                    <span className="label">MusicBrainz</span>
                    {mbData.city || 'Not found'}
                  </ValueBox>
                  <ActionButtons>
                    <button
                      className={fieldSelections.city === 'current' ? 'active' : ''}
                      onClick={() => handleFieldAction('city', 'current')}
                      title="Keep current file metadata"
                    >
                      <Copy />
                    </button>
                    <button
                      className={fieldSelections.city === 'musicbrainz' ? 'active' : ''}
                      onClick={() => handleFieldAction('city', 'musicbrainz')}
                      title="Replace with MusicBrainz city"
                    >
                      <Music />
                    </button>
                    <button
                      onClick={() => handleFieldAction('city', 'edit')}
                      title="Edit city name manually"
                    >
                      <Edit2 />
                    </button>
                  </ActionButtons>
                </ComparisonRow>
              </FieldComparison>

              {/* State Field */}
              <FieldComparison>
                <FieldHeader>
                  <MapPin />
                  State
                  <div className={`status-icon ${getFieldStatus('state')}`}>
                    {getFieldStatus('state') === 'match' && <CheckCircle />}
                    {getFieldStatus('state') === 'differ' && <AlertTriangle />}
                    {getFieldStatus('state') === 'missing' && <XCircle />}
                  </div>
                </FieldHeader>
                <ComparisonRow>
                  <ValueBox className={`current ${!group.state ? 'empty' : ''} ${fieldSelections.state === 'current' ? 'selected' : ''}`}>
                    <span className="label">Current</span>
                    {editMode.state ? (
                      <input
                        type="text"
                        value={group.state || ''}
                        onChange={(e) => updateGroupMetadata(0, 'state', e.target.value)}
                        onBlur={() => setEditMode(prev => ({ ...prev, state: false }))}
                        placeholder="Enter state (e.g., CA)"
                        autoFocus
                      />
                    ) : (
                      group.state || 'No state'
                    )}
                  </ValueBox>
                  <ValueBox className={`musicbrainz ${!mbData.state ? 'empty' : ''} ${fieldSelections.state === 'musicbrainz' ? 'selected' : ''}`}>
                    <span className="label">MusicBrainz</span>
                    {mbData.state || 'Not found'}
                  </ValueBox>
                  <ActionButtons>
                    <button
                      className={fieldSelections.state === 'current' ? 'active' : ''}
                      onClick={() => handleFieldAction('state', 'current')}
                      title="Keep current file metadata"
                    >
                      <Copy />
                    </button>
                    <button
                      className={fieldSelections.state === 'musicbrainz' ? 'active' : ''}
                      onClick={() => handleFieldAction('state', 'musicbrainz')}
                      title="Replace with MusicBrainz state"
                    >
                      <Music />
                    </button>
                    <button
                      onClick={() => handleFieldAction('state', 'edit')}
                      title="Edit state code manually"
                    >
                      <Edit2 />
                    </button>
                  </ActionButtons>
                </ComparisonRow>
              </FieldComparison>
            </SectionContent>
          </Section>

          {/* Source Information Section */}
          <Section>
            <SectionHeader onClick={() => toggleSection('source')}>
              <div className="title">
                <ChevronRight className={expandedSections.source ? 'expanded' : ''} />
                <Mic2 size={16} />
                Source Information
                <span className="count">3 fields</span>
              </div>
            </SectionHeader>
            <SectionContent collapsed={!expandedSections.source}>
              {/* Release Type Field */}
              <FieldComparison>
                <FieldHeader>
                  <Disc />
                  Release Type
                </FieldHeader>
                <ComparisonRow>
                  <ValueBox className="current selected" style={{ gridColumn: 'span 2' }}>
                    <select
                      value={releaseType}
                      onChange={(e) => setReleaseType(e.target.value)}
                      style={{
                        width: '100%',
                        background: 'transparent',
                        border: 'none',
                        color: theme.colors.text.primary,
                        fontSize: '14px',
                        outline: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      <option value="BOOTLEG">Bootleg</option>
                      <option value="OFFICIAL">Official</option>
                      <option value="SEMI-OFFICIAL">Semi-Official</option>
                    </select>
                  </ValueBox>
                  <ActionButtons>
                    {/* Empty for alignment */}
                  </ActionButtons>
                </ComparisonRow>
              </FieldComparison>

              {/* Source Type Field */}
              <FieldComparison>
                <FieldHeader>
                  <Radio />
                  Source Type
                  <div className={`status-icon ${sourceType ? 'match' : 'missing'}`}>
                    {sourceType ? <CheckCircle /> : <XCircle />}
                  </div>
                </FieldHeader>
                <ComparisonRow>
                  <ValueBox className="current selected" style={{ gridColumn: 'span 2' }}>
                    <input
                      type="text"
                      value={sourceType || ''}
                      onChange={(e) => setSourceType(e.target.value)}
                      placeholder="e.g., SBD, AUD, Matrix, FM, Stream"
                      style={{
                        width: '100%',
                        background: 'transparent',
                        border: 'none',
                        color: theme.colors.text.primary,
                        fontSize: '14px',
                        outline: 'none'
                      }}
                    />
                  </ValueBox>
                  <ActionButtons>
                    <button
                      onClick={() => setSourceType('SBD')}
                      title="Soundboard recording"
                      style={{
                        padding: '4px 8px',
                        fontSize: '12px'
                      }}
                    >
                      SBD
                    </button>
                    <button
                      onClick={() => setSourceType('AUD')}
                      title="Audience recording"
                      style={{
                        padding: '4px 8px',
                        fontSize: '12px'
                      }}
                    >
                      AUD
                    </button>
                    <button
                      onClick={() => setSourceType('Matrix')}
                      title="Matrix (SBD+AUD mix)"
                      style={{
                        padding: '4px 8px',
                        fontSize: '12px'
                      }}
                    >
                      MTX
                    </button>
                  </ActionButtons>
                </ComparisonRow>
              </FieldComparison>

              {/* Taper/Lineage Field */}
              <FieldComparison>
                <FieldHeader>
                  <User />
                  Taper / Lineage
                </FieldHeader>
                <ComparisonRow>
                  <ValueBox className="current selected" style={{ gridColumn: 'span 2' }}>
                    <textarea
                      value={taperInfo || ''}
                      onChange={(e) => setTaperInfo(e.target.value)}
                      placeholder="e.g., Taper: Charlie Miller&#10;Source: Schoeps MK4 > Sonosax > DAT&#10;Lineage: DAT > CDR > FLAC"
                      style={{
                        width: '100%',
                        background: 'transparent',
                        border: 'none',
                        color: theme.colors.text.primary,
                        fontSize: '13px',
                        outline: 'none',
                        resize: 'vertical',
                        minHeight: '60px',
                        fontFamily: 'inherit'
                      }}
                    />
                  </ValueBox>
                  <ActionButtons>
                    {/* Empty for alignment */}
                  </ActionButtons>
                </ComparisonRow>
              </FieldComparison>
            </SectionContent>
          </Section>

          {/* Track Matches Section */}
          {trackMatches.length > 0 && (
            <Section>
              <SectionHeader onClick={() => toggleSection('tracks')}>
                <div className="title">
                  <ChevronRight className={expandedSections.tracks ? 'expanded' : ''} />
                  <Music size={16} />
                  Track Matches
                  <span className="count">{trackMatches.length} tracks fingerprinted</span>
                </div>
                <div className="section-status">
                  <div className="indicator success">
                    <CheckCircle /> {trackMatches.filter(m => m.match).length}
                  </div>
                  <div className="indicator error">
                    <XCircle /> {trackMatches.filter(m => !m.match).length}
                  </div>
                </div>
              </SectionHeader>
              <SectionContent collapsed={!expandedSections.tracks}>
                <TracksSection>
                  <div className="tracks-header">
                    <h4>
                      <Info size={14} />
                      MusicBrainz Track Identification Results
                    </h4>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <button
                        onClick={() => setTrackEditMode(!trackEditMode)}
                        style={{
                          padding: '6px 12px',
                          background: trackEditMode ? theme.colors.accent.primary : theme.colors.background.elevated,
                          color: trackEditMode ? 'white' : theme.colors.text.primary,
                          border: `1px solid ${trackEditMode ? theme.colors.accent.primary : theme.colors.border}`,
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: '500',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <Edit2 size={14} />
                        {trackEditMode ? 'Exit Edit Mode' : 'Edit Track Titles'}
                      </button>
                    </div>
                    <div className="match-summary">
                      <div className="stat matched">
                        <CheckCircle />
                        {trackMatches.filter(m => m.match).length} matched
                      </div>
                      <div className="stat unmatched">
                        <XCircle />
                        {trackMatches.filter(m => !m.match).length} unmatched
                      </div>
                      {trackMatches.some(m => m.match?.performanceDate) && (
                        <div className="stat" style={{ color: theme.colors.accent.primary }}>
                          <Calendar size={14} />
                          {(() => {
                            const dates = [...new Set(trackMatches
                              .filter(m => m.match?.performanceDate)
                              .map(m => m.match.performanceDate))];
                            return dates.length === 1 ? dates[0] : `${dates.length} dates`;
                          })()}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="track-list">
                    {trackMatches.map((item, index) => {
                      const { track, match, error } = item;
                      const hasMatch = !!match;
                      const confidenceLevel = match?.confidence > 0.8 ? 'high' :
                                             match?.confidence > 0.5 ? 'medium' : 'low';

                      return (
                        <div key={index} className={`track-match ${hasMatch ? 'has-match' : 'no-match'}`}>
                          <div className="track-header">
                            <div className="track-info">
                              <div className="track-number">Track {index + 1}</div>
                              <div className="track-title">
                                {trackEditMode ? (
                                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                    <input
                                      type="text"
                                      value={trackSelections[`track-${index}-title`] || (hasMatch ? match.title : (track.title || track.filename))}
                                      onChange={(e) => {
                                        setTrackSelections(prev => ({
                                          ...prev,
                                          [`track-${index}-title`]: e.target.value
                                        }));
                                      }}
                                      style={{
                                        padding: '4px 8px',
                                        background: theme.colors.background.surface,
                                        border: `1px solid ${theme.colors.border}`,
                                        borderRadius: '4px',
                                        color: theme.colors.text.primary,
                                        fontSize: '14px',
                                        width: '350px'
                                      }}
                                      placeholder="Edit track title metadata"
                                    />
                                    <button
                                      onClick={() => {
                                        const newTitle = trackSelections[`track-${index}-title`] || (hasMatch ? match.title : (track.title || track.filename));
                                        const updatedSelections = {};
                                        trackMatches.forEach((_, i) => {
                                          updatedSelections[`track-${i}-title`] = newTitle;
                                        });
                                        setTrackSelections(prev => ({
                                          ...prev,
                                          ...updatedSelections
                                        }));
                                      }}
                                      style={{
                                        padding: '4px 8px',
                                        background: theme.colors.background.elevated,
                                        border: `1px solid ${theme.colors.border}`,
                                        borderRadius: '4px',
                                        fontSize: '11px',
                                        cursor: 'pointer',
                                        whiteSpace: 'nowrap'
                                      }}
                                      title="Apply this title to all tracks"
                                    >
                                      Apply to All
                                    </button>
                                  </div>
                                ) : (
                                  hasMatch ? match.title : (track.title || track.filename)
                                )}
                              </div>
                              <div className="file-name">
                                File: {track.filename || track.name}
                              </div>
                            </div>
                            {hasMatch && (
                              <div className={`confidence ${confidenceLevel}`}>
                                {Math.round(match.confidence * 100)}% match
                              </div>
                            )}
                          </div>
                          {hasMatch ? (
                            <div className="match-details">
                              <div className="detail-item">
                                <div className="label">Artist</div>
                                <div className="value">{match.artist || <span className="missing">Not found</span>}</div>
                              </div>
                              <div className="detail-item">
                                <div className="label">Album</div>
                                <div className="value">{match.album || <span className="missing">Not found</span>}</div>
                              </div>
                              <div className="detail-item">
                                <div className="label">Performance Date</div>
                                <div className="value" style={match.performanceDate ? {
                                  color: theme.colors.accent.primary,
                                  fontWeight: '600'
                                } : {}}>
                                  {match.performanceDate || <span className="missing">Not found</span>}
                                </div>
                              </div>
                              <div className="detail-item">
                                <div className="label">Venue</div>
                                <div className="value">
                                  {match.venue || <span className="missing">Not found</span>}
                                </div>
                              </div>
                              <div className="detail-item">
                                <div className="label">City</div>
                                <div className="value">
                                  {match.city || <span className="missing">Not found</span>}
                                </div>
                              </div>
                              <div className="detail-item">
                                <div className="label">State</div>
                                <div className="value">
                                  {match.state || <span className="missing">Not found</span>}
                                </div>
                              </div>
                              {match.duration && (
                                <div className="detail-item">
                                  <div className="label">Duration</div>
                                  <div className="value">{Math.floor(match.duration / 60)}:{String(match.duration % 60).padStart(2, '0')}</div>
                                </div>
                              )}
                              {match.releaseId && (
                                <div className="detail-item">
                                  <div className="label">MusicBrainz ID</div>
                                  <div className="value" style={{ fontSize: '11px' }}>
                                    <a
                                      href={`https://musicbrainz.org/release/${match.releaseId}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      style={{
                                        color: theme.colors.accent.primary,
                                        textDecoration: 'none',
                                        borderBottom: `1px dotted ${theme.colors.accent.primary}`
                                      }}
                                      title="View release on MusicBrainz"
                                    >
                                      {match.releaseId}
                                    </a>
                                  </div>
                                </div>
                              )}
                              {match.recordingId && (
                                <div className="detail-item">
                                  <div className="label">Recording Link</div>
                                  <div className="value">
                                    <a
                                      href={`https://musicbrainz.org/recording/${match.recordingId}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      style={{
                                        color: theme.colors.accent.primary,
                                        textDecoration: 'none',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                        fontSize: '12px',
                                        fontWeight: '500',
                                        padding: '2px 6px',
                                        borderRadius: '4px',
                                        background: `rgba(99, 102, 241, 0.1)`,
                                        border: `1px solid rgba(99, 102, 241, 0.3)`
                                      }}
                                      title="View this recording on MusicBrainz"
                                    >
                                      View on MusicBrainz →
                                    </a>
                                  </div>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="match-details">
                              <div className="detail-item">
                                <div className="label">Status</div>
                                <div className="value" style={{ color: theme.colors.status.error }}>
                                  {error || 'No match found in MusicBrainz'}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </TracksSection>
              </SectionContent>
            </Section>
          )}

          {/* Folder Preview Section */}
          <Section>
            <SectionHeader onClick={() => toggleSection('preview')}>
              <div className="title">
                <ChevronRight className={expandedSections.preview ? 'expanded' : ''} />
                <Eye size={16} />
                Folder Structure Preview
              </div>
            </SectionHeader>
            <SectionContent collapsed={!expandedSections.preview}>
              <PreviewPanel>
                <h3>
                  <FolderOpen size={14} />
                  Final Library Organization
                </h3>
                <div style={{
                  background: theme.colors.background.elevated,
                  border: `1px solid ${theme.colors.border}`,
                  borderRadius: '6px',
                  padding: theme.spacing.md,
                  marginBottom: theme.spacing.md,
                  fontFamily: 'monospace',
                  fontSize: '13px',
                  color: theme.colors.text.primary
                }}>
                  <div style={{ marginBottom: '8px', color: theme.colors.accent.primary }}>
                    {preview.fullPath}
                  </div>
                  {preview.tracks.map((track, i) => (
                    <div key={i} style={{ marginLeft: '20px', color: theme.colors.text.secondary }}>
                      {track}
                    </div>
                  ))}
                  {preview.totalTracks > 5 && (
                    <div style={{ marginLeft: '20px', color: theme.colors.text.dimmed, fontStyle: 'italic' }}>
                      ... and {preview.totalTracks - 5} more tracks
                    </div>
                  )}
                </div>
                <div className="folder-structure">
                  <div className="folder root">
                    <Folder size={14} />
                    {preview.artist}
                  </div>
                  <div className="folder indent-1">
                    <Folder size={14} />
                    {preview.year}
                  </div>
                  <div className="folder indent-2">
                    <Folder size={14} />
                    {preview.folder}
                  </div>
                  <div className="folder indent-2" style={{ color: theme.colors.text.dimmed, fontSize: '12px' }}>
                    <Info size={12} style={{ marginLeft: '2px' }} />
                    <span style={{ marginLeft: '4px' }}>{preview.totalTracks} total tracks</span>
                  </div>
                </div>
              </PreviewPanel>
            </SectionContent>
          </Section>
        </Content>

        <Footer>
          <div className="summary">
            {editedGroups.length} album • {editedGroups.reduce((sum, g) => sum + (g.tracks?.length || 0), 0)} tracks
            {(!preview.hasValidDate || !preview.hasValidVenue) && (
              <span style={{
                marginLeft: '16px',
                color: theme.colors.status.error,
                fontSize: '13px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <AlertCircle size={14} />
                {!preview.hasValidDate && 'Date is required'}
                {!preview.hasValidDate && !preview.hasValidVenue && ' • '}
                {!preview.hasValidVenue && 'Venue is required'}
              </span>
            )}
          </div>
          <div className="actions">
            <button className="secondary" onClick={onCancel}>
              <X />
              Cancel
            </button>
            <button
              className="primary"
              onClick={() => onConfirm(editedGroups)}
              disabled={!group.date || group.date === 'Unknown-Date' || group.date === '' || !group.venue || group.venue === 'the' || group.venue === 'Unknown Venue' || group.venue === ''}
            >
              <ChevronRight />
              Continue Import
            </button>
          </div>
        </Footer>
      </Dialog>
    </Overlay>
  );
}

export default ImportMetadataReviewV2;