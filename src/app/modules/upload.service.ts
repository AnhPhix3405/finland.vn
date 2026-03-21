
import { useAuthStore } from '@/src/store/authStore';
import { fetchWithRetry } from '@/src/lib/api/fetch-with-retry';

function validateImageFile(file: File) {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
  const extension = file.name.split('.').pop()?.toLowerCase() || '';
  const validExtensions = ['jpg', 'jpeg', 'png', 'gif'];

  if (!validTypes.includes(file.type) || !validExtensions.includes(extension)) {
    throw new Error('Chỉ cho phép tải lên các định dạng ảnh: jpg, jpeg, png, gif.');
  }

  const MAX_SIZE = 3 * 1024 * 1024; // 3MB
  if (file.size > MAX_SIZE) {
    throw new Error('Dung lượng ảnh không được vượt quá 3MB.');
  }
}

export async function uploadProjectFile(file: File, projectId: string) {
  validateImageFile(file);
  const accessToken = useAuthStore.getState().accessToken;

  // lấy chữ ký
  const signRes = await fetchWithRetry("/api/upload/projects/sign", {
    method: "POST",
    token: accessToken || undefined,
    isAdmin: false
  });

  if (!signRes.ok) {
    const err = await signRes.json();
    throw new Error(err.error || 'Không thể lấy chữ ký upload');
  }

  const { timestamp, signature, cloudName, apiKey } = await signRes.json();

  const formData = new FormData();

  formData.append("file", file);
  formData.append("api_key", apiKey);
  formData.append("timestamp", timestamp);
  formData.append("signature", signature);
  formData.append("folder", "finland/projects");
  formData.append("upload_preset", "finland");

  const uploadRes = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
    {
      method: "POST",
      body: formData
    }
  );
  const uploadData = await uploadRes.json();
  console.log("uploadData", uploadData);
  const attachmentData: AttachmentData = {
    url: uploadData.url,
    secure_url: uploadData.secure_url,
    size_bytes: uploadData.bytes.toString(),
    original_name: uploadData.original_filename,
    public_id: uploadData.public_id,
    target_id: projectId,
    target_type: "project"
  };
  console.log("attachmentData", attachmentData);
  await createAttachment(attachmentData, accessToken || undefined);
  return uploadData;
}
type AttachmentData = {
  url: string;
  secure_url: string;
  size_bytes: string;
  original_name: string;
  public_id: string;
  target_id?: string;
  target_type: string;
  sort_order?: number;
}
async function createAttachment(data: AttachmentData, accessToken?: string) {
  // Route to appropriate endpoint based on target_type
  const endpoint = data.target_type === 'admin' ? '/api/admin/attachments' : '/api/attachments';
  const isAdmin = data.target_type === 'admin';

  const res = await fetchWithRetry(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    token: accessToken,
    isAdmin: isAdmin,
    body: JSON.stringify(data)
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


export async function uploadBrokerAvatar(file: File, brokerId: string) {
  validateImageFile(file);
  console.log('🔹 [UPLOAD AVATAR] Starting upload for brokerId:', brokerId);
  const accessToken = useAuthStore.getState().accessToken;

  // lấy chữ ký
  const signRes = await fetchWithRetry("/api/upload/brokers/sign", {
    method: "POST",
    token: accessToken || undefined,
    isAdmin: false
  });

  if (!signRes.ok) {
    const err = await signRes.json();
    throw new Error(err.error || 'Không thể lấy chữ ký upload');
  }

  const signData = await signRes.json();
  console.log('🔹 [UPLOAD AVATAR] Sign response:', signData);

  const { timestamp, signature, cloudName, apiKey } = signData;

  const formData = new FormData();

  formData.append("file", file);
  formData.append("api_key", apiKey);
  formData.append("timestamp", timestamp);
  formData.append("signature", signature);
  formData.append("folder", "finland/brokers");
  formData.append("upload_preset", "finland");

  try {
    const uploadRes = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
      {
        method: "POST",
        body: formData
      }
    );
    const uploadData = await uploadRes.json();
    console.log('🔹 [UPLOAD AVATAR] Cloudinary upload result:', uploadData);

    if (!uploadData.secure_url) {
      throw new Error('No secure_url in upload response');
    }

    // Update broker avatar_url in database using id
    console.log('🔹 [UPLOAD AVATAR] Updating broker with id:', brokerId, 'avatar_url:', uploadData.secure_url);

    const updateRes = await fetchWithRetry("/api/brokers", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      token: accessToken || undefined,
      isAdmin: false,
      body: JSON.stringify({
        id: brokerId,
        avatar_url: uploadData.secure_url
      })
    });

    const updateResult = await updateRes.json();
    console.log('🔹 [UPLOAD AVATAR] Broker update result:', updateResult);

    if (!updateResult.success) {
      throw new Error(updateResult.message || updateResult.error || 'Failed to update broker avatar');
    }

    return {
      ...uploadData,
      brokerUpdate: updateResult
    };
  }
  catch (err) {
    console.error('🔹 [UPLOAD AVATAR] Error:', err);
    throw err;
  }
}

export async function uploadAdminAttachments(file: File) {
  validateImageFile(file);
  const adminStoreModule = await import('@/src/store/adminStore');
  const accessToken = adminStoreModule.useAdminStore.getState().accessToken;

  const signEndpoint = '/api/upload/sign';
  const folder = 'finland/attachments';
  const isAdmin = true;

  const signRes = await fetchWithRetry(signEndpoint, {
    method: 'POST',
    token: accessToken || undefined,
    isAdmin: isAdmin
  });

  if (!signRes.ok) {
    const err = await signRes.json();
    throw new Error(err.error || 'Không thể lấy chữ ký upload');
  }

  const { timestamp, signature, cloudName, apiKey } = await signRes.json();

  const formData = new FormData();
  formData.append('file', file);
  formData.append('api_key', apiKey);
  formData.append('timestamp', timestamp);
  formData.append('signature', signature);
  formData.append('folder', folder);
  formData.append('upload_preset', 'finland');

  try {
    const uploadRes = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
      { method: 'POST', body: formData }
    );
    const uploadData = await uploadRes.json();
    console.log('uploadData', uploadData);

    const attachmentData: AttachmentData = {
      url: uploadData.url,
      secure_url: uploadData.secure_url,
      size_bytes: uploadData.bytes.toString(),
      original_name: uploadData.original_filename,
      public_id: uploadData.public_id,
      target_type: 'admin',
    };
    console.log('attachmentData', attachmentData);
    const attachmentResult = await createAttachment(attachmentData, accessToken || undefined);
    console.log('Attachment creation result:', attachmentResult);
    if (!attachmentResult.success) {
      throw new Error(attachmentResult.error || 'Failed to create attachment');
    }
    return uploadData;
  } catch (err) {
    console.error('uploadAdminAttachments error:', err);
    throw err;
  }
}

export async function uploadBrokerAttachments(file: File) {
  validateImageFile(file);
  const accessToken = useAuthStore.getState().accessToken;

  const userStore = (await import('@/src/store/userStore')).useUserStore.getState();
  const user = userStore.user;

  const signEndpoint = '/api/upload/brokers/sign';
  const folder = 'finland/brokers';
  const isAdmin = false;

  const signRes = await fetchWithRetry(signEndpoint, {
    method: 'POST',
    token: accessToken || undefined,
    isAdmin: isAdmin
  });

  if (!signRes.ok) {
    const err = await signRes.json();
    throw new Error(err.error || 'Không thể lấy chữ ký upload');
  }

  const { timestamp, signature, cloudName, apiKey } = await signRes.json();

  const formData = new FormData();
  formData.append('file', file);
  formData.append('api_key', apiKey);
  formData.append('timestamp', timestamp);
  formData.append('signature', signature);
  formData.append('folder', folder);
  formData.append('upload_preset', 'finland');

  try {
    const uploadRes = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
      { method: 'POST', body: formData }
    );
    const uploadData = await uploadRes.json();
    console.log('uploadData', uploadData);

    const attachmentData: AttachmentData = {
      url: uploadData.url,
      secure_url: uploadData.secure_url,
      size_bytes: uploadData.bytes.toString(),
      original_name: uploadData.original_filename,
      public_id: uploadData.public_id,
      target_type: 'broker',
      target_id: user?.id,
    };
    console.log('attachmentData', attachmentData);
    const attachmentResult = await createAttachment(attachmentData, accessToken || undefined);
    console.log('Attachment creation result:', attachmentResult);
    if (!attachmentResult.success) {
      throw new Error(attachmentResult.error || 'Failed to create attachment');
    }
    return uploadData;
  } catch (err) {
    console.error('uploadBrokerAttachments error:', err);
    throw err;
  }
}

export async function uploadListingAttachments(file: File, listingId: string, accessToken?: string, sortOrder: number = 0) {
  validateImageFile(file);
  const token = accessToken || useAuthStore.getState().accessToken;

  // lấy chữ ký
  const signRes = await fetchWithRetry("/api/upload/listings/sign", {
    method: "POST",
    token: token || undefined,
    isAdmin: false
  });

  if (!signRes.ok) {
    const err = await signRes.json();
    throw new Error(err.error || 'Không thể lấy chữ ký upload');
  }

  const { timestamp, signature, cloudName, apiKey } = await signRes.json();

  const formData = new FormData();

  formData.append("file", file);
  formData.append("api_key", apiKey);
  formData.append("timestamp", timestamp);
  formData.append("signature", signature);
  formData.append("folder", "finland/listings");
  formData.append("upload_preset", "finland");

  const uploadRes = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
    {
      method: "POST",
      body: formData
    }
  );
  const uploadData = await uploadRes.json();
  console.log("uploadData", uploadData);
  const attachmentData: AttachmentData = {
    url: uploadData.url,
    secure_url: uploadData.secure_url,
    size_bytes: uploadData.bytes.toString(),
    original_name: uploadData.original_filename,
    public_id: uploadData.public_id,
    target_id: listingId,
    target_type: "listing",
    sort_order: Number(sortOrder)
  };
  console.log("attachmentData sort_order:", sortOrder, "->", Number(sortOrder));
  await createAttachment(attachmentData, token || undefined);
  return uploadData;
}

export async function uploadNewsThumbnail(file: File) {
  validateImageFile(file);
  const accessToken = useAuthStore.getState().accessToken;

  // Get signature for news upload
  const signRes = await fetchWithRetry("/api/upload/news/sign", {
    method: "POST",
    token: accessToken || undefined,
    isAdmin: false
  });

  if (!signRes.ok) {
    const err = await signRes.json();
    throw new Error(err.error || 'Không thể lấy chữ ký upload');
  }

  const { timestamp, signature, cloudName, apiKey } = await signRes.json();

  const formData = new FormData();

  formData.append("file", file);
  formData.append("api_key", apiKey);
  formData.append("timestamp", timestamp);
  formData.append("signature", signature);
  formData.append("folder", "finland/news");
  formData.append("upload_preset", "finland");

  try {
    const uploadRes = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
      {
        method: "POST",
        body: formData
      }
    );
    const uploadData = await uploadRes.json();
    console.log("uploadData", uploadData);

    // Return secure_url to be used directly as thumbnail_url in news model
    return {
      secure_url: uploadData.secure_url,
      url: uploadData.url,
      public_id: uploadData.public_id,
      width: uploadData.width,
      height: uploadData.height,
      ...uploadData
    };
  } catch (err) {
    console.error('Error uploading news thumbnail:', err);
    throw err;
  }
}