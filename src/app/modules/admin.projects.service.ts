import { useAdminStore } from '@/src/store/adminStore';
import { fetchWithRetry } from '@/src/lib/api/fetch-with-retry';

export interface ProjectData {
    id?: string;
    project_code?: string;
    name?: string;
    slug?: string;
    province?: string;
    ward?: string;
    developer?: string;
    content?: string;
    status?: string;
    area?: number | string;
    price?: number | string;
    property_type_id?: string;
    thumbnail_url?: string;
}

export const createAdminProject = async (data: ProjectData) => {
    const adminToken = useAdminStore.getState().accessToken;
    const response = await fetchWithRetry('/api/admin/projects', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        token: adminToken || undefined,
        isAdmin: true,
    });
    const json = await response.json();
    return { ...json, statusCode: response.status };
};

export const updateAdminProject = async (data: ProjectData) => {
    const adminToken = useAdminStore.getState().accessToken;
    const response = await fetchWithRetry('/api/admin/projects', {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        token: adminToken || undefined,
        isAdmin: true,
    });
    const json = await response.json();
    return { ...json, statusCode: response.status };
};

export const deleteAdminProject = async (id: string) => {
    const adminToken = useAdminStore.getState().accessToken;
    const response = await fetchWithRetry(`/api/admin/projects?id=${id}`, {
        method: 'DELETE',
        token: adminToken || undefined,
        isAdmin: true,
    });
    const json = await response.json();
    return { ...json, statusCode: response.status };
};

export const getAdminProjects = async (params?: { page?: number; limit?: number; status?: string; search?: string; slug?: string; province?: string; ward?: string; property_type_id?: string; propertyType?: string; priceMin?: string; priceMax?: string; sortBy?: string }) => {
    const adminToken = useAdminStore.getState().accessToken;
    let urlStr = '/api/admin/projects';
    if (typeof window !== 'undefined') {
        urlStr = new URL('/api/admin/projects', window.location.origin).toString();
    }
    const url = new URL(urlStr, typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');

    if (params?.page) url.searchParams.append('page', params.page.toString());
    if (params?.limit) url.searchParams.append('limit', params.limit.toString());
    if (params?.status) url.searchParams.append('status', params.status);
    if (params?.search) url.searchParams.append('search', params.search);
    if (params?.slug) url.searchParams.append('slug', params.slug);
    if (params?.province) url.searchParams.append('province', params.province);
    if (params?.ward) url.searchParams.append('ward', params.ward);
    if (params?.property_type_id) url.searchParams.append('property_type_id', params.property_type_id);
    if (params?.propertyType) url.searchParams.append('propertyType', params.propertyType);
    if (params?.priceMin) url.searchParams.append('priceMin', params.priceMin);
    if (params?.priceMax) url.searchParams.append('priceMax', params.priceMax);
    if (params?.sortBy) url.searchParams.append('sortBy', params.sortBy);

    const response = await fetchWithRetry(url.toString(), {
        method: 'GET',
        token: adminToken || undefined,
        isAdmin: true,
    });
    const json = await response.json();
    return { ...json, statusCode: response.status };
};
