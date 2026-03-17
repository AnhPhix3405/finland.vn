import { v4 as uuidv4 } from 'uuid';
import { Tag } from './tags.service.client';

export interface CreateListingData {
  broker_id: string;
  title: string;
  // slug is now generated on server side
  description: string;
  transaction_type_id?: string; // Changed from transaction_type to transaction_type_id  
  property_type_id?: string; // Changed from property_type to property_type_id
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
  tags?: string[]; // Array of tag names
  contact_name?: string; // Override contact name, fallback to broker full_name
  contact_phone?: string; // Override contact phone, fallback to broker phone
  floor_count?: number;
  bedroom_count?: number;
}

export interface ListingResponse {
  id: string;
  success: boolean;
  message?: string;
  error?: string;
  tags?: Tag[]; // Include processed tags in response
}

// Temporary method to create listing with UUID (không call API thật)
export function createListingLocal(data: Partial<CreateListingData>): ListingResponse {
  const listingId = uuidv4();

  // Validate required fields if needed
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
  try {
    const response = await fetch('/api/listings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();
    if (result.success) {
      return {
        id: result.data.id,
        success: true,
        message: result.message,
        tags: result.tags || [] // Include tags in response
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
): Promise<{ success: boolean; data: Record<string, unknown>[]; pagination?: Record<string, unknown>; error?: string }> {
  try {
    const response = await fetch(`/api/brokers/me/listings?status=${status}&page=${page}&limit=10`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const result = await response.json();
    return result;
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
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const response = await fetch(`/api/listings/${id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ status })
    });
    return await response.json();
  } catch (error) {
    return { success: false, error: 'Failed to update status' };
  }
}

// Function xóa tin đăng
export async function deleteListingLocal(id: string, token: string): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const response = await fetch(`/api/listings/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return await response.json();
  } catch (error) {
    return { success: false, error: 'Failed to delete listing' };
  }
}

