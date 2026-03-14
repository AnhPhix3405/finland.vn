"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, ChevronRight, Share2, Clock, Tag, MessageSquare } from 'lucide-react';
import MarkdownIt from 'markdown-it';

interface NewsArticle {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  content: string;
  thumbnail_url: string | null;
  created_at: string;
  tags: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
}

const mdParser = new MarkdownIt();

export default function NewsDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  
  const [news, setNews] = useState<NewsArticle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;

    const fetchNews = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/news/${slug}`);
        
        const data = await response.json();
        if (data.success) {
          setNews(data.data);
        } else {
          setError('Không thể tải bài viết');
        }
      } catch (err) {
        console.error('Error fetching news:', err);
        setError('Lỗi kết nối đến máy chủ');
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center">
          <span className="material-symbols-outlined text-4xl animate-spin text-emerald-600 mb-3">progress_activity</span>
          <p className="text-slate-600">Đang tải bài viết...</p>
        </div>
      </div>
    );
  }

  if (error || !news) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Bài viết không tồn tại'}</p>
          <Link 
            href="/tin-tuc"
            className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700"
          >
            Quay lại danh sách
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 min-h-screen pt-6 pb-12">
      {/* 1. Integrated Navigation Row */}
      <div className="max-w-4xl mx-auto px-4 mb-8">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-slate-500 hover:text-emerald-600 transition-colors text-[11px] font-bold group"
          >
            <ArrowLeft className="size-3.5 group-hover:-translate-x-0.5 transition-transform" />
            <span>Quay lại</span>
          </button>
          
          <div className="w-px h-2.5 bg-slate-200 dark:bg-slate-800" />

          <nav className="flex items-center gap-2 text-[11px] text-slate-400">
            <Link href="/" className="hover:text-emerald-600 transition-colors">Trang chủ</Link>
            <ChevronRight className="size-3" />
            <Link href="/tin-tuc" className="hover:text-emerald-600 transition-colors">Tin tức</Link>
            <ChevronRight className="size-3" />
            <span className="text-slate-600 dark:text-slate-200 font-medium">Chi tiết bài viết</span>
          </nav>
        </div>
      </div>

      <article className="max-w-4xl mx-auto px-4">
        {/* Post Meta */}
        <header className="mb-10 space-y-4">
          <div className="flex items-center gap-3">
            <span className="bg-emerald-600 text-white text-[9px] font-black px-2 py-1 rounded uppercase tracking-widest">
              Thị trường
            </span>
            <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-medium">
              <Clock className="size-3.5" />
              <span>Đăng ngày {new Date(news.created_at).toLocaleDateString('vi-VN')}</span>
            </div>
          </div>

          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-slate-900 dark:text-white leading-tight">
            {news.title}
          </h1>

          <div className="flex items-center justify-between py-4 border-y border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 font-bold text-sm">
                BBT
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">Ban biên tập finland.vn</p>
                <p className="text-[11px] text-slate-500">Chuyên gia phân tích thị trường</p>
              </div>
            </div>
            <div className="flex gap-4">
              <button className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-emerald-600 transition-colors">
                <Share2 className="size-4" />
                <span>Chia sẻ</span>
              </button>
            </div>
          </div>
        </header>

        {/* Post Image */}
        {news.thumbnail_url && (
          <div className="aspect-video w-full rounded-xl overflow-hidden mb-10 shadow-lg">
            <img
              src={news.thumbnail_url}
              alt={news.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Post Description/Summary */}
        {news.description && (
          <div className="mb-6 p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/30 rounded-lg">
            <p className="text-slate-700 dark:text-slate-300 text-base font-medium italic">
              {news.description}
            </p>
          </div>
        )}

        {/* Post Content (Rich Text) */}
        <div
          className="prose prose-slate dark:prose-invert prose-lg max-w-none 
          prose-headings:text-slate-900 dark:prose-headings:text-white 
          prose-p:text-slate-700 dark:prose-p:text-slate-300 
          prose-p:leading-relaxed prose-p:mb-5 
          prose-li:text-slate-700 dark:prose-li:text-slate-300
          prose-blockquote:border-emerald-500 prose-blockquote:bg-emerald-50 dark:prose-blockquote:bg-emerald-900/10 
          prose-blockquote:py-2 prose-blockquote:px-6 prose-blockquote:rounded-r-lg
          prose-img:rounded-xl"
          dangerouslySetInnerHTML={{ __html: mdParser.render(news.content) }}
        />

        {/* Post Tags */}
        {news.tags && news.tags.length > 0 && (
          <div className="mt-12 pt-8 border-t border-slate-100 dark:border-slate-800">
            <div className="flex flex-wrap gap-2 items-center">
              <div className="text-[11px] font-bold text-slate-400 mr-2 flex items-center gap-1.5 uppercase tracking-wider">
                <Tag className="size-3.5" />
                <span>Tags:</span>
              </div>
              {news.tags.map(tag => (
                <Link
                  key={tag.id}
                  href={`/tin-tuc?tag=${tag.slug}`}
                  className="px-3 py-1 bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 rounded-full text-[11px] font-medium hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-900/20 transition-colors border border-slate-100 dark:border-slate-800"
                >
                  #{tag.name}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Post Navigation */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-slate-50 dark:bg-slate-800/20 rounded-xl border border-slate-100 dark:border-slate-800">
          <Link href="/tin-tuc" className="group">
            <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-2">Quay lại danh sách</p>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 transition-colors">
              Xem các bài viết khác
            </h4>
          </Link>
        </div>
      </article>

      {/* Subscription Section */}
      <section className="bg-slate-900 py-16 px-4 mt-12">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Đăng ký nhận bảng tin thị trường</h2>
          <p className="text-slate-400 mb-8">Chúng tôi sẽ gửi những báo cáo và phân tích mới nhất vào mỗi sáng thứ 2 hàng tuần.</p>
          <form className="flex flex-col sm:flex-row gap-3">
            <input
              type="email"
              placeholder="Nhập email của bạn..."
              className="flex-1 px-4 py-3 rounded-sm bg-slate-800 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
            />
            <button className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-sm transition-colors whitespace-nowrap">
              Đăng ký ngay
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}