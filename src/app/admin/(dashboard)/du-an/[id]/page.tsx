'use client';
import Link from "next/link";
import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { uploadProjectFile, deleteAttachment } from "@/src/app/modules/upload.service";
import { getProjects, updateProject } from "@/src/app/modules/projects.service";
import { getPropertyTypes, PropertyType } from "@/src/app/modules/property.service";
import { useProjectContext } from "@/src/context/ProjectContext";
import RichTextEditor from "@/src/components/ui/RichTextEditor";
import LocationSelector from "@/src/components/feature/LocationSelector";

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

export default function AdminProjectDetail() {
  const params = useParams();
  const slug = params?.id as string;
  const router = useRouter();
  const { activeProjectId } = useProjectContext();

  const [deletedImages, setDeletedImages] = useState<string[]>([]);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [description, setDescription] = useState<string>('');

  const [projectName, setProjectName] = useState<string>('');
  const [projectCode, setProjectCode] = useState<string>('');
  const [projectArea, setProjectArea] = useState<string>('');
  const [projectPrice, setProjectPrice] = useState<string>('');
  const [selectedPropertyTypeId, setSelectedPropertyTypeId] = useState<string>('');
  const [propertyTypes, setPropertyTypes] = useState<PropertyType[]>([]);
  const [loadingPropertyTypes, setLoadingPropertyTypes] = useState(false);

  const [selectedProvince, setSelectedProvince] = useState<string>('');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('');

  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
  
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

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(t);
    }
  }, [toast]);



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
        const res = await getProjects({ slug });
        if (res.success && res.data.length > 0) {
          const p = res.data[0];
          if (p.id) setProjectId(p.id);
          setProjectName(p.name || '');
          setProjectCode(p.project_code || '');
          setProjectArea(p.area?.toString() || '');
          setProjectPrice(p.price ? Number(p.price).toLocaleString('en-US') : '');
          setSelectedPropertyTypeId(p.property_type_id || '');
          setSelectedProvince(p.province || '');
          setSelectedDistrict(p.ward || '');
          setDescription(p.content || '');
        }
      } catch (err) {
        console.error('Lỗi lấy thông tin project:', err);
      }
    };
    fetchProjectDetails();
  }, [slug]);

  const formatCurrencyOnChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Chỉ giữ lại số
    const value = e.target.value.replace(/\D/g, '');
    if (!value) {
      setProjectPrice('');
      return;
    }
    setProjectPrice(Number(value).toLocaleString('en-US'));
  };

  useEffect(() => {
    if (!activeProjectId) return;
    const fetchImages = async () => {
      setLoadingImages(true);
      try {
        const res = await fetch(`/api/attachments/${activeProjectId}?target_type=project`);
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
  }, [activeProjectId]);

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
    setDeletedApiImages(prev => [...prev, id]);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setNewFiles(prev => [...prev, ...filesArray]);
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
      setToast({ message: 'Không tìm thấy project ID!', type: 'error' });
      return;
    }

    // Validate required fields
    if (!projectName.trim()) {
      setToast({ message: 'Tên dự án là bắt buộc', type: 'error' });
      scrollToError('projectName');
      return;
    }

    if (!selectedPropertyTypeId) {
      setToast({ message: 'Loại hình bất động sản là bắt buộc', type: 'error' });
      scrollToError('propertyType');
      return;
    }

    if (!selectedProvince) {
      setToast({ message: 'Tỉnh/Thành phố là bắt buộc', type: 'error' });
      scrollToError('projectCity');
      return;
    }

    if (!projectArea) {
      setToast({ message: 'Diện tích là bắt buộc', type: 'error' });
      scrollToError('projectArea');
      return;
    }

    if (!projectPrice) {
      setToast({ message: 'Giá là bắt buộc', type: 'error' });
      scrollToError('projectPrice');
      return;
    }

    setIsUploading(true);
    try {
      const updateRes = await updateProject({
        id: projectId,
        name: projectName,
        province: selectedProvince,
        ward: selectedDistrict,
        area: Number(projectArea),
        price: Number(projectPrice.replace(/,/g, '')),
        property_type_id: selectedPropertyTypeId || undefined,
        content: description,
      });

      if (!updateRes.success) {
        throw new Error(updateRes.error || 'Cập nhật database thất bại');
      }

      // Upload tất cả file mới song song
      if (newFiles.length > 0) {
        const results = await Promise.all(
          newFiles.map((file) => uploadProjectFile(file, projectId))
        );
        console.log('Upload results:', results);

        // Update thumbnail_url with first image
        if (results.length > 0 && results[0]?.secure_url) {
          await updateProject({
            id: projectId,
            thumbnail_url: results[0].secure_url
          });
        }

        setNewFiles([]);
      }

      // Fire and forget: xóa các attachment API đã đánh dấu xóa
      if (deletedApiImages.length > 0) {
        deletedApiImages.forEach((public_id) => {
          deleteAttachment(public_id)
            .then((res) => console.log('Deleted:', public_id, res))
            .catch((err) => console.error('Delete failed:', public_id, err));
        });
        setDeletedApiImages([]);
      }

      // Update sort_order for reordered images
      if (originalImages.length > 0) {
        const changedImages = images.filter(img => {
          const original = originalImages.find(o => o.id === img.id);
          return !original || original.sort_order !== img.sort_order;
        });
        
        if (changedImages.length > 0) {
          await Promise.all(changedImages.map(img => 
            fetch(`/api/attachments/${img.id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ sort_order: img.sort_order || 0 })
            })
          ));
        }
      }

      setToast({ message: 'Lưu dự án thành công!', type: 'success' });
      
      // Redirect after showing toast
      setTimeout(() => {
        router.push('/admin/du-an');
      }, 1000);
    } catch (error: unknown) {
      console.error('Lỗi khi lưu dự án:', error);
      const errorMessage = error instanceof Error ? error.message : 'Có lỗi xảy ra khi lưu dự án!';
      setToast({ message: errorMessage, type: 'error' });
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
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Mã dự án</label>
                <input value={projectCode} disabled className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-sm text-sm text-slate-500 dark:text-slate-400" placeholder="Mã tự sinh" type="text" />
              </div>
              <div className="col-span-1">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1" htmlFor="propertyType">Loại hình <span className="text-red-500">*</span></label>
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
                onProvinceChange={setSelectedProvince}
                selectedWard={selectedDistrict}
                onWardChange={setSelectedDistrict}
              />

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
                ) : images.filter(img => !deletedApiImages.includes(img.id)).length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    {images
                      .filter(img => !deletedApiImages.includes(img.id))
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
                    <p className="text-xs text-slate-500 dark:text-slate-400">PNG, JPG, GIF tối đa 10MB</p>
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

              <div className="col-span-1 md:col-span-2 flex items-center justify-between py-3 border-t border-slate-200 dark:border-slate-700 mt-2">
                <div>
                  <h3 className="text-sm font-medium text-slate-900 dark:text-white">Trạng thái hiển thị</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Hiển thị dự án này trên website công khai.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" value="" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 dark:peer-focus:ring-emerald-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-emerald-600"></div>
                </label>
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
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-4 right-4 px-4 py-3 rounded-md shadow-lg flex items-center gap-2 transform transition-transform duration-300 translate-y-0 text-sm font-medium z-50 ${toast.type === 'success'
          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200 dark:bg-emerald-900/50 dark:text-emerald-300 dark:border-emerald-800'
          : 'bg-red-100 text-red-800 border border-red-200 dark:bg-red-900/50 dark:text-red-300 dark:border-red-800'
          }`}>
          <span className="material-symbols-outlined text-[18px]">
            {toast.type === 'success' ? 'check_circle' : 'error'}
          </span>
          {toast.message}
        </div>
      )}
    </div>
  );
}
