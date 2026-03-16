"use client";

import { User, Camera, Bell, Loader2 } from "lucide-react";
import { useUserStore } from "@/src/store/userStore";
import { useState, useEffect, useRef } from "react";
import { updateBroker, UpdateBrokerData } from "@/src/app/modules/broker.service";
import { uploadBrokerAvatar } from "@/src/app/modules/upload.service";

export default function ProfileSection() {
  const { user } = useUserStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form data state
  const [formData, setFormData] = useState<UpdateBrokerData>({
    full_name: '',
    email: '',
    province: '',
  });

  // Initialize form data when user is loaded
  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name || '',
        email: user.email || '',
        province: user.province || '',
      });
    }
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (message.text) setMessage({ type: '', text: '' });
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'Chỉ chấp nhận file ảnh (JPG, PNG, GIF)' });
      return;
    }
    if (file.size > 5 * 1024 * 1024) { // 5MB
      setMessage({ type: 'error', text: 'Kích thước file không được vượt quá 5MB' });
      return;
    }

    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setMessage({ type: '', text: '' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.phone) return;

    setIsSubmitting(true);
    setMessage({ type: '', text: '' });

    console.log('🔹 [PROFILE] Starting profile update for user:', user);
    console.log('🔹 [PROFILE] user.id:', user?.id);
    console.log('🔹 [PROFILE] user.phone:', user?.phone);

    try {
      const updateData = { ...formData };
      console.log('🔹 [PROFILE] updateData:', updateData);
      console.log('🔹 [PROFILE] selectedFile:', selectedFile);
      
      if (selectedFile) {
        console.log('🔹 [PROFILE] Uploading avatar for brokerId:', user.id);
        const uploadResult = await uploadBrokerAvatar(selectedFile, user.id);
        console.log('🔹 [PROFILE] Upload result:', uploadResult);
        
        if (uploadResult && uploadResult.brokerUpdate?.success) {
          updateData.avatar_url = uploadResult.secure_url;
          console.log('🔹 [PROFILE] Avatar URL set:', updateData.avatar_url);
        } else {
          throw new Error('Failed to upload avatar');
        }
      }
      
      const hasFormChanges = (
        formData.full_name !== user.full_name ||
        formData.email !== (user.email || '') ||
        formData.province !== (user.province || '')
      );
      console.log('🔹 [PROFILE] hasFormChanges:', hasFormChanges);
      
      if (hasFormChanges || selectedFile) {
        console.log('🔹 [PROFILE] Calling updateBroker with phone:', user.phone, 'id:', user.id);
        const result = await updateBroker(user.phone, updateData, user.id);
        console.log('🔹 [PROFILE] updateBroker result:', result);
        
        if (result.success) {
          setSelectedFile(null);
          setPreviewUrl(null);
          if (fileInputRef.current) fileInputRef.current.value = '';
          setMessage({ type: 'success', text: 'Cập nhật thông tin thành công!' });
        } else {
          setMessage({ type: 'error', text: result.error || 'Có lỗi xảy ra khi cập nhật thông tin' });
        }
      } else {
        setMessage({ type: 'info', text: 'Không có thay đổi nào để lưu' });
      }
    } catch (error) {
      console.error('🔹 [PROFILE] Update profile error:', error);
      setMessage({ type: 'error', text: 'Lỗi kết nối. Vui lòng thử lại.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return <div className="p-8 text-center text-slate-500">Đang tải hồ sơ...</div>;
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="p-6 border-b border-slate-100 dark:border-slate-800">
        <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">Thông tin cá nhân</h1>
        <p className="text-sm text-slate-500 mt-1">Quản lý thông tin hồ sơ của bạn để cá nhân hóa trải nghiệm.</p>
      </div>

      <div className="p-6 md:p-8">
        <div className="flex flex-col sm:flex-row items-center gap-6 mb-8 lg:mb-10">
          <div className="relative shrink-0">
            <div className="size-24 md:size-32 rounded-lg bg-emerald-50 dark:bg-emerald-900/10 text-emerald-500 flex items-center justify-center overflow-hidden border border-emerald-100 dark:border-slate-700">
              {previewUrl ? (
                <img src={previewUrl} alt="Preview" className="size-full rounded-lg object-cover" />
              ) : user?.avatar_url ? (
                <img src={user.avatar_url} alt={user.full_name} className="size-full rounded-lg object-cover" />
              ) : (
                <User className="size-10 md:size-16 opacity-50" />
              )}
            </div>
            <button 
              type="button" 
              onClick={() => fileInputRef.current?.click()}
              disabled={isSubmitting}
              className="absolute -bottom-3 -right-3 bg-white dark:bg-slate-800 shadow-md border border-slate-200 dark:border-slate-700 rounded-full p-2 hover:text-emerald-600 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed" 
              aria-label="Đổi ảnh đại diện"
            >
              <Camera className="size-4 md:size-5" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="hidden"
            />
          </div>
          <div className="text-center sm:text-left">
            <h4 className="font-semibold text-slate-900 dark:text-white">Ảnh hồ sơ</h4>
            <p className="text-sm text-slate-500 mb-3">Định dạng JPG, PNG hoặc GIF. Tối đa 5MB.</p>
            {selectedFile && (
              <p className="text-xs text-emerald-600 dark:text-emerald-400 mb-2">
                Đã chọn: {selectedFile.name}
              </p>
            )}
            <div className="flex justify-center sm:justify-start gap-2">
              <button 
                type="button" 
                onClick={() => fileInputRef.current?.click()}
                disabled={isSubmitting}
                className="px-4 py-1.5 text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Chọn ảnh
              </button>
              {(selectedFile || user?.avatar_url) && (
                <button 
                  type="button" 
                  onClick={() => {
                    setSelectedFile(null);
                    setPreviewUrl(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  disabled={isSubmitting}
                  className="px-4 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 rounded transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {selectedFile ? 'Bỏ chọn' : 'Xóa ảnh'}
                </button>
              )}
            </div>
          </div>
        </div>

        {message.text && (
          <div className={`mb-6 p-3 rounded-sm text-sm ${
            message.type === 'success' 
              ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-600 dark:text-green-400'
              : message.type === 'info'
              ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400'
              : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400'
          }`}>
            {message.text}
          </div>
        )}

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label htmlFor="fullName" className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                Họ và Tên <span className="text-red-500">*</span>
              </label>
              <input 
                id="fullName"
                name="full_name"
                type="text" 
                value={formData.full_name}
                onChange={handleInputChange}
                className="w-full rounded-md border-slate-300 dark:border-slate-700 dark:bg-slate-800 text-slate-900 dark:text-white focus:border-emerald-500 focus:ring-emerald-500 transition-all text-sm h-10 px-3 shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="phoneNumber" className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                Số điện thoại <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input 
                  id="phoneNumber"
                  type="tel" 
                  defaultValue={user.phone} 
                  readOnly 
                  className="w-full rounded-md bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 text-sm cursor-not-allowed pr-20 h-10 px-3 shadow-sm focus:outline-none"
                />
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold uppercase tracking-wider text-emerald-600 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-sm">
                  Thay đổi
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="emailAddress" className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                Email
              </label>
              <input 
                id="emailAddress"
                name="email"
                type="email" 
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Nhập email của bạn"
                className="w-full rounded-md border-slate-300 dark:border-slate-700 dark:bg-slate-800 text-slate-900 dark:text-white focus:border-emerald-500 focus:ring-emerald-500 transition-all text-sm h-10 px-3 shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="interestedArea" className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                Khu vực <span className="text-red-500">*</span>
              </label>
              <select 
                id="interestedArea"
                name="province"
                value={formData.province}
                onChange={handleInputChange}
                className="w-full rounded-md border-slate-300 dark:border-slate-700 dark:bg-slate-800 text-slate-900 dark:text-white focus:border-emerald-500 focus:ring-emerald-500 transition-all text-sm h-10 px-3 shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                required
              >
                <option value="">Chọn khu vực</option>
                <option value="Hà Nội">Hà Nội</option>
                <option value="Hồ Chí Minh">TP. Hồ Chí Minh</option>
                <option value="Đà Nẵng">Đà Nẵng</option>
                <option value="Khác">Khác</option>
              </select>
            </div>

            <div className="space-y-3 md:col-span-2 pt-2 pb-4">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <Bell className="size-4" /> Cài đặt thông báo
              </h3>
              <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-lg border border-slate-100 dark:border-slate-800">
                <input 
                  id="emailNotifications" 
                  type="checkbox" 
                  defaultChecked
                  className="size-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-600 dark:border-slate-600 dark:bg-slate-700" 
                />
                <label htmlFor="emailNotifications" className="text-sm text-slate-600 dark:text-slate-400 font-medium cursor-pointer select-none">
                  Nhận tin tức dự án mới, ưu đãi qua email
                </label>
              </div>
            </div>
          </div>

          <div className="pt-6 flex flex-col-reverse sm:flex-row items-center justify-end gap-3 sm:gap-4 border-t border-slate-100 dark:border-slate-800 mt-8">
            <button 
              type="button" 
              onClick={() => {
                if (user) {
                  setFormData({
                    full_name: user.full_name || '',
                    email: user.email || '',
                    province: user.province || '',
                  });
                }
                setSelectedFile(null);
                setPreviewUrl(null);
                if (fileInputRef.current) fileInputRef.current.value = '';
                setMessage({ type: '', text: '' });
              }}
              disabled={isSubmitting}
              className="w-full sm:w-auto px-6 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Hủy bỏ
            </button>
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full sm:w-auto px-8 py-2.5 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-md shadow-sm transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting && <Loader2 className="size-4 animate-spin" />}
              {isSubmitting ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
