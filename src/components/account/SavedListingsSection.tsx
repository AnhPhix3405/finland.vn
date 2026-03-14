"use client";

import { useState, useEffect } from "react";
import { HeartOff, MapPin, Eye, Loader2 } from "lucide-react";
import Link from "next/link";
import { useAuthStore } from "@/src/store/authStore";
import { getBookmarkedListings, toggleBookmark } from "@/src/app/modules/bookmarks.service";
import { transaction_types } from '../../app/generated/prisma/browser';

interface SavedListing {
  id: string;
  title: string;
  price?: string | number | null;
  ward?: string | null;
  province?: string | null;
  slug: string;
  brokers?: {
    full_name?: string;
    phone?: string;
  };
  property_types?: {
    name?: string;
  } | null;
  transaction_types?: {
    name?: string;
    hashtag?: string;
  } | null;
}

export default function SavedListingsSection() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const isHydrated = useAuthStore((state) => state.isHydrated);
  
  const [savedItems, setSavedItems] = useState<SavedListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0
  });

  const formatPrice = (price: string | number | null | undefined) => {
    if (!price) return "Thỏa thuận";
    const numPrice = Number(price);

    if (numPrice >= 1000000000) {
      const billions = numPrice / 1000000000;
      return `${billions.toFixed(1)} Tỷ`;
    } else if (numPrice >= 1000000) {
      const millions = numPrice / 1000000;
      return `${millions.toFixed(0)} Triệu`;
    } else if (numPrice >= 1000) {
      const thousands = numPrice / 1000;
      return `${thousands.toFixed(0)} Nghìn`;
    } else {
      return `${numPrice.toLocaleString('vi-VN')} VND`;
    }
  };

  // Load bookmarked listings
  useEffect(() => {
    if (!isHydrated || !accessToken) {
      if (!isHydrated) {
        console.log('⏳ Waiting for authStore hydration... (SavedListingsSection)');
      }
      return;
    }

    const loadBookmarks = async () => {
      try {
        setLoading(true);
        setError(null);

        const result = await getBookmarkedListings(pagination.page, pagination.limit);

        console.log('SavedListingsSection - Loaded bookmarks:', {
          success: result.success,
          itemCount: result.data?.length || 0,
          pagination: result.pagination,
          firstItem: result.data?.[0] ? {
            id: result.data[0].id,
            title: result.data[0].title,
            transaction_types: result.data[0].transaction_types,
            property_types: result.data[0].property_types
          } : 'N/A'
        });

        if (result.success) {
          setSavedItems(result.data || []);
          console.log('SavedListingsSection - Items data:', {
            firstItem: result.data?.[0],
            transaction_types: result.data?.[0]?.transaction_types,
            hashtag: result.data?.[0]?.transaction_types?.hashtag
          });
          setPagination(result.pagination || {
            page: pagination.page,
            limit: pagination.limit,
            total: 0,
            totalPages: 0
          });
        } else {
          setError(result.error || 'Lỗi khi tải dữ liệu');
          setSavedItems([]);
        }
      } catch (err) {
        console.error('Error loading saved listings:', err);
        setError('Không thể tải danh sách yêu thích');
        setSavedItems([]);
      } finally {
        setLoading(false);
      }
    };

    loadBookmarks();
  }, [isHydrated, accessToken, pagination.page]);

  const removeSaved = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    try {
      const result = await toggleBookmark(id);

      if (result.success) {
        setSavedItems(savedItems.filter((item) => item.id !== id));
        console.log('Removed bookmark for listing:', id);
      } else {
        setError(result.error || 'Lỗi khi bỏ lưu');
      }
    } catch (err) {
      console.error('Error removing bookmark:', err);
      setError('Không thể bỏ lưu');
    }
  };

  const handlePageChange = (newPage: number) => {
    setPagination({ ...pagination, page: newPage });
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="p-6 border-b border-slate-100 dark:border-slate-800">
        <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">Tin đã lưu</h1>
        <p className="text-sm text-slate-500 mt-1">Danh sách bất động sản bạn đã bookmark quan tâm.</p>
      </div>

      <div className="p-6">
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center">
            <Loader2 className="size-8 text-emerald-600 animate-spin mb-3" />
            <p className="text-sm text-slate-500">Đang tải dữ liệu...</p>
          </div>
        ) : error ? (
          <div className="py-12 text-center">
            <div className="text-red-500 text-sm mb-3">{error}</div>
            <button
              onClick={() => {
                setError(null);
                setPagination({ ...pagination, page: 1 });
              }}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-bold hover:bg-emerald-700 transition-all"
            >
              Thử lại
            </button>
          </div>
        ) : savedItems.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {savedItems.map((item) => (
                <div
                  key={item.id}
                  className="group relative bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden hover:shadow-xl hover:shadow-emerald-500/5 hover:-translate-y-1 transition-all duration-300"
                >
                  <div className="relative h-48 overflow-hidden bg-slate-100 dark:bg-slate-800">
                    <img
                      src="https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=400&q=80"
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      title={item.title}
                    />
                    <div className="absolute top-3 left-3 px-3 py-1 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-full text-[10px] font-black text-emerald-600 uppercase tracking-wider shadow-sm">
                      {item.property_types?.name || 'Bất động sản'}
                    </div>
                    <button
                      onClick={(e) => removeSaved(item.id, e)}
                      className="absolute top-3 right-3 p-2.5 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md text-red-500 hover:bg-red-500 hover:text-white rounded-full transition-all shadow-sm"
                      title="Bỏ lưu"
                    >
                      <HeartOff className="size-4" />
                    </button>
                  </div>
                  <div className="p-4">
                    <h4 className="font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 transition-colors line-clamp-2">
                      {item.title}
                    </h4>
                    <div className="flex items-center gap-1.5 text-slate-500 text-xs mt-2">
                      <MapPin className="size-3.5 text-emerald-500 flex-shrink-0" />
                      <span className="line-clamp-1">
                        {item.ward && item.province ? `${item.ward}, ${item.province}` : 'Địa chỉ'}
                      </span>
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-emerald-600 font-black text-lg">
                        {formatPrice(item.price)}
                      </span>
                      <Link
                        href={`/${item.transaction_types?.hashtag || 'mua-ban'}/bai-dang/${item.slug}`}
                        className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-emerald-600 transition-colors"
                      >
                        Chi tiết <Eye className="size-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex justify-center gap-2">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                >
                  Trước
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: pagination.totalPages }, (_, i) => (
                    <button
                      key={i + 1}
                      onClick={() => handlePageChange(i + 1)}
                      className={`px-3 py-2 rounded-lg transition-all ${
                        pagination.page === i + 1
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.totalPages}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                >
                  Sau
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="py-24 flex flex-col items-center text-center">
            <div className="size-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-300 mb-6">
              <HeartOff className="size-10" />
            </div>
            <h5 className="font-bold text-slate-900 dark:text-white text-lg">Chưa có tin lưu nào</h5>
            <p className="text-sm text-slate-500 mt-2 max-w-xs">Hãy lưu lại những bất động sản bạn quan tâm để xem lại sau nhé.</p>
            <Link
              href="/mua-ban"
              className="mt-8 px-6 py-2.5 bg-emerald-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-emerald-500/20 hover:bg-emerald-700 transition-all active:scale-95"
            >
              Khám phá ngay
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
