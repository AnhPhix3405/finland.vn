
import { useAuthStore } from '@/src/store/authStore';
import { fetchWithRetry } from '@/src/lib/api/fetch-with-retry';

function validateFile(file: File) {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
  // Mở rộng type nếu cần, nhưng user chủ yếu dùng ảnh. 
  // User yêu cầu max 6MB
  const MAX_SIZE = 6 * 1024 * 1024; // 6MB
  if (file.size > MAX_SIZE) {
    throw new Error('Dung lượng tệp không được vượt quá 6MB.');
  }
}

/**
 * Generic Streaming Upload function
 * Gửi file lên server, server dùng busboy pipe thẳng vào Cloudinary
 */
async function uploadFileStreaming(
    file: File, 
    options: { 
        target_type: string; 
        target_id?: string; 
        sort_order?: number;
        isAdmin?: boolean;
    }
) {
  validateFile(file);
  const token = useAuthStore.getState().accessToken;
  const adminStore = (await import('@/src/store/adminStore')).useAdminStore.getState();
  const accessToken = options.isAdmin ? adminStore.accessToken : (token || adminStore.accessToken);

  const formData = new FormData();
  formData.append("file", file);
  formData.append("target_type", options.target_type);
  if (options.target_id) formData.append("target_id", options.target_id);
  if (options.sort_order !== undefined) formData.append("sort_order", options.sort_order.toString());

  const response = await fetchWithRetry("/api/upload", {
    method: "POST",
    token: accessToken || undefined,
    isAdmin: options.isAdmin,
    body: formData // Fetch converts FormData to a multipart stream
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Upload thất bại');
  }

  const result = await response.json();
  return result.data[0]; // Trả về attachment đầu tiên (vì upload đơn lẻ)
}

// RESTORED / REDESIGNED FUNCTIONS

export async function uploadProjectFile(file: File, projectId: string, token?: string, isAdmin: boolean = false, sortOrder: number = 0) {
    return uploadFileStreaming(file, {
        target_type: 'project',
        target_id: projectId,
        sort_order: sortOrder,
        isAdmin
    });
}

export async function uploadBrokerAvatar(file: File, brokerId: string) {
    // Với avatar, chúng ta vẫn cần cập nhật bảng brokers sau khi upload
    const uploadData = await uploadFileStreaming(file, {
        target_type: 'broker',
        target_id: brokerId,
        isAdmin: false
    });

    const accessToken = useAuthStore.getState().accessToken;
    const updateRes = await fetchWithRetry("/api/brokers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        token: accessToken || undefined,
        body: JSON.stringify({
            id: brokerId,
            avatar_url: uploadData.secure_url
        })
    });
    return { ...uploadData, brokerUpdate: await updateRes.json() };
}

export async function uploadAdminAttachments(file: File) {
    return uploadFileStreaming(file, {
        target_type: 'admin',
        isAdmin: true
    });
}

export async function uploadBrokerAttachments(file: File) {
    const userStore = (await import('@/src/store/userStore')).useUserStore.getState();
    return uploadFileStreaming(file, {
        target_type: 'broker',
        target_id: userStore.user?.id,
        isAdmin: false
    });
}

export async function uploadListingAttachments(file: File, listingId: string, accessToken?: string, sortOrder: number = 0) {
    return uploadFileStreaming(file, {
        target_type: 'listing',
        target_id: listingId,
        sort_order: sortOrder,
        isAdmin: false
    });
}

export async function uploadNewsThumbnail(file: File) {
    return uploadFileStreaming(file, {
        target_type: 'news',
        isAdmin: false
    });
}

// Bulk delete remains the same as it doesn't involve upload
export async function deleteAttachmentsBulk(ids: string[], accessToken?: string, isAdmin: boolean = false) {
  const res = await fetchWithRetry('/api/attachments', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    token: accessToken,
    isAdmin: isAdmin,
    body: JSON.stringify({ ids })
  });
  return await res.json();
}

export async function deleteAttachment(id: string, accessToken?: string, isAdmin: boolean = false) {
  const endpoint = isAdmin ? `/api/admin/attachments?id=${id}` : `/api/attachments/${id}`;

  const res = await fetchWithRetry(endpoint, {
    method: 'DELETE',
    token: accessToken,
    isAdmin: isAdmin
  });
  return await res.json();
}