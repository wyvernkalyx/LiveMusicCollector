import React from 'react';
import styled from '@emotion/styled';
import { Settings, FolderOpen, Database, Music, Bell, Palette, Info, Save } from 'lucide-react';
import { theme } from '../styles/globalStyles';
import { useStore } from '../store';

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

const SettingsSections = styled.div`
  flex: 1;
  overflow-y: auto;
`;

const Section = styled.div`
  background: ${theme.colors.background.surface};
  border-radius: ${theme.borderRadius.lg};
  padding: ${theme.spacing.lg};
  margin-bottom: ${theme.spacing.lg};

  h3 {
    font-size: ${theme.typography.fontSize.lg};
    font-weight: 500;
    margin-bottom: ${theme.spacing.md};
    display: flex;
    align-items: center;
    gap: ${theme.spacing.sm};

    svg {
      width: 20px;
      height: 20px;
      color: ${theme.colors.accent.primary};
    }
  }
`;

const SettingRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: ${theme.spacing.md} 0;
  border-bottom: 1px solid ${theme.colors.border};

  &:last-child {
    border-bottom: none;
  }

  .label {
    flex: 1;

    .title {
      font-weight: 500;
      margin-bottom: ${theme.spacing.xs};
    }

    .description {
      font-size: ${theme.typography.fontSize.sm};
      color: ${theme.colors.text.secondary};
    }
  }

  .control {
    display: flex;
    align-items: center;
    gap: ${theme.spacing.sm};

    input[type="text"],
    input[type="number"],
    select {
      padding: ${theme.spacing.sm} ${theme.spacing.md};
      background: ${theme.colors.background.secondary};
      border: 1px solid ${theme.colors.border};
      border-radius: ${theme.borderRadius.sm};
      color: ${theme.colors.text.primary};
      min-width: 200px;
    }

    button {
      padding: ${theme.spacing.sm} ${theme.spacing.md};
      background: ${theme.colors.background.elevated};
      border-radius: ${theme.borderRadius.sm};

      &:hover {
        background: ${theme.colors.accent.primary};
        color: white;
      }
    }
  }
`;

const Toggle = styled.label`
  position: relative;
  display: inline-block;
  width: 48px;
  height: 24px;

  input {
    opacity: 0;
    width: 0;
    height: 0;
  }

  .slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: ${theme.colors.background.elevated};
    transition: ${theme.transitions.fast};
    border-radius: 24px;

    &:before {
      position: absolute;
      content: "";
      height: 18px;
      width: 18px;
      left: 3px;
      bottom: 3px;
      background-color: white;
      transition: ${theme.transitions.fast};
      border-radius: 50%;
    }
  }

  input:checked + .slider {
    background-color: ${theme.colors.accent.primary};
  }

  input:checked + .slider:before {
    transform: translateX(24px);
  }
`;

const ActionBar = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: ${theme.spacing.md};
  padding: ${theme.spacing.lg} 0;
  border-top: 1px solid ${theme.colors.border};

  button {
    padding: ${theme.spacing.sm} ${theme.spacing.lg};
    border-radius: ${theme.borderRadius.md};

    &.primary {
      background: ${theme.colors.accent.primary};
      color: white;

      &:hover {
        background: ${theme.colors.accent.secondary};
      }
    }

    &.secondary {
      background: ${theme.colors.background.surface};
      color: ${theme.colors.text.primary};

      &:hover {
        background: ${theme.colors.background.elevated};
      }
    }
  }
`;

const Stats = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: ${theme.spacing.md};
  padding: ${theme.spacing.md};
  background: ${theme.colors.background.secondary};
  border-radius: ${theme.borderRadius.md};

  .stat {
    text-align: center;

    .value {
      font-size: ${theme.typography.fontSize.xl};
      font-weight: 600;
      color: ${theme.colors.accent.primary};
    }

    .label {
      font-size: ${theme.typography.fontSize.sm};
      color: ${theme.colors.text.secondary};
    }
  }
`;

function SettingsPage() {
  const { settings, updateSettings, stats } = useStore();
  const [localSettings, setLocalSettings] = React.useState({
    libraryPath: '',
    importCopyFiles: true,
    autoNormalize: true,
    preferredFormat: 'flac',
    darkMode: true,
    notifications: true,
    autoPlayNext: true,
    crossfadeDuration: 0,
    bandFocus: 'Grateful Dead'
  });
  const [hasLoaded, setHasLoaded] = React.useState(false);

  // Load settings from persistent storage on mount
  React.useEffect(() => {
    const loadSettings = async () => {
      if (window.api) {
        try {
          const allSettings = await window.api.getAllSettings();
          if (allSettings) {
            setLocalSettings({
              libraryPath: allSettings.libraryPath || '',
              importCopyFiles: allSettings.importCopyFiles ?? true,
              autoNormalize: allSettings.autoNormalize ?? true,
              preferredFormat: allSettings.preferredFormat || 'flac',
              darkMode: allSettings.darkMode ?? true,
              notifications: allSettings.notifications ?? true,
              autoPlayNext: allSettings.autoPlayNext ?? true,
              crossfadeDuration: allSettings.crossfadeDuration || 0,
              bandFocus: allSettings.bandFocus || 'Grateful Dead'
            });
          }
        } catch (error) {
          console.error('Error loading settings:', error);
        }
      }
      setHasLoaded(true);
    };

    loadSettings();
  }, []);

  const handleSelectLibraryPath = async () => {
    if (window.api) {
      const result = await window.api.openDirectory();
      if (!result.canceled) {
        const newPath = result.filePaths[0];
        setLocalSettings({ ...localSettings, libraryPath: newPath });
        // Save immediately when library path is selected
        await window.api.setSettings('libraryPath', newPath);
        updateSettings({ libraryPath: newPath });
      }
    }
  };

  const handleSave = async () => {
    // Save all settings to persistent storage
    if (window.api) {
      for (const [key, value] of Object.entries(localSettings)) {
        await window.api.setSettings(key, value);
      }
    }
    updateSettings(localSettings);
    alert('Settings saved successfully!');
  };

  const handleReset = () => {
    setLocalSettings({
      libraryPath: '',
      importCopyFiles: true,
      autoNormalize: true,
      preferredFormat: 'flac',
      darkMode: true,
      notifications: true,
      autoPlayNext: true,
      crossfadeDuration: 0,
      bandFocus: 'Grateful Dead'
    });
  };

  const formatSize = (bytes) => {
    if (!bytes) return '0 GB';
    const gb = bytes / (1024 * 1024 * 1024);
    return `${gb.toFixed(1)} GB`;
  };

  if (!hasLoaded) {
    return (
      <PageContainer>
        <div style={{ padding: theme.spacing.lg, textAlign: 'center' }}>
          Loading settings...
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <Header>
        <h2>Settings</h2>
        <p>Configure your Live Music Collector preferences</p>
      </Header>

      <SettingsSections>
        <Section>
          <h3>
            <FolderOpen />
            Library Settings
          </h3>

          <SettingRow>
            <div className="label">
              <div className="title">Library Location</div>
              <div className="description">Where your music files are stored</div>
            </div>
            <div className="control">
              <input
                type="text"
                value={localSettings.libraryPath}
                onChange={(e) => setLocalSettings({ ...localSettings, libraryPath: e.target.value })}
                placeholder="No library path set"
              />
              <button onClick={handleSelectLibraryPath}>Browse</button>
            </div>
          </SettingRow>

          <SettingRow>
            <div className="label">
              <div className="title">Copy Files to Library</div>
              <div className="description">Copy imported files to library folder instead of moving</div>
            </div>
            <div className="control">
              <Toggle>
                <input
                  type="checkbox"
                  checked={localSettings.importCopyFiles}
                  onChange={(e) => setLocalSettings({ ...localSettings, importCopyFiles: e.target.checked })}
                />
                <span className="slider"></span>
              </Toggle>
            </div>
          </SettingRow>

          <SettingRow>
            <div className="label">
              <div className="title">Auto-Normalize Metadata</div>
              <div className="description">Automatically normalize song titles and venue names</div>
            </div>
            <div className="control">
              <Toggle>
                <input
                  type="checkbox"
                  checked={localSettings.autoNormalize}
                  onChange={(e) => setLocalSettings({ ...localSettings, autoNormalize: e.target.checked })}
                />
                <span className="slider"></span>
              </Toggle>
            </div>
          </SettingRow>

          <SettingRow>
            <div className="label">
              <div className="title">Preferred Format</div>
              <div className="description">Default audio format for imports</div>
            </div>
            <div className="control">
              <select
                value={localSettings.preferredFormat}
                onChange={(e) => setLocalSettings({ ...localSettings, preferredFormat: e.target.value })}
              >
                <option value="flac">FLAC (Lossless)</option>
                <option value="alac">ALAC (Apple Lossless)</option>
                <option value="wav">WAV (Uncompressed)</option>
                <option value="mp3">MP3 (Compressed)</option>
              </select>
            </div>
          </SettingRow>
        </Section>

        <Section>
          <h3>
            <Music />
            Playback Settings
          </h3>

          <SettingRow>
            <div className="label">
              <div className="title">Auto-Play Next Track</div>
              <div className="description">Automatically play the next track when one ends</div>
            </div>
            <div className="control">
              <Toggle>
                <input
                  type="checkbox"
                  checked={localSettings.autoPlayNext}
                  onChange={(e) => setLocalSettings({ ...localSettings, autoPlayNext: e.target.checked })}
                />
                <span className="slider"></span>
              </Toggle>
            </div>
          </SettingRow>

          <SettingRow>
            <div className="label">
              <div className="title">Crossfade Duration</div>
              <div className="description">Seconds to crossfade between tracks</div>
            </div>
            <div className="control">
              <input
                type="number"
                min="0"
                max="10"
                value={localSettings.crossfadeDuration}
                onChange={(e) => setLocalSettings({ ...localSettings, crossfadeDuration: parseInt(e.target.value) })}
              />
            </div>
          </SettingRow>
        </Section>

        <Section>
          <h3>
            <Palette />
            Appearance
          </h3>

          <SettingRow>
            <div className="label">
              <div className="title">Dark Mode</div>
              <div className="description">Use dark theme for the interface</div>
            </div>
            <div className="control">
              <Toggle>
                <input
                  type="checkbox"
                  checked={localSettings.darkMode}
                  onChange={(e) => setLocalSettings({ ...localSettings, darkMode: e.target.checked })}
                />
                <span className="slider"></span>
              </Toggle>
            </div>
          </SettingRow>

          <SettingRow>
            <div className="label">
              <div className="title">Show Notifications</div>
              <div className="description">Display system notifications for imports and playback</div>
            </div>
            <div className="control">
              <Toggle>
                <input
                  type="checkbox"
                  checked={localSettings.notifications}
                  onChange={(e) => setLocalSettings({ ...localSettings, notifications: e.target.checked })}
                />
                <span className="slider"></span>
              </Toggle>
            </div>
          </SettingRow>
        </Section>

        <Section>
          <h3>
            <Database />
            Database Statistics
          </h3>

          <Stats>
            <div className="stat">
              <div className="value">{stats?.totalShows || 0}</div>
              <div className="label">Total Shows</div>
            </div>
            <div className="stat">
              <div className="value">{stats?.totalTracks || 0}</div>
              <div className="label">Total Tracks</div>
            </div>
            <div className="stat">
              <div className="value">{stats?.totalRecordings || 0}</div>
              <div className="label">Recordings</div>
            </div>
            <div className="stat">
              <div className="value">{formatSize(stats?.totalSize)}</div>
              <div className="label">Library Size</div>
            </div>
          </Stats>

          <div style={{ marginTop: theme.spacing.lg }}>
            <button
              onClick={async () => {
                if (window.confirm('Are you sure you want to clear all data from the database? This cannot be undone.')) {
                  const result = await window.api.clearDatabase();
                  if (result.success) {
                    alert('Database cleared successfully. Please refresh the app.');
                    window.location.reload();
                  } else {
                    alert('Error clearing database: ' + result.error);
                  }
                }
              }}
              style={{
                padding: `${theme.spacing.sm} ${theme.spacing.lg}`,
                background: theme.colors.status.error,
                color: 'white',
                borderRadius: theme.borderRadius.md,
                fontWeight: 500
              }}
            >
              Clear Database
            </button>
            <p style={{
              marginTop: theme.spacing.sm,
              fontSize: theme.typography.fontSize.sm,
              color: theme.colors.text.secondary
            }}>
              Warning: This will delete all shows, recordings, and tracks from the database.
            </p>
          </div>
        </Section>

        <Section>
          <h3>
            <Info />
            About
          </h3>

          <div style={{ color: theme.colors.text.secondary }}>
            <p>Live Music Collector v0.1.0</p>
            <p style={{ marginTop: theme.spacing.sm }}>
              A desktop application for managing live music collections with advanced
              metadata normalization and search capabilities.
            </p>
            <p style={{ marginTop: theme.spacing.md }}>
              Built with Electron, React, and SQLite
            </p>
          </div>
        </Section>
      </SettingsSections>

      <ActionBar>
        <button className="secondary" onClick={handleReset}>
          Reset to Defaults
        </button>
        <button className="primary" onClick={handleSave}>
          <Save style={{ width: 16, height: 16, marginRight: theme.spacing.xs }} />
          Save Settings
        </button>
      </ActionBar>
    </PageContainer>
  );
}

export default SettingsPage;