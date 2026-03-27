"use client";

import React, { useState, useRef, useEffect } from "react";
import { X, UploadCloud } from "lucide-react";
import { uploadAdminAttachments } from "@/src/app/modules/upload.service";
import { useAdminStore } from "@/src/store/adminStore";
import { useNotificationStore } from "@/src/store/notificationStore";

interface AdminMediaPickerProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (images: string[]) => void;
}

interface AdminImage {
    id?: string;
    url: string;
}

export function AdminMediaPicker({ isOpen, onClose, onSelect }: AdminMediaPickerProps) {
    const [selectedImages, setSelectedImages] = useState<string[]>([]);
    const [uploadedImages, setUploadedImages] = useState<AdminImage[]>([]);
    const [fileMap, setFileMap] = useState<Record<string, File>>({});
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [confirmModal, setConfirmModal] = useState<{
        open: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
    } | null>(null);

    const adminAccessToken = useAdminStore((state) => state.accessToken);
    const addToast = useNotificationStore((state) => state.addToast);

    const fetchAdminImages = React.useCallback(async () => {
        if (!adminAccessToken) return;

        setIsLoading(true);
        try {
            const res = await fetch(`/api/admin/attachments?limit=100`, {
                headers: {
                    'Authorization': `Bearer ${adminAccessToken}`
                }
            });
            const json = await res.json();
            if (json.success && json.data) {
                const fetched: AdminImage[] = json.data
                    .map((item: Record<string, unknown>) => ({
                        id: item.id as string,
                        url: item.secure_url as string
                    }))
                    .filter((img: AdminImage) => img.url);
                setUploadedImages(fetched);
            }
        } catch (err) {
            console.error("Error fetching admin images:", err);
        } finally {
            setIsLoading(false);
        }
    }, [adminAccessToken]);

    useEffect(() => {
        if (!isOpen) return;
        setSelectedImages([]);
        setFileMap({});
        setError(null);
        fetchAdminImages();
    }, [isOpen, fetchAdminImages]);

    if (!isOpen) return null;

    const toggleImageSelection = (imageUrl: string) => {
        setSelectedImages((prev) =>
            prev.includes(imageUrl)
                ? prev.filter((url) => url !== imageUrl)
                : [...prev, imageUrl]
        );
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files) {
            handleFiles(Array.from(files));
        }
    };

    const handleFiles = (files: File[]) => {
        if (files.length === 0) return;

        const newImageUrls = files.map((file) => URL.createObjectURL(file));
        const newFileMap = { ...fileMap };
        files.forEach((file: File, index: number) => {
            newFileMap[newImageUrls[index]] = file;
        });
        setFileMap(newFileMap);
        const newImages: AdminImage[] = newImageUrls.map(url => ({ url }));
        setUploadedImages((prev) => [...newImages, ...prev]);
        setSelectedImages((prev) => [...prev, ...newImageUrls]);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files) {
            handleFiles(Array.from(e.dataTransfer.files));
        }
    };

    const handleDeleteImage = (e: React.MouseEvent, imgId: string | undefined, imgUrl: string) => {
        e.preventDefault();
        e.stopPropagation();
        
        setConfirmModal({
            open: true,
            title: 'Xóa hình ảnh',
            message: 'Bạn có chắc chắn muốn xóa hình ảnh này không? Hành động này không thể hoàn tác.',
            onConfirm: async () => {
                if (imgId) {
                    try {
                        const res = await fetch(`/api/attachments/${imgId}`, {
                            method: 'DELETE',
                            headers: {
                                'Authorization': `Bearer ${adminAccessToken}`
                            }
                        });
                        const json = await res.json();
                        if (!json.success) {
                            addToast(json.error || "Xóa ảnh thất bại", "error");
                            return;
                        }
                        addToast("Xóa ảnh thành công", "success");
                    } catch (err) {
                        console.error("Lỗi xóa ảnh:", err);
                        addToast("Lỗi khi xóa ảnh", "error");
                        return;
                    }
                } else {
                    const newFileMap = { ...fileMap };
                    delete newFileMap[imgUrl];
                    setFileMap(newFileMap);
                    URL.revokeObjectURL(imgUrl);
                }
                setUploadedImages(prev => prev.filter(img => img.url !== imgUrl));
                setSelectedImages(prev => prev.filter(url => url !== imgUrl));
            }
        });
    };

    const handleConfirm = async () => {
        if (selectedImages.length === 0) return;

        setIsUploading(true);
        setError(null);

        try {
            const finalUrls: string[] = [];

            for (const imageUrl of selectedImages) {
                if (fileMap[imageUrl]) {
                    const file = fileMap[imageUrl];
                    const uploadData = await uploadAdminAttachments(file);

                    if (uploadData && uploadData.secure_url) {
                        finalUrls.push(uploadData.secure_url);
                    } else {
                        throw new Error("Lỗi tải ảnh lên");
                    }
                } else {
                    finalUrls.push(imageUrl);
                }
            }

            onSelect(finalUrls);

            Object.keys(fileMap).forEach((url) => {
                URL.revokeObjectURL(url);
            });

            setSelectedImages([]);
            setFileMap({});

            await fetchAdminImages();

            onClose();
        } catch (err) {
            console.error("Upload error:", err);
            setError("Có lỗi xảy ra khi tải ảnh lên. Vui lòng thử lại.");
            setTimeout(() => setError(null), 3000);
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 overflow-y-auto">
            <div className="bg-white rounded shadow-xl w-full max-w-3xl mx-4 relative flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between p-5 border-b border-slate-100">
                    <h2 className="text-[22px] text-slate-700">Thư viện ảnh (Admin)</h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto flex-1">
                    <div
                        className={`border-2 border-dashed rounded bg-slate-50/50 p-12 flex flex-col items-center justify-center cursor-pointer transition-colors ${isDragging
                            ? "border-blue-500 bg-blue-50"
                            : "border-slate-200 hover:bg-slate-50"
                            }`}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <input
                            type="file"
                            multiple
                            accept="image/*"
                            className="hidden"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                        />
                        <div className="text-slate-500 mb-3">
                            <UploadCloud className="w-12 h-12 fill-slate-500 text-white" />
                        </div>
                        <p className="text-slate-500 text-[15px]">
                            Kéo và thả tập tin ở đây hoặc nhấp chuột để tải tập tin lên
                        </p>
                    </div>

                    <div>
                        <h3 className="mt-6 text-xl text-slate-400 mb-4">Ảnh đã tải lên</h3>
                        {isLoading ? (
                            <div className="flex items-center justify-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                            </div>
                        ) : uploadedImages.length === 0 ? (
                            <p className="text-slate-400 text-sm">Chưa có ảnh nào. Hãy tải lên!</p>
                        ) : (
                            <div className="grid grid-cols-4 md:grid-cols-6 gap-4">
                                {uploadedImages.map((img, index) => {
                                    const isSelected = selectedImages.includes(img.url);
                                    return (
                                        <div
                                            key={index}
                                            className={`relative aspect-square cursor-pointer rounded-sm overflow-hidden box-border border-2 transition-all ${isSelected ? "border-blue-500" : "border-transparent"
                                                }`}
                                            onClick={() => toggleImageSelection(img.url)}
                                        >
                                            <img
                                                src={img.url}
                                                alt={`Img ${index}`}
                                                className="w-full h-full object-cover"
                                            />
                                            <button
                                                type="button"
                                                onClick={(e) => handleDeleteImage(e, img.id, img.url)}
                                                className="absolute top-1.5 left-1.5 bg-red-500 hover:bg-red-600 text-white p-1 rounded-full shadow-md transition-colors z-10"
                                                title="Xóa hình ảnh"
                                            >
                                                <X className="w-3.5 h-3.5" />
                                            </button>
                                            {isSelected && (
                                                <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
                                                    <div className="bg-blue-500 text-white rounded-full p-1 border-2 border-white shadow-sm">
                                                        <svg
                                                            xmlns="http://www.w3.org/2000/svg"
                                                            className="h-3 w-3"
                                                            fill="none"
                                                            viewBox="0 0 24 24"
                                                            stroke="currentColor"
                                                            strokeWidth={3}
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                d="M5 13l4 4L19 7"
                                                            />
                                                        </svg>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-4 flex items-center justify-end gap-3 bg-white">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isUploading}
                        className="px-6 py-[6px] border border-slate-200 rounded text-slate-600 hover:bg-slate-50 transition-colors text-[15px] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Hủy
                    </button>
                    {selectedImages.length > 0 && (
                        <button
                            type="button"
                            onClick={handleConfirm}
                            disabled={isUploading}
                            className="px-6 py-[6px] bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-[15px] flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isUploading ? (
                                <>
                                    <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                    Đang tải lên...
                                </>
                            ) : (
                                `Áp dụng (${selectedImages.length})`
                            )}
                        </button>
                    )}
                </div>
            </div>

            {error && (
                <div className="fixed bottom-4 right-4 bg-red-500 text-white px-4 py-3 rounded shadow-lg z-[110] transition-opacity duration-300 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <span>{error}</span>
                    <button type="button" onClick={() => setError(null)} className="ml-2 hover:bg-red-600 p-1 rounded-full transition-colors">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Confirmation Modal */}
            {confirmModal?.open && (
                <div className="fixed inset-0 z-[110] flex items-start justify-center pt-20">
                    <div className="fixed inset-0 bg-black/50" onClick={() => setConfirmModal(null)}></div>
                    <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6 border border-red-500">
                        <div className="flex items-center gap-3 mb-4">
                            <span className="material-symbols-outlined text-red-500 text-2xl">warning</span>
                            <h3 className="text-lg font-semibold text-slate-900">{confirmModal.title}</h3>
                        </div>
                        <p className="text-slate-600 mb-6">{confirmModal.message}</p>
                        <div className="flex gap-3 justify-end">
                            <button
                                type="button"
                                onClick={() => setConfirmModal(null)}
                                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-md font-medium transition-colors"
                            >
                                Thoát
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    confirmModal.onConfirm();
                                    setConfirmModal(null);
                                }}
                                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-md font-medium transition-colors"
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
