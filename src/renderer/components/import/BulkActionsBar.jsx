import React from 'react';
import styled from '@emotion/styled';
import { RefreshCw, Save, X, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { theme } from '../../styles/globalStyles';

const Container = styled.div`
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
`;

const Button = styled.button`
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

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

const Stats = styled.div`
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
`;

/**
 * BulkActionsBar Component
 * Displays actions and statistics for bulk metadata operations
 */
export function BulkActionsBar({
  onFingerprint,
  onSave,
  onCancel,
  isProcessing,
  stats,
  disabled
}) {
  return (
    <Container>
      <div className="actions-left">
        <Button
          onClick={onFingerprint}
          disabled={disabled || isProcessing}
        >
          <RefreshCw className={isProcessing ? 'spinning' : ''} />
          {isProcessing ? 'Processing...' : 'Run Fingerprinting'}
        </Button>
      </div>

      {stats && (
        <Stats>
          {stats.match > 0 && (
            <span className="stat match">
              <CheckCircle size={14} />
              {stats.match} Match
            </span>
          )}
          {stats.differ > 0 && (
            <span className="stat differ">
              <AlertTriangle size={14} />
              {stats.differ} Differ
            </span>
          )}
          {stats.missing > 0 && (
            <span className="stat missing">
              <XCircle size={14} />
              {stats.missing} Missing
            </span>
          )}
        </Stats>
      )}

      <div className="actions-right">
        <Button onClick={onCancel} disabled={isProcessing}>
          <X />
          Cancel
        </Button>
        <Button
          className="primary"
          onClick={onSave}
          disabled={disabled || isProcessing}
        >
          <Save />
          Import Files
        </Button>
      </div>
    </Container>
  );
}

export default BulkActionsBar;
