import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardMedia,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
  IconButton,
  Alert,
  Autocomplete,
  Chip,
  Tabs,
  Tab,
  ToggleButton,
  ToggleButtonGroup,
  Paper,
  Badge,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Stack,
  Tooltip,
  Box as MuiBox,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon,
  Save as SaveIcon,
  LocalFlorist as LocalFloristIcon,
  Cake as BouquetIcon,
  ShoppingCart as CartIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  Delete as DeleteIcon,
  Check as CheckIcon,
  Search as SearchIcon,
  Photo as PhotoIcon,
  AttachFile as AttachFileIcon,
  CalendarToday as CalendarIcon,
  LocalShipping as DeliveryIcon,
} from '@mui/icons-material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import NumberPad from './bouquets/NumberPad';
import NumericPadModal from './NumericPadModal';
import { apiService } from '../services/api';

const API_BASE_URL = (process.env.REACT_APP_API_URL || 'http://localhost:8000').replace(/\/$/, '');

// Configure axios to include auth token in all requests
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ============================================================================
// INTERFACES
// ============================================================================

interface Client {
  id: string;
  fields: {
    client_name: string;
    phone?: string;
    email?: string;
  };
}

interface FlowerItem {
  record_id: string;
  item_id: string;
  item_name: string;
  Color: string;
  current_balance: number;
  reserved_qty: number;
  shop_location_id: string;
  shop_location_name: string;
  flower_item_record_id: string;
  item_picture?: string;
  standard_price?: number;
}

interface BouquetItem {
  record_id: string;
  item_id: string;
  item_name: string;
  Color: string;
  current_balance: number;
  reserved_qty: number;
  shop_location_id: string;
  shop_location_name: string;
  flower_item_record_id: string;
  item_picture?: string;
  standard_price?: number;
}

interface FlowerComposition {
  item_name: string;
  color: string;
  quantity: number;
  item_picture?: string;
}

interface BouquetDetails {
  transaction_id: string;
  created_date: string;
  description: string;
  composition: FlowerComposition[];
  total_flowers_used: number;
}

interface CartItem {
  item_id: string;
  item_type: 'Flower' | 'Bouquet';
  item_name: string;
  quantity: number;
  standard_price: number;  // Original price
  actual_price: number;    // Price after any manual adjustments
  markup_percentage: number | null;  // Markup percentage applied (-100 to +100)
  color?: string;
  picture?: string;
  bouquetDetails?: BouquetDetails;  // Added for bouquet composition display
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function CreateOrder() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { currentLocation } = useAuth();
  
  // Tab state
  const [currentTab, setCurrentTab] = useState(0);
  
  // Information tab states
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [deliveryType, setDeliveryType] = useState<'Pickup' | 'Delivery'>('Pickup');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryDateTime, setDeliveryDateTime] = useState('');
  const [notes, setNotes] = useState('');
  const [photos, setPhotos] = useState<File[]>([]);
  
  // Items tab states
  const [itemType, setItemType] = useState<'flowers' | 'bouquets' | 'supplements'>('flowers');
  const [flowers, setFlowers] = useState<FlowerItem[]>([]);
  const [bouquets, setBouquets] = useState<BouquetItem[]>([]);
  const [supplements, setSupplements] = useState<FlowerItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  
  // Filter & search states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  
  // NumberPad state
  const [numberPadOpen, setNumberPadOpen] = useState(false);
  const [selectedFlower, setSelectedFlower] = useState<FlowerItem | null>(null);
  
  // NumericPadModal states for price entry
  const [priceModalOpen, setPriceModalOpen] = useState(false);
  const [priceModalTarget, setPriceModalTarget] = useState<{ type: 'item' | 'delivery'; itemId?: string } | null>(null);
  const [currentEditingPrice, setCurrentEditingPrice] = useState(0);
  const [currentEditingQuantity, setCurrentEditingQuantity] = useState(1);
  
  // Totals tab states
  const [discountPercentage, setDiscountPercentage] = useState(0);
  const [deliveryPrice, setDeliveryPrice] = useState(0);
  const [paymentStatus, setPaymentStatus] = useState<'Paid' | 'Pending'>('Paid');
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Card' | 'Bank Transfer'>('Card');
  const [orderStatus, setOrderStatus] = useState<'Confirmed' | 'Draft'>('Confirmed');
  
  // UI states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // ============================================================================
  // EFFECTS
  // ============================================================================

  useEffect(() => {
    loadClients();
  }, []);

  useEffect(() => {
    if (currentLocation?.id) {
      loadFlowers();
      loadBouquets();
      loadSupplements();
    }
  }, [currentLocation?.id]);

  // Auto-add bouquet instance from URL
  useEffect(() => {
    const bouquetId = searchParams.get('bouquetId');
    if (bouquetId) {
      // Check if already added by checking bouquetDetails.transaction_id
      const alreadyInCart = cart.some(
        item => item.bouquetDetails?.transaction_id === bouquetId
      );
      
      if (!alreadyInCart) {
        // Fetch the specific bouquet instance by transaction_id
        const loadBouquetInstance = async () => {
          try {
            const bouquetDetails = await apiService.getBouquetDetails(bouquetId);
            
            // Add bouquet instance to cart
            const standardPrice = bouquetDetails.bouquet?.standard_price || 0;
            const newItem: CartItem = {
              item_id: bouquetDetails.bouquet.record_id, // Use the flower_item_record_id
              item_type: 'Bouquet',
              item_name: bouquetDetails.bouquet.item_name,
              quantity: 1,
              standard_price: standardPrice,
              actual_price: standardPrice,
              markup_percentage: null,
              color: bouquetDetails.bouquet.color,
              picture: bouquetDetails.bouquet.item_picture,
              bouquetDetails: {
                transaction_id: bouquetDetails.transaction_id,
                created_date: bouquetDetails.created_date,
                description: bouquetDetails.description,
                composition: bouquetDetails.composition || [],
                total_flowers_used: bouquetDetails.total_flowers_used || 0,
              },
            };
            
            setCart(prevCart => [...prevCart, newItem]);
            
            // Switch to items tab to show the added bouquet
            setCurrentTab(1);
            setItemType('bouquets');
            
            // Remove bouquetId from URL
            searchParams.delete('bouquetId');
            navigate(`/orders/new?${searchParams.toString()}`, { replace: true });
          } catch (err) {
            console.error('Failed to load bouquet instance:', err);
            setError('Failed to load the selected bouquet. Please try again.');
          }
        };
        
        loadBouquetInstance();
      }
    }
  }, [searchParams]);

  // ============================================================================
  // DATA LOADING
  // ============================================================================

  const loadClients = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/clients`);
      setClients(Array.isArray(response.data) ? response.data : []);
    } catch (err: any) {
      console.error('Failed to load clients:', err);
    }
  };

  const loadFlowers = async () => {
    if (!currentLocation?.id) return;
    
    try {
      const response = await axios.get(
        `${API_BASE_URL}/orders/available-items?shop_location_id=${currentLocation.id}`
      );
      const allItems = Array.isArray(response.data) ? response.data : [];
      const flowerItems = allItems.filter((item: any) => 
        item.item_category?.toLowerCase() === 'flower'
      );
      setFlowers(flowerItems);
    } catch (err: any) {
      console.error('Failed to load flowers:', err);
      setFlowers([]);
    }
  };

  const loadBouquets = async () => {
    if (!currentLocation?.id) return;
    
    try {
      const response = await axios.get(
        `${API_BASE_URL}/orders/available-bouquets?shop_location_id=${currentLocation.id}`
      );
      setBouquets(Array.isArray(response.data) ? response.data : []);
    } catch (err: any) {
      console.error('Failed to load bouquets:', err);
      setBouquets([]);
    }
  };

  const loadSupplements = async () => {
    if (!currentLocation?.id) return;
    
    try {
      const response = await axios.get(
        `${API_BASE_URL}/orders/available-items?shop_location_id=${currentLocation.id}`
      );
      const allItems = Array.isArray(response.data) ? response.data : [];
      const supplementItems = allItems.filter((item: any) => 
        item.item_category?.toLowerCase() !== 'flower'
      );
      setSupplements(supplementItems);
    } catch (err: any) {
      console.error('Failed to load supplements:', err);
      setSupplements([]);
    }
  };

  // ============================================================================
  // CART HANDLERS
  // ============================================================================

  const handleFlowerCardClick = (flower: FlowerItem) => {
    setSelectedFlower(flower);
    setNumberPadOpen(true);
  };

  const handleNumberPadSave = (quantity: number) => {
    if (!selectedFlower) return;
    
    // Check if flower already in cart
    const existingIndex = cart.findIndex(
      item => item.item_id === selectedFlower.flower_item_record_id
    );
    
    if (existingIndex >= 0) {
      // Update existing quantity
      const newCart = [...cart];
      newCart[existingIndex].quantity = quantity;
      setCart(newCart);
    } else {
      // Add new item with standard price
      const standardPrice = selectedFlower.standard_price || 0;
      const newItem: CartItem = {
        item_id: selectedFlower.flower_item_record_id,
        item_type: 'Flower',
        item_name: selectedFlower.item_name,
        quantity,
        standard_price: standardPrice,
        actual_price: standardPrice,  // Initialize actual_price with standard_price
        markup_percentage: null,  // No markup by default
        color: selectedFlower.Color,
        picture: selectedFlower.item_picture,
      };
      setCart([...cart, newItem]);
    }
    
    setNumberPadOpen(false);
    setSelectedFlower(null);
  };

  const handleAddBouquet = async (bouquet: BouquetItem) => {
    // Check if already in cart
    if (cart.some(item => item.item_id === bouquet.flower_item_record_id)) {
      // Remove from cart
      setCart(cart.filter(item => item.item_id !== bouquet.flower_item_record_id));
    } else {
      // Fetch bouquet details to get composition
      let bouquetDetails: BouquetDetails | undefined;
      try {
        const details = await apiService.getBouquetDetails(bouquet.flower_item_record_id);
        bouquetDetails = {
          transaction_id: details.transaction_id,
          created_date: details.created_date,
          description: details.description,
          composition: details.composition || [],
          total_flowers_used: details.total_flowers_used || 0,
        };
      } catch (err) {
        console.error('Failed to fetch bouquet details:', err);
        // Continue without details if fetch fails
      }
      
      // Add to cart with standard price
      const standardPrice = bouquet.standard_price || 0;
      const newItem: CartItem = {
        item_id: bouquet.flower_item_record_id,
        item_type: 'Bouquet',
        item_name: bouquet.item_name,
        quantity: 1,
        standard_price: standardPrice,
        actual_price: standardPrice,  // Initialize actual_price with standard_price
        markup_percentage: null,  // No markup by default
        color: bouquet.Color,
        picture: bouquet.item_picture,
        bouquetDetails,
      };
      setCart([...cart, newItem]);
    }
  };

  const getFlowerCartQuantity = (flowerId: string): number => {
    const item = cart.find(i => i.item_id === flowerId);
    return item ? item.quantity : 0;
  };

  const isBouquetInCart = (bouquetId: string): boolean => {
    return cart.some(item => item.item_id === bouquetId);
  };

  const updateCartQuantity = (itemId: string, delta: number) => {
    setCart(prevCart => {
      return prevCart.map(item => {
        if (item.item_id === itemId) {
          const newQuantity = Math.max(1, item.quantity + delta);
          
          // Check stock availability for flowers
          if (item.item_type === 'Flower' && delta > 0) {
            const flowerData = flowers.find(f => f.flower_item_record_id === itemId);
            if (flowerData && newQuantity > flowerData.current_balance) {
              // Don't allow exceeding balance
              return item;
            }
          }
          
          // Bouquets are unique (quantity should always be 1)
          if (item.item_type === 'Bouquet') {
            return item; // Don't allow changing bouquet quantity
          }
          
          return { ...item, quantity: newQuantity };
        }
        return item;
      });
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart(prevCart => prevCart.filter(item => item.item_id !== itemId));
  };

  // ============================================================================
  // HELPER FUNCTIONS
  // ============================================================================

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // ============================================================================
  // PRICING HANDLERS
  // ============================================================================

  const handleActualPriceChange = (itemId: string, newPrice: number) => {
    setCart(prevCart => {
      return prevCart.map(item => {
        if (item.item_id === itemId) {
          return { ...item, actual_price: Math.max(0, newPrice), markup_percentage: null };
        }
        return item;
      });
    });
  };

  // Handle markup percentage change
  const handleMarkupChange = (itemId: string, markupPercentage: number | null) => {
    setCart(prevCart => {
      return prevCart.map(item => {
        if (item.item_id === itemId) {
          if (markupPercentage === null) {
            // Clear markup - reset to standard price
            return { 
              ...item, 
              markup_percentage: null,
              actual_price: item.standard_price 
            };
          } else {
            // Apply markup to standard price
            const newPrice = item.standard_price * (1 + markupPercentage / 100);
            return { 
              ...item, 
              markup_percentage: markupPercentage,
              actual_price: Math.max(0, newPrice)
            };
          }
        }
        return item;
      });
    });
  };

  // Open price modal for item
  const handleOpenPriceModal = (itemId: string) => {
    const item = cart.find(i => i.item_id === itemId);
    if (item) {
      setCurrentEditingPrice(item.actual_price);
      setCurrentEditingQuantity(item.quantity);
      setPriceModalTarget({ type: 'item', itemId });
      setPriceModalOpen(true);
    }
  };

  // Open price modal for delivery
  const handleOpenDeliveryPriceModal = () => {
    setCurrentEditingPrice(deliveryPrice);
    setCurrentEditingQuantity(1);
    setPriceModalTarget({ type: 'delivery' });
    setPriceModalOpen(true);
  };

  // Save price from numeric pad modal
  const handleSavePriceFromModal = (unitPrice: number) => {
    if (!priceModalTarget) return;

    if (priceModalTarget.type === 'item' && priceModalTarget.itemId) {
      handleActualPriceChange(priceModalTarget.itemId, unitPrice);
    } else if (priceModalTarget.type === 'delivery') {
      setDeliveryPrice(unitPrice);
    }

    setPriceModalOpen(false);
    setPriceModalTarget(null);
  };

  // Calculate totals
  const calculateTotals = useMemo(() => {
    const subtotal = cart.reduce((sum, item) => sum + (item.quantity * item.actual_price), 0);
    const discountAmount = subtotal * (discountPercentage / 100);
    const totalPrice = subtotal + deliveryPrice - discountAmount;  // Add delivery, subtract discount
    
    // Calculate approximate total based on standard prices
    const approximateSubtotal = cart.reduce((sum, item) => sum + (item.quantity * item.standard_price), 0);
    const approximateTotal = approximateSubtotal;
    
    return {
      subtotal,
      discountAmount,
      deliveryPrice,
      totalPrice,
      approximateSubtotal,
      approximateTotal,
    };
  }, [cart, discountPercentage, deliveryPrice]);

  // ============================================================================
  // FILTER & SEARCH
  // ============================================================================

  // Get unique colors from current items
  const availableColors = useMemo(() => {
    let items: FlowerItem[] = [];
    if (itemType === 'flowers') {
      items = flowers;
    } else if (itemType === 'bouquets') {
      items = bouquets;
    } else if (itemType === 'supplements') {
      items = supplements;
    }
    const colors = new Set(items.map(item => item.Color).filter(Boolean));
    return Array.from(colors).sort();
  }, [itemType, flowers, bouquets, supplements]);

  // Filter items based on search and color
  const filteredFlowers = useMemo(() => {
    let result = flowers;
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(f => 
        f.item_name?.toLowerCase().includes(query) ||
        String(f.item_id || '').toLowerCase().includes(query) ||
        f.Color?.toLowerCase().includes(query)
      );
    }
    
    if (selectedColor) {
      result = result.filter(f => f.Color === selectedColor);
    }
    
    return result;
  }, [flowers, searchQuery, selectedColor]);

  const filteredBouquets = useMemo(() => {
    let result = bouquets;
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(b => 
        b.item_name?.toLowerCase().includes(query) ||
        String(b.item_id || '').toLowerCase().includes(query) ||
        b.Color?.toLowerCase().includes(query)
      );
    }
    
    if (selectedColor) {
      result = result.filter(b => b.Color === selectedColor);
    }
    
    return result;
  }, [bouquets, searchQuery, selectedColor]);

  const filteredSupplements = useMemo(() => {
    let result = supplements;
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(s => 
        s.item_name?.toLowerCase().includes(query) ||
        String(s.item_id || '').toLowerCase().includes(query) ||
        s.Color?.toLowerCase().includes(query)
      );
    }
    
    if (selectedColor) {
      result = result.filter(s => s.Color === selectedColor);
    }
    
    return result;
  }, [supplements, searchQuery, selectedColor]);

  const currentItems = useMemo(() => {
    if (itemType === 'flowers') return filteredFlowers;
    if (itemType === 'bouquets') return filteredBouquets;
    if (itemType === 'supplements') return filteredSupplements;
    return [];
  }, [itemType, filteredFlowers, filteredBouquets, filteredSupplements]);

  // ============================================================================
  // VALIDATION & SUBMISSION
  // ============================================================================

  const validateInformationTab = (): string | null => {
    if (!selectedClient) return 'Please select a client';
    if (deliveryType === 'Delivery' && !deliveryAddress) return 'Please enter delivery address';
    return null;
  };

  const validateItemsTab = (): string | null => {
    if (cart.length === 0) return 'Please add at least one item to the order';
    return null;
  };

  const handleCreateOrder = async () => {
    // Validate both tabs
    const infoError = validateInformationTab();
    if (infoError) {
      setError(infoError);
      setCurrentTab(0);
      return;
    }
    
    const itemsError = validateItemsTab();
    if (itemsError) {
      setError(itemsError);
      setCurrentTab(1);
      return;
    }
    
    if (!currentLocation?.id) {
      setError('No location selected. Please select a location first.');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Prepare order data with ALL pricing information upfront (ATOMIC)
      const orderData = {
        client_id: selectedClient!.id,
        shop_location_id: currentLocation.id,
        delivery_type: deliveryType,
        delivery_address: deliveryType === 'Delivery' ? deliveryAddress : undefined,
        delivery_date_time: deliveryDateTime || undefined,
        notes: notes || undefined,
        payment_status: paymentStatus,
        payment_method: paymentStatus === 'Paid' ? paymentMethod : undefined,
        order_status: orderStatus,  // Add order status (controls business logic)
        // Include all pricing data in the initial request
        subtotal: parseFloat(calculateTotals.subtotal.toFixed(2)),
        discount_percentage: discountPercentage,
        discount_amount: parseFloat(calculateTotals.discountAmount.toFixed(2)),
        delivery_price: parseFloat(deliveryPrice.toFixed(2)),
        // Items with unit prices
        items: cart.map(item => ({
          item_id: item.item_id,
          item_type: item.item_type,
          quantity: item.quantity,
          unit_price: item.actual_price,
        })),
      };
      
      console.log('✨ [ATOMIC] Creating order with complete data:', orderData);
      const response = await axios.post(`${API_BASE_URL}/orders`, orderData);
      
      // Handle both response formats:
      // - Unpaid orders: { id: 'recXXX', fields: {...} }
      // - Paid orders: { success: true, order_id: 'recXXX', ... }
      const orderId = response.data.id || response.data.order_id;
      
      if (!orderId) {
        console.error('❌ No order ID in response:', response.data);
        throw new Error('Order created but no ID returned from server');
      }
      
      console.log('✅ Order created successfully with ID:', orderId);
      console.log('✅ All pricing data saved in one call - no update needed!');
      
      // Upload attachments if any
      if (photos.length > 0) {
        console.log(`📎 Uploading ${photos.length} attachments...`);
        try {
          for (const photo of photos) {
            const formData = new FormData();
            formData.append('file', photo);
            
            await axios.post(
              `${API_BASE_URL}/orders/${orderId}/attachments`,
              formData,
              {
                headers: {
                  'Content-Type': 'multipart/form-data',
                },
              }
            );
            console.log(`✅ Uploaded attachment: ${photo.name}`);
          }
          console.log('✅ All attachments uploaded successfully');
        } catch (attachmentError: any) {
          console.warn('⚠️ Failed to upload some attachments:', attachmentError);
          // Don't fail the whole order creation if attachments fail
        }
      }
      
      setSuccess('Order created successfully!');
      setTimeout(() => {
        navigate('/orders/manage');
      }, 1500);
    } catch (err: any) {
      console.error('Order creation error:', err.response?.data);
      const errorDetail = err.response?.data?.detail;
      let errorMessage = 'Failed to create order: ';
      
      if (typeof errorDetail === 'string') {
        errorMessage += errorDetail;
      } else if (Array.isArray(errorDetail)) {
        errorMessage += errorDetail.map((e: any) => `${e.loc?.join('.')} - ${e.msg}`).join('; ');
      } else {
        errorMessage += err.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // ============================================================================
  // RENDER HELPERS
  // ============================================================================

  const renderInformationTab = () => (
    <Box>
      {/* Client Selection */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>Client Information</Typography>
          <Autocomplete
            value={selectedClient}
            onChange={(_, newValue) => setSelectedClient(newValue)}
            options={clients}
            getOptionLabel={(option) => 
              `${option.fields.client_name}${option.fields.phone ? ` - ${option.fields.phone}` : ''}`
            }
            renderInput={(params) => (
              <TextField {...params} label="Select Client" required />
            )}
            fullWidth
          />
        </CardContent>
      </Card>

      {/* Delivery Information */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>Delivery Information</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Delivery Type</InputLabel>
                <Select
                  value={deliveryType}
                  onChange={(e) => setDeliveryType(e.target.value as 'Pickup' | 'Delivery')}
                  label="Delivery Type"
                >
                  <MenuItem value="Pickup">Pickup</MenuItem>
                  <MenuItem value="Delivery">Delivery</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            {deliveryType === 'Delivery' && (
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Delivery Address"
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  required
                />
              </Grid>
            )}
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label={deliveryType === 'Delivery' ? 'Delivery Date & Time' : 'Pickup Date & Time'}
                type="datetime-local"
                value={deliveryDateTime}
                onChange={(e) => setDeliveryDateTime(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Order Notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                multiline
                rows={3}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Attach Photos
                </Typography>
                <Button
                  variant="outlined"
                  component="label"
                  startIcon={<AttachFileIcon />}
                  sx={{ mb: 1 }}
                >
                  Upload Photos
                  <input
                    type="file"
                    hidden
                    multiple
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files) {
                        setPhotos([...photos, ...Array.from(e.target.files)]);
                      }
                    }}
                  />
                </Button>
                {photos.length > 0 && (
                  <Box sx={{ mt: 1 }}>
                    {photos.map((file, index) => (
                      <Chip
                        key={index}
                        label={file.name}
                        onDelete={() => setPhotos(photos.filter((_, i) => i !== index))}
                        icon={<PhotoIcon />}
                        sx={{ mr: 1, mb: 1 }}
                      />
                    ))}
                  </Box>
                )}
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );

  const renderItemsTab = () => {
    return (
      <Grid container spacing={3}>
        {/* Left side - Items Selection */}
        <Grid item xs={12} md={8}>
          <Box>
            {/* No Location Warning */}
            {!currentLocation && (
              <Alert severity="warning" sx={{ mb: 3 }}>
                No location selected. Please select a location from the header to see available items.
              </Alert>
            )}

            {/* Item Type Toggle */}
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
              <ToggleButtonGroup
                value={itemType}
                exclusive
                onChange={(_, newValue) => {
                  if (newValue) {
                    setItemType(newValue);
                    setSearchQuery('');
                    setSelectedColor(null);
                  }
                }}
                aria-label="item type"
                size="large"
              >
                <ToggleButton value="flowers" aria-label="flowers">
                  <LocalFloristIcon sx={{ mr: 1 }} />
                  Add Flowers
                </ToggleButton>
                <ToggleButton value="bouquets" aria-label="bouquets">
                  <BouquetIcon sx={{ mr: 1 }} />
                  Add Bouquets
                </ToggleButton>
                <ToggleButton value="supplements" aria-label="supplements">
                  <AddIcon sx={{ mr: 1 }} />
                  Add Supplements
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>

            {/* Search Bar */}
            <TextField
              fullWidth
              placeholder={`Search ${itemType === 'flowers' ? 'flowers' : itemType === 'bouquets' ? 'bouquets' : 'supplements'}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
              }}
              sx={{ mb: 2 }}
            />

            {/* Color Filter Chips */}
            {availableColors.length > 0 && (
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                <Chip
                  label="All Colors"
                  onClick={() => setSelectedColor(null)}
                  color={selectedColor === null ? 'primary' : 'default'}
                  variant={selectedColor === null ? 'filled' : 'outlined'}
                />
                {availableColors.map(color => (
                  <Chip
                    key={color}
                    label={color}
                    onClick={() => setSelectedColor(color === selectedColor ? null : color)}
                    color={selectedColor === color ? 'primary' : 'default'}
                    variant={selectedColor === color ? 'filled' : 'outlined'}
                  />
                ))}
              </Box>
            )}

            {/* Items Grid - Smaller Cards */}
            {itemType === 'flowers' || itemType === 'supplements' ? (
              <Grid container spacing={1.5}>
                {currentItems.map((item) => {
                  const inCart = getFlowerCartQuantity(item.flower_item_record_id);
                  return (
                    <Grid item xs={6} sm={4} md={3} lg={2} key={item.record_id}>
                      <Card 
                        sx={{ 
                          cursor: 'pointer',
                          border: inCart > 0 ? '2px solid' : '1px solid',
                          borderColor: inCart > 0 ? 'primary.main' : 'divider',
                          '&:hover': { boxShadow: 3 },
                          height: '100%',
                        }}
                        onClick={() => handleFlowerCardClick(item)}
                      >
                        {item.item_picture && (
                          <CardMedia
                            component="img"
                            height="80"
                            image={item.item_picture}
                            alt={item.item_name}
                            sx={{ objectFit: 'cover' }}
                          />
                        )}
                        <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
                          <Typography variant="body2" fontWeight="bold" noWrap>
                            {item.item_name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" display="block">
                            {item.Color}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" display="block">
                            Stock: {item.current_balance}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" display="block" fontWeight="medium">
                            €{item.standard_price?.toFixed(2) || '0.00'}
                          </Typography>
                          {inCart > 0 && (
                            <Chip 
                              label={inCart}
                              color="primary"
                              size="small"
                              sx={{ mt: 0.5, height: 20, fontSize: '0.7rem' }}
                            />
                          )}
                        </CardContent>
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>
            ) : (
              <Grid container spacing={1.5}>
                {currentItems.map((bouquet) => {
                  const inCart = isBouquetInCart(bouquet.flower_item_record_id);
                  return (
                    <Grid item xs={6} sm={4} md={3} lg={2} key={bouquet.record_id}>
                      <Card 
                        sx={{ 
                          cursor: 'pointer',
                          border: inCart ? '2px solid' : '1px solid',
                          borderColor: inCart ? 'success.main' : 'divider',
                          '&:hover': { boxShadow: 3 },
                          height: '100%',
                        }}
                        onClick={() => handleAddBouquet(bouquet)}
                      >
                        {bouquet.item_picture && (
                          <CardMedia
                            component="img"
                            height="80"
                            image={bouquet.item_picture}
                            alt={bouquet.item_name}
                            sx={{ objectFit: 'cover' }}
                          />
                        )}
                        <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
                          <Typography variant="body2" fontWeight="bold" noWrap>
                            {bouquet.item_name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" display="block">
                            {bouquet.Color}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" display="block" fontWeight="medium">
                            €{bouquet.standard_price?.toFixed(2) || '0.00'}
                          </Typography>
                          {inCart && (
                            <Chip 
                              icon={<CheckIcon sx={{ fontSize: '0.8rem' }} />}
                              label="Added"
                              color="success"
                              size="small"
                              sx={{ mt: 0.5, height: 20, fontSize: '0.7rem' }}
                            />
                          )}
                        </CardContent>
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>
            )}
            
            {/* Empty state */}
            {itemType === 'flowers' && currentItems.length === 0 && currentLocation && (
              <Alert severity="info">
                {searchQuery || selectedColor 
                  ? 'No flowers match your filters.' 
                  : 'No flowers available at this location.'}
              </Alert>
            )}
            {itemType === 'bouquets' && currentItems.length === 0 && currentLocation && (
              <Alert severity="info">
                {searchQuery || selectedColor 
                  ? 'No bouquets match your filters.' 
                  : 'No bouquets available at this location.'}
              </Alert>
            )}
            {itemType === 'supplements' && currentItems.length === 0 && currentLocation && (
              <Alert severity="info">
                {searchQuery || selectedColor 
                  ? 'No supplements match your filters.' 
                  : 'No supplements available at this location.'}
              </Alert>
            )}
          </Box>
        </Grid>

        {/* Right side - Cart List */}
        <Grid item xs={12} md={4}>
          <Paper 
            elevation={3} 
            sx={{ 
              position: 'sticky', 
              top: 16, 
              maxHeight: 'calc(100vh - 200px)', 
              overflow: 'auto',
              p: 2 
            }}
          >
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CartIcon /> Order Items ({cart.length})
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            {cart.length === 0 ? (
              <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
                No items in order yet
              </Typography>
            ) : (
              <List sx={{ p: 0 }}>
                {cart.map((item, index) => (
                  <React.Fragment key={item.item_id}>
                    {index > 0 && <Divider />}
                    <ListItem
                      sx={{ px: 0, py: 1.5 }}
                      secondaryAction={
                        <IconButton 
                          edge="end" 
                          onClick={() => removeFromCart(item.item_id)}
                          size="small"
                          color="error"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      }
                    >
                      <ListItemAvatar>
                        <Avatar 
                          src={item.picture} 
                          variant="rounded"
                          sx={{ bgcolor: item.item_type === 'Bouquet' ? 'success.light' : 'primary.light' }}
                        >
                          {item.item_type === 'Bouquet' ? <BouquetIcon /> : <LocalFloristIcon />}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Typography variant="body2" fontWeight="bold">
                            {item.item_name}
                          </Typography>
                        }
                        secondary={
                          <Box>
                            {/* Quantity Controls */}
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                              {item.item_type === 'Bouquet' ? (
                                // Bouquets are unique - no quantity adjustment
                                <Chip label="Qty: 1" size="small" color="secondary" />
                              ) : (
                                <>
                                  <IconButton 
                                    size="small" 
                                    onClick={() => updateCartQuantity(item.item_id, -1)}
                                    disabled={item.quantity <= 1}
                                  >
                                    <RemoveIcon fontSize="small" />
                                  </IconButton>
                                  <Typography variant="body2" fontWeight="bold" sx={{ minWidth: 30, textAlign: 'center' }}>
                                    {item.quantity}
                                  </Typography>
                                  <IconButton 
                                    size="small" 
                                    onClick={() => updateCartQuantity(item.item_id, 1)}
                                    disabled={(() => {
                                      const flowerData = flowers.find(f => f.flower_item_record_id === item.item_id);
                                      return flowerData ? item.quantity >= flowerData.current_balance : false;
                                    })()}
                                  >
                                    <AddIcon fontSize="small" />
                                  </IconButton>
                                </>
                              )}
                            </Box>
                            
                            {/* Standard Price Information */}
                            <Box sx={{ mt: 0.75 }}>
                              <Typography variant="caption" color="text.secondary" display="block">
                                Unit: €{(item.standard_price || 0).toFixed(2)} × {item.quantity} = €{((item.standard_price || 0) * item.quantity).toFixed(2)}
                              </Typography>
                            </Box>
                            
                            {/* Bouquet Composition Details */}
                            {item.item_type === 'Bouquet' && item.bouquetDetails && (
                              <Box sx={{ mt: 1.5 }}>
                                {/* Description */}
                                {item.bouquetDetails.description && (
                                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
                                    {item.bouquetDetails.description}
                                  </Typography>
                                )}
                                
                                {/* Created Date */}
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                                  <CalendarIcon sx={{ fontSize: 12, color: 'text.secondary' }} />
                                  <Typography variant="caption" color="text.secondary">
                                    Created: {formatDate(item.bouquetDetails.created_date)}
                                  </Typography>
                                </Box>
                                
                                {/* Composition */}
                                {item.bouquetDetails.composition && item.bouquetDetails.composition.length > 0 && (
                                  <Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                                      <LocalFloristIcon sx={{ fontSize: 12, color: 'text.secondary' }} />
                                      <Typography variant="caption" color="text.secondary">
                                        Composition ({item.bouquetDetails.total_flowers_used} flowers):
                                      </Typography>
                                    </Box>
                                    <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                                      {item.bouquetDetails.composition.map((flower, idx) => (
                                        <Tooltip 
                                          key={idx}
                                          title={`${flower.quantity}x ${flower.item_name} (${flower.color})`}
                                        >
                                          <Badge badgeContent={flower.quantity} color="primary" max={99}>
                                            <Avatar
                                              src={flower.item_picture}
                                              alt={flower.item_name}
                                              sx={{ 
                                                width: 24, 
                                                height: 24,
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
                                )}
                              </Box>
                            )}
                          </Box>
                        }
                      />
                    </ListItem>
                  </React.Fragment>
                ))}
              </List>
            )}
            
            {cart.length > 0 && (
              <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Total Items: {cart.reduce((sum, item) => sum + item.quantity, 0)}
                </Typography>
                <Divider sx={{ my: 1 }} />
                <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                  Standard Prices (orientation)
                </Typography>
                <Typography variant="h6" color="primary.main" fontWeight="bold">
                  Approximate Total: €{calculateTotals.approximateTotal.toFixed(2)}
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5, fontStyle: 'italic' }}>
                  *Update prices during checkout
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    );
  };

  const renderOrderTotalsTab = () => {
    return (
      <Box>
        {/* Order Items Table - Read-only quantities */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>Order Items</Typography>
            
            {cart.length === 0 ? (
              <Alert severity="info">No items in cart. Please add items in the "Order Items" tab.</Alert>
            ) : (
              <Box>
                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Type</TableCell>
                        <TableCell>Item Name</TableCell>
                        <TableCell align="right">Qty</TableCell>
                        <TableCell align="right">
                          <Tooltip title="Standard price from items table (for orientation)">
                            <span>Std Price (€)</span>
                          </Tooltip>
                        </TableCell>
                        <TableCell align="center">
                          <Tooltip title="Apply markup percentage to standard price">
                            <span>Add Markup (%)</span>
                          </Tooltip>
                        </TableCell>
                        <TableCell align="right">Unit Price (€)</TableCell>
                        <TableCell align="right">Subtotal (€)</TableCell>
                        <TableCell align="center">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {cart.map((item) => (
                        <TableRow key={item.item_id}>
                          <TableCell>
                            <Chip 
                              label={item.item_type} 
                              size="small" 
                              color={item.item_type === 'Bouquet' ? 'secondary' : 'primary'}
                            />
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              {item.picture ? (
                                <Avatar 
                                  src={item.picture} 
                                  variant="rounded" 
                                  sx={{ width: 32, height: 32 }}
                                />
                              ) : (
                                <Avatar 
                                  variant="rounded" 
                                  sx={{ width: 32, height: 32, bgcolor: item.item_type === 'Bouquet' ? 'secondary.light' : 'primary.light' }}
                                >
                                  {item.item_type === 'Bouquet' ? <BouquetIcon fontSize="small" /> : <LocalFloristIcon fontSize="small" />}
                                </Avatar>
                              )}
                              <Box>
                                <Typography variant="body2" fontWeight="bold">
                                  {item.item_name}
                                </Typography>
                                {item.color && (
                                  <Typography variant="caption" color="text.secondary">
                                    {item.color}
                                  </Typography>
                                )}
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell align="center">
                            {item.item_type === 'Bouquet' ? (
                              <Typography variant="body2" fontWeight="bold">
                                1
                              </Typography>
                            ) : (
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, justifyContent: 'center' }}>
                                <IconButton 
                                  size="small" 
                                  onClick={() => updateCartQuantity(item.item_id, -1)}
                                  disabled={item.quantity <= 1}
                                  sx={{ p: 0.5 }}
                                >
                                  <RemoveIcon fontSize="small" />
                                </IconButton>
                                <Typography variant="body2" fontWeight="bold" sx={{ minWidth: 30, textAlign: 'center' }}>
                                  {item.quantity}
                                </Typography>
                                <IconButton 
                                  size="small" 
                                  onClick={() => updateCartQuantity(item.item_id, 1)}
                                  disabled={(() => {
                                    const flowerData = flowers.find(f => f.flower_item_record_id === item.item_id);
                                    return flowerData ? item.quantity >= flowerData.current_balance : false;
                                  })()}
                                  sx={{ p: 0.5 }}
                                >
                                  <AddIcon fontSize="small" />
                                </IconButton>
                              </Box>
                            )}
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                              €{item.standard_price.toFixed(2)}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center', justifyContent: 'center', flexWrap: 'nowrap' }}>
                              {/* Preset markup buttons */}
                              {[5, 10, 25, 50].map((percentage) => (
                                <Button
                                  key={percentage}
                                  variant={item.markup_percentage === percentage ? 'contained' : 'outlined'}
                                  size="small"
                                  onClick={() => handleMarkupChange(item.item_id, percentage)}
                                  sx={{ minWidth: 45, px: 1, py: 0.25 }}
                                >
                                  {percentage}
                                </Button>
                              ))}
                              {/* Custom markup input */}
                              <TextField
                                type="number"
                                placeholder="Custom"
                                size="small"
                                value={item.markup_percentage !== null && ![5, 10, 25, 50].includes(item.markup_percentage) ? item.markup_percentage : ''}
                                onChange={(e) => {
                                  const value = e.target.value === '' ? null : parseInt(e.target.value);
                                  if (value === null) {
                                    handleMarkupChange(item.item_id, null);
                                  } else {
                                    const clampedValue = Math.max(-100, Math.min(100, value));
                                    handleMarkupChange(item.item_id, clampedValue);
                                  }
                                }}
                                inputProps={{ 
                                  min: -100, 
                                  max: 100, 
                                  step: 1,
                                  style: { textAlign: 'center' }
                                }}
                                sx={{ 
                                  width: 70,
                                  '& input[type=number]': {
                                    MozAppearance: 'textfield',
                                  },
                                  '& input[type=number]::-webkit-outer-spin-button, & input[type=number]::-webkit-inner-spin-button': {
                                    WebkitAppearance: 'none',
                                    margin: 0,
                                  },
                                  '& .MuiOutlinedInput-root': {
                                    height: '31px',
                                    backgroundColor: item.markup_percentage !== null && ![5, 10, 25, 50].includes(item.markup_percentage) ? 'primary.lighter' : 'transparent'
                                  }
                                }}
                              />
                              {/* Clear button */}
                              {item.markup_percentage !== null && (
                                <Button
                                  variant="text"
                                  size="small"
                                  onClick={() => handleMarkupChange(item.item_id, null)}
                                  sx={{ fontSize: '0.7rem', py: 0, minHeight: 0, px: 0.5 }}
                                >
                                  Clear
                                </Button>
                              )}
                            </Box>
                          </TableCell>
                          <TableCell align="right">
                            <Box
                              onClick={() => handleOpenPriceModal(item.item_id)}
                              sx={{
                                cursor: 'pointer',
                                p: 1,
                                border: '1px solid',
                                borderColor: 'primary.main',
                                borderRadius: 1,
                                bgcolor: 'background.paper',
                                '&:hover': {
                                  bgcolor: 'action.hover',
                                },
                                display: 'inline-flex',
                                minWidth: 100,
                                justifyContent: 'flex-end',
                                fontWeight: 'bold',
                              }}
                            >
                              €{item.actual_price.toFixed(2)}
                            </Box>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body1" fontWeight="bold">
                              €{(item.quantity * item.actual_price).toFixed(2)}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Tooltip title="Remove item from order">
                              <IconButton
                                size="small"
                                onClick={() => removeFromCart(item.item_id)}
                                color="error"
                                sx={{ 
                                  '&:hover': {
                                    bgcolor: 'error.lighter',
                                  }
                                }}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}
          </CardContent>
        </Card>

        {/* Discount and Totals */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Discount</Typography>
                
                <TextField
                  label="Discount Percentage (%)"
                  type="number"
                  value={discountPercentage === 0 ? '' : discountPercentage}
                  onChange={(e) => {
                    const value = e.target.value === '' ? 0 : parseFloat(e.target.value);
                    setDiscountPercentage(Math.max(0, Math.min(100, value || 0)));
                  }}
                  fullWidth
                  inputProps={{ min: 0, max: 100, step: 0.1 }}
                  sx={{ mb: 2 }}
                />

                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {[5, 10, 15, 20, 25].map((percentage) => (
                    <Button
                      key={percentage}
                      variant={discountPercentage === percentage ? 'contained' : 'outlined'}
                      size="small"
                      onClick={() => setDiscountPercentage(percentage)}
                    >
                      {percentage}%
                    </Button>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Order Summary</Typography>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body1">Subtotal:</Typography>
                    <Typography variant="body1" fontWeight="bold">
                      €{calculateTotals.subtotal.toFixed(2)}
                    </Typography>
                  </Box>
                  
                  {/* Delivery Price */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <DeliveryIcon fontSize="small" color="action" />
                      <Typography variant="body1">Delivery:</Typography>
                    </Box>
                    <Box
                      onClick={handleOpenDeliveryPriceModal}
                      sx={{
                        cursor: 'pointer',
                        p: 0.75,
                        px: 1.5,
                        border: '1px solid',
                        borderColor: deliveryPrice > 0 ? 'info.main' : 'divider',
                        borderRadius: 1,
                        bgcolor: 'background.paper',
                        '&:hover': {
                          bgcolor: 'action.hover',
                          borderColor: 'info.main',
                        },
                        fontWeight: 'bold',
                      }}
                    >
                      €{deliveryPrice.toFixed(2)}
                    </Box>
                  </Box>
                  
                  {discountPercentage > 0 && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', color: 'success.main' }}>
                      <Typography variant="body1">
                        Discount ({discountPercentage}%):
                      </Typography>
                      <Typography variant="body1" fontWeight="bold">
                        -€{calculateTotals.discountAmount.toFixed(2)}
                      </Typography>
                    </Box>
                  )}
                  
                  <Divider />
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="h6">Total:</Typography>
                    <Typography variant="h6" fontWeight="bold" color="primary">
                      €{calculateTotals.totalPrice.toFixed(2)}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Order Summary Info */}
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>Order Summary</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">Shop Location</Typography>
                {currentLocation ? (
                  <Chip 
                    label={currentLocation.name} 
                    color="primary" 
                    size="small"
                    sx={{ mt: 0.5 }}
                  />
                ) : (
                  <Typography variant="body2" color="error">No location selected</Typography>
                )}
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">Client</Typography>
                <Typography variant="body1" fontWeight="bold">
                  {selectedClient?.fields.client_name || 'Not selected'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">Delivery Type</Typography>
                <Typography variant="body1">{deliveryType}</Typography>
              </Grid>
              {deliveryAddress && (
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">Delivery Address</Typography>
                  <Typography variant="body1">{deliveryAddress}</Typography>
                </Grid>
              )}
            </Grid>
          </CardContent>
        </Card>

        {/* Order Status & Payment Info */}
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>Order Status & Payment</Typography>
            <Grid container spacing={2}>
              {/* Order Status */}
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Order Status</InputLabel>
                  <Select
                    value={orderStatus}
                    onChange={(e) => setOrderStatus(e.target.value as 'Confirmed' | 'Draft')}
                    label="Order Status"
                  >
                    <MenuItem value="Confirmed">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip label="CONFIRMED" color="success" size="small" />
                        <Typography variant="body2" color="text.secondary">
                          (Inventory deducted immediately)
                        </Typography>
                      </Box>
                    </MenuItem>
                    <MenuItem value="Draft">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip label="DRAFT" color="default" size="small" />
                        <Typography variant="body2" color="text.secondary">
                          (No inventory changes)
                        </Typography>
                      </Box>
                    </MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              {/* Payment Status */}
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Payment Status</InputLabel>
                  <Select
                    value={paymentStatus}
                    onChange={(e) => setPaymentStatus(e.target.value as 'Paid' | 'Pending')}
                    label="Payment Status"
                  >
                    <MenuItem value="Paid">
                      <Chip label="PAID" color="success" size="small" />
                    </MenuItem>
                    <MenuItem value="Pending">
                      <Chip label="PENDING" color="warning" size="small" />
                    </MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              {/* Payment Method (only if paid) */}
              {paymentStatus === 'Paid' && (
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Payment Method</InputLabel>
                    <Select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value as 'Cash' | 'Card' | 'Bank Transfer')}
                      label="Payment Method"
                    >
                      <MenuItem value="Cash">Cash</MenuItem>
                      <MenuItem value="Card">Card</MenuItem>
                      <MenuItem value="Bank Transfer">Bank Transfer</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              )}
            </Grid>
            
            {/* Info Alert based on Order Status */}
            {orderStatus === 'Confirmed' && (
              <Alert severity="info" sx={{ mt: 2 }}>
                <strong>Creating as CONFIRMED:</strong> Inventory will be deducted, bouquets marked as sold, and audit trail created automatically.
              </Alert>
            )}
            
            {orderStatus === 'Draft' && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                <strong>Creating as DRAFT:</strong> Order will be saved without inventory changes. Change status to 'Confirmed' later to deduct inventory.
              </Alert>
            )}
          </CardContent>
        </Card>
      </Box>
    );
  };

  // ============================================================================
  // MAIN RENDER
  // ============================================================================

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={() => navigate('/orders/manage')} sx={{ mr: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4">Create New Order</Typography>
      </Box>

      {/* Alerts */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={currentTab} onChange={(_, newValue) => setCurrentTab(newValue)}>
          <Tab label="BASIC INFO →" />
          <Tab 
            label="ADD ITEMS →" 
            icon={cart.length > 0 ? <Badge badgeContent={cart.length} color="primary"><span /></Badge> : undefined}
            iconPosition="end"
          />
          <Tab label="CHECKOUT" />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      <Box sx={{ mb: 3 }}>
        {currentTab === 0 && renderInformationTab()}
        {currentTab === 1 && renderItemsTab()}
        {currentTab === 2 && renderOrderTotalsTab()}
      </Box>

      {/* Action Buttons */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Button
          variant="outlined"
          onClick={() => navigate('/orders/manage')}
        >
          Cancel
        </Button>
        
        {currentTab === 0 && (
          <Button
            variant="contained"
            color="primary"
            endIcon={<ArrowForwardIcon />}
            onClick={() => setCurrentTab(1)}
          >
            Next: Add Items
          </Button>
        )}
        
        {currentTab === 1 && (
          <Button
            variant="contained"
            color="primary"
            endIcon={<ArrowForwardIcon />}
            onClick={() => setCurrentTab(2)}
            disabled={cart.length === 0}
          >
            Next: Checkout
          </Button>
        )}
        
        {currentTab === 2 && (
          <Button
            variant="contained"
            color="primary"
            startIcon={<SaveIcon />}
            onClick={handleCreateOrder}
            disabled={
              loading || 
              !currentLocation || 
              !selectedClient || 
              cart.length === 0 ||
              (deliveryType === 'Delivery' && !deliveryAddress)
            }
          >
            {loading ? 'Creating...' : 'Create Order'}
          </Button>
        )}
      </Box>

      {/* NumberPad Dialog */}
      {numberPadOpen && selectedFlower && (
        <NumberPad
          open={numberPadOpen}
          onClose={() => {
            setNumberPadOpen(false);
            setSelectedFlower(null);
          }}
          onSubmit={handleNumberPadSave}
          flowerName={`${selectedFlower.item_name} (${selectedFlower.Color})`}
          initialValue={getFlowerCartQuantity(selectedFlower.flower_item_record_id)}
          maxQuantity={selectedFlower.current_balance}
        />
      )}

      {/* NumericPadModal for price entry */}
      <NumericPadModal
        open={priceModalOpen}
        onClose={() => {
          setPriceModalOpen(false);
          setPriceModalTarget(null);
        }}
        onSave={handleSavePriceFromModal}
        title={priceModalTarget?.type === 'delivery' ? 'Enter Delivery Price' : 'Enter Item Price'}
        quantity={currentEditingQuantity}
        currentUnitPrice={currentEditingPrice}
      />
    </Box>
  );
}