"use client";

import { useState, useEffect } from "react";
import { PropertyCard } from "../../../../../../components/property/PropertyCard";
import { PropertyFilter, FilterState } from "../../../../../../components/property/PropertyFilter";
import { Pagination } from "../../../../../../components/shared/Pagination";
import { getListingsByHashtags } from "../../../../../modules/listings.service";
import { useParams, useRouter } from "next/navigation";

interface PropertyCardData {
  id: string;
  image: string;
  price: string;
  area: string;
  title: string;
  location: string;
  tags: string[];
  isPriority: boolean;
  slug?: string | null;
  status?: string | null;
  broker: unknown;
}

export default function ChoThuePropertyTypePage() {
  const params = useParams();
  const router = useRouter();
  const propertyType = params.propertyType as string;

  const [properties, setProperties] = useState<PropertyCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentFilters, setCurrentFilters] = useState<FilterState>({
    propertyType: propertyType || ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0
  });

  const buildHashtags = (filters: FilterState) => {
    const hashtags = ['cho-thue']; // Always include base hashtag
    
    // Add property type from URL
    if (propertyType) {
      hashtags.push(propertyType);
    }
    // Or add property type hashtag if selected via filter
    else if (filters.propertyType && filters.propertyType !== '') {
      hashtags.push(filters.propertyType);
    }
    
    return hashtags;
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
      
      // Map API data to component expected format
      const mappedProperties: PropertyCardData[] = result.data.map((listing: Record<string, unknown>) => ({
        id: String(listing.id),
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAH-qH24_KE8TIFtAOlg2VMxFw51PbmagHsDz-fp6Y_o13wCplh0YpY5tUVGtFy_1YJB66cE-ffhS1bk0Khp5Id5HsZm2Vn7isAq4e3dgAm2smw-oxIc6ZJMRAczbqKi_kj0UIofIfDnHxU34GvPlK-Og0xGinm9wGIfWLsRQ9fqzoYOYfmBA-cQ32_dFeyQ0cYN5hgai2CsH15n0rd3N0dVC5HbLBDzPaUbpyyq_mUnWXQDljSIAPURnziqfdaHPhnGT183UxhHGub", // Default image for now
        price: (listing.price as string | number) ? formatPrice(listing.price as string | number) : "Thỏa thuận",
        area: listing.area ? `${listing.area} m²` : "N/A",
        title: String(listing.title),
        location: `${listing.ward}, ${listing.province}`,
        tags: (listing.tags as unknown[])?.map((tag: unknown) => String((tag as Record<string, unknown>).slug)) || [],
        isPriority: false, // Can add logic later
        slug: listing.slug ? String(listing.slug) : null,
        broker: listing.brokers,
        status: listing.status ? String(listing.status) : null
      }));
      
      setProperties(mappedProperties);
      setPagination({
        page: (result.pagination as Record<string, unknown>).page as number,
        limit: (result.pagination as Record<string, unknown>).limit as number,
        total: (result.pagination as Record<string, unknown>).total as number,
        totalPages: (result.pagination as Record<string, unknown>).totalPages as number
      });
    } catch (error) {
      console.error('Error loading listings:', error);
      setProperties([]);
    } finally {
      setLoading(false);
    }
  };

  // Load initial listings
  useEffect(() => {
    const initialFilters: FilterState = {
      propertyType: propertyType || ''
    };
    setCurrentFilters(initialFilters);
    loadListings(initialFilters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propertyType]);

  const handleFilterChange = (filters: FilterState) => {
    setCurrentFilters(filters);
    
    // Update URL if property type changed
    if (filters.propertyType && filters.propertyType !== propertyType) {
      router.push(`/cho-thue/${filters.propertyType}`);
    } else {
      loadListings(filters, 1); // Reset to page 1 when filtering
    }
  };

  const handlePageChange = (page: number) => {
    loadListings(currentFilters, page);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1">
      {/* Page Title */}
      <div className="mb-6">
        <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-slate-100">
          Bất động sản Cho Thuê toàn quốc
        </h1>
        <p className="text-slate-500 mt-2">
          Tìm kiếm hàng ngàn tin đăng cho thuê bất động sản chính chủ, uy tín.
        </p>
      </div>

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
                const { broker, ...cardProps } = property;
                return <PropertyCard key={property.id} type="cho-thue" {...cardProps} />;
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
