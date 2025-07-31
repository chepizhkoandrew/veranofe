import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  IconButton,
  Paper,
  Alert,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  ShoppingCart as SellIcon,
} from '@mui/icons-material';

const SellBouquetStock: React.FC = () => {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate('/bouquets');
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton
          onClick={handleBack}
          sx={{
            mr: 2,
            bgcolor: 'grey.100',
            '&:hover': { bgcolor: 'grey.200' }
          }}
        >
          <ArrowBackIcon />
        </IconButton>
        <SellIcon sx={{ mr: 1, fontSize: 32, color: 'primary.main' }} />
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
          🛒 Sell Bouquet from Stock
        </Typography>
      </Box>
      
      <Paper sx={{ p: 4, textAlign: 'center', minHeight: '400px' }}>
        <Alert severity="info" sx={{ mb: 3 }}>
          This page will allow selling bouquets directly from inventory
        </Alert>
        
        <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
          <SellIcon sx={{ fontSize: 80, color: 'grey.400' }} />
          <Typography variant="h6" color="text.secondary">
            Process sales of ready-made bouquets
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 400 }}>
            Here you will be able to select bouquets from inventory, process customer sales, 
            apply discounts, generate receipts, and automatically update stock levels.
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default SellBouquetStock;