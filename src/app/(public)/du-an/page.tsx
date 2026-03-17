"use client";

import Link from "next/link";
import { PropertyFilter, FilterState } from "../../../components/property/PropertyFilter";
import { Pagination } from "../../../components/shared/Pagination";
import { useProjectContext } from "@/src/context/ProjectContext";
import { getProjects } from "@/src/app/modules/projects.service";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

interface Project {
  id: string;
  name: string;
  slug: string;
  province?: string;
  ward?: string;
  developer?: string;
  property_type_id?: string;
  property_types?: {
    id: string;
    name: string;
  };
  status?: string;
  area?: number;
  price?: number;
  content?: string;
  created_at?: string;
  thumbnail_url?: string;
}

export default function ProjectList() {
  const router = useRouter();
  const { setProjectSlug } = useProjectContext();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentFilters, setCurrentFilters] = useState<FilterState>({});
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0
  });

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
        setProjects(result.data || []);
        if (result.pagination) {
          setPagination({
            page: result.pagination.page,
            limit: result.pagination.limit,
            total: result.pagination.total,
            totalPages: result.pagination.totalPages
          });
        }
      } else {
        setError(result.error || 'Không thể tải danh sách dự án');
      }
    } catch (err) {
      console.error('Error fetching projects:', err);
      setError('Lỗi khi tải danh sách dự án');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects({});
  }, []);

  const handleProjectClick = (project: Project) => {
    setProjectSlug(project.slug);
    router.push(`/du-an/${project.slug}`);
  };

  const handleFilterChange = (filters: FilterState) => {
    setCurrentFilters(filters);
    loadProjects(filters, 1);
  };

  const handlePageChange = (page: number) => {
    loadProjects(currentFilters, page);
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'đang mở bán':
        return (
          <div className="absolute top-2 left-2 bg-emerald-600 text-white text-[10px] font-bold px-2 py-1 uppercase tracking-wider">
            Đang mở bán
          </div>
        );
      case 'sắp mở bán':
        return (
          <div className="absolute top-2 left-2 bg-blue-600 text-white text-[10px] font-bold px-2 py-1 uppercase tracking-wider">
            Sắp mở bán
          </div>
        );
      case 'đã bàn giao':
        return (
          <div className="absolute top-2 left-2 bg-gray-600 text-white text-[10px] font-bold px-2 py-1 uppercase tracking-wider">
            Đã bàn giao
          </div>
        );
      default:
        return null;
    }
  };

  const formatArea = (areaMin?: number, areaMax?: number) => {
    if (areaMin && areaMax) {
      return `${areaMin} - ${areaMax} m²`;
    } else if (areaMin) {
      return `${areaMin} m²`;
    } else if (areaMax) {
      return `${areaMax} m²`;
    }
    return 'Liên hệ';
  };

  const formatPrice = (price?: number | string) => {
    if (!price || price === 0) return 'Liên hệ';
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    if (isNaN(numPrice)) return 'Liên hệ';

    if (numPrice >= 1000000000) {
      return `${(numPrice / 1000000000).toFixed(1)} Tỷ`;
    } else if (numPrice >= 1000000) {
      return `${(numPrice / 1000000).toFixed(0)} Triệu`;
    }
    return `${numPrice.toLocaleString('vi-VN')} VND`;
  };

  const formatLocation = (province?: string, ward?: string) => {
    if (ward && province) {
      return `${ward}, ${province}`;
    } else if (province) {
      return province;
    }
    return 'Cả nước';
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="text-center py-12">
          <div className="inline-flex items-center gap-2 text-slate-500 dark:text-slate-400">
            <span className="material-symbols-outlined text-base animate-spin">progress_activity</span>
            Đang tải danh sách dự án...
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="text-center py-12">
          <div className="text-red-600 dark:text-red-400">
            {error}
          </div>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition-colors"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <nav aria-label="Breadcrumb" className="flex mb-4">
        <ol className="inline-flex items-center space-x-1 md:space-x-2">
          <li className="inline-flex items-center">
            <Link className="text-xs text-gray-500 hover:text-primary dark:text-gray-400 dark:hover:text-white transition-colors uppercase tracking-wider font-semibold" href="/">Trang chủ</Link>
          </li>
          <li>
            <div className="flex items-center">
              <span className="text-gray-400 text-xs mx-1">/</span>
              <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold">Danh sách dự án</span>
            </div>
          </li>
        </ol>
      </nav>
      <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-6 uppercase tracking-tight">DANH SÁCH DỰ ÁN BẤT ĐỘNG SẢN</h1>
      
      <PropertyFilter onFilterChange={handleFilterChange} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <p className="text-slate-500 dark:text-slate-400">Không có dự án nào để hiển thị</p>
          </div>
        ) : (
          projects.map((project) => (
            <div 
              key={project.id} 
              className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 flex flex-col hover:border-primary transition-colors shadow-sm cursor-pointer"
              onClick={() => handleProjectClick(project)}
            >
              <div className="relative h-48">
                <img 
                  alt={project.name} 
                  className="w-full h-full object-cover" 
                  src={project.thumbnail_url || 'https://via.placeholder.com/400x200?text=No+Image'}
                  onError={(e) => {
                    e.currentTarget.src = 'https://via.placeholder.com/400x200?text=No+Image';
                  }}
                />
                {getStatusBadge(project.status)}
              </div>
              <div className="p-4 grow flex flex-col">
                <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1.5 line-clamp-2 hover:text-primary transition-colors leading-tight">
                  {project.name}
                </h3>
                <div className="flex items-center text-xs text-gray-500 dark:text-slate-400 mb-3 truncate">
                  <span className="material-symbols-outlined text-[14px] mr-1 text-gray-400">location_on</span>
                  {formatLocation(project.province, project.ward)}
                </div>
                <div className="flex justify-between items-center mb-4 mt-auto">
                  <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                    {formatPrice(project.price)}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-gray-500 dark:text-slate-400">
                      {project.area ? `${project.area.toLocaleString('vi-VN')} m²` : ''}
                    </span>
                    {project.property_types && (
                      <span className="text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-1 rounded">
                        {project.property_types.name}
                      </span>
                    )}
                  </div>
                </div>
                <div className="mt-auto pt-3 border-t border-gray-100 dark:border-slate-700">
                  <div className="flex justify-center items-center w-full px-4 py-2 border border-emerald-600 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-xs font-bold uppercase tracking-wider transition-colors">
                    XEM CHI TIẾT
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <Pagination 
        currentPage={pagination.page} 
        totalPages={pagination.totalPages} 
        onPageChange={handlePageChange} 
      />
    </div>
  );
}
