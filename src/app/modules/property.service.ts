// Property Types Service

export interface PropertyType {
    id: string;
    name: string;
    hashtag?: string;
    created_at?: string;
    updated_at?: string;
}

export interface PropertyTypesResponse {
    success: boolean;
    data?: PropertyType[];
    error?: string;
    pagination?: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

export interface PropertyTypeResponse {
    success: boolean;
    data?: PropertyType;
    error?: string;
    message?: string;
}

// GET - Lấy danh sách property types
export const getPropertyTypes = async (params?: {
    page?: number;
    limit?: number;
    search?: string;
}): Promise<PropertyTypesResponse> => {
    try {
        const searchParams = new URLSearchParams();

        if (params?.page) searchParams.append('page', params.page.toString());
        if (params?.limit) searchParams.append('limit', params.limit.toString());
        if (params?.search) searchParams.append('search', params.search);

        const response = await fetch(`/api/property_types?${searchParams.toString()}`);
        return await response.json();
    } catch (error) {
        console.error('Error fetching property types:', error);
        return { success: false, error: 'Lỗi khi lấy danh sách loại hình BĐS' };
    }
};

// POST - Tạo property type mới
export const createPropertyType = async (data: {
    name: string;
    hashtag?: string;
}): Promise<PropertyTypeResponse> => {
    try {
        const response = await fetch('/api/admin/property_types', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });
        return await response.json();
    } catch (error) {
        console.error('Error creating property type:', error);
        return { success: false, error: 'Lỗi khi tạo loại hình BĐS' };
    }
};

// PATCH - Cập nhật property type
export const updatePropertyType = async (data: {
    id: string;
    name: string;
    hashtag?: string;
}): Promise<PropertyTypeResponse> => {
    try {
        const response = await fetch('/api/property_types', {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });
        return await response.json();
    } catch (error) {
        console.error('Error updating property type:', error);
        return { success: false, error: 'Lỗi khi cập nhật loại hình BĐS' };
    }
};

// DELETE - Xóa property type
export const deletePropertyType = async (id: string): Promise<PropertyTypeResponse> => {
    try {
        const response = await fetch(`/api/property_types?id=${id}`, {
            method: 'DELETE',
        });
        return await response.json();
    } catch (error) {
        console.error('Error deleting property type:', error);
        return { success: false, error: 'Lỗi khi xóa loại hình BĐS' };
    }
};

// ====== TRANSACTION TYPES SERVICE ======

export interface TransactionType {
    id: string;
    name: string;
    hashtag?: string;
    created_at?: string;
    updated_at?: string;
}

export interface TransactionTypesResponse {
    success: boolean;
    data?: TransactionType[];
    error?: string;
    pagination?: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

export interface TransactionTypeResponse {
    success: boolean;
    data?: TransactionType;
    error?: string;
    message?: string;
}

// GET - Lấy danh sách transaction types
export const getTransactionTypes = async (params?: {
    page?: number;
    limit?: number;
    search?: string;
}): Promise<TransactionTypesResponse> => {
    try {
        const searchParams = new URLSearchParams();

        if (params?.page) searchParams.append('page', params.page.toString());
        if (params?.limit) searchParams.append('limit', params.limit.toString());
        if (params?.search) searchParams.append('search', params.search);

        const response = await fetch(`/api/transaction_types?${searchParams.toString()}`);
        return await response.json();
    } catch (error) {
        console.error('Error fetching transaction types:', error);
        return { success: false, error: 'Lỗi khi lấy danh sách loại hình giao dịch' };
    }
};

// POST - Tạo transaction type mới
export const createTransactionType = async (data: {
    name: string;
    hashtag?: string;
}): Promise<TransactionTypeResponse> => {
    try {
        const response = await fetch('/api/transaction_types', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });
        return await response.json();
    } catch (error) {
        console.error('Error creating transaction type:', error);
        return { success: false, error: 'Lỗi khi tạo loại hình giao dịch' };
    }
};

// PATCH - Cập nhật transaction type
export const updateTransactionType = async (data: {
    id: string;
    name: string;
    hashtag?: string;
}): Promise<TransactionTypeResponse> => {
    try {
        const response = await fetch('/api/transaction_types', {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });
        return await response.json();
    } catch (error) {
        console.error('Error updating transaction type:', error);
        return { success: false, error: 'Lỗi khi cập nhật loại hình giao dịch' };
    }
};

// DELETE - Xóa transaction type
export const deleteTransactionType = async (id: string): Promise<TransactionTypeResponse> => {
    try {
        const response = await fetch(`/api/transaction_types?id=${id}`, {
            method: 'DELETE',
        });
        return await response.json();
    } catch (error) {
        console.error('Error deleting transaction type:', error);
        return { success: false, error: 'Lỗi khi xóa loại hình giao dịch' };
    }
};
