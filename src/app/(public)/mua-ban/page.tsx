"use client";

import { useState, useEffect, useRef } from "react";
import { PropertyCard } from "../../../components/property/PropertyCard";
import { PropertyFilter, FilterState } from "../../../components/property/PropertyFilter";
import { Pagination } from "../../../components/shared/Pagination";
import { getListingsByHashtags } from "../../modules/listings.service";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/src/store/authStore";
import Link from "next/link";
import { Search, X } from "lucide-react";

export default function MuaBanPage() {
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
  const accessToken = useAuthStore((state) => state.accessToken);
  const isHydrated = useAuthStore((state) => state.isHydrated);
  const [searchQuery, setSearchQuery] = useState("");
  
  const componentStartTime = useRef<number>(0);
  const apiStartTime = useRef<number>(0);
  const renderStartTime = useRef<number>(0);

  // Track component mount time
  useEffect(() => {
    componentStartTime.current = performance.now();
    console.log('🔹 [PERF] Component mount started');
    return () => {
      const mountTime = (performance.now() - componentStartTime.current) / 1000;
      console.log(`🔹 [PERF] Component unmount - Total time: ${mountTime.toFixed(3)}s`);
    };
  }, []);

  // Debug properties state changes
  useEffect(() => {
    console.log('🔄 properties state changed, first item featureTags:', properties[0]?.featureTags);
  }, [properties]);

  const buildHashtags = (filters: FilterState) => {
    const hashtags = ['mua-ban']; // Always include base hashtag

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

  const loadListings = async (filters: FilterState, page: number = 1) => {
    apiStartTime.current = performance.now();
    try {
      setLoading(true);
      const hashtags = buildHashtags(filters);

      console.log('📤 loadListings - Sending request with:', {
        hashtags,
        accessToken: accessToken ? `${accessToken.substring(0, 20)}...` : 'NO TOKEN',
        filters,
        searchQuery
      });

      const result = await getListingsByHashtags(hashtags, {
        page,
        limit: pagination.limit,
        province: filters.province,
        ward: filters.ward,
        priceMin: filters.priceMin,
        priceMax: filters.priceMax,
        sortBy: filters.sortBy,
        token: accessToken || undefined,
        search: searchQuery || undefined,
      });

      console.log('📥 loadListings - Response:', {
        dataLength: result.data.length,
        searchQuery,
        firstItem: result.data[0] ? {
          id: result.data[0].id,
          title: result.data[0].title,
          broker: result.data[0].brokers,
          featureTags: result.data[0].featureTags,
          listing_feature_hashtags: result.data[0].listing_feature_hashtags,
          hasOwnFeatureTags: Object.prototype.hasOwnProperty.call(result.data[0], 'featureTags'),
          allKeys: Object.keys(result.data[0]),
        } : null
      });

      // Track API latency
      const apiLatency = (performance.now() - apiStartTime.current) / 1000;
      console.log(`🔹 [PERF] API /api/listings latency: ${apiLatency.toFixed(3)}s`);

      // Map API data to component expected format with fetching images
      const mappedProperties = result.data.map((listing: Record<string, unknown>) => {
        const featureTags = (listing.featureTags as Record<string, unknown>[]) || [];
        console.log('📦 mappedProperties - listing.featureTags:', featureTags, 'type:', typeof featureTags);
        return {
          id: String(listing.id),
          image: getListingImage(listing.thumbnail_url as string | undefined),
          price: (listing.price as string | number) ? formatPrice(listing.price as string | number) : "Thỏa thuận",
          area: (listing.area as number | null) ? `${listing.area} m²` : "N/A",
          title: listing.title,
          location: `${listing.ward}, ${listing.province}`,
          tags: ((listing.tags as unknown[]) || [])?.map((tag: unknown) => String((tag as Record<string, unknown>).slug)) || [],
          featureTags: JSON.parse(JSON.stringify(featureTags)),
          isPriority: false,
          slug: listing.slug,
          broker: listing.brokers,
          status: listing.status,
          is_bookmarked: listing.is_bookmarked || false
        };
      });

      console.log('📦 mappedProperties[0]:', mappedProperties[0]?.featureTags);
      setProperties(mappedProperties);
      
      // Check state immediately after set
      console.log('📦 setProperties called with mappedProperties[0].featureTags:', mappedProperties[0]?.featureTags);
      
      // Track render time
      renderStartTime.current = performance.now();
      
      setPagination({
        page: (result.pagination as Record<string, unknown>).page as number,
        limit: (result.pagination as Record<string, unknown>).limit as number,
        total: (result.pagination as Record<string, unknown>).total as number,
        totalPages: (result.pagination as Record<string, unknown>).totalPages as number
      });

      // Log response for debugging
      console.log('API Response (mua-ban):', {
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
      
      // Track total render time (from API response to DOM update)
      const renderTime = (performance.now() - renderStartTime.current) / 1000;
      const totalTime = (performance.now() - componentStartTime.current) / 1000;
      console.log(`🔹 [PERF] Data mapping & setState: ${renderTime.toFixed(3)}s`);
      console.log(`🔹 [PERF] Total page load time: ${totalTime.toFixed(3)}s`);
    } catch (error) {
      console.error('Error loading listings:', error);
      setProperties([]);
    } finally {
      setLoading(false);
    }
  };

  // Load initial listings with "muaban" hashtag
  useEffect(() => {
    if (!isHydrated) {
      console.log('⏳ Waiting for authStore hydration... (mua-ban page)');
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
      router.push(`/mua-ban/${filters.propertyType}`);
    } else {
      loadListings(filters, 1);
    }
  };

  const handlePageChange = (page: number) => {
    loadListings(currentFilters, page);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadListings(currentFilters, 1);
  };

  const clearSearch = () => {
    setSearchQuery("");
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Title */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white leading-tight">
            Bất động sản Mua Bán toàn quốc
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Tìm kiếm ngôi nhà mơ ước của bạn tại Finland.vn
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => loadListings(currentFilters, pagination.page)}
            disabled={loading}
            className="inline-flex items-center px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-sm font-medium rounded-md transition-colors disabled:opacity-50"
            title="Làm mới dữ liệu"
          >
            <span className={`material-symbols-outlined text-lg ${loading ? 'animate-spin' : ''}`}>refresh</span>
          </button>
          <Link
            href="/tao-bai-dang"
            className="inline-flex items-center px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-md transition-colors whitespace-nowrap"
          >
            + Tạo bài đăng
          </Link>
        </div>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="mb-6">
        <div className="relative max-w-xl">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm kiếm theo tiêu đề hoặc tên tác giả..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-10 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={clearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            >
              <X className="size-5" />
            </button>
          )}
        </div>
      </form>

      <PropertyFilter onFilterChange={handleFilterChange} />

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
                    featureTags={Array.isArray(cardData.featureTags) ? (cardData.featureTags as { id: string; name: string; hashtag: string }[]) : []}
                    slug={cardData.slug as string | undefined}
                    type="mua-ban"
                    status={cardData.status as string | undefined}
                    isBookmarked={bookmarkedMap[String(property.id)] || false}
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
