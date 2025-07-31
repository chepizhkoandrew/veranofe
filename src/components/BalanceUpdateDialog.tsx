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
import { apiService, InventoryItem, BalanceUpdateRequest } from '../services/api';

interface BalanceUpdateDialogProps {
  open: boolean;
  onClose: () => void;
  item: InventoryItem | null;
  onUpdateSuccess: () => void;
}

const BalanceUpdateDialog: React.FC<BalanceUpdateDialogProps> = ({
  open,
  onClose,
  item,
  onUpdateSuccess,
}) => {
  const [newBalance, setNewBalance] = useState<string>('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form when dialog opens
  useEffect(() => {
    if (open && item) {
      setNewBalance(''); // Start with blank field to force user input
      setDescription('');
      setError(null);
    }
  }, [open, item]);

  const handleClose = () => {
    setNewBalance('');
    setDescription('');
    setError(null);
    onClose();
  };

  // Calculate correction (quantity change) from new balance
  const getCorrection = () => {
    if (!item || !newBalance) return 0;
    const newBalanceNum = parseInt(newBalance) || 0;
    return newBalanceNum - item.current_balance;
  };

  const correction = getCorrection();

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
      setNewBalance('');
    } else if (digit === 'backspace') {
      setNewBalance(prev => prev.slice(0, -1));
    } else {
      setNewBalance(prev => prev + digit);
    }
  };

  const handleSubmit = async () => {
    if (!item) return;

    if (newBalance.trim() === '') {
      setError('Please enter a new balance value');
      return;
    }

    const newBalanceNum = parseInt(newBalance);
    if (isNaN(newBalanceNum) || newBalanceNum < 0) {
      setError('Please enter a valid balance (0 or greater)');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const updateData: BalanceUpdateRequest = {
        record_id: item.record_id,
        quantity_change: correction,
        transaction_type: 'manual update',
        description: description || `Manual Balance Update - Balance updated to ${newBalanceNum}`,
      };

      const result = await apiService.updateItemBalance(updateData);

      if (result.success) {
        onUpdateSuccess();
        handleClose();
      } else {
        setError('Update failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setLoading(false);
    }
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
        Manual Balance Update
      </DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* 1. Picture / Flower name / Color */}
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

        {/* 2. Current balance / New balance / Correction */}
        <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <Box sx={{ flex: 1, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Current Balance
              </Typography>
              <Typography variant="h4" color="primary" fontWeight="bold">
                {item?.current_balance || 0}
              </Typography>
            </Box>
            <Box sx={{ flex: 1, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                New Balance
              </Typography>
              <TextField
                value={newBalance}
                onChange={(e) => setNewBalance(e.target.value)}
                type="number"
                inputProps={{ min: 0 }}
                placeholder="Enter new balance"
                sx={{
                  '& .MuiInputBase-input': {
                    fontSize: '1.5rem',
                    fontWeight: 'bold',
                    textAlign: 'center',
                    color: 'primary.main',
                  }
                }}
                fullWidth
              />
            </Box>
            <Box sx={{ flex: 1, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Correction
              </Typography>
              <Typography 
                variant="h4" 
                fontWeight="bold"
                color={correction === 0 ? 'text.secondary' : correction > 0 ? 'success.main' : 'error.main'}
              >
                {correction > 0 ? '+' : ''}{correction}
              </Typography>
            </Box>
          </Box>
        </Paper>

        {/* 3. Digit pad */}
        <Box sx={{ mb: 3 }}>
          <DigitPad />
        </Box>

        {/* 4. Description */}
        <TextField
          label="Description (Optional)"
          multiline
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional description for this transaction"
          fullWidth
          sx={{ mb: 2 }}
        />
      </DialogContent>
      
      {/* 5. Cancel / Update buttons */}
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading || !newBalance.trim()}
          startIcon={loading ? <CircularProgress size={16} /> : null}
        >
          {loading ? 'Updating...' : 'Update Balance'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BalanceUpdateDialog;