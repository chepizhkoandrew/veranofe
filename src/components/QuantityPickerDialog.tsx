import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Alert,
  Chip,
  CircularProgress,
  Paper,
  IconButton,
  Avatar,
} from '@mui/material';
import {
  Backspace as BackspaceIcon,
} from '@mui/icons-material';
import { InventoryItem } from '../services/api';

interface QuantityPickerDialogProps {
  open: boolean;
  onClose: () => void;
  item: InventoryItem | null;
  currentQuantity?: number;
  onConfirm: (quantity: number) => void;
  title?: string;
}

const QuantityPickerDialog: React.FC<QuantityPickerDialogProps> = ({
  open,
  onClose,
  item,
  currentQuantity = 0,
  onConfirm,
  title = "Set Quantity"
}) => {
  const [quantity, setQuantity] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // Reset form when dialog opens
  useEffect(() => {
    if (open && item) {
      setQuantity(currentQuantity > 0 ? currentQuantity.toString() : '');
      setError(null);
    }
  }, [open, item, currentQuantity]);

  const handleClose = () => {
    setQuantity('');
    setError(null);
    onClose();
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

  // Handle digit pad input
  const handleDigitClick = (digit: string) => {
    if (digit === 'clear') {
      setQuantity('');
    } else if (digit === 'backspace') {
      setQuantity(prev => prev.slice(0, -1));
    } else {
      setQuantity(prev => prev + digit);
    }
  };

  const handleSubmit = () => {
    if (!item) return;

    if (quantity.trim() === '') {
      setError('Please enter a quantity');
      return;
    }

    const quantityNum = parseInt(quantity);
    if (isNaN(quantityNum) || quantityNum < 0) {
      setError('Please enter a valid quantity (0 or greater)');
      return;
    }

    onConfirm(quantityNum);
    handleClose();
  };

  // Digit pad component
  const DigitPad = () => (
    <Paper elevation={1} sx={{ p: 2, bgcolor: 'grey.50' }}>
      <Typography variant="subtitle2" gutterBottom align="center">
        Digit Pad
      </Typography>
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1 }}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
          <Button
            key={digit}
            variant="outlined"
            onClick={() => handleDigitClick(digit.toString())}
            sx={{ minHeight: 48, fontSize: '1.1rem' }}
          >
            {digit}
          </Button>
        ))}
        <Button
          variant="outlined"
          onClick={() => handleDigitClick('clear')}
          sx={{ minHeight: 48, fontSize: '0.8rem' }}
          color="warning"
        >
          Clear
        </Button>
        <Button
          variant="outlined"
          onClick={() => handleDigitClick('0')}
          sx={{ minHeight: 48, fontSize: '1.1rem' }}
        >
          0
        </Button>
        <IconButton
          onClick={() => handleDigitClick('backspace')}
          sx={{ 
            border: '1px solid rgba(0, 0, 0, 0.23)',
            borderRadius: 1,
            minHeight: 48
          }}
        >
          <BackspaceIcon />
        </IconButton>
      </Box>
    </Paper>
  );

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {title}
      </DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Item Display */}
        {item && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
            <Avatar
              src={item.item_picture}
              alt={item.item_name}
              sx={{ 
                width: 90, 
                height: 90,
                bgcolor: 'grey.300'
              }}
              variant="rounded"
            >
              {!item.item_picture && item.item_name.charAt(0).toUpperCase()}
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" fontWeight="bold">
                {item.item_name}
              </Typography>
              <Chip 
                label={item.Color} 
                size="small" 
                sx={{
                  ...getColorStyles(item.Color),
                  background: item.Color.toLowerCase() === 'mix' 
                    ? getColorStyles(item.Color).backgroundColor 
                    : getColorStyles(item.Color).backgroundColor,
                  fontWeight: 'bold',
                  mt: 0.5
                }}
              />
            </Box>
          </Box>
        )}

        {/* Quantity Input */}
        <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Quantity
            </Typography>
            <TextField
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              type="number"
              inputProps={{ min: 0 }}
              placeholder="Enter quantity"
              sx={{
                '& .MuiInputBase-input': {
                  fontSize: '2rem',
                  fontWeight: 'bold',
                  textAlign: 'center',
                  color: 'primary.main',
                }
              }}
              fullWidth
            />
          </Box>
        </Paper>

        {/* Digit pad */}
        <Box sx={{ mb: 3 }}>
          <DigitPad />
        </Box>
      </DialogContent>
      
      {/* Cancel / Confirm buttons */}
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={!quantity.trim()}
        >
          {currentQuantity > 0 ? 'Update Quantity' : 'Add to Request'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default QuantityPickerDialog;