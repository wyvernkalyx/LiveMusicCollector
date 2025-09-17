import React from 'react';
import styled from '@emotion/styled';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Volume2,
  Settings
} from 'lucide-react';
import { theme } from '../styles/globalStyles';
import { useStore } from '../store';

const PlayerContainer = styled.div`
  height: 64px;
  background: ${theme.colors.background.secondary};
  border-bottom: 1px solid ${theme.colors.border};
  display: flex;
  align-items: center;
  padding: 0 ${theme.spacing.lg};
  gap: ${theme.spacing.lg};
`;

const Controls = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};
  
  button {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    transition: all ${theme.transitions.fast};
    
    &:hover {
      background: ${theme.colors.background.surface};
    }
    
    &.play {
      width: 40px;
      height: 40px;
      background: ${theme.colors.accent.primary};
      color: white;
      
      &:hover {
        background: ${theme.colors.accent.secondary};
      }
    }
    
    svg {
      width: 18px;
      height: 18px;
    }
  }
`;

const TrackInfo = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  gap: ${theme.spacing.lg};
  min-width: 0;
`;

const TrackDetails = styled.div`
  flex: 1;
  min-width: 0;
  
  .title {
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  
  .artist {
    font-size: ${theme.typography.fontSize.sm};
    color: ${theme.colors.text.secondary};
  }
`;

const ProgressBar = styled.div`
  flex: 2;
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};
  
  .time {
    font-size: ${theme.typography.fontSize.sm};
    color: ${theme.colors.text.secondary};
    font-family: 'Consolas', monospace;
    min-width: 45px;
  }
  
  .bar {
    flex: 1;
    height: 4px;
    background: ${theme.colors.background.surface};
    border-radius: 2px;
    position: relative;
    cursor: pointer;
    
    .fill {
      position: absolute;
      left: 0;
      top: 0;
      height: 100%;
      background: ${theme.colors.accent.primary};
      border-radius: 2px;
      transition: width ${theme.transitions.fast};
    }
    
    .handle {
      position: absolute;
      top: 50%;
      transform: translate(-50%, -50%);
      width: 12px;
      height: 12px;
      background: white;
      border-radius: 50%;
      box-shadow: ${theme.shadows.sm};
      opacity: 0;
      transition: opacity ${theme.transitions.fast};
    }
    
    &:hover .handle {
      opacity: 1;
    }
  }
`;

const VolumeControl = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};
  width: 150px;
  
  svg {
    width: 18px;
    height: 18px;
    color: ${theme.colors.text.secondary};
  }
  
  .slider {
    flex: 1;
    height: 4px;
    background: ${theme.colors.background.surface};
    border-radius: 2px;
    position: relative;
    cursor: pointer;
    
    .fill {
      position: absolute;
      left: 0;
      top: 0;
      height: 100%;
      background: ${theme.colors.text.secondary};
      border-radius: 2px;
    }
  }
`;

function Player() {
  const { player, playTrack, pausePlayback, setVolume, setPlaylist } = useStore();
  const [progress, setProgress] = React.useState(0);
  const [currentTime, setCurrentTime] = React.useState('0:00');
  const [duration, setDuration] = React.useState('0:00');
  const audioRef = React.useRef(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState(null);

  // Format time in MM:SS
  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle track change
  React.useEffect(() => {
    const loadTrack = async () => {
      if (player.currentTrack && audioRef.current) {
        const track = player.currentTrack;

        // Get file path
        let audioPath = track.file_path || track.path;

        if (!audioPath) {
          console.error('No file path for track:', track);
          setError('No file path available');
          return;
        }

        console.log('Loading track:', audioPath);
        setIsLoading(true);
        setError(null);

        try {
          // First check if file exists
          const fileInfo = await window.api.checkAudioFile(audioPath);

          if (!fileInfo.exists) {
            console.error('File does not exist:', audioPath);
            setError('File not found');
            setIsLoading(false);
            return;
          }

          console.log('File info:', fileInfo);

          // Get proper file URL from main process
          const fileUrl = await window.api.getAudioFileUrl(audioPath);
          console.log('File URL:', fileUrl);

          // Check if browser supports the format
          const ext = fileInfo.extension.toLowerCase();
          if (ext === '.flac') {
            // FLAC might not be supported - try anyway but warn
            console.warn('FLAC playback may not be supported in all browsers');
          }

          // Set the audio source
          audioRef.current.src = fileUrl;

          // Try to load the file
          await audioRef.current.load();

          // If playing, start playback
          if (player.isPlaying) {
            try {
              await audioRef.current.play();
            } catch (playErr) {
              console.error('Error playing audio:', playErr);
              setError(`Cannot play ${ext} files. Try MP3 or M4A format.`);
              pausePlayback();
            }
          }
        } catch (err) {
          console.error('Error loading track:', err);
          setError('Failed to load audio file');
          setIsLoading(false);
          pausePlayback();
        }
      }
    };

    loadTrack();
  }, [player.currentTrack]);

  // Handle play/pause state
  React.useEffect(() => {
    if (audioRef.current) {
      if (player.isPlaying && !audioRef.current.paused) {
        // Already playing
      } else if (player.isPlaying) {
        audioRef.current.play().catch(err => {
          console.error('Error playing audio:', err);
          setError('Failed to play audio');
          pausePlayback();
        });
      } else {
        audioRef.current.pause();
      }
    }
  }, [player.isPlaying]);

  // Handle volume
  React.useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = player.volume;
    }
  }, [player.volume]);

  // Audio event handlers
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const current = audioRef.current.currentTime;
      const total = audioRef.current.duration;

      if (!isNaN(total) && total > 0) {
        setProgress((current / total) * 100);
        setCurrentTime(formatTime(current));
      }
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(formatTime(audioRef.current.duration));
      setIsLoading(false);
    }
  };

  const handleEnded = () => {
    // Auto-play next track in queue
    if (player.queue && player.queue.length > 0) {
      const currentIndex = player.queue.findIndex(t => t.id === player.currentTrack?.id);
      if (currentIndex !== -1 && currentIndex < player.queue.length - 1) {
        // Play next track
        const nextTrack = player.queue[currentIndex + 1];
        playTrack(nextTrack);
        return;
      }
    }
    // No next track, stop playback
    pausePlayback();
    setProgress(0);
    setCurrentTime('0:00');
  };

  const handleError = (e) => {
    console.error('Audio error:', e);
    setError('Failed to load audio file');
    setIsLoading(false);
    pausePlayback();
  };

  const handlePlayPause = () => {
    if (!player.currentTrack) return;

    if (player.isPlaying) {
      pausePlayback();
    } else {
      playTrack(player.currentTrack);
    }
  };

  const handleProgressClick = (e) => {
    if (!audioRef.current || !audioRef.current.duration) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const newTime = percentage * audioRef.current.duration;

    audioRef.current.currentTime = newTime;
    setProgress(percentage * 100);
  };

  const handleVolumeClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, x / rect.width));
    setVolume(percentage);
  };

  return (
    <PlayerContainer>
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        onError={handleError}
        onCanPlay={() => setIsLoading(false)}
      />

      <Controls>
        <button>
          <SkipBack />
        </button>
        <button
          className="play"
          onClick={handlePlayPause}
          disabled={!player.currentTrack || isLoading}
        >
          {isLoading ? (
            <div style={{ animation: 'spin 1s linear infinite' }}>⟳</div>
          ) : player.isPlaying ? (
            <Pause />
          ) : (
            <Play />
          )}
        </button>
        <button>
          <SkipForward />
        </button>
      </Controls>
      
      <TrackInfo>
        {player.currentTrack ? (
          <>
            <TrackDetails>
              <div className="title">
                {player.currentTrack.song_name || player.currentTrack.song_title || player.currentTrack.title || 'Unknown Track'}
              </div>
              <div className="artist">
                {error ? (
                  <span style={{ color: theme.colors.status.error }}>{error}</span>
                ) : (
                  <>
                    {player.currentTrack.date && `${player.currentTrack.date} `}
                    {player.currentTrack.venue && `- ${player.currentTrack.venue}`}
                  </>
                )}
              </div>
            </TrackDetails>
            
            <ProgressBar>
              <span className="time">{currentTime}</span>
              <div className="bar" onClick={handleProgressClick}>
                <div className="fill" style={{ width: `${progress}%` }} />
                <div className="handle" style={{ left: `${progress}%` }} />
              </div>
              <span className="time">{duration}</span>
            </ProgressBar>
          </>
        ) : (
          <TrackDetails>
            <div className="title">No track playing</div>
          </TrackDetails>
        )}
      </TrackInfo>
      
      <VolumeControl>
        <Volume2 />
        <div className="slider" onClick={handleVolumeClick}>
          <div className="fill" style={{ width: `${player.volume * 100}%` }} />
        </div>
      </VolumeControl>
      
      <button>
        <Settings />
      </button>
    </PlayerContainer>
  );
}

export default Player;