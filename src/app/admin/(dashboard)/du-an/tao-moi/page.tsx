'use client';
import Link from "next/link";
import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { uploadProjectFile } from "@/src/app/modules/upload.service";
import { createAdminProject } from "@/src/app/modules/admin.projects.service";
import { getPropertyTypes, PropertyType } from "@/src/app/modules/property.service";
import { useAdminStore } from "@/src/store/adminStore";
import { useNotificationStore } from "@/src/store/notificationStore";
import { useAdminAuth } from "@/src/hooks/useAdminAuth";
import LocationSelector from "@/src/components/feature/LocationSelector";
import MapPicker from "@/src/components/feature/MapPicker";
import RichTextEditor from "@/src/components/ui/RichTextEditor";

export default function AdminCreateProject() {
    const router = useRouter();
    const formRef = useRef<HTMLFormElement>(null);
    const addToast = useNotificationStore((state) => state.addToast);
    
    useAdminAuth(() => {
        router.push('/admin/login');
    });

    const [projectName, setProjectName] = useState<string>('');
    const [description, setDescription] = useState<string>('');
    const [projectArea, setProjectArea] = useState<string>('');
    const [projectPrice, setProjectPrice] = useState<string>('');
    const [selectedPropertyTypeId, setSelectedPropertyTypeId] = useState<string>('');
    const [propertyTypes, setPropertyTypes] = useState<PropertyType[]>([]);
    const [loadingPropertyTypes, setLoadingPropertyTypes] = useState(false);
    const [projectStatus, setProjectStatus] = useState<string>('');

    const [selectedProvince, setSelectedProvince] = useState<string>('');
    const [selectedDistrict, setSelectedDistrict] = useState<string>('');

    const [latitude, setLatitude] = useState<number | null>(null);
    const [longitude, setLongitude] = useState<number | null>(null);

    const PROJECT_STATUS_OPTIONS = [
        { value: 'sắp mở bán', label: 'Sắp mở bán' },
        { value: 'đang mở bán', label: 'Đang mở bán' },
        { value: 'hàng thứ cấp', label: 'Hàng thứ cấp' },
    ];

    const [newFiles, setNewFiles] = useState<File[]>([]);

    const [isUploading, setIsUploading] = useState(false);

    const [errors, setErrors] = useState<Record<string, string>>({});

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

    // Automatic geocoding effect
    useEffect(() => {
        const query = [selectedDistrict, selectedProvince].filter(Boolean).join(', ');
        if (!query || query.length < 5) return;

        const delayDebounceFn = setTimeout(async () => {
            try {
                const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || '';
                const res = await fetch(
                    `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${token}&country=vn&limit=1`
                );
                const data = await res.json();
                if (data.features && data.features.length > 0) {
                    const [targetLng, targetLat] = data.features[0].center;
                    setLatitude(targetLat);
                    setLongitude(targetLng);
                }
            } catch (err) {
                console.error('Geocoding error:', err);
            }
        }, 1000);

        return () => clearTimeout(delayDebounceFn);
    }, [selectedDistrict, selectedProvince]);

    const formatCurrencyOnChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/\D/g, '');
        if (!value) {
            setProjectPrice('');
            return;
        }
        setProjectPrice(Number(value).toLocaleString('en-US'));
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

    const validateForm = (): string | null => {
        const newErrors: Record<string, string> = {};

        if (!projectName.trim()) {
            newErrors.projectName = "Tên dự án là bắt buộc";
        } else if (projectName.trim().length < 2) {
            newErrors.projectName = "Tên dự án phải có ít nhất 2 ký tự";
        } else if (projectName.trim().length > 200) {
            newErrors.projectName = "Tên dự án không được quá 200 ký tự";
        }

        if (!selectedPropertyTypeId) {
            newErrors.propertyType = "Loại hình bất động sản là bắt buộc";
        }

        if (!selectedProvince) {
            newErrors.province = "Tỉnh/Thành phố là bắt buộc";
        }

        if (!projectArea) {
            newErrors.projectArea = "Diện tích là bắt buộc";
        } else {
            const areaNum = parseFloat(projectArea);
            if (isNaN(areaNum) || areaNum <= 0) {
                newErrors.projectArea = "Diện tích phải là số dương";
            } else if (areaNum > 1000000) {
                newErrors.projectArea = "Diện tích không hợp lệ (tối đa 1,000,000 m²)";
            }
        }

        if (!projectPrice) {
            newErrors.projectPrice = "Giá là bắt buộc";
        } else {
            const priceNum = parseFloat(projectPrice.replace(/,/g, ''));
            if (isNaN(priceNum) || priceNum < 0) {
                newErrors.projectPrice = "Giá không hợp lệ";
            } else if (priceNum > 100000000000000) {
                newErrors.projectPrice = "Giá không hợp lệ (quá lớn)";
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length > 0 ? Object.keys(newErrors)[0] : null;
    };

    const scrollToError = (firstErrorKey: string | null) => {
        if (!firstErrorKey) return;

        const idMap: Record<string, string> = {
            projectName: 'projectName',
            propertyType: 'propertyType',
            province: 'projectCity',
            ward: 'projectDistrict',
            projectArea: 'projectArea',
            projectPrice: 'projectPrice',
        };

        const elementId = idMap[firstErrorKey];
        const element = document.getElementById(elementId);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            setTimeout(() => {
                (element as HTMLInputElement).focus();
            }, 300);
        }
    };

    const handleSave = async () => {
        const firstErrorKey = validateForm();
        if (firstErrorKey) {
            scrollToError(firstErrorKey);
            return;
        }

        setIsUploading(true);
        try {
            const createRes = await createAdminProject({
                name: projectName,
                province: selectedProvince,
                ward: selectedDistrict || undefined,
                area: projectArea ? Number(projectArea) : undefined,
                price: projectPrice ? Number(projectPrice.replace(/,/g, '')) : undefined,
                property_type_id: selectedPropertyTypeId || undefined,
                content: description,
                status: projectStatus || undefined,
                latitude: latitude || undefined,
                longitude: longitude || undefined,
            });

            if (createRes.statusCode === 401) {
                useAdminStore.getState().clearAuth();
                addToast('Phiên đăng nhập hết hạn, vui lòng đăng nhập lại', 'error');
                router.push('/admin/login');
                return;
            }

            if (!createRes.success) {
                const errorMsg = createRes.error || 'Tạo dự án thất bại';
                addToast(errorMsg, 'error');
                
                // Scroll to first required field on validation error
                if (errorMsg.includes('bắt buộc') || errorMsg.includes('Tên dự án')) {
                    const element = document.getElementById('projectName');
                    if (element) {
                        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        setTimeout(() => (element as HTMLInputElement).focus(), 300);
                    }
                }
                return;
            }

            const newId = createRes.data?.id;

            if (newFiles.length > 0 && newId) {
                await Promise.all(
                    newFiles.map((file) => uploadProjectFile(file, newId))
                );
            }

            addToast('Tạo dự án thành công!', 'success');

            setTimeout(() => {
                router.push('/admin/du-an');
            }, 1500);

        } catch (error: unknown) {
            console.error('Lỗi khi tạo dự án:', error);
            const errorMessage = error instanceof Error ? error.message : 'Có lỗi xảy ra khi tạo dự án!';
            addToast(errorMessage, 'error');
        } finally {
            setIsUploading(false);
        }
    };

    const clearError = (field: string) => {
        setErrors(prev => ({ ...prev, [field]: '' }));
    };

    return (
        <div className="p-6">
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Thêm dự án mới</h2>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-sm border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                    <form className="space-y-6" onSubmit={(e) => e.preventDefault()} ref={formRef}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="col-span-1 md:col-span-2">
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1" htmlFor="projectName">Tên dự án <span className="text-red-500">*</span></label>
                                <input 
                                    value={projectName} 
                                    onChange={(e) => { setProjectName(e.target.value); clearError('projectName'); }} 
                                    className={`w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-sm text-sm focus:ring-primary focus:border-primary dark:text-white placeholder-slate-400 ${errors.projectName ? 'border-red-500 ring-2 ring-red-500' : ''}`} 
                                    id="projectName" 
                                    placeholder="Nhập tên dự án..." 
                                    type="text" 
                                />
                                {errors.projectName && <p className="text-red-500 text-xs mt-1">{errors.projectName}</p>}
                            </div>

                            <div className="col-span-1">
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1" htmlFor="propertyType">Loại hình <span className="text-red-500">*</span></label>
                                <select 
                                    value={selectedPropertyTypeId} 
                                    onChange={(e) => { setSelectedPropertyTypeId(e.target.value); clearError('propertyType'); }} 
                                    className={`w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-sm text-sm focus:ring-primary focus:border-primary dark:text-white text-slate-700 ${errors.propertyType ? 'border-red-500 ring-2 ring-red-500' : ''}`}
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
                                {errors.propertyType && <p className="text-red-500 text-xs mt-1">{errors.propertyType}</p>}
                            </div>

                            <div className="col-span-1">
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1" htmlFor="projectStatus">Trạng thái</label>
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

                            <div className="col-span-1">
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1" htmlFor="projectPrice">Giá (VND) <span className="text-red-500">*</span></label>
                                <input 
                                    value={projectPrice} 
                                    onChange={(e) => { formatCurrencyOnChange(e); clearError('projectPrice'); }} 
                                    className={`w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-sm text-sm focus:ring-primary focus:border-primary dark:text-white placeholder-slate-400 ${errors.projectPrice ? 'border-red-500 ring-2 ring-red-500' : ''}`} 
                                    id="projectPrice" 
                                    placeholder="Ví dụ: 2,500,000,000" 
                                    type="text" 
                                />
                                {errors.projectPrice && <p className="text-red-500 text-xs mt-1">{errors.projectPrice}</p>}
                            </div>

                            <div className="col-span-1">
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1" htmlFor="projectArea">Diện tích (m²) <span className="text-red-500">*</span></label>
                                <input 
                                    value={projectArea} 
                                    onChange={(e) => { setProjectArea(e.target.value); clearError('projectArea'); }} 
                                    className={`w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-sm text-sm focus:ring-primary focus:border-primary dark:text-white placeholder-slate-400 ${errors.projectArea ? 'border-red-500 ring-2 ring-red-500' : ''}`} 
                                    id="projectArea" 
                                    placeholder="Ví dụ: 500" 
                                    type="number" 
                                />
                                {errors.projectArea && <p className="text-red-500 text-xs mt-1">{errors.projectArea}</p>}
                            </div>

                            <div className="col-span-1 md:col-span-2">
                                <LocationSelector
                                    selectedProvince={selectedProvince}
                                    onProvinceChange={(val) => { setSelectedProvince(val); clearError('province'); }}
                                    selectedWard={selectedDistrict}
                                    onWardChange={setSelectedDistrict}
                                    requiredProvince={true}
                                />
                                {errors.province && <p className="text-red-500 text-xs mt-1">{errors.province}</p>}
                            </div>

                            <div className="col-span-1 md:col-span-2">
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Vị trí trên bản đồ</label>
                                <MapPicker
                                    initialLat={latitude || undefined}
                                    initialLng={longitude || undefined}
                                    onLocationChange={(lat, lng) => {
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
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Hình ảnh tải lên</label>

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
                                            <span className="font-medium text-primary bg-transparent text-emerald-600">Chọn ảnh dự án</span>
                                            <p className="pl-1">hoặc kéo thả</p>
                                        </div>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">PNG, JPG, GIF tối đa 3MB</p>
                                    </div>
                                </div>

                                {newFiles.length > 0 && (
                                    <div className="mt-4">
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            {newFiles.map((file, idx) => {
                                                const previewUrl = URL.createObjectURL(file);
                                                return (
                                                    <div key={idx} className="relative group rounded-sm overflow-hidden border border-slate-200 dark:border-slate-700">
                                                        <img src={previewUrl} alt={file.name} className="w-full h-32 object-cover" onLoad={() => URL.revokeObjectURL(previewUrl)} />
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRemoveNewFile(idx)}
                                                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 flex items-center justify-center w-6 h-6"
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
                                {isUploading ? 'Đang tạo...' : 'Tạo dự án mới'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
