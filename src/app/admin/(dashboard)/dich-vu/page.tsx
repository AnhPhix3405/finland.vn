'use client';

import React, { useState, useEffect } from 'react';
import { useAdminAuth } from "@/src/hooks/useAdminAuth";
import { useRouter } from "next/navigation";
import { useAdminStore } from "@/src/store/adminStore";
import { useNotificationStore } from "@/src/store/notificationStore";
import RichTextEditor from '@/src/components/ui/RichTextEditor';
import { Save, Megaphone, Loader2 } from 'lucide-react';
import { fetchWithRetry } from "@/src/lib/api/fetch-with-retry";

export default function AdminServicesPage() {
  const router = useRouter();
  const adminToken = useAdminStore((state) => state.accessToken);
  const addToast = useNotificationStore((state) => state.addToast);
  
  useAdminAuth(() => {
    router.push('/admin/login');
  });

  const [id, setId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load existing announcement
  useEffect(() => {
    const loadService = async () => {
      if (!adminToken) return;
      
      try {
        const res = await fetchWithRetry('/api/admin/services', {
          token: adminToken || undefined,
          isAdmin: true
        });
        const result = await res.json();
        
        if (result.success && result.data) {
          setId(result.data.id);
          setTitle(result.data.title);
          setContent(result.data.content);
        }
      } catch (error) {
        console.error('Error loading service:', error);
        addToast('Lỗi khi tải dữ liệu thông báo', 'error');
      } finally {
        setIsLoading(false);
      }
    };

    loadService();
  }, [adminToken]);

  const handleSave = async () => {
    if (!title || !content) {
      addToast('Vui lòng điền đủ tiêu đề và nội dung', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetchWithRetry('/api/admin/services', {
        method: 'POST',
        token: adminToken || undefined,
        isAdmin: true,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id, title, content })
      });
      
      const result = await res.json();
      
      if (result.success) {
        setId(result.data.id);
        addToast('Cập nhật thông báo thành công!', 'success');
      } else {
        addToast(result.error || 'Lỗi khi cập nhật thông báo', 'error');
      }
    } catch (error) {
      console.error('Error saving service:', error);
      addToast('Lỗi kết nối máy chủ', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 gap-4">
        <Loader2 className="w-10 h-10 text-emerald-600 animate-spin" />
        <p className="text-slate-500 font-medium">Đang tải dữ liệu...</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-600/20">
            <Megaphone className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Quản lý Dịch vụ & Thông báo</h1>
            <p className="text-sm text-slate-500">Chỉnh sửa nội dung thông báo hiển thị tại trang /dich-vu</p>
          </div>
        </div>
        
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-600/20"
        >
          {isSaving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
        </button>
      </div>

      <div className="grid gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">
            Tiêu đề thông báo
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="VD: Thông báo cập nhật hệ thống..."
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-900 font-medium"
          />
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm min-h-[500px]">
          <label className="block text-sm font-bold text-slate-700 mb-4 uppercase tracking-wide">
            Nội dung chi tiết
          </label>
          <RichTextEditor
            value={content}
            onChange={setContent}
            placeholder="Nhập nội dung thông báo tại đây..."
          />
        </div>
      </div>
    </div>
  );
}
