'use client';
import Link from "next/link";
import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { uploadProjectFile, deleteAttachment, deleteAttachmentsBulk } from "@/src/app/modules/upload.service";
import { getAdminProjects, updateAdminProject } from "@/src/app/modules/admin.projects.service";
import { getPropertyTypes, PropertyType } from "@/src/app/modules/property.service";
import { useAdminStore } from "@/src/store/adminStore";
import { useNotificationStore } from "@/src/store/notificationStore";
import { useProjectContext } from "@/src/context/ProjectContext";
import { useAdminAuth } from "@/src/hooks/useAdminAuth";
import RichTextEditor from "@/src/components/ui/RichTextEditor";
import LocationSelector from "@/src/components/feature/LocationSelector";
import MapPicker from "@/src/components/feature/MapPicker";
import { fetchWithRetry } from "@/src/lib/api/fetch-with-retry";

interface Attachment {
  id: string;
  url: string;
  secure_url: string;
  public_id: string | null;
  original_name: string | null;
  size_bytes: string | null;
  project_id: string;
  created_at: string;
  sort_order?: number;
}

interface ConfirmModalState {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
}

export default function AdminProjectDetail() {
  const params = useParams();
  const slug = params?.id as string;
  const router = useRouter();
  const { activeProjectId, setActiveProjectId, setProjectSlug } = useProjectContext();
  const addToast = useNotificationStore((state) => state.addToast);

  useAdminAuth(() => {
    router.push('/admin/login');
  });

  const [deletedImages, setDeletedImages] = useState<string[]>([]);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [confirmModal, setConfirmModal] = useState<ConfirmModalState>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => { }
  });
  const [description, setDescription] = useState<string>('');

  const [projectName, setProjectName] = useState<string>('');
  const [projectArea, setProjectArea] = useState<string>('');
  const [projectPrice, setProjectPrice] = useState<string>('');
  const [selectedPropertyTypeId, setSelectedPropertyTypeId] = useState<string>('');
  const [propertyTypes, setPropertyTypes] = useState<PropertyType[]>([]);
  const [loadingPropertyTypes, setLoadingPropertyTypes] = useState(false);

  const [selectedProvince, setSelectedProvince] = useState<string>('');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('');
  const [projectStatus, setProjectStatus] = useState<string>('');

  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);

  const PROJECT_STATUS_OPTIONS = [
    { value: 'sắp mở bán', label: 'Sắp mở bán' },
    { value: 'đang mở bán', label: 'Đang mở bán' },
    { value: 'hàng thứ cấp', label: 'Hàng thứ cấp' },
  ];

  useEffect(() => {
    const fetchPropertyTypes = async () => {
      setLoadingPropertyTypes(true);
      try {
        const result = await getPropertyTypes({ limit: 100 });
        if (result.success) {
          setPropertyTypes(result.data || []);
        }
      } catch (error) {
        console.error('Error fetching property types:', error);
      } finally {
        setLoadingPropertyTypes(false);
      }
    };
    fetchPropertyTypes();
  }, []);

  // Images fetched from API
  const [images, setImages] = useState<Attachment[]>([]);
  const [originalImages, setOriginalImages] = useState<Attachment[]>([]);
  const [loadingImages, setLoadingImages] = useState(false);
  const [deletedApiImages, setDeletedApiImages] = useState<string[]>([]);
  const [projectId, setProjectId] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [draggedItem, setDraggedItem] = useState<number | null>(null);

  useEffect(() => {
    if (!slug) return;
    const fetchProjectDetails = async () => {
      try {
        const res = await getAdminProjects({ slug });
        if (res.statusCode === 401) {
          useAdminStore.getState().clearAuth();
          addToast('Phiên đăng nhập hết hạn, vui lòng đăng nhập lại', 'error');
          router.push('/admin/login');
          return;
        }
        if (res.success && res.data && res.data.length > 0) {
          const p = res.data[0];
          if (p.id) {
            setProjectId(p.id);
            setActiveProjectId(p.id);
            setProjectSlug(p.slug || null);
          }
          setProjectName(p.name || '');
          setProjectArea(p.area?.toString() || '');
          setProjectPrice(p.price ? Number(p.price).toLocaleString('en-US') : '');
          setSelectedPropertyTypeId(p.property_type_id || '');
          setSelectedProvince(p.province || '');
          setSelectedDistrict(p.ward || '');
          setDescription(p.content || '');
          setProjectStatus(p.status || '');
          setLatitude(p.latitude || null);
          setLongitude(p.longitude || null);
        }
      } catch (err) {
        console.error('Lỗi lấy thông tin project:', err);
      }
    };
    fetchProjectDetails();
  }, [slug]);
  const isManualMarkerRef = React.useRef(false);
  const isInitialDataLoaded = React.useRef(false);

  // Geocoding Effect - Jump map when province/ward changes
  useEffect(() => {
    // 1. Nếu chưa tải xong dữ liệu gốc, không làm gì cả
    if (!projectId) return;

    // 2. Nếu đây là lần đầu tiên dữ liệu được load vào state, đánh dấu đã load và không geocode
    if (!isInitialDataLoaded.current) {
      isInitialDataLoaded.current = true;
      return;
    }

    // 3. Nếu người dùng đã chủ động kéo ghim bản đồ, không tự động geocode đè lên nữa
    if (isManualMarkerRef.current) return;

    if (!selectedProvince) return;

    const geocode = async () => {
      try {
        const query = `${selectedDistrict ? selectedDistrict + ', ' : ''}${selectedProvince}, Vietnam`;
        const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
        if (!token) return;

        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${token}&limit=1`;
        const res = await fetch(url);
        const data = await res.json();

        if (data.features && data.features.length > 0) {
          const [lng, lat] = data.features[0].center;
          setLatitude(lat);
          setLongitude(lng);
        }
      } catch (err) {
        console.error('Geocoding error:', err);
      }
    };

    // Use a small delay for better UX
    const timer = setTimeout(geocode, 1000);
    return () => clearTimeout(timer);
  }, [selectedProvince, selectedDistrict, projectId]);

  const formatCurrencyOnChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    if (!value) {
      setProjectPrice('');
      return;
    }
    setProjectPrice(Number(value).toLocaleString('en-US'));
  };

  useEffect(() => {
    if (!projectId) return;
    const fetchImages = async () => {
      setLoadingImages(true);
      try {
        const res = await fetch(`/api/attachments/${projectId}?target_type=project`);
        const json = await res.json() as Record<string, unknown>;
        if (json.success) {
          const sortedImages = ((json.data as Attachment[]) || []).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
          setImages(sortedImages);
          setOriginalImages(sortedImages);
        }
      } catch (err) {
        console.error('Lỗi khi tải ảnh từ API:', err);
      } finally {
        setLoadingImages(false);
      }
    };
    fetchImages();
  }, [projectId]);

  // Drag & Drop handlers
  const handleDragStart = (index: number) => {
    setDraggedItem(index);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (index: number) => {
    if (draggedItem === null) return;
    const newImages = [...images];
    const [draggedImage] = newImages.splice(draggedItem, 1);
    newImages.splice(index, 0, draggedImage);
    // Update sort_order for all images
    const updatedImages = newImages.map((img, idx) => ({
      ...img,
      sort_order: idx
    }));
    setImages(updatedImages);
    setDraggedItem(null);
  };

  const handleRemoveApiImage = (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Xác nhận xóa',
      message: 'Bạn có chắc chắn muốn xóa ảnh này vĩnh viễn không?',
      onConfirm: () => {
        // Add ID to the list of images to be deleted from the API
        setDeletedApiImages(prev => [...prev, id]);
        // Remove from the current display state immediately
        setImages(prev => prev.filter(img => img.id !== id));
        setConfirmModal({ isOpen: false, title: '', message: '', onConfirm: () => { } });
      }
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      const MAX_SIZE = 3 * 1024 * 1024; // 3MB
      const validFiles = filesArray.filter(file => file.size <= MAX_SIZE);
      const largeFiles = filesArray.filter(file => file.size > MAX_SIZE);

      if (largeFiles.length > 0) {
        addToast(`${largeFiles.length} ảnh bị bỏ qua do vượt quá 3MB`, 'error');
      }

      setNewFiles(prev => [...prev, ...validFiles]);
      if (e.target) e.target.value = '';
    }
  };

  const handleRemoveNewFile = (index: number) => {
    setNewFiles(prev => prev.filter((_, i) => i !== index));
  };

  const scrollToError = (elementId: string) => {
    const element = document.getElementById(elementId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => element.focus(), 300);
    }
  };

  const handleSave = async () => {
    if (!projectId) {
      addToast('Không tìm thấy project ID!', 'error');
      return;
    }

    // Validate required fields
    if (!projectName.trim()) {
      addToast('Tên dự án là bắt buộc', 'error');
      scrollToError('projectName');
      return;
    }

    if (!selectedPropertyTypeId) {
      addToast('Loại hình bất động sản là bắt buộc', 'error');
      scrollToError('propertyType');
      return;
    }

    if (!selectedProvince) {
      addToast('Tỉnh/Thành phố là bắt buộc', 'error');
      scrollToError('projectCity');
      return;
    }

    if (!projectArea) {
      addToast('Diện tích là bắt buộc', 'error');
      scrollToError('projectArea');
      return;
    }

    if (!projectPrice) {
      addToast('Giá là bắt buộc', 'error');
      scrollToError('projectPrice');
      return;
    }

    setIsUploading(true);
    try {
      const updateRes = await updateAdminProject({
        id: projectId,
        name: projectName,
        province: selectedProvince,
        ward: selectedDistrict,
        area: Number(projectArea),
        price: Number(projectPrice.replace(/,/g, '')),
        property_type_id: selectedPropertyTypeId || undefined,
        content: description,
        status: projectStatus || undefined,
        latitude: latitude || undefined,
        longitude: longitude || undefined,
      });

      if (updateRes.statusCode === 401) {
        useAdminStore.getState().clearAuth();
        addToast('Phiên đăng nhập hết hạn, vui lòng đăng nhập lại', 'error');
        router.push('/admin/login');
        return;
      }

      if (!updateRes.success) {
        throw new Error(updateRes.error || 'Cập nhật database thất bại');
      }

      const adminToken = useAdminStore.getState().accessToken;

      // 1. Xóa các attachment API đã đánh dấu xóa
      if (deletedApiImages.length > 0) {
        try {
          await deleteAttachmentsBulk(deletedApiImages, adminToken || undefined, true);
          setDeletedApiImages([]); // Clear the list after successful deletion
        } catch (err) {
          console.error('Bulk delete failed:', err);
        }
      }

      // `images` state now only contains active images (those not marked for deletion)
      // and their sort_order has been updated by drag & drop.

      // 2. Upload tất cả file mới song song (với sort_order tiếp nối)
      let uploadResults: any[] = [];
      if (newFiles.length > 0) {
        uploadResults = await Promise.all(
          newFiles.map((file, idx) =>
            uploadProjectFile(file, projectId, adminToken || undefined, true, images.length + idx)
          )
        );
        setNewFiles([]); // Clear new files after upload
      }

      // 3. Update các ảnh cũ (về sort_order) - `images` state already reflects the desired order
      if (images.length > 0) {
        await Promise.all(images.map(img =>
          fetchWithRetry(`/api/attachments/${img.id}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json'
            },
            token: adminToken || undefined,
            isAdmin: true,
            body: JSON.stringify({ sort_order: img.sort_order || 0 })
          })
        ));
      }

      // 4. Cập nhật thumbnail_url: Lấy ảnh đầu tiên trong danh sách (thứ tự 0)
      let finalThumbnailUrl = '';
      if (images.length > 0) {
        // The `images` array is already sorted by `sort_order` and updated by drag & drop
        // The first element in `images` should be the new thumbnail
        finalThumbnailUrl = images[0].secure_url || images[0].url;
      } else if (uploadResults.length > 0) {
        // If no old images remain, and new images were uploaded, the first new image becomes thumbnail
        finalThumbnailUrl = uploadResults[0].secure_url;
      }

      if (finalThumbnailUrl) {
        await updateAdminProject({
          id: projectId,
          thumbnail_url: finalThumbnailUrl
        });
      }

      addToast('Lưu dự án thành công!', 'success');

      // Redirect after showing toast
      setTimeout(() => {
        router.push('/admin/du-an');
      }, 1000);
    } catch (error: unknown) {
      console.error('Lỗi khi lưu dự án:', error);
      const errorMessage = error instanceof Error ? error.message : 'Có lỗi xảy ra khi lưu dự án!';
      addToast(errorMessage, 'error');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Thông tin dự án</h2>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-sm border border-slate-200 dark:border-slate-700 shadow-sm p-6">
          <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="col-span-1 md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1" htmlFor="projectName">Tên dự án <span className="text-red-500">*</span></label>
                <input value={projectName} onChange={(e) => setProjectName(e.target.value)} className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-sm text-sm focus:ring-primary focus:border-primary dark:text-white placeholder-slate-400" id="projectName" placeholder="Nhập tên dự án..." type="text" />
              </div>
              <div className="col-span-1">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Loại hình <span className="text-red-500">*</span></label>
                <select
                  value={selectedPropertyTypeId}
                  onChange={(e) => setSelectedPropertyTypeId(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-sm text-sm focus:ring-primary focus:border-primary dark:text-white text-slate-700"
                  id="propertyType"
                  disabled={loadingPropertyTypes}
                >
                  <option value="">Chọn loại hình</option>
                  {propertyTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                </select>
                {loadingPropertyTypes && (
                  <p className="text-xs text-slate-500 mt-1">Đang tải loại hình...</p>
                )}
              </div>
              <div className="col-span-1 md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1" htmlFor="projectPrice">Giá (VND) <span className="text-red-500">*</span></label>
                <input value={projectPrice} onChange={formatCurrencyOnChange} className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-sm text-sm focus:ring-primary focus:border-primary dark:text-white placeholder-slate-400" id="projectPrice" placeholder="Ví dụ: 2,500,000,000" type="text" />
              </div>
              <div className="col-span-1">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1" htmlFor="projectArea">Diện tích (m²) <span className="text-red-500">*</span></label>
                <input value={projectArea} onChange={(e) => setProjectArea(e.target.value)} className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-sm text-sm focus:ring-primary focus:border-primary dark:text-white placeholder-slate-400" id="projectArea" placeholder="Ví dụ: 500" type="number" />
              </div>
              <LocationSelector
                selectedProvince={selectedProvince}
                onProvinceChange={(val) => {
                  isManualMarkerRef.current = false;
                  setSelectedProvince(val);
                }}
                selectedWard={selectedDistrict}
                onWardChange={(val) => {
                  isManualMarkerRef.current = false;
                  setSelectedDistrict(val);
                }}
                requiredProvince={true}
              />

              <div className="col-span-1 md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Vị trí trên bản đồ</label>
                <MapPicker
                  initialLat={latitude || undefined}
                  initialLng={longitude || undefined}
                  onLocationChange={(lat, lng) => {
                    // Đánh dấu người dùng đã chủ động kéo bản đồ
                    isManualMarkerRef.current = true;
                    setLatitude(lat);
                    setLongitude(lng);
                  }}
                />
                <p className="text-[10px] text-slate-500 mt-2">
                  * Kéo marker để chọn vị trí chính xác của dự án trên bản đồ
                </p>
              </div>

              <div className="col-span-1 md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Mô tả dự án</label>
                <div className="border border-slate-300 dark:border-slate-600 rounded-[3px] overflow-hidden bg-white dark:bg-slate-800">
                  <RichTextEditor value={description} onChange={setDescription} />
                </div>
              </div>

              {/* Images section */}
              <div className="col-span-1 md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Hình ảnh dự án</label>

                {/* Danh sách ảnh từ API */}
                {loadingImages ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="rounded-sm overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-700 h-32 animate-pulse" />
                    ))}
                  </div>
                ) : images.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    {images
                      .map((img, index) => (
                        <div
                          key={img.id}
                          className="relative group rounded-sm overflow-hidden border-2 border-slate-200 dark:border-slate-700 cursor-move draggable"
                          draggable
                          onDragStart={() => handleDragStart(index)}
                          onDragOver={handleDragOver}
                          onDrop={() => handleDrop(index)}
                        >
                          {index === 0 && (
                            <span className="absolute top-2 left-2 bg-emerald-500 text-white text-[10px] uppercase font-bold px-2 py-1 rounded z-10">Ảnh bìa</span>
                          )}
                          <img src={img.secure_url || img.url} alt={img.original_name ?? 'Project Image'} className="w-full h-32 object-cover" />
                          <button
                            type="button"
                            onClick={() => handleRemoveApiImage(img.id)}
                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity flex items-center justify-center w-6 h-6 z-10"
                          >
                            <span className="material-symbols-outlined text-[16px]">close</span>
                          </button>
                        </div>
                      ))}
                  </div>
                )}

                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 dark:border-slate-600 border-dashed rounded-sm hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer relative overflow-hidden">
                  <input
                    id="file-upload"
                    name="file-upload"
                    type="file"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    multiple
                    onChange={handleFileChange}
                    accept="image/png, image/jpeg, image/gif, image/webp"
                  />
                  <div className="space-y-1 text-center pointer-events-none">
                    <span className="material-symbols-outlined text-4xl text-slate-400 mb-2">cloud_upload</span>
                    <div className="flex text-sm text-slate-600 dark:text-slate-400 justify-center items-center">
                      <span className="font-medium text-primary bg-transparent text-emerald-600">Tải ảnh lên</span>
                      <p className="pl-1">hoặc kéo thả vào đây</p>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">PNG, JPG tối đa 3MB</p>
                  </div>
                </div>

                {/* Hiển thị các file mới chọn — dạng grid preview */}
                {newFiles.length > 0 && (
                  <div className="mt-4">
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-3 uppercase tracking-wide">
                      {newFiles.length} file mới chờ tải lên
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {newFiles.map((file, idx) => {
                        const previewUrl = URL.createObjectURL(file);
                        const sizeMB = (file.size / 1024 / 1024).toFixed(2);
                        return (
                          <div
                            key={idx}
                            className="relative group rounded-sm overflow-hidden border-2 border-dashed border-emerald-400 dark:border-emerald-600 bg-slate-50 dark:bg-slate-800/60"
                          >
                            {/* Thumbnail */}
                            <img
                              src={previewUrl}
                              alt={file.name}
                              className="w-full h-32 object-cover"
                              onLoad={() => URL.revokeObjectURL(previewUrl)}
                            />
                            {/* Overlay info */}
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-2 py-1.5">
                              <p className="text-white text-[11px] font-medium truncate leading-tight">{file.name}</p>
                              <p className="text-white/70 text-[10px]">{sizeMB} MB</p>
                            </div>
                            {/* Badge mới */}
                            <span className="absolute top-2 left-2 bg-emerald-500 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded-sm uppercase tracking-wide">
                              Mới
                            </span>
                            {/* Nút xóa */}
                            <button
                              type="button"
                              onClick={() => handleRemoveNewFile(idx)}
                              className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity flex items-center justify-center w-6 h-6"
                            >
                              <span className="material-symbols-outlined text-[16px]">close</span>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div className="col-span-1 md:col-span-2 py-3 border-t border-slate-200 dark:border-slate-700 mt-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1" htmlFor="projectStatus">Trạng thái dự án</label>
                <select
                  value={projectStatus}
                  onChange={(e) => setProjectStatus(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-sm text-sm focus:ring-primary focus:border-primary dark:text-white text-slate-700"
                  id="projectStatus"
                >
                  <option value="">Chọn trạng thái</option>
                  {PROJECT_STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-200 dark:border-slate-700">
              <Link href="/admin/du-an" className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-sm text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors inline-block">
                Hủy
              </Link>
              <button
                type="button"
                disabled={isUploading}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-sm text-sm font-medium transition-colors"
                onClick={handleSave}
              >
                {isUploading ? 'Đang lưu...' : 'Lưu dự án'}
              </button>
            </div>
          </form>
        </div>
      </div>
      {/* Confirmation Modal */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-md w-full p-6 transform transition-all animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 mb-4 text-amber-600">
              <span className="material-symbols-outlined text-3xl">warning</span>
              <h3 className="text-xl font-bold dark:text-white">{confirmModal.title}</h3>
            </div>
            <p className="text-slate-600 dark:text-slate-300 mb-8 leading-relaxed">
              {confirmModal.message}
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-sm transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={confirmModal.onConfirm}
                className="px-6 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-sm shadow-sm transition-all active:transform active:scale-95"
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
