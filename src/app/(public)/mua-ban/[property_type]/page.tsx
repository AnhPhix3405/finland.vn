"use client";

import { useState, useEffect } from "react";
import { PropertyCard } from "../../../../components/property/PropertyCard";
import { PropertyFilter, FilterState } from "../../../../components/property/PropertyFilter";
import { Pagination } from "../../../../components/shared/Pagination";
import { useRouter, useParams } from "next/navigation";
import { getListingsByHashtags } from "../../../modules/listings.service";
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
  listing_code?: string | null;
}

export default function MuaBanPropertyTypePage() {
  const router = useRouter();
  const params = useParams();
  const propertyType = params.property_type as string;
  const accessToken = useAuthStore((state) => state.accessToken);
  const isHydrated = useAuthStore((state) => state.isHydrated);

  const [properties, setProperties] = useState<MappedProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentFilters, setCurrentFilters] = useState<FilterState>({
    propertyType: propertyType || ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0
  });

  const defaultImage = "https://lh3.googleusercontent.com/aida-public/AB6AXuAH-qH24_KE8TIFtAOlg2VMxFw51PbmagHsDz-fp6Y_o13wCplh0YpY5tUVGtFy_1YJB66cE-ffhS1bk0Khp5Id5HsZm2Vn7isAq4e3dgAm2smw-oxIc6ZJMRAczbqKi_kj0UIofIfDnHxU34GvPlK-Og0xGinm9wGIfWLsRQ9fqzoYOYfmBA-cQ32_dFeyQ0cYN5hgai2CsH15n0rd3N0dVC5HbLBDzPaUbpyyq_mUnWXQDljSIAPURnziqfdaHPhnGT183UxhHGub";

  const getListingImage = (thumbnailUrl?: string): string => {
    return thumbnailUrl || defaultImage;
  };

  // Load filtered listings by property type
  useEffect(() => {
    if (!isHydrated) return;

    const loadFilteredListings = async (filters: FilterState, page: number = 1) => {
      try {
        setLoading(true);
        const hashtags = ['mua-ban', propertyType];
        const result = await getListingsByHashtags(hashtags, {
          page,
          limit: 12,
          province: filters.province,
          ward: filters.ward,
          priceMin: filters.priceMin,
          priceMax: filters.priceMax,
          sortBy: filters.sortBy
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
          image: getListingImage(item.thumbnail_url as string | undefined),
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
        setError(null);
      } catch (err) {
        console.error('Error loading filtered listings:', err);
        setError('Có lỗi xảy ra khi tải dữ liệu');
      } finally {
        setLoading(false);
      }
    };

    loadFilteredListings(currentFilters);
  }, [propertyType, currentFilters, isHydrated, accessToken]);

  // Handle filter change
  const handleFilterChange = (filters: FilterState) => {
    setCurrentFilters(filters);
    if (!filters.propertyType) {
      router.push('/mua-ban');
    } else if (filters.propertyType !== propertyType) {
      router.push(`/mua-ban/${filters.propertyType}`);
    }
  };

  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, page }));
  };

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

      {error && (
        <div className="text-center py-12">
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {!loading && !error && (
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
