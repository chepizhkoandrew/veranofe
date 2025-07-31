import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Paper,
  IconButton,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  ShoppingCart as OrdersIcon,
} from '@mui/icons-material';

const Orders: React.FC = () => {
  const navigate = useNavigate();

  const handleBackToDashboard = () => {
    navigate('/');
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper elevation={1} sx={{ p: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Box display="flex" alignItems="center" gap={2}>
            <IconButton
              onClick={handleBackToDashboard}
              sx={{ 
                bgcolor: 'primary.main', 
                color: 'white',
                '&:hover': { bgcolor: 'primary.dark' }
              }}
            >
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h4" component="h1">
              Order Management
            </Typography>
          </Box>
        </Box>

        {/* Placeholder Content */}
        <Box 
          display="flex" 
          flexDirection="column" 
          alignItems="center" 
          justifyContent="center" 
          minHeight="400px"
          textAlign="center"
        >
          <OrdersIcon sx={{ fontSize: 80, color: 'primary.main', mb: 2 }} />
          <Typography variant="h5" gutterBottom>
            Orders Module
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 600 }}>
            This module will handle order processing and fulfillment. 
            Features will include order creation, status tracking, 
            delivery scheduling, and payment processing.
          </Typography>
          <Typography variant="body2" color="warning.main" sx={{ mt: 2, fontStyle: 'italic' }}>
            Coming soon - Module under development
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default Orders;