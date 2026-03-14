"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from "@/src/store/authStore";
import { uploadNewsThumbnail } from "@/src/app/modules/upload.service";
import RichTextEditor from '@/src/components/ui/RichTextEditor';

interface Tag {
  id: string;
  name: string;
  slug: string;
}

export default function AdminAddNewsPage() {
  const router = useRouter();
  const adminToken = useAuthStore((state) => state.accessToken);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');
  const [thumbnail_file, setThumbnailFile] = useState<File | null>(null);
  const [thumbnail_preview, setThumbnailPreview] = useState('');
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [showTagDropdown, setShowTagDropdown] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load available tags on mount
  React.useEffect(() => {
    const loadTags = async () => {
      try {
        const res = await fetch('/api/tags');
        const data = await res.json();
        if (data.success) {
          setAvailableTags(data.data || []);
        }
      } catch (err) {
        console.error('Error loading tags:', err);
      }
    };
    loadTags();
  }, []);

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setThumbnailFile(file);
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setThumbnailPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddTag = () => {
    if (!tagInput.trim()) return;
    
    setSelectedTags([...selectedTags, tagInput.trim()]);
    setTagInput('');
    setShowTagDropdown(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!adminToken) {
      setError('Cần đăng nhập admin để tạo tin tức');
      return;
    }

    if (!title || !content) {
      setError('Vui lòng điền tiêu đề và nội dung');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    
    try {
      let thumbnail_url = '';

      // Upload thumbnail if provided
      if (thumbnail_file) {
        setIsUploading(true);
        try {
          const uploadResult = await uploadNewsThumbnail(thumbnail_file);
          thumbnail_url = uploadResult.secure_url;
          console.log('Thumbnail uploaded:', thumbnail_url);
        } catch (uploadErr) {
          console.error('Error uploading thumbnail:', uploadErr);
          setError('Lỗi khi tải lên ảnh. Vui lòng thử lại.');
          setIsSubmitting(false);
          setIsUploading(false);
          return;
        } finally {
          setIsUploading(false);
        }
      }

      const res = await fetch('/api/admin/news', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          title,
          description: description || null,
          content,
          thumbnail_url: thumbnail_url || null,
          tags: selectedTags
        })
      });

      const result = await res.json();

      if (result.success) {
        router.push('/admin/tin-tuc');
      } else {
        setError(result.error || 'Lỗi khi tạo bài viết');
      }
    } catch (err) {
      console.error('Error creating news:', err);
      setError('Không thể kết nối đến máy chủ');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {error && (
        <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 text-red-700 dark:text-red-400">
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-lg shrink-0">error</span>
            <div className="flex-1">
              <p className="text-sm font-medium">{error}</p>
              <button 
                onClick={() => setError(null)}
                className="text-xs mt-2 underline hover:no-underline"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-1">
            <Link href="/admin/tin-tuc" className="hover:text-emerald-600 transition-colors">Quản lý Tin tức</Link>
            <span className="material-symbols-outlined text-[16px]" aria-hidden="true">chevron_right</span>
            <span className="text-slate-900 dark:text-slate-100 font-medium">Viết bài mới</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Soạn thảo Tin Tức</h1>
        </div>
        <div className="flex gap-3">
          <Link href="/admin/tin-tuc" className="px-4 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-sm text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500">
            Hủy
          </Link>
          <button 
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || isUploading || !title || !content}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-600/50 text-white rounded-sm text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 flex items-center gap-2"
          >
            {isSubmitting || isUploading ? (
              <span className="material-symbols-outlined text-[18px] animate-spin" aria-hidden="true">progress_activity</span>
            ) : (
              <span className="material-symbols-outlined text-[18px]" aria-hidden="true">publish</span>
            )}
            {isSubmitting ? 'Đang lưu...' : isUploading ? 'Đang tải ảnh...' : 'Xuất bản ngay'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content Column */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-sm border border-slate-200 dark:border-slate-700 shadow-sm space-y-5">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Tiêu đề bài viết <span className="text-red-500">*</span>
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Nhập tiêu đề hấp dẫn..."
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-sm text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:text-white"
                required
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Tóm tắt nội dung
              </label>
              <textarea
                id="description"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Đoạn văn ngắn tóm lược ý chính hiển thị ở danh sách bài viết..."
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-sm text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:text-white resize-y"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Nội dung chi tiết <span className="text-red-500">*</span>
              </label>
              {/* Rich Text Editor */}
              <div className="prose-container">
                <RichTextEditor 
                  value={content} 
                  onChange={setContent} 
                  placeholder="Bắt đầu viết nội dung tại đây..." 
                />
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Settings Column */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-sm border border-slate-200 dark:border-slate-700 shadow-sm space-y-5">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-700 pb-3">Hiển thị nội dung</h3>
            
            <div>
              <label htmlFor="thumbnail" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Ảnh đại diện (Cover)
              </label>
              <label htmlFor="thumbnail-input" className="block cursor-pointer">
                <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-sm p-6 text-center hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:border-emerald-400 dark:hover:border-emerald-600 transition-all group">
                  <span className="material-symbols-outlined text-4xl text-slate-400 group-hover:text-emerald-500 transition-colors mb-2 block" aria-hidden="true">add_photo_alternate</span>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    <span className="text-emerald-600 dark:text-emerald-400 font-medium">Nhấp để tải lên</span> hoặc kéo thả file
                  </p>
                  <p className="text-xs text-slate-500 mt-1">PNG, JPG, WEBP (Tối đa 5MB)</p>
                </div>
                <input
                  id="thumbnail-input"
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleThumbnailChange}
                  className="hidden"
                  disabled={isUploading}
                />
              </label>
              {thumbnail_preview && (
                <div className="mt-3 rounded-sm overflow-hidden border border-slate-200 dark:border-slate-700 relative">
                  <img 
                    src={thumbnail_preview} 
                    alt="Thumbnail preview" 
                    className="w-full h-40 object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setThumbnailFile(null);
                      setThumbnailPreview('');
                    }}
                    className="absolute top-2 right-2 p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-sm transition-colors"
                    title="Xóa ảnh"
                  >
                    <span className="material-symbols-outlined text-[18px]" aria-hidden="true">close</span>
                  </button>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Từ khóa/Hashtag
              </label>
              <div className="space-y-2">
                {/* Selected Tags */}
                <div className="flex flex-wrap gap-2">
                  {selectedTags.map(tagName => (
                    <div key={tagName} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-full text-sm font-medium">
                      #{tagName}
                      <button
                        type="button"
                        onClick={() => setSelectedTags(selectedTags.filter(name => name !== tagName))}
                        className="hover:text-emerald-900 dark:hover:text-emerald-200 ml-1"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>

                {/* Tag Input with Add Button */}
                <div className="relative">
                  <div className="flex gap-2">
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        value={tagInput}
                        onChange={(e) => {
                          setTagInput(e.target.value);
                          setShowTagDropdown(true);
                        }}
                        onFocus={() => setShowTagDropdown(true)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddTag();
                          }
                        }}
                        placeholder="Nhập hoặc chọn từ khóa..."
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-sm bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:text-white"
                      />
                      
                      {/* Dropdown */}
                      {showTagDropdown && tagInput && (
                        <div className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-sm shadow-lg max-h-48 overflow-y-auto">
                          {availableTags
                            .filter(tag => 
                              tag && tag.name && tag.name.toLowerCase().includes(tagInput.toLowerCase()) &&
                              !selectedTags.includes(tag.name)
                            )
                            .map(tag => (
                              <button
                                key={tag.id}
                                type="button"
                                onClick={() => {
                                  setSelectedTags([...selectedTags, tag.name]);
                                  setTagInput('');
                                  setShowTagDropdown(false);
                                }}
                                className="w-full text-left px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 text-sm text-slate-700 dark:text-slate-300 border-b border-slate-100 dark:border-slate-700 last:border-0"
                              >
                                {tag.name}
                              </button>
                            ))}
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={handleAddTag}
                      disabled={!tagInput.trim()}
                      className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 disabled:cursor-not-allowed text-white rounded-sm text-sm font-medium transition-colors"
                    >
                      Thêm
                    </button>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
