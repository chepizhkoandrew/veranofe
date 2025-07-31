import React, { useState, useEffect, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Tooltip,
  Box,
  Typography,
  CircularProgress,
  Alert,
  Avatar,
  Checkbox,
  FormControlLabel,
  Modal,
  Backdrop,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { apiService, InventoryItem } from '../services/api';
import ActionsMenu from './ActionsMenu';
import ColorFilter from './ColorFilter';

interface InventoryTableProps {
  items: InventoryItem[];
  loading: boolean;
  error: string | null;
  onEditItem?: (item: InventoryItem) => void;
  onViewHistory: (item: InventoryItem) => void;
  onRefresh?: () => void;
  hideEditActions?: boolean;
  emptyMessage?: string;
}

const InventoryTable: React.FC<InventoryTableProps> = ({
  items,
  loading,
  error,
  onEditItem,
  onViewHistory,
  onRefresh,
  hideEditActions = false,
  emptyMessage = "No items found",
}) => {
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [hideZeroItems, setHideZeroItems] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('flower'); // Default to flowers
  const [selectedImage, setSelectedImage] = useState<{ url: string; name: string } | null>(null);

  // Get available colors and categories
  const availableColors = useMemo(() => {
    const colors = Array.from(new Set(items.map(item => item.Color).filter(Boolean)));
    return colors.sort();
  }, [items]);

  const availableCategories = useMemo(() => {
    const categories = Array.from(new Set(items.map(item => item.item_category).filter(Boolean)));
    
    // Sort with "flowers" first, then rest alphabetically
    return categories.sort((a, b) => {
      if (a.toLowerCase() === 'flower') return -1;
      if (b.toLowerCase() === 'flower') return 1;
      return a.localeCompare(b);
    });
  }, [items]);

  const filteredItems = useMemo(() => {
    let filtered = items;

    // Filter by selected category (empty string means show all categories)
    if (selectedCategory) {
      filtered = filtered.filter(item => 
        item.item_category?.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    // Filter by selected colors
    if (selectedColors.length > 0) {
      filtered = filtered.filter(item => selectedColors.includes(item.Color));
    }

    // Hide zero items if toggle is enabled
    if (hideZeroItems) {
      filtered = filtered.filter(item => (item.current_balance || 0) > 0);
    }

    return filtered;
  }, [items, selectedColors, hideZeroItems, selectedCategory]);

  const handleColorToggle = (color: string) => {
    setSelectedColors(prev => 
      prev.includes(color) 
        ? prev.filter(c => c !== color)
        : [...prev, color]
    );
  };

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
  };

  const handleClearFilters = () => {
    setSelectedColors([]);
    setHideZeroItems(false);
    setSelectedCategory('Flower'); // Reset to flowers category
  };

  const handleImageClick = (imageUrl: string, itemName: string) => {
    if (imageUrl) {
      setSelectedImage({ url: imageUrl, name: itemName });
    }
  };

  const handleCloseModal = () => {
    setSelectedImage(null);
  };

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

  const getBalanceColor = (balance: number) => {
    if (balance <= 0) return 'error';
    if (balance <= 5) return 'warning';
    return 'success';
  };

  const getCategoryColor = (category: string) => {
    const categoryColors: Record<string, 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'> = {
      flower: 'primary',
      paper: 'info',
      ribbon: 'secondary',
      vase: 'success',
      'carton box': 'warning',
      '_bouquet': 'error',
    };
    return categoryColors[category] || 'default';
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
        <Typography variant="body1" sx={{ ml: 2 }}>
          Loading inventory...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert 
        severity="error" 
        action={
          onRefresh && (
            <IconButton onClick={onRefresh} size="small">
              <RefreshIcon />
            </IconButton>
          )
        }
      >
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      {/* Filters Row */}
      <Box display="flex" flexDirection="column" gap={2} mb={2}>
        {/* Color Filter */}
        <ColorFilter
          availableColors={availableColors}
          selectedColors={selectedColors}
          onColorToggle={handleColorToggle}
          onClearFilters={handleClearFilters}
        />
        
        {/* Category Filter */}
        <Box>
          <Box display="flex" flexWrap="wrap" gap={1}>
            {availableCategories.map((category) => (
              <Chip
                key={category}
                label={category}
                variant={selectedCategory === category ? "filled" : "outlined"}
                color={selectedCategory === category ? "primary" : "default"}
                onClick={() => handleCategorySelect(category)}
                sx={{ 
                  textTransform: 'capitalize',
                  cursor: 'pointer',
                  '&:hover': {
                    backgroundColor: selectedCategory === category ? 'primary.dark' : 'action.hover'
                  }
                }}
              />
            ))}
          </Box>
        </Box>
        
        {/* Additional Filters */}
        <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2}>
          <Box display="flex" alignItems="center" gap={2}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={hideZeroItems}
                  onChange={(e) => setHideZeroItems(e.target.checked)}
                  color="primary"
                />
              }
              label="Hide zero balance items"
            />

          </Box>
          
          {/* Items count */}
          <Typography variant="body2" color="primary.main" fontWeight="medium">
            Showing {filteredItems.length} of {items.length} items
          </Typography>
        </Box>
      </Box>

      <TableContainer component={Paper} elevation={2} sx={{ overflowX: 'auto' }}>
        <Table size="small" sx={{ minWidth: 600 }}>
          <TableHead>
            <TableRow sx={{ backgroundColor: 'primary.light' }}>
              <TableCell sx={{ fontWeight: 'bold', color: 'white', minWidth: '180px' }}>Name & Photo</TableCell>
              <TableCell sx={{ fontWeight: 'bold', color: 'white', minWidth: '120px' }}>Balance & Action</TableCell>
              <TableCell sx={{ fontWeight: 'bold', color: 'white', minWidth: '100px' }}>Color</TableCell>
              <TableCell sx={{ fontWeight: 'bold', color: 'white', minWidth: '100px' }}>Category</TableCell>
              <TableCell sx={{ fontWeight: 'bold', color: 'white', minWidth: '80px' }}>ID</TableCell>
            </TableRow>
          </TableHead>
        <TableBody>
          {filteredItems.map((item) => (
            <TableRow
              key={item.record_id}
              hover
              sx={{ '&:nth-of-type(odd)': { backgroundColor: 'action.hover' } }}
            >
              {/* Name & Photo Column */}
              <TableCell>
                <Box display="flex" flexDirection="column" alignItems="center" gap={1}>
                  <Avatar
                    src={item.item_picture}
                    alt={item.item_name}
                    onClick={() => handleImageClick(item.item_picture || '', item.item_name)}
                    sx={{ 
                      width: 50, 
                      height: 50,
                      bgcolor: 'grey.300',
                      cursor: item.item_picture ? 'pointer' : 'default',
                      '&:hover': item.item_picture ? {
                        opacity: 0.8,
                        transform: 'scale(1.05)',
                        transition: 'all 0.2s ease-in-out'
                      } : {}
                    }}
                    variant="rounded"
                  >
                    {!item.item_picture && item.item_name.charAt(0).toUpperCase()}
                  </Avatar>
                  <Box textAlign="center">
                    <Typography variant="body2" fontWeight="medium" sx={{ lineHeight: 1.2 }}>
                      {item.item_name}
                    </Typography>
                    {item.item_description && (
                      <Typography variant="caption" color="text.secondary" display="block">
                        {item.item_description}
                      </Typography>
                    )}
                  </Box>
                </Box>
              </TableCell>
              
              {/* Balance & Action Column */}
              <TableCell>
                <Box display="flex" flexDirection="column" alignItems="center" gap={1}>
                  <Chip
                    label={item.current_balance}
                    color={getBalanceColor(item.current_balance)}
                    variant="filled"
                    size="small"
                    sx={{ fontWeight: 'bold', minWidth: '60px' }}
                  />
                  {!hideEditActions && (
                    <ActionsMenu
                      item={item}
                      onEditItem={onEditItem}
                      onViewHistory={onViewHistory}
                    />
                  )}
                </Box>
              </TableCell>
              
              {/* Color Column */}
              <TableCell>
                <Chip
                  label={item.Color}
                  size="small"
                  variant="outlined"
                  sx={{
                    ...getColorStyles(item.Color),
                    background: item.Color.toLowerCase() === 'mix' 
                      ? getColorStyles(item.Color).backgroundColor 
                      : getColorStyles(item.Color).backgroundColor,
                    fontWeight: 'bold'
                  }}
                />
              </TableCell>
              
              {/* Category Column */}
              <TableCell>
                <Chip
                  label={item.item_category}
                  size="small"
                  color={getCategoryColor(item.item_category)}
                  variant="filled"
                />
              </TableCell>
              
              {/* ID Column */}
              <TableCell>
                <Typography variant="body2" fontFamily="monospace">
                  {item.item_id}
                </Typography>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {filteredItems.length === 0 && items.length > 0 && (
        <Box p={4} textAlign="center">
          <Typography variant="h6" color="text.secondary">
            No items match the selected color filters
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Try clearing the filters or selecting different colors
          </Typography>
        </Box>
      )}
      {items.length === 0 && (
        <Box p={4} textAlign="center">
          <Typography variant="h6" color="text.secondary">
            {emptyMessage}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {emptyMessage.includes('bouquet') 
              ? 'Create some bouquets using templates to see them here'
              : 'Make sure your backend is running and contains inventory data'
            }
          </Typography>
        </Box>
      )}
    </TableContainer>
    
      {/* Image Modal */}
      <Modal
        open={!!selectedImage}
        onClose={handleCloseModal}
        closeAfterTransition
        BackdropComponent={Backdrop}
        BackdropProps={{
          timeout: 300,
          sx: { backgroundColor: 'rgba(0, 0, 0, 0.8)' }
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            bgcolor: 'background.paper',
            borderRadius: 2,
            boxShadow: 24,
            p: 2,
            maxWidth: '90vw',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            outline: 'none'
          }}
        >
          {/* Header with close button */}
          <Box 
            display="flex" 
            justifyContent="space-between" 
            alignItems="center" 
            mb={2}
          >
            <Typography variant="h6" component="h2">
              {selectedImage?.name}
            </Typography>
            <IconButton
              onClick={handleCloseModal}
              size="small"
              sx={{
                bgcolor: 'grey.100',
                '&:hover': { bgcolor: 'grey.200' }
              }}
            >
              <CloseIcon />
            </IconButton>
          </Box>
          
          {/* Image */}
          {selectedImage && (
            <Box
              component="img"
              src={selectedImage.url}
              alt={selectedImage.name}
              sx={{
                maxWidth: '100%',
                maxHeight: 'calc(90vh - 120px)',
                objectFit: 'contain',
                borderRadius: 1
              }}
            />
          )}
        </Box>
      </Modal>
    </Box>
  );
};

export default InventoryTable;