"use client";

import { User, Camera, Bell, Loader2, MapPin, FileText, CheckCircle2, ShieldCheck, Mail, Send } from "lucide-react";
import { useUserStore } from "@/src/store/userStore";
import { useAuthStore } from "@/src/store/authStore";
import { useNotificationStore } from "@/src/store/notificationStore";
import { useState, useEffect, useRef } from "react";
import { updateBroker, UpdateBrokerData } from "@/src/app/modules/broker.service";
import { uploadBrokerAvatar } from "@/src/app/modules/upload.service";
import LocationSelector from "../feature/LocationSelector";

export default function ProfileSection() {
  const { user } = useUserStore();
  const addToast = useNotificationStore((state) => state.addToast);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Email verification state
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);
  const [showVerificationInput, setShowVerificationInput] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [countdown, setCountdown] = useState(0);

  // Countdown timer for resend
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleSendCode = async () => {
    if (!formData.email) {
      addToast('Vui lòng nhập email trước khi xác thực', 'error');
      return;
    }

    setIsSendingCode(true);
    try {
      const accessToken = useAuthStore.getState().accessToken;
      const response = await fetch('/api/auth/verify-email/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ email: formData.email })
      });

      const result = await response.json();
      if (result.success) {
        addToast('Mã xác thực đã được gửi đến email của bạn', 'success');
        setShowVerificationInput(true);
        setCountdown(60);
      } else {
        addToast(result.error || 'Không thể gửi mã xác thực', 'error');
      }
    } catch (error) {
      addToast('Lỗi kết nối. Vui lòng thử lại.', 'error');
    } finally {
      setIsSendingCode(false);
    }
  };

  const handleVerifyCode = async () => {
    if (verificationCode.length !== 6) {
      addToast('Mã xác thực phải có 6 chữ số', 'error');
      return;
    }

    setIsVerifyingCode(true);
    try {
      const accessToken = useAuthStore.getState().accessToken;
      const response = await fetch('/api/auth/verify-email/confirm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ email: formData.email, code: verificationCode })
      });

      const result = await response.json();
      if (result.success) {
        addToast('Xác thực email thành công!', 'success');
        setShowVerificationInput(false);
        // Update user store
        if (user) {
          useUserStore.getState().setUser({ ...user, is_email_verified: true });
        }
      } else {
        addToast(result.error || 'Mã xác thực không chính xác', 'error');
      }
    } catch (error) {
      addToast('Lỗi kết nối. Vui lòng thử lại.', 'error');
    } finally {
      setIsVerifyingCode(false);
    }
  };

  // Form data state
  const [formData, setFormData] = useState<UpdateBrokerData>({
    full_name: '',
    email: '',
    province: '',
    ward: '',
    address: '',
    bio: '',
  });

  // Initialize form data when user is loaded
  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name || '',
        email: user.email || '',
        province: user.province || '',
        ward: user.ward || '',
        address: user.address || '',
        bio: user.bio || '',
      });
    }
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      addToast('Chỉ chấp nhận file ảnh (JPG, PNG, GIF)', 'error');
      return;
    }
    if (file.size > 3 * 1024 * 1024) { // 3MB
      addToast('Kích thước file không được vượt quá 3MB', 'error');
      return;
    }

    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.phone) return;

    setIsSubmitting(true);

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
        formData.province !== (user.province || '') ||
        formData.ward !== (user.ward || '') ||
        formData.address !== (user.address || '') ||
        formData.bio !== (user.bio || '')
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
          addToast('Cập nhật thông tin thành công!', 'success');
        } else {
          addToast(result.error || 'Có lỗi xảy ra khi cập nhật thông tin', 'error');
        }
      } else {
        addToast('Không có thay đổi nào để lưu', 'info');
      }
    } catch (error) {
      console.error('🔹 [PROFILE] Update profile error:', error);
      addToast('Lỗi kết nối. Vui lòng thử lại.', 'error');
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
              <div className="flex items-center justify-between">
                <label htmlFor="emailAddress" className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Email
                </label>
                {user.email && (
                  user.is_email_verified ? (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 uppercase tracking-wider bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-full border border-emerald-100 dark:border-emerald-800">
                      <ShieldCheck className="size-3" /> Đã xác thực
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSendCode}
                      disabled={isSendingCode || countdown > 0}
                      className="text-[10px] font-bold text-amber-600 hover:text-amber-700 uppercase tracking-wider flex items-center gap-1 bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded-full border border-amber-100 dark:border-amber-800 transition-colors disabled:opacity-50"
                    >
                      {isSendingCode ? <Loader2 className="size-3 animate-spin" /> : <Mail className="size-3" />}
                      {countdown > 0 ? `Gửi lại sau ${countdown}s` : 'Xác thực ngay'}
                    </button>
                  )
                )}
              </div>
              <div className="relative">
                <input
                  id="emailAddress"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Nhập email của bạn"
                  className={`w-full rounded-md border-slate-300 dark:border-slate-700 dark:bg-slate-800 text-slate-900 dark:text-white focus:border-emerald-500 focus:ring-emerald-500 transition-all text-sm h-10 px-3 shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${user.is_email_verified ? 'pr-10' : ''}`}
                />
                {user.is_email_verified && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500">
                    <CheckCircle2 className="size-4" />
                  </div>
                )}
              </div>

              {showVerificationInput && !user.is_email_verified && (
                <div className="mt-3 p-4 bg-slate-50 dark:bg-slate-800/80 rounded-lg border border-slate-200 dark:border-slate-700 animate-in fade-in slide-in-from-top-2 md:-mr-[60px] relative z-10">
                  <p className="text-xs text-slate-600 dark:text-slate-400 mb-3">
                    Nhập mã 6 chữ số đã được gửi đến <strong>{formData.email}</strong>
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      maxLength={6}
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                      placeholder="000000"
                      className="flex-1 rounded-md border-slate-300 dark:border-slate-700 dark:bg-slate-900 text-slate-900 dark:text-white focus:border-emerald-500 focus:ring-emerald-500 text-center tracking-[0.5em] font-bold h-10 px-3 shadow-sm focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleVerifyCode}
                      disabled={isVerifyingCode || verificationCode.length !== 6}
                      className="px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {isVerifyingCode ? <Loader2 className="size-4 animate-spin" /> : <ShieldCheck className="size-4" />}
                      Xác nhận
                    </button>
                  </div>
                  {countdown > 0 ? (
                    <p className="text-[10px] text-slate-500 mt-2">
                      Bạn có thể gửi lại mã sau {countdown} giây
                    </p>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSendCode}
                      className="text-[10px] text-emerald-600 hover:underline mt-2 font-semibold"
                    >
                      Gửi lại mã
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                Khu vực
              </label>
              <LocationSelector
                selectedProvince={formData.province || ''}
                onProvinceChange={(value) => setFormData(prev => ({ ...prev, province: value, ward: '' }))}
                selectedWard={formData.ward || ''}
                onWardChange={(value) => setFormData(prev => ({ ...prev, ward: value }))}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="address" className="block text-base font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-600" />
                Địa chỉ
              </label>
              <input
                id="address"
                name="address"
                type="text"
                value={formData.address || ''}
                onChange={handleInputChange}
                placeholder="Số nhà, đường..."
                className="w-full rounded-md border-slate-300 dark:border-slate-700 dark:bg-slate-800 text-slate-900 dark:text-white focus:border-emerald-500 focus:ring-emerald-500 transition-all text-sm h-10 px-3 shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label htmlFor="bio" className="block text-base font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-600" />
                Giới thiệu bản thân
              </label>
              <textarea
                id="bio"
                name="bio"
                value={formData.bio || ''}
                onChange={handleInputChange}
                placeholder="Giới thiệu ngắn về bản thân, kinh nghiệm..."
                rows={4}
                className="w-full rounded-md border-slate-300 dark:border-slate-700 dark:bg-slate-800 text-slate-900 dark:text-white focus:border-emerald-500 focus:ring-emerald-500 transition-all text-sm p-3 shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 resize-none"
              />
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
