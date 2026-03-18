"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Calendar, ArrowRight, Search, X } from 'lucide-react';
import { Pagination } from '@/src/components/shared/Pagination';

interface Tag {
  id: string;
  name: string;
  slug: string;
}

interface NewsArticle {
  id: string;
  title: string;
  description: string | null;
  slug: string;
  thumbnail_url: string | null;
  created_at: string;
  tags: Tag[];
}

interface PaginationState {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function NewsListPage() {
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    limit: 9,
    total: 0,
    totalPages: 0,
  });

  const fetchNews = async (page: number) => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams({
        limit: String(pagination.limit),
        page: String(page),
      });
      if (searchQuery) {
        params.set('search', searchQuery);
      }
      const response = await fetch(`/api/news?${params}`);
      const data = await response.json();
      if (data.success) {
        setNews(data.data || []);
        if (data.pagination) {
          setPagination({
            page: data.pagination.page,
            limit: data.pagination.limit,
            total: data.pagination.total,
            totalPages: data.pagination.totalPages,
          });
        }
      } else {
        setError('Không thể tải tin tức');
      }
    } catch (err) {
      console.error('Error fetching news:', err);
      setError('Lỗi kết nối đến máy chủ');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews(1);
  }, []);

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    fetchNews(1);
  };

  const clearSearch = () => {
    setSearchQuery("");
  };

  const handlePageChange = (page: number) => {
    if (page < 1 || page > pagination.totalPages) return;
    fetchNews(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="bg-slate-50 dark:bg-slate-900 min-h-screen pb-20">
      {/* Hero Section */}
      <section className="bg-emerald-700 py-16 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">Tin Tức Bất Động Sản</h1>
          <p className="text-emerald-50 text-lg max-w-2xl mx-auto opacity-90">
            Cập nhật những thông tin mới nhất về thị trường, quy hoạch và kiến thức đầu tư bất động sản tại Việt Nam.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        {/* Search Bar */}
        <form onSubmit={handleSearch} className="mb-8 flex justify-start gap-2">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm kiếm theo tiêu đề..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={clearSearch}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                <X className="size-4" />
              </button>
            )}
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm rounded-lg transition-colors"
          >
            Tìm
          </button>
        </form>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white dark:bg-slate-800 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm animate-pulse">
                <div className="h-48 bg-slate-200 dark:bg-slate-700"></div>
                <div className="p-6 space-y-3">
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3"></div>
                  <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-full"></div>
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-2/3"></div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-500">{error}</p>
          </div>
        ) : news.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-600 dark:text-slate-400">Chưa có tin tức nào</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {news.map((article) => (
                <Link 
                  key={article.id}
                  href={`/tin-tuc/${article.slug}`}
                  className="group bg-white dark:bg-slate-800 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                >
                  <div className="relative h-48 w-full overflow-hidden bg-slate-200 dark:bg-slate-700">
                    {article.thumbnail_url ? (
                      <img 
                        src={article.thumbnail_url} 
                        alt={article.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="material-symbols-outlined text-4xl text-slate-400">image</span>
                      </div>
                    )}
                    <div className="absolute top-4 left-4">
                      <span className="bg-emerald-600 text-white text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">
                        Tin tức
                      </span>
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400 text-xs mb-3">
                      <span className="flex items-center gap-1.5 font-medium">
                        <Calendar className="size-3.5" />
                        {new Date(article.created_at).toLocaleDateString('vi-VN')}
                      </span>
                    </div>
                    
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-3 line-clamp-2 group-hover:text-emerald-600 transition-colors leading-snug">
                      {article.title}
                    </h2>
                    
                    <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-3 mb-4 leading-relaxed opacity-80">
                      {article.description || 'Không có mô tả'}
                    </p>

                    {/* Tags */}
                    {article.tags && article.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {article.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag.id}
                            className="inline-flex items-center px-2 py-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 rounded-full text-xs font-medium"
                          >
                            #{tag.name}
                          </span>
                        ))}
                        {article.tags.length > 3 && (
                          <span className="inline-flex items-center px-2 py-1 text-slate-500 dark:text-slate-400 text-xs">
                            +{article.tags.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                    
                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                      <span className="text-emerald-600 dark:text-emerald-400 text-sm font-bold flex items-center gap-1 group/link">
                        Đọc tiếp
                        <ArrowRight className="size-3.5 transition-transform group-hover/link:translate-x-1" />
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <Pagination
                currentPage={pagination.page}
                totalPages={pagination.totalPages}
                onPageChange={handlePageChange}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
