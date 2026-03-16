"use client";

import { Camera, Eye, EyeOff, Loader2 } from "lucide-react";
import Link from "next/link";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { registerBroker } from "@/src/app/modules/auth/auth.service";
import { uploadBrokerAvatar } from "@/src/app/modules/upload.service";
import { useNotificationStore } from "@/src/store/notificationStore";
import LocationSelector from "../feature/LocationSelector";

interface FormErrors {
  phone?: string;
  full_name?: string;
  province?: string;
  ward?: string;
  referrer_phone?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

export function RegisterForm() {
  const router = useRouter();
  const addToast = useNotificationStore((state) => state.addToast);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [selectedAvatar, setSelectedAvatar] = useState<File | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    phone: "",
    full_name: "",
    province: "",
    ward: "", // Map ward to district from form
    referrer_phone: "",
    email: "",
    password: "",
    confirmPassword: ""
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError("Chỉ chấp nhận file ảnh (JPG, PNG, GIF)");
      return;
    }

    setSelectedAvatar(file);
    const url = URL.createObjectURL(file);
    setAvatarPreview(url);
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    const phoneRegex = /^0[0-9]{9}$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!formData.phone.trim()) {
      newErrors.phone = "Số điện thoại là bắt buộc";
    } else if (!phoneRegex.test(formData.phone)) {
      newErrors.phone = "Số điện thoại phải có 10 chữ số và bắt đầu bằng số 0";
    }

    if (!formData.full_name.trim()) {
      newErrors.full_name = "Họ tên là bắt buộc";
    } else if (formData.full_name.trim().length < 2) {
      newErrors.full_name = "Họ tên phải có ít nhất 2 ký tự";
    } else if (formData.full_name.trim().length > 100) {
      newErrors.full_name = "Họ tên không được quá 100 ký tự";
    }

    if (!formData.province) {
      newErrors.province = "Vui lòng chọn Tỉnh/Thành phố";
    }

    if (!formData.ward) {
      newErrors.ward = "Vui lòng chọn Phường/Xã";
    }

    if (formData.referrer_phone.trim()) {
      if (!phoneRegex.test(formData.referrer_phone)) {
        newErrors.referrer_phone = "Số điện thoại người giới thiệu không hợp lệ";
      }
    }

    if (formData.email.trim()) {
      if (!emailRegex.test(formData.email)) {
        newErrors.email = "Email không hợp lệ";
      }
    }

    if (!formData.password) {
      newErrors.password = "Mật khẩu là bắt buộc";
    } else if (formData.password.length < 6) {
      newErrors.password = "Mật khẩu phải có ít nhất 6 ký tự";
    } else if (formData.password.length > 50) {
      newErrors.password = "Mật khẩu không được quá 50 ký tự";
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Vui lòng xác nhận mật khẩu";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Mật khẩu xác nhận không khớp";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const newErrors: FormErrors = {};
    const phoneRegex = /^0[0-9]{9}$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!formData.phone.trim()) {
      newErrors.phone = "Số điện thoại là bắt buộc";
    } else if (!phoneRegex.test(formData.phone)) {
      newErrors.phone = "Số điện thoại phải có 10 chữ số và bắt đầu bằng số 0";
    }

    if (!formData.full_name.trim()) {
      newErrors.full_name = "Họ tên là bắt buộc";
    } else if (formData.full_name.trim().length < 2) {
      newErrors.full_name = "Họ tên phải có ít nhất 2 ký tự";
    } else if (formData.full_name.trim().length > 100) {
      newErrors.full_name = "Họ tên không được quá 100 ký tự";
    }

    if (!formData.province) {
      newErrors.province = "Vui lòng chọn Tỉnh/Thành phố";
    }

    if (!formData.ward) {
      newErrors.ward = "Vui lòng chọn Phường/Xã";
    }

    if (formData.referrer_phone.trim()) {
      if (!phoneRegex.test(formData.referrer_phone)) {
        newErrors.referrer_phone = "Số điện thoại người giới thiệu không hợp lệ";
      }
    }

    if (formData.email.trim()) {
      if (!emailRegex.test(formData.email)) {
        newErrors.email = "Email không hợp lệ";
      }
    }

    if (!formData.password) {
      newErrors.password = "Mật khẩu là bắt buộc";
    } else if (formData.password.length < 6) {
      newErrors.password = "Mật khẩu phải có ít nhất 6 ký tự";
    } else if (formData.password.length > 50) {
      newErrors.password = "Mật khẩu không được quá 50 ký tự";
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Vui lòng xác nhận mật khẩu";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Mật khẩu xác nhận không khớp";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setIsLoading(false);
      const idMap: Record<string, string> = {
        phone: 'phone',
        full_name: 'full_name',
        province: 'projectCity',
        ward: 'projectDistrict',
        referrer_phone: 'referrer_phone',
        email: 'email',
        password: 'password',
        confirmPassword: 'confirmPassword'
      };
      const firstErrorKey = Object.keys(newErrors).find(key => newErrors[key as keyof FormErrors]);
      if (firstErrorKey && idMap[firstErrorKey]) {
        const element = document.getElementById(idMap[firstErrorKey]);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
      return;
    }

    setErrors({});

    try {
      const { confirmPassword, ...registerData } = formData;
      console.log('🔹 [REGISTER] Starting registration with data:', { ...registerData, password: '[REDACTED]' });
      
      const result = await registerBroker(registerData);
      console.log('🔹 [REGISTER] Registration result:', result);

      if (result.success) {
        console.log('🔹 [REGISTER] Registration successful, user data:', result.data);
        
        // Upload avatar if selected after registration (needs separate login to associate with user)
        if (selectedAvatar && result.data?.id) {
          console.log('🔹 [REGISTER] Upload avatar after registration for broker id:', result.data.id);
          try {
            await uploadBrokerAvatar(selectedAvatar, result.data.id);
          } catch (avatarError) {
            console.error('🔹 [REGISTER] Avatar upload error:', avatarError);
          }
        }
        
        addToast("Đăng ký thành công! Vui lòng đăng nhập.", "success");
        router.push("/dang-nhap");
        router.refresh();
      } else {
        setError(result.error || "Đăng ký không thành công. Vui lòng kiểm tra lại thông tin.");
      }
    } catch (err) {
      setError("Đã xảy ra lỗi khi đăng ký. Vui lòng thử lại.");
      console.error('🔹 [REGISTER] Registration form error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md w-full bg-white dark:bg-slate-900 p-8 shadow-sm border border-slate-200 dark:border-slate-800 rounded-none">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Đăng ký tài khoản
        </h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Tham gia cộng đồng bất động sản finland.vn
        </p>
      </div>

      {error && (
        <div className="mb-6 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm rounded-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Profile Picture Upload */}
        <div>
          <label
            htmlFor="profile-pic"
            className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
          >
            Ảnh đại diện <span className="text-slate-400 font-normal">(không bắt buộc)</span>
          </label>
          <div className="mt-1 flex items-center gap-4">
            <div 
              className="size-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-dashed border-slate-300 dark:border-slate-700 overflow-hidden cursor-pointer"
              onClick={() => avatarInputRef.current?.click()}
            >
              {avatarPreview ? (
                <img src={avatarPreview} alt="Preview" className="size-full object-cover" />
              ) : (
                <Camera className="text-slate-400 h-6 w-6" />
              )}
            </div>
            <input
              type="file"
              id="profile-pic"
              ref={avatarInputRef}
              accept="image/*"
              onChange={handleAvatarChange}
              disabled={isLoading}
              className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-none file:border-0 file:text-xs file:font-semibold file:bg-emerald-600 file:text-white hover:file:opacity-90 cursor-pointer disabled:opacity-50"
            />
          </div>
        </div>

        {/* Phone Number */}
        <div>
          <label
            htmlFor="phone"
            className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
          >
            Số điện thoại <span className="text-red-500 font-bold">*</span>
          </label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="Nhập số điện thoại (tài khoản đăng nhập)"
            required
            disabled={isLoading}
            className={`block w-full px-3 py-2 border rounded-none bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-sm disabled:opacity-50 ${errors.phone ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-slate-300 dark:border-slate-700'}`}
          />
          {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
        </div>

        {/* Full Name */}
        <div>
          <label
            htmlFor="full_name"
            className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
          >
            Họ tên <span className="text-red-500 font-bold">*</span>
          </label>
          <input
            type="text"
            id="full_name"
            name="full_name"
            value={formData.full_name}
            onChange={handleChange}
            placeholder="Nhập họ và tên"
            required
            disabled={isLoading}
            className={`block w-full px-3 py-2 border rounded-none bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-sm disabled:opacity-50 ${errors.full_name ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-slate-300 dark:border-slate-700'}`}
          />
          {errors.full_name && <p className="text-red-500 text-xs mt-1">{errors.full_name}</p>}
        </div>

        <LocationSelector
          selectedProvince={formData.province}
          onProvinceChange={(value) => setFormData(prev => ({ ...prev, province: value, ward: '' }))}
          selectedWard={formData.ward}
          onWardChange={(value) => setFormData(prev => ({ ...prev, ward: value }))}
        />
        {(errors.province || errors.ward) && (
          <div className="text-red-500 text-xs mt-1">
            {errors.province || errors.ward}
          </div>
        )}

        {/* Referral Phone Number */}
        <div>
          <label
            htmlFor="referrer_phone"
            className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
          >
            Số điện thoại người giới thiệu <span className="text-slate-400 font-normal">(không bắt buộc)</span>
          </label>
          <input
            type="tel"
            id="referrer_phone"
            name="referrer_phone"
            value={formData.referrer_phone}
            onChange={handleChange}
            placeholder="Nhập số điện thoại người giới thiệu"
            disabled={isLoading}
            className={`block w-full px-3 py-2 border rounded-none bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-sm disabled:opacity-50 ${errors.referrer_phone ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-slate-300 dark:border-slate-700'}`}
          />
          {errors.referrer_phone && <p className="text-red-500 text-xs mt-1">{errors.referrer_phone}</p>}
        </div>

        {/* Email */}
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
          >
            Email <span className="text-slate-400 font-normal">(không bắt buộc)</span>
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="example@gmail.com"
            disabled={isLoading}
            className={`block w-full px-3 py-2 border rounded-none bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-sm disabled:opacity-50 ${errors.email ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-slate-300 dark:border-slate-700'}`}
          />
          {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
        </div>

        {/* Mật khẩu */}
        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
          >
            Mật khẩu <span className="text-red-500 font-bold">*</span>
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              required
              disabled={isLoading}
              className={`block w-full px-3 py-2 border rounded-none bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-sm disabled:opacity-50 ${errors.password ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-slate-300 dark:border-slate-700'}`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              disabled={isLoading}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 disabled:opacity-50"
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>
          {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
        </div>

        {/* Xác nhận mật khẩu */}
        <div>
          <label
            htmlFor="confirmPassword"
            className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
          >
            Xác nhận mật khẩu <span className="text-red-500 font-bold">*</span>
          </label>
          <div className="relative">
            <input
              type={showConfirmPassword ? "text" : "password"}
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="••••••••"
              required
              disabled={isLoading}
              className={`block w-full px-3 py-2 border rounded-none bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-sm disabled:opacity-50 ${errors.confirmPassword ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-slate-300 dark:border-slate-700'}`}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              disabled={isLoading}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 disabled:opacity-50"
            >
              {showConfirmPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>
          {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>}
        </div>

        {/* Điều khoản */}
        <div className="flex items-start gap-2 py-2">
          <input
            type="checkbox"
            id="terms"
            required
            disabled={isLoading}
            className="mt-1 h-4 w-4 rounded-none border-slate-300 dark:border-slate-700 text-emerald-600 focus:ring-emerald-500 disabled:opacity-50"
          />
          <label
            htmlFor="terms"
            className="text-xs text-slate-600 dark:text-slate-400"
          >
            Tôi đồng ý với{" "}
            <Link href="#" className="text-emerald-600 hover:underline">
              Điều khoản dịch vụ
            </Link>{" "}
            và{" "}
            <Link href="#" className="text-emerald-600 hover:underline">
              Chính sách bảo mật
            </Link>
            .
          </label>
        </div>

        {/* Nút Đăng ký */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex justify-center items-center px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-sm transition-colors disabled:opacity-70"
        >
          {isLoading ? (
            <>
              <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" />
              Đang xử lý...
            </>
          ) : "Đăng ký"}
        </button>

        {/* Liên kết Đăng nhập */}
        <div className="text-center pt-4">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Đã có tài khoản?{" "}
            <Link
              href="/dang-nhap"
              className="text-emerald-600 font-semibold hover:underline"
            >
              Đăng nhập ngay
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
}
