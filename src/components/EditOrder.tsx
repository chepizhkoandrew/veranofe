import React, { useState, useEffect } from 'react';
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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  IconButton,
  Paper,
  Alert,
  Autocomplete,
  Divider,
  Chip,
  Tabs,
  Tab,
  Badge as MuiBadge,
  Avatar,
  ListItem,
  ListItemText,
  ListItemAvatar,
  List,
  Stack,
  Tooltip,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  ShoppingCart as ShoppingCartIcon,
  LocalFlorist as LocalFloristIcon,
  Cake as BouquetIcon,
  Remove as RemoveIcon,
  Check as CheckIcon,
  Assignment as AssignmentIcon,
  LocalShipping as LocalShippingIcon,
  Search as SearchIcon,
  CloudUpload as CloudUploadIcon,
  Download as DownloadIcon,
  AttachFile as AttachFileIcon,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { apiService, InventoryItem } from '../services/api';
import QuantityPickerDialog from './QuantityPickerDialog';
import { FlowerSpinner } from './FlowerSpinner';

const API_BASE_URL = (process.env.REACT_APP_API_URL || 'http://localhost:8000').replace(/\/$/, '');

interface Client {
  id: string;
  fields: {
    client_name: string;
    phone?: string;
    email?: string;
  };
}

interface Item {
  id: string;
  fields: {
    item_name: string;
    product_name?: string;
    balance?: number;
    standard_price?: number;
    item_category?: string;
    Color?: string;
    item_picture?: Array<{ url: string; filename: string }>;
  };
  availableQty?: number;  // Stock available at the order's location
}

interface BouquetInstance {
  transaction_id: string;
  created_date: string;
  description: string;
  status: string;
  bouquet: {
    item_name: string;
    color: string;
    item_picture: string | null;
  };
  composition: Array<{
    item_name: string;
    color: string;
    quantity: number;
    standard_price: number;
  }>;
  calculated_price?: number;  // Optional - may not be calculated yet for some bouquets
  total_flowers_used: number;
}

interface AirtableAttachment {
  id: string;
  url: string;
  filename: string;
  size: number;
  type: string;
  width?: number;
  height?: number;
}

interface OrderItem {
  id?: string;
  item_id: string;
  item_type: 'Bouquet' | 'Flower' | 'Service';
  item_name: string;
  quantity: number;
  unit_price: number;
  standard_unit_price?: number;  // Reference price from items table
  subtotal?: number;
}

interface OrderItemRow {
  id?: string;
  tempId: string;
  item_id: string;
  item_type: 'Flower' | 'Bouquet';
  item_name: string;
  quantity: number;
  standard_price: number;
  actual_price: number;
  subtotal: number;
  markup_percentage: number | null;  // Markup percentage applied to standard price
  flower_picture?: string;
  availableQty?: number;
  bouquet_details?: {
    name: string;
    description?: string;
    photo?: string;
    status: string;
    composition: Array<{
      item_id: string;
      item_name: string;
      color: string;
      quantity: number;
      item_picture?: string;
      item_category?: string;
      item_description?: string;
    }>;
    total_flowers: number;
    updated_time?: string;
  };
}

interface Order {
  id: string;
  fields: {
    orderid?: number;
    client_id?: string[];
    order_status: string;
    payment_method?: string;
    payment_status: string;
    subtotal?: number;
    discount_percentage?: number;
    discount_amount?: number;
    total_price?: number;
    delivery_type?: string;
    delivery_address?: string;
    delivery_date_time?: string;
    notes?: string;
    created?: string;
    Attachments?: AirtableAttachment[];
  };
  client?: any;
  items?: OrderItem[];
}

const ORDER_STATUSES = ['Draft', 'Created', 'Confirmed', 'In progress', 'In delivery', 'Delivered', 'Cancelled'];
const PAYMENT_STATUSES = ['Pending', 'Paid', 'Refunded'];
const PAYMENT_METHODS = ['Cash', 'Card', 'Bank Transfer', 'Other'];

export default function EditOrder() {
  const navigate = useNavigate();
  const { orderId } = useParams<{ orderId: string }>();
  
  // Guard: If no orderId, redirect to order management immediately
  React.useEffect(() => {
    if (!orderId || orderId === 'undefined') {
      console.error('❌ Invalid order ID - redirecting to order management');
      navigate('/orders/manage', { replace: true });
    }
  }, [orderId, navigate]);
  
  // Data states
  const [clients, setClients] = useState<Client[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [bouquets, setBouquets] = useState<BouquetInstance[]>([]);
  const [order, setOrder] = useState<Order | null>(null);
  const [locationId, setLocationId] = useState<string | null>(null);
  const [itemsBalance, setItemsBalance] = useState<any[]>([]);
  
  // Form states
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItemRow[]>([]);
  const [initialOrderItems, setInitialOrderItems] = useState<OrderItemRow[]>([]); // Snapshot of items when editing started
  const [orderStatus, setOrderStatus] = useState('Draft');
  const [newStatus, setNewStatus] = useState<'Confirmed' | 'Draft'>('Confirmed');
  const [paymentStatus, setPaymentStatus] = useState('Pending');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [deliveryType, setDeliveryType] = useState('Pickup');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryDateTime, setDeliveryDateTime] = useState('');
  const [notes, setNotes] = useState('');
  const [discountPercentage, setDiscountPercentage] = useState(0);
  const [deliveryPrice, setDeliveryPrice] = useState(0);
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  
  // UI states
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [currentTab, setCurrentTab] = useState(0);
  
  // Quantity picker modal states
  const [quantityPickerOpen, setQuantityPickerOpen] = useState(false);
  const [selectedItemForModal, setSelectedItemForModal] = useState<Item | null>(null);
  const [selectedBouquetForModal, setSelectedBouquetForModal] = useState<BouquetInstance | null>(null);
  const [modalItemType, setModalItemType] = useState<'Flower' | 'Bouquet'>('Flower');
  
  // Items tab search/filter states
  const [itemType, setItemType] = useState<'flowers' | 'bouquets' | 'supplements'>('flowers');
  const [supplements, setSupplements] = useState<Item[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [hideZeroBalances, setHideZeroBalances] = useState(true);

  // Attachment states
  const [attachments, setAttachments] = useState<AirtableAttachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadOrder();
    loadClients();
    loadItems();
    loadBouquets();
    loadSupplements();
  }, [orderId]);

  const loadOrder = async () => {
    if (!orderId) return;
    
    setLoading(true);
    try {
      console.log(`📦 Loading order: ${orderId}`);
      const orderData = await apiService.getOrder(orderId);
      
      console.log('✅ Order data received:', orderData);
      console.log('📋 Items in response:', orderData.items?.length || 0);
      
      setOrder(orderData);
      
      // Extract location from order
      if (orderData.fields.shop_location_id && orderData.fields.shop_location_id.length > 0) {
        const locId = orderData.fields.shop_location_id[0];
        console.log(`📍 Order location: ${locId}`);
        setLocationId(locId);
      }
      
      setOrderStatus(orderData.fields.order_status || 'Draft');
      setPaymentStatus(orderData.fields.payment_status || 'Pending');
      setPaymentMethod(orderData.fields.payment_method || '');
      setDeliveryType(orderData.fields.delivery_type || 'Pickup');
      setDeliveryAddress(orderData.fields.delivery_address || '');
      setDeliveryDateTime(orderData.fields.delivery_date_time || '');
      setNotes(orderData.fields.notes || '');
      setDiscountPercentage(orderData.fields.discount_percentage || 0);
      setDeliveryPrice(orderData.fields.delivery_price || 0);
      
      // Load attachments
      const orderAttachments = orderData.fields.Attachments || [];
      console.log(`📎 Loaded ${orderAttachments.length} attachments`);
      setAttachments(orderAttachments);
      
      // Load order items
      if (orderData.items && orderData.items.length > 0) {
        console.log(`🛒 Processing ${orderData.items.length} items...`);
        const items = orderData.items.map((item: any) => {
          console.log('  Item:', item.item_name, '- Type:', item.item_type, '- Qty:', item.quantity);
          if (item.item_type === 'Bouquet' && item.bouquet_details) {
            console.log('  📦 Bouquet details found:', item.bouquet_details.name);
          }
          return {
            id: item.id,
            tempId: item.id || `temp-${Date.now()}-${Math.random()}`,
            item_id: item.item_id,
            // Convert legacy 'Item' type to 'Flower' for display (all non-bouquet items are stored as Flower type in orders)
            item_type: item.item_type === 'Item' ? 'Flower' : item.item_type as 'Flower' | 'Bouquet' | 'Service',
            item_name: item.item_name,
            quantity: item.quantity,
            standard_price: item.standard_unit_price || item.unit_price,  // Reference price from items table
            actual_price: item.unit_price,  // Actual price used for order total
            subtotal: item.subtotal || (item.quantity * item.unit_price),
            markup_percentage: null,  // Initialize without markup (user can apply it in checkout tab)
            flower_picture: item.flower_picture,
            bouquet_details: item.bouquet_details,
          };
        });
        console.log(`✅ Loaded ${items.length} items into state`);
        setOrderItems(items);
        // Capture initial snapshot for accurate change detection
        setInitialOrderItems(JSON.parse(JSON.stringify(items))); // Deep copy
        console.log(`📸 Captured initial items snapshot (${items.length} items)`);
      } else {
        console.warn('⚠️  No items found in order response');
        setOrderItems([]);
        setInitialOrderItems([]);
      }
      
    } catch (err: any) {
      console.error('❌ Error loading order:', err);
      setError('Failed to load order: ' + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  const loadClients = async () => {
    try {
      console.log('👥 Loading clients...');
      const clientsList = await apiService.getClients();
      const clients = Array.isArray(clientsList) ? clientsList : [];
      console.log(`✅ Loaded ${clients.length} clients`);
      setClients(clients);
    } catch (err: any) {
      console.error('❌ Failed to load clients:', err);
    }
  };

  // Separate effect to sync client after order and clients are loaded
  useEffect(() => {
    console.log('🔄 Syncing client - order loaded:', !!order, 'clients loaded:', clients.length > 0, 'client selected:', !!selectedClient);
    
    if (order && clients.length > 0 && !selectedClient) {
      if (order.fields.client_id && order.fields.client_id.length > 0) {
        const clientId = order.fields.client_id[0];
        console.log(`🔍 Looking for client: ${clientId}`);
        const client = clients.find((c: Client) => c.id === clientId);
        if (client) {
          console.log(`✅ Found client: ${client.fields.client_name}`);
          setSelectedClient(client);
        } else {
          console.warn(`⚠️  Client ${clientId} not found in clients list`);
        }
      }
    }
  }, [order, clients]);

  // Load balance data and bouquets when location changes
  useEffect(() => {
    if (locationId) {
      loadBalanceData();
      loadBouquets(); // Reload bouquets filtered by location
    }
  }, [locationId]);

  // Reload items when balance data is available to attach available quantities
  useEffect(() => {
    if (itemsBalance.length > 0 && items.length > 0) {
      // Reattach balance data to items
      const itemsWithBalance = items.map((item: Item) => {
        const balanceRecord = itemsBalance.find(b => b.flower_item_record_id === item.id);
        return {
          ...item,
          availableQty: balanceRecord ? balanceRecord.current_balance : 0
        };
      });
      setItems(itemsWithBalance);
    }
  }, [itemsBalance]);

  const loadBalanceData = async () => {
    if (!locationId) return;
    
    try {
      console.log(`📊 Loading balance data for location: ${locationId}`);
      const balance = await apiService.getItemsBalance(locationId);
      console.log(`✅ Loaded ${balance.length} balance records`);
      setItemsBalance(balance);
    } catch (err: any) {
      console.error('❌ Failed to load balance data:', err);
      setItemsBalance([]);
    }
  };

  const loadItems = async () => {
    try {
      console.log('🌸 Loading items...');
      const allItems = await apiService.getRawItems();
      // Load only items with category 'flower'
      const availableItems = allItems.filter((item: Item) => 
        item.fields.item_category?.toLowerCase() === 'flower'
      );
      console.log(`✅ Loaded ${availableItems.length} items`);
      setItems(availableItems);
    } catch (err: any) {
      console.error('❌ Failed to load items:', err);
    }
  };

  const loadBouquets = async () => {
    try {
      console.log('💐 Loading bouquets...');
      console.log(`📍 Current location: ${locationId}`);
      
      // Pass location to filter bouquets only from order's location
      const bouquetData = await apiService.getBouquetsInStock(locationId || undefined);
      
      // API returns wrapped response: {success: true, data: [...]}
      let bouquetsList = [];
      if (bouquetData?.data && Array.isArray(bouquetData.data)) {
        bouquetsList = bouquetData.data;
      } else if (Array.isArray(bouquetData)) {
        // Fallback for direct array response
        bouquetsList = bouquetData;
      }
      
      // Filter for available bouquets only (status = 'created')
      const availableBouquets = bouquetsList.filter((b: any) => b.status === 'created');
      
      console.log(`✅ Loaded ${bouquetsList.length} total bouquets, ${availableBouquets.length} available (status='created')`);
      setBouquets(availableBouquets);
    } catch (err: any) {
      console.error('❌ Failed to load bouquets:', err);
      setBouquets([]);
    }
  };

  const loadSupplements = async () => {
    try {
      console.log('📦 Loading supplements...');
      const allItems = await apiService.getRawItems();
      // Load items where item_category is not 'flower' and not 'bouquet'
      const supplementItems = allItems.filter((item: Item) => 
        item.fields.item_category?.toLowerCase() !== 'flower' &&
        item.fields.item_category !== 'bouquet' && 
        item.fields.item_category !== '_bouquet'
      );
      console.log(`✅ Loaded ${supplementItems.length} supplements`);
      setSupplements(supplementItems);
    } catch (err: any) {
      console.error('❌ Failed to load supplements:', err);
    }
  };

  // ============================================================================
  // FILTER & SEARCH
  // ============================================================================

  const availableColors = (() => {
    if (itemType === 'flowers') {
      const colors = new Set<string>((items as Item[]).map(item => item.fields.Color).filter((c): c is string => Boolean(c)));
      return Array.from(colors).sort();
    } else if (itemType === 'supplements') {
      const colors = new Set<string>((supplements as Item[]).map(item => item.fields.Color).filter((c): c is string => Boolean(c)));
      return Array.from(colors).sort();
    } else {
      const colors = new Set<string>((bouquets as BouquetInstance[]).map(b => b.bouquet.color).filter((c): c is string => Boolean(c)));
      return Array.from(colors).sort();
    }
  })() as string[];

  const filteredFlowers = (() => {
    let result = items;
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(f => 
        f.fields.item_name?.toLowerCase().includes(query) ||
        String(f.id || '').toLowerCase().includes(query) ||
        f.fields.Color?.toLowerCase().includes(query)
      );
    }
    
    if (selectedColor) {
      result = result.filter(f => f.fields.Color === selectedColor);
    }
    
    if (hideZeroBalances && locationId) {
      result = result.filter(f => (f.availableQty || 0) > 0);
    }
    
    return result;
  })();

  const filteredBouquets = (() => {
    let result = bouquets;
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(b => 
        b.bouquet.item_name?.toLowerCase().includes(query) ||
        String(b.transaction_id || '').toLowerCase().includes(query) ||
        b.bouquet.color?.toLowerCase().includes(query)
      );
    }
    
    if (selectedColor) {
      result = result.filter(b => b.bouquet.color === selectedColor);
    }
    
    return result;
  })();

  const filteredSupplements = (() => {
    let result = supplements;
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(s => 
        s.fields.item_name?.toLowerCase().includes(query) ||
        String(s.id || '').toLowerCase().includes(query) ||
        s.fields.Color?.toLowerCase().includes(query)
      );
    }
    
    if (selectedColor) {
      result = result.filter(s => s.fields.Color === selectedColor);
    }
    
    if (hideZeroBalances && locationId) {
      result = result.filter(s => (s.availableQty || 0) > 0);
    }
    
    return result;
  })();

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleQuantityPickerConfirm = (quantity: number) => {
    if (modalItemType === 'Flower') {
      if (!selectedItemForModal) {
        setError('Please select a flower to add');
        return;
      }

      const baseName = selectedItemForModal.fields.item_name || selectedItemForModal.fields.product_name || 'Unknown Flower';
      const color = selectedItemForModal.fields.Color;
      const itemName = color ? `${baseName} (${color})` : baseName;
      const standardPrice = selectedItemForModal.fields.standard_price || 0;
      
      // Get flower picture if available
      const flowerPicture = selectedItemForModal.fields.item_picture && selectedItemForModal.fields.item_picture.length > 0
        ? selectedItemForModal.fields.item_picture[0].url
        : undefined;
      
      const newItem: OrderItemRow = {
        tempId: `temp-${Date.now()}-${Math.random()}`,
        item_id: selectedItemForModal.id,
        item_type: 'Flower',
        item_name: itemName,
        quantity: quantity,
        standard_price: standardPrice,
        actual_price: standardPrice,
        subtotal: quantity * standardPrice,
        markup_percentage: null,
        flower_picture: flowerPicture,
        availableQty: selectedItemForModal.availableQty,
      };

      setOrderItems([...orderItems, newItem]);
      setSuccess(`✓ Added ${quantity} unit(s) of ${itemName} to order`);
      setTimeout(() => setSuccess(null), 3000);
    } else {
      if (!selectedBouquetForModal) {
        setError('Please select a bouquet to add');
        return;
      }

      const bouquetName = selectedBouquetForModal.bouquet.item_name || 'Unknown Bouquet';
      const calculatedPrice = selectedBouquetForModal.calculated_price || 0;
      
      const newItem: OrderItemRow = {
        tempId: `temp-${Date.now()}-${Math.random()}`,
        item_id: selectedBouquetForModal.transaction_id,
        item_type: 'Bouquet',
        item_name: bouquetName,
        quantity: quantity,
        standard_price: calculatedPrice,
        actual_price: calculatedPrice,
        subtotal: quantity * calculatedPrice,
        markup_percentage: null,
      };

      setOrderItems([...orderItems, newItem]);
      setSuccess(`✓ Added ${quantity} bouquet(s) to order`);
      setTimeout(() => setSuccess(null), 3000);
    }
    
    // Close modal and reset
    setQuantityPickerOpen(false);
    setSelectedItemForModal(null);
    setSelectedBouquetForModal(null);
  };

  const handleOpenQuantityPicker = (item: Item | BouquetInstance, type: 'Flower' | 'Bouquet') => {
    if (type === 'Flower') {
      const flowerItem = item as Item;
      console.log(`🌸 Selected item: ${flowerItem.fields.item_name}, availableQty: ${flowerItem.availableQty}`);
      setSelectedItemForModal(flowerItem);
    } else {
      setSelectedBouquetForModal(item as BouquetInstance);
    }
    setModalItemType(type);
    setQuantityPickerOpen(true);
  };

  const handleCloseQuantityPicker = () => {
    setQuantityPickerOpen(false);
    setSelectedItemForModal(null);
    setSelectedBouquetForModal(null);
  };

  const handleRemoveItem = async (item: OrderItemRow) => {
    if (item.id) {
      try {
        await apiService.deleteOrderItem(orderId!, item.id);
        setOrderItems(orderItems.filter(i => i.tempId !== item.tempId));
        setSuccess('Item removed successfully!');
      } catch (err: any) {
        setError('Failed to remove item: ' + (err.response?.data?.detail || err.message));
      }
    } else {
      setOrderItems(orderItems.filter(i => i.tempId !== item.tempId));
    }
  };

  const handleQuantityChange = (tempId: string, newQuantity: number) => {
    setOrderItems(orderItems.map(item => {
      if (item.tempId === tempId) {
        // For Flower items, validate against available stock
        let quantity = Math.max(1, newQuantity);
        if (item.item_type === 'Flower') {
          // Look up the fresh availableQty from the current items list
          const currentItem = items.find((i: Item) => i.id === item.item_id);
          const availableQty = currentItem?.availableQty ?? item.availableQty ?? 0;
          
          console.log(`📝 handleQuantityChange for "${item.item_name}": newQty=${newQuantity}, availableQty=${availableQty}`);
          
          if (availableQty > 0) {
            const previousQuantity = quantity;
            quantity = Math.min(quantity, availableQty);
            if (quantity < previousQuantity) {
              console.warn(`⚠️ Quantity limited to available stock: ${quantity} (max: ${availableQty})`);
            }
          } else {
            console.warn(`❌ No stock available for "${item.item_name}". Current balance: ${availableQty}`);
            quantity = 1; // Keep minimum quantity to show the item
          }
        }
        return {
          ...item,
          quantity,
          subtotal: quantity * item.actual_price,
        };
      }
      return item;
    }));
  };

  const handleActualPriceChange = (tempId: string, newPrice: number) => {
    setOrderItems(orderItems.map(item => {
      if (item.tempId === tempId) {
        const actualPrice = Math.max(0, newPrice);
        return {
          ...item,
          actual_price: actualPrice,
          subtotal: item.quantity * actualPrice,
          markup_percentage: null,  // Clear markup when manual price is set
        };
      }
      return item;
    }));
  };

  // Handle markup percentage change
  const handleMarkupChange = (tempId: string, markupPercentage: number | null) => {
    setOrderItems(orderItems.map(item => {
      if (item.tempId === tempId) {
        if (markupPercentage === null) {
          // Clear markup - reset to standard price
          return { 
            ...item, 
            markup_percentage: null,
            actual_price: item.standard_price,
            subtotal: item.quantity * item.standard_price,
          };
        } else {
          // Apply markup to standard price
          const newPrice = item.standard_price * (1 + markupPercentage / 100);
          return { 
            ...item, 
            markup_percentage: markupPercentage,
            actual_price: newPrice,
            subtotal: item.quantity * newPrice,
          };
        }
      }
      return item;
    }));
  };

  // ============================================================================
  // ATTACHMENT HANDLERS
  // ============================================================================

  const handleAttachmentUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || !orderId) return;

    const file = files[0];
    setUploading(true);
    
    try {
      console.log(`📎 Uploading attachment: ${file.name}`);
      const updatedOrder = await apiService.uploadOrderAttachment(orderId, file);
      
      // Update attachments from response
      const newAttachments = updatedOrder.fields?.Attachments || [];
      setAttachments(newAttachments);
      setSuccess(`Attachment "${file.name}" uploaded successfully!`);
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err: any) {
      console.error('❌ Upload failed:', err);
      const errorMessage = err.response?.data?.detail || err.message || JSON.stringify(err);
      setError(`Failed to upload attachment: ${errorMessage}`);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteAttachment = async (attachment: AirtableAttachment) => {
    if (!orderId) return;

    try {
      console.log(`🗑️  Deleting attachment: ${attachment.filename}`);
      const updatedOrder = await apiService.deleteOrderAttachment(orderId, attachment.id);
      
      // Update attachments from response
      const newAttachments = updatedOrder.fields?.Attachments || [];
      setAttachments(newAttachments);
      setSuccess(`Attachment "${attachment.filename}" deleted successfully!`);
    } catch (err: any) {
      console.error('❌ Delete failed:', err);
      setError('Failed to delete attachment: ' + (err.response?.data?.detail || err.message));
    }
  };

  const handleDownloadAttachment = (attachment: AirtableAttachment) => {
    console.log(`📥 Downloading attachment: ${attachment.filename}`);
    // Create a temporary link and trigger download
    const link = document.createElement('a');
    link.href = attachment.url;
    link.download = attachment.filename;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const calculateTotals = () => {
    const subtotal = orderItems.reduce((sum, item) => sum + item.subtotal, 0);
    const discountAmount = subtotal * (discountPercentage / 100);
    const totalPrice = subtotal - discountAmount + deliveryPrice;
    
    return {
      subtotal: subtotal.toFixed(2),
      discountAmount: discountAmount.toFixed(2),
      totalPrice: totalPrice.toFixed(2),
    };
  };

  const totals = calculateTotals();

  // ============================================================================
  // DEPRECATED UPDATE HANDLERS - FLAGGED FOR FUTURE REMOVAL
  // ============================================================================
  // These handlers were part of the old multi-step save approach where each tab
  // had its own save button. Now we use a single intelligent save at checkout.
  // These are kept for reference but are no longer actively used.
  // TODO: Remove after confirming no other dependencies
  
  const handleUpdateBasicInfo = async () => {
    // DEPRECATED: This was used when Tab 0 had its own "Update Basic Info" button
    // Basic info is now saved as part of handleUpdateCheckout in the Checkout tab
    if (!orderId) return;
    
    if (!selectedClient) {
      setError('Please select a client');
      return;
    }

    if (deliveryType === 'Delivery' && !deliveryAddress) {
      setError('Delivery address is required for delivery orders');
      return;
    }

    if (!deliveryDateTime) {
      setError('Delivery/Pickup date and time is required');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const updateData = {
        client_id: selectedClient.id,
        delivery_type: deliveryType,
        delivery_address: deliveryType === 'Delivery' ? deliveryAddress : undefined,
        delivery_date_time: deliveryDateTime || undefined,
        notes: notes || undefined,
      };

      await apiService.updateOrder(orderId!, updateData);
      setSuccess('Basic information updated successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError('Failed to update: ' + (err.response?.data?.detail || err.message));
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateItemsAndPricing = async () => {
    // DEPRECATED: This was used when Tab 1 had its own "Update Items & Pricing" button
    // The problem: This only updates items individually but doesn't trigger intelligent
    // inventory management. It doesn't compare previous vs current state, so no inventory
    // adjustments or bouquet status updates occur.
    // Items are now saved as part of handleUpdateCheckout which triggers the intelligent
    // backend that compares states and adjusts inventory/bouquet statuses accordingly.
    if (!orderId) return;
    
    if (orderItems.length === 0) {
      setError('Order must have at least one item');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      // Add new items
      const newItems = orderItems.filter(item => !item.id);
      if (newItems.length > 0) {
        const itemsToAdd = newItems.map(item => ({
          item_id: item.item_id,
          item_type: item.item_type,
          quantity: item.quantity,
          unit_price: item.actual_price,
        }));
        await apiService.addOrderItems(orderId!, itemsToAdd);
      }

      // Update existing items
      const existingItems = orderItems.filter(item => item.id);
      for (const item of existingItems) {
        if (item.id) {
          await apiService.updateOrderItem(orderId!, item.id, {
            quantity: item.quantity,
            unit_price: item.actual_price,
          });
        }
      }

      setSuccess('Items updated successfully!');
      setTimeout(() => setSuccess(null), 3000);
      await loadOrder();
    } catch (err: any) {
      setError('Failed to update items: ' + (err.response?.data?.detail || err.message));
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateCheckout = async () => {
    if (!orderId) return;

    setSaving(true);
    setError(null);

    try {
      // ============================================================
      // STEP 1: CREATE NEW ITEMS (items without an id)
      // ============================================================
      const newItems = orderItems.filter(item => !item.id);
      if (newItems.length > 0) {
        console.log(`Creating ${newItems.length} new order items...`);
        const itemsToCreate = newItems.map(item => ({
          item_id: item.item_id,  // FIX: Use correct field name (not flower_id/bouquet_id)
          item_type: item.item_type,
          quantity: item.quantity,
          unit_price: item.actual_price,
        }));
        console.log('📤 Items to create:', itemsToCreate);
        await apiService.addOrderItems(orderId!, itemsToCreate);
        console.log('✅ New items created successfully');
      }

      // ============================================================
      // STEP 2: UPDATE EXISTING ITEMS (items with an id)
      // ============================================================
      const existingItems = orderItems.filter(item => item.id);
      for (const item of existingItems) {
        if (item.id) {
          await apiService.updateOrderItem(orderId!, item.id, {
            quantity: item.quantity,
            unit_price: item.actual_price,
          });
        }
      }
      console.log(`✅ Updated ${existingItems.length} existing items`);

      // ============================================================
      // STEP 3: UPDATE ORDER-LEVEL FIELDS (basic info + checkout)
      // ============================================================
      // This is the single source of truth for order updates
      
      // Prepare previous_items snapshot for accurate change detection
      const previousItemsSnapshot = initialOrderItems.map(item => ({
        item_id: item.item_id,
        item_name: item.item_name,
        item_type: item.item_type,
        quantity: item.quantity,
        unit_price: item.actual_price,
        subtotal: item.subtotal
      }));
      
      console.log(`📸 Sending previous items snapshot: ${previousItemsSnapshot.length} items`);
      
      const checkoutUpdateData = {
        // Basic order info from Tab 0
        client_id: selectedClient?.id,
        delivery_type: deliveryType,
        delivery_address: deliveryType === 'Delivery' ? deliveryAddress : undefined,
        delivery_date_time: deliveryDateTime || undefined,
        notes: notes || undefined,
        // Checkout fields from Tab 2
        // NOTE: order_status is NOT included here - it's only updated via Tab 3 (Force Status Update)
        payment_status: paymentStatus,
        payment_method: paymentMethod || undefined,
        discount_percentage: discountPercentage,
        discount_amount: parseFloat(totals.discountAmount),
        delivery_price: deliveryPrice,
        subtotal: parseFloat(totals.subtotal),
        total_price: parseFloat(totals.totalPrice),
        // CRITICAL: Send snapshot of items when editing started
        // This allows backend to accurately compare before/after states
        previous_items: previousItemsSnapshot,
      };

      await apiService.updateOrder(orderId!, checkoutUpdateData);
      console.log('✅ Order updated successfully');
      
      setSuccess('Order updated successfully!');
      setTimeout(() => setSuccess(null), 3000);
      await loadOrder(); // Reload to reflect changes
    } catch (err: any) {
      setError('Failed to update: ' + (err.response?.data?.detail || err.message));
    } finally {
      setSaving(false);
    }
  };

  // ============================================================================
  // RENDER FUNCTIONS
  // ============================================================================

  const renderBasicInfoTab = () => (
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
                  onChange={(e) => setDeliveryType(e.target.value)}
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
          </Grid>
        </CardContent>
      </Card>

      {/* Attachments */}
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AttachFileIcon fontSize="small" />
            Order Attachments
          </Typography>
          
          {/* Upload Section */}
          <Box sx={{ mb: 3, p: 2, border: '2px dashed #ccc', borderRadius: 1, textAlign: 'center' }}>
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleAttachmentUpload}
              style={{ display: 'none' }}
              disabled={uploading}
            />
            <Button
              variant="outlined"
              startIcon={<CloudUploadIcon />}
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              fullWidth
              sx={{ mb: 1 }}
            >
              {uploading ? 'Uploading...' : 'Upload Attachment'}
            </Button>
            <Typography variant="caption" display="block" color="textSecondary">
              Click to select a file (PDF, image, document, etc.)
            </Typography>
          </Box>

          {/* Attachments List */}
          {attachments.length > 0 ? (
            <Box>
              <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold', mb: 1 }}>
                {attachments.length} {attachments.length === 1 ? 'Attachment' : 'Attachments'}
              </Typography>
              <List sx={{ bgcolor: 'background.paper', borderRadius: 1 }}>
                {attachments.map((attachment, index) => (
                  <ListItem
                    key={attachment.id}
                    secondaryAction={
                      <Box>
                        <Tooltip title="Download">
                          <IconButton
                            edge="end"
                            aria-label="download"
                            onClick={() => handleDownloadAttachment(attachment)}
                            sx={{ mr: 1 }}
                          >
                            <DownloadIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton
                            edge="end"
                            aria-label="delete"
                            onClick={() => handleDeleteAttachment(attachment)}
                            color="error"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    }
                    sx={{ 
                      borderBottom: index < attachments.length - 1 ? '1px solid #eee' : 'none',
                      '&:hover': { backgroundColor: '#f5f5f5' }
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: 'primary.light' }}>
                        <AttachFileIcon />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {attachment.filename}
                        </Box>
                      }
                      secondary={`${(attachment.size / 1024).toFixed(2)} KB`}
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          ) : (
            <Typography variant="body2" color="textSecondary" sx={{ textAlign: 'center', py: 2 }}>
              No attachments yet. Upload files to attach them to this order.
            </Typography>
          )}
        </CardContent>
      </Card>
    </Box>
  );

  const renderItemsTab = () => {
    return (
      <Grid container spacing={3} sx={{ display: 'flex', flexWrap: 'wrap' }}>
        {/* Order Items Summary - Right Column */}
        <Grid item xs={12} md={4} sx={{ order: { xs: 2, md: 2 } }}>
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
              <ShoppingCartIcon /> Order Items ({orderItems.length})
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            {orderItems.length === 0 ? (
              <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
                No items in order yet
              </Typography>
            ) : (
              <Box sx={{ width: '100%' }}>
                {/* Table Header */}
                <Box sx={{ 
                  display: 'grid', 
                  gridTemplateColumns: '40px 1fr 100px 120px 40px',
                  gap: 1.5,
                  alignItems: 'center',
                  pb: 1.5,
                  mb: 1,
                  borderBottom: '2px solid',
                  borderColor: 'divider',
                  fontWeight: 'bold',
                  fontSize: '0.85rem',
                  color: 'text.secondary'
                }}>
                  <Box></Box>
                  <Box>Item</Box>
                  <Box sx={{ textAlign: 'center' }}>Qty</Box>
                  <Box sx={{ textAlign: 'right' }}>Std Price</Box>
                  <Box></Box>
                </Box>

                {/* Table Rows */}
                {orderItems.map((item) => (
                  <Box
                    key={item.tempId}
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: '40px 1fr 100px 120px 40px',
                      gap: 1.5,
                      alignItems: 'center',
                      py: 1.5,
                      px: 0,
                      borderBottom: '1px solid',
                      borderColor: 'divider',
                      '&:hover': { backgroundColor: 'action.hover' },
                      transition: 'background-color 0.2s'
                    }}
                  >
                    {/* Type Icon */}
                    <Avatar 
                      variant="rounded"
                      sx={{ width: 32, height: 32, bgcolor: item.item_type === 'Bouquet' ? 'success.light' : 'primary.light' }}
                    >
                      {item.item_type === 'Bouquet' ? <BouquetIcon sx={{ fontSize: 18 }} /> : <LocalFloristIcon sx={{ fontSize: 18 }} />}
                    </Avatar>

                    {/* Item Name */}
                    <Typography variant="body2" fontWeight="600" noWrap>
                      {item.item_name}
                    </Typography>

                    {/* Quantity Controls */}
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                      <IconButton 
                        size="small" 
                        onClick={() => handleQuantityChange(item.tempId, item.quantity - 1)}
                        disabled={item.item_type === 'Bouquet' || item.quantity <= 1}
                        sx={{ width: 24, height: 24 }}
                      >
                        <RemoveIcon fontSize="small" />
                      </IconButton>
                      <Typography variant="body2" fontWeight="bold" sx={{ minWidth: 25, textAlign: 'center' }}>
                        {item.quantity}
                      </Typography>
                      <IconButton 
                        size="small" 
                        onClick={() => handleQuantityChange(item.tempId, item.quantity + 1)}
                        disabled={item.item_type === 'Bouquet'}
                        sx={{ width: 24, height: 24 }}
                      >
                        <AddIcon fontSize="small" />
                      </IconButton>
                    </Box>

                    {/* Standard Price (Reference Price) */}
                    <Typography variant="body2" sx={{ textAlign: 'right', color: 'text.secondary' }}>
                      €{(item.standard_price || 0).toFixed(2)}
                    </Typography>

                    {/* Delete Button */}
                    <IconButton 
                      onClick={() => handleRemoveItem(item)}
                      size="small"
                      color="error"
                      sx={{ width: 32, height: 32 }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                ))}
              </Box>
            )}
            
            {orderItems.length > 0 && (
              <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                <Typography variant="body2" color="text.secondary">
                  Total Items: {orderItems.reduce((sum, item) => sum + item.quantity, 0)}
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Items Selection - Left Column */}
        <Grid item xs={12} md={8} sx={{ order: { xs: 1, md: 1 } }}>
          <Box>
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

            {/* Location and Stock Info */}
            {!locationId ? (
              <Alert severity="warning" sx={{ mb: 2 }}>
                ⚠️ No location assigned to this order. Please save the order with a location to see available stock levels.
              </Alert>
            ) : itemsBalance.length === 0 ? (
              <Alert severity="info" sx={{ mb: 2 }}>
                📦 Loading stock information for this location...
              </Alert>
            ) : (
              <Box sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                <Box
                  onClick={() => setHideZeroBalances(!hideZeroBalances)}
                  sx={{
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                    fontSize: '0.875rem',
                    color: hideZeroBalances ? '#2e7d32' : '#666',
                    userSelect: 'none',
                    transition: 'color 0.2s ease',
                    '&:hover': { color: hideZeroBalances ? '#1b5e20' : '#333' }
                  }}
                >
                  <Box sx={{ fontSize: '1rem' }}>
                    {hideZeroBalances ? '👁️' : '👁️‍🗨️'}
                  </Box>
                  <Typography variant="caption">
                    {hideZeroBalances ? 'Hiding out of stock' : 'Showing all'}
                  </Typography>
                </Box>
              </Box>
            )}

            {/* Items Grid */}
            {(itemType === 'flowers' || itemType === 'supplements') && (itemType === 'flowers' ? filteredFlowers : filteredSupplements).length > 0 ? (
              <Grid container spacing={1.5}>
                {(itemType === 'flowers' ? filteredFlowers : filteredSupplements).map((item) => (
                  <Grid item xs={6} sm={4} md={3} lg={3} key={item.id}>
                    <Card 
                      sx={{ 
                        cursor: 'pointer',
                        border: '1px solid',
                        borderColor: item.availableQty === 0 ? '#ff9800' : 'divider',
                        backgroundColor: item.availableQty === 0 ? 'rgba(255, 152, 0, 0.05)' : 'transparent',
                        '&:hover': { boxShadow: 3, transform: 'translateY(-2px)' },
                        height: '100%',
                        position: 'relative',
                        transition: 'all 0.2s ease-in-out',
                        display: 'flex',
                        flexDirection: 'column',
                      }}
                      onClick={() => handleOpenQuantityPicker(item, 'Flower')}
                    >
                      {/* Item Image - Proper Aspect Ratio Container */}
                      <Box
                        sx={{
                          position: 'relative',
                          width: '100%',
                          paddingBottom: '100%', // 1:1 aspect ratio
                          backgroundColor: '#f5f5f5',
                          overflow: 'hidden',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {item.fields.item_picture && item.fields.item_picture.length > 0 ? (() => {
                          const imageUrl = item.fields.item_picture[0].url;
                          return (
                            <Box
                              component="img"
                              src={imageUrl}
                              alt={item.fields.item_name}
                              onError={(e: any) => {
                                console.error(`❌ Failed to load item image: ${imageUrl}`);
                                e.target.style.display = 'none';
                              }}
                              onLoad={() => console.log(`✅ Loaded item image: ${item.fields.item_name}`)}
                              sx={{ 
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                display: 'block'
                              }}
                            />
                          );
                        })() : (
                          <LocalFloristIcon sx={{ fontSize: 32, opacity: 0.3, position: 'absolute' }} />
                        )}
                      </Box>
                      
                      {/* Stock badge */}
                      <Tooltip title={`Available at this location: ${item.availableQty || 0} units`}>
                        <Box
                          sx={{
                            position: 'absolute',
                            top: 4,
                            right: 4,
                            backgroundColor: item.availableQty === 0 ? '#ff9800' : '#4caf50',
                            color: 'white',
                            borderRadius: '50%',
                            width: 24,
                            height: 24,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '11px',
                            fontWeight: 'bold',
                            zIndex: 1,
                          }}
                        >
                          {item.availableQty || 0}
                        </Box>
                      </Tooltip>
                      
                      <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 }, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                        <Typography variant="body2" fontWeight="bold" noWrap>
                          {item.fields.item_name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" display="block">
                          {item.fields.Color}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                          €{item.fields.standard_price?.toFixed(2) || '0.00'}
                        </Typography>
                        <Button 
                          size="small" 
                          variant="outlined" 
                          fullWidth 
                          sx={{ mt: 'auto', textTransform: 'none' }}
                        >
                          Add to Order
                        </Button>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            ) : itemType === 'bouquets' && filteredBouquets.length > 0 ? (
              <Grid container spacing={1.5}>
                {filteredBouquets.map((bouquet) => (
                  <Grid item xs={6} sm={4} md={3} lg={3} key={bouquet.transaction_id}>
                    <Card 
                      sx={{ 
                        cursor: 'pointer',
                        border: '1px solid',
                        borderColor: 'divider',
                        '&:hover': { boxShadow: 3, transform: 'translateY(-2px)' },
                        height: '100%',
                        transition: 'all 0.2s ease-in-out',
                        display: 'flex',
                        flexDirection: 'column',
                      }}
                      onClick={() => handleOpenQuantityPicker(bouquet, 'Bouquet')}
                    >
                      {/* Bouquet Image - Proper Aspect Ratio Container */}
                      <Box
                        sx={{
                          position: 'relative',
                          width: '100%',
                          paddingBottom: '100%', // 1:1 aspect ratio
                          backgroundColor: '#f5f5f5',
                          overflow: 'hidden',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {bouquet.bouquet.item_picture ? (() => {
                          const imageUrl = bouquet.bouquet.item_picture;
                          return (
                            <Box
                              component="img"
                              src={imageUrl}
                              alt={bouquet.bouquet.item_name}
                              onError={(e: any) => {
                                console.error(`❌ Failed to load bouquet image: ${imageUrl}`);
                                e.target.style.display = 'none';
                              }}
                              onLoad={() => console.log(`✅ Loaded bouquet image: ${bouquet.bouquet.item_name}`)}
                              sx={{ 
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                display: 'block'
                              }}
                            />
                          );
                        })() : (
                          <BouquetIcon sx={{ fontSize: 32, opacity: 0.3, position: 'absolute' }} />
                        )}
                      </Box>
                      
                      <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 }, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                        <Typography variant="body2" fontWeight="bold" noWrap>
                          {bouquet.bouquet.item_name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" display="block">
                          {bouquet.bouquet.color}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                          €{(bouquet.calculated_price || 0).toFixed(2)}
                        </Typography>
                        <Button 
                          size="small" 
                          variant="outlined" 
                          fullWidth 
                          sx={{ mt: 'auto', textTransform: 'none' }}
                        >
                          Add to Order
                        </Button>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Alert severity="info">
                {searchQuery || selectedColor 
                  ? `No ${itemType} match your filters.` 
                  : `No ${itemType} available.`}
              </Alert>
            )}
          </Box>
        </Grid>
      </Grid>
    );
  };

  const renderCheckoutTab = () => {
    return (
      <Box>
        {/* Order Items Table */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>Order Items</Typography>
            
            {orderItems.length === 0 ? (
              <Alert severity="info">No items in cart. Please add items in the "ADD ITEMS" tab.</Alert>
            ) : (
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Type</TableCell>
                      <TableCell>Item Name</TableCell>
                      <TableCell align="center">Qty</TableCell>
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
                    {orderItems.map((item: any) => (
                      <TableRow key={item.tempId}>
                        {/* Type Column */}
                        <TableCell>
                          <Chip 
                            label={item.item_type} 
                            size="small" 
                            color={item.item_type === 'Bouquet' ? 'secondary' : 'primary'}
                          />
                        </TableCell>
                        
                        {/* Item Name Column */}
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {item.flower_picture || (item.item_type === 'Bouquet' && item.bouquet_details?.photo) ? (
                              <Avatar 
                                src={item.flower_picture || item.bouquet_details?.photo} 
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
                            </Box>
                          </Box>
                        </TableCell>
                        
                        {/* Quantity Column */}
                        <TableCell align="center">
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, justifyContent: 'center' }}>
                            <IconButton 
                              size="small" 
                              onClick={() => handleQuantityChange(item.tempId, item.quantity - 1)}
                              disabled={item.item_type === 'Bouquet' || item.quantity <= 1}
                              sx={{ p: 0.5 }}
                            >
                              <RemoveIcon fontSize="small" />
                            </IconButton>
                            <Typography variant="body2" fontWeight="bold" sx={{ minWidth: 30, textAlign: 'center' }}>
                              {item.quantity}
                            </Typography>
                            <IconButton 
                              size="small" 
                              onClick={() => handleQuantityChange(item.tempId, item.quantity + 1)}
                              disabled={item.item_type === 'Bouquet'}
                              sx={{ p: 0.5 }}
                            >
                              <AddIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        </TableCell>
                        
                        {/* Standard Price Column */}
                        <TableCell align="right">
                          <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                            €{item.standard_price.toFixed(2)}
                          </Typography>
                        </TableCell>
                        
                        {/* Markup Column */}
                        <TableCell align="center">
                          <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center', justifyContent: 'center', flexWrap: 'nowrap' }}>
                            {/* Preset markup buttons */}
                            {[5, 10, 25, 50].map((percentage) => (
                              <Button
                                key={percentage}
                                variant={item.markup_percentage === percentage ? 'contained' : 'outlined'}
                                size="small"
                                onClick={() => handleMarkupChange(item.tempId, percentage)}
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
                                  handleMarkupChange(item.tempId, null);
                                } else {
                                  const clampedValue = Math.max(-100, Math.min(100, value));
                                  handleMarkupChange(item.tempId, clampedValue);
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
                                onClick={() => handleMarkupChange(item.tempId, null)}
                                sx={{ fontSize: '0.7rem', py: 0, minHeight: 0, px: 0.5 }}
                              >
                                Clear
                              </Button>
                            )}
                          </Box>
                        </TableCell>
                        
                        {/* Unit Price Column */}
                        <TableCell align="right">
                          {editingPriceId === item.tempId ? (
                            <TextField
                              type="number"
                              size="small"
                              value={item.actual_price}
                              onChange={(e) => {
                                const newPrice = Math.max(0, parseFloat(e.target.value) || 0);
                                handleActualPriceChange(item.tempId, newPrice);
                              }}
                              onBlur={() => setEditingPriceId(null)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') setEditingPriceId(null);
                                if (e.key === 'Escape') setEditingPriceId(null);
                              }}
                              inputProps={{ step: 0.01, min: 0 }}
                              autoFocus
                              sx={{ width: 100 }}
                            />
                          ) : (
                            <Box
                              onClick={() => setEditingPriceId(item.tempId)}
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
                          )}
                        </TableCell>
                        
                        {/* Subtotal Column */}
                        <TableCell align="right">
                          <Typography variant="body1" fontWeight="bold">
                            €{(item.quantity * item.actual_price).toFixed(2)}
                          </Typography>
                        </TableCell>
                        
                        {/* Actions Column */}
                        <TableCell align="center">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleRemoveItem(item)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>

        {/* Pricing Control & Totals */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Delivery Price</Typography>
                
                <TextField
                  label="Delivery Fee (€)"
                  type="number"
                  value={deliveryPrice === 0 ? '' : deliveryPrice}
                  onChange={(e) => {
                    const value = e.target.value === '' ? 0 : parseFloat(e.target.value);
                    setDeliveryPrice(Math.max(0, value || 0));
                  }}
                  fullWidth
                  inputProps={{ min: 0, step: 0.01 }}
                  helperText="Additional delivery or shipping cost"
                />
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
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

          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Order Summary</Typography>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">Subtotal:</Typography>
                    <Typography variant="body2" fontWeight="bold">
                      €{totals.subtotal}
                    </Typography>
                  </Box>
                  
                  {discountPercentage > 0 && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', color: 'success.main' }}>
                      <Typography variant="body2">
                        Discount ({discountPercentage}%):
                      </Typography>
                      <Typography variant="body2" fontWeight="bold">
                        -€{totals.discountAmount}
                      </Typography>
                    </Box>
                  )}

                  {deliveryPrice > 0 && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2">Delivery:</Typography>
                      <Typography variant="body2" fontWeight="bold">
                        +€{deliveryPrice.toFixed(2)}
                      </Typography>
                    </Box>
                  )}
                  
                  <Divider />
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body1" fontWeight="bold">Total:</Typography>
                    <Typography variant="body1" fontWeight="bold" color="primary">
                      €{totals.totalPrice}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Payment Information */}
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>Payment Information</Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Payment Status</InputLabel>
                  <Select
                    value={paymentStatus}
                    onChange={(e) => setPaymentStatus(e.target.value)}
                    label="Payment Status"
                  >
                    {PAYMENT_STATUSES.map((status) => (
                      <MenuItem key={status} value={status}>{status}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Payment Method</InputLabel>
                  <Select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    label="Payment Method"
                  >
                    <MenuItem value="">None</MenuItem>
                    {PAYMENT_METHODS.map((method) => (
                      <MenuItem key={method} value={method}>{method}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Box>
    );
  };

  // ============================================================================
  // STATUS CHANGE HANDLER
  // ============================================================================

  const handleStatusChange = async () => {
    if (!order || !newStatus) {
      setError('Please select a new status');
      return;
    }

    if (newStatus === orderStatus) {
      setError('New status is the same as current status');
      return;
    }

    // Show warning for Draft → Confirmed transition
    if (orderStatus === 'Draft' && newStatus === 'Confirmed') {
      const confirmed = window.confirm(
        'Changing status to "Confirmed" will:\n' +
        '• Validate inventory availability\n' +
        '• Validate bouquet instances are still available (not sold)\n' +
        '• Deduct inventory for all items\n' +
        '• Mark bouquets as sold\n' +
        '• Create ORDER_CREATED action\n\n' +
        'Do you want to proceed?'
      );
      if (!confirmed) return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await apiService.updateOrderStatus(orderId!, newStatus);
      
      setSuccess(`Order status successfully changed from "${result.previous_status}" to "${result.new_status}"`);
      
      // Reload order data to get updated status
      await loadOrder();
      
      // Update local state
      setOrderStatus(newStatus);
      
    } catch (err: any) {
      console.error('Error updating order status:', err);
      setError(err.response?.data?.detail || err.message || 'Failed to update order status');
    } finally {
      setSaving(false);
    }
  };

  const renderStatusTab = () => (
    <Box>
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>Change Order Status</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Update the order status and automatically perform associated inventory actions.
          </Typography>

          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel>New Status</InputLabel>
            <Select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value as 'Confirmed' | 'Draft')}
              label="New Status"
            >
              <MenuItem value="Confirmed">Confirmed</MenuItem>
              <MenuItem value="Draft">Draft</MenuItem>
            </Select>
          </FormControl>

          <Alert severity="info" sx={{ mb: 2 }}>
            <strong>Status Change Actions:</strong>
            <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
              <li><strong>Draft → Confirmed:</strong> Deducts order items from inventory</li>
              <li><strong>Confirmed → Draft:</strong> Returns order items to inventory</li>
            </ul>
          </Alert>

          <Button
            variant="contained"
            color="primary"
            onClick={handleStatusChange}
            disabled={saving || orderStatus === newStatus}
            fullWidth
          >
            {saving ? 'Processing...' : `Change Status to ${newStatus}`}
          </Button>
        </CardContent>
      </Card>
    </Box>
  );

  // ============================================================================
  // MAIN RENDER
  // ============================================================================

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <FlowerSpinner size={60} />
      </Box>
    );
  }

  if (!order) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Order not found</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 2 }}>
        <IconButton onClick={() => navigate('/orders/manage')} sx={{ mr: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4">
          Edit Order #{order.fields.orderid || order.id.substring(0, 8)}
        </Typography>
        <Chip 
          label={orderStatus}
          color={orderStatus === 'Confirmed' ? 'success' : 'default'}
          variant={orderStatus === 'Confirmed' ? 'filled' : 'outlined'}
          sx={{ fontWeight: 'bold', fontSize: '0.9rem' }}
        />
      </Box>

      {/* Error/Success Messages */}
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

      {/* Tabs Navigation */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={currentTab} onChange={(_, newValue) => setCurrentTab(newValue)}>
          <Tab label="BASIC INFO →" />
          <Tab 
            label="ADD ITEMS →" 
            icon={orderItems.length > 0 ? <MuiBadge badgeContent={orderItems.length} color="primary"><span /></MuiBadge> : undefined}
            iconPosition="end"
          />
          <Tab label="CHECKOUT" />
          <Tab label="CHANGE STATUS" />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      <Box sx={{ mb: 3 }}>
        {currentTab === 0 && renderBasicInfoTab()}
        {currentTab === 1 && renderItemsTab()}
        {currentTab === 2 && renderCheckoutTab()}
        {currentTab === 3 && renderStatusTab()}
      </Box>

      {/* Quantity Picker Dialog - Flowers */}
      {selectedItemForModal && modalItemType === 'Flower' && (
        <QuantityPickerDialog
          open={quantityPickerOpen && modalItemType === 'Flower'}
          onClose={handleCloseQuantityPicker}
          item={{
            item_name: selectedItemForModal.fields.item_name || 'Unknown',
            Color: selectedItemForModal.fields.Color || 'Unknown',
            item_picture: undefined,
          } as InventoryItem}
          onConfirm={handleQuantityPickerConfirm}
          title={`Add ${selectedItemForModal.fields.item_name || 'Flower'} to Order`}
          availableQty={selectedItemForModal.availableQty || 0}
        />
      )}

      {/* Quantity Picker Dialog - Bouquets */}
      {selectedBouquetForModal && modalItemType === 'Bouquet' && (
        <QuantityPickerDialog
          open={quantityPickerOpen && modalItemType === 'Bouquet'}
          onClose={handleCloseQuantityPicker}
          item={{
            item_name: selectedBouquetForModal.bouquet.item_name || 'Unknown',
            Color: selectedBouquetForModal.bouquet.color || 'Unknown',
            item_picture: undefined,
          } as InventoryItem}
          onConfirm={handleQuantityPickerConfirm}
          title="Add Bouquet to Order"
        />
      )}

      {/* Action Buttons */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Button
          variant="outlined"
          onClick={() => navigate('/orders/manage')}
          disabled={saving}
        >
          Cancel
        </Button>
        
        {currentTab === 0 && (
          <Button
            variant="contained"
            color="primary"
            startIcon={<ShoppingCartIcon />}
            onClick={() => setCurrentTab(1)}
            disabled={!selectedClient}
          >
            Go to Order Items Update
          </Button>
        )}

        {currentTab === 1 && (
          <Button
            variant="contained"
            color="primary"
            startIcon={<AssignmentIcon />}
            onClick={() => setCurrentTab(2)}
            disabled={orderItems.length === 0}
          >
            Proceed to Checkout
          </Button>
        )}

        {currentTab === 2 && (
          <Button
            variant="contained"
            color="primary"
            startIcon={<SaveIcon />}
            onClick={handleUpdateCheckout}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Update Order'}
          </Button>
        )}

        {currentTab === 3 && null /* Status tab has its own button */}
      </Box>
    </Box>
  );
}
