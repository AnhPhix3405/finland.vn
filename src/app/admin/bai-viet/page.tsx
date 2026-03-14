"use client";

import React, { useState, useEffect } from "react";
import HashtagManagerModal from "@/src/components/admin/HashtagManagerModal.tsx";
import { 
  getListings, 
  updateListingStatus, 
  deleteListing, 
  type Listing, 
  type ListingStatus 
} from '@/src/app/modules/admin.listings.service';

type ArticleStatus = 'published' | 'hidden' | 'expired' | 'sold' | 'rejected';

interface Article {
  id: string;
  title: string;
  category: string;
  publishedAt: string;
  views: number;
  status: ArticleStatus;
}

const MOCK_ARTICLES: Article[] = [
  {
    id: '1',
    title: 'Xu hướng giá bất động sản ven đô năm 2026',
    category: 'Tin tức thị trường',
    publishedAt: '24/10/2024',
    views: 1250,
    status: 'published'
  },
  {
    id: '2',
    title: 'Hướng dẫn tra cứu bản đồ quy hoạch chi tiết',
    category: 'Hướng dẫn quy hoạch',
    publishedAt: '22/10/2024',
    views: 850,
    status: 'hidden'
  },
  {
    id: '3',
    title: 'Căn hộ chung cư quận 9 giá tốt',
    category: 'Tin tức thị trường',
    publishedAt: '15/09/2024',
    views: 420,
    status: 'expired'
  },
  {
    id: '4',
    title: 'Bán nhà mặt phố Nguyễn Trãi gấp',
    category: 'Tin tức thị trường',
    publishedAt: '10/10/2024',
    views: 2100,
    status: 'sold'
  },
  {
    id: '5',
    title: 'Lừa đảo mua bán đất nền ven biển',
    category: 'Cảnh báo',
    publishedAt: '18/10/2024',
    views: 150,
    status: 'rejected'
  }
];

export default function AdminArticleList() {
  const [isHashtagModalOpen, setIsHashtagModalOpen] = useState(false);
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Load listings on component mount
  useEffect(() => {
    loadListings();
  }, []);

  const loadListings = async () => {
    try {
      setLoading(true);
      const response = await getListings(1, 50); // Get more listings for admin view
      if (response.success && response.data) {
        setListings(response.data);
      } else {
        console.error('Failed to load listings:', response.error);
      }
    } catch (error) {
      console.error('Error loading listings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (listingId: string) => {
    try {
      const result = await updateListingStatus(listingId, 'Đang hiển thị');
      if (result.success) {
        // Update local state
        setListings(prev => prev.map(listing => 
          listing.id === listingId 
            ? { ...listing, status: 'Đang hiển thị' }
            : listing
        ));
        alert('Đã duyệt bài viết thành công!');
      } else {
        alert('Lỗi: ' + (result.error || 'Không thể duyệt bài viết'));
      }
    } catch (error) {
      console.error('Error approving listing:', error);
      alert('Có lỗi xảy ra khi duyệt bài viết');
    }
  };

  const handleReject = async (listingId: string) => {
    try {
      const result = await updateListingStatus(listingId, 'Bị từ chối');
      if (result.success) {
        // Update local state
        setListings(prev => prev.map(listing => 
          listing.id === listingId 
            ? { ...listing, status: 'Bị từ chối' }
            : listing
        ));
        alert('Đã từ chối bài viết!');
      } else {
        alert('Lỗi: ' + (result.error || 'Không thể từ chối bài viết'));
      }
    } catch (error) {
      console.error('Error rejecting listing:', error);
      alert('Có lỗi xảy ra khi từ chối bài viết');
    }
  };

  const handleDelete = async (listingId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa vĩnh viễn bài viết này?')) {
      return;
    }

    try {
      const result = await deleteListing(listingId);
      if (result.success) {
        // Remove from local state
        setListings(prev => prev.filter(listing => listing.id !== listingId));
        alert('Đã xóa bài viết thành công!');
      } else {
        alert('Lỗi: ' + (result.error || 'Không thể xóa bài viết'));
      }
    } catch (error) {
      console.error('Error deleting listing:', error);
      alert('Có lỗi xảy ra khi xóa bài viết');
    }
  };

  const getStatusBadge = (status?: string | null) => {
    const statusValue = status as ListingStatus | ArticleStatus;
    
    // Handle ListingStatus values
    switch (statusValue) {
      case 'Đang hiển thị':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50 text-xs font-medium">
            Đang hiển thị
          </span>
        );
      case 'Đang chờ duyệt':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800/50 text-xs font-medium">
            Đang chờ duyệt
          </span>
        );
      case 'Đã ẩn':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 text-xs font-medium">
            Đã ẩn
          </span>
        );
      case 'Hết hạn':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-800/50 text-xs font-medium">
            Hết hạn
          </span>
        );
      case 'Đã bán':
      case 'Đã xong':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800/50 text-xs font-medium">
            {statusValue}
          </span>
        );
      case 'Bị từ chối':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800/50 text-xs font-medium">
            Bị từ chối
          </span>
        );
      // Handle ArticleStatus values for mock data compatibility
      case 'published':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50 text-xs font-medium">
            Đang hiển thị
          </span>
        );
      case 'hidden':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 text-xs font-medium">
            Đã ẩn
          </span>
        );
      case 'expired':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-800/50 text-xs font-medium">
            Hết hạn
          </span>
        );
      case 'sold':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800/50 text-xs font-medium">
            Đã bán/xong
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800/50 text-xs font-medium">
            Bị từ chối
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm bg-gray-50 dark:bg-gray-900/20 text-gray-700 dark:text-gray-400 border border-gray-200 dark:border-gray-800/50 text-xs font-medium">
            {statusValue || 'Chưa xác định'}
          </span>
        );
    }
  };

  // Filter listings based on search term
  const filteredListings = listings.filter(listing => 
    listing.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    listing.brokers.full_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Combine with mock articles for demonstration
  const combinedData = [
    ...MOCK_ARTICLES,
    ...filteredListings.map(listing => ({
      id: listing.id,
      title: listing.title,
      category: listing.property_types?.name || 'Không xác định',
      publishedAt: listing.created_at ? new Date(listing.created_at).toLocaleDateString('vi-VN') : '',
      views: Math.floor(Math.random() * 1000), // Mock views for now
      status: mapListingStatusToArticleStatus(listing.status),
      isListing: true, // Flag to identify real listings
      listingData: listing // Store original listing data
    }))
  ];

  // Helper function to map listing status to article status for compatibility
  function mapListingStatusToArticleStatus(status?: string | null): ArticleStatus {
    switch(status) {
      case 'Đang hiển thị': return 'published';
      case 'Đã ẩn': return 'hidden';
      case 'Hết hạn': return 'expired';
      case 'Đã bán':
      case 'Đã xong': return 'sold';
      case 'Bị từ chối': return 'rejected';
      default: return 'hidden';
    }
  }

  const renderRow = (article: Article & { isListing?: boolean; listingData?: Listing }) => (
    <tr key={article.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
      <td className="px-6 py-4">
        <div>
          <p className="text-sm text-slate-900 dark:text-slate-100 font-medium line-clamp-2">{article.title}</p>
          {article.isListing && article.listingData && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Môi giới: {article.listingData.brokers.full_name} | {article.listingData.province}, {article.listingData.ward}
            </p>
          )}
        </div>
      </td>
      <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">
        {article.publishedAt}
      </td>
      <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">
        {article.views.toLocaleString('vi-VN')}
      </td>
      <td className="px-6 py-4">
        {article.isListing ? getStatusBadge(article.listingData?.status) : getStatusBadge(article.status)}
      </td>
      <td className="px-6 py-4 text-right whitespace-nowrap">
        {/* Only show action buttons for real listings */}
        {article.isListing ? (
          <>
            {/* Approve Button */}
            <button 
              onClick={() => handleApprove(article.id)}
              aria-label="Duyệt bài viết đang hiển thị"
              className="text-emerald-500 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors p-1 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500" 
              title="Duyệt bài / Đang hiển thị"
            >
              <span className="material-symbols-outlined text-lg" aria-hidden="true">check_circle</span>
            </button>
            {/* Reject Button */}
            <button 
              onClick={() => handleReject(article.id)}
              aria-label="Từ chối bài viết"
              className="text-orange-400 hover:text-orange-600 dark:hover:text-orange-400 transition-colors p-1 ml-1 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500" 
              title="Từ chối"
            >
              <span className="material-symbols-outlined text-lg" aria-hidden="true">cancel</span>
            </button>
            {/* Delete Button */}
            <button 
              onClick={() => handleDelete(article.id)}
              aria-label="Xóa vĩnh viễn bài viết"
              className="text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors p-1 ml-1 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500" 
              title="Xóa vĩnh viễn"
            >
              <span className="material-symbols-outlined text-lg" aria-hidden="true">delete</span>
            </button>
          </>
        ) : (
          <span className="text-xs text-slate-400">Mock data</span>
        )}
      </td>
    </tr>
  );

  return (
    <div className="p-6">
      <div className="w-full space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <div className="relative">
              <label htmlFor="search-article" className="sr-only">Tìm kiếm bài viết</label>
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg" aria-hidden="true">search</span>
              <input
                id="search-article"
                name="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                autoComplete="off"
                className="pl-10 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-sm text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:border-emerald-500 dark:text-white w-full sm:w-64 placeholder-slate-400"
                placeholder="Tìm kiếm bài viết..."
                type="text"
              />
            </div>
          </div>
          <button
            onClick={() => setIsHashtagModalOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-sm text-sm font-medium flex items-center gap-2 transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-1"
          >
            <span className="material-symbols-outlined text-sm" aria-hidden="true">tag</span>
            <span>Quản lý Hashtag</span>
          </button>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-sm border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700">
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider w-1/3">Tiêu đề bài viết</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Ngày đăng</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Lượt xem</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Trạng thái</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                      Đang tải dữ liệu...
                    </td>
                  </tr>
                ) : combinedData.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                      Không có dữ liệu
                    </td>
                  </tr>
                ) : (
                  combinedData.map(article => renderRow(article))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Quản lý Hashtag */}
        <HashtagManagerModal 
          isOpen={isHashtagModalOpen} 
          onClose={() => setIsHashtagModalOpen(false)} 
        />

        <div className="flex justify-end items-center gap-2 mt-4">
          <button className="px-3 py-1.5 min-w-8 rounded-sm bg-emerald-600 text-white text-sm font-medium flex items-center justify-center">1</button>
          <button className="px-3 py-1.5 min-w-8 rounded-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 text-sm font-medium transition-colors flex items-center justify-center">2</button>
          <button className="px-3 py-1.5 min-w-8 rounded-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 text-sm font-medium transition-colors flex items-center justify-center">3</button>
          <span className="text-slate-400 dark:text-slate-500 mx-1">...</span>
          <button className="px-3 py-1.5 rounded-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 text-sm font-medium transition-colors flex items-center justify-center">Tiếp</button>
        </div>
      </div>
    </div>
  );
}