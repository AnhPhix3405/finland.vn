import { v4 as uuidv4 } from 'uuid';
import { Tag } from './tags.service.client';
import { fetchWithRetry } from '@/src/lib/api/fetch-with-retry';
import { useAuthStore } from '@/src/store/authStore';

export interface CreateListingData {
  broker_id: string;
  title: string;
  description: string;
  transaction_type_id?: string;
  property_type_id?: string;
  province: string;
  ward: string;
  address?: string;
  area?: number;
  price?: string | number;
  price_per_m2?: number;
  price_per_frontage_meter?: number;
  direction?: string;
  visibility?: boolean;
  status?: string;
  tags?: string[];
  contact_name?: string;
  contact_phone?: string;
  floor_count?: number;
  bedroom_count?: number;
}

export interface ListingResponse {
  id: string;
  success: boolean;
  message?: string;
  error?: string;
  tags?: Tag[];
}

export function createListingLocal(data: Partial<CreateListingData>): ListingResponse {
  const listingId = uuidv4();

  if (!data.title || !data.description) {
    return {
      id: "",
      success: false,
      error: "Title and description are required"
    };
  }

  console.log("Created listing locally with ID:", listingId);
  console.log("Listing data:", data);

  return {
    id: listingId,
    success: true,
    message: "Listing created successfully"
  };
}

export async function createListing(data: CreateListingData): Promise<ListingResponse> {
  const userToken = useAuthStore.getState().accessToken;
  
  try {
    const response = await fetchWithRetry('/api/listings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
      token: userToken || undefined,
      isAdmin: false,
    });

    if (response.status === 401) {
      return {
        id: "",
        success: false,
        error: "Phiên đăng nhập hết hạn"
      };
    }

    const result = await response.json();
    if (result.success) {
      return {
        id: result.data.id,
        success: true,
        message: result.message,
        tags: result.tags || []
      };
    } else {
      return {
        id: "",
        success: false,
        error: result.error || 'Failed to create listing'
      };
    }
  } catch (error) {
    console.error('Error creating listing:', error);
    return {
      id: "",
      success: false,
      error: 'Failed to create listing'
    };
  }
}

export async function getListings(params?: {
  page?: number;
  limit?: number;
  hashtags?: string[];
  province?: string;
  ward?: string;
  priceMin?: string;
  priceMax?: string;
  sortBy?: string;
  token?: string;
}): Promise<{data: Record<string, unknown>[], pagination: Record<string, unknown>}> {
  try {
    const { page = 1, limit = 10, hashtags, province, ward, priceMin, priceMax, sortBy, token } = params || {};
    
    // Build URL with query parameters
    const searchParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString()
    });
    
    if (hashtags && hashtags.length > 0) {
      searchParams.set('hashtags', hashtags.join(','));
    }

    if (province) {
      searchParams.set('province', province);
    }

    if (ward) {
      searchParams.set('ward', ward);
    }

    if (priceMin) {
      searchParams.set('priceMin', priceMin);
    }

    if (priceMax) {
      searchParams.set('priceMax', priceMax);
    }

    if (sortBy) {
      searchParams.set('sortBy', sortBy);
    }
    
    // Build fetch options with Authorization header if token is provided
    const fetchOptions: RequestInit = {};
    if (token) {
      fetchOptions.headers = {
        'Authorization': `Bearer ${token}`
      };
      console.log('📡 getListings - Sending with Authorization header');
    } else {
      console.log('📡 getListings - No token provided, sending without Authorization');
    }
    
    const response = await fetch(`/api/listings?${searchParams.toString()}`, fetchOptions);
    const result = await response.json();
    
    return {
      data: result.data || [],
      pagination: result.pagination || {}
    };
  } catch (error) {
    console.error('Error fetching listings:', error);
    return {
      data: [],
      pagination: {
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0
      }
    };
  }
}

export async function getListingsByHashtags(hashtags: string[], params?: {
  page?: number;
  limit?: number;
  province?: string;
  ward?: string;
  priceMin?: string;
  priceMax?: string;
  sortBy?: string;
  token?: string;
}): Promise<{data: Record<string, unknown>[], pagination: Record<string, unknown>}> {
  return getListings({
    ...params,
    hashtags
  });
}

// Function cho trang "Tin đăng của tôi" (yêu cầu Authorization token)
export async function getMyListings(
  token: string, 
  status: string = "all",
  page: number = 1
): Promise<{ success: boolean; data: Record<string, unknown>[]; pagination?: Record<string, unknown>; error?: string; statusCode?: number }> {
  try {
    const response = await fetchWithRetry(`/api/brokers/me/listings?status=${status}&page=${page}&limit=10`, {
      token
    });

    // Return status code so component can handle 401 differently
    const result = await response.json();
    return {
      ...result,
      statusCode: response.status
    };
  } catch (error) {
    console.error('Error fetching my listings:', error);
    return {
      success: false,
      error: 'Lỗi tải danh sách tin đăng',
      data: []
    };
  }
}

// Function để thay đổi trạng thái bài đăng (Ẩn tin/ Đã xong)
export async function updateListingStatus(
  id: string,
  status: string,
  token: string
): Promise<{ success: boolean; message?: string; error?: string; statusCode?: number }> {
  try {
    const response = await fetchWithRetry(`/api/listings/${id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status }),
      token
    });
    const result = await response.json();
    return {
      ...result,
      statusCode: response.status
    };
  } catch (error) {
    return { success: false, error: 'Failed to update status' };
  }
}

// Function xóa tin đăng
export async function deleteListingLocal(id: string, token: string): Promise<{ success: boolean; message?: string; error?: string; statusCode?: number }> {
  try {
    const response = await fetchWithRetry(`/api/listings/${id}`, {
      method: 'DELETE',
      token
    });
    const result = await response.json();
    return {
      ...result,
      statusCode: response.status
    };
  } catch (error) {
    return { success: false, error: 'Failed to delete listing' };
  }
}

