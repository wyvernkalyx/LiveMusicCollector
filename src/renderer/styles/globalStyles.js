import { css } from '@emotion/react';

export const theme = {
  colors: {
    // Background levels
    background: {
      primary: '#121212',
      secondary: '#1e1e1e',
      elevated: '#232323',
      surface: '#2a2a2a',
    },
    // Text colors
    text: {
      primary: 'rgba(255, 255, 255, 0.87)',
      secondary: 'rgba(255, 255, 255, 0.60)',
      disabled: 'rgba(255, 255, 255, 0.38)',
    },
    // Accent colors
    accent: {
      primary: '#4a90e2',
      secondary: '#bb86fc',
    },
    // Status colors
    status: {
      success: '#27ae60',
      warning: '#f39c12',
      error: '#cf6679',
      info: '#4a90e2',
    },
    // Semantic colors (for backwards compatibility)
    success: '#27ae60',
    warning: '#f39c12',
    error: '#cf6679',
    // Borders
    border: 'rgba(255, 255, 255, 0.12)',
  },
  // Border radius
  borderRadius: {
    sm: '4px',
    md: '8px',
    lg: '12px',
    xl: '16px',
    full: '9999px',
  },
  // Spacing
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
  },
  // Typography
  typography: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontSize: {
      xs: '11px',
      sm: '12px',
      base: '14px',
      lg: '16px',
      xl: '18px',
      '2xl': '24px',
    },
  },
  // Transitions
  transitions: {
    fast: '150ms ease-in-out',
    normal: '250ms ease-in-out',
    slow: '350ms ease-in-out',
  },
  // Shadows
  shadows: {
    sm: '0 1px 3px rgba(0, 0, 0, 0.3)',
    md: '0 4px 6px rgba(0, 0, 0, 0.3)',
    lg: '0 10px 15px rgba(0, 0, 0, 0.3)',
  },
};

export const globalStyles = css`
  * {
    box-sizing: border-box;
  }

  html, body {
    margin: 0;
    padding: 0;
    height: 100%;
    overflow: hidden;
  }

  body {
    font-family: ${theme.typography.fontFamily};
    font-size: ${theme.typography.fontSize.base};
    background-color: ${theme.colors.background.primary};
    color: ${theme.colors.text.primary};
    line-height: 1.5;
  }

  #root {
    height: 100vh;
    display: flex;
    flex-direction: column;
  }

  /* Scrollbar styling */
  ::-webkit-scrollbar {
    width: 12px;
    height: 12px;
  }

  ::-webkit-scrollbar-track {
    background: ${theme.colors.background.secondary};
  }

  ::-webkit-scrollbar-thumb {
    background: ${theme.colors.background.surface};
    border-radius: 6px;
  }

  ::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.2);
  }

  /* Selection */
  ::selection {
    background-color: ${theme.colors.accent.primary};
    color: white;
  }

  /* Focus styles */
  :focus-visible {
    outline: 2px solid ${theme.colors.accent.primary};
    outline-offset: 2px;
  }

  /* Links */
  a {
    color: ${theme.colors.accent.primary};
    text-decoration: none;
    transition: color ${theme.transitions.fast};
  }

  a:hover {
    color: ${theme.colors.accent.secondary};
  }

  /* Buttons reset */
  button {
    font-family: inherit;
    font-size: inherit;
    cursor: pointer;
    border: none;
    background: none;
    color: inherit;
    padding: 0;
  }

  /* Input reset */
  input, textarea, select {
    font-family: inherit;
    font-size: inherit;
    color: inherit;
    background: ${theme.colors.background.surface};
    border: 1px solid ${theme.colors.border};
    border-radius: 4px;
    padding: ${theme.spacing.sm};
  }

  /* Tables */
  table {
    border-collapse: collapse;
    width: 100%;
  }

  /* Headings */
  h1, h2, h3, h4, h5, h6 {
    margin: 0;
    font-weight: 600;
  }

  h1 { font-size: ${theme.typography.fontSize['2xl']}; }
  h2 { font-size: ${theme.typography.fontSize.xl}; }
  h3 { font-size: ${theme.typography.fontSize.lg}; }

  /* Lists */
  ul, ol {
    margin: 0;
    padding: 0;
    list-style: none;
  }

  /* Code */
  code {
    font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
    font-size: ${theme.typography.fontSize.sm};
    background: ${theme.colors.background.surface};
    padding: 2px 4px;
    border-radius: 3px;
  }

  /* Utility classes */
  .truncate {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border-width: 0;
  }
  `;
