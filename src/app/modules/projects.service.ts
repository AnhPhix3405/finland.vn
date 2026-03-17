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

export const createProject = async (data: ProjectData) => {
    const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    });
    return response.json();
};

export const updateProject = async (data: ProjectData) => {
    const response = await fetch('/api/projects', {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    });
    return response.json();
};

export const deleteProject = async (id: string) => {
    const response = await fetch(`/api/projects?id=${id}`, {
        method: 'DELETE',
    });
    return response.json();
};

export const getProjects = async (params?: { page?: number; limit?: number; status?: string; search?: string; slug?: string }) => {
    let urlStr = '/api/projects';
    if (typeof window !== 'undefined') {
        urlStr = new URL('/api/projects', window.location.origin).toString();
    }
    const url = new URL(urlStr, typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');

    if (params?.page) url.searchParams.append('page', params.page.toString());
    if (params?.limit) url.searchParams.append('limit', params.limit.toString());
    if (params?.status) url.searchParams.append('status', params.status);
    if (params?.search) url.searchParams.append('search', params.search);
    if (params?.slug) url.searchParams.append('slug', params.slug);

    const response = await fetch(url.toString(), {
        method: 'GET',
    });
    return response.json();
};

export const getProject = async (slug: string) => {
    try {
        const response = await fetch(`/api/projects/${slug}`);
        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Frontend get project error:', error);
        return { success: false, error: 'Không thể kết nối đến máy chủ' };
    }
};
