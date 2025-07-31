import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  IconButton,
  Paper,
  Alert,
  Grid,
  Card,
  CardContent,
  CardActionArea,
  CardMedia,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  CircularProgress,
  Divider,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Stack,
  Autocomplete,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  ContentCopy as TemplateIcon,
  LocalFlorist as FlowerIcon,
  Add as AddIcon,
  ShoppingCart as CreateIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  AttachFile as AttachmentIcon,
  PhotoCamera as PhotoIcon,
} from '@mui/icons-material';
import { BouquetTemplate, BouquetComposition, InventoryItem, apiService } from '../../services/api';

interface EditableComposition extends BouquetComposition {
  isEditing?: boolean;
}

const CreateBouquetTemplate: React.FC = () => {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<BouquetTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<BouquetTemplate | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  // Enhanced form state
  const [description, setDescription] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [compositions, setCompositions] = useState<EditableComposition[]>([]);
  const [availableFlowers, setAvailableFlowers] = useState<InventoryItem[]>([]);
  const [newFlower, setNewFlower] = useState<InventoryItem | null>(null);
  const [newFlowerQuantity, setNewFlowerQuantity] = useState(1);

  useEffect(() => {
    fetchTemplates();
    fetchAvailableFlowers();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const data = await apiService.getBouquetTemplates();
      setTemplates(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch bouquet templates');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableFlowers = async () => {
    try {
      const inventory = await apiService.getInventoryWithBalance();
      // Filter only flower items (not bouquet category)
      const flowerItems = inventory.filter(item => 
        item.item_category && item.item_category !== 'bouquet'
      );
      setAvailableFlowers(flowerItems);
    } catch (err) {
      console.error('Failed to fetch available flowers:', err);
    }
  };

  const handleBack = () => {
    navigate('/bouquets');
  };

  const handleTemplateSelect = (template: BouquetTemplate) => {
    setSelectedTemplate(template);
    setCompositions(template.compositions.map(comp => ({ ...comp, isEditing: false })));
    setDescription('');
    setAttachments([]);
    setDialogOpen(true);
  };

  const handleCreateBouquet = async () => {
    if (!selectedTemplate) return;
    
    try {
      // Prepare form data
      const formData = new FormData();
      formData.append('template_id', selectedTemplate.id);
      formData.append('description', description);
      
      // Convert compositions to the format expected by backend
      const compositionsData = compositions.map(comp => ({
        flower_item_id: comp.flower_item_id,
        quantity: comp.quantity
      }));
      formData.append('compositions', JSON.stringify(compositionsData));
      
      // Add files
      attachments.forEach(file => {
        formData.append('files', file);
      });
      
      // Make API call
      const result = await apiService.createBouquetFromTemplate(formData);
      
      // Show success message
      alert(`🎉 Bouquet created successfully!\n\n📋 Transaction ID: ${result.data.transaction_id}\n🌸 Total flowers used: ${result.data.total_flowers_used}\n📎 Files uploaded: ${result.uploaded_files}\n⚡ API efficiency: Only ${result.data.api_calls_used} API calls used`);
      
      setDialogOpen(false);
      
      // Optionally refresh data or navigate
      // navigate('/bouquets');
      
    } catch (error) {
      console.error('Error creating bouquet:', error);
      alert(`❌ Error creating bouquet: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleCompositionQuantityChange = (compositionId: string, newQuantity: number) => {
    setCompositions(prev => prev.map(comp => 
      comp.composition_id === compositionId 
        ? { ...comp, quantity: Math.max(0, newQuantity) }
        : comp
    ));
  };

  const handleRemoveComposition = (compositionId: string) => {
    setCompositions(prev => prev.filter(comp => comp.composition_id !== compositionId));
  };

  const handleAddFlower = () => {
    if (newFlower && newFlowerQuantity > 0) {
      const newComposition: EditableComposition = {
        composition_id: `temp_${Date.now()}`, // Temporary ID
        flower_item_id: newFlower.record_id,
        flower_name: newFlower.item_name,
        flower_color: newFlower.Color || '',
        quantity: newFlowerQuantity,
        isEditing: false
      };
      setCompositions(prev => [...prev, newComposition]);
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

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  const getImageUrl = (image: any[]) => {
    if (image && image.length > 0) {
      return image[0].thumbnails?.large?.url || image[0].url;
    }
    return null;
  };

  const getTotalFlowerCount = () => {
    return compositions.reduce((total, comp) => total + comp.quantity, 0);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFlowerImage = (flowerId: string): string | undefined => {
    const flower = availableFlowers.find(f => f.record_id === flowerId);
    if (flower?.item_picture) {
      // item_picture is a string URL in inventory API
      return flower.item_picture;
    }
    return undefined;
  };

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <IconButton onClick={handleBack} sx={{ mr: 2 }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4">📋 Create Bouquet by Template</Typography>
        </Box>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress size={60} />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <IconButton onClick={handleBack} sx={{ mr: 2 }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4">📋 Create Bouquet by Template</Typography>
        </Box>
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton
          onClick={handleBack}
          sx={{
            mr: 2,
            bgcolor: 'grey.100',
            '&:hover': { bgcolor: 'grey.200' }
          }}
        >
          <ArrowBackIcon />
        </IconButton>
        <TemplateIcon sx={{ mr: 1, fontSize: 32, color: 'primary.main' }} />
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
          📋 Create Bouquet by Template
        </Typography>
      </Box>

      {templates.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <TemplateIcon sx={{ fontSize: 80, color: 'grey.400', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No bouquet templates found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Create some bouquet templates first to use this feature
          </Typography>
        </Paper>
      ) : (
        <>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Select a template to create a new bouquet. Templates include predefined flower combinations and quantities.
          </Typography>

          <Grid container spacing={3}>
            {templates.map((template) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={template.id}>
                <Card 
                  sx={{ 
                    height: '100%',
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 6,
                    },
                    cursor: 'pointer'
                  }}
                >
                  <CardActionArea 
                    onClick={() => handleTemplateSelect(template)}
                    sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}
                  >
                    {getImageUrl(template.image) && (
                      <CardMedia
                        component="img"
                        height="200"
                        image={getImageUrl(template.image)}
                        alt={template.name}
                        sx={{ objectFit: 'cover' }}
                      />
                    )}
                    <CardContent sx={{ flexGrow: 1, p: 2 }}>
                      <Typography variant="h6" component="h3" gutterBottom sx={{ fontWeight: 'bold' }}>
                        {template.name}
                      </Typography>
                      
                      {template.description && (
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          {template.description}
                        </Typography>
                      )}
                      
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Chip 
                          icon={<FlowerIcon />}
                          label={`${template.compositions.length} flower types`}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                        <Typography variant="h6" color="primary.main" sx={{ fontWeight: 'bold' }}>
                          {formatPrice(template.price)}
                        </Typography>
                      </Box>
                      
                      <Button
                        fullWidth
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTemplateSelect(template);
                        }}
                      >
                        Create Bouquet
                      </Button>
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Grid>
            ))}
          </Grid>
        </>
      )}

      {/* Enhanced Bouquet Creation Dialog */}
      <Dialog 
        open={dialogOpen} 
        onClose={() => setDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { minHeight: '70vh' }
        }}
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <TemplateIcon color="primary" />
            <Typography variant="h6">
              Create Bouquet from: {selectedTemplate?.name}
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedTemplate && (
            <Box sx={{ mt: 1 }}>
              {/* Description Field */}
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Bouquet Description"
                placeholder="Enter a custom description for this bouquet..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                sx={{ mb: 3 }}
              />

              {/* Attachments Section */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  <AttachmentIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Attachments
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
                  {compositions.map((comp) => (
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
                          {getFlowerImage(comp.flower_item_id) ? (
                            <img
                              src={getFlowerImage(comp.flower_item_id)}
                              alt={comp.flower_name}
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
                            {comp.flower_name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {comp.flower_color}
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
                              comp.composition_id, 
                              parseInt(e.target.value) || 0
                            )}
                            inputProps={{ min: 0, style: { textAlign: 'center' } }}
                            sx={{ width: '80px' }}
                          />
                        </Box>

                        {/* Delete Button */}
                        <IconButton 
                          onClick={() => handleRemoveComposition(comp.composition_id)}
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
                  • {compositions.length} different flower types
                </Typography>
                <Typography variant="body2">
                  • {getTotalFlowerCount()} total flowers
                </Typography>
                <Typography variant="body2">
                  • Base template price: {formatPrice(selectedTemplate.price)}
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
          <Button onClick={() => setDialogOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleCreateBouquet}
            variant="contained"
            startIcon={<CreateIcon />}
            disabled={compositions.length === 0}
          >
            Create Bouquet
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default CreateBouquetTemplate;