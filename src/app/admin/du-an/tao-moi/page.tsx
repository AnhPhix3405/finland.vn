'use client';
import Link from "next/link";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { uploadProjectFile } from "@/src/app/modules/upload.service";
import { createProject } from "@/src/app/modules/projects.service";
import { getPropertyTypes, PropertyType } from "@/src/app/modules/property.service";
import LocationSelector from "@/src/components/feature/LocationSelector";
import RichTextEditor from "@/src/components/ui/RichTextEditor";


const slugify = (text: string) => {
    return text
        .toString()
        .toLowerCase()
        .normalize('NFD') // Tách dấu
        .replace(/[\u0300-\u036f]/g, '') // Xóa dấu
        .replace(/[đĐ]/g, 'd')
        .replace(/([^0-9a-z-\s])/g, '') // Xóa ký tự đặc biệt
        .replace(/\s+/g, '-') // Thay khoảng trắng bằng -
        .replace(/-+/g, '-') // Xóa - liên tiếp
        .replace(/^-+|-+$/g, ''); // Xóa - ở đầu/cuối
};

export default function AdminCreateProject() {
    const router = useRouter();

    const [projectName, setProjectName] = useState<string>('');
    const [projectSlug, setProjectSlug] = useState<string>('');
    const [description, setDescription] = useState<string>('');
    const [projectAreaMin, setProjectAreaMin] = useState<string>('');
    const [projectAreaMax, setProjectAreaMax] = useState<string>('');
    const [projectPrice, setProjectPrice] = useState<string>('');
    const [selectedPropertyTypeId, setSelectedPropertyTypeId] = useState<string>('');
    const [propertyTypes, setPropertyTypes] = useState<PropertyType[]>([]);
    const [loadingPropertyTypes, setLoadingPropertyTypes] = useState(false);

    const [selectedProvince, setSelectedProvince] = useState<string>('');
    const [selectedDistrict, setSelectedDistrict] = useState<string>('');

    const [newFiles, setNewFiles] = useState<File[]>([]);

    const [isUploading, setIsUploading] = useState(false);
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

    // Sync slug with name during creation
    useEffect(() => {
        setProjectSlug(slugify(projectName));
    }, [projectName]);



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

    const handleSave = async () => {
        if (!projectName || !projectSlug) {
            setToast({ message: 'Tên dự án và Slug là bắt buộc!', type: 'error' });
            return;
        }

        setIsUploading(true);
        try {
            // 1. Tạo Project trước để lấy ID
            const createRes = await createProject({
                name: projectName,
                slug: projectSlug,
                province: selectedProvince,
                ward: selectedDistrict,
                area_min: projectAreaMin ? Number(projectAreaMin) : undefined,
                area_max: projectAreaMax ? Number(projectAreaMax) : undefined,
                price: projectPrice ? Number(projectPrice.replace(/,/g, '')) : 0,
                property_type_id: selectedPropertyTypeId || undefined,
                content: description,
            });

            if (!createRes.success) {
                throw new Error(createRes.error || 'Tạo dự án trên database thất bại');
            }

            const newId = createRes.data.id;

            // 2. Upload ảnh nếu có
            if (newFiles.length > 0 && newId) {
                await Promise.all(
                    newFiles.map((file) => uploadProjectFile(file, newId))
                );
            }

            setToast({ message: 'Tạo dự án thành công!', type: 'success' });

            // Chờ một chút để user thấy toast rồi redirect
            setTimeout(() => {
                router.push('/admin/du-an');
            }, 1500);

        } catch (error: any) {
            console.error('Lỗi khi tạo dự án:', error);
            setToast({ message: error.message || 'Có lỗi xảy ra khi tạo dự án!', type: 'error' });
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="p-6">
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Thêm dự án mới</h2>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-sm border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                    <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="col-span-1 md:col-span-2">
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1" htmlFor="projectName">Tên dự án <span className="text-red-500">*</span></label>
                                <input value={projectName} onChange={(e) => setProjectName(e.target.value)} className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-sm text-sm focus:ring-primary focus:border-primary dark:text-white placeholder-slate-400" id="projectName" placeholder="Nhập tên dự án..." type="text" />
                            </div>

                            <div className="col-span-1 md:col-span-2">
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1" htmlFor="projectSlug">Slug (đường dẫn) <span className="text-red-500">*</span></label>
                                <input value={projectSlug} onChange={(e) => setProjectSlug(e.target.value)} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-sm text-sm focus:ring-primary focus:border-primary dark:text-white placeholder-slate-400" id="projectSlug" placeholder="du-an-abc" type="text" />
                                <p className="text-[10px] text-slate-500 mt-1 italic leading-tight">Tự động sinh từ tên dự án, bạn có thể sửa lại nếu muốn.</p>
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

                            <div className="col-span-1">
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1" htmlFor="projectPrice">Giá (VND)</label>
                                <input value={projectPrice} onChange={formatCurrencyOnChange} className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-sm text-sm focus:ring-primary focus:border-primary dark:text-white placeholder-slate-400" id="projectPrice" placeholder="Ví dụ: 2,500,000,000" type="text" />
                            </div>

                            <div className="col-span-1">
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1" htmlFor="projectArea">Diện tích (m2)</label>
                                <div className="flex flex-row gap-1">
                                    <input value={projectAreaMin} onChange={(e) => setProjectAreaMin(e.target.value)} className="inline-block min-w-10 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-sm text-sm focus:ring-primary focus:border-primary dark:text-white placeholder-slate-400" id="projectAreaMin" placeholder="Từ" type="number" />
                                    <input value={projectAreaMax} onChange={(e) => setProjectAreaMax(e.target.value)} className="inline-block min-w-10 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-sm text-sm focus:ring-primary focus:border-primary dark:text-white placeholder-slate-400" id="projectAreaMax" placeholder="Đến" type="number" />
                                </div>
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
