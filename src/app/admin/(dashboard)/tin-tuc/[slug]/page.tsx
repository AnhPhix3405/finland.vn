"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { useAdminStore } from "@/src/store/adminStore";
import { useNotificationStore } from "@/src/store/notificationStore";
import { uploadNewsThumbnail } from "@/src/app/modules/upload.service";
import { fetchWithRetry } from "@/src/lib/api/fetch-with-retry";
import { useAdminAuth } from "@/src/hooks/useAdminAuth";
import RichTextEditor from '@/src/components/ui/RichTextEditor';

interface Tag {
  id: string;
  name: string;
  slug: string;
}

export default function AdminEditNewsPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;
  const adminToken = useAdminStore((state) => state.accessToken);
  const addToast = useNotificationStore((state) => state.addToast);
  
  useAdminAuth(() => {
    router.push('/admin/login');
  });

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');
  const [thumbnail_url, setThumbnailUrl] = useState('');
  const [thumbnail_file, setThumbnailFile] = useState<File | null>(null);
  const [thumbnail_preview, setThumbnailPreview] = useState('');
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [showTagDropdown, setShowTagDropdown] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  // Fetch news article on mount
  useEffect(() => {
    if (!adminToken || !slug) return;

    const fetchNews = async () => {
      try {
        const res = await fetchWithRetry(`/api/admin/news/${slug}`, {
          token: adminToken,
          isAdmin: true
        });

        // Check for 401 status code
        if (res.status === 401) {
          const { clearAuth } = useAdminStore.getState();
          clearAuth();
          setError('Phiên đăng nhập hết hạn, vui lòng đăng nhập lại');
          addToast('Phiên đăng nhập hết hạn, vui lòng đăng nhập lại', 'error');
          router.push('/admin/login');
          return;
        }

        const result = await res.json();

        if (result.success) {
          setTitle(result.data.title);
          setDescription(result.data.description || '');
          setContent(result.data.content);
          setThumbnailUrl(result.data.thumbnail_url || '');
          if (result.data.tags && Array.isArray(result.data.tags)) {
            setSelectedTags(result.data.tags.map((tag: Tag) => tag.name));
          }
          setError(null);
        } else {
          setError(result.error || 'Không thể tải bài viết');
        }
      } catch (err) {
        console.error('Error fetching news:', err);
        setError('Không thể kết nối đến máy chủ');
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, [slug, adminToken]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!adminToken) {
      router.push('/admin/login');
      return;
    }

    if (!title || !content) {
      setError('Vui lòng điền tiêu đề và nội dung');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      let finalThumbnailUrl = thumbnail_url;

      // Upload thumbnail if a new file was selected
      if (thumbnail_file) {
        setIsUploading(true);
        try {
          const uploadResult = await uploadNewsThumbnail(thumbnail_file);
          finalThumbnailUrl = uploadResult.secure_url;
        } catch (err) {
          console.error('Error uploading thumbnail:', err);
          setError('Lỗi khi tải lên ảnh đại diện');
          setIsSubmitting(false);
          setIsUploading(false);
          return;
        }
        setIsUploading(false);
      }

      const res = await fetchWithRetry(`/api/admin/news/${slug}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title,
          description: description || null,
          content,
          thumbnail_url: finalThumbnailUrl || null,
          tags: selectedTags
        }),
        token: adminToken,
        isAdmin: true
      });

      // Check for 401 status code
      if (res.status === 401) {
        const { clearAuth } = useAdminStore.getState();
        clearAuth();
        setError('Phiên đăng nhập hết hạn, vui lòng đăng nhập lại');
        addToast('Phiên đăng nhập hết hạn, vui lòng đăng nhập lại', 'error');
        router.push('/admin/login');
        return;
      }

      const result = await res.json();

      if (result.success) {
        addToast('Tin tức đã được cập nhật thành công!', 'success');
        router.push('/admin/tin-tuc');
      } else {
        const errorMsg = result.error || 'Lỗi khi cập nhật bài viết';
        setError(errorMsg);
        addToast(errorMsg, 'error');
      }
    } catch (err) {
      console.error('Error updating news:', err);
      const errorMsg = 'Không thể kết nối đến máy chủ';
      setError(errorMsg);
      addToast(errorMsg, 'error');
    } finally {
      setIsSubmitting(false);
      setIsUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!adminToken) {
      router.push('/admin/login');
      return;
    }

    if (!window.confirm(`Bạn chắc chắn muốn xóa bài "${title}"?\n\nHành động này không thể hoàn tác.`)) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/admin/news/${slug}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      });

      // Check for 401 status code
      if (res.status === 401) {
        const { clearAuth } = useAdminStore.getState();
        clearAuth();
        setError('Phiên đăng nhập hết hạn, vui lòng đăng nhập lại');
        addToast('Phiên đăng nhập hết hạn, vui lòng đăng nhập lại', 'error');
        router.push('/admin/login');
        return;
      }

      const result = await res.json();

      if (result.success) {
        addToast('Tin tức đã được xóa thành công!', 'success');
        router.push('/admin/tin-tuc');
      } else {
        const errorMsg = result.error || 'Lỗi khi xóa bài viết';
        setError(errorMsg);
        addToast(errorMsg, 'error');
      }
    } catch (err) {
      console.error('Error deleting news:', err);
      const errorMsg = 'Không thể kết nối đến máy chủ';
      setError(errorMsg);
      addToast(errorMsg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center">
          <span className="material-symbols-outlined text-4xl animate-spin text-emerald-600 mb-3">progress_activity</span>
          <p className="text-slate-600 dark:text-slate-400">Đang tải bài viết...</p>
        </div>
      </div>
    );
  }

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
            <span className="text-slate-900 dark:text-slate-100 font-medium">Chỉnh sửa bài viết</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Cập nhật Tin Tức</h1>
        </div>
        <div className="flex gap-3">
          <Link href="/admin/tin-tuc" className="px-4 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-sm text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500">
            Huỷ
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
              <span className="material-symbols-outlined text-[18px]" aria-hidden="true">save</span>
            )}
            {isSubmitting || isUploading ? 'Đang lưu...' : 'Lưu thay đổi'}
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
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Ảnh đại diện (Cover)
              </label>
              
              {/* File Upload Area */}
              <label htmlFor="thumbnail_file" className={`block border-2 border-dashed rounded-sm p-4 text-center cursor-pointer transition-colors ${
                isUploading || isSubmitting 
                  ? 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/30 cursor-not-allowed opacity-50'
                  : 'border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50'
              }`}>
                <input
                  id="thumbnail_file"
                  type="file"
                  accept="image/*"
                  onChange={handleThumbnailChange}
                  disabled={isUploading || isSubmitting}
                  className="hidden"
                />
                {!thumbnail_preview && !thumbnail_url ? (
                  <div className="text-sm">
                    <span className="material-symbols-outlined text-3xl text-slate-400 block mb-1">image</span>
                    <p className="text-slate-600 dark:text-slate-400 font-medium text-xs">Kéo ảnh vào hoặc click để chọn</p>
                  </div>
                ) : null}
              </label>

              {/* Preview */}
              {(thumbnail_preview || thumbnail_url) && (
                <div className="mt-3 relative rounded-sm overflow-hidden border border-slate-200 dark:border-slate-700">
                  <img 
                    src={thumbnail_preview || thumbnail_url} 
                    alt="Thumbnail preview" 
                    className="w-full h-32 object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setThumbnailFile(null);
                      setThumbnailPreview('');
                    }}
                    className="absolute top-1 right-1 p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-sm transition-colors"
                    title="Xóa ảnh"
                  >
                    <span className="material-symbols-outlined text-[18px]">close</span>
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
