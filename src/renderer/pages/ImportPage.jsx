import React from 'react';
import styled from '@emotion/styled';
import { Upload, Folder, File, Check, X, Loader, Info } from 'lucide-react';
import { theme } from '../styles/globalStyles';
import { useStore } from '../store';
import ImportMetadataReviewV2 from '../components/ImportMetadataReviewV2';

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

const ImportOptions = styled.div`
  background: ${theme.colors.background.surface};
  border-radius: ${theme.borderRadius.lg};
  padding: ${theme.spacing.lg};
  margin-bottom: ${theme.spacing.lg};
  display: flex;
  flex-wrap: wrap;
  gap: ${theme.spacing.lg};
`;

const Option = styled.label`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};
  color: ${theme.colors.text.primary};
  cursor: pointer;

  input[type="checkbox"] {
    width: 18px;
    height: 18px;
    cursor: pointer;
  }

  span {
    font-size: ${theme.typography.fontSize.md};
  }
`;

const FileList = styled.div`
  flex: 1;
  background: ${theme.colors.background.surface};
  border-radius: ${theme.borderRadius.lg};
  padding: ${theme.spacing.lg};
  overflow-y: auto;
  min-height: 200px;
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: ${theme.spacing.xl} ${theme.spacing.lg};
  color: ${theme.colors.text.secondary};
  text-align: center;
  height: 100%;
  min-height: 300px;

  svg {
    width: 48px;
    height: 48px;
    margin-bottom: ${theme.spacing.md};
    opacity: 0.5;
  }

  h3 {
    font-size: ${theme.typography.fontSize.lg};
    font-weight: 500;
    margin-bottom: ${theme.spacing.sm};
    color: ${theme.colors.text.primary};
  }

  p {
    font-size: ${theme.typography.fontSize.md};
  }
`;

const FileItem = styled.div`
  display: flex;
  align-items: center;
  padding: ${theme.spacing.sm} ${theme.spacing.md};
  border-bottom: 1px solid ${theme.colors.border};

  &:last-child {
    border-bottom: none;
  }

  .icon {
    margin-right: ${theme.spacing.sm};
    color: ${props =>
      props.status === 'success' ? theme.colors.status.success :
      props.status === 'error' ? theme.colors.status.error :
      props.status === 'processing' ? theme.colors.accent.primary :
      theme.colors.text.secondary
    };

    &.spin {
      animation: spin 1s linear infinite;
    }
  }

  .name {
    flex: 1;
    font-size: ${theme.typography.fontSize.md};
    color: ${theme.colors.text.primary};
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .size {
    margin-right: ${theme.spacing.md};
    color: ${theme.colors.text.secondary};
    font-size: ${theme.typography.fontSize.sm};
  }

  .error {
    color: ${theme.colors.status.error};
    font-size: ${theme.typography.fontSize.sm};
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

const ActionBar = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.md};
  padding: ${theme.spacing.lg};
  background: ${theme.colors.background.surface};
  border-radius: ${theme.borderRadius.lg};
  margin-top: ${theme.spacing.lg};

  button {
    padding: ${theme.spacing.sm} ${theme.spacing.lg};
    border-radius: ${theme.borderRadius.md};
    font-size: ${theme.typography.fontSize.md};
    font-weight: 500;

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }
`;

const ProgressBar = styled.div`
  flex: 1;
  height: 8px;
  background: ${theme.colors.background.elevated};
  border-radius: 4px;
  overflow: hidden;

  .fill {
    height: 100%;
    background: ${theme.colors.accent.primary};
    transition: width 0.3s ease;
  }
`;

function ImportPage() {
  const { importFiles, settings, initialize } = useStore();
  const [files, setFiles] = React.useState([]);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [showMetadataReview, setShowMetadataReview] = React.useState(false);
  const [analyzedGroups, setAnalyzedGroups] = React.useState([]);
  const [options, setOptions] = React.useState({
    copyToLibrary: true,
    autoNormalize: true,
    detectDuplicates: true,
    matchToShows: true,
    enableFingerprinting: true  // New option for audio fingerprinting
  });

  // Make sure settings are loaded
  React.useEffect(() => {
    if (!settings?.libraryPath) {
      initialize();
    }
  }, [settings, initialize]);

  const handleFolderSelect = async () => {
    if (!window.api) {
      console.error('API not available');
      return;
    }

    try {
      const result = await window.api.openDirectory();
      if (result && !result.canceled && result.filePaths.length > 0) {
        const folderPath = result.filePaths[0];
        console.log('Selected folder:', folderPath);

        setIsProcessing(true);

        try {
          // Scan the folder for audio files
          const scanResult = await window.api.scanFolder(folderPath);
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
    } catch (error) {
      console.error('Error selecting directory:', error);
      alert('Error selecting directory: ' + error.message);
    }
  };

  // Group files by show/album based on metadata
  const groupFilesByShow = (analyzedFiles, originalFiles) => {
    const groups = {};

    analyzedFiles.forEach((analyzed, index) => {
      const original = originalFiles[index];

      // Create a group key based on date and venue or album
      let groupKey;
      if (analyzed.album && (analyzed.isOfficialRelease || analyzed.officialRelease)) {
        groupKey = analyzed.album;
      } else {
        const date = analyzed.date || analyzed.performanceDate || analyzed.recordingDate || 'Unknown-Date';
        const venue = analyzed.venue || 'Unknown-Venue';
        groupKey = `${date}-${venue}`;
      }

      if (!groups[groupKey]) {
        groups[groupKey] = {
          date: analyzed.date || analyzed.performanceDate || analyzed.recordingDate,
          venue: analyzed.venue,
          city: analyzed.city,
          state: analyzed.state,
          album: analyzed.album,
          artist: analyzed.artist || 'Grateful Dead',
          isOfficialRelease: analyzed.isOfficialRelease || analyzed.officialRelease,
          sourceType: analyzed.sourceType || 'SBD',
          tracks: []
        };
      }

      groups[groupKey].tracks.push({
        ...analyzed,
        originalFile: original,
        filename: original.name,
        path: original.path,
        size: original.size
      });
    });

    return Object.values(groups);
  };

  const startImport = async () => {
    console.log('=== START IMPORT CLICKED ===');
    console.log('Number of files to import:', files.length);
    console.log('Import options:', options);

    // Check if library path is configured when copy option is enabled
    if (options.copyToLibrary && !settings?.libraryPath) {
      alert('Please configure a library location in Settings before importing with "Copy files to library folder" enabled.');
      return;
    }

    setIsProcessing(true);
    setProgress(0);

    const pendingFiles = files.filter(f => f.status === 'pending');

    // First, analyze files to get metadata
    try {
      console.log('Analyzing files for metadata...');
      const analyzedFiles = await window.api.analyzeFiles(
        pendingFiles.map(f => f.path),
        options
      );

      // Group files by album/show
      const grouped = groupFilesByShow(analyzedFiles, pendingFiles);

      console.log('Grouped files into', grouped.length, 'shows/albums');
      setAnalyzedGroups(grouped);

      // Show metadata review dialog
      setShowMetadataReview(true);
      setIsProcessing(false);
    } catch (error) {
      console.error('Error analyzing files:', error);
      alert('Error analyzing files: ' + error.message);
      setIsProcessing(false);
    }
  };

  // Handle confirmed import after metadata review
  const handleConfirmedImport = async (editedGroups) => {
    console.log('=== HANDLE CONFIRMED IMPORT ===');
    console.log('Received groups:', editedGroups.length);
    editedGroups.forEach((group, i) => {
      console.log(`Group ${i + 1}: ${group.tracks?.length || 0} tracks`);
    });

    setShowMetadataReview(false);
    setIsProcessing(true);
    setProgress(0);

    const pendingFiles = files.filter(f => f.status === 'pending');
    const total = pendingFiles.length;

    // Prepare all files with edited metadata
    const allFileData = [];
    editedGroups.forEach(group => {
      group.tracks.forEach(track => {
        allFileData.push({
          path: track.path,
          name: track.filename,
          size: track.size,
          // Include the edited metadata
          date: group.date,
          venue: group.venue,
          city: group.city,
          state: group.state,
          album: group.album,
          artist: group.artist,
          isOfficialRelease: group.isOfficialRelease,
          sourceType: group.sourceType,
          title: track.title,
          duration: track.duration,
          performanceDate: group.date,
          recordingDate: track.recordingDate
        });
      });
    });

    // Include library path from settings if copying files
    const importOptions = {
      ...options,
      libraryPath: options.copyToLibrary ? (settings?.libraryPath || '') : ''
    };

    console.log('Importing files with reviewed metadata');
    console.log('Import options:', importOptions);
    console.log('Total files to process:', allFileData.length);

    try {
      // Import all files with the edited metadata
      const results = await importFiles(allFileData, importOptions);

      // Update file statuses based on results
      setFiles(prev => prev.map(file => {
        const index = pendingFiles.findIndex(pf => pf.id === file.id);
        if (index >= 0 && results && results[index]) {
          const result = results[index];
          if (result.error) {
            return { ...file, status: 'error', error: result.error };
          } else {
            return { ...file, status: 'success' };
          }
        }
        return file;
      }));

      setProgress(100);
    } catch (error) {
      console.error('Import error:', error);
      // Mark all files as error if batch import fails
      setFiles(prev => prev.map(f =>
        pendingFiles.some(pf => pf.id === f.id)
          ? { ...f, status: 'error', error: error.message }
          : f
      ));
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
                checked={options.enableFingerprinting}
                onChange={(e) => setOptions({ ...options, enableFingerprinting: e.target.checked })}
              />
              <span>Enable audio fingerprinting (MusicBrainz/AcoustID)</span>
            </Option>
            <Option>
              <input
                type="checkbox"
                checked={options.detectDuplicates}
                onChange={(e) => setOptions({ ...options, detectDuplicates: e.target.checked })}
              />
              <span>Detect duplicates</span>
            </Option>
            <Option>
              <input
                type="checkbox"
                checked={options.matchToShows}
                onChange={(e) => setOptions({ ...options, matchToShows: e.target.checked })}
              />
              <span>Match to existing shows</span>
            </Option>
      </ImportOptions>

      <FileList>
        {files.length === 0 ? (
          <EmptyState>
            <Upload />
            <h3>No files selected</h3>
            <p>Select a folder to import music files</p>
          </EmptyState>
        ) : (
          files.map(file => (
            <FileItem key={file.id} status={file.status}>
              <div className="icon">
                {getFileIcon(file.status)}
              </div>
              <span className="name">{file.name}</span>
              <span className="size">{formatFileSize(file.size)}</span>
              {file.error && <span className="error">{file.error}</span>}
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
              {isProcessing ? 'Analyzing...' : `Import ${files.filter(f => f.status === 'pending').length} Files`}
            </button>
      </ActionBar>

      {showMetadataReview && (
        <ImportMetadataReviewV2
          fileGroups={analyzedGroups}
          onConfirm={handleConfirmedImport}
          onCancel={() => {
            setShowMetadataReview(false);
            setIsProcessing(false);
          }}
        />
      )}
    </PageContainer>
  );
}

export default ImportPage;