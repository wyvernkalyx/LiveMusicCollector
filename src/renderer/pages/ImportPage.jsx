import React from 'react';
import styled from '@emotion/styled';
import { Upload, Folder, File, Check, X, Loader, Info } from 'lucide-react';
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

const SelectionBar = styled.div`
  display: flex;
  gap: ${theme.spacing.md};
  margin-bottom: ${theme.spacing.md};

  button {
    padding: ${theme.spacing.sm} ${theme.spacing.lg};
    background: ${theme.colors.accent.primary};
    color: white;
    border-radius: ${theme.borderRadius.md};
    display: flex;
    align-items: center;
    gap: ${theme.spacing.xs};
    font-size: ${theme.typography.fontSize.md};

    &:hover {
      background: ${theme.colors.accent.secondary};
    }

    svg {
      width: 18px;
      height: 18px;
    }
  }
`;

const FileList = styled.div`
  flex: 1;
  overflow-y: auto;
  background: ${theme.colors.background.surface};
  border-radius: ${theme.borderRadius.lg};
  padding: ${theme.spacing.md};
`;

const FileItem = styled.div`
  display: flex;
  align-items: center;
  padding: ${theme.spacing.sm};
  border-radius: ${theme.borderRadius.md};
  margin-bottom: ${theme.spacing.xs};
  background: ${props => {
    if (props.status === 'success') return theme.colors.status.success + '10';
    if (props.status === 'error') return theme.colors.status.error + '10';
    if (props.status === 'processing') return theme.colors.status.info + '10';
    return theme.colors.background.secondary;
  }};

  svg {
    width: 16px;
    height: 16px;
    margin-right: ${theme.spacing.sm};
    color: ${props => {
      if (props.status === 'success') return theme.colors.status.success;
      if (props.status === 'error') return theme.colors.status.error;
      if (props.status === 'processing') return theme.colors.status.info;
      return theme.colors.text.secondary;
    }};
  }

  .filename {
    flex: 1;
    font-family: 'Consolas', monospace;
    font-size: ${theme.typography.fontSize.sm};
  }

  .info {
    display: flex;
    gap: ${theme.spacing.md};
    font-size: ${theme.typography.fontSize.sm};
    color: ${theme.colors.text.secondary};
  }
`;

const ImportOptions = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: ${theme.spacing.md};
  margin-bottom: ${theme.spacing.md};
  padding: ${theme.spacing.md};
  background: ${theme.colors.background.surface};
  border-radius: ${theme.borderRadius.lg};
`;

const Option = styled.label`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};
  cursor: pointer;

  input[type="checkbox"] {
    width: 16px;
    height: 16px;
  }

  span {
    font-size: ${theme.typography.fontSize.sm};
  }
`;

const ActionBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: ${theme.spacing.md} 0;
  border-top: 1px solid ${theme.colors.border};
  margin-top: ${theme.spacing.lg};
`;

const ProgressBar = styled.div`
  flex: 1;
  height: 8px;
  background: ${theme.colors.background.surface};
  border-radius: 4px;
  margin: 0 ${theme.spacing.lg};
  overflow: hidden;

  .fill {
    height: 100%;
    background: ${theme.colors.accent.primary};
    transition: width ${theme.transitions.fast};
  }
`;

function ImportPage() {
  const { importFiles, settings, initialize } = useStore();
  const [files, setFiles] = React.useState([]);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [options, setOptions] = React.useState({
    copyToLibrary: true,
    autoNormalize: true,
    detectDuplicates: true,
    matchToShows: true
  });

  // Make sure settings are loaded
  React.useEffect(() => {
    if (!settings?.libraryPath) {
      initialize();
    }
  }, [initialize, settings]);


  const handleFolderSelect = async () => {
    if (window.api) {
      const result = await window.api.openDirectory();
      if (!result.canceled) {
        const folderPath = result.filePaths[0];
        console.log('Scanning folder:', folderPath);
        setIsProcessing(true);

        try {
          // Scan the folder for audio files
          const scanResult = await window.api.scanFolder(folderPath, {
            recursive: true,
            skipExisting: options.detectDuplicates
          });

          console.log('Scan result:', scanResult);

          // Add found files to the import list
          if (scanResult.files && scanResult.files.length > 0) {
            const fileItems = scanResult.files.map(file => ({
              id: Math.random().toString(36).substr(2, 9),
              name: file.name,
              path: file.path,
              size: file.size,
              status: 'pending',
              isFromFolder: true
            }));

            setFiles(prev => [...prev, ...fileItems]);
          } else {
            alert('No audio files found in the selected folder');
          }
        } catch (error) {
          console.error('Error scanning folder:', error);
          alert('Error scanning folder: ' + error.message);
        } finally {
          setIsProcessing(false);
        }
      }
    }
  };


  const startImport = async () => {
    // Check if library path is configured when copy option is enabled
    if (options.copyToLibrary && !settings?.libraryPath) {
      alert('Please configure a library location in Settings before importing with "Copy files to library folder" enabled.');
      return;
    }

    setIsProcessing(true);
    setProgress(0);

    const pendingFiles = files.filter(f => f.status === 'pending');
    const total = pendingFiles.length;

    for (let i = 0; i < pendingFiles.length; i++) {
      const file = pendingFiles[i];

      setFiles(prev => prev.map(f =>
        f.id === file.id ? { ...f, status: 'processing' } : f
      ));

      try {
        // Pass the file objects with proper structure to the import function
        const fileData = [{
          path: file.path,
          name: file.name,
          size: file.size
        }];

        // Include library path from settings if copying files
        const importOptions = {
          ...options,
          libraryPath: options.copyToLibrary ? (settings?.libraryPath || '') : ''
        };

        console.log('Import options:', importOptions);
        console.log('Settings library path:', settings?.libraryPath);

        await importFiles(fileData, importOptions);

        setFiles(prev => prev.map(f =>
          f.id === file.id ? { ...f, status: 'success' } : f
        ));
      } catch (error) {
        console.error('Import error:', error);
        setFiles(prev => prev.map(f =>
          f.id === file.id ? { ...f, status: 'error', error: error.message } : f
        ));
      }

      setProgress(((i + 1) / total) * 100);
    }

    setIsProcessing(false);
  };

  const clearFiles = () => {
    setFiles([]);
    setProgress(0);
  };

  const getFileIcon = (status) => {
    switch (status) {
      case 'success': return <Check />;
      case 'error': return <X />;
      case 'processing': return <Loader className="spin" />;
      default: return <File />;
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 MB';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  return (
    <PageContainer>
      <Header>
        <h2>Import Music</h2>
        <p>Add new recordings to your library</p>
      </Header>

      <SelectionBar>
        <button onClick={handleFolderSelect}>
          <Folder />
          Select Folder
        </button>
      </SelectionBar>

      <ImportOptions>
            <Option>
              <input
                type="checkbox"
                checked={options.copyToLibrary}
                onChange={(e) => setOptions({ ...options, copyToLibrary: e.target.checked })}
              />
              <span>Copy files to library folder</span>
            </Option>
            <Option>
              <input
                type="checkbox"
                checked={options.autoNormalize}
                onChange={(e) => setOptions({ ...options, autoNormalize: e.target.checked })}
              />
              <span>Auto-normalize metadata</span>
            </Option>
            <Option>
              <input
                type="checkbox"
                checked={options.detectDuplicates}
                onChange={(e) => setOptions({ ...options, detectDuplicates: e.target.checked })}
              />
              <span>Detect duplicate recordings</span>
            </Option>
            <Option>
              <input
                type="checkbox"
                checked={options.matchToShows}
                onChange={(e) => setOptions({ ...options, matchToShows: e.target.checked })}
              />
              <span>Match to known shows</span>
            </Option>
      </ImportOptions>

      <FileList>
        {files.length === 0 ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: theme.colors.text.secondary
          }}>
            <Info style={{ width: 48, height: 48, marginBottom: theme.spacing.md }} />
            <p>No files selected. Click "Select Folder" to choose a folder containing your music files.</p>
            <p style={{ marginTop: theme.spacing.sm, fontSize: theme.typography.fontSize.sm }}>Supports FLAC, MP3, WAV, ALAC, and M4A files</p>
          </div>
        ) : (
          files.map(file => (
            <FileItem key={file.id} status={file.status}>
              {getFileIcon(file.status)}
              <span className="filename">{file.name}</span>
              <div className="info">
                <span>{formatFileSize(file.size)}</span>
                {file.isFromFolder && <span style={{ color: theme.colors.text.secondary }}>📁</span>}
                {file.error && <span style={{ color: theme.colors.status.error }}>{file.error}</span>}
              </div>
            </FileItem>
          ))
        )}
      </FileList>

      <ActionBar>
            <button
              onClick={clearFiles}
              disabled={isProcessing}
              style={{
                background: theme.colors.background.surface,
                color: theme.colors.text.primary
              }}
            >
              Clear All
            </button>

            {isProcessing && (
              <ProgressBar>
                <div className="fill" style={{ width: `${progress}%` }} />
              </ProgressBar>
            )}

            <button
              onClick={startImport}
              disabled={isProcessing || files.filter(f => f.status === 'pending').length === 0}
              style={{
                background: theme.colors.accent.primary,
                color: 'white'
              }}
            >
              {isProcessing ? 'Importing...' : `Import ${files.filter(f => f.status === 'pending').length} Files`}
            </button>
      </ActionBar>
    </PageContainer>
  );
}

export default ImportPage;