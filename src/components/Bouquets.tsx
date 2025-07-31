import React from 'react';
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
  Palette as BouquetsIcon,
  Inventory as StockIcon,
  Brush as CreateIcon,
  ContentCopy as TemplateIcon,
  Edit as UpdateIcon,
  ShoppingCart as SellIcon,
  AccountTree as NewTemplateIcon,
  EditNote as EditTemplateIcon,
} from '@mui/icons-material';

interface BouquetModule {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  route: string;
  status: 'active' | 'coming-soon';
}

const Bouquets: React.FC = () => {
  const navigate = useNavigate();

  const handleBackToDashboard = () => {
    navigate('/');
  };

  const modules: BouquetModule[] = [
    {
      id: 'bouquets-in-stock',
      title: 'See bouquets in stock',
      description: 'View and manage all ready-made bouquets in inventory',
      icon: <StockIcon sx={{ fontSize: 40 }} />,
      route: '/bouquets/stock',
      status: 'active'
    },
    {
      id: 'create-bouquet-scratch',
      title: 'Create new bouquet from scratch',
      description: 'Design custom bouquets using individual flowers',
      icon: <CreateIcon sx={{ fontSize: 40 }} />,
      route: '/bouquets/create-scratch',
      status: 'active'
    },
    {
      id: 'create-bouquet-template',
      title: 'Create new bouquet by template',
      description: 'Use existing templates to create bouquets quickly',
      icon: <TemplateIcon sx={{ fontSize: 40 }} />,
      route: '/bouquets/create-template',
      status: 'active'
    },
    {
      id: 'update-bouquet-stock',
      title: 'Update bouquet in stock',
      description: 'Modify existing bouquets in your inventory',
      icon: <UpdateIcon sx={{ fontSize: 40 }} />,
      route: '/bouquets/update-stock',
      status: 'active'
    },
    {
      id: 'sell-bouquet-stock',
      title: 'Sell bouquet in stock',
      description: 'Process sales of ready-made bouquets',
      icon: <SellIcon sx={{ fontSize: 40 }} />,
      route: '/bouquets/sell',
      status: 'active'
    },
    {
      id: 'create-new-template',
      title: 'Create new bouquet template',
      description: 'Design reusable templates for popular bouquet styles',
      icon: <NewTemplateIcon sx={{ fontSize: 40 }} />,
      route: '/bouquets/new-template',
      status: 'active'
    },
    {
      id: 'update-bouquet-template',
      title: 'Update bouquet template',
      description: 'Modify existing bouquet templates',
      icon: <EditTemplateIcon sx={{ fontSize: 40 }} />,
      route: '/bouquets/update-template',
      status: 'active'
    }
  ];

  const handleModuleClick = (route: string) => {
    navigate(route);
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
              Manage Bouquets
            </Typography>
          </Box>
        </Box>

        {/* Modules Grid */}
        <Grid container spacing={3}>
          {modules.map((module) => (
            <Grid item xs={12} sm={6} md={4} key={module.id}>
              <Card 
                sx={{ 
                  height: '100%',
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 6,
                  },
                  opacity: module.status === 'coming-soon' ? 0.6 : 1,
                  cursor: module.status === 'active' ? 'pointer' : 'default'
                }}
              >
                <CardActionArea 
                  onClick={() => module.status === 'active' && handleModuleClick(module.route)}
                  disabled={module.status === 'coming-soon'}
                  sx={{ height: '100%', p: 3 }}
                >
                  <CardContent sx={{ textAlign: 'center', p: 0 }}>
                    <Box sx={{ color: 'primary.main', mb: 2 }}>
                      {module.icon}
                    </Box>
                    
                    <Typography variant="h6" component="h3" gutterBottom sx={{ fontWeight: 'bold' }}>
                      {module.title}
                    </Typography>
                    
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {module.description}
                    </Typography>
                    
                    <Chip 
                      label={module.status === 'active' ? 'Available' : 'Coming Soon'}
                      color={module.status === 'active' ? 'success' : 'warning'}
                      size="small"
                      variant={module.status === 'active' ? 'filled' : 'outlined'}
                    />
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Module Overview */}
        <Box sx={{ mt: 4 }}>
          <Paper sx={{ p: 3, bgcolor: 'grey.50' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <BouquetsIcon sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="h6">
                About Bouquets Module
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">
              This comprehensive bouquet management system helps you create, track, and sell beautiful 
              floral arrangements. Whether you're working from templates or creating custom designs, 
              the system handles inventory management, pricing calculations, and sales processing 
              to streamline your bouquet operations.
            </Typography>
          </Paper>
        </Box>
      </Paper>
    </Container>
  );
};

export default Bouquets;