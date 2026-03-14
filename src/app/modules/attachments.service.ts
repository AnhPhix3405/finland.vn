
export const deleteAttachmentsByTarget = async (targetId: string, targetType: string) => {
    const response = await fetch(`/api/attachments?target_id=${targetId}&target_type=${targetType}`, {
        method: 'DELETE',
    });
    return response.json();
};

export const getAttachmentsByTarget = async (targetId: string, targetType: string = 'project') => {
    const response = await fetch(`/api/attachments?target_id=${targetId}&target_type=${targetType}`, {
        method: 'GET',
    });
    return response.json();
};
