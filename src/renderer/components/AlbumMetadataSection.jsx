import React, { useState } from 'react';
import styled from '@emotion/styled';
import { Calendar, MapPin, FileText, Image as ImageIcon, Search, Upload } from 'lucide-react';
import { theme } from '../styles/globalStyles';

const Container = styled.div`
  display: grid;
  grid-template-columns: 200px 1fr;
  gap: ${theme.spacing.lg};
`;

const AlbumArtSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.sm};
`;

const AlbumArtPreview = styled.div`
  width: 200px;
  height: 200px;
  border-radius: ${theme.borderRadius.md};
  border: 2px dashed ${theme.colors.border};
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background: ${theme.colors.background.elevated};
  position: relative;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  svg {
    width: 48px;
    height: 48px;
    opacity: 0.3;
    color: ${theme.colors.text.secondary};
  }
`;

const AlbumArtButtons = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.xs};

  button {
    padding: ${theme.spacing.xs} ${theme.spacing.sm};
    background: ${theme.colors.background.elevated};
    color: ${theme.colors.text.primary};
    border-radius: ${theme.borderRadius.sm};
    font-size: ${theme.typography.fontSize.sm};
    display: flex;
    align-items: center;
    justify-content: center;
    gap: ${theme.spacing.xs};

    &:hover {
      background: ${theme.colors.background.hover};
    }

    svg {
      width: 14px;
      height: 14px;
    }
  }
`;

const MetadataFields = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.md};
`;

const AlbumTitleDisplay = styled.div`
  padding: ${theme.spacing.md};
  background: ${theme.colors.accent.primary}15;
  border-left: 4px solid ${theme.colors.accent.primary};
  border-radius: ${theme.borderRadius.sm};
  margin-bottom: ${theme.spacing.md};

  label {
    font-size: ${theme.typography.fontSize.sm};
    color: ${theme.colors.text.secondary};
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .title {
    font-size: ${theme.typography.fontSize.lg};
    font-weight: 600;
    color: ${theme.colors.text.primary};
    margin-top: ${theme.spacing.xs};
  }

  .empty {
    font-style: italic;
    color: ${theme.colors.text.secondary};
  }
`;

const FieldRow = styled.div`
  display: grid;
  grid-template-columns: ${props => props.columns || '1fr'};
  gap: ${theme.spacing.md};
`;

const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.xs};

  label {
    font-size: ${theme.typography.fontSize.sm};
    font-weight: 500;
    color: ${theme.colors.text.primary};
    display: flex;
    align-items: center;
    gap: ${theme.spacing.xs};

    svg {
      width: 14px;
      height: 14px;
      opacity: 0.6;
    }

    .required {
      color: ${theme.colors.status.error};
      margin-left: 2px;
    }
  }

  input,
  textarea {
    padding: ${theme.spacing.sm} ${theme.spacing.md};
    background: ${theme.colors.background.elevated};
    border: 1px solid ${theme.colors.border};
    border-radius: ${theme.borderRadius.sm};
    color: ${theme.colors.text.primary};
    font-size: ${theme.typography.fontSize.md};
    font-family: inherit;

    &:focus {
      outline: none;
      border-color: ${theme.colors.accent.primary};
      background: ${theme.colors.background.default};
    }

    &::placeholder {
      color: ${theme.colors.text.secondary};
      opacity: 0.5;
    }
  }

  textarea {
    min-height: 80px;
    resize: vertical;
    font-family: inherit;
  }

  input[type="date"] {
    cursor: pointer;
  }
`;

const ArtistField = styled(Field)`
  input {
    font-weight: 500;
    color: ${theme.colors.accent.primary};
  }
`;

/**
 * AlbumMetadataSection - dBpoweramp-style album-level metadata editor
 *
 * Features:
 * - Auto-generated album title display
 * - Date, Venue, City, State, Notes fields
 * - Album art preview and selector
 * - MusicBrainz auto-fetch
 */
const AlbumMetadataSection = ({ metadata, onChange, albumTitle }) => {
  const [isSearching, setIsSearching] = useState(false);

  /**
   * Handle field changes
   */
  const handleChange = (field, value) => {
    onChange(field, value);
  };

  /**
   * Handle album art file selection
   */
  const handleSelectAlbumArt = async () => {
    try {
      const result = await window.api.openFiles();
      if (result.canceled || !result.filePaths || result.filePaths.length === 0) {
        return;
      }

      const artPath = result.filePaths[0];

      // Validate it's an image
      const validExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
      const ext = artPath.substring(artPath.lastIndexOf('.')).toLowerCase();

      if (!validExtensions.includes(ext)) {
        alert('Please select a valid image file (JPG, PNG, WEBP)');
        return;
      }

      // Create a data URL for preview
      const fs = require('fs');
      const imageData = fs.readFileSync(artPath);
      const base64 = Buffer.from(imageData).toString('base64');
      const dataUrl = `data:image/${ext.substring(1)};base64,${base64}`;

      onChange('albumArt', artPath);
      onChange('albumArtUrl', dataUrl);
    } catch (error) {
      console.error('Error selecting album art:', error);
      alert(`Error selecting album art: ${error.message}`);
    }
  };

  /**
   * Auto-fetch album art from MusicBrainz
   */
  const handleAutoFetchArt = async () => {
    if (!metadata.date || !metadata.venue) {
      alert('Please enter date and venue first');
      return;
    }

    setIsSearching(true);

    try {
      // Search MusicBrainz for this show
      const searchQuery = {
        artist: metadata.artist || 'Grateful Dead',
        album: `${metadata.date} ${metadata.venue}`,
        date: metadata.date
      };

      const results = await window.api.invoke('musicbrainz:search', searchQuery);

      if (results && results.length > 0 && results[0].coverArt) {
        const coverArt = results[0].coverArt;

        // Download and save album art
        onChange('albumArtUrl', coverArt);

        // TODO: Download to temp file for embedding
        console.log('Found album art:', coverArt);
        alert('✅ Album art found!');
      } else {
        alert('No album art found for this show. Try manual selection.');
      }
    } catch (error) {
      console.error('Error fetching album art:', error);
      alert(`Error fetching album art: ${error.message}`);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <Container>
      {/* Album Art Section */}
      <AlbumArtSection>
        <AlbumArtPreview>
          {metadata.albumArtUrl ? (
            <img src={metadata.albumArtUrl} alt="Album art" />
          ) : (
            <ImageIcon />
          )}
        </AlbumArtPreview>

        <AlbumArtButtons>
          <button onClick={handleSelectAlbumArt}>
            <Upload />
            Select Image
          </button>
          <button onClick={handleAutoFetchArt} disabled={isSearching}>
            <Search />
            {isSearching ? 'Searching...' : 'Auto-Fetch'}
          </button>
        </AlbumArtButtons>
      </AlbumArtSection>

      {/* Metadata Fields */}
      <MetadataFields>
        {/* Auto-generated Album Title */}
        <AlbumTitleDisplay>
          <label>Album Title (Auto-Generated)</label>
          <div className={albumTitle ? 'title' : 'title empty'}>
            {albumTitle || 'Enter date and venue to generate title'}
          </div>
        </AlbumTitleDisplay>

        {/* Artist */}
        <ArtistField>
          <label>
            Artist
          </label>
          <input
            type="text"
            value={metadata.artist || ''}
            onChange={(e) => handleChange('artist', e.target.value)}
            placeholder="Artist name"
          />
        </ArtistField>

        {/* Date */}
        <FieldRow columns="1fr 1fr">
          <Field>
            <label>
              <Calendar />
              Date<span className="required">*</span>
            </label>
            <input
              type="date"
              value={metadata.date || ''}
              onChange={(e) => handleChange('date', e.target.value)}
              required
            />
          </Field>

          <Field>
            <label>
              <MapPin />
              Venue<span className="required">*</span>
            </label>
            <input
              type="text"
              value={metadata.venue || ''}
              onChange={(e) => handleChange('venue', e.target.value)}
              placeholder="Fillmore West"
              required
            />
          </Field>
        </FieldRow>

        {/* Location */}
        <FieldRow columns="2fr 1fr">
          <Field>
            <label>
              <MapPin />
              City
            </label>
            <input
              type="text"
              value={metadata.city || ''}
              onChange={(e) => handleChange('city', e.target.value)}
              placeholder="San Francisco"
            />
          </Field>

          <Field>
            <label>State</label>
            <input
              type="text"
              value={metadata.state || ''}
              onChange={(e) => handleChange('state', e.target.value)}
              placeholder="CA"
              maxLength={2}
              style={{ textTransform: 'uppercase' }}
            />
          </Field>
        </FieldRow>

        {/* Notes */}
        <Field>
          <label>
            <FileText />
            Notes
          </label>
          <textarea
            value={metadata.notes || ''}
            onChange={(e) => handleChange('notes', e.target.value)}
            placeholder="Additional notes (e.g., Dick's Picks 36, SBD, etc.)"
          />
        </Field>
      </MetadataFields>
    </Container>
  );
};

export default AlbumMetadataSection;
