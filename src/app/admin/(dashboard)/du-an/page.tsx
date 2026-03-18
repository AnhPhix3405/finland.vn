'use client';
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useProjectContext } from "@/src/context/ProjectContext";
import { getAdminProjects, deleteAdminProject } from "@/src/app/modules/admin.projects.service";
import { getPropertyTypes, PropertyType } from "@/src/app/modules/property.service";
import { deleteAttachmentsByTarget } from "@/src/app/modules/attachments.service";
import { useAdminStore } from "@/src/store/adminStore";
import { useNotificationStore } from "@/src/store/notificationStore";
import { useAdminAuth } from "@/src/hooks/useAdminAuth";
import LocationSelector from "@/src/components/feature/LocationSelector";

interface Project {
  id: string;
  name: string;
  project_code: string;
  slug: string;
  province: string;
  ward: string;
  area: number;
  price: number;
  thumbnail_url: string | null;
  status: string;
  created_at?: Date | string;
  views_count?: number;
}

export default function AdminProjectList() {
  const router = useRouter();
  const addToast = useNotificationStore((state) => state.addToast);
  const { setActiveProjectId } = useProjectContext();

  const { isLoading } = useAdminAuth(() => {
    router.push('/admin/login');
  });

  const [projects, setProjects] = useState<Project[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterProvince, setFilterProvince] = useState('');
  const [filterWard, setFilterWard] = useState('');
  const [filterPropertyType, setFilterPropertyType] = useState('');
  const [propertyTypes, setPropertyTypes] = useState<PropertyType[]>([]);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  const fetchProjects = async (page = 1) => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = {
        page,
        limit: pagination.limit,
      };
      if (searchTerm) params.search = searchTerm;
      if (filterProvince) params.province = filterProvince;
      if (filterWard) params.ward = filterWard;
      if (filterPropertyType) params.property_type_id = filterPropertyType;

      const json = await getAdminProjects(params);

      if (json.statusCode === 401) {
        useAdminStore.getState().clearAuth();
        addToast('Phiên đăng nhập hết hạn, vui lòng đăng nhập lại', 'error');
        router.push('/admin/login');
        return;
      }

      if (json.success && Array.isArray(json.data)) {
        setProjects(json.data);
        if (json.pagination) {
          setPagination(json.pagination);
        }
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchPropertyTypes = async () => {
      try {
        const result = await getPropertyTypes({ limit: 100 });
        if (result.success) {
          setPropertyTypes(result.data || []);
        }
      } catch (error) {
        console.error('Error fetching property types:', error);
      }
    };

    fetchPropertyTypes();
    fetchProjects();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-slate-500">Đang tải...</div>
      </div>
    );
  }

  const handleSearch = () => {
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchProjects(1);
  };

  const handlePageChange = (page: number) => {
    if (page < 1 || page > pagination.totalPages) return;
    setPagination(prev => ({ ...prev, page }));
    fetchProjects(page);
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;

    try {
      const res = await deleteAdminProject(deleteConfirm.id);

      if (res.statusCode === 401) {
        useAdminStore.getState().clearAuth();
        addToast('Phiên đăng nhập hết hạn, vui lòng đăng nhập lại', 'error');
        router.push('/admin/login');
        return;
      }

      if (res.success) {
        await deleteAttachmentsByTarget(deleteConfirm.id, 'project');
        setProjects(prev => prev.filter(p => p.id !== deleteConfirm.id));
        addToast('Xóa dự án thành công!', 'success');
      } else {
        addToast('Xóa thất bại: ' + (res.error || 'Lỗi không xác định'), 'error');
      }
    } catch (error) {
      console.error('Error deleting project:', error);
      addToast('Có lỗi xảy ra khi xóa dự án', 'error');
    } finally {
      setDeleteConfirm(null);
    }
  };

  return (
    <div className="p-6">
      <div className="w-full space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div className="flex flex-wrap gap-2 w-full">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
              <input
                className="pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-sm text-sm focus:ring-primary focus:border-primary dark:text-white w-full sm:w-64 placeholder-slate-400"
                placeholder="Tìm theo tiêu đề, mã dự án..."
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>

            <div className="w-80">
              <LocationSelector
                showLabels={false}
                selectedProvince={filterProvince}
                onProvinceChange={(value) => { setFilterProvince(value); setFilterWard(''); }}
                selectedWard={filterWard}
                onWardChange={(value) => setFilterWard(value)}
              />
            </div>

            <select
              value={filterPropertyType}
              onChange={(e) => setFilterPropertyType(e.target.value)}
              className="py-2 px-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-sm text-sm focus:ring-primary focus:border-primary dark:text-white text-slate-700 min-w-[140px]"
            >
              <option value="">Tất cả loại hình</option>
              {propertyTypes.map(type => (
                <option key={type.id} value={type.id}>{type.name}</option>
              ))}
            </select>

            <button
              onClick={handleSearch}
              className="ml-2 bg-green-500 hover:bg-green-700 text-white px-4 rounded-sm text-sm font-medium flex items-center gap-1 transition-colors whitespace-nowrap"
            >
              <span className="material-symbols-outlined text-lg">search</span>
              Tìm
            </button>
            <button
              onClick={() => handleSearch()}
              disabled={loading}
              className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-sm text-sm font-medium flex items-center gap-1 transition-colors disabled:opacity-50"
              title="Làm mới"
            >
              <span className={`material-symbols-outlined text-lg ${loading ? 'animate-spin' : ''}`}>refresh</span>
            </button>
          </div>
          <button
            onClick={() => {
              setActiveProjectId(null);
              router.push('/admin/du-an/tao-moi');
            }}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-sm text-sm font-medium flex items-center gap-2 transition-colors whitespace-nowrap"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            <span>Thêm dự án mới</span>
          </button>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-sm border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700">
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider w-20">Hình ảnh</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Tên dự án</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Ngày đăng</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Lượt xem</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {projects.map((project) => (
                  <tr key={project.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                    <td className="px-6 py-3">
                      {project.thumbnail_url ? (
                        <img
                          src={project.thumbnail_url}
                          alt={project.name}
                          className="w-12 h-10 rounded-sm object-cover border border-slate-300 dark:border-slate-600"
                        />
                      ) : (
                        <div className="w-12 h-10 bg-slate-200 dark:bg-slate-700 rounded-sm bg-cover bg-center border border-slate-300 dark:border-slate-600 flex items-center justify-center text-slate-400">
                          <span className="material-symbols-outlined text-xl">image</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-3 text-sm text-slate-900 dark:text-slate-100 font-bold">
                      {String(project.name)}
                    </td>
                    <td className="px-6 py-3 text-sm text-slate-600 dark:text-slate-300">
                      {project.created_at ? new Date(String(project.created_at)).toLocaleString('vi-VN') : '---'}
                    </td>
                    <td className="px-6 py-3 text-sm text-slate-600 dark:text-slate-300">
                      {Number(project.views_count || 0).toLocaleString('vi-VN')}
                    </td>
                    <td className="px-6 py-3 text-right whitespace-nowrap">
                      <button className="text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 transition-colors p-1" title="Đang hiển thị">
                        <span className="material-symbols-outlined text-xl">visibility</span>
                      </button>
                      <button
                        onClick={() => {
                          setActiveProjectId(String(project.id));
                          router.push(`/admin/du-an/${String(project.slug)}`);
                        }}
                        className="text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors p-1 ml-1"
                        title="Chỉnh sửa"
                      >
                        <span className="material-symbols-outlined text-lg">edit</span>
                      </button>
                      <button
                        onClick={() => setDeleteConfirm({ id: String(project.id), name: String(project.name) })}
                        className="text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors p-1 ml-1"
                        title="Xóa"
                      >
                        <span className="material-symbols-outlined text-lg">delete</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex justify-between items-center mt-4">
          <div className="text-sm text-slate-500">
            Hiển thị {(pagination.page - 1) * pagination.limit + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} của {pagination.total} dự án
          </div>
          <div className="flex justify-end items-center gap-1">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page <= 1 || loading}
              className="px-3 py-1.5 rounded-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Trước
            </button>
            {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
              let pageNum;
              if (pagination.totalPages <= 5) {
                pageNum = i + 1;
              } else if (pagination.page <= 3) {
                pageNum = i + 1;
              } else if (pagination.page >= pagination.totalPages - 2) {
                pageNum = pagination.totalPages - 4 + i;
              } else {
                pageNum = pagination.page - 2 + i;
              }
              return (
                <button
                  key={pageNum}
                  onClick={() => handlePageChange(pageNum)}
                  className={`px-3 py-1.5 min-w-[32px] rounded-sm text-sm font-medium flex items-center justify-center transition-colors ${pagination.page === pageNum
                      ? 'bg-emerald-600 text-white'
                      : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                    }`}
                >
                  {pageNum}
                </button>
              );
            })}
            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages || loading}
              className="px-3 py-1.5 rounded-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Tiếp
            </button>
          </div>
        </div>
      </div>

      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh]">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDeleteConfirm(null)} />
          <div className="relative bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="material-symbols-outlined text-3xl text-red-500">warning</span>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Xác nhận xóa</h3>
            </div>
            <p className="text-slate-600 dark:text-slate-300 mb-6">
              Bạn có chắc chắn xóa vĩnh viễn dự án này?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-sm text-sm font-medium transition-colors"
              >
                Thoát
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-sm text-sm font-medium transition-colors"
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
