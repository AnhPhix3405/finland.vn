
import { useAuthStore } from "@/src/store/authStore";
import { fetchWithRetry } from "@/src/lib/api/fetch-with-retry";

export const deleteAttachmentsByTarget = async (targetId: string, targetType: string) => {
    const accessToken = useAuthStore.getState().accessToken;
    
    if (!accessToken) {
      return { success: false, error: 'Bạn cần đăng nhập' };
    }

    const response = await fetchWithRetry(`/api/attachments?target_id=${targetId}&target_type=${targetType}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
        },
        token: accessToken,
        isAdmin: false,
    });
    return response.json();
};

export const getAttachmentsByTarget = async (targetId: string, targetType: string = 'project') => {
    const response = await fetch(`/api/attachments?target_id=${targetId}&target_type=${targetType}`, {
        method: 'GET',
    });
    return response.json();
};

export const updateAttachmentSortOrder = async (attachmentId: string, sortOrder: number, accessToken: string) => {
    const response = await fetch(`/api/attachments/${attachmentId}`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ sort_order: sortOrder })
    });
    return response.json();
};
