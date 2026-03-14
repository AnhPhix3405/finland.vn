import { useAuthStore } from '@/src/store/authStore';

export const getBookmarkedListings = async (page: number = 1, limit: number = 20) => {
  try {
    const accessToken = useAuthStore.getState().accessToken;

    if (!accessToken) {
      return {
        success: false,
        error: 'Bạn cần đăng nhập',
        data: [],
        pagination: { page, limit, total: 0, totalPages: 0 }
      };
    }

    const response = await fetch(`/api/bookmarks?page=${page}&limit=${limit}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      }
    });

    const result = await response.json();

    console.log('getBookmarkedListings response:', {
      status: response.status,
      totalData: result.data?.length || 0,
      pagination: result.pagination
    });

    if (!response.ok) {
      return {
        success: false,
        error: result.error || 'Lỗi khi tải dữ liệu',
        data: [],
        pagination: { page, limit, total: 0, totalPages: 0 }
      };
    }

    return result;
  } catch (error) {
    console.error('Error fetching bookmarked listings:', error);
    return {
      success: false,
      error: 'Không thể kết nối đến máy chủ',
      data: [],
      pagination: { page, limit, total: 0, totalPages: 0 }
    };
  }
};

export const toggleBookmark = async (listing_id: string) => {
  try {
    const accessToken = useAuthStore.getState().accessToken;

    if (!accessToken) {
      return {
        success: false,
        error: 'Bạn cần đăng nhập để lưu bài đăng'
      };
    }

    const response = await fetch('/api/bookmarks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({ listing_id })
    });

    const result = await response.json();
    
    console.log('toggleBookmark response:', {
      status: response.status,
      result: result
    });

    if (!response.ok) {
      return {
        success: false,
        error: result.error || 'Lỗi khi thao tác bookmark'
      };
    }

    return result;
  } catch (error) {
    console.error('Error toggling bookmark:', error);
    return {
      success: false,
      error: 'Không thể kết nối đến máy chủ'
    };
  }
};
