'use client';
import Link from "next/link";
import React, { useState, useEffect } from "react";
import { useAuthStore } from "@/src/store/authStore";

interface Broker {
  id: string;
  full_name: string;
  phone: string;
  email: string | null;
  avatar_url: string | null;
  working_area: string | null;
  specialization: string | null;
  slug: string | null;
  is_active: boolean;
}

const MOCK_BROKERS = [
  {
    id: 'mock_1',
    full_name: 'Nguyễn Văn Nam',
    phone: '0901 234 567',
    working_area: 'Quận 2, TP.HCM',
    avatar_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC9Zy9T23JlMs6clxA8w3_e9InmK4IoD_B1ccL9qigX9BdlKu1MEJhVY9y1W92_DIFZOz8EThzgcltxG8GHT-kRy6n9VE0eel7fivwcJiihAlcT3RTBtVBUQ5HjVIqOEyXpSuYyDRfGEEYRkmc8dWuYf-0yyZVZQEVKDaKe0F0YVL62xslVUaQPIwi6wlCrd7KT4HQOid7McvEcgYkDx94BVAAlIAvTTKifktrK7OGhX8t_KodLEtyYBeYhhos9DPwTRfP0aXy9e8pg',
    slug: 'demo',
    is_active: true
  },
  {
    id: 'mock_2',
    full_name: 'Trần Thị Minh',
    phone: '0912 345 678',
    working_area: 'Thanh Xuân, Hà Nội',
    avatar_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDjN8HsIdKsWlAC3e5UUEnQD2WwioKW11PCwPmSYJT-g9P19TjDZihMTA6ZpvrLuEdsv2baeNt_WUcfGWg8TVETZLR2kVyolnu44DYAxJ2b0jR6ONxGO9BtjG0fTzCffoNX9jv0sKjsdfWH9TySDCGUUNssHAp790t7Fvrxt6ITCO1Zo93ZPexfyFF_9QlWqIZI5bbu_8JzRHlIUkXi0FT9_80yWpFSovPVPeQdGKEDRHX_1J3_BKJ8O983CYn0ejvHFnJ3gGOBnkyo',
    slug: 'demo',
    is_active: false // Blocked mock
  },
  {
    id: 'mock_3',
    full_name: 'Lê Hoàng Long',
    phone: '0988 777 999',
    working_area: 'Sơn Trà, Đà Nẵng',
    avatar_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCF7_a9QO3ZTe9AiE0RaqZHk4WWVdF8JV_exc_ZElD2Fa5J2xHahPnCEuHsk91hG_7UTXvzhgjeVzkw696xse4o5FTbNDEDYlyxRAX5diyLuzRi47pYS4sfljywyqy7iuHKx2DTu0wj0-flpf2Ty4FTv5cwMaXclLpXUR0ix-DICxoMjwNBPBFerF2eXQXOljYKsWq4-ZC6VnWib1MRPnTERY-0rWX5tKD3yNdpfJft8EbbihGoZSdPaYO0_oRIjKYeaoibejKbesXn',
    slug: 'demo',
    is_active: true
  }
];

export default function AdminBrokerList() {
  const adminToken = useAuthStore((state) => state.accessToken);
  const [brokers, setBrokers] = useState<Broker[]>([]);
  const [loadingBrokers, setLoadingBrokers] = useState(false);
  const [operatingId, setOperatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchBrokers = async () => {
    setLoadingBrokers(true);
    try {
      const res = await fetch('/api/brokers?limit=100');
      const json = await res.json();
      if (json.success) {
        setBrokers(json.data);
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

  const handleToggleLock = async (broker: Broker) => {
    if (!adminToken) {
      setError('Cần đăng nhập admin để thực hiện hành động này');
      return;
    }

    const action = broker.is_active ? 'lock' : 'unlock';
    const confirmText = broker.is_active 
      ? `Bạn chắc chắn muốn khóa tài khoản ${broker.full_name}?` 
      : `Bạn chắc chắn muốn mở khóa tài khoản ${broker.full_name}?`;

    if (!window.confirm(confirmText)) {
      return;
    }

    setOperatingId(broker.id);
    try {
      const res = await fetch(`/api/admin/brokers/${broker.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({ action })
      });

      const result = await res.json();

      if (result.success) {
        setBrokers(brokers.map(b => 
          b.id === broker.id ? { ...b, is_active: !b.is_active } : b
        ));
        setError(null);
      } else {
        setError(result.error || 'Lỗi khi cập nhật trạng thái');
      }
    } catch (err) {
      console.error('Lỗi khi cập nhật trạng thái:', err);
      setError('Không thể kết nối đến máy chủ');
    } finally {
      setOperatingId(null);
    }
  };

  const handleDeleteBroker = async (broker: Broker) => {
    if (!adminToken) {
      setError('Cần đăng nhập admin để thực hiện hành động này');
      return;
    }

    const confirmText = `Bạn chắc chắn muốn xóa tài khoản môi giới ${broker.full_name} (${broker.phone})?\n\nHành động này không thể hoàn tác.`;

    if (!window.confirm(confirmText)) {
      return;
    }

    setOperatingId(broker.id);
    try {
      const res = await fetch(`/api/admin/brokers/${broker.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      });

      const result = await res.json();

      if (result.success) {
        setBrokers(brokers.filter(b => b.id !== broker.id));
        setError(null);
      } else {
        setError(result.error || 'Lỗi khi xóa tài khoản');
      }
    } catch (err) {
      console.error('Lỗi khi xóa tài khoản:', err);
      setError('Không thể kết nối đến máy chủ');
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
      <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">{broker.working_area ?? '—'}</td>
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
              />
            </div>
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
                {/* Mock rows */}
                {MOCK_BROKERS.map((b) =>
                  renderRow(b as Broker)
                )}

                {/* API rows */}
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

        <div className="flex justify-end items-center gap-2 mt-4">
          <button className="px-3 py-1.5 min-w-[32px] rounded-sm bg-emerald-600 text-white text-sm font-medium flex items-center justify-center">1</button>
          <button className="px-3 py-1.5 min-w-[32px] rounded-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 text-sm font-medium transition-colors flex items-center justify-center">2</button>
          <button className="px-3 py-1.5 min-w-[32px] rounded-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 text-sm font-medium transition-colors flex items-center justify-center">3</button>
          <span className="text-slate-400 dark:text-slate-500 mx-1">...</span>
          <button className="px-3 py-1.5 rounded-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 text-sm font-medium transition-colors flex items-center justify-center">Tiếp</button>
        </div>
      </div>
    </div>
  );
}