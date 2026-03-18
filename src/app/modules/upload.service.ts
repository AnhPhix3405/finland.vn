
import { useAuthStore } from '@/src/store/authStore';
import { fetchWithRetry } from '@/src/lib/api/fetch-with-retry';

export async function uploadProjectFile(file: File, projectId: string) {
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
  const res = await fetchWithRetry("/api/attachments", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    token: accessToken,
    isAdmin: false,
    body: JSON.stringify(data)
  });
  return await res.json();
}

export async function deleteAttachment(id: string, accessToken?: string) {
  const res = await fetchWithRetry(`/api/attachments/${id}`, {
    method: 'DELETE',
    token: accessToken,
    isAdmin: false
  });
  return await res.json();
}


export async function uploadBrokerAvatar(file: File, brokerId: string) {
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

export async function uploadAttachments(file: File) {
  const accessToken = useAuthStore.getState().accessToken;
  
  // Determine role and user info
  const userStore = (await import('@/src/store/userStore')).useUserStore.getState();
  const user = userStore.user;
  console.log("user", user);
  const isBroker = user?.role === 'broker';

  // Use role-specific sign endpoint
  const signEndpoint = isBroker ? '/api/upload/brokers/sign' : '/api/upload/sign';
  const folder = isBroker ? 'finland/brokers' : 'finland/attachments';

  // Get upload signature
  const signRes = await fetchWithRetry(signEndpoint, {
    method: 'POST',
    token: accessToken || undefined,
    isAdmin: false
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
      // broker: target_type='broker', target_id=broker user id
      // admin: target_type='admin', no target_id needed
      target_type: isBroker ? 'broker' : 'admin',
      target_id: isBroker ? user?.id : undefined,
    };
    console.log('attachmentData', attachmentData);
    await createAttachment(attachmentData, accessToken || undefined);
    return uploadData;
  } catch (err) {
    console.log(err);
  }
}

export async function uploadListingAttachments(file: File, listingId: string, accessToken?: string, sortOrder: number = 0) {
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