"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAdminStore } from "@/src/store/adminStore";
import { useNotificationStore } from "@/src/store/notificationStore";
import { useAdminAuth } from "@/src/hooks/useAdminAuth";
import RichTextEditor from '@/src/components/ui/RichTextEditor';

export default function AdminServiceManagementPage() {
  const router = useRouter();
  const adminToken = useAdminStore((state) => state.accessToken);
  const addToast = useNotificationStore((state) => state.addToast);
  
  useAdminAuth(() => {
    router.push('/admin/login');
  });

  const [title, setTitle] = useState('📢 Thông báo từ Ban Quản Trị');
  const [content, setContent] = useState(`
    <p><strong>Kính gửi quý khách hàng và người dùng,</strong></p>
    <p>Nhằm nâng cao chất lượng trải nghiệm trên hệ thống tra cứu, mua bán và cho thuê bất động sản, chúng tôi đang tiến hành cập nhật dữ liệu và cải thiện một số tính năng trên nền tảng.</p>
    <p>Trong thời gian này, một số thông tin về bất động sản, giá cả, quy hoạch hoặc trạng thái giao dịch có thể được điều chỉnh để đảm bảo tính chính xác và minh bạch.</p>
    <p>Quý khách vui lòng kiểm tra kỹ thông tin trước khi thực hiện giao dịch, đồng thời liên hệ với bộ phận hỗ trợ nếu cần xác minh thêm về pháp lý, vị trí hoặc tình trạng tài sản.</p>
    <p>Xin cảm ơn quý khách đã tin tưởng và đồng hành cùng hệ thống.</p>
  `);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!adminToken) {
      router.push('/admin/login');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Simulate API call since user said "chưa cần làm backend"
      setTimeout(() => {
        addToast('Cập nhật thông báo dịch vụ thành công!', 'success');
        setIsSubmitting(false);
      }, 1000);
    } catch (err) {
      console.error('Error updating service announcement:', err);
      addToast('Lỗi khi cập nhật thông báo', 'error');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-1">
            <Link href="/admin" className="hover:text-emerald-600 transition-colors">Admin</Link>
            <span className="material-symbols-outlined text-[16px]" aria-hidden="true">chevron_right</span>
            <span className="text-slate-900 dark:text-slate-100 font-medium">Quản lý Dịch vụ</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Quản lý Dịch vụ & Thông báo</h1>
        </div>
        <div className="flex gap-3">
          <button 
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || !title || !content}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-600/50 text-white rounded-sm text-sm font-bold transition-all shadow-md shadow-emerald-500/20 flex items-center gap-2"
          >
            {isSubmitting ? (
              <span className="material-symbols-outlined text-[18px] animate-spin" aria-hidden="true">progress_activity</span>
            ) : (
              <span className="material-symbols-outlined text-[18px]" aria-hidden="true">save</span>
            )}
            {isSubmitting ? 'Đang lưu...' : 'Lưu thay đổi'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content Column */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-800 p-8 rounded-sm border border-slate-200 dark:border-slate-700 shadow-sm space-y-6">
            <div>
              <label htmlFor="title" className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                Tiêu đề thông báo <span className="text-red-500">*</span>
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Nhập tiêu đề thông báo..."
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-sm text-base font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:text-white transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                Nội dung thông báo chi tiết <span className="text-red-500">*</span>
              </label>
              <div className="prose-container border border-slate-200 dark:border-slate-700 rounded-sm overflow-hidden">
                <RichTextEditor 
                  value={content} 
                  onChange={setContent} 
                  placeholder="Nhập nội dung thông báo..." 
                />
              </div>
            </div>
          </div>
        </div>

        {/* Info Column */}
        <div className="space-y-6">
          <div className="bg-emerald-50 dark:bg-emerald-900/10 p-6 rounded-sm border border-emerald-100 dark:border-emerald-800/50 shadow-sm">
            <h3 className="text-sm font-bold text-emerald-900 dark:text-emerald-400 flex items-center gap-2 mb-4 uppercase tracking-wider">
              <span className="material-symbols-outlined text-lg">info</span>
              Hướng dẫn
            </h3>
            <div className="space-y-3 text-sm text-emerald-800/80 dark:text-emerald-300/80 leading-relaxed">
              <p>
                Đây là nội dung được hiển thị tại trang <strong>/dich-vu</strong>.
              </p>
              <p>
                Bạn có thể cập nhật thông tin về các thay đổi hệ thống, chính sách mới hoặc các lưu ý quan trọng cho người dùng tại đây.
              </p>
              <p>
                Nội dung hỗ trợ định dạng văn bản nâng cao (in đậm, in nghiêng, danh sách...).
              </p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-6 rounded-sm border border-slate-200 dark:border-slate-700 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 uppercase tracking-wider">Trạng thái</h3>
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Đang hiển thị công khai</span>
            </div>
            <Link 
              href="/dich-vu" 
              target="_blank"
              className="mt-6 flex items-center justify-center gap-2 w-full py-2 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all rounded-sm rounded-sm uppercase tracking-widest"
            >
              Xem trang đích
              <span className="material-symbols-outlined text-sm">open_in_new</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
