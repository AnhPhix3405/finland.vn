'use client';
import Link from "next/link";
import React, { useState, useRef, useEffect } from "react";
import { useParams } from "next/navigation";
import { uploadBrokerAvatar } from "@/src/app/modules/upload.service";

interface Broker {
  id: string;
  full_name: string;
  phone: string;
  email: string | null;
  avatar_url: string | null;
  working_area: string | null;
  specialization: string | null;
  bio: string | null;
  is_active: boolean;
}

export default function AdminBrokerDetail() {
  const params = useParams();
  const phone = params?.id as string;

  const [broker, setBroker] = useState<Broker | null>(null);
  const [loading, setLoading] = useState(false);

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch broker theo phone
  useEffect(() => {
    if (!phone) return;
    const fetchBroker = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/brokers/${phone}`);
        const json = await res.json();
        if (json.success) {
          setBroker(json.data);
        }
      } catch (err) {
        console.error('Lỗi khi tải thông tin môi giới:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchBroker();
  }, [phone]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    if (!phone) {
      alert('Không tìm thấy số điện thoại!');
      return;
    }
    setIsUploading(true);
    try {
      if (avatarFile) {
        await uploadBrokerAvatar(avatarFile, phone);
      }
      alert('Lưu thông tin thành công!');
    } catch (error) {
      console.error('Lỗi khi lưu thông tin:', error);
      alert('Có lỗi xảy ra khi lưu thông tin!');
    } finally {
      setIsUploading(false);
    }
  };

  // Ảnh hiện trong avatar: ưu tiên preview file mới → avatar từ DB
  const displayAvatar = avatarPreview ?? broker?.avatar_url ?? null;

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Thông tin Môi giới</h2>
          {loading && (
            <span className="inline-flex items-center gap-1.5 text-sm text-slate-400">
              <span className="material-symbols-outlined text-base animate-spin">progress_activity</span>
              Đang tải...
            </span>
          )}
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-sm border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
          <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
            <div className="flex flex-col md:flex-row gap-6 items-start">

              {/* Avatar picker */}
              <div className="w-full md:w-1/3 flex flex-col items-center gap-3">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 w-full text-center">Ảnh đại diện</label>
                <div
                  className="w-32 h-32 rounded-full border-2 border-dashed border-slate-300 dark:border-slate-600 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer transition-colors relative overflow-hidden group"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {displayAvatar ? (
                    <>
                      <img
                        src={displayAvatar}
                        alt={broker?.full_name ?? 'Avatar'}
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1">
                        <span className="material-symbols-outlined text-white text-2xl">edit</span>
                        <span className="text-white text-[11px] font-medium">Đổi ảnh</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-slate-400 text-3xl group-hover:text-emerald-500 transition-colors">add_a_photo</span>
                      <span className="text-xs text-slate-500 mt-2 text-center px-2">Tải ảnh đại diện lên</span>
                    </>
                  )}
                  <input
                    ref={fileInputRef}
                    accept="image/*"
                    className="hidden"
                    type="file"
                    onChange={handleAvatarChange}
                  />
                </div>
                {avatarFile && (
                  <div className="text-center">
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium truncate max-w-[140px]">{avatarFile.name}</p>
                    <p className="text-xs text-slate-400">{(avatarFile.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                )}
              </div>

              {/* Form fields */}
              <div className="w-full md:w-2/3 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Họ và Tên <span className="text-red-500">*</span></label>
                  <input
                    key={broker?.id}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-sm text-sm focus:ring-1 focus:ring-primary focus:border-primary dark:text-white placeholder-slate-400"
                    placeholder="Nhập họ và tên môi giới..."
                    type="text"
                    defaultValue={broker?.full_name ?? ''}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Số điện thoại <span className="text-red-500">*</span></label>
                    <input
                      key={broker?.id}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-sm text-sm focus:ring-1 focus:ring-primary focus:border-primary dark:text-white placeholder-slate-400"
                      placeholder="Nhập số điện thoại..."
                      type="tel"
                      defaultValue={broker?.phone ?? ''}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email</label>
                    <input
                      key={broker?.id}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-sm text-sm focus:ring-1 focus:ring-primary focus:border-primary dark:text-white placeholder-slate-400"
                      placeholder="Nhập địa chỉ email..."
                      type="email"
                      defaultValue={broker?.email ?? ''}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Chuyên môn</label>
                  <select
                    key={broker?.id}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-sm text-sm focus:ring-1 focus:ring-primary focus:border-primary dark:text-white"
                    defaultValue={broker?.specialization ?? ''}
                  >
                    <option value="">Chọn chuyên môn...</option>
                    <option value="canho">Căn hộ</option>
                    <option value="datnen">Đất nền</option>
                    <option value="bietthu">Biệt thự</option>
                    <option value="nhapho">Nhà phố</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Khu vực hoạt động</label>
                  <input
                    key={broker?.id}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-sm text-sm focus:ring-1 focus:ring-primary focus:border-primary dark:text-white placeholder-slate-400"
                    placeholder="Ví dụ: Quận 2, TP.HCM"
                    type="text"
                    defaultValue={broker?.working_area ?? ''}
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Giới thiệu bản thân</label>
              <textarea
                key={broker?.id}
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-sm text-sm focus:ring-1 focus:ring-primary focus:border-primary dark:text-white placeholder-slate-400"
                placeholder="Nhập thông tin giới thiệu, kinh nghiệm làm việc..."
                rows={4}
                defaultValue={broker?.bio ?? ''}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
              <Link href="/admin/moi-gioi" className="px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-sm text-sm font-medium transition-colors inline-block">
                Hủy
              </Link>
              <button
                type="button"
                disabled={isUploading}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-sm text-sm font-medium transition-colors"
                onClick={handleSave}
              >
                {isUploading ? 'Đang lưu...' : 'Lưu thông tin'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
