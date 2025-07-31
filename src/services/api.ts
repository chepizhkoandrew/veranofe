 import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

export interface InventoryItem {
  record_id: string;
  item_id: string;
  item_name: string;
  Color: string;
  item_category: string;
  item_description: string;
  expiry_days: number;
  item_picture?: string;
  current_balance: number;
}

export interface BalanceUpdateRequest {
  record_id: string;
  quantity_change: number;
  transaction_type: string;
  description: string;
}

export interface BalanceUpdateResponse {
  success: boolean;
  transaction_id: string;
  new_balance: number;
  transaction_details: any;
}

export interface TransactionHistory {
  date: string;
  type: string;
  quantity: number;
  description: string;
  status: string;
}

// Purchase Request interfaces
export interface Supplier {
  supplier_id: string;
  supplier_name: string;
  supplier_order_page_url?: string;
  supplier_message_url?: string;
}

export interface PurchaseRequestItem {
  item_id: string;
  quantity: number;
}

export interface PurchaseRequestCreate {
  supplier_id: string;
  expected_delivery?: string;
  items: PurchaseRequestItem[];
  description?: string;
  pr_price?: number;
  photos?: string[]; // Array of photo URLs or base64 strings
}

export interface PurchaseRequestItemDetail {
  requested_item_id: string;
  item_id: string;
  item_name: string;
  Color: string;
  quantity: number;
}

export interface AirtableAttachment {
  id: string;
  url: string;
  filename: string;
  size: number;
  type: string;
  width?: number;
  height?: number;
  thumbnails?: {
    small?: { url: string; width: number; height: number };
    large?: { url: string; width: number; height: number };
    full?: { url: string; width: number; height: number };
  };
}

export interface PurchaseRequest {
  purchase_order_id: string;
  supplier_id?: string;
  supplier_name?: string;
  Status?: string;
  Expected_delivery?: string;
  Created_at?: string;
  description?: string;
  pr_price?: number;
  photos?: string[]; // Legacy field for base64 images
  purchase_order_attachment?: AirtableAttachment[]; // New field for proper attachments
  items: PurchaseRequestItemDetail[];
}

export interface BouquetComposition {
  composition_id: string;
  flower_item_id: string;
  flower_name: string;
  flower_color: string;
  quantity: number;
}

export interface BouquetTemplate {
  id: string;
  name: string;
  description: string;
  price: number;
  image: any[];
  fields: any;
  compositions: BouquetComposition[];
}

class ApiService {
  private client = axios.create({
    baseURL: API_BASE_URL,
    timeout: 15000, // 15 seconds - balanced timeout
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Simple cache for inventory data (valid for 30 seconds)
  private inventoryCache: {
    data: InventoryItem[] | null;
    timestamp: number;
    expiry: number;
  } = {
    data: null,
    timestamp: 0,
    expiry: 30000, // 30 seconds
  };

  constructor() {
    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('API Error:', error);
        return Promise.reject(error);
      }
    );
  }

  // Health check
  async healthCheck(): Promise<{ status: string }> {
    const response = await this.client.get('/health');
    return response.data;
  }

  // Get inventory items with balance (with caching)
  async getInventoryWithBalance(forceRefresh: boolean = false): Promise<InventoryItem[]> {
    const now = Date.now();
    
    // Return cached data if available and not expired
    if (!forceRefresh && 
        this.inventoryCache.data && 
        (now - this.inventoryCache.timestamp) < this.inventoryCache.expiry) {
      console.log('📋 Using cached inventory data');
      return this.inventoryCache.data;
    }
    
    console.log('🔄 Fetching fresh inventory data from API');
    const response = await this.client.get('/inventory/with-balance');
    
    // Update cache
    this.inventoryCache = {
      data: response.data,
      timestamp: now,
      expiry: this.inventoryCache.expiry,
    };
    
    return response.data;
  }

  // Clear inventory cache (call after updates)
  clearInventoryCache(): void {
    this.inventoryCache.data = null;
    this.inventoryCache.timestamp = 0;
  }

  // Update item balance
  async updateItemBalance(updateData: BalanceUpdateRequest): Promise<BalanceUpdateResponse> {
    const response = await this.client.post('/inventory/update-balance', updateData);
    // Clear cache after update to ensure fresh data on next fetch
    this.clearInventoryCache();
    return response.data;
  }

  // Get transaction history for an item
  async getItemTransactionHistory(itemRecordId: string): Promise<TransactionHistory[]> {
    const response = await this.client.get(`/inventory/${itemRecordId}/history`);
    return response.data;
  }

  // Purchase Request Management
  async getPurchaseRequests(): Promise<PurchaseRequest[]> {
    const response = await this.client.get('/purchase-requests');
    return response.data;
  }

  async getPurchaseRequest(purchaseOrderId: string): Promise<PurchaseRequest> {
    const response = await this.client.get(`/purchase-requests/${purchaseOrderId}`);
    return response.data;
  }

  async createPurchaseRequest(request: PurchaseRequestCreate): Promise<PurchaseRequest> {
    const response = await this.client.post('/purchase-requests', request);
    return response.data;
  }

  async updatePurchaseRequest(purchaseOrderId: string, request: PurchaseRequestCreate): Promise<PurchaseRequest> {
    const response = await this.client.put(`/purchase-requests/${purchaseOrderId}`, request);
    return response.data;
  }

  // Bouquet Templates
  async getBouquetTemplates(): Promise<BouquetTemplate[]> {
    const response = await this.client.get('/bouquet-templates');
    return response.data;
  }

  // Get bouquets in stock
  async getBouquetsInStock(): Promise<any> {
    const response = await this.client.get('/bouquets/stock');
    return response.data;
  }

  // Create bouquet from template
  async createBouquetFromTemplate(formData: FormData): Promise<any> {
    const response = await this.client.post('/bouquets/from-template', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  // Suppliers
  async getSuppliers(): Promise<Supplier[]> {
    const response = await this.client.get('/suppliers');
    return response.data.map((supplier: any) => ({
      supplier_id: supplier.id,
      supplier_name: supplier.fields?.supplier_name || '',
      supplier_order_page_url: supplier.fields?.supplier_order_page_url || '',
      supplier_message_url: supplier.fields?.supplier_message_url || ''
    }));
  }

  // Items (for purchase request creation)
  async getItems(): Promise<InventoryItem[]> {
    const response = await this.client.get('/items');
    return response.data.map((item: any) => ({
      record_id: item.id,
      item_id: item.fields?.item_id || '',
      item_name: item.fields?.item_name || '',
      Color: item.fields?.Color || '',
      item_category: item.fields?.item_category || '',
      item_description: item.fields?.item_description || '',
      expiry_days: item.fields?.expiry_days || 0,
      item_picture: item.fields?.item_picture?.[0]?.url || '',
      current_balance: 0 // Not relevant for purchase requests
    }));
  }
}

export const apiService = new ApiService();