"use client";

import { Loader2, ShieldCheck, Mail, ArrowLeft, Send, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useNotificationStore } from "@/src/store/notificationStore";

export function ForgotPasswordForm() {
  const router = useRouter();
  const addToast = useNotificationStore((state) => state.addToast);
  
  const [email, setEmail] = useState("");
  const [step, setStep] = useState<"enter-email" | "verify" | "reset-password">("enter-email");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [resetToken, setResetToken] = useState("");
  const [countdown, setCountdown] = useState(0);

  // Countdown timer for resend
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleNextStep = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      addToast("Vui lòng nhập email", "error");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/verify-email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const result = await response.json();
      if (result.success) {
        setStep("verify");
        setCountdown(60);
        addToast("Mã xác thực đã được gửi đến email của bạn", "success");
      } else {
        addToast(result.error || "Có lỗi xảy ra khi gửi mã", "error");
      }
    } catch (error) {
      addToast("Lỗi kết nối. Vui lòng thử lại.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendCode = async () => {
    setIsSendingCode(true);
    try {
      const response = await fetch('/api/auth/verify-email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const result = await response.json();
      if (result.success) {
        addToast('Mã xác thực mới đã được gửi', 'success');
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
      const response = await fetch('/api/auth/verify-email/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: verificationCode })
      });

      const result = await response.json();
      if (result.success) {
        addToast('Xác thực email thành công! Vui lòng đặt lại mật khẩu mới.', 'success');
        setResetToken(result.resetToken);
        setStep("reset-password");
      } else {
        addToast(result.error || 'Mã xác thực không chính xác', 'error');
      }
    } catch (error) {
      addToast('Lỗi kết nối. Vui lòng thử lại.', 'error');
    } finally {
      setIsVerifyingCode(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      addToast("Mật khẩu xác nhận không khớp", "error");
      return;
    }
    if (newPassword.length < 6) {
      addToast("Mật khẩu phải có ít nhất 6 ký tự", "error");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, newPassword, resetToken })
      });

      const result = await response.json();
      if (result.success) {
        addToast("Đổi mật khẩu thành công! Vui lòng đăng nhập lại.", "success");
        router.push("/dang-nhap");
      } else {
        addToast(result.error || "Không thể đổi mật khẩu", "error");
      }
    } catch (error) {
      addToast("Lỗi kết nối. Vui lòng thử lại.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md w-full bg-white dark:bg-slate-900 p-8 shadow-sm border border-slate-200 dark:border-slate-800 rounded-lg">
      <div className="mb-8">
        <Link href="/dang-nhap" className="inline-flex items-center text-sm text-slate-500 hover:text-emerald-600 transition-colors mb-6">
          <ArrowLeft className="size-4 mr-2" />
          Quay lại đăng nhập
        </Link>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Quên mật khẩu?
        </h1>
        <p className="mt-2 text-slate-500 dark:text-slate-400 text-sm">
          {step === "enter-email" 
            ? "Nhập email của bạn để nhận mã xác thực lấy lại mật khẩu." 
            : step === "verify" 
              ? `Mã xác thực đã được gửi đến ${email}`
              : "Vui lòng nhập mật khẩu mới cho tài khoản của bạn."}
        </p>
      </div>

      {step === "enter-email" ? (
        <form onSubmit={handleNextStep} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Email đăng ký
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Nhập email của bạn"
              required
              disabled={isLoading}
              className="block w-full px-4 py-3 border border-slate-300 rounded-md dark:border-slate-700 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 placeholder-slate-400 dark:placeholder-slate-500 disabled:opacity-50"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-sm text-base font-bold text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all disabled:opacity-70"
          >
            {isLoading ? (
              <Loader2 className="animate-spin size-5 mr-2" />
            ) : (
              <Send className="size-4 mr-2" />
            )}
            {isLoading ? "Đang xử lý..." : "Tiếp tục"}
          </button>
        </form>
      ) : step === "verify" ? (
        <div className="space-y-6">
          <div className="p-4 bg-slate-50 dark:bg-slate-800/80 rounded-lg border border-slate-200 dark:border-slate-700 animate-in fade-in slide-in-from-top-2">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4">Nhập mã xác thực</h3>
            
            <div className="flex flex-col gap-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  maxLength={6}
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  className="flex-1 rounded-md border-slate-300 dark:border-slate-700 dark:bg-slate-900 text-slate-900 dark:text-white focus:border-emerald-500 focus:ring-emerald-500 text-center tracking-[0.5em] font-bold h-12 px-3 shadow-sm focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleVerifyCode}
                  disabled={isVerifyingCode || verificationCode.length !== 6}
                  className="px-6 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-sm font-bold transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {isVerifyingCode ? <Loader2 className="size-4 animate-spin" /> : <ShieldCheck className="size-4" />}
                  Xác nhận
                </button>
              </div>

              <div className="flex items-center justify-between">
                <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                  {countdown > 0 ? `Gửi lại sau ${countdown}s` : "Chưa nhận được mã?"}
                </p>
                {countdown === 0 && (
                  <button
                    type="button"
                    onClick={handleSendCode}
                    disabled={isSendingCode}
                    className="text-xs font-bold text-emerald-600 hover:underline disabled:opacity-50"
                  >
                    {isSendingCode ? "Đang gửi..." : "Gửi lại ngay"}
                  </button>
                )}
              </div>
            </div>
          </div>
          
          <button
            type="button"
            onClick={() => {
              setStep("enter-email");
              setVerificationCode("");
            }}
            className="w-full py-2 text-sm text-slate-500 hover:text-slate-700 transition-colors"
          >
            Thay đổi email?
          </button>
        </div>
      ) : (
        <form onSubmit={handleResetPassword} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="newPassword" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Mật khẩu mới
              </label>
              <input
                type="password"
                id="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Nhập mật khẩu mới"
                required
                disabled={isLoading}
                className="block w-full px-4 py-3 border border-slate-300 rounded-md dark:border-slate-700 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 h-12 px-3 shadow-sm"
              />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Xác nhận mật khẩu mới
              </label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Nhập lại mật khẩu mới"
                required
                disabled={isLoading}
                className="block w-full px-4 py-3 border border-slate-300 rounded-md dark:border-slate-700 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 h-12 px-3 shadow-sm"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-sm text-base font-bold text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all disabled:opacity-70 h-12"
          >
            {isLoading ? (
              <Loader2 className="animate-spin size-5 mr-2" />
            ) : (
              <ShieldCheck className="size-5 mr-2" />
            )}
            {isLoading ? "Đang xử lý..." : "Đổi mật khẩu"}
          </button>
        </form>
      )}
    </div>
  );
}
