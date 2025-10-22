import React from 'react';
import styled from '@emotion/styled';
import { Music, Edit2, Copy, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { theme } from '../../styles/globalStyles';

const TrackRow = styled.div`
  display: grid;
  grid-template-columns: 40px 2fr 1fr 100px 80px;
  gap: ${theme.spacing.sm};
  padding: ${theme.spacing.sm} ${theme.spacing.md};
  background: ${theme.colors.background.surface};
  border-radius: 6px;
  margin-bottom: ${theme.spacing.xs};
  align-items: center;
  transition: background ${theme.transitions.fast};

  &:hover {
    background: ${theme.colors.background.elevated};
  }

  &.match {
    border-left: 3px solid ${theme.colors.status.success};
  }

  &.differ {
    border-left: 3px solid ${theme.colors.status.warning};
  }

  &.missing {
    border-left: 3px solid ${theme.colors.status.error};
  }
`;

const TrackNumber = styled.div`
  font-weight: 600;
  color: ${theme.colors.text.secondary};
  font-size: 13px;
  text-align: center;
`;

const TrackTitle = styled.div`
  color: ${theme.colors.text.primary};
  font-size: 14px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  input {
    width: 100%;
    background: transparent;
    border: none;
    color: inherit;
    font-size: inherit;
    outline: none;
    border-bottom: 1px solid transparent;

    &:focus {
      border-bottom-color: ${theme.colors.accent.primary};
    }
  }
`;

const TrackAlbum = styled.div`
  color: ${theme.colors.text.secondary};
  font-size: 13px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const TrackStatus = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: ${theme.colors.text.secondary};

  svg {
    width: 14px;
    height: 14px;
  }

  &.match {
    color: ${theme.colors.status.success};
  }

  &.differ {
    color: ${theme.colors.status.warning};
  }

  &.missing {
    color: ${theme.colors.status.error};
  }
`;

const ActionButton = styled.button`
  padding: ${theme.spacing.xs};
  background: transparent;
  border: 1px solid ${theme.colors.border};
  border-radius: 4px;
  cursor: pointer;
  color: ${theme.colors.text.secondary};
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all ${theme.transitions.fast};

  &:hover {
    background: ${theme.colors.background.elevated};
    color: ${theme.colors.accent.primary};
    border-color: ${theme.colors.accent.primary};
  }

  svg {
    width: 14px;
    height: 14px;
  }
`;

/**
 * Get track status based on metadata comparison
 */
function getTrackStatus(track, mbData) {
  if (!track.title) return { type: 'missing', label: 'Missing' };
  if (!mbData || !mbData.title) return { type: 'differ', label: 'No Match' };

  const titleMatch = track.title.trim().toLowerCase() === mbData.title.trim().toLowerCase();
  return titleMatch
    ? { type: 'match', label: 'Match' }
    : { type: 'differ', label: 'Differ' };
}

/**
 * StatusIcon Component
 */
function StatusIcon({ type }) {
  if (type === 'match') return <CheckCircle />;
  if (type === 'differ') return <AlertTriangle />;
  if (type === 'missing') return <XCircle />;
  return null;
}

/**
 * TrackEditor Component
 * Displays a single track with editing capabilities
 */
export function TrackEditor({ track, trackNumber, musicBrainzData, onEdit, onApplyToAll, editable = true }) {
  const status = getTrackStatus(track, musicBrainzData);

  return (
    <TrackRow className={status.type}>
      <TrackNumber>
        <Music size={16} />
      </TrackNumber>

      <TrackTitle>
        {editable ? (
          <input
            type="text"
            value={track.title || ''}
            onChange={(e) => onEdit && onEdit({ ...track, title: e.target.value })}
            placeholder="Track title..."
          />
        ) : (
          track.title || <em style={{ color: theme.colors.text.dimmed }}>Untitled</em>
        )}
      </TrackTitle>

      <TrackAlbum>
        {track.album || musicBrainzData?.album || '—'}
      </TrackAlbum>

      <TrackStatus className={status.type}>
        <StatusIcon type={status.type} />
        {status.label}
      </TrackStatus>

      {editable && musicBrainzData && (
        <ActionButton
          onClick={() => onApplyToAll && onApplyToAll(track)}
          title="Apply to all tracks"
        >
          <Copy />
        </ActionButton>
      )}
    </TrackRow>
  );
}

export default TrackEditor;
