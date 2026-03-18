'use client';
import Link from "next/link";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAdminStore } from "@/src/store/adminStore";
import { useNotificationStore } from "@/src/store/notificationStore";
import { fetchWithRetry } from "@/src/lib/api/fetch-with-retry";
import { useAdminAuth } from "@/src/hooks/useAdminAuth";
import LocationSelector from "@/src/components/feature/LocationSelector";

interface Broker {
  id: string;
  full_name: string;
  phone: string;
  email: string | null;
  avatar_url: string | null;
  province: string | null;
  ward: string | null;
  address: string | null;
  slug: string | null;
  is_active: boolean;
}

export default function AdminBrokerList() {
  const router = useRouter();
  const adminToken = useAdminStore((state) => state.accessToken);
  const addToast = useNotificationStore((state) => state.addToast);
  
  useAdminAuth(() => {
    router.push('/admin/login');
  });
  
  const [brokers, setBrokers] = useState<Broker[]>([]);
  const [loadingBrokers, setLoadingBrokers] = useState(false);
  const [operatingId, setOperatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [confirmModal, setConfirmModal] = useState<{
    open: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);
  const [filters, setFilters] = useState({
    province: "",
    ward: ""
  });
  
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  const fetchBrokers = async (page = 1) => {
    setLoadingBrokers(true);
    try {
      const params = new URLSearchParams();
      params.set('page', page.toString());
      params.set('limit', pagination.limit.toString());
      if (filters.province) params.set('province', filters.province);
      if (filters.ward) params.set('ward', filters.ward);
      if (searchTerm) params.set('search', searchTerm);
      
      const res = await fetchWithRetry(`/api/admin/brokers?${params.toString()}`, {
        token: adminToken || undefined,
        isAdmin: true,
      });
      
      if (res.status === 401) {
        useAdminStore.getState().clearAuth();
        addToast('Phiên đăng nhập hết hạn', 'error');
        router.push('/admin/login');
        return;
      }
      
      const json = await res.json();
      if (json.success) {
        setBrokers(json.data);
        if (json.pagination) {
          setPagination(json.pagination);
        }
      }
    } catch (err) {
      console.error('Lỗi khi tải danh sách môi giới:', err);
      setError('Không thể tải danh sách môi giới');
    } finally {
      setLoadingBrokers(false);
    }
  };

  useEffect(() => {
    fetchBrokers();
  }, []);

  const handleSearch = () => {
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchBrokers(1);
  };

  const handlePageChange = (page: number) => {
    if (page < 1 || page > pagination.totalPages) return;
    setPagination(prev => ({ ...prev, page }));
    fetchBrokers(page);
  };

  const handleToggleLock = (broker: Broker) => {
    if (!adminToken) {
      router.push('/admin/login');
      return;
    }

    const action = broker.is_active ? 'lock' : 'unlock';
    const confirmText = broker.is_active
      ? `Bạn có chắc chắn muốn khóa tài khoản ${broker.full_name}?`
      : `Bạn có chắc chắn muốn mở khóa tài khoản ${broker.full_name}?`;

    setConfirmModal({
      open: true,
      title: broker.is_active ? 'Khóa tài khoản' : 'Mở khóa tài khoản',
      message: confirmText,
      onConfirm: () => performToggleLock(broker, action)
    });
  };

  const performToggleLock = async (broker: Broker, action: string) => {
    setOperatingId(broker.id);
    try {
      const res = await fetchWithRetry(`/api/admin/brokers/${broker.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action }),
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
        setBrokers(brokers.map(b =>
          b.id === broker.id ? { ...b, is_active: !b.is_active } : b
        ));
        setError(null);
        const successMsg = broker.is_active ? 'Khóa tài khoản thành công!' : 'Mở khóa tài khoản thành công!';
        addToast(successMsg, 'success');
      } else {
        const errorMsg = result.error || 'Lỗi khi cập nhật trạng thái';
        setError(errorMsg);
        addToast(errorMsg, 'error');
      }
    } catch (err) {
      console.error('Lỗi khi cập nhật trạng thái:', err);
      const errorMsg = 'Không thể kết nối đến máy chủ';
      setError(errorMsg);
      addToast(errorMsg, 'error');
    } finally {
      setOperatingId(null);
    }
  };

  const handleDeleteBroker = (broker: Broker) => {
    if (!adminToken) {
      router.push('/admin/login');
      return;
    }

    const confirmText = `Bạn có chắc chắn muốn xóa tài khoản môi giới ${broker.full_name} (${broker.phone})?\n\nHành động này không thể hoàn tác.`;

    setConfirmModal({
      open: true,
      title: 'Xóa tài khoản môi giới',
      message: confirmText,
      onConfirm: () => performDeleteBroker(broker)
    });
  };

  const performDeleteBroker = async (broker: Broker) => {
    setOperatingId(broker.id);
    try {
      const res = await fetchWithRetry(`/api/admin/brokers/${broker.id}`, {
        method: 'DELETE',
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
        setBrokers(brokers.filter(b => b.id !== broker.id));
        setError(null);
        addToast('Xóa tài khoản môi giới thành công!', 'success');
      } else {
        const errorMsg = result.error || 'Lỗi khi xóa tài khoản';
        setError(errorMsg);
        addToast(errorMsg, 'error');
      }
    } catch (err) {
      console.error('Lỗi khi xóa tài khoản:', err);
      const errorMsg = 'Không thể kết nối đến máy chủ';
      setError(errorMsg);
      addToast(errorMsg, 'error');
    } finally {
      setOperatingId(null);
    }
  };

  const renderRow = (broker: Broker) => (
    <tr key={broker.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
      <td className="px-6 py-4">
        <div className="h-10 w-10 border border-slate-200 dark:border-slate-700 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex items-center justify-center">
          {broker.avatar_url ? (
            <img alt={broker.full_name} className="w-full h-full object-cover" src={broker.avatar_url} />
          ) : (
            <span className="text-slate-500 font-bold text-sm">{broker.full_name.charAt(0)}</span>
          )}
        </div>
      </td>
      <td className="px-6 py-4">
        <p className="text-sm text-slate-900 dark:text-slate-100 font-bold">{broker.full_name}</p>
      </td>
      <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">{broker.phone}</td>
      <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">
        {[broker.address, broker.ward, broker.province].filter(Boolean).join(', ') || '—'}
      </td>
      <td className="px-6 py-4 text-sm">
        {broker.is_active ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50 text-xs font-medium">
            Hoạt động
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800/50 text-xs font-medium">
            Bị khóa
          </span>
        )}
      </td>
      <td className="px-6 py-4 text-right whitespace-nowrap">
        <button
          onClick={() => handleToggleLock(broker)}
          disabled={operatingId === broker.id}
          aria-label={broker.is_active ? "Khóa tài khoản" : "Mở khóa tài khoản"}
          className="text-orange-400 hover:text-orange-600 dark:hover:text-orange-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors p-1 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          title={broker.is_active ? "Khóa tài khoản" : "Mở khóa tài khoản"}
        >
          <span className="material-symbols-outlined text-lg" aria-hidden="true">{broker.is_active ? 'lock' : 'lock_open'}</span>
        </button>
        <button
          onClick={() => handleDeleteBroker(broker)}
          disabled={operatingId === broker.id}
          aria-label="Xóa môi giới"
          className="text-slate-400 hover:text-red-600 dark:hover:text-red-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors p-1 ml-1 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          title="Xóa"
        >
          <span className="material-symbols-outlined text-lg" aria-hidden="true">delete</span>
        </button>
      </td>
    </tr>
  );

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

        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
              <input
                className="pl-10 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-sm text-sm focus:ring-primary focus:border-primary dark:text-white w-full sm:w-80 placeholder-slate-400"
                placeholder="Tìm theo tên, số điện thoại..."
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && fetchBrokers()}
              />
            </div>
            <div className="w-120">
              <LocationSelector
                showLabels={false}
                selectedProvince={filters.province}
                onProvinceChange={(value) => setFilters(prev => ({ ...prev, province: value, ward: "" }))}
                selectedWard={filters.ward}
                onWardChange={(value) => setFilters(prev => ({ ...prev, ward: value }))}
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchBrokers()}
              disabled={loadingBrokers}
              className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 px-3 py-2 rounded-sm text-sm font-medium flex items-center gap-2 disabled:opacity-50"
              title="Làm mới"
            >
              <span className={`material-symbols-outlined text-lg ${loadingBrokers ? 'animate-spin' : ''}`}>refresh</span>
            </button>
            <button
              onClick={() => fetchBrokers()}
              disabled={loadingBrokers}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-sm text-sm font-medium flex items-center gap-2 disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-lg">filter_list</span>
              Lọc
            </button>
          </div>

        </div>

        <div className="bg-white dark:bg-slate-800 rounded-sm border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700">
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider w-16">Ảnh</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Họ và Tên</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Số điện thoại</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Khu vực hoạt động</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Trạng thái</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {loadingBrokers ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-6 text-center text-sm text-slate-400 dark:text-slate-500">
                      <span className="inline-flex items-center gap-2">
                        <span className="material-symbols-outlined text-base animate-spin" aria-hidden="true">progress_activity</span>
                        Đang tải môi giới...
                      </span>
                    </td>
                  </tr>
                ) : brokers.map((b) =>
                  renderRow(b)
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex justify-between items-center mt-4">
          <div className="text-sm text-slate-500">
            Hiển thị {(pagination.page - 1) * pagination.limit + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} của {pagination.total} môi giới
          </div>
          <div className="flex justify-end items-center gap-1">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page <= 1 || loadingBrokers}
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
              disabled={pagination.page >= pagination.totalPages || loadingBrokers}
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