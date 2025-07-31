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
  Edit as UpdateIcon,
} from '@mui/icons-material';

const UpdateBouquetStock: React.FC = () => {
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
        <UpdateIcon sx={{ mr: 1, fontSize: 32, color: 'primary.main' }} />
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
          ✏️ Update Bouquet in Stock
        </Typography>
      </Box>
      
      <Paper sx={{ p: 4, textAlign: 'center', minHeight: '400px' }}>
        <Alert severity="info" sx={{ mb: 3 }}>
          This page will allow updating existing bouquets in inventory
        </Alert>
        
        <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
          <UpdateIcon sx={{ fontSize: 80, color: 'grey.400' }} />
          <Typography variant="h6" color="text.secondary">
            Modify existing bouquets in your inventory
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 400 }}>
            Here you will be able to update bouquet details, adjust quantities, 
            change prices, update descriptions, and modify expiration dates for existing stock.
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default UpdateBouquetStock;