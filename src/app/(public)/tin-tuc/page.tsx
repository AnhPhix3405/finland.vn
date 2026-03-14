"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Calendar, ArrowRight } from 'lucide-react';

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

export default function NewsListPage() {
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/news?limit=10&page=1');
        const data = await response.json();
        if (data.success) {
          setNews(data.data || []);
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

    fetchNews();
  }, []);

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
        {news.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-600">Chưa có tin tức nào</p>
          </div>
        ) : (
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
        )}
      </div>
    </div>
  );
}