import React from 'react';
import {
  Box,
  Chip,
  Typography,
} from '@mui/material';

interface ColorFilterProps {
  availableColors: string[];
  selectedColors: string[];
  onColorToggle: (color: string) => void;
  onClearFilters: () => void;
}

const ColorFilter: React.FC<ColorFilterProps> = ({
  availableColors,
  selectedColors,
  onColorToggle,
  onClearFilters,
}) => {
  // Get color styles for chips
  const getColorStyles = (color: string) => {
    const colorLower = color.toLowerCase();
    
    const colorMap: { [key: string]: { backgroundColor: string; color: string } } = {
      'burgundy': { backgroundColor: '#660033', color: 'white' },
      'peach': { backgroundColor: '#ffe5b4', color: 'black' },
      'mix': { 
        backgroundColor: 'linear-gradient(45deg, #ff0000, #ff8000, #ffff00, #80ff00, #00ff00, #00ff80, #00ffff, #0080ff, #0000ff, #8000ff, #ff00ff, #ff0080)',
        color: 'white' 
      },
      'white': { backgroundColor: 'white', color: 'black' },
      'cream': { backgroundColor: 'cream', color: 'black' },
      'yellow': { backgroundColor: 'yellow', color: 'black' },
    };

    return colorMap[colorLower] || { backgroundColor: colorLower, color: 'white' };
  };

  const getColorChipStyle = (color: string) => {
    const colorStyles = getColorStyles(color);
    return {
      ...colorStyles,
      background: color.toLowerCase() === 'mix' 
        ? colorStyles.backgroundColor 
        : colorStyles.backgroundColor,
      fontWeight: 'bold',
      border: selectedColors.includes(color) ? '2px solid #1976d2' : 'none',
      '&:hover': {
        opacity: 0.8,
      },
    };
  };

  return (
    <Box sx={{ mb: 3 }}>
      <Box display="flex" alignItems="center" gap={1} mb={2}>
        {selectedColors.length > 0 && (
          <Chip
            label="Clear Filters"
            variant="outlined"
            size="small"
            onClick={onClearFilters}
            color="primary"
          />
        )}
      </Box>
      <Box display="flex" flexWrap="wrap" gap={1}>
        {availableColors.map((color) => (
          <Chip
            key={color}
            label={color}
            clickable
            onClick={() => onColorToggle(color)}
            variant={selectedColors.includes(color) ? 'filled' : 'outlined'}
            sx={getColorChipStyle(color)}
          />
        ))}
      </Box>
      {selectedColors.length > 0 && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Filtering by: {selectedColors.join(', ')}
        </Typography>
      )}
    </Box>
  );
};

export default ColorFilter;