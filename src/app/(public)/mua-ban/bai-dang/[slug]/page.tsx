"use client";

import { useState, useEffect, useRef } from "react";
import { PropertyCard } from "../../../../../components/property/PropertyCard";
import { PropertyFilter, FilterState } from "../../../../../components/property/PropertyFilter";
import { Pagination } from "../../../../../components/shared/Pagination";
import { PropertyDetail } from "../../../../../components/property/PropertyDetail";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getListingsByHashtags } from "../../../../modules/listings.service";
import { getAttachmentsByTarget } from "@/src/app/modules/attachments.service";
import { useAuthStore } from "@/src/store/authStore";

interface MappedProperty {
  id: string;
  image: string;
  price: string;
  area: string;
  title: string;
  location: string;
  tags: string[];
  slug: string;
  broker: Record<string, unknown>;
  status: string;
}

interface Listing {
  id: string;
  title: string;
  description: string;
  province: string;
  ward: string;
  address?: string | null;
  area?: number | null;
  price?: string | null;
  price_per_m2?: number | null;
  price_per_frontage_meter?: number | null;
  direction?: string | null;
  status?: string | null;
  slug?: string | null;
  contact_name?: string | null;
  contact_phone?: string | null;
  brokers: {
    id: string;
    full_name: string;
    phone: string;
    email?: string | null;
    avatar_url?: string | null;
    bio?: string | null;
  };
  tags?: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
  property_types?: {
    id: string;
    name: string;
    hashtag: string;
  } | null;
  transaction_types?: {
    id: string;
    name: string;
    hashtag: string;
  } | null;
  listing_code?: string | null;
  is_bookmarked?: boolean;
}

interface Attachment {
  id: string;
  secure_url: string;
  url?: string;
  original_name?: string | null;
  sort_order?: number;
}

export default function MuaBanDetailOrFilterPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;
  const accessToken = useAuthStore((state) => state.accessToken);
  const isHydrated = useAuthStore((state) => state.isHydrated);

  // Performance tracking
  const componentStartTime = useRef<number>(0);
  const apiStartTime = useRef<number>(0);
  const renderStartTime = useRef<number>(0);

  useEffect(() => {
    componentStartTime.current = performance.now();
    console.log('🔹 [PERF] Detail page mount started, slug:', slug);
    return () => {
      const mountTime = (performance.now() - componentStartTime.current) / 1000;
      console.log(`🔹 [PERF] Detail page unmount - Total time: ${mountTime.toFixed(3)}s`);
    };
  }, [slug]);

  // State for property types from API
  const [propertyTypes, setPropertyTypes] = useState<Array<{ id: string; name: string; hashtag: string }>>([]);

  // Determine if this is a property type filter or a listing detail
  const isPropertyType = propertyTypes.some(pt => pt.hashtag === slug.toLowerCase());

  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attachments, setAttachments] = useState<Attachment[]>([]);

  // For property type filter view
  const [properties, setProperties] = useState<MappedProperty[]>([]);
  const [currentFilters, setCurrentFilters] = useState<FilterState>({
    propertyType: slug || ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0
  });

  // Fetch property types from API (with caching to avoid duplicate calls)
  useEffect(() => {
    // Check if already cached in sessionStorage
    const cached = sessionStorage.getItem('property_types_cache');
    if (cached) {
      try {
        setPropertyTypes(JSON.parse(cached));
      } catch (e) {
        console.error('Error parsing cached property types');
      }
    }

    const fetchPropertyTypes = async () => {
      try {
        const response = await fetch('/api/property_types?limit=100');
        const data = await response.json();
        if (data.success) {
          setPropertyTypes(data.data);
          // Cache for future use
          sessionStorage.setItem('property_types_cache', JSON.stringify(data.data));
        }
      } catch (error) {
        console.error('Error fetching property types:', error);
      }
    };
    fetchPropertyTypes();
  }, []);

  // Handle property type filtered view
  useEffect(() => {
    if (!isPropertyType || !isHydrated) return;

    const loadFilteredListings = async (filters: FilterState, page: number = 1) => {
      try {
        setLoading(true);
        const hashtags = ['mua-ban', slug];
        const result = await getListingsByHashtags(hashtags, {
          page,
          limit: 12,
          province: filters.province,
          ward: filters.ward,
          priceMin: filters.priceMin,
          priceMax: filters.priceMax,
          sortBy: filters.sortBy,
        });

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

        const mappedProperties = result.data.map((item: Record<string, unknown>) => ({
          id: String(item.id),
          image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAH-qH24_KE8TIFtAOlg2VMxFw51PbmagHsDz-fp6Y_o13wCplh0YpY5tUVGtFy_1YJB66cE-ffhS1bk0Khp5Id5HsZm2Vn7isAq4e3dgAm2smw-oxIc6ZJMRAczbqKi_kj0UIofIfDnHxU34GvPlK-Og0xGinm9wGIfWLsRQ9fqzoYOYfmBA-cQ32_dFeyQ0cYN5hgai2CsH15n0rd3N0dVC5HbLBDzPaUbpyyq_mUnWXQDljSIAPURnziqfdaHPhnGT183UxhHGub",
          price: (item.price as string | number) ? formatPrice(item.price as string | number) : "Thỏa thuận",
          area: (item.area as number | null) ? `${item.area} m²` : "N/A",
          title: String(item.title),
          location: `${item.ward}, ${item.province}`,
          tags: ((item.tags as unknown[]) || [])?.map((tag: unknown) => String((tag as Record<string, unknown>).slug)) || [],
          slug: item.slug ? String(item.slug) : "",
          broker: (item.brokers as Record<string, unknown>) || {},
          status: item.status ? String(item.status) : ""
        }));

        setProperties(mappedProperties);
        setPagination({
          page: (result.pagination as Record<string, unknown>).page as number,
          limit: (result.pagination as Record<string, unknown>).limit as number,
          total: (result.pagination as Record<string, unknown>).total as number,
          totalPages: (result.pagination as Record<string, unknown>).totalPages as number
        });
      } catch (error) {
        console.error('Error loading filtered listings:', error);
        setError('Có lỗi xảy ra khi tải dữ liệu');
      } finally {
        setLoading(false);
      }
    };

    loadFilteredListings(currentFilters);
  }, [isPropertyType, slug, currentFilters, isHydrated, accessToken]);

  // Handle individual listing detail view
  useEffect(() => {
    if (isPropertyType || !isHydrated) return;

    const fetchListingDetail = async () => {
      try {
        setLoading(true);
        apiStartTime.current = performance.now();

        const headers: HeadersInit = {};
        if (accessToken) {
          headers['Authorization'] = `Bearer ${accessToken}`;
        }
        console.log('🔹 [PERF] Fetching listing detail:', `/api/listings/${slug}`);
        const response = await fetch(`/api/listings/${slug}`, { headers });
        const result = await response.json();

        const listingApiTime = (performance.now() - apiStartTime.current) / 1000;
        console.log(`🔹 [PERF] API /api/listings/${slug} latency: ${listingApiTime.toFixed(3)}s`);

        if (result.success) {
          renderStartTime.current = performance.now();
          setListing(result.data);

          // Fetch attachments
          const attachStartTime = performance.now();
          const attachRes = await getAttachmentsByTarget(result.data.id, 'listing');
          const attachApiTime = (performance.now() - attachStartTime) / 1000;
          console.log(`🔹 [PERF] API attachments latency: ${attachApiTime.toFixed(3)}s`);

          if (attachRes.success) {
            const sorted = (attachRes.data || []).sort((a: Attachment, b: Attachment) => (a.sort_order || 0) - (b.sort_order || 0));
            console.log('📸 Attachments sorted:', sorted);
            setAttachments(sorted);
          }

          const renderTime = (performance.now() - renderStartTime.current) / 1000;
          const totalTime = (performance.now() - componentStartTime.current) / 1000;
          console.log(`🔹 [PERF] Data processing & setState: ${renderTime.toFixed(3)}s`);
          console.log(`🔹 [PERF] Total detail page load: ${totalTime.toFixed(3)}s`);
        } else {
          setError(result.error || 'Không tìm thấy bài đăng');
        }
      } catch (err) {
        console.error('Error fetching listing detail:', err);
        setError('Có lỗi xảy ra khi tải dữ liệu');
      } finally {
        setLoading(false);
      }
    };

    fetchListingDetail();
  }, [slug, isPropertyType, isHydrated, accessToken]);

  // Handle filter change for property type view
  const handleFilterChange = (filters: FilterState) => {
    setCurrentFilters(filters);
    if (filters.propertyType && filters.propertyType !== slug) {
      router.push(`/mua-ban/${filters.propertyType}`);
    }
  };

  const handlePageChange = () => {
    // Would implement pagination here
  };

  // Render property type filtered view
  if (isPropertyType) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h2 className="text-3xl font-black text-slate-900 dark:text-white leading-tight">
            Bất động sản Mua Bán toàn quốc
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Tìm kiếm ngôi nhà mơ ước của bạn tại Finland.vn
          </p>
        </div>

        <PropertyFilter onFilterChange={handleFilterChange} />

        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
            <span className="ml-3 text-slate-600 dark:text-slate-400">Đang tải...</span>
          </div>
        )}

        {!loading && (
          <>
            {properties.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {properties.map((property) => (
                  <PropertyCard key={property.id} {...property} />
                ))}
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

  // Render individual listing detail view
  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950 py-10 md:py-16">
        <div className="max-w-7xl mx-auto px-6 sm:px-10">
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
            <span className="ml-3 text-slate-600 dark:text-slate-400">Đang tải...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950 py-10 md:py-16">
        <div className="max-w-7xl mx-auto px-6 sm:px-10">
          <div className="text-center py-20">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
              {error || 'Không tìm thấy bài đăng'}
            </h1>
            <button
              onClick={() => router.push('/mua-ban')}
              className="text-emerald-600 hover:text-emerald-700 font-medium"
            >
              ← Quay lại danh sách
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <title>{listing ? `${listing.title} | ${listing.listing_code || ''} | Finland.vn` : 'Chi tiết bất động sản | Finland.vn'}</title>
      <div className="min-h-screen bg-white dark:bg-slate-950 py-10 md:py-16">
        <div className="max-w-7xl mx-auto px-6 sm:px-10">
          <div className="mb-12">
            <button
              onClick={() => router.back()}
              className="group inline-flex items-center gap-3 text-slate-400 hover:text-emerald-600 transition-all text-[10px] font-black uppercase tracking-[0.3em] w-fit"
            >
              <div className="p-2 rounded-full border border-slate-100 dark:border-slate-800 group-hover:border-emerald-500/30 group-hover:bg-emerald-50 dark:group-hover:bg-emerald-900/10">
                <ArrowLeft className="size-4 shrink-0" />
              </div>
              Quay lại danh sách
            </button>
          </div>

          <PropertyDetail
            type="mua-ban"
            listing={listing}
            attachments={attachments}
            isBookmarked={listing?.is_bookmarked || false}
            isDemo={false}
          />
        </div>
      </div>
    </>
  );
}
