import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  IconButton,
  Paper,
  Grid,
  Button,
  TextField,
  CircularProgress,
  Alert,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Card,
  CardMedia,
  CardActions,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  PhotoCamera as PhotoCameraIcon,
  AttachMoney as AttachMoneyIcon,
} from '@mui/icons-material';
import { apiService, PurchaseRequest, InventoryItem, Supplier, AirtableAttachment } from '../services/api';

interface PurchaseRequestEditProps {}

interface EditableItem {
  requested_item_id?: string;
  item_id: string;
  item_name: string;
  Color: string;
  quantity: number;
  isNew?: boolean;
}

const PurchaseRequestEdit: React.FC<PurchaseRequestEditProps> = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [purchaseRequest, setPurchaseRequest] = useState<PurchaseRequest | null>(null);
  const [editableItems, setEditableItems] = useState<EditableItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  
  // Add item dialog state
  const [addItemDialogOpen, setAddItemDialogOpen] = useState(false);
  const [selectedNewItem, setSelectedNewItem] = useState<string>('');
  const [newItemQuantity, setNewItemQuantity] = useState<number>(1);
  
  // Editable fields
  const [description, setDescription] = useState<string>('');
  const [prPrice, setPrPrice] = useState<number | ''>('');
  const [photos, setPhotos] = useState<(string | AirtableAttachment)[]>([]);

  useEffect(() => {
    if (id) {
      loadPurchaseRequest(id);
      loadSuppliers();
      loadInventory();
    }
  }, [id]);

  const loadPurchaseRequest = async (purchaseRequestId: string) => {
    try {
      setLoading(true);
      setError(null);
      const request = await apiService.getPurchaseRequest(purchaseRequestId);
      setPurchaseRequest(request);
      
      // Populate editable fields
      setDescription(request.description || '');
      setPrPrice(request.pr_price || '');
      
      // Handle both legacy photos (base64 strings) and new attachments
      const allPhotos: (string | AirtableAttachment)[] = [
        ...(request.photos || []), // Legacy base64 photos
        ...(request.purchase_order_attachment || []) // New Airtable attachments
      ];
      setPhotos(allPhotos);
      
      // Convert to editable format
      const editable = request.items.map(item => ({
        requested_item_id: item.requested_item_id,
        item_id: item.item_id,
        item_name: item.item_name,
        Color: item.Color,
        quantity: item.quantity,
        isNew: false,
      }));
      setEditableItems(editable);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load purchase request');
    } finally {
      setLoading(false);
    }
  };

  const loadSuppliers = async () => {
    try {
      const suppliersData = await apiService.getSuppliers();
      setSuppliers(suppliersData);
    } catch (err) {
      console.error('Failed to load suppliers:', err);
    }
  };

  const loadInventory = async () => {
    try {
      const inventoryData = await apiService.getInventoryWithBalance();
      setInventory(inventoryData);
    } catch (err) {
      console.error('Failed to load inventory:', err);
    }
  };

  const handleQuantityChange = (index: number, newQuantity: number) => {
    if (newQuantity < 1) return;
    
    setEditableItems(prev => prev.map((item, i) => 
      i === index ? { ...item, quantity: newQuantity } : item
    ));
  };

  const handleRemoveItem = (index: number) => {
    setEditableItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddItem = () => {
    const selectedInventoryItem = inventory.find(item => item.record_id === selectedNewItem);
    if (!selectedInventoryItem) return;

    const newItem: EditableItem = {
      item_id: selectedInventoryItem.record_id,
      item_name: selectedInventoryItem.item_name,
      Color: selectedInventoryItem.Color,
      quantity: newItemQuantity,
      isNew: true,
    };

    setEditableItems(prev => [...prev, newItem]);
    setAddItemDialogOpen(false);
    setSelectedNewItem('');
    setNewItemQuantity(1);
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || !id) return;

    try {
      setSaving(true);
      
      // Create FormData for file upload
      const formData = new FormData();
      Array.from(files).forEach(file => {
        formData.append('files', file);
      });

      // Upload photos to backend
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/purchase-requests/${id}/upload-photos`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload photos');
      }

      const result = await response.json();
      
      // Reload the purchase request to get updated photos
      await loadPurchaseRequest(id);
      
      // Show success message
      console.log(`✅ Uploaded ${result.uploaded} photos successfully`);
      
    } catch (error) {
      console.error('❌ Failed to upload photos:', error);
      setError('Failed to upload photos. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleRemovePhoto = async (index: number) => {
    try {
      setSaving(true);
      const photoToRemove = photos[index];
      
      // If it's an Airtable attachment, we need to call the API to remove it
      // For now, just remove from state - you can implement deletion API later
      if (typeof photoToRemove === 'object' && photoToRemove.id) {
        console.log('⚠️ TODO: Implement Airtable attachment deletion for:', photoToRemove.id);
      }
      
      setPhotos(prev => prev.filter((_, i) => i !== index));
    } catch (error) {
      console.error('❌ Failed to remove photo:', error);
      setError('Failed to remove photo. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    if (!purchaseRequest || !id) return;

    // Validate required fields
    if (!purchaseRequest.supplier_id) {
      setError('Supplier ID is required');
      return;
    }

    if (editableItems.length === 0) {
      setError('At least one item is required');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const updateData = {
        supplier_id: Array.isArray(purchaseRequest.supplier_id) 
          ? purchaseRequest.supplier_id[0] 
          : purchaseRequest.supplier_id,
        expected_delivery: purchaseRequest.Expected_delivery,
        description: description.trim() || undefined,
        pr_price: typeof prPrice === 'number' ? prPrice : undefined,
        // Photos are now uploaded separately via handlePhotoUpload
        items: editableItems.map(item => ({
          item_id: item.item_id,
          quantity: item.quantity,
        })),
      };

      // Call update endpoint
      await apiService.updatePurchaseRequest(id, updateData);
      
      // Navigate back to list
      navigate('/receive/requests');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save purchase request');
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return 'Not set';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return 'Invalid date';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'created':
        return 'info';
      case 'confirmed by vendor':
        return 'success';
      case 'cancelled':
        return 'error';
      case 'received to stock':
        return 'success';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error || !purchaseRequest) {
    return (
      <Box p={3}>
        <Alert severity="error">
          {error || 'Purchase request not found'}
        </Alert>
        <Button 
          variant="outlined" 
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/receive/requests')}
          sx={{ mt: 2 }}
        >
          Back to List
        </Button>
      </Box>
    );
  }

  return (
    <Box p={3}>
      {/* Header */}
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
        <Box display="flex" alignItems="center" gap={2}>
          <IconButton
            onClick={() => navigate('/receive/requests')}
            sx={{ 
              bgcolor: 'grey.200', 
              '&:hover': { bgcolor: 'grey.300' }
            }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h5" component="h2">
            Edit Purchase Request #{purchaseRequest.purchase_order_id.slice(-6)}
          </Typography>
        </Box>
        
        <Button
          variant="contained"
          startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
          onClick={handleSave}
          disabled={saving || editableItems.length === 0}
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Purchase Request Info */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Request Details
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Status
                </Typography>
                <Chip
                  label={purchaseRequest.Status || 'Unknown'}
                  color={getStatusColor(purchaseRequest.Status || '')}
                  size="small"
                />
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Supplier
                </Typography>
                <Typography variant="body1">
                  {purchaseRequest.supplier_name || 'Unknown'}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Created
                </Typography>
                <Typography variant="body1">
                  {formatDate(purchaseRequest.Created_at)}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Expected Delivery
                </Typography>
                <Typography variant="body1">
                  {formatDate(purchaseRequest.Expected_delivery)}
                </Typography>
              </Box>
              
              {/* Editable Description */}
              <Box>
                <TextField
                  fullWidth
                  label="Description"
                  multiline
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add a description for this purchase request..."
                  variant="outlined"
                  size="small"
                />
              </Box>
              
              {/* Editable Price */}
              <Box>
                <TextField
                  fullWidth
                  label="Purchase Request Price"
                  type="number"
                  value={prPrice}
                  onChange={(e) => setPrPrice(e.target.value ? parseFloat(e.target.value) : '')}
                  InputProps={{
                    startAdornment: <AttachMoneyIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                  }}
                  placeholder="0.00"
                  variant="outlined"
                  size="small"
                />
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* Items Section */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">
                Requested Items ({editableItems.length})
              </Typography>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={() => setAddItemDialogOpen(true)}
                size="small"
              >
                Add Item
              </Button>
            </Box>

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Item</TableCell>
                    <TableCell>Color</TableCell>
                    <TableCell width="120px">Quantity</TableCell>
                    <TableCell width="80px">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {editableItems.map((item, index) => (
                    <TableRow key={`${item.item_id}-${index}`}>
                      <TableCell>
                        <Typography variant="body2">
                          {item.item_name}
                        </Typography>
                        {item.isNew && (
                          <Chip label="New" size="small" color="primary" sx={{ mt: 0.5 }} />
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {item.Color || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <TextField
                          type="number"
                          value={item.quantity}
                          onChange={(e) => handleQuantityChange(index, parseInt(e.target.value) || 1)}
                          size="small"
                          inputProps={{ min: 1 }}
                          sx={{ width: '80px' }}
                        />
                      </TableCell>
                      <TableCell>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleRemoveItem(index)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                  {editableItems.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                        <Typography color="text.secondary">
                          No items in this purchase request
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>

      {/* Photos Section */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Photos
        </Typography>
        
        {/* Upload Button */}
        <Box sx={{ mb: 2 }}>
          <Button
            variant="outlined"
            component="label"
            startIcon={<PhotoCameraIcon />}
            size="small"
          >
            Add Photos
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handlePhotoUpload}
              style={{ display: 'none' }}
            />
          </Button>
        </Box>

        {/* Photos Grid */}
        {photos.length > 0 ? (
          <Grid container spacing={2}>
            {photos.map((photo, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Card>
                  <CardMedia
                    component="img"
                    height="200"
                    image={typeof photo === 'string' ? photo : photo.url}
                    alt={typeof photo === 'string' ? `Photo ${index + 1}` : photo.filename || `Photo ${index + 1}`}
                    sx={{ objectFit: 'cover' }}
                  />
                  <CardActions>
                    <Button
                      size="small"
                      color="error"
                      startIcon={<DeleteIcon />}
                      onClick={() => handleRemovePhoto(index)}
                      disabled={saving}
                    >
                      Remove
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        ) : (
          <Typography color="text.secondary" variant="body2">
            No photos attached. Click "Add Photos" to upload images.
          </Typography>
        )}
      </Paper>

      {/* Add Item Dialog */}
      <Dialog open={addItemDialogOpen} onClose={() => setAddItemDialogOpen(false)}>
        <DialogTitle>Add Item to Purchase Request</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1, minWidth: '300px' }}>
            <TextField
              select
              fullWidth
              label="Select Item"
              value={selectedNewItem}
              onChange={(e) => setSelectedNewItem(e.target.value)}
              SelectProps={{ native: true }}
              sx={{ mb: 2 }}
            >
              <option value="">Choose an item...</option>
              {inventory
                .filter(invItem => !editableItems.some(edItem => edItem.item_id === invItem.record_id))
                .map((item) => (
                  <option key={item.record_id} value={item.record_id}>
                    {item.item_name} {item.Color ? `(${item.Color})` : ''}
                  </option>
                ))}
            </TextField>
            
            <TextField
              type="number"
              fullWidth
              label="Quantity"
              value={newItemQuantity}
              onChange={(e) => setNewItemQuantity(parseInt(e.target.value) || 1)}
              inputProps={{ min: 1 }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddItemDialogOpen(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={handleAddItem}
            disabled={!selectedNewItem}
          >
            Add Item
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PurchaseRequestEdit;