import { useAdminStore } from "@/src/store/adminStore";
import { fetchWithRetry } from "@/src/lib/api/fetch-with-retry";

export type ListingStatus = 
  | 'Đang hiển thị' 
  | 'Đang chờ duyệt' 
  | 'Đã ẩn' 
  | 'Hết hạn' 
  | 'Đã bán' 
  | 'Đã xong' 
  | 'Bị từ chối';

export interface Broker {
  id: string;
  full_name: string;
  phone: string;
  email?: string | null;
  avatar_url?: string | null;
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
}

export interface PropertyType {
  id: string;
  name: string;
  hashtag: string;
}

export interface TransactionType {
  id: string;
  name: string;
  hashtag: string;
}

export interface Listing {
  id: string;
  broker_id: string;
  title: string;
  description: string;
  province: string;
  ward: string;
  address?: string | null;
  area?: number | null;
  price?: string | null; // bigint converted to string
  price_per_m2?: number | null;
  price_per_frontage_meter?: number | null;
  direction?: string | null;
  status?: string | null;
  property_type_id?: string | null;
  transaction_type_id?: string | null;
  created_at?: Date | string;
  updated_at?: Date | string;
  views_count?: number;
  
  // Relations
  brokers: Broker;
  tags?: Tag[];
  property_types?: PropertyType | null;
  transaction_types?: TransactionType | null;
}

export interface ListingListResponse {
  success: boolean;
  data?: Listing[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  error?: string;
}

export interface UpdateListingStatusRequest {
  status: ListingStatus;
}

export interface UpdateListingStatusResponse {
  success: boolean;
  data?: Listing;
  message?: string;
  error?: string;
  statusCode?: number;
}

/**
 * Get all listings with pagination (admin endpoint - shows all statuses)
 */
export async function getListings(
  page: number = 1, 
  limit: number = 50,
  filters?: {
    status?: string;
    transaction_type?: string;
    province?: string;
    ward?: string;
    search?: string;
    sortBy?: string;
  }
): Promise<ListingListResponse & { statusCode?: number }> {
  try {
    const adminToken = useAdminStore.getState().accessToken;
    const params = new URLSearchParams();
    params.set('page', page.toString());
    params.set('limit', limit.toString());

    if (filters?.status) params.set('status', filters.status);
    if (filters?.transaction_type) params.set('transaction_type', filters.transaction_type);
    if (filters?.province) params.set('province', filters.province);
    if (filters?.ward) params.set('ward', filters.ward);
    if (filters?.search) params.set('search', filters.search);
    if (filters?.sortBy) params.set('sortBy', filters.sortBy);

    const response = await fetchWithRetry(`/api/admin/listings?${params.toString()}`, {
      ...(adminToken ? { token: adminToken } : {}),
      isAdmin: true
    });
    const result = await response.json();
    return {
      ...result,
      statusCode: response.status
    };
  } catch (error) {
    console.error('Error fetching admin listings:', error);
    return {
      success: false,
      error: 'Failed to fetch listings'
    };
  }
}

/**
 * Update listing status (approve, reject, etc.)
 */
export async function updateListingStatus(
  listingId: string, 
  status: ListingStatus
): Promise<UpdateListingStatusResponse> {
  try {
    const adminToken = useAdminStore.getState().accessToken;
    const response = await fetchWithRetry(`/api/admin/listings`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ id: listingId, status }),
      ...(adminToken ? { token: adminToken } : {}),
      isAdmin: true
    });

    const result = await response.json();
    return {
      ...result,
      statusCode: response.status
    };
  } catch (error) {
    console.error('Error updating listing status:', error);
    return {
      success: false,
      error: 'Failed to update listing status'
    };
  }
}

/**
 * Delete a listing permanently
 */
export async function deleteListing(listingId: string): Promise<UpdateListingStatusResponse> {
  try {
    const adminToken = useAdminStore.getState().accessToken;
    const response = await fetchWithRetry(`/api/admin/listings?id=${listingId}`, {
      method: 'DELETE',
      ...(adminToken ? { token: adminToken } : {}),
      isAdmin: true
    });

    const result = await response.json();
    return {
      ...result,
      statusCode: response.status
    };
  } catch (error) {
    console.error('Error deleting listing:', error);
    return {
      success: false,
      error: 'Failed to delete listing'
    };
  }
}