"use client";

import { Eye, EyeOff, Loader2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { loginBroker } from "@/src/app/modules/auth/auth.service";

export function LoginForm() {
  const router = useRouter();

  const [showPassword, setShowPassword] = useState(false);
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const result = await loginBroker(phone, password);

      if (result.success) {
        // Auth service already updated stores
        router.push("/");
        router.refresh();
      } else {
        setError(result.error || "Số điện thoại hoặc mật khẩu không chính xác");
      }
    } catch (err) {
      setError("Đã xảy ra lỗi khi đăng nhập. Vui lòng thử lại.");
      console.error('Login form error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md w-full bg-white dark:bg-slate-900 p-8 shadow-sm border border-slate-200 dark:border-slate-800 rounded-sm">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
          Đăng nhập
        </h1>
        <p className="mt-2 text-slate-500 dark:text-slate-400 text-sm">
          Chào mừng bạn trở lại với finland.vn
        </p>
      </div>

      {error && (
        <div className="mb-6 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm rounded-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label
            htmlFor="phone"
            className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2"
          >
            Số điện thoại
          </label>
          <input
            type="tel"
            id="phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Nhập số điện thoại của bạn"
            required
            disabled={isLoading}
            className="block w-full px-4 py-3 border border-slate-300 rounded-sm dark:border-slate-700 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 placeholder-slate-400 dark:placeholder-slate-500 disabled:opacity-50"
          />
        </div>
        <div>
          <div className="flex items-center justify-between mb-2">
            <label
              htmlFor="password"
              className="block text-sm font-semibold text-slate-700 dark:text-slate-300"
            >
              Mật khẩu
            </label>
            <Link
              href="#"
              className="text-sm font-medium text-emerald-600 hover:underline"
            >
              Quên mật khẩu?
            </Link>
          </div>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Nhập mật khẩu"
              required
              disabled={isLoading}
              className="block w-full px-4 py-3 border border-slate-300 rounded-sm dark:border-slate-700 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 placeholder-slate-400 dark:placeholder-slate-500 disabled:opacity-50"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              disabled={isLoading}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 disabled:opacity-50"
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
        <div className="flex items-center">
          <input
            type="checkbox"
            id="remember-me"
            className="h-4 w-4 rounded-sm border-slate-300 text-emerald-600 focus:ring-emerald-500"
          />
          <label
            htmlFor="remember-me"
            className="ml-2 block text-sm text-slate-600 dark:text-slate-400"
          >
            Ghi nhớ đăng nhập
          </label>
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-sm shadow-sm text-base font-bold text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all disabled:opacity-70"
        >
          {isLoading ? (
            <>
              <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" />
              Đang xử lý...
            </>
          ) : "Đăng nhập"}
        </button>
      </form>
      <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800 text-center">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Chưa có tài khoản?
          <Link
            href="/dang-ky"
            className="font-bold text-emerald-600 hover:underline ml-1"
          >
            Đăng ký ngay
          </Link>
        </p>
      </div>
    </div>
  );
}
