import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Button,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Autocomplete,
  Card,
  CardContent,
  Avatar,
  Chip,
  Alert,
  CircularProgress,
  Grid,
  Divider,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  LocalFlorist as FlowerIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
// Removed date picker imports - using simple HTML date input instead
import { apiService, Supplier, InventoryItem, PurchaseRequestCreate, PurchaseRequestItem } from '../services/api';
import QuantityPickerDialog from './QuantityPickerDialog';

interface CreatePurchaseRequestProps {
  onBack: () => void;
  onSuccess: () => void;
}

interface SelectedItem extends InventoryItem {
  quantity: number;
}

const CreatePurchaseRequest: React.FC<CreatePurchaseRequestProps> = ({ onBack, onSuccess }) => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<string>('');
  const [expectedDelivery, setExpectedDelivery] = useState<string>('');
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Quantity picker dialog state
  const [quantityDialogOpen, setQuantityDialogOpen] = useState(false);
  const [selectedItemForQuantity, setSelectedItemForQuantity] = useState<InventoryItem | null>(null);
  const [editingQuantity, setEditingQuantity] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoadingData(true);
      setError(null);

      const [suppliersData, itemsData] = await Promise.all([
        apiService.getSuppliers(),
        apiService.getItems()
      ]);

      setSuppliers(suppliersData);
      setItems(itemsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoadingData(false);
    }
  };

  const handleAddItem = (item: InventoryItem | null) => {
    if (!item) return;

    // Open quantity picker dialog for new items
    setSelectedItemForQuantity(item);
    setEditingQuantity(false);
    setQuantityDialogOpen(true);
  };

  const handleEditQuantity = (item: SelectedItem) => {
    setSelectedItemForQuantity(item);
    setEditingQuantity(true);
    setQuantityDialogOpen(true);
  };

  const handleQuantityConfirm = (quantity: number) => {
    if (!selectedItemForQuantity) return;

    if (editingQuantity) {
      // Update existing item quantity
      if (quantity === 0) {
        // Remove item if quantity is 0
        handleRemoveItem(selectedItemForQuantity.record_id);
      } else {
        const updatedItems = selectedItems.map(item => 
          item.record_id === selectedItemForQuantity.record_id ? { ...item, quantity } : item
        );
        setSelectedItems(updatedItems);
      }
    } else {
      // Add new item or update existing
      const existingIndex = selectedItems.findIndex(selectedItem => selectedItem.record_id === selectedItemForQuantity.record_id);
      
      if (existingIndex >= 0) {
        // Update existing item
        if (quantity === 0) {
          handleRemoveItem(selectedItemForQuantity.record_id);
        } else {
          const updatedItems = [...selectedItems];
          updatedItems[existingIndex].quantity = quantity;
          setSelectedItems(updatedItems);
        }
      } else {
        // Add new item (only if quantity > 0)
        if (quantity > 0) {
          setSelectedItems([...selectedItems, { ...selectedItemForQuantity, quantity }]);
        }
      }
    }

    setQuantityDialogOpen(false);
    setSelectedItemForQuantity(null);
    setEditingQuantity(false);
  };

  const handleRemoveItem = (recordId: string) => {
    setSelectedItems(selectedItems.filter(item => item.record_id !== recordId));
  };

  const handleSubmit = async () => {
    if (!selectedSupplier) {
      setError('Please select a supplier');
      return;
    }

    if (selectedItems.length === 0) {
      setError('Please add at least one item');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const requestData: PurchaseRequestCreate = {
        supplier_id: selectedSupplier,
        expected_delivery: expectedDelivery || undefined,
        items: selectedItems.map(item => ({
          item_id: item.record_id,
          quantity: item.quantity
        })),
        description: description || undefined
      };

      await apiService.createPurchaseRequest(requestData);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create purchase request');
    } finally {
      setLoading(false);
    }
  };

  const getColorStyles = (color: string) => {
    const colorLower = color.toLowerCase();
    
    const colorMap: { [key: string]: { backgroundColor: string; color: string } } = {
      'burgundy': { backgroundColor: '#660033', color: 'white' },
      'peach': { backgroundColor: '#ffe5b4', color: 'black' },
      'mix': { 
        backgroundColor: 'linear-gradient(45deg, #ff0000, #ff8000, #ffff00, #80ff00, #00ff00, #00ff80, #00ffff, #0080ff, #0000ff, #8000ff, #ff00ff, #ff0080)',
        color: 'white' 
      },
      'white': { backgroundColor: 'white', color: 'black' },
      'cream': { backgroundColor: 'cream', color: 'black' },
      'yellow': { backgroundColor: 'yellow', color: 'black' },
    };

    return colorMap[colorLower] || { backgroundColor: colorLower, color: 'white' };
  };

  if (loadingData) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      {/* Header */}
      <Box display="flex" alignItems="center" gap={2} mb={3}>
        <IconButton
          onClick={onBack}
          sx={{ 
            bgcolor: 'grey.200', 
            '&:hover': { bgcolor: 'grey.300' }
          }}
        >
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h5" component="h2">
          Create Purchase Request
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Form Section */}
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Request Details
            </Typography>

            {/* Supplier Selection */}
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Supplier</InputLabel>
              <Select
                value={selectedSupplier}
                onChange={(e) => setSelectedSupplier(e.target.value)}
                label="Supplier"
              >
                {suppliers.map((supplier) => (
                  <MenuItem key={supplier.supplier_id} value={supplier.supplier_id}>
                    {supplier.supplier_name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Expected Delivery Date */}
            <TextField
              label="Expected Delivery Date"
              type="date"
              value={expectedDelivery}
              onChange={(e) => setExpectedDelivery(e.target.value)}
              InputLabelProps={{
                shrink: true,
              }}
              fullWidth
              sx={{ mb: 3 }}
            />

            {/* Description */}
            <TextField
              label="Description (Optional)"
              multiline
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description for this purchase request"
              fullWidth
              sx={{ mb: 3 }}
            />

            <Divider sx={{ my: 3 }} />

            {/* Add Items */}
            <Typography variant="h6" gutterBottom>
              Add Items
            </Typography>
            
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Search for an item and select it. You'll be prompted to enter the quantity.
            </Typography>

            <Autocomplete
              options={items}
              getOptionLabel={(option) => `${option.item_name} (${option.Color})`}
              onChange={(event, newValue) => handleAddItem(newValue)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Search and add items"
                  placeholder="Type to search for flowers or items..."
                />
              )}
              renderOption={(props, option) => (
                <Box component="li" {...props} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar
                    src={option.item_picture}
                    sx={{ 
                      width: 32, 
                      height: 32,
                      bgcolor: 'grey.300'
                    }}
                    variant="rounded"
                  >
                    {option.item_name.charAt(0).toUpperCase()}
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2">{option.item_name}</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip 
                        label={option.Color} 
                        size="small" 
                        sx={{
                          ...getColorStyles(option.Color),
                          fontSize: '0.7rem',
                          height: 20
                        }}
                      />
                      <Typography variant="caption" color="text.secondary">
                        {option.item_category}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              )}
            />
          </Paper>
        </Grid>

        {/* Selected Items Section */}
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Selected Items ({selectedItems.length})
            </Typography>

            {selectedItems.length === 0 ? (
              <Box 
                sx={{ 
                  textAlign: 'center', 
                  py: 4,
                  color: 'text.secondary'
                }}
              >
                <FlowerIcon sx={{ fontSize: 48, mb: 2 }} />
                <Typography>
                  No items selected yet
                </Typography>
                <Typography variant="body2">
                  Search and select items above to add them with quantity
                </Typography>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {selectedItems.map((item) => (
                  <Card key={item.record_id} variant="outlined">
                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar
                          src={item.item_picture}
                          sx={{ 
                            width: 48, 
                            height: 48,
                            bgcolor: 'grey.300'
                          }}
                          variant="rounded"
                        >
                          {item.item_name.charAt(0).toUpperCase()}
                        </Avatar>
                        
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="body2" fontWeight="medium">
                            {item.item_name}
                          </Typography>
                          <Chip 
                            label={item.Color} 
                            size="small" 
                            sx={{
                              ...getColorStyles(item.Color),
                              fontSize: '0.7rem',
                              height: 20,
                              mt: 0.5
                            }}
                          />
                        </Box>

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={() => handleEditQuantity(item)}
                            startIcon={<EditIcon />}
                            sx={{ minWidth: 100 }}
                          >
                            Qty: {item.quantity}
                          </Button>
                          <IconButton
                            onClick={() => handleRemoveItem(item.record_id)}
                            color="error"
                            size="small"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Submit Button */}
      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
        <Button onClick={onBack} variant="outlined">
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading || !selectedSupplier || selectedItems.length === 0}
          startIcon={loading ? <CircularProgress size={16} /> : <SaveIcon />}
        >
          {loading ? 'Creating...' : 'Create Purchase Request'}
        </Button>
      </Box>

      {/* Quantity Picker Dialog */}
      <QuantityPickerDialog
        open={quantityDialogOpen}
        onClose={() => {
          setQuantityDialogOpen(false);
          setSelectedItemForQuantity(null);
          setEditingQuantity(false);
        }}
        item={selectedItemForQuantity}
        currentQuantity={editingQuantity ? selectedItems.find(item => item.record_id === selectedItemForQuantity?.record_id)?.quantity || 0 : 0}
        onConfirm={handleQuantityConfirm}
        title={editingQuantity ? "Edit Quantity" : "Set Quantity"}
      />
    </>
  );
};

export default CreatePurchaseRequest;