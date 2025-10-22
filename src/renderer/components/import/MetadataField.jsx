import React from 'react';
import styled from '@emotion/styled';
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { theme } from '../../styles/globalStyles';

const Container = styled.div`
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
  grid-template-columns: 1fr 1fr;
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

    &::placeholder {
      color: ${theme.colors.text.dimmed};
    }
  }
`;

/**
 * Get comparison status between current and new values
 */
function getComparisonStatus(currentValue, newValue) {
  const hasCurrentValue = currentValue !== null && currentValue !== undefined && currentValue !== '';
  const hasNewValue = newValue !== null && newValue !== undefined && newValue !== '';

  if (!hasCurrentValue && !hasNewValue) return 'empty';
  if (!hasNewValue) return 'missing';
  if (!hasCurrentValue) return 'new';

  return String(currentValue).trim() === String(newValue).trim() ? 'match' : 'differ';
}

/**
 * Get status icon based on comparison result
 */
function StatusIcon({ status, className }) {
  if (status === 'match') {
    return <CheckCircle className={`status-icon match ${className}`} />;
  }
  if (status === 'differ') {
    return <AlertTriangle className={`status-icon differ ${className}`} />;
  }
  if (status === 'missing') {
    return <XCircle className={`status-icon missing ${className}`} />;
  }
  return null;
}

/**
 * MetadataField Component
 * Displays a comparison between current and new metadata values
 */
export function MetadataField({
  label,
  icon: Icon,
  currentValue,
  newValue,
  onCurrentChange,
  editable = true,
  placeholder = ''
}) {
  const status = getComparisonStatus(currentValue, newValue);
  const displayCurrent = currentValue || '';
  const displayNew = newValue || 'Not available';

  return (
    <Container>
      <FieldHeader>
        {Icon && <Icon size={14} />}
        {label}
        <StatusIcon status={status} />
      </FieldHeader>

      <ComparisonRow>
        <ValueBox
          className={`current ${status === 'empty' && !displayCurrent ? 'empty' : ''} ${status === 'match' ? 'match' : ''} ${status === 'differ' ? 'differ' : ''}`}
        >
          <span className="label">Current</span>
          {editable ? (
            <input
              type="text"
              value={displayCurrent}
              onChange={(e) => onCurrentChange && onCurrentChange(e.target.value)}
              placeholder={placeholder}
            />
          ) : (
            <span>{displayCurrent || <em style={{ color: theme.colors.text.dimmed }}>Not set</em>}</span>
          )}
        </ValueBox>

        <ValueBox className={`musicbrainz ${!newValue ? 'empty' : ''}`}>
          <span className="label">MusicBrainz</span>
          {newValue || <em style={{ color: theme.colors.text.dimmed }}>Not available</em>}
        </ValueBox>
      </ComparisonRow>
    </Container>
  );
}

export default MetadataField;
