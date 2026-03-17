'use client';
import Link from "next/link";
import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { uploadProjectFile } from "@/src/app/modules/upload.service";
import { createProject } from "@/src/app/modules/projects.service";
import { getPropertyTypes, PropertyType } from "@/src/app/modules/property.service";
import LocationSelector from "@/src/components/feature/LocationSelector";
import RichTextEditor from "@/src/components/ui/RichTextEditor";

export default function AdminCreateProject() {
    const router = useRouter();
    const formRef = useRef<HTMLFormElement>(null);

    const [projectName, setProjectName] = useState<string>('');
    const [description, setDescription] = useState<string>('');
    const [projectArea, setProjectArea] = useState<string>('');
    const [projectPrice, setProjectPrice] = useState<string>('');
    const [selectedPropertyTypeId, setSelectedPropertyTypeId] = useState<string>('');
    const [propertyTypes, setPropertyTypes] = useState<PropertyType[]>([]);
    const [loadingPropertyTypes, setLoadingPropertyTypes] = useState(false);

    const [selectedProvince, setSelectedProvince] = useState<string>('');
    const [selectedDistrict, setSelectedDistrict] = useState<string>('');

    const [newFiles, setNewFiles] = useState<File[]>([]);

    const [isUploading, setIsUploading] = useState(false);
    const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

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

    useEffect(() => {
        if (toast) {
            const t = setTimeout(() => setToast(null), 3000);
            return () => clearTimeout(t);
        }
    }, [toast]);

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
            setNewFiles(prev => [...prev, ...filesArray]);
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
            const createRes = await createProject({
                name: projectName,
                province: selectedProvince,
                ward: selectedDistrict || undefined,
                area: projectArea ? Number(projectArea) : undefined,
                price: projectPrice ? Number(projectPrice.replace(/,/g, '')) : undefined,
                property_type_id: selectedPropertyTypeId || undefined,
                content: description,
            });

            if (!createRes.success) {
                const errorMsg = createRes.error || 'Tạo dự án thất bại';
                
                if (errorMsg.toLowerCase().includes('thiếu') || errorMsg.toLowerCase().includes('bắt buộc') || errorMsg.toLowerCase().includes('required')) {
                    const fieldIds = ['projectName', 'propertyType', 'projectCity'];
                    for (const fieldId of fieldIds) {
                        const element = document.getElementById(fieldId);
                        if (element) {
                            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            setTimeout(() => {
                                (element as HTMLInputElement).focus();
                            }, 100);
                            break;
                        }
                    }
                }
                
                throw new Error(errorMsg);
            }

            const newId = createRes.data.id;

            if (newFiles.length > 0 && newId) {
                await Promise.all(
                    newFiles.map((file) => uploadProjectFile(file, newId))
                );
            }

            setToast({ message: 'Tạo dự án thành công!', type: 'success' });

            setTimeout(() => {
                router.push('/admin/du-an');
            }, 1500);

        } catch (error: unknown) {
            console.error('Lỗi khi tạo dự án:', error);
            const errorMessage = error instanceof Error ? error.message : 'Có lỗi xảy ra khi tạo dự án!';
            setToast({ message: errorMessage, type: 'error' });
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
                                />
                                {errors.province && <p className="text-red-500 text-xs mt-1">{errors.province}</p>}
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
                                        <p className="text-xs text-slate-500 dark:text-slate-400">PNG, JPG tối đa 10MB</p>
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
