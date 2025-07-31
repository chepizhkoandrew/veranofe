import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import {
  ThemeProvider,
  createTheme,
  CssBaseline,
  CircularProgress,
  Box,
} from '@mui/material';

// Lazy load components for better performance
const Dashboard = React.lazy(() => import('./components/Dashboard'));
const Balance = React.lazy(() => import('./components/Balance'));
const Receive = React.lazy(() => import('./components/Receive'));
const PurchaseRequestsPage = React.lazy(() => import('./components/PurchaseRequestsPage'));
const CreatePurchaseRequestPage = React.lazy(() => import('./components/CreatePurchaseRequestPage'));
const PurchaseRequestEdit = React.lazy(() => import('./components/PurchaseRequestEdit'));
const Bouquets = React.lazy(() => import('./components/Bouquets'));
const BouquetsInStock = React.lazy(() => import('./components/BouquetsInStock'));
const CreateBouquetScratch = React.lazy(() => import('./components/bouquets/CreateBouquetScratch'));
const CreateBouquetTemplate = React.lazy(() => import('./components/bouquets/CreateBouquetTemplate'));
const UpdateBouquetStock = React.lazy(() => import('./components/bouquets/UpdateBouquetStock'));
const SellBouquetStock = React.lazy(() => import('./components/bouquets/SellBouquetStock'));
const CreateNewTemplate = React.lazy(() => import('./components/bouquets/CreateNewTemplate'));
const UpdateBouquetTemplate = React.lazy(() => import('./components/bouquets/UpdateBouquetTemplate'));
const Products = React.lazy(() => import('./components/Products'));
const Clients = React.lazy(() => import('./components/Clients'));
const Orders = React.lazy(() => import('./components/Orders'));
const Reports = React.lazy(() => import('./components/Reports'));
const History = React.lazy(() => import('./components/History'));
import Store from './components/Store';
import Settings from './components/Settings';

// Create theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
  typography: {
    h1: {
      fontSize: '2.5rem',
      fontWeight: 600,
    },
    h4: {
      fontWeight: 500,
    },
  },
});

// Loading fallback component
const LoadingFallback: React.FC = () => (
  <Box 
    sx={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      flexDirection: 'column',
      gap: 2
    }}
  >
    <CircularProgress size={60} />
    <Box sx={{ color: 'text.secondary', fontSize: '1.1rem' }}>
      Loading...
    </Box>
  </Box>
);

const App: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/balance" element={<Balance />} />
            <Route path="/receive" element={<Receive />} />
            <Route path="/receive/requests" element={<PurchaseRequestsPage />} />
            <Route path="/receive/createpr" element={<CreatePurchaseRequestPage />} />
            <Route path="/receive/pr/:id" element={<PurchaseRequestEdit />} />
            <Route path="/bouquets" element={<Bouquets />} />
            <Route path="/bouquets/stock" element={<BouquetsInStock />} />
            <Route path="/bouquets/create-scratch" element={<CreateBouquetScratch />} />
            <Route path="/bouquets/create-template" element={<CreateBouquetTemplate />} />
            <Route path="/bouquets/update-stock" element={<UpdateBouquetStock />} />
            <Route path="/bouquets/sell" element={<SellBouquetStock />} />
            <Route path="/bouquets/new-template" element={<CreateNewTemplate />} />
            <Route path="/bouquets/update-template" element={<UpdateBouquetTemplate />} />
            <Route path="/products" element={<Products />} />
            <Route path="/clients" element={<Clients />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/history" element={<History />} />
            <Route path="/store" element={<Store />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </Suspense>
      </Router>
    </ThemeProvider>
  );
};

export default App;