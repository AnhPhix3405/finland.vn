"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Phone, MapPin, FileText, Search } from "lucide-react";
import LocationSelector from "@/src/components/feature/LocationSelector";
import { Pagination } from "@/src/components/shared/Pagination";

interface Broker {
  id: string;
  full_name: string;
  avatar_url: string | null;
  bio: string | null;
  province: string | null;
  ward: string | null;
  address: string | null;
  phone: string;
  _count?: {
    listings: number;
  };
}

export default function BrokerList() {
  const [brokers, setBrokers] = useState<Broker[]>([]);
  const [loading, setLoading] = useState(true);

  // Search state
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Filter state
  const [province, setProvince] = useState("");
  const [ward, setWard] = useState("");

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });

  const fetchBrokers = async (search: string = "", prov: string = "", wd: string = "", page: number = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("limit", "20");
      params.append("page", page.toString());
      params.append("is_active", "true");
      if (search) params.append("search", search);
      if (prov) params.append("province", prov);
      if (wd) params.append("ward", wd);

      const res = await fetch(`/api/brokers?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setBrokers(data.data);
        if (data.pagination) {
          setPagination({
            page: data.pagination.page,
            limit: data.pagination.limit,
            total: data.pagination.total,
            totalPages: data.pagination.totalPages,
          });
        }
      }
    } catch (error) {
      console.error("Error fetching brokers:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchBrokers();
  }, []);

  const handleSearch = () => {
    setSearchQuery(searchInput);
    fetchBrokers(searchInput, province, ward, 1);
  };

  const handleFilterChange = () => {
    fetchBrokers(searchQuery, province, ward, 1);
  };

  const handlePageChange = (newPage: number) => {
    fetchBrokers(searchQuery, province, ward, newPage);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="mb-6">
        <nav aria-label="Breadcrumb" className="flex text-sm text-slate-500 dark:text-slate-400 mb-2">
          <ol className="inline-flex items-center space-x-1 md:space-x-2">
            <li className="inline-flex items-center">
              <Link className="hover:text-primary transition-colors" href="/">Trang chủ</Link>
            </li>
            <li>
              <div className="flex items-center">
                <span className="mx-1">/</span>
                <span className="text-slate-700 dark:text-slate-200 font-medium">Danh sách môi giới</span>
              </div>
            </li>
          </ol>
        </nav>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white uppercase">Danh sách Môi giới chuyên nghiệp</h1>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-800 p-4 border border-gray-200 dark:border-slate-700 mb-6 rounded-sm shadow-sm">
        <div className="flex flex-col lg:flex-row gap-3 lg:items-end">
          {/* Search - bên tr ái */}
          <div className="flex gap-2 w-full lg:w-auto flex-1">
            <div className="relative flex-1">
              <div className="absolute inset-y-1 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full h-10 pl-9 pr-4 border border-slate-300 dark:border-slate-600 rounded-sm text-sm focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 bg-white dark:bg-slate-900 dark:text-white placeholder-slate-500"
                placeholder="Tìm tên hoặc SĐT..."
              />
            </div>
            <button
              onClick={handleSearch}
              className="px-4 sm:px-8 h-10 shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-sm transition-colors"
            >
              Tìm
            </button>
            <button
              onClick={() => fetchBrokers(searchQuery, province, ward, 1)}
              disabled={loading}
              className="w-10 h-10 shrink-0 flex items-center justify-center bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-sm rounded-sm transition-colors disabled:opacity-50"
              title="Làm mới"
            >
              <span className={`material-symbols-outlined text-lg ${loading ? 'animate-spin' : ''}`}>refresh</span>
            </button>
            {/* Filter Button */}
            <button
              onClick={handleFilterChange}
              className="px-4 sm:px-6 h-10 shrink-0 border border-emerald-600 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-sm font-medium rounded-sm transition-colors"
            >
              Lọc
            </button>
          </div>

          <div className="flex flex-col lg:flex-row lg:ml-auto w-full lg:w-auto gap-3 lg:gap-2">
            {/* Location Selector - bên phải */}
            <div className="w-full lg:w-[480px]">
              <LocationSelector
                showLabels={false}
                selectedProvince={province}
                onProvinceChange={(value) => {
                  setProvince(value);
                  setWard("");
                }}
                selectedWard={ward}
                onWardChange={(value) => setWard(value)}
              />
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
          <span className="ml-3 text-slate-600 dark:text-slate-400">Đang tải...</span>
        </div>
      ) : brokers.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-slate-500 dark:text-slate-400">
            {(searchQuery || province || ward) ? "Không tìm thấy môi giới nào phù hợp." : "Chưa có môi giới nào."}
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {brokers.map((broker) => (
              <div key={broker.id} className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 p-4 rounded-sm shadow-sm flex flex-col sm:flex-row gap-4 hover:border-emerald-500 transition-colors group">
                {/* Avatar */}
                <div className="flex-shrink-0">
                  <img
                    alt={broker.full_name}
                    className="w-24 h-24 object-cover border border-slate-200 dark:border-slate-600 rounded-sm"
                    src={broker.avatar_url || "/imgs/no-avatar.jpg"}
                  />
                </div>

                {/* Info */}
                <div className="flex-grow flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 transition-colors">
                        {broker.full_name}
                      </h2>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800">
                        {broker._count?.listings || 0} bài đăng
                      </span>
                    </div>
                    {broker.bio && (
                      <div className="flex items-start gap-2 mt-2">
                        <FileText className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                        <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                          {broker.bio}
                        </p>
                      </div>
                    )}
                    {(broker.address || broker.ward || broker.province) && (
                      <div className="flex items-start gap-2 mt-2">
                        <MapPin className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                        <div className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                          {broker.address && <span>{broker.address}, </span>}
                          {broker.ward && <span>{broker.ward}, </span>}
                          {broker.province}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex-shrink-0 flex sm:flex-col justify-end gap-2 mt-4 sm:mt-0 sm:min-w-[160px]">
                  <button
                    onClick={() => window.location.href = `tel:${broker.phone}`}
                    className="flex-1 sm:flex-none flex items-center justify-center px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-sm transition-colors"
                  >
                    <Phone className="w-4 h-4 mr-2" />
                    {broker.phone}
                  </button>
                  <a
                    href={`https://zalo.me/${broker.phone}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 sm:flex-none flex items-center justify-center px-4 py-2.5 bg-[#0068FF] hover:bg-[#0052CC] text-white text-sm font-medium rounded-sm transition-colors"
                  >
                    <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.098.547 4.078 1.52 5.78L0 24l6.22-1.52A11.944 11.944 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 2.182c5.38 0 9.818 4.438 9.818 9.818 0 2.098-.547 4.078-1.52 5.78L12 22l-5.298-1.22A11.944 11.944 0 012.182 12c0-5.38 4.438-9.818 9.818-9.818z" />
                      <path d="M17.5 14c-1.42 0-2.732.546-3.734 1.464l-1.042-1.042a.545.545 0 00-.768 0l-1.456 1.456a.545.545 0 01-.768 0l-1.042-1.042a.545.545 0 00-.768 0l-.52.52a.545.545 0 01-.768 0l-1.04-1.04a.545.545 0 00-.768 0L3.5 14.5c-.3.3-.3.786 0 1.086l1.04 1.04c.3.3.786.3 1.086 0l.52-.52c.3-.3.786-.3 1.086 0l1.04 1.04c.3.3.786.3 1.086 0l1.042-1.042c.3-.3.786-.3 1.086 0l1.456 1.456c.3.3.786.3 1.086 0l1.042-1.042c.3-.3.3-.786 0-1.086l-.52-.52c-.3-.3-.3-.786 0-1.086l1.04-1.04c.3-.3.3-.786 0-1.086l-.52-.52c-.3-.3-.3-.786 0-1.086z" />
                    </svg>
                    Zalo
                  </a>
                </div>
              </div>
            ))}
          </div>

          {brokers.length > 0 && pagination.totalPages > 1 && (
            <div className="mt-6 flex justify-center">
              <Pagination
                currentPage={pagination.page}
                totalPages={pagination.totalPages}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
