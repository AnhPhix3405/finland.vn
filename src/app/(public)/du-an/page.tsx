"use client";

import { useState, useEffect } from "react";
import { PropertyCard } from "../../../components/property/PropertyCard";
import { PropertyFilter, FilterState } from "../../../components/property/PropertyFilter";
import { Pagination } from "../../../components/shared/Pagination";
import { getProjects } from "../../modules/projects.service";
import Link from "next/link";

export default function ProjectList() {
  const [projects, setProjects] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentFilters, setCurrentFilters] = useState<FilterState>({});
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0
  });

  const defaultImage = "https://lh3.googleusercontent.com/aida-public/AB6AXuAH-qH24_KE8TIFtAOlg2VMxFw51PbmagHsDz-fp6Y_o13wCplh0YpY5tUVGtFy_1YJB66cE-ffhS1bk0Khp5Id5HsZm2Vn7isAq4e3dgAm2smw-oxIc6ZJMRAczbqKi_kj0UIofIfDnHxU34GvPlK-Og0xGinm9wGIfWLsRQ9fqzoYOYfmBA-cQ32_dFeyQ0cYN5hgai2CsH15n0rd3N0dVC5HbLBDzPaUbpyyq_mUnWXQDljSIAPURnziqfdaHPhnGT183UxhHGub";

  const formatPrice = (price?: number | string) => {
    if (!price || price === 0) return "Liên hệ";
    const numPrice = typeof price === "string" ? parseFloat(price) : price;
    if (isNaN(numPrice)) return "Liên hệ";

    if (numPrice >= 1000000000) {
      return `${(numPrice / 1000000000).toFixed(1)} Tỷ`;
    } else if (numPrice >= 1000000) {
      return `${(numPrice / 1000000).toFixed(0)} Triệu`;
    }
    return `${numPrice.toLocaleString("vi-VN")} VND`;
  };

  const loadProjects = async (filters: FilterState, page: number = 1) => {
    try {
      setLoading(true);
      const result = await getProjects({
        page,
        limit: pagination.limit,
        province: filters.province,
        ward: filters.ward,
        propertyType: filters.propertyType,
        priceMin: filters.priceMin,
        priceMax: filters.priceMax,
        sortBy: filters.sortBy,
      });

      if (result.success) {
        const mappedProjects = (result.data || []).map((project: Record<string, unknown>) => ({
          id: String(project.id),
          image: (project.thumbnail_url as string) || defaultImage,
          price: formatPrice(project.price as number | string),
          area: project.area ? `${(project.area as number).toLocaleString("vi-VN")} m²` : "",
          title: project.name,
          location: `${project.ward || ""}, ${project.province || ""}`.replace(/^, /, ""),
          tags: [],
          slug: project.slug,
          type: "du-an",
          status: project.status ? (project.status as string).charAt(0).toUpperCase() + (project.status as string).slice(1) : undefined,
          property_type: project.property_types ? (project.property_types as Record<string, unknown>).name : undefined,
        }));

        setProjects(mappedProjects);
        if (result.pagination) {
          setPagination({
            page: result.pagination.page,
            limit: result.pagination.limit,
            total: result.pagination.total,
            totalPages: result.pagination.totalPages,
          });
        }
      }
    } catch (error) {
      console.error("Error loading projects:", error);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects({});
  }, []);

  const handleFilterChange = (filters: FilterState) => {
    setCurrentFilters(filters);
    loadProjects(filters, 1);
  };

  const handlePageChange = (page: number) => {
    loadProjects(currentFilters, page);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white leading-tight">
            Dự án Bất động sản toàn quốc
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Tìm kiếm dự án bất động sản tại Finland.vn
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => loadProjects(currentFilters, pagination.page)}
            disabled={loading}
            className="inline-flex items-center px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-sm font-medium rounded-md transition-colors disabled:opacity-50"
            title="Làm mới dữ liệu"
          >
            <span className={`material-symbols-outlined text-lg ${loading ? "animate-spin" : ""}`}>refresh</span>
          </button>
        </div>
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
          {projects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => {
                const cardData = project;
                return (
                  <PropertyCard
                    key={String(cardData.id)}
                    id={String(cardData.id)}
                    image={String(cardData.image)}
                    price={String(cardData.price)}
                    area={String(cardData.area)}
                    title={String(cardData.title)}
                    location={String(cardData.location)}
                    tags={Array.isArray(cardData.tags) ? (cardData.tags as string[]) : []}
                    slug={cardData.slug as string | undefined}
                    type="mua-ban"
                    status={cardData.status as string | undefined}
                    showBookmark={false}
                  />
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-slate-500 dark:text-slate-400">
                Không tìm thấy dự án nào phù hợp với tiêu chí lọc.
              </p>
            </div>
          )}

          {projects.length > 0 && (
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
