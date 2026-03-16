'use client';
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useProjectContext } from "@/src/context/ProjectContext";
import { getProjects, deleteProject } from "@/src/app/modules/projects.service";
import { deleteAttachmentsByTarget } from "@/src/app/modules/attachments.service";

export default function AdminProjectList() {
  const [projects, setProjects] = useState<Record<string, unknown>[]>([]);
  const { setActiveProjectId } = useProjectContext();
  const router = useRouter();

  const fetchProjects = async () => {
    try {
      const json = await getProjects();
      if (json.success && Array.isArray(json.data)) {
        setProjects(json.data);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  useEffect(() => {
    // Initialize state for mounted check
  }, []);

  // Separate effect for fetching data
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchProjects();
  }, []);

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Bạn có chắc muốn xóa dự án "${name}"?`)) return;

    try {
      const res = await deleteProject(id);
      if (res.success) {
        // Xóa luôn các attachments liên quan trên DB và Cloudinary
        await deleteAttachmentsByTarget(id, 'project');

        // Cập nhật lại state cục bộ hoặc fetch lại
        setProjects(prev => prev.filter(p => p.id !== id));
        alert('Xóa dự án và dữ liệu liên quan thành công');
      } else {
        alert('Xóa thất bại: ' + (res.error || 'Lỗi không xác định'));
      }
    } catch (error) {
      console.error('Error deleting project:', error);
      alert('Có lỗi xảy ra khi xóa dự án');
    }
  };

  return (
    <div className="p-6">
      <div className="w-full space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
              <input
                className="pl-10 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-sm text-sm focus:ring-primary focus:border-primary dark:text-white w-full sm:w-64 placeholder-slate-400"
                placeholder="Tìm kiếm dự án..."
                type="text"
              />
            </div>
            <select className="py-2 px-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-sm text-sm focus:ring-primary focus:border-primary dark:text-white text-slate-700 min-w-[140px]">
              <option value="">Tỉnh thành</option>
              <option value="hcm">TP.HCM</option>
              <option value="hn">Hà Nội</option>
              {/* add more options if needed */}
            </select>
            <select className="py-2 px-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-sm text-sm focus:ring-primary focus:border-primary dark:text-white text-slate-700 min-w-[140px]">
              <option value="">Loại hình</option>
              <option value="canho">Căn hộ</option>
              <option value="bietthu">Biệt thự</option>
              <option value="nhapho">Nhà phố</option>
            </select>
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
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Khu vực / Mã DA</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {/* Dữ liệu lấy từ API */}
                {projects.map((project: Record<string, unknown>) => (
                  <tr key={String(project.id)} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                    <td className="px-6 py-3">
                      <div className="w-12 h-10 bg-slate-200 dark:bg-slate-700 rounded-sm bg-cover bg-center border border-slate-300 dark:border-slate-600 flex items-center justify-center text-slate-400">
                        <span className="material-symbols-outlined text-xl">image</span>
                      </div>
                    </td>
                    <td className="px-6 py-3 text-sm text-slate-900 dark:text-slate-100 font-bold">
                      {String(project.name)}
                    </td>
                    <td className="px-6 py-3 text-sm text-slate-600 dark:text-slate-300">
                      {String(project.project_code || '---')}
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
                        onClick={() => handleDelete(String(project.id), String(project.name))}
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
    </div>
  );
}
