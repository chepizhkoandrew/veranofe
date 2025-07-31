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
  StoreMallDirectory as StoreIcon,
} from '@mui/icons-material';

const Store: React.FC = () => {
  const navigate = useNavigate();

  const handleBackToDashboard = () => {
    navigate('/');
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper elevation={1} sx={{ p: 3 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
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
              Store Setup & Configuration
            </Typography>
          </Box>
        </Box>

        {/* Placeholder Content */}
        <Box 
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "400px",
            textAlign: "center"
          }}
        >
          <StoreIcon sx={{ fontSize: 80, color: 'primary.main', mb: 2 }} />
          <Typography variant="h5" gutterBottom>
            Store Setup Module
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 600 }}>
            This module will help you configure store settings and business information. 
            Features will include store details, business hours, tax settings, 
            supplier management, and location configuration.
          </Typography>
          <Typography variant="body2" color="warning.main" sx={{ mt: 2, fontStyle: 'italic' }}>
            Coming soon - Module under development
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default Store;