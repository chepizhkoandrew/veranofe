import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Paper,
  IconButton,
  Grid,
  Card,
  CardContent,
  CardActionArea,
  Chip,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  LocalFlorist as ReceiveIcon,
  Visibility as ViewIcon,
  Add as CreateIcon,
  GetApp as ReceiveFromPRIcon,
  Edit as ManualReceiveIcon,
  CameraAlt as PhotoReceiveIcon,
} from '@mui/icons-material';


interface ReceiveModule {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  status: 'active' | 'coming-soon';
}

const Receive: React.FC = () => {
  const navigate = useNavigate();

  const handleBackToDashboard = () => {
    navigate('/');
  };

  const modules: ReceiveModule[] = [
    {
      id: 'view-purchase-requests',
      title: 'See Purchase Requests (PR)',
      description: 'View all purchase requests and their status',
      icon: <ViewIcon sx={{ fontSize: 40 }} />,
      status: 'active'
    },
    {
      id: 'create-purchase-request',
      title: 'Create PR',
      description: 'Create new purchase requests for suppliers',
      icon: <CreateIcon sx={{ fontSize: 40 }} />,
      status: 'active'
    },
    {
      id: 'receive-from-pr',
      title: 'Receive items from PR',
      description: 'Receive items from existing purchase requests',
      icon: <ReceiveFromPRIcon sx={{ fontSize: 40 }} />,
      status: 'coming-soon'
    },
    {
      id: 'receive-manually',
      title: 'Receive items manually',
      description: 'Manually add items to inventory',
      icon: <ManualReceiveIcon sx={{ fontSize: 40 }} />,
      status: 'coming-soon'
    },
    {
      id: 'receive-by-photo',
      title: 'Receive items by photo',
      description: 'Use photo recognition to receive items',
      icon: <PhotoReceiveIcon sx={{ fontSize: 40 }} />,
      status: 'coming-soon'
    }
  ];

  const handleModuleClick = (moduleId: string) => {
    if (moduleId === 'view-purchase-requests') {
      navigate('/receive/requests');
    } else if (moduleId === 'create-purchase-request') {
      navigate('/receive/createpr');
    }
  };



  const renderMenu = () => (
    <>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
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
            Receive Flowers & Items
          </Typography>
        </Box>
      </Box>

      {/* Modules Grid */}
      <Grid container spacing={3}>
        {modules.map((module) => (
          <Grid item xs={12} sm={6} md={4} key={module.id}>
            <Card 
              elevation={2}
              sx={{ 
                height: '100%',
                opacity: module.status === 'coming-soon' ? 0.6 : 1,
                cursor: module.status === 'active' ? 'pointer' : 'default'
              }}
            >
              <CardActionArea
                onClick={() => handleModuleClick(module.id)}
                disabled={module.status === 'coming-soon'}
                sx={{ height: '100%', p: 3 }}
              >
                <CardContent sx={{ textAlign: 'center', height: '100%' }}>
                  <Box
                    sx={{
                      color: module.status === 'active' ? 'primary.main' : 'grey.400',
                      mb: 2
                    }}
                  >
                    {module.icon}
                  </Box>
                  <Typography variant="h6" gutterBottom>
                    {module.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {module.description}
                  </Typography>
                  <Chip
                    label={module.status === 'active' ? 'Available' : 'Coming Soon'}
                    color={module.status === 'active' ? 'success' : 'default'}
                    variant={module.status === 'active' ? 'filled' : 'outlined'}
                    size="small"
                  />
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Info Section */}
      <Box sx={{ mt: 4 }}>
        <Paper elevation={1} sx={{ p: 3, bgcolor: 'grey.50' }}>
          <Box display="flex" alignItems="center" gap={2} mb={2}>
            <ReceiveIcon sx={{ color: 'primary.main' }} />
            <Typography variant="h6">
              About Receive Module
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary">
            This module manages the entire receiving process for your flower shop. 
            Start by creating purchase requests for your suppliers, track their status, 
            and receive items into your inventory when they arrive. The system will 
            automatically update stock levels and maintain detailed transaction history.
          </Typography>
        </Paper>
      </Box>
    </>
  );

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper elevation={1} sx={{ p: 3, minHeight: '600px' }}>
        {renderMenu()}
      </Paper>
    </Container>
  );
};

export default Receive;