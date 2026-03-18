import { useAuthStore } from '@/src/store/authStore';
import { fetchWithRetry } from '@/src/lib/api/fetch-with-retry';

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

    const response = await fetchWithRetry(`/api/bookmarks?page=${page}&limit=${limit}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      token: accessToken,
      isAdmin: false,
    });

    const result = await response.json();

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

    const response = await fetchWithRetry('/api/bookmarks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ listing_id }),
      token: accessToken,
      isAdmin: false,
    });

    const result = await response.json();

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
