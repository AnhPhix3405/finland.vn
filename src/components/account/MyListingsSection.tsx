"use client";

import { useState } from "react";
import { Edit2, EyeOff, CheckCircle2, Trash2, Filter, ChevronDown, List as ListIcon, X } from "lucide-react";
import { useAuthStore } from "@/src/store/authStore";
import { getMyListings, updateListingStatus, deleteListingLocal } from "@/src/app/modules/listings.service";
import { useEffect } from "react";
import Link from "next/link";

type ListingStatus = 
  | "Đang hiển thị" 
  | "Đang chờ duyệt" 
  | "Đã ẩn" 
  | "Hết hạn" 
  | "Đã bán" 
  | "Đã xong" 
  | "Bị từ chối"
  | "public" | "hidden" | "expired" | "sold" | "rejected" | "pending"; // Keep old ones just in case

interface PropertyListing {
  id: string;
  listing_code: string;
  title: string;
  price: string;
  address: string;
  image: string;
  status: ListingStatus;
  date: string;
  views: number;
  slug?: string;
  transaction_type?: string;
}

interface PaginationState {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  "Đang hiển thị": { label: "Đang hiển thị", color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-900/20" },
  "Đã ẩn": { label: "Đã ẩn", color: "text-slate-500", bg: "bg-slate-100 dark:bg-slate-800" },
  "Đã bán": { label: "Đã bán/xong", color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-900/20" },
  "Đã xong": { label: "Đã bán/xong", color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-900/20" },
  "Bị từ chối": { label: "Bị từ chối", color: "text-red-600", bg: "bg-red-50 dark:bg-red-900/20" },
  "Đang chờ duyệt": { label: "Chờ phê duyệt", color: "text-orange-600", bg: "bg-orange-50 dark:bg-orange-900/20" },
};

const formatPrice = (price: string | number) => {
  if (!price) return "Thỏa thuận";
  const numPrice = Number(price);
  
  if (numPrice >= 1000000000) return `${(numPrice / 1000000000).toFixed(1)} Tỷ`;
  if (numPrice >= 1000000) return `${(numPrice / 1000000).toFixed(0)} Triệu`;
  if (numPrice >= 1000) return `${(numPrice / 1000).toFixed(0)} Nghìn`;
  return `${numPrice.toLocaleString('vi-VN')} VND`;
};

export default function MyListingsSection() {
  const { accessToken } = useAuthStore();
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [listings, setListings] = useState<PropertyListing[]>([]);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [pagination, setPagination] = useState<PaginationState>({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [currentPage, setCurrentPage] = useState(1);

  const fetchListings = async (page: number = 1) => {
    if (!accessToken) return;
    try {
      setLoading(true);
      const res = await getMyListings(accessToken, filter === "all" ? "all" : filter, page);
      
      if (res.success && res.data) {
        const mapped = res.data.map((l: Record<string, unknown>) => ({
           id: String(l.id),
           listing_code: l.listing_code ? String(l.listing_code) : String(l.id).slice(0, 8),
           title: String(l.title),
           price: formatPrice(l.price as string | number),
           address: l.address ? `${l.address}, ${l.ward}` : `${l.ward}, ${l.province}`,
           image: (l.thumbnail_url as string) || "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80&w=400",
           status: (l.status as ListingStatus) || "Đang chờ duyệt",
           date: l.created_at ? new Date(l.created_at as string).toLocaleDateString('vi-VN') : "?",
           views: typeof l.views_count === 'number' ? l.views_count : 0,
           slug: l.slug ? String(l.slug) : undefined,
           transaction_type: (l.transaction_types as Record<string, unknown>)?.hashtag ? String((l.transaction_types as Record<string, unknown>).hashtag) : undefined
        }));
        setListings(mapped);
        if (res.pagination) {
          setPagination({
            page: res.pagination.page as number,
            limit: res.pagination.limit as number,
            total: res.pagination.total as number,
            totalPages: res.pagination.totalPages as number
          });
        }
      }
    } catch (_err) {
      console.error(_err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings(currentPage);
  }, [accessToken, filter, currentPage]);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    if (!accessToken) return;
    try {
      setLoading(true);
      const res = await updateListingStatus(id, newStatus, accessToken);
      if (res.success) {
        setListings(prev => prev.map(l => l.id === id ? { ...l, status: newStatus as ListingStatus } : l));
        setMessage({ type: 'success', text: `Đã đổi trạng thái thành: ${newStatus}` });
      } else {
        setMessage({ type: 'error', text: res.error || 'Cập nhật thất bại' });
      }
    } catch (e) {
      setMessage({ type: 'error', text: 'Lỗi mạng' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!accessToken || !window.confirm('Bạn có chắc chắn muốn xóa bài đăng này ko? Hành động này không thể hoàn tác.')) return;
    try {
      setLoading(true);
      const res = await deleteListingLocal(id, accessToken);
      if (res.success) {
         setListings(prev => prev.filter(l => l.id !== id));
         setMessage({ type: 'success', text: 'Đã xóa bài đăng thành công' });
      } else {
         setMessage({ type: 'error', text: res.error || 'Xóa thất bại' });
      }
    } catch (e) {
      setMessage({ type: 'error', text: 'Lỗi mạng' });
    } finally {
      setLoading(false);
    }
  };

  const filteredListings = filter === "all" ? listings : listings.filter((l) => l.status === filter);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-visible relative">
      {/* Synchronized Header */}
      <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4 rounded-t-xl z-20 relative bg-white dark:bg-slate-900">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">Tin đăng của tôi</h1>
          <p className="text-sm text-slate-500 mt-1">Quản lý các bất động sản bạn đã đăng tin.</p>
        </div>

        {/* Ultra-compact Filter Button */}
        <div className="relative">
          <button
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-black border transition-all duration-200 ${
              isFilterOpen 
                ? "bg-emerald-600 text-white border-emerald-600 shadow-md" 
                : "bg-white dark:bg-slate-800 text-slate-600 dark:text-white border-slate-200 dark:border-slate-700 hover:border-emerald-500"
            }`}
          >
            <Filter className="size-3" />
            <span className="uppercase tracking-lighter">
              {filter === 'all' ? 'Tất cả' : statusConfig[filter].label}
            </span>
            <ChevronDown className={`size-3 transition-transform ${isFilterOpen ? 'rotate-180' : ''}`} />
          </button>

          {isFilterOpen && (
            <>
              <div 
                className="fixed inset-0 z-[60]" 
                onClick={() => setIsFilterOpen(false)}
              ></div>
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-lg shadow-2xl z-[70] overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top-right ring-1 ring-black/5">
                <div className="p-1 space-y-0.5">
                  <button
                    onClick={() => { setFilter("all"); setIsFilterOpen(false); }}
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-md text-[11px] font-bold transition-all ${
                      filter === "all" 
                        ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400" 
                        : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                    }`}
                  >
                    <span>Tất cả trạng thái</span>
                    {filter === "all" && <CheckCircle2 className="size-3" />}
                  </button>
                  <div className="h-px bg-slate-50 dark:bg-slate-800 my-1 mx-1"></div>
                  {(Object.keys(statusConfig) as ListingStatus[]).map((s) => (
                    <button
                      key={s}
                      onClick={() => { setFilter(s); setIsFilterOpen(false); }}
                      className={`w-full flex items-center justify-between px-2.5 py-2 rounded-md text-[11px] font-bold transition-all ${
                        filter === s 
                          ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400" 
                          : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span className={`size-1.5 rounded-full ${statusConfig[s].bg.replace('bg-', 'bg-')}`}></span>
                        {statusConfig[s].label}
                      </span>
                      {filter === s && <CheckCircle2 className="size-3" />}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {message.text && (
        <div className={`mx-6 mt-4 p-3 rounded-md text-sm pl-4 flex items-center justify-between ${
          message.type === 'success' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-red-50 text-red-600 border border-red-100'
        }`}>
          <span>{message.text}</span>
          <button onClick={() => setMessage({ type: '', text: '' })} className="hover:opacity-70"><X className="size-4" /></button>
        </div>
      )}

      {/* Listing Content */}
      <div className="p-4 md:p-6 overflow-visible relative z-10 min-h-[400px]">
        {loading ? (
           <div className="flex justify-center items-center py-20">
             <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
             <span className="ml-3 text-slate-600 dark:text-slate-400">Đang tải...</span>
           </div>
        ) : (
          <div className="space-y-4">
            {filteredListings.length > 0 ? (
            filteredListings.map((property) => (
              <div
                key={property.id}
                className="group flex flex-col sm:flex-row gap-3 p-3 rounded-lg border border-slate-100 dark:border-slate-800 hover:border-emerald-200 dark:hover:border-emerald-900/30 hover:shadow-md transition-all"
              >
                {/* Image */}
                <div className="relative w-full sm:w-32 h-24 shrink-0 rounded-md overflow-hidden bg-slate-100">
                  <img src={property.image} alt={property.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className={`absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded text-[9px] font-black uppercase ${statusConfig[property.status]?.bg || 'bg-slate-200'} ${statusConfig[property.status]?.color || 'text-slate-700'} backdrop-blur-md`}>
                    {statusConfig[property.status]?.label || property.status}
                  </div>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div className="flex items-start justify-between gap-1">
                    <div className="min-w-0">
                      <h4 className="font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 transition-colors line-clamp-1 text-xs md:text-sm">{property.title}</h4>
                      <p className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1 line-clamp-1">{property.address}</p>
                    </div>
                    <span className="text-emerald-600 font-black text-xs whitespace-nowrap">{property.price}</span>
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3 text-[9px] text-slate-400">
                      <span>Mã: <span className="text-slate-600 dark:text-white font-bold">{property.listing_code}</span></span>
                      <span className="max-sm:hidden">Xem: <span className="text-slate-600 dark:text-white font-bold">{property.views}</span></span>
                    </div>

                    <div className="flex items-center gap-1">
                      {property.status === "Đang chờ duyệt" ? (
                        <>
                          {/* Chờ duyệt - chỉ có thể xóa */}
                          <button 
                            onClick={() => handleDelete(property.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-all" 
                            title="Xóa">
                            <Trash2 className="size-3.5" />
                          </button>
                        </>
                      ) : property.status === "Đã ẩn" ? (
                        <>
                          {/* Đã ẩn - có thể hiển thị lại hoặc xóa */}
                          <button 
                            onClick={() => handleUpdateStatus(property.id, "Đang hiển thị")}
                            className="p-1.5 text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-md transition-all" 
                            title="Hiển thị">
                            <EyeOff className="size-3.5" />
                          </button>
                          <button 
                            onClick={() => handleDelete(property.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-all" 
                            title="Xóa">
                            <Trash2 className="size-3.5" />
                          </button>
                        </>
                      ) : (
                        <>
                          {/* Đang hiển thị hoặc Đã bán - đầy đủ chức năng */}
                          <Link 
                            href={`/bai-viet/${property.slug}`}
                            className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-md transition-all" 
                            title="Sửa"
                          >
                            <Edit2 className="size-3.5" />
                          </Link>
                          <button 
                            onClick={() => handleUpdateStatus(property.id, "Đã ẩn")}
                            className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-md transition-all" 
                            title="Ẩn tin">
                            <EyeOff className="size-3.5" />
                          </button>
                          <button 
                            onClick={() => handleUpdateStatus(property.id, "Đã bán")}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-all" 
                            title="Đã bán">
                            <CheckCircle2 className="size-3.5" />
                          </button>
                          <button 
                            onClick={() => handleDelete(property.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-all" 
                            title="Xóa">
                            <Trash2 className="size-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="py-24 flex flex-col items-center text-center">
              <div className="size-12 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-300 mb-4">
                <ListIcon className="size-6" />
              </div>
              <h5 className="font-bold text-slate-900 dark:text-white text-sm">Không tìm thấy tin đăng</h5>
              <p className="text-[11px] text-slate-500 mt-1 uppercase tracking-wider">Trạng thái này chưa có dữ liệu</p>
            </div>
          )}
        </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1.5 text-xs font-medium rounded-md border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              Trước
            </button>
            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md border ${
                  currentPage === page
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === pagination.totalPages}
              className="px-3 py-1.5 text-xs font-medium rounded-md border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              Sau
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
