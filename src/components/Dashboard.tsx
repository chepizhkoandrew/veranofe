import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Container,
} from '@mui/material';
import {
  Inventory as InventoryIcon,
  LocalFlorist as ReceiveIcon,
  Palette as BouquetsIcon,
  Category as ProductsIcon,
  People as ClientsIcon,
  ShoppingCart as OrdersIcon,
  Assessment as ReportsIcon,
  Settings as SettingsIcon,
  StoreMallDirectory as StoreIcon,
  History as HistoryIcon,
} from '@mui/icons-material';

interface DashboardItem {
  title: string;
  route: string;
  icon: React.ReactNode;
  color: string;
  description: string;
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();

  const dashboardItems: DashboardItem[] = [
    {
      title: 'Balance',
      route: '/balance',
      icon: <InventoryIcon sx={{ fontSize: 48 }} />,
      color: '#1976d2',
      description: 'Current inventory and stock levels'
    },
    {
      title: 'Receive Items',
      route: '/receive',
      icon: <ReceiveIcon sx={{ fontSize: 48 }} />,
      color: '#388e3c',
      description: 'Add new flowers and items to inventory'
    },
    {
      title: 'Manage Bouquets',
      route: '/bouquets',
      icon: <BouquetsIcon sx={{ fontSize: 48 }} />,
      color: '#f57c00',
      description: 'Create and manage bouquet compositions'
    },
    {
      title: 'Products',
      route: '/products',
      icon: <ProductsIcon sx={{ fontSize: 48 }} />,
      color: '#7b1fa2',
      description: 'Manage product catalog and pricing'
    },
    {
      title: 'Clients',
      route: '/clients',
      icon: <ClientsIcon sx={{ fontSize: 48 }} />,
      color: '#c2185b',
      description: 'Customer management and contacts'
    },
    {
      title: 'Orders',
      route: '/orders',
      icon: <OrdersIcon sx={{ fontSize: 48 }} />,
      color: '#d32f2f',
      description: 'Order processing and fulfillment'
    },
    {
      title: 'Reports',
      route: '/reports',
      icon: <ReportsIcon sx={{ fontSize: 48 }} />,
      color: '#303f9f',
      description: 'Sales and inventory analytics'
    },
    {
      title: 'History',
      route: '/history',
      icon: <HistoryIcon sx={{ fontSize: 48 }} />,
      color: '#5d4037',
      description: 'Transaction and activity history'
    },
    {
      title: 'Store Setup',
      route: '/store',
      icon: <StoreIcon sx={{ fontSize: 48 }} />,
      color: '#455a64',
      description: 'Store configuration and settings'
    },
    {
      title: 'Settings',
      route: '/settings',
      icon: <SettingsIcon sx={{ fontSize: 48 }} />,
      color: '#424242',
      description: 'System settings and preferences'
    },
  ];

  const handleCardClick = (route: string) => {
    navigate(route);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box mb={4} textAlign="center">
        <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
          Florist Management System
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Select a module to continue
        </Typography>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)', lg: 'repeat(4, 1fr)' }, gap: 3 }}>
        {dashboardItems.map((item) => (
          <Card
            key={item.route}
            sx={{
              height: '200px',
              cursor: 'pointer',
              transition: 'all 0.3s ease-in-out',
              border: `2px solid ${item.color}20`,
              '&:hover': {
                transform: 'translateY(-8px)',
                boxShadow: `0 12px 20px rgba(0,0,0,0.1)`,
                backgroundColor: `${item.color}08`,
                borderColor: item.color,
              },
              '&:active': {
                transform: 'translateY(-4px)',
              },
            }}
            onClick={() => handleCardClick(item.route)}
          >
            <CardContent
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                p: 3,
              }}
            >
              <Box
                sx={{
                  color: item.color,
                  mb: 2,
                  p: 2,
                  borderRadius: '50%',
                  backgroundColor: `${item.color}15`,
                }}
              >
                {item.icon}
              </Box>
              <Typography variant="h6" component="h2" gutterBottom sx={{ fontWeight: 'bold' }}>
                {item.title}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem', lineHeight: 1.3 }}>
                {item.description}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Box>
    </Container>
  );
};

export default Dashboard;