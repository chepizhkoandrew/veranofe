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
  Brush as CreateIcon,
} from '@mui/icons-material';

const CreateBouquetScratch: React.FC = () => {
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
        <CreateIcon sx={{ mr: 1, fontSize: 32, color: 'primary.main' }} />
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
          🎨 Create Bouquet from Scratch
        </Typography>
      </Box>
      
      <Paper sx={{ p: 4, textAlign: 'center', minHeight: '400px' }}>
        <Alert severity="info" sx={{ mb: 3 }}>
          This page will allow creating custom bouquets from individual flowers
        </Alert>
        
        <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
          <CreateIcon sx={{ fontSize: 80, color: 'grey.400' }} />
          <Typography variant="h6" color="text.secondary">
            Design unique bouquets step by step
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 400 }}>
            Here you will be able to select individual flowers, set quantities, 
            choose colors, and create custom bouquets from scratch with pricing calculations.
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default CreateBouquetScratch;