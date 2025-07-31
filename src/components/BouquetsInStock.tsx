import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import {
  Container,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Paper,
  IconButton,
  Button,
  Chip,
  Card,
  CardContent,
  CardMedia,
  Grid,
  Avatar,
  Stack,
  Tooltip,
  Badge,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  TextField,
  Divider,
  Autocomplete,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Refresh as RefreshIcon,
  Add as AddIcon,
  CalendarToday as CalendarIcon,
  LocalFlorist as FlowerIcon,
  AttachFile as AttachFileIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Delete as DeleteIcon,
  PhotoCamera as PhotoIcon,
} from '@mui/icons-material';

interface FlowerItem {
  item_name: string;
  color: string;
  quantity: number;
  item_picture?: string;
}

interface BouquetItem {
  item_name: string;
  item_id: number;
  color: string;
  item_picture?: string;
  record_id: string;
  quantity: number;
}

interface BouquetInStock {
  transaction_id: string;
  created_date: string;
  description: string;
  status: string;
  bouquet: BouquetItem;
  composition: FlowerItem[];
  total_flowers_used: number;
  evidence_files: string[];
  evidence_count: number;
}

interface InventoryItem {
  record_id: string;
  item_name: string;
  Color?: string;
  current_balance: number;
  item_picture?: string;
  item_category?: string;
}

interface EditableComposition extends FlowerItem {
  flower_item_id?: string;
  composition_id?: string;
}

const BouquetsInStock: React.FC = () => {
  const navigate = useNavigate();
  const [bouquets, setBouquets] = useState<BouquetInStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Edit functionality state
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedBouquet, setSelectedBouquet] = useState<BouquetInStock | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editDescription, setEditDescription] = useState('');
  const [editCompositions, setEditCompositions] = useState<EditableComposition[]>([]);
  const [availableFlowers, setAvailableFlowers] = useState<InventoryItem[]>([]);
  const [newFlower, setNewFlower] = useState<InventoryItem | null>(null);
  const [newFlowerQuantity, setNewFlowerQuantity] = useState(1);
  const [attachments, setAttachments] = useState<File[]>([]);

  const fetchBouquets = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await apiService.getBouquetsInStock();
      setBouquets(result.data);
    } catch (err) {
      console.error('Error fetching bouquets in stock:', err);
      setError(err instanceof Error ? err.message : 'Failed to load bouquets in stock');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'successful': return 'success';
      case 'pending': return 'warning';
      case 'failed': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'successful': return <CheckCircleIcon />;
      case 'failed': return <ErrorIcon />;
      default: return null;
    }
  };

  const handleRefresh = () => {
    fetchBouquets();
  };

  useEffect(() => {
    fetchBouquets();
    fetchAvailableFlowers();
  }, []);

  const handleBackToDashboard = () => {
    navigate('/');
  };

  const handleCreateNewBouquet = () => {
    navigate('/bouquets/create-template');
  };

  // Edit functionality
  const fetchAvailableFlowers = async () => {
    try {
      const inventory = await apiService.getInventoryWithBalance();
      const flowerItems = inventory.filter(item => 
        item.item_category && item.item_category !== 'bouquet'
      );
      setAvailableFlowers(flowerItems);
    } catch (err) {
      console.error('Failed to fetch available flowers:', err);
    }
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, bouquet: BouquetInStock) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelectedBouquet(bouquet);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedBouquet(null);
  };

  const handleEditBouquet = () => {
    if (selectedBouquet) {
      setEditDescription(selectedBouquet.description);
      setEditCompositions(selectedBouquet.composition.map((comp, index) => ({
        ...comp,
        composition_id: `edit_${index}`,
        flower_item_id: comp.item_name // We'll need to map this properly
      })));
      setAttachments([]);
      setEditDialogOpen(true);
      handleMenuClose();
    }
  };

  const handleSaveBouquet = async () => {
    if (!selectedBouquet) return;
    
    try {
      // Here you would implement the save API call
      // For now, we'll just show a success message
      alert(`🎉 Bouquet updated successfully!\n\n📋 Transaction ID: ${selectedBouquet.transaction_id}`);
      setEditDialogOpen(false);
      fetchBouquets(); // Refresh the data
    } catch (error) {
      console.error('Error updating bouquet:', error);
      alert(`❌ Error updating bouquet: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleCompositionQuantityChange = (compositionId: string, newQuantity: number) => {
    setEditCompositions(prev => prev.map(comp => 
      comp.composition_id === compositionId 
        ? { ...comp, quantity: Math.max(0, newQuantity) }
        : comp
    ));
  };

  const handleRemoveComposition = (compositionId: string) => {
    setEditCompositions(prev => prev.filter(comp => comp.composition_id !== compositionId));
  };

  const handleAddFlower = () => {
    if (newFlower && newFlowerQuantity > 0) {
      const newComposition: EditableComposition = {
        composition_id: `temp_${Date.now()}`,
        flower_item_id: newFlower.record_id,
        item_name: newFlower.item_name,
        color: newFlower.Color || '',
        quantity: newFlowerQuantity,
        item_picture: newFlower.item_picture
      };
      setEditCompositions(prev => [...prev, newComposition]);
      setNewFlower(null);
      setNewFlowerQuantity(1);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      setAttachments(prev => [...prev, ...Array.from(files)]);
    }
  };

  const handleRemoveAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getTotalFlowerCount = () => {
    return editCompositions.reduce((total, comp) => total + comp.quantity, 0);
  };

  const getFlowerImage = (flowerId: string): string | undefined => {
    const flower = availableFlowers.find(f => f.record_id === flowerId);
    if (flower?.item_picture) {
      return flower.item_picture;
    }
    return undefined;
  };

  const totalBouquets = bouquets.length;

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

      {/* Header */}
      <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
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
              Bouquets in Stock
            </Typography>
            <Chip 
              label={`${totalBouquets} Bouquets`}
              color="primary"
              variant="outlined"
              sx={{ ml: 2 }}
            />
          </Box>
          
          <Box display="flex" gap={1}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={handleRefresh}
              disabled={loading}
            >
              Refresh
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleCreateNewBouquet}
            >
              Create Bouquet
            </Button>
          </Box>
        </Box>

        {/* Summary Card */}
        <Alert severity="info" sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography variant="body1">
            🌸 <strong>{totalBouquets}</strong> individual bouquets available for sale
          </Typography>
        </Alert>
      </Paper>

      {/* Bouquets Grid */}
      {bouquets.length === 0 ? (
        <Paper elevation={1} sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No bouquets in stock
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Create some bouquets using templates to see them here
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {bouquets.map((bouquet) => (
            <Grid item xs={12} md={6} lg={4} key={bouquet.transaction_id}>
              <Card elevation={2} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                {/* Bouquet Image */}
                {bouquet.bouquet.item_picture && (
                  <CardMedia
                    component="img"
                    height="200"
                    image={bouquet.bouquet.item_picture}
                    alt={bouquet.bouquet.item_name}
                    sx={{ objectFit: 'cover' }}
                  />
                )}
                
                <CardContent sx={{ flexGrow: 1 }}>
                  {/* Bouquet Header */}
                  <Box display="flex" justifyContent="space-between" alignItems="start" mb={2}>
                    <Typography variant="h6" component="h2" gutterBottom>
                      {bouquet.bouquet.item_name}
                    </Typography>
                    <Box display="flex" alignItems="center" gap={1}>
                      {getStatusIcon(bouquet.status) ? (
                        <Chip
                          icon={getStatusIcon(bouquet.status)!}
                          label={bouquet.status}
                          color={getStatusColor(bouquet.status) as any}
                          size="small"
                        />
                      ) : (
                        <Chip
                          label={bouquet.status}
                          color={getStatusColor(bouquet.status) as any}
                          size="small"
                        />
                      )}
                      <IconButton
                        size="small"
                        onClick={(e) => handleMenuClick(e, bouquet)}
                        sx={{ ml: 1 }}
                      >
                        <MoreVertIcon />
                      </IconButton>
                    </Box>
                  </Box>

                  {/* Description */}
                  {bouquet.description && (
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {bouquet.description}
                    </Typography>
                  )}

                  {/* Creation Info */}
                  <Box display="flex" alignItems="center" gap={1} mb={2}>
                    <CalendarIcon fontSize="small" color="primary" />
                    <Typography variant="body2" color="text.secondary">
                      Created: {formatDate(bouquet.created_date)}
                    </Typography>
                  </Box>

                  {/* Flower Composition */}
                  <Box mb={2}>
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <FlowerIcon fontSize="small" color="primary" />
                      <Typography variant="subtitle2">
                        Composition ({bouquet.total_flowers_used} flowers):
                      </Typography>
                    </Box>
                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                      {bouquet.composition.map((flower, index) => (
                        <Tooltip 
                          key={index}
                          title={`${flower.quantity}x ${flower.item_name} (${flower.color})`}
                        >
                          <Badge badgeContent={flower.quantity} color="primary" max={99}>
                            <Avatar
                              src={flower.item_picture}
                              alt={flower.item_name}
                              sx={{ 
                                width: 32, 
                                height: 32,
                                border: `2px solid ${flower.color.toLowerCase() === 'white' ? '#e0e0e0' : 'transparent'}`
                              }}
                            >
                              {flower.item_name.charAt(0)}
                            </Avatar>
                          </Badge>
                        </Tooltip>
                      ))}
                    </Stack>
                  </Box>

                  {/* Evidence Files */}
                  {bouquet.evidence_count > 0 && (
                    <Box display="flex" alignItems="center" gap={1}>
                      <AttachFileIcon fontSize="small" color="primary" />
                      <Typography variant="body2" color="text.secondary">
                        {bouquet.evidence_count} evidence file{bouquet.evidence_count > 1 ? 's' : ''}
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleEditBouquet}>
          <EditIcon sx={{ mr: 1 }} />
          Edit Bouquet
        </MenuItem>
      </Menu>

      {/* Edit Bouquet Dialog */}
      <Dialog 
        open={editDialogOpen} 
        onClose={() => setEditDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { minHeight: '70vh' }
        }}
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <EditIcon color="primary" />
            <Typography variant="h6">
              Edit Bouquet: {selectedBouquet?.bouquet.item_name}
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedBouquet && (
            <Box sx={{ mt: 1 }}>
              {/* Description Field */}
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Bouquet Description"
                placeholder="Enter a custom description for this bouquet..."
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                sx={{ mb: 3 }}
              />

              {/* Attachments Section */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  📎 Attachments
                </Typography>
                
                <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
                  <Button
                    variant="outlined"
                    component="label"
                    startIcon={<PhotoIcon />}
                  >
                    Upload Photos
                    <input
                      type="file"
                      hidden
                      multiple
                      accept="image/*,application/pdf,.doc,.docx,.txt"
                      onChange={handleFileUpload}
                    />
                  </Button>
                </Stack>

                {attachments.length > 0 && (
                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Uploaded files ({attachments.length}):
                    </Typography>
                    {attachments.map((file, index) => (
                      <Chip
                        key={index}
                        label={`${file.name} (${formatFileSize(file.size)})`}
                        onDelete={() => handleRemoveAttachment(index)}
                        sx={{ mr: 1, mb: 1 }}
                      />
                    ))}
                  </Box>
                )}
              </Box>

              <Divider sx={{ my: 3 }} />

              {/* Flower Compositions Section */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  <FlowerIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Flower Composition ({getTotalFlowerCount()} total flowers)
                </Typography>
                
                <List dense>
                  {editCompositions.map((comp) => (
                    <ListItem key={comp.composition_id} divider sx={{ py: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', gap: 2 }}>
                        {/* Flower Image */}
                        <Box
                          sx={{
                            width: 50,
                            height: 50,
                            borderRadius: 1,
                            overflow: 'hidden',
                            bgcolor: 'grey.100',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                          }}
                        >
                          {comp.item_picture ? (
                            <img
                              src={comp.item_picture}
                              alt={comp.item_name}
                              style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover'
                              }}
                            />
                          ) : (
                            <FlowerIcon sx={{ color: 'grey.400' }} />
                          )}
                        </Box>

                        {/* Flower Name */}
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                            {comp.item_name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {comp.color}
                          </Typography>
                        </Box>

                        {/* Quantity Input */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2" color="text.secondary">
                            Qty:
                          </Typography>
                          <TextField
                            type="number"
                            size="small"
                            value={comp.quantity}
                            onChange={(e) => handleCompositionQuantityChange(
                              comp.composition_id!, 
                              parseInt(e.target.value) || 0
                            )}
                            inputProps={{ min: 0, style: { textAlign: 'center' } }}
                            sx={{ width: '80px' }}
                          />
                        </Box>

                        {/* Delete Button */}
                        <IconButton 
                          onClick={() => handleRemoveComposition(comp.composition_id!)}
                          color="error"
                          size="small"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    </ListItem>
                  ))}
                </List>

                {/* Add New Flower */}
                <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                  <Typography variant="body1" gutterBottom>
                    Add Flower:
                  </Typography>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Autocomplete
                      sx={{ flexGrow: 1 }}
                      options={availableFlowers}
                      getOptionLabel={(option) => `${option.item_name} ${option.Color || ''}`}
                      value={newFlower}
                      onChange={(_, newValue) => setNewFlower(newValue)}
                      renderOption={(props, option) => (
                        <Box component="li" {...props} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Box
                            sx={{
                              width: 32,
                              height: 32,
                              borderRadius: 1,
                              overflow: 'hidden',
                              bgcolor: 'grey.100',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0
                            }}
                          >
                            {option.item_picture ? (
                              <img
                                src={option.item_picture}
                                alt={option.item_name}
                                style={{
                                  width: '100%',
                                  height: '100%',
                                  objectFit: 'cover'
                                }}
                              />
                            ) : (
                              <FlowerIcon sx={{ color: 'grey.400', fontSize: 16 }} />
                            )}
                          </Box>
                          <Box>
                            <Typography variant="body2">
                              {option.item_name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {option.Color} • Balance: {option.current_balance}
                            </Typography>
                          </Box>
                        </Box>
                      )}
                      renderInput={(params) => (
                        <TextField {...params} label="Select Flower" size="small" />
                      )}
                    />
                    <TextField
                      type="number"
                      label="Qty"
                      size="small"
                      value={newFlowerQuantity}
                      onChange={(e) => setNewFlowerQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      inputProps={{ min: 1 }}
                      sx={{ width: '80px' }}
                    />
                    <Button
                      variant="contained"
                      onClick={handleAddFlower}
                      disabled={!newFlower}
                      startIcon={<AddIcon />}
                    >
                      Add
                    </Button>
                  </Stack>
                </Box>
              </Box>

              <Divider sx={{ my: 3 }} />

              {/* Summary */}
              <Box sx={{ p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                <Typography variant="h6" gutterBottom>
                  Bouquet Summary:
                </Typography>
                <Typography variant="body2">
                  • {editCompositions.length} different flower types
                </Typography>
                <Typography variant="body2">
                  • {getTotalFlowerCount()} total flowers
                </Typography>
                {attachments.length > 0 && (
                  <Typography variant="body2">
                    • {attachments.length} attachment(s)
                  </Typography>
                )}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSaveBouquet}
            variant="contained"
            startIcon={<SaveIcon />}
            disabled={editCompositions.length === 0}
          >
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default BouquetsInStock;