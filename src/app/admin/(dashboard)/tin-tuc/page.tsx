"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAdminStore } from "@/src/store/adminStore";
import { useNotificationStore } from "@/src/store/notificationStore";
import { fetchWithRetry } from "@/src/lib/api/fetch-with-retry";
import { useAdminAuth } from "@/src/hooks/useAdminAuth";

interface NewsArticle {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  thumbnail_url: string | null;
  created_at: Date | string;
  tags: Record<string, unknown>[];
}

export default function AdminNewsListPage() {
  const router = useRouter();
  const adminToken = useAdminStore((state) => state.accessToken);
  const addToast = useNotificationStore((state) => state.addToast);
  
  useAdminAuth(() => {
    router.push('/admin/login');
  });
  
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [confirmModal, setConfirmModal] = useState<{
    open: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  // Mark as mounted to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchNews = async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(pagination.limit),
      });
      if (searchQuery) {
        params.set('search', searchQuery);
      }
      const res = await fetchWithRetry(`/api/admin/news?${params}`, {
        token: adminToken || undefined,
        isAdmin: true
      });

      if (res.status === 401) {
        useAdminStore.getState().clearAuth();
        addToast('Phiên đăng nhập hết hạn, vui lòng đăng nhập lại', 'error');
        router.push('/admin/login');
        return;
      }

      const result = await res.json();

      if (result.success) {
        setNews(result.data);
        if (result.pagination) {
          setPagination(result.pagination);
        }
        setError(null);
      } else {
        setError(result.error || 'Không thể tải tin tức');
      }
    } catch (err) {
      console.error('Error fetching news:', err);
      setError('Không thể kết nối đến máy chủ');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!mounted) return;
    fetchNews();
  }, [adminToken, mounted]);

  const handleSearch = () => {
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchNews(1);
  };

  const handlePageChange = (page: number) => {
    if (page < 1 || page > pagination.totalPages) return;
    setPagination(prev => ({ ...prev, page }));
    fetchNews(page);
  };

  const handleDeleteNews = async (newsItem: NewsArticle) => {
    if (!adminToken) {
      router.push('/admin/login');
      return;
    }

    // Show confirmation modal instead of window.confirm
    setConfirmModal({
      open: true,
      title: 'Xóa tin tức',
      message: `Bạn có chắc chắn muốn xóa vĩnh viễn bài này?`,
      onConfirm: async () => {
        await performDeleteNews(newsItem);
      }
    });
  };

  const performDeleteNews = async (newsItem: NewsArticle) => {
    setDeletingId(newsItem.id);
    try {
      const res = await fetch(`/api/admin/news/${newsItem.slug}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      });

      const result = await res.json();

      if (result.success) {
        setNews(news.filter(n => n.id !== newsItem.id));
        setError(null);
        addToast('Tin tức đã được xóa thành công!', 'success');
      } else {
        const errorMsg = result.error || 'Lỗi khi xóa tin tức';
        setError(errorMsg);
        addToast(errorMsg, 'error');
      }
    } catch (err) {
      console.error('Error deleting news:', err);
      const errorMsg = 'Không thể kết nối đến máy chủ';
      setError(errorMsg);
      addToast(errorMsg, 'error');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="p-6">
      <div className="w-full space-y-6">
        {error && (
          <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 text-red-700 dark:text-red-400">
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-lg flex-shrink-0">error</span>
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
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Quản lý Tin tức</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Quản lý các bài viết blog, tin tức thị trường và kiến thức BĐS</p>
          </div>
          <div className="flex gap-3">
            {/* Search Bar */}
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
              <input
                className="pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-sm text-sm focus:ring-2 focus:ring-emerald-500 dark:text-white w-64 placeholder-slate-400"
                placeholder="Tìm kiếm theo tiêu đề..."
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={loading}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-sm text-sm font-medium flex items-center gap-2 disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-lg">search</span>
            </button>
            <button
              onClick={() => fetchNews(1)}
              disabled={loading}
              className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 px-3 py-2 rounded-sm text-sm font-medium flex items-center gap-2 disabled:opacity-50"
              title="Làm mới"
            >
              <span className={`material-symbols-outlined text-lg ${loading ? 'animate-spin' : ''}`}>refresh</span>
            </button>
            <Link
              href="/admin/tin-tuc/them"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-sm text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[20px]" aria-hidden="true">add</span>
              Viết tin mới
            </Link>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-slate-800 rounded-sm border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700">
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Tiêu đề</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider w-36">Ngày đăng</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right w-28">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {loading ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-8 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <span className="material-symbols-outlined text-2xl animate-spin text-emerald-600 mb-2">progress_activity</span>
                        <p className="text-sm text-slate-500">Đang tải tin tức...</p>
                      </div>
                    </td>
                  </tr>
                ) : news.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-8 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">newspaper</span>
                        <p className="text-sm text-slate-500">Chưa có tin tức nào</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  news.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="text-sm text-slate-900 dark:text-slate-100 font-bold line-clamp-2">{item.title}</p>
                        {item.description && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-1">{item.description}</p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-slate-500 dark:text-slate-400">
                          {new Date(item.created_at).toLocaleDateString('vi-VN', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit'
                          })}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <Link
                          href={`/admin/tin-tuc/${item.slug}`}
                          className="text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors p-1 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500" 
                          title="Sửa"
                        >
                          <span className="material-symbols-outlined text-lg" aria-hidden="true">edit</span>
                        </Link>
                        <button 
                          onClick={() => handleDeleteNews(item)}
                          disabled={deletingId === item.id}
                          aria-label="Xóa tin tức"
                          className="text-slate-400 hover:text-red-600 dark:hover:text-red-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors p-1 ml-1 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500" 
                          title="Xóa"
                        >
                          <span className="material-symbols-outlined text-lg" aria-hidden="true">delete</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex justify-between items-center mt-4">
          <div className="text-sm text-slate-500">
            Hiển thị {(pagination.page - 1) * pagination.limit + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} của {pagination.total} tin tức
          </div>
          <div className="flex justify-end items-center gap-1">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page <= 1 || loading}
              className="px-3 py-1.5 rounded-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Trước
            </button>
            {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
              let pageNum;
              if (pagination.totalPages <= 5) {
                pageNum = i + 1;
              } else if (pagination.page <= 3) {
                pageNum = i + 1;
              } else if (pagination.page >= pagination.totalPages - 2) {
                pageNum = pagination.totalPages - 4 + i;
              } else {
                pageNum = pagination.page - 2 + i;
              }
              return (
                <button
                  key={pageNum}
                  onClick={() => handlePageChange(pageNum)}
                  className={`px-3 py-1.5 min-w-[32px] rounded-sm text-sm font-medium flex items-center justify-center transition-colors ${
                    pagination.page === pageNum
                      ? 'bg-emerald-600 text-white'
                      : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages || loading}
              className="px-3 py-1.5 rounded-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Tiếp
            </button>
          </div>
        </div>

        {/* Confirmation Modal */}
        {confirmModal?.open && (
          <div className="fixed inset-0 z-50 flex items-start justify-center pt-20">
            <div className="fixed inset-0 bg-black/50" onClick={() => setConfirmModal(null)}></div>
            <div className="relative bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-md w-full mx-4 p-6 border border-red-500">
              <div className="flex items-center gap-3 mb-4">
                <span className="material-symbols-outlined text-red-500 text-2xl">warning</span>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{confirmModal.title}</h3>
              </div>
              <p className="text-slate-600 dark:text-slate-300 mb-6 whitespace-pre-wrap">{confirmModal.message}</p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setConfirmModal(null)}
                  className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-md font-medium transition-colors"
                >
                  Thoát
                </button>
                <button
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
    </div>
  );
}