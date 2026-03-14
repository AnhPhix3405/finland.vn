"use client";

import { Lock, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { useState } from "react";

export default function ChangePasswordSection() {
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="p-6 border-b border-slate-100 dark:border-slate-800">
        <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">Đổi mật khẩu</h1>
        <p className="text-sm text-slate-500 mt-1">Cập nhật mật khẩu thường xuyên để tăng tính bảo mật cho tài khoản.</p>
      </div>

      <div className="p-6 md:p-8">
        <div className="max-w-md mx-auto">
          <div className="mb-8 p-4 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/30 rounded-xl flex gap-4">
            <div className="shrink-0 p-2 bg-emerald-600 text-white rounded-lg h-fit shadow-md shadow-emerald-500/20">
              <ShieldCheck className="size-5" />
            </div>
            <div>
              <h5 className="text-sm font-bold text-emerald-700 dark:text-emerald-400">Mật khẩu mạnh</h5>
              <p className="text-xs text-emerald-600/80 mt-1 leading-relaxed">
                Nên sử dụng từ 8 ký tự trở lên, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt (!@#...).
              </p>
            </div>
          </div>

          <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Mật khẩu hiện tại</label>
              <div className="relative">
                <input
                  type={showCurrent ? "text" : "password"}
                  placeholder="Nhập mật khẩu cũ…"
                  className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:border-emerald-500 focus:ring-emerald-500 transition-all outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showCurrent ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Mật khẩu mới</label>
              <div className="relative">
                <input
                  type={showNew ? "text" : "password"}
                  placeholder="Chọn mật khẩu mới…"
                  className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:border-emerald-500 focus:ring-emerald-500 transition-all outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showNew ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Xác nhận mật khẩu mới</label>
              <div className="relative">
                <input
                  type={showConfirm ? "text" : "password"}
                  placeholder="Nhập lại mật khẩu mới…"
                  className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:border-emerald-500 focus:ring-emerald-500 transition-all outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 mt-4 bg-emerald-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-emerald-500/20 hover:bg-emerald-700 transition-all active:scale-[0.98]"
            >
              Cập nhật mật khẩu
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
