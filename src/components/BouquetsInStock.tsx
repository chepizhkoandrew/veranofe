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

const BouquetsInStock: React.FC = () => {
  const navigate = useNavigate();
  const [bouquets, setBouquets] = useState<BouquetInStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
  }, []);

  const handleBackToDashboard = () => {
    navigate('/');
  };

  const handleCreateNewBouquet = () => {
    navigate('/bouquets/create-template');
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
    </Container>
  );
};

export default BouquetsInStock;