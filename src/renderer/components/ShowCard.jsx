import React from 'react';
import styled from '@emotion/styled';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, MapPin, Music, Disc, Mic, Calendar } from 'lucide-react';
import { theme } from '../styles/globalStyles';

const Card = styled.div`
  background: ${theme.colors.background.surface};
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.borderRadius.md};
  padding: ${theme.spacing.md};
  margin-bottom: ${theme.spacing.sm};
  cursor: pointer;
  transition: all ${theme.transitions.fast};

  &:hover {
    background: ${theme.colors.background.elevated};
    transform: translateX(2px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  &.expanded {
    background: ${theme.colors.background.elevated};
  }
`;

const CardHeader = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.md};
`;

const ExpandIconWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform ${theme.transitions.fast};
  transform: ${props => props.$expanded ? 'rotate(90deg)' : 'rotate(0)'};

  svg {
    width: 20px;
    height: 20px;
    color: ${theme.colors.text.secondary};
  }
`;

const ShowInfo = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.xs};
`;

const ShowTitle = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.md};
  font-weight: 500;
  color: ${theme.colors.text.primary};
`;

const ShowDate = styled.span`
  font-size: ${theme.typography.fontSize.md};
`;

const ShowVenue = styled.span`
  color: ${theme.colors.text.secondary};
  display: flex;
  align-items: center;
  gap: ${theme.spacing.xs};

  svg {
    width: 14px;
    height: 14px;
  }
`;

const ShowMeta = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.lg};
  font-size: ${theme.typography.fontSize.sm};
  color: ${theme.colors.text.secondary};
`;

const MetaItem = styled.span`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.xs};

  svg {
    width: 14px;
    height: 14px;
  }
`;

const ShowActions = styled.div`
  display: flex;
  gap: ${theme.spacing.sm};
`;

const ActionButton = styled.button`
  padding: ${theme.spacing.xs} ${theme.spacing.sm};
  background: ${theme.colors.background.secondary};
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.borderRadius.sm};
  color: ${theme.colors.text.secondary};
  font-size: ${theme.typography.fontSize.sm};
  transition: all ${theme.transitions.fast};

  &:hover {
    background: ${theme.colors.primary};
    color: white;
    border-color: ${theme.colors.primary};
  }
`;

const SourceBadge = styled.span`
  padding: 2px 8px;
  background: ${props => {
    switch(props.type) {
      case 'SBD': return theme.colors.status.success + '20';
      case 'AUD': return theme.colors.status.info + '20';
      case 'MATRIX': return theme.colors.status.warning + '20';
      case 'OFFICIAL': return theme.colors.accent.primary + '20';
      default: return theme.colors.background.secondary;
    }
  }};
  color: ${props => {
    switch(props.type) {
      case 'SBD': return theme.colors.status.success;
      case 'AUD': return theme.colors.status.info;
      case 'MATRIX': return theme.colors.status.warning;
      case 'OFFICIAL': return theme.colors.accent.primary;
      default: return theme.colors.text.secondary;
    }
  }};
  border-radius: ${theme.borderRadius.sm};
  font-size: ${theme.typography.fontSize.xs};
  font-weight: 500;
`;

function ShowCard({
  show,
  expanded = false,
  onToggle,
  onAction,
  showActions = false,
  compact = false
}) {
  const navigate = useNavigate();

  const handleClick = (e) => {
    e.stopPropagation();
    // Navigate to album view by default
    navigate(`/album/${show.id}`);
  };

  const handleAction = (action, e) => {
    e.stopPropagation();
    if (action === 'tracks' || action === 'edit') {
      // Navigate to album view for tracks and edit
      navigate(`/album/${show.id}`);
    } else if (onAction) {
      onAction(action, show);
    }
  };

  const formatLocation = () => {
    const parts = [];
    if (show.venue_name && show.venue_name !== 'Unknown Venue') {
      parts.push(show.venue_name);
    }
    if (show.city) parts.push(show.city);
    if (show.state) parts.push(show.state);
    return parts.join(', ');
  };

  return (
    <Card className={expanded ? 'expanded' : ''} onClick={handleClick}>
      <CardHeader>
        {onToggle && (
          <ExpandIconWrapper $expanded={expanded}>
            <ChevronRight />
          </ExpandIconWrapper>
        )}

        <ShowInfo>
          <ShowTitle>
            <ShowDate>{show.date}</ShowDate>
            {show.venue_name && show.venue_name !== 'Unknown Venue' && (
              <ShowVenue>
                <MapPin />
                {formatLocation()}
              </ShowVenue>
            )}
            {show.source_type && (
              <SourceBadge type={show.source_type}>
                {show.source_type}
              </SourceBadge>
            )}
          </ShowTitle>

          {!compact && (
            <ShowMeta>
              {show.recording_count > 0 && (
                <MetaItem>
                  <Disc />
                  {show.recording_count} recording{show.recording_count !== 1 ? 's' : ''}
                </MetaItem>
              )}
              {show.track_count > 0 && (
                <MetaItem>
                  <Music />
                  {show.track_count} track{show.track_count !== 1 ? 's' : ''}
                </MetaItem>
              )}
              {show.quality_rating && (
                <MetaItem>
                  {'★'.repeat(Math.floor(show.quality_rating))}
                  {'☆'.repeat(5 - Math.floor(show.quality_rating))}
                </MetaItem>
              )}
            </ShowMeta>
          )}
        </ShowInfo>

        {showActions && (
          <ShowActions>
            <ActionButton onClick={(e) => handleAction('play', e)}>
              Play
            </ActionButton>
            <ActionButton onClick={(e) => handleAction('edit', e)}>
              Edit
            </ActionButton>
            <ActionButton onClick={(e) => handleAction('tracks', e)}>
              View Tracks
            </ActionButton>
          </ShowActions>
        )}
      </CardHeader>
    </Card>
  );
}

export default ShowCard;