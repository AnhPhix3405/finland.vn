export default function AdminDashboardPage() {
  return (
    <div className="p-6">
      <div className="w-full space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Tổng quan hệ thống</h2>
          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-sm border border-slate-200 dark:border-slate-700">
            <span className="material-symbols-outlined text-base">calendar_today</span>
            <span>Hôm nay, 24/10/2024</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          <div className="bg-white dark:bg-slate-800 rounded-sm p-6 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col gap-3">
            <div className="flex justify-between items-start">
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Tổng dự án</p>
              <div className="p-2 bg-primary/10 rounded-sm text-primary">
                <span className="material-symbols-outlined text-xl">apartment</span>
              </div>
            </div>
            <div>
              <p className="text-3xl font-bold text-slate-900 dark:text-white">1,240</p>
              <p className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1 mt-1">
                <span className="material-symbols-outlined text-sm">trending_up</span>
                <span>+12% so với tháng trước</span>
              </p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-sm p-6 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col gap-3">
            <div className="flex justify-between items-start">
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Tổng bài viết</p>
              <div className="p-2 bg-blue-500/10 rounded-sm text-blue-600 dark:text-blue-400">
                <span className="material-symbols-outlined text-xl">article</span>
              </div>
            </div>
            <div>
              <p className="text-3xl font-bold text-slate-900 dark:text-white">856</p>
              <p className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1 mt-1">
                <span className="material-symbols-outlined text-sm">trending_up</span>
                <span>+5% so với tháng trước</span>
              </p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-sm p-6 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col gap-3">
            <div className="flex justify-between items-start">
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Số môi giới</p>
              <div className="p-2 bg-purple-500/10 rounded-sm text-purple-600 dark:text-purple-400">
                <span className="material-symbols-outlined text-xl">people</span>
              </div>
            </div>
            <div>
              <p className="text-3xl font-bold text-slate-900 dark:text-white">432</p>
              <p className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1 mt-1">
                <span className="material-symbols-outlined text-sm">trending_up</span>
                <span>+8 mới trong tuần</span>
              </p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-sm p-6 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col gap-3">
            <div className="flex justify-between items-start">
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Lượt truy cập</p>
              <div className="p-2 bg-orange-500/10 rounded-sm text-orange-600 dark:text-orange-400">
                <span className="material-symbols-outlined text-xl">visibility</span>
              </div>
            </div>
            <div>
              <p className="text-3xl font-bold text-slate-900 dark:text-white">12,500</p>
              <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-1">
                <span className="material-symbols-outlined text-sm">horizontal_rule</span>
                <span>Ổn định so với tuần trước</span>
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-sm border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden mt-8">
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Hoạt động gần đây</h3>
            <button className="text-sm text-primary hover:underline font-medium">Xem tất cả</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700">
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Thời gian</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Hành động</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Chi tiết</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                <tr className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                  <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-base text-slate-400">schedule</span>
                      10:30 24/10/2024
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-900 dark:text-slate-100 font-medium">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800/50">
                      Cập nhật dự án
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">
                    Chỉnh sửa Vinhomes Ocean Park 3
                  </td>
                </tr>
                <tr className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                  <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-base text-slate-400">schedule</span>
                      09:15 24/10/2024
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-900 dark:text-slate-100 font-medium">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50">
                      Đăng bài viết
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">
                    Báo cáo giá 2026
                  </td>
                </tr>
                <tr className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                  <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-base text-slate-400">schedule</span>
                      08:00 24/10/2024
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-900 dark:text-slate-100 font-medium">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-800/50">
                      Thêm môi giới
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">
                    Nguyễn Văn A - Quận 2
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
