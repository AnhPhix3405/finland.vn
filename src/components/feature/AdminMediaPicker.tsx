"use client";

import React, { useState, useRef, useEffect } from "react";
import { X, UploadCloud } from "lucide-react";
import { uploadAttachments } from "@/src/app/modules/upload.service";

interface AdminMediaPickerProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (images: string[]) => void;
}

export function AdminMediaPicker({ isOpen, onClose, onSelect }: AdminMediaPickerProps) {
    const [selectedImages, setSelectedImages] = useState<string[]>([]);
    const [uploadedImages, setUploadedImages] = useState<string[]>([]);
    const [fileMap, setFileMap] = useState<Record<string, File>>({});
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const fetchAdminImages = React.useCallback(async () => {
        try {
            const res = await fetch(`/api/attachments?target_type=admin&limit=100`);
            const json = await res.json();
            if (json.success && json.data) {
                const fetchedUrls = json.data
                    .map((item: Record<string, unknown>) => (item as Record<string, unknown>).secure_url)
                    .filter(Boolean) as string[];
                setUploadedImages(fetchedUrls);
            }
        } catch (err) {
            console.error("Error fetching admin images:", err);
        }
    }, []);

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
        const newImageUrls = files.map((file) => URL.createObjectURL(file));
        const newFileMap = { ...fileMap };
        files.forEach((file, index) => {
            newFileMap[newImageUrls[index]] = file;
        });
        setFileMap(newFileMap);
        setUploadedImages((prev) => [...newImageUrls, ...prev]);
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
                    const uploadData = await uploadAttachments(file);

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
                        {uploadedImages.length === 0 ? (
                            <p className="text-slate-400 text-sm">Chưa có ảnh nào. Hãy tải lên!</p>
                        ) : (
                            <div className="grid grid-cols-4 md:grid-cols-6 gap-4">
                                {uploadedImages.map((img, index) => {
                                    const isSelected = selectedImages.includes(img);
                                    return (
                                        <div
                                            key={index}
                                            className={`relative aspect-square cursor-pointer rounded-sm overflow-hidden box-border border-2 transition-all ${isSelected ? "border-blue-500" : "border-transparent"
                                                }`}
                                            onClick={() => toggleImageSelection(img)}
                                        >
                                            <img
                                                src={img}
                                                alt={`Img ${index}`}
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
