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
import CreatePurchaseRequest from './CreatePurchaseRequest';

const CreatePurchaseRequestPage: React.FC = () => {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate('/receive');
  };

  const handleSuccess = () => {
    // After successful creation, navigate to the requests list
    navigate('/receive/requests');
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
          ➕ Create Purchase Request
        </Typography>
      </Box>
      
      <CreatePurchaseRequest onBack={handleBack} onSuccess={handleSuccess} />
    </Container>
  );
};

export default CreatePurchaseRequestPage;