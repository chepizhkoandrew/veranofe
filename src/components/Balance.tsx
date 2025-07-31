import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Paper,
  IconButton,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import { apiService, InventoryItem } from '../services/api';
import InventoryTable from './InventoryTable';
import BalanceUpdateDialog from './BalanceUpdateDialog';
import TransactionHistoryDialog from './TransactionHistoryDialog';

const Balance: React.FC = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);

  const fetchItems = async (forceRefresh: boolean = false) => {
    try {
      setLoading(true);
      setError(null);
      const items = await apiService.getInventoryWithBalance(forceRefresh);
      setItems(items);
    } catch (err) {
      console.error('Error fetching items:', err);
      setError(err instanceof Error ? err.message : 'Failed to load inventory');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchItems(true); // Force refresh
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleEditItem = (item: InventoryItem) => {
    setSelectedItem(item);
    setUpdateDialogOpen(true);
  };

  const handleViewHistory = (item: InventoryItem) => {
    setSelectedItem(item);
    setHistoryDialogOpen(true);
  };

  const handleUpdateSuccess = () => {
    fetchItems(); // Refresh the inventory list
  };

  const handleCloseUpdateDialog = () => {
    setUpdateDialogOpen(false);
    setSelectedItem(null);
  };

  const handleCloseHistoryDialog = () => {
    setHistoryDialogOpen(false);
    setSelectedItem(null);
  };

  const handleBackToDashboard = () => {
    navigate('/');
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
          <CircularProgress size={60} />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Main Content */}
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
              Current Inventory Balance
            </Typography>
          </Box>
        </Box>

        <InventoryTable
          items={items}
          loading={loading}
          error={error}
          onEditItem={handleEditItem}
          onViewHistory={handleViewHistory}
          onRefresh={handleRefresh}
        />
      </Paper>

      {/* Balance Update Dialog */}
      <BalanceUpdateDialog
        open={updateDialogOpen}
        onClose={handleCloseUpdateDialog}
        item={selectedItem}
        onUpdateSuccess={handleUpdateSuccess}
      />

      {/* Transaction History Dialog */}
      <TransactionHistoryDialog
        open={historyDialogOpen}
        onClose={handleCloseHistoryDialog}
        item={selectedItem}
      />
    </Container>
  );
};

export default Balance;