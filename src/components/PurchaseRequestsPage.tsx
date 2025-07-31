import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  IconButton,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import PurchaseRequestsList from './PurchaseRequestsList';

const PurchaseRequestsPage: React.FC = () => {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate('/receive');
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
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
          📋 Purchase Requests
        </Typography>
      </Box>
      
      <PurchaseRequestsList onBack={handleBack} />
    </Container>
  );
};

export default PurchaseRequestsPage;