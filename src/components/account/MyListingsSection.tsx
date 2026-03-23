"use client";

import { useState } from "react";
import { Edit2, EyeOff, CheckCircle2, Trash2, Filter, ChevronDown, List as ListIcon, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/src/store/authStore";
import { useNotificationStore } from "@/src/store/notificationStore";
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
  | "public" | "hidden" | "expired" | "sold" | "rejected" | "pending";

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
  "Đã bán": { label: "Đã bán", color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-900/20" },
  "Đã xong": { label: "Đã xong", color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-900/20" },
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
  const router = useRouter();
  const { accessToken, clearAuth } = useAuthStore();
  const addToast = useNotificationStore((state) => state.addToast);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [transactionType, setTransactionType] = useState("");
  const [loading, setLoading] = useState(true);
  const [listings, setListings] = useState<PropertyListing[]>([]);
  const [pagination, setPagination] = useState<PaginationState>({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [currentPage, setCurrentPage] = useState(1);

  const [confirmModal, setConfirmModal] = useState<{
    open: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  const loadListings = async (page = currentPage) => {
    if (!accessToken) return;
    try {
      setLoading(true);
      const res = await getMyListings(
        accessToken,
        filter === "all" ? "all" : filter,
        page,
        searchTerm || undefined,
        transactionType || undefined
      );

      if (res.statusCode === 401) {
        console.log('❌ Token invalid, redirecting to login');
        clearAuth();
        addToast('Phiên đăng nhập hết hạn, vui lòng đăng nhập lại', 'error');
        router.push('/dang-nhap');
        return;
      }

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
      } else if (!res.success) {
        addToast(res.error || 'Lỗi tải danh sách tin đăng', 'error');
      }
    } catch (_err) {
      console.error(_err);
      addToast('Lỗi kết nối, vui lòng thử lại', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadListings(1);
  }, [accessToken, filter, transactionType, clearAuth, addToast, router]);

  // Reload when navigating back from edit page
  useEffect(() => {
    const handlePopState = () => {
      loadListings(1);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [accessToken]);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    loadListings(newPage);
  };

  const handleSearch = () => {
    setCurrentPage(1);
    loadListings(1);
  };

  const handleRefresh = () => {
    setSearchTerm("");
    setTransactionType("");
    setFilter("all");
    setCurrentPage(1);
    loadListings(1);
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    if (!accessToken) return;
    try {
      setLoading(true);
      const res = await updateListingStatus(id, newStatus, accessToken);

      if (res.statusCode === 401) {
        clearAuth();
        addToast('Phiên đăng nhập hết hạn, vui lòng đăng nhập lại', 'error');
        router.push('/dang-nhap');
        return;
      }

      if (res.success) {
        setListings(prev => prev.map(l => l.id === id ? { ...l, status: newStatus as ListingStatus } : l));
        addToast(`Đã đổi trạng thái thành: ${newStatus}`, 'success');
      } else {
        addToast(res.error || 'Cập nhật thất bại', 'error');
      }
    } catch (_e) {
      addToast('Lỗi kết nối', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id: string) => {
    if (!accessToken) return;
    setConfirmModal({
      open: true,
      title: 'Xóa bài đăng',
      message: 'Bạn có chắc chắn muốn xóa bài đăng này? Hành động này không thể hoàn tác.',
      onConfirm: async () => {
        try {
          setLoading(true);
          const res = await deleteListingLocal(id, accessToken!);

          if (res.statusCode === 401) {
            clearAuth();
            addToast('Phiên đăng nhập hết hạn, vui lòng đăng nhập lại', 'error');
            router.push('/dang-nhap');
            return;
          }

          if (res.success) {
            setListings(prev => prev.filter(l => l.id !== id));
            addToast('Bài đăng đã bị xóa', 'success');
          } else {
            addToast(res.error || 'Xóa thất bại', 'error');
          }
        } catch (_e) {
          addToast('Lỗi kết nối', 'error');
        } finally {
          setLoading(false);
          setConfirmModal(null);
        }
      }
    });
  };

  const filteredListings = filter === "all" ? listings : listings.filter((l) => l.status === filter);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-visible relative">
      <div className="p-6 border-b border-slate-100 dark:border-slate-800 rounded-t-xl z-20 relative bg-white dark:bg-slate-900">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">Tin đăng của tôi</h1>
              <p className="text-sm text-slate-500 mt-1">Quản lý các bất động sản bạn đã đăng tin.</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleRefresh}
                disabled={loading}
                className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-black border transition-all duration-200 ${loading
                    ? "bg-slate-200 dark:bg-slate-700 text-slate-400 border-slate-200 dark:border-slate-700 cursor-not-allowed"
                    : "bg-white dark:bg-slate-800 text-slate-600 dark:text-white border-slate-200 dark:border-slate-700 hover:border-emerald-500"
                  }`}
              >
                <RefreshCw className={`size-3 ${loading ? 'animate-spin' : ''}`} />
                <span className="uppercase tracking-lighter">Làm mới</span>
              </button>

              <div className="relative">
                <button
                  onClick={() => setIsFilterOpen(!isFilterOpen)}
                  className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-black border transition-all duration-200 ${isFilterOpen
                      ? "bg-emerald-600 text-white border-emerald-600 shadow-md"
                      : "bg-white dark:bg-slate-800 text-slate-600 dark:text-white border-slate-200 dark:border-slate-700 hover:border-emerald-500"
                    }`}
                >
                  <Filter className="size-3" />
                  <span className="uppercase tracking-lighter">
                    {filter === 'all' ? 'Tất cả' : statusConfig[filter]?.label || filter}
                  </span>
                  <ChevronDown className={`size-3 transition-transform ${isFilterOpen ? 'rotate-180' : ''}`} />
                </button>

                {isFilterOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-60"
                      onClick={() => setIsFilterOpen(false)}
                    ></div>
                    <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-lg shadow-2xl z-70 overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top-right ring-1 ring-black/5">
                      <div className="p-1 space-y-0.5">
                        <button
                          onClick={() => { setFilter("all"); setIsFilterOpen(false); }}
                          className={`w-full flex items-center justify-between px-2.5 py-2 rounded-md text-[11px] font-bold transition-all ${filter === "all"
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
                            className={`w-full flex items-center justify-between px-2.5 py-2 rounded-md text-[11px] font-bold transition-all ${filter === s
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
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="Tìm kiếm theo tiêu đề..."
                className="pl-10 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-sm text-slate-900 dark:text-white w-full focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
            <select
              value={transactionType}
              onChange={(e) => {
                setTransactionType(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-sm text-slate-900 dark:text-white min-w-[140px]"
            >
              <option value="">Tất cả giao dịch</option>
              <option value="mua-ban">Mua bán</option>
              <option value="cho-thue">Cho thuê</option>
            </select>
            <button
              onClick={handleSearch}
              disabled={loading}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-sm font-medium transition-colors disabled:opacity-50"
            >
              Tìm kiếm
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 md:p-6 overflow-visible relative z-10 min-h-96">
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
                  <div className="relative w-full sm:w-32 h-24 shrink-0 rounded-md overflow-hidden bg-slate-100">
                    <img src={property.image} alt={property.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className={`absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded text-[9px] font-black uppercase ${statusConfig[property.status]?.bg || 'bg-slate-200'} ${statusConfig[property.status]?.color || 'text-slate-700'} backdrop-blur-md`}>
                      {statusConfig[property.status]?.label || property.status}
                    </div>
                  </div>

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
                        {property.status === "Bị từ chối" ? (
                          <button
                            onClick={() => handleDelete(property.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-all"
                            title="Xóa">
                            <Trash2 className="size-3.5" />
                          </button>
                        ) : property.status === "Đang chờ duyệt" ? (
                          <button
                            onClick={() => handleDelete(property.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-all"
                            title="Xóa">
                            <Trash2 className="size-3.5" />
                          </button>
                        ) : property.status === "Đã ẩn" ? (
                          <>
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
                className={`px-3 py-1.5 text-xs font-medium rounded-md border ${currentPage === page
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

      {confirmModal?.open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20">
          <div className="fixed inset-0 bg-black/50" onClick={() => setConfirmModal(null)}></div>
          <div className="relative bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-md w-full mx-4 p-6 border border-red-500">
            <div className="flex items-center gap-3 mb-4">
              <span className="material-symbols-outlined text-red-500 text-2xl">warning</span>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{confirmModal.title}</h3>
            </div>
            <p className="text-slate-600 dark:text-slate-300 mb-6">{confirmModal.message}</p>
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
  );
}
