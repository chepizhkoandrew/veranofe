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
  currentPrice?: number;
  onConfirm: (quantity: number, price?: number) => void;
  title?: string;
  availableQty?: number; // Optional: for showing stock availability
  validationError?: string | null; // Optional: external validation error
  showPriceInput?: boolean; // Optional: show purchase price input (for receiving items)
}

const QuantityPickerDialog: React.FC<QuantityPickerDialogProps> = ({
  open,
  onClose,
  item,
  currentQuantity = 0,
  currentPrice = 0,
  onConfirm,
  title = "Set Quantity",
  availableQty,
  validationError,
  showPriceInput = false,
}) => {
  const [quantity, setQuantity] = useState<string>('');
  const [price, setPrice] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [focusedField, setFocusedField] = useState<'quantity' | 'price'>('quantity');

  // Reset form when dialog opens
  useEffect(() => {
    if (open && item) {
      setQuantity(currentQuantity > 0 ? currentQuantity.toString() : '');
      setPrice(currentPrice > 0 ? currentPrice.toString() : '');
      setError(validationError || null);
      console.log(`📋 QuantityPickerDialog opened - item: ${item.item_name}, availableQty: ${availableQty}`);
    }
  }, [open, item, currentQuantity, currentPrice, validationError, availableQty]);

  const handleClose = () => {
    setQuantity('');
    setPrice('');
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

  // Handle digit pad input - works for both quantity and price
  const handleDigitClick = (digit: string) => {
    if (focusedField === 'quantity') {
      if (digit === 'clear') {
        setQuantity('');
      } else if (digit === 'backspace') {
        setQuantity(prev => prev.slice(0, -1));
      } else {
        setQuantity(prev => prev + digit);
      }
    } else {
      // Price field
      if (digit === 'clear') {
        setPrice('');
      } else if (digit === 'backspace') {
        setPrice(prev => prev.slice(0, -1));
      } else if (digit === '.') {
        // Only add decimal point if there isn't one already
        setPrice(prev => prev.includes('.') ? prev : prev + '.');
      } else {
        setPrice(prev => {
          // Limit to 2 decimal places
          if (prev.includes('.')) {
            const parts = prev.split('.');
            if (parts[1] && parts[1].length >= 2) {
              return prev;
            }
          }
          return prev + digit;
        });
      }
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

    // Validate against available quantity if provided
    if (availableQty !== undefined && quantityNum > availableQty) {
      console.warn(`⚠️ Quantity ${quantityNum} exceeds available ${availableQty}`);
      setError(`Cannot add ${quantityNum} units. Only ${availableQty} unit(s) available at this location.`);
      return;
    }
    
    if (availableQty === undefined) {
      console.warn(`⚠️ WARNING: availableQty is undefined! Validation skipped.`);
    }

    // Parse price if provided
    let priceNum: number | undefined = undefined;
    if (showPriceInput && price.trim() !== '') {
      priceNum = parseFloat(price);
      if (isNaN(priceNum) || priceNum < 0) {
        setError('Please enter a valid price (0 or greater)');
        return;
      }
    }

    console.log(`✅ Quantity ${quantityNum} confirmed (availableQty: ${availableQty}, price: ${priceNum})`);
    onConfirm(quantityNum, priceNum);
    handleClose();
  };

  // Digit pad component
  const DigitPad = () => (
    <Paper elevation={1} sx={{ p: 2, bgcolor: 'grey.50' }}>
      <Typography variant="subtitle2" gutterBottom align="center">
        Digit Pad {showPriceInput && `(${focusedField === 'quantity' ? 'Quantity' : 'Price'})`}
      </Typography>
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1, mb: 1 }}>
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
        {showPriceInput && focusedField === 'price' ? (
          <Button
            variant="outlined"
            onClick={() => handleDigitClick('.')}
            sx={{ minHeight: 48, fontSize: '1.1rem' }}
          >
            .
          </Button>
        ) : (
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
        )}
      </Box>
      {showPriceInput && focusedField === 'price' && (
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(1, 1fr)', gap: 1 }}>
          <IconButton
            onClick={() => handleDigitClick('backspace')}
            sx={{ 
              border: '1px solid rgba(0, 0, 0, 0.23)',
              borderRadius: 1,
              minHeight: 48,
              width: '100%'
            }}
          >
            <BackspaceIcon />
          </IconButton>
        </Box>
      )}
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

        {/* Stock Availability Info */}
        {availableQty !== undefined && (
          <Alert 
            severity={availableQty > 0 ? 'success' : 'warning'} 
            sx={{ mb: 3 }}
          >
            {availableQty > 0 ? (
              <>
                ✓ <strong>{availableQty} unit(s)</strong> available at this location
              </>
            ) : (
              <>
                ⚠️ <strong>Out of stock</strong> at this location
              </>
            )}
          </Alert>
        )}

        {/* Quantity Input */}
        <Paper 
          elevation={focusedField === 'quantity' ? 3 : 2} 
          sx={{ 
            p: 3, 
            mb: 3,
            border: focusedField === 'quantity' ? '2px solid' : 'none',
            borderColor: 'primary.main'
          }}
        >
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Quantity {availableQty !== undefined && `(Max: ${availableQty})`}
            </Typography>
            <TextField
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              onFocus={() => setFocusedField('quantity')}
              type="number"
              inputProps={{ min: 0, max: availableQty }}
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

        {/* Purchase Price Input (shown only when receiving items) */}
        {showPriceInput && (
          <Paper 
            elevation={focusedField === 'price' ? 3 : 2} 
            sx={{ 
              p: 3, 
              mb: 3, 
              bgcolor: 'success.50',
              border: focusedField === 'price' ? '2px solid' : 'none',
              borderColor: 'success.main'
            }}
          >
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Purchase Price per Flower (Optional)
              </Typography>
              <TextField
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                onFocus={() => setFocusedField('price')}
                type="number"
                inputProps={{ min: 0, step: 0.01 }}
                placeholder="0.00"
                sx={{
                  '& .MuiInputBase-input': {
                    fontSize: '1.5rem',
                    fontWeight: 'bold',
                    textAlign: 'center',
                    color: 'success.main',
                  }
                }}
                fullWidth
              />
            </Box>
          </Paper>
        )}

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