"use client";

import { useState, useEffect } from "react";
import { PropertyCard } from "@/src/components/property/PropertyCard";
import { PropertyFilter, FilterState} from "@/src/components/property/PropertyFilter";
import { useAuthStore } from "@/src/store/authStore";
import { useParams, useRouter } from "next/navigation";
import { getListingsByHashtags } from "@/src/app/modules/listings.service";
import { Pagination } from "@/src/components/shared/Pagination";
import { ArrowLeft } from "lucide-react";
import { PropertyDetail } from "@/src/components/property/PropertyDetail";

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
  width?: number | null;
  length?: number | null;
  price?: string | null;
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
    specialization?: string | null;
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
}

export default function ChoThueDetailOrFilterPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;
  const accessToken = useAuthStore((state) => state.accessToken);
  const isHydrated = useAuthStore((state) => state.isHydrated);
  
  // State for property types from API
  const [propertyTypes, setPropertyTypes] = useState<Array<{ id: string; name: string; hashtag: string }>>([]);
  
  // Determine if this is a property type filter or a listing detail
  const isPropertyType = propertyTypes.some(pt => pt.hashtag === slug.toLowerCase());

  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  // Fetch property types from API
  useEffect(() => {
    const fetchPropertyTypes = async () => {
      try {
        const response = await fetch('/api/property_types?limit=100');
        const data = await response.json();
        if (data.success) {
          setPropertyTypes(data.data);
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
        const hashtags = ['cho-thue', slug];
        const result = await getListingsByHashtags(hashtags, {
          page,
          limit: 12,
          province: filters.province,
          ward: filters.ward,
          priceMin: filters.priceMin,
          priceMax: filters.priceMax,
          sortBy: filters.sortBy,
          token: accessToken || undefined
        });

        const formatPrice = (price: string | number) => {
          if (!price) return "Thỏa thuận";
          const numPrice = Number(price);
          
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

        const mappedProperties = result.data.map((item: Listing) => ({
          id: item.id,
          image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAH-qH24_KE8TIFtAOlg2VMxFw51PbmagHsDz-fp6Y_o13wCplh0YpY5tUVGtFy_1YJB66cE-ffhS1bk0Khp5Id5HsZm2Vn7isAq4e3dgAm2smw-oxIc6ZJMRAczbqKi_kj0UIofIfDnHxU34GvPlK-Og0xGinm9wGIfWLsRQ9fqzoYOYfmBA-cQ32_dFeyQ0cYN5hgai2CsH15n0rd3N0dVC5HbLBDzPaUbpyyq_mUnWXQDljSIAPURnziqfdaHPhnGT183UxhHGub",
          price: item.price ? formatPrice(item.price) : "Thỏa thuận",
          area: item.area ? `${item.area} m²` : "N/A",
          title: item.title,
          location: `${item.ward}, ${item.province}`,
          tags: item.tags?.map((tag: { slug: string }) => tag.slug) || [],
          slug: item.slug || "",
          broker: item.brokers,
          status: item.status || ""
        }));

        setProperties(mappedProperties);
        setPagination({ ...result.pagination });
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
        const headers: HeadersInit = {};
        if (accessToken) {
          headers['Authorization'] = `Bearer ${accessToken}`;
        }
        const response = await fetch(`/api/listings/${slug}`, { headers });
        const result = await response.json();
        
        if (result.success) {
          setListing(result.data);
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
      router.push(`/cho-thue/${filters.propertyType}`);
    }
  };

  const handlePageChange = () => {
    // Would implement pagination here
  };

  // Render property type filtered view
  if (isPropertyType) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1">
        <div className="mb-6">
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-slate-100">
            Bất động sản Cho Thuê toàn quốc
          </h1>
          <p className="text-slate-500 mt-2">
            Tìm kiếm hàng ngàn tin đăng cho thuê bất động sản chính chủ, uy tín.
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
                  <PropertyCard key={property.id} type="cho-thue" {...property} />
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
              onClick={() => router.push('/cho-thue')}
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
          type="cho-thue" 
          listing={listing}
          isDemo={false} 
        />
      </div>
    </div>
  );
}
