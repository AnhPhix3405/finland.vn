"use client";

import React, { useState, useEffect } from "react";
import HashtagManagerModal from "@/src/components/admin/HashtagManagerModal.tsx";
import LocationSelector from "@/src/components/feature/LocationSelector";
import {
  getListings,
  updateListingStatus,
  deleteListing,
  type Listing
} from '@/src/app/modules/admin.listings.service';
import { useNotificationStore } from "@/src/store/notificationStore";

const STATUS_OPTIONS = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: 'Đang hiển thị', label: 'Đang hiển thị' },
  { value: 'Đang chờ duyệt', label: 'Đang chờ duyệt' },
  { value: 'Đã ẩn', label: 'Đã ẩn' },
  { value: 'Hết hạn', label: 'Hết hạn' },
  { value: 'Đã bán', label: 'Đã bán' },
  { value: 'Bị từ chối', label: 'Bị từ chối' },
];

const TRANSACTION_OPTIONS = [
  { value: '', label: 'Tất cả giao dịch' },
  { value: 'mua-ban', label: 'Mua bán' },
  { value: 'cho-thue', label: 'Cho thuê' },
];

export default function AdminArticleList() {
  const addToast = useNotificationStore((state) => state.addToast);

  const [isHashtagModalOpen, setIsHashtagModalOpen] = useState(false);
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Confirmation modal state
  const [confirmModal, setConfirmModal] = useState<{
    open: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  const [filters, setFilters] = useState({
    status: "",
    transaction: "",
    province: "",
    ward: ""
  });

  useEffect(() => {
    loadListings();
  }, []);

  const loadListings = async () => {
    try {
      setLoading(true);
      const result = await getListings(1, 50, {
        status: filters.status || undefined,
        transaction_type: filters.transaction || undefined,
        province: filters.province || undefined,
        ward: filters.ward || undefined,
        search: searchTerm || undefined,
      });

      if (result.success && result.data) {
        setListings(result.data);
      }
    } catch (error) {
      console.error('Error loading listings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = (listingId: string) => {
    setConfirmModal({
      open: true,
      title: 'Duyệt bài viết',
      message: 'Bạn có chắc chắn muốn duyệt bài viết này?',
      onConfirm: async () => {
        const result = await updateListingStatus(listingId, 'Đang hiển thị');
        if (result.success) {
          setListings(prev => prev.map(l => l.id === listingId ? { ...l, status: 'Đang hiển thị' } : l));
          addToast('Đã duyệt bài viết thành công!', 'success');
        } else {
          addToast('Lỗi: ' + (result.error || 'Không thể duyệt bài viết'), 'error');
        }
      }
    });
  };

  const handleReject = (listingId: string) => {
    setConfirmModal({
      open: true,
      title: 'Từ chối bài viết',
      message: 'Bạn có chắc chắn muốn từ chối bài viết này?',
      onConfirm: async () => {
        const result = await updateListingStatus(listingId, 'Bị từ chối');
        if (result.success) {
          setListings(prev => prev.map(l => l.id === listingId ? { ...l, status: 'Bị từ chối' } : l));
          addToast('Đã từ chối bài viết!', 'success');
        } else {
          addToast('Lỗi: ' + (result.error || 'Không thể từ chối bài viết'), 'error');
        }
      }
    });
  };

  const handleDelete = (listingId: string) => {
    setConfirmModal({
      open: true,
      title: 'Xóa bài viết',
      message: 'Bạn có chắc chắn muốn xóa vĩnh viễn bài viết này?',
      onConfirm: async () => {
        const result = await deleteListing(listingId);
        if (result.success) {
          setListings(prev => prev.filter(l => l.id !== listingId));
          addToast('Đã xóa bài viết thành công!', 'success');
        } else {
          addToast('Lỗi: ' + (result.error || 'Không thể xóa bài viết'), 'error');
        }
      }
    });
  };

  const handleToggleVisibility = async (listingId: string, currentStatus: string | null | undefined) => {
    const newStatus = currentStatus === 'Đã ẩn' ? 'Đang hiển thị' : 'Đã ẩn';
    const result = await updateListingStatus(listingId, newStatus);
    if (result.success) {
      setListings(prev => prev.map(l => l.id === listingId ? { ...l, status: newStatus } : l));
      addToast(newStatus === 'Đã ẩn' ? 'Đã ẩn bài viết!' : 'Đã hiển thị bài viết!', 'success');
    } else {
      addToast('Lỗi: ' + (result.error || 'Không thể thay đổi trạng thái'), 'error');
    }
  };

  const getStatusBadge = (status?: string | null) => {
    const styles: Record<string, string> = {
      'Đang hiển thị': 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50',
      'Đang chờ duyệt': 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800/50',
      'Đã ẩn': 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700',
      'Hết hạn': 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800/50',
      'Đã bán': 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800/50',
      'Đã xong': 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800/50',
      'Bị từ chối': 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800/50',
    };
    const style = styles[status || ''] || 'bg-gray-50 dark:bg-gray-900/20 text-gray-700 dark:text-gray-400 border-gray-200 dark:border-gray-800/50';
    return <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm border text-xs font-medium ${style}`}>{status || 'Chưa xác định'}</span>;
  };

  const formatDateTime = (dateStr: string | Date | undefined) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="p-6">
      <div className="w-full space-y-6">
        <div className="flex flex-col gap-3">
          {/* First row: Search and Status/Transaction filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 sm:flex-initial sm:w-64">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && loadListings()}
                className="pl-10 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-sm text-sm focus:ring-2 focus:ring-emerald-500 dark:text-white w-full"
                placeholder="Tìm theo tên tác giả hoặc mã tin..."
              />
            </div>
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-sm text-sm dark:text-white flex-1 sm:flex-initial"
            >
              {STATUS_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
            <select
              value={filters.transaction}
              onChange={(e) => setFilters(prev => ({ ...prev, transaction: e.target.value }))}
              className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-sm text-sm dark:text-white flex-1 sm:flex-initial"
            >
              {TRANSACTION_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </div>

          {/* Second row: Location filter and action buttons */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
            <div className="flex-1 sm:flex-initial sm:w-120">
              <LocationSelector
                selectedProvince={filters.province}
                onProvinceChange={(value) => setFilters(prev => ({ ...prev, province: value, ward: "" }))}
                selectedWard={filters.ward}
                onWardChange={(value) => setFilters(prev => ({ ...prev, ward: value }))}
                showLabels={false}
              />
            </div>
            <button
              onClick={() => loadListings()}
              disabled={loading}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-sm text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-lg">filter_list</span>
              Lọc
            </button>
            <button
              onClick={() => loadListings()}
              disabled={loading}
              className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 px-3 py-2 rounded-sm text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50"
              title="Làm mới dữ liệu"
            >
              <span className={`material-symbols-outlined text-lg ${loading ? 'animate-spin' : ''}`}>refresh</span>
            </button>
            <button
              onClick={() => setIsHashtagModalOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-sm text-sm font-medium flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">tag</span>
              Quản lý Hashtag
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-sm border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700">
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider w-1/3">Tiêu đề bài viết</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Ngày đăng</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Lượt xem</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Trạng thái</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {loading ? (
                  <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-500">Đang tải dữ liệu...</td></tr>
                ) : listings.length === 0 ? (
                  <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-500">Không có dữ liệu</td></tr>
                ) : (
                  listings.map(listing => (
                    <tr key={listing.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium line-clamp-2">{listing.title}</p>
                        <p className="text-xs text-slate-500 mt-1">
                          {listing.transaction_types?.name || ''} | {listing.property_types?.name || ''} | Môi giới: {listing.brokers.full_name}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-sm whitespace-nowrap">{formatDateTime(listing.created_at)}</td>
                      <td className="px-6 py-4 text-sm">{(listing.views_count || 0).toLocaleString('vi-VN')}</td>
                      <td className="px-6 py-4">{getStatusBadge(listing.status)}</td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        {/* Approve - chỉ hiện khi đang chờ duyệt */}
                        {listing.status === 'Đang chờ duyệt' && (
                          <button onClick={() => handleApprove(listing.id)} className="text-emerald-500 hover:text-emerald-700 p-1" title="Duyệt bài">
                            <span className="material-symbols-outlined text-lg">check_circle</span>
                          </button>
                        )}
                        {/* Reject - hiện khi đang hiển thị hoặc đang chờ duyệt */}
                        {(listing.status === 'Đang hiển thị' || listing.status === 'Đang chờ duyệt') && (
                          <button onClick={() => handleReject(listing.id)} className="text-orange-400 hover:text-orange-600 p-1 ml-1" title="Từ chối">
                            <span className="material-symbols-outlined text-lg">cancel</span>
                          </button>
                        )}
                        {/* Delete */}
                        <button onClick={() => handleDelete(listing.id)} className="text-slate-400 hover:text-red-600 p-1 ml-1" title="Xóa vĩnh viễn">
                          <span className="material-symbols-outlined text-lg">delete</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <HashtagManagerModal isOpen={isHashtagModalOpen} onClose={() => setIsHashtagModalOpen(false)} />

        {/* Confirmation Modal */}
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
    </div>
  );
}
