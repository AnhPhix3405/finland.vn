"use client";

import React, { useState, useRef, useEffect } from "react";
import { X, UploadCloud, ImageIcon } from "lucide-react";
import { uploadBrokerAttachments } from "@/src/app/modules/upload.service";
import { useAuthStore } from "@/src/store/authStore";
import { useUserStore } from "@/src/store/userStore";

interface UserMediaPickerProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (images: string[]) => void;
}

interface BrokerImage {
    url: string;
    createdAt: Date | null;
}

export function UserMediaPicker({ isOpen, onClose, onSelect }: UserMediaPickerProps) {
    const [selectedImages, setSelectedImages] = useState<string[]>([]);
    const [userImages, setUserImages] = useState<BrokerImage[]>([]);
    const [fileMap, setFileMap] = useState<Record<string, File>>({});
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const accessToken = useAuthStore((state) => state.accessToken);
    const { user } = useUserStore();

    const fetchUserImages = React.useCallback(async () => {
        if (!accessToken || !user?.id) return;

        setIsLoading(true);
        try {
            // Get attachments where target_type='broker' and target_id = current broker's ID
            const attachmentsRes = await fetch(`/api/attachments?target_type=broker&target_id=${user.id}&limit=100`, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            });
            const attachmentsJson = await attachmentsRes.json();

            if (attachmentsJson.success && attachmentsJson.data) {
                const mappedImages: BrokerImage[] = attachmentsJson.data.map((att: Record<string, unknown>) => ({
                    url: att.secure_url as string,
                    createdAt: att.created_at as Date | null
                }));
                setUserImages(mappedImages);
            } else {
                setUserImages([]);
            }
        } catch (err) {
            console.error("Error fetching user images:", err);
            setUserImages([]);
        } finally {
            setIsLoading(false);
        }
    }, [accessToken, user?.id]);

    useEffect(() => {
        if (!isOpen) return;
        setSelectedImages([]);
        setFileMap({});
        setError(null);
        fetchUserImages();
    }, [isOpen, fetchUserImages]);

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
        const newImageUrls = files.map((file) => URL.createObjectURL(file));
        const newFileMap = { ...fileMap };
        const newBrokerImages: BrokerImage[] = [];
        
        files.forEach((file, index) => {
            const url = newImageUrls[index];
            newFileMap[url] = file;
            newBrokerImages.push({ url, createdAt: new Date() });
        });
        
        setFileMap(newFileMap);
        setUserImages((prev) => [...newBrokerImages, ...prev]);
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

    const handleConfirm = async () => {
        if (selectedImages.length === 0) return;

        setIsUploading(true);
        setError(null);

        try {
            const finalUrls: string[] = [];

            for (const imageUrl of selectedImages) {
                if (fileMap[imageUrl]) {
                    const file = fileMap[imageUrl];
                    const uploadData = await uploadBrokerAttachments(file);

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

            await fetchUserImages();

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
                    <h2 className="text-[22px] text-slate-700">Ảnh từ tin đăng của bạn</h2>
                    <button
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
                            Tải ảnh mới từ máy tính
                        </p>
                    </div>

                    {selectedImages.length > 0 && (
                        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                            <p className="text-sm text-blue-700 font-medium">
                                Đã chọn {selectedImages.length} ảnh mới chưa tải lên
                            </p>
                        </div>
                    )}

                    <div>
                        <h3 className="mt-6 text-xl text-slate-400 mb-4 flex items-center gap-2">
                            <ImageIcon className="w-5 h-5" />
                            Ảnh từ tin đăng của bạn
                        </h3>
                        {isLoading ? (
                            <div className="flex items-center justify-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
                            </div>
                        ) : userImages.length === 0 ? (
                            <p className="text-slate-400 text-sm">Bạn chưa có ảnh nào. Hãy tải ảnh mới lên!</p>
                        ) : (
                            <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                                {userImages.map((img, index) => {
                                    const isSelected = selectedImages.includes(img.url);
                                    return (
                                        <div
                                            key={`broker-img-${index}`}
                                            className={`relative aspect-square cursor-pointer rounded-sm overflow-hidden box-border border-2 transition-all ${isSelected ? "border-blue-500" : "border-transparent"
                                                }`}
                                            onClick={() => toggleImageSelection(img.url)}
                                        >
                                            <img
                                                src={img.url}
                                                alt={`Ảnh ${index + 1}`}
                                                className="w-full h-full object-cover"
                                            />
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
                        onClick={onClose}
                        disabled={isUploading}
                        className="px-6 py-[6px] border border-slate-200 rounded text-slate-600 hover:bg-slate-50 transition-colors text-[15px] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Hủy
                    </button>
                    {selectedImages.length > 0 && (
                        <button
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
                    <button onClick={() => setError(null)} className="ml-2 hover:bg-red-600 p-1 rounded-full transition-colors">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}
        </div>
    );
}
