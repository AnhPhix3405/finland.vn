"use client";

import { useState, useEffect, useRef } from "react";
import { PropertyCard } from "../../../components/property/PropertyCard";
import { PropertyFilter, FilterState } from "../../../components/property/PropertyFilter";
import { Pagination } from "../../../components/shared/Pagination";
import { getListingsByHashtags } from "../../modules/listings.service";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/src/store/authStore";
import Link from "next/link";

export default function ChoThuePage() {
  const router = useRouter();
  const [properties, setProperties] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentFilters, setCurrentFilters] = useState<FilterState>({});
  const [bookmarkedMap, setBookmarkedMap] = useState<Record<string, boolean>>({});
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0
  });
  const isHydrated = useAuthStore((state) => state.isHydrated);
  const requestIdRef = useRef<number>(0);
  const [error, setError] = useState<string | null>(null);

  const buildHashtags = (filters: FilterState) => {
    const hashtags = ['cho-thue']; // Always include base hashtag
    
    // Add property type hashtag if selected
    if (filters.propertyType && filters.propertyType !== '') {
      hashtags.push(filters.propertyType);
    }
    
    return hashtags;
  };

  const defaultImage = "https://lh3.googleusercontent.com/aida-public/AB6AXuAH-qH24_KE8TIFtAOlg2VMxFw51PbmagHsDz-fp6Y_o13wCplh0YpY5tUVGtFy_1YJB66cE-ffhS1bk0Khp5Id5HsZm2Vn7isAq4e3dgAm2smw-oxIc6ZJMRAczbqKi_kj0UIofIfDnHxU34GvPlK-Og0xGinm9wGIfWLsRQ9fqzoYOYfmBA-cQ32_dFeyQ0cYN5hgai2CsH15n0rd3N0dVC5HbLBDzPaUbpyyq_mUnWXQDljSIAPURnziqfdaHPhnGT183UxhHGub";

  const getListingImage = (thumbnailUrl?: string): string => {
    return thumbnailUrl || defaultImage;
  };

  const formatPrice = (price: string | number) => {
    if (!price) return "Thỏa thuận";
    const numPrice = Number(price);
    
    // For rent (cho-thue)
    if (numPrice >= 1000000) {
      const millions = numPrice / 1000000;
      return `${millions.toFixed(1)} Triệu/tháng`;
    } else if (numPrice >= 1000) {
      const thousands = numPrice / 1000;
      return `${thousands.toFixed(0)} Nghìn/tháng`;
    } else {
      return `${numPrice.toLocaleString('vi-VN')} VND/tháng`;
    }
  };

  const loadListings = async (filters: FilterState, page: number = 1) => {
    // Track request to prevent duplicate/race condition requests
    const currentRequestId = ++requestIdRef.current;
    
    try {
      setLoading(true);
      const hashtags = buildHashtags(filters);
      const result = await getListingsByHashtags(hashtags, {
        page,
        limit: pagination.limit,
        province: filters.province,
        ward: filters.ward,
        priceMin: filters.priceMin,
        priceMax: filters.priceMax,
        sortBy: filters.sortBy
      });
      
      // Check if this request is still valid (not superseded by another request)
      if (currentRequestId !== requestIdRef.current) {
        return;
      }
      
      // Handle empty or invalid response data
      if (!result || !result.data) {
        console.error('Invalid API response:', result);
        setProperties([]);
        setPagination({ page: 1, limit: 12, total: 0, totalPages: 0 });
        return;
      }
      
      console.log('📥 Frontend received API response (cho-thue):', {
        resultKeys: Object.keys(result),
        dataLength: result.data?.length,
        pagination: result.pagination,
        firstItem: result.data?.[0]
      });
      
      // Map API data to component expected format with fetching images
      const mappedProperties = result.data.map((listing: Record<string, unknown>) => ({
        id: String(listing.id),
        image: getListingImage(listing.thumbnail_url as string | undefined),
        price: (listing.price as string | number) ? formatPrice(listing.price as string | number) : "Thỏa thuận",
        area: (listing.area as number | null) ? `${listing.area} m²` : "N/A",
        title: listing.title,
        location: `${listing.ward}, ${listing.province}`,
        tags: ((listing.tags as unknown[]) || [])?.map((tag: unknown) => String((tag as Record<string, unknown>).slug)) || [],
        isPriority: false, // Can add logic later
        slug: listing.slug,
        broker: listing.brokers,
        status: listing.status,
        is_bookmarked: listing.is_bookmarked || false
      }));
      setPagination({
        page: (result.pagination as Record<string, unknown>).page as number,
        limit: (result.pagination as Record<string, unknown>).limit as number,
        total: (result.pagination as Record<string, unknown>).total as number,
        totalPages: (result.pagination as Record<string, unknown>).totalPages as number
      });
      
      // Log response for debugging
      console.log('API Response (cho-thue):', {
        totalListings: result.data.length,
        sample: result.data[0],
        allIsBookmarked: result.data.map((l: Record<string, unknown>) => ({ id: l.id, is_bookmarked: l.is_bookmarked }))
      });
      
      // Initialize bookmarkedMap from API response
      const initialBookmarkMap: Record<string, boolean> = {};
      result.data.forEach((listing: Record<string, unknown>) => {
        const listingId = String(listing.id);
        if (listing.is_bookmarked) {
          initialBookmarkMap[listingId] = true;
        }
      });
      setBookmarkedMap(initialBookmarkMap);
      
      // Update properties state
      setProperties(mappedProperties);
    } catch (error) {
      console.error('Error loading listings:', error);
      setProperties([]);
      setError('Không thể tải dữ liệu. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  // Clear error when filters change
  useEffect(() => {
    setError(null);
  }, [currentFilters]);

  // Load initial listings with "chothue" hashtag
  useEffect(() => {
    if (!isHydrated) {
      console.log('⏳ Waiting for authStore hydration... (cho-thue page)');
      return;
    }
    
    const initialFilters = {};
    setCurrentFilters(initialFilters);
    loadListings(initialFilters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHydrated]);

  const handleFilterChange = (filters: FilterState) => {
    setCurrentFilters(filters);
    
    // Navigate to property type page if selected
    if (filters.propertyType && filters.propertyType !== '') {
      router.push(`/cho-thue/${filters.propertyType}`);
    } else {
      loadListings(filters, 1);
    }
  };

  const handlePageChange = (page: number) => {
    loadListings(currentFilters, page);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1">
      {/* Page Title */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-slate-100">
            Bất động sản Cho Thuê toàn quốc
          </h1>
          <p className="text-slate-500 mt-2">
            Tìm kiếm hàng ngàn tin đăng cho thuê bất động sản chính chủ, uy tín.
          </p>
        </div>
        <Link
          href="/tao-bai-dang"
          className="inline-flex items-center px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-md transition-colors whitespace-nowrap"
        >
          + Tạo bài đăng
        </Link>
      </div>

      <PropertyFilter onFilterChange={handleFilterChange} />

      {/* Error State */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-red-600 dark:text-red-400 text-center">{error}</p>
          <button 
            onClick={() => loadListings(currentFilters, pagination.page)}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors mx-auto block"
          >
            Thử lại
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
          <span className="ml-3 text-slate-600 dark:text-slate-400">Đang tải...</span>
        </div>
      )}

      {/* Property Grid */}
      {!loading && (
        <>
          {properties.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {properties.map((property) => {
                const cardData = property as Record<string, unknown>;
                return (
                  <PropertyCard 
                    key={String(property.id)} 
                    id={String(cardData.id)}
                    image={String(cardData.image)}
                    price={String(cardData.price)}
                    area={String(cardData.area)}
                    title={String(cardData.title)}
                    location={String(cardData.location)}
                    tags={Array.isArray(cardData.tags) ? (cardData.tags as string[]) : []}
                    slug={cardData.slug as string | undefined}
                    type="cho-thue" 
                    status={cardData.status as string | undefined}
                    isBookmarked={Boolean(cardData.is_bookmarked)}
                    onBookmarkToggle={(isBookmarked) => {
                      setBookmarkedMap(prev => ({
                        ...prev,
                        [String(property.id)]: isBookmarked
                      }));
                    }}
                  />
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-slate-500 dark:text-slate-400">
                Không tìm thấy bất động sản nào phù hợp với tiêu chí lọc.
              </p>
            </div>
          )}
          
          {properties.length > 0 && (
            <Pagination 
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              onPageChange={handlePageChange}
            />
          )}
        </>
      )}
    </div>
  );
}
