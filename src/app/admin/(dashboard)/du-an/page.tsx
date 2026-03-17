'use client';
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useProjectContext } from "@/src/context/ProjectContext";
import { getProjects, deleteProject } from "@/src/app/modules/projects.service";
import { getPropertyTypes, PropertyType } from "@/src/app/modules/property.service";
import { deleteAttachmentsByTarget } from "@/src/app/modules/attachments.service";
import LocationSelector from "@/src/components/feature/LocationSelector";

export default function AdminProjectList() {
  const [projects, setProjects] = useState<Record<string, unknown>[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProvince, setSelectedProvince] = useState('');
  const [selectedWard, setSelectedWard] = useState('');
  const [selectedPropertyType, setSelectedPropertyType] = useState('');
  const [propertyTypes, setPropertyTypes] = useState<PropertyType[]>([]);
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const { setActiveProjectId } = useProjectContext();
  const router = useRouter();

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(t);
    }
  }, [toast]);

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
  }, []);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (searchTerm) params.search = searchTerm;
      if (filterProvince) params.province = filterProvince;
      if (filterWard) params.ward = filterWard;
      if (filterPropertyType) params.property_type_id = filterPropertyType;
      
      const json = await getProjects(params);
      if (json.success && Array.isArray(json.data)) {
        setProjects(json.data);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchProjects();
  }, []);

  const handleDelete = async () => {
    if (!deleteConfirm) return;

    try {
      const res = await deleteProject(deleteConfirm.id);
      if (res.success) {
        await deleteAttachmentsByTarget(deleteConfirm.id, 'project');
        setProjects(prev => prev.filter(p => p.id !== deleteConfirm.id));
        setToast({ message: 'Xóa dự án thành công!', type: 'success' });
      } else {
        setToast({ message: 'Xóa thất bại: ' + (res.error || 'Lỗi không xác định'), type: 'error' });
      }
    } catch (error) {
      console.error('Error deleting project:', error);
      setToast({ message: 'Có lỗi xảy ra khi xóa dự án', type: 'error' });
    } finally {
      setDeleteConfirm(null);
    }
  };

  const [filterProvince, setFilterProvince] = useState('');
  const [filterWard, setFilterWard] = useState('');
  const [filterWardsList, setFilterWardsList] = useState<{ name: string }[]>([]);
  const [filterPropertyType, setFilterPropertyType] = useState('');

  useEffect(() => {
    if (!filterProvince) {
      setFilterWardsList([]);
      return;
    }
    const fetchWards = async () => {
      try {
        const url = `https://vietnamlabs.com/api/vietnamprovince?province=${encodeURIComponent(filterProvince)}`;
        const res = await fetch(url);
        const data = await res.json();
        if (data?.success && data?.data?.wards) {
          setFilterWardsList(data.data.wards);
        } else {
          setFilterWardsList([]);
        }
      } catch (err) {
        console.error('Error fetching wards:', err);
        setFilterWardsList([]);
      }
    };
    fetchWards();
  }, [filterProvince]);

  const handleSearch = () => {
    fetchProjects();
  };

  return (
    <div className="p-6">
      <div className="w-full space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div className="flex flex-wrap gap-2 w-full">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
              <input
                className="pl-10 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-sm text-sm focus:ring-primary focus:border-primary dark:text-white w-full sm:w-48 placeholder-slate-400"
                placeholder="Tìm kiếm..."
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>

            <select
              value={filterProvince}
              onChange={(e) => { setFilterProvince(e.target.value); setFilterWard(''); }}
              className="py-2 px-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-sm text-sm focus:ring-primary focus:border-primary dark:text-white text-slate-700 min-w-[140px]"
            >
              <option value="">Tất cả Tỉnh/TP</option>
              {['Hồ Chí Minh', 'Hà Nội', 'Đà Nẵng', 'Hải Phòng', 'Cần Thơ', 'Lâm Đồng', 'Đồng Nai', 'Bình Dương', 'Bà Rịa - Vũng Tàu', 'Khánh Hoà', 'Kiên Giang', 'Quảng Ninh', 'Thừa Thiên Huế', 'An Giang', 'Tiền Giang', 'Sơn La', 'Thanh Hoá', 'Nghệ An', 'Hà Tĩnh', 'Quảng Bình', 'Quảng Trị', 'Quảng Ngãi', 'Bình Định', 'Phú Yên', 'Gia Lai', 'Đắk Lắk', 'Lào Cai', 'Yên Bái', 'Tuyên Quang', 'Thái Nguyên', 'Vĩnh Phúc', 'Bắc Ninh', 'Hưng Yên', 'Nam Định', 'Ninh Bình', 'Hà Nam', 'Hải Dương', 'Thái Bình'].map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>

            <select
              value={filterWard}
              onChange={(e) => setFilterWard(e.target.value)}
              disabled={!filterProvince || filterWardsList.length === 0}
              className="py-2 px-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-sm text-sm focus:ring-primary focus:border-primary dark:text-white text-slate-700 min-w-[140px] disabled:opacity-50"
            >
              <option value="">Tất cả Phường/Xã</option>
              {filterWardsList.map((ward, idx) => (
                <option key={idx} value={ward.name}>{ward.name}</option>
              ))}
            </select>

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
              onClick={() => fetchProjects()}
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
                {/* Dữ liệu lấy từ API */}
                {projects.map((project: Record<string, unknown>) => (
                  <tr key={String(project.id)} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                    <td className="px-6 py-3">
                      {project.thumbnail_url ? (
                        <img
                          src={String(project.thumbnail_url)}
                          alt={String(project.name)}
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

        <div className="flex justify-end items-center gap-2 mt-4">
          <button className="px-3 py-1.5 min-w-[32px] rounded-sm bg-emerald-600 text-white text-sm font-medium flex items-center justify-center">1</button>
          <button className="px-3 py-1.5 min-w-[32px] rounded-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 text-sm font-medium transition-colors flex items-center justify-center">2</button>
          <button className="px-3 py-1.5 min-w-[32px] rounded-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 text-sm font-medium transition-colors flex items-center justify-center">3</button>
          <span className="text-slate-400 dark:text-slate-500 mx-1">...</span>
          <button className="px-3 py-1.5 rounded-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 text-sm font-medium transition-colors flex items-center justify-center">Tiếp</button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
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

      {toast && (
        <div className={`fixed bottom-4 right-4 px-4 py-3 rounded-md shadow-lg flex items-center gap-2 transform transition-transform duration-300 translate-y-0 text-sm font-medium z-50 ${toast.type === 'success'
            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200 dark:bg-emerald-900/50 dark:text-emerald-300 dark:border-emerald-800'
            : 'bg-red-100 text-red-800 border border-red-200 dark:bg-red-900/50 dark:text-red-300 dark:border-red-800'
            }`}>
            <span className="material-symbols-outlined text-[18px]">
                {toast.type === 'success' ? 'check_circle' : 'error'}
            </span>
            {toast.message}
        </div>
      )}
    </div>
  );
}
